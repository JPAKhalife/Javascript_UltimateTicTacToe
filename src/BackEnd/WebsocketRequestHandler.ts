import Redis from 'ioredis';
import Lobby, { LobbyData } from './Database/Lobby';
import Player from './Database/Player';
import {
    newConnection,
    playerRegistered,
    getPlayerID,
    removeConnection,
    getWebsocketObject,
} from './Database/Connections';
import { URL } from 'url';
import { LobbyCreateRequest, LobbySearchRequest, MESSAGE_TYPES, RegisterRequest } from './MessageSchema';
import { createSession, validateSession, setSessionExpiry, refreshSession } from './Utils/SessionManager';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './Contants';
const { v4: uuidv4 } = require('uuid');


type ReturnMessage = Record<string, any>

//This map is for connectionID to ws object.

/**
 * @function handleWebsocketRequest
 * @description Handles WebSocket connections and requests
 * @param ws WebSocket object
 * @param req HTTP request object
 * @param redis Redis client for regular operations (non-subscriber)
 */
export async function handleWebsocketRequest(ws: any, req: any, redis: Redis) {
    console.log("WebSocket connection established from client");

    // Connection management is handled through session IDs

    // Assign a unique ID to the websocket connection
    if (!ws.id) {
        ws.id = uuidv4();
        newConnection(redis, ws, ws.id);
        console.log(`Assigning connection ID: ${ws.id}`);
    }
    // Handle cleanup when the connection is closed
    ws.on('close', () => {
        console.log(`WebSocket connection ${ws.id} closed`);
        removeConnection(redis, ws.id);
    });

    // Handle incoming messages from the client
    ws.on('message', async (message: any) => {
        let returnMessage: ReturnMessage = {};
        let messageID: string | null = null;
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message from client:', data);
            messageID = data.messageID;
            
            // Check for session ID in authenticated requests
            if (data.sessionID && data.type !== MESSAGE_TYPES.REGISTER_PLAYER) {
                // Validate the session
                const sessionData = await validateSession(redis, data.sessionID);
                if (sessionData && sessionData.connectionID === ws.id) {
                    // Session is valid and belongs to this connection
                    // Refresh the session (remove expiry if it has one)
                    await refreshSession(redis, data.sessionID);
                    
                    // Handle message types for authenticated users
                    if (data.type === MESSAGE_TYPES.CREATE_LOBBY) {
                        returnMessage = await handleCreateLobby(ws, redis, data, sessionData.playerID);
                    } else if (data.type === MESSAGE_TYPES.SEARCH_LOBBY) {
                        returnMessage = await handleSearchLobbies(ws, redis, data, sessionData.playerID);
                    } else {
                        returnMessage = {
                            messageID: data.messageID,
                            message: 'Message received',
                            data
                        };
                    }
                } else {
                    // Invalid session
                    returnMessage = {
                        success: false,
                        error: ERROR_MESSAGES.TOKEN_INVALID
                    };
                }
            } else {
                // Handle message types for unauthenticated users
                if (data.type === MESSAGE_TYPES.REGISTER_PLAYER) {
                    returnMessage = await handleRegisterPlayer(ws, redis, data);
                } else {
                    returnMessage = {
                        success: false,
                        error: ERROR_MESSAGES.AUTHENTICATION_REQUIRED
                    };
                }
            }

        } catch (error) {
            console.error('Error processing message:', error);
            returnMessage = {
                success: false,
                error: ERROR_MESSAGES.INTERNAL_ERROR
            };
        }
        //Append the MessageID back to the return message before responding.
        if (messageID) {
            returnMessage['messageID'] = messageID;
        }

        // Log the response being sent back to the client
        console.log('Sending response to client:', returnMessage);

        // Stringify and send the response
        const responseString = JSON.stringify(returnMessage);
        console.log('Response size:', responseString.length, 'bytes');

        try {
            ws.send(responseString);
            console.log('Response sent successfully');
        } catch (error) {
            console.error('Error sending response to client:', error);
        }
    });
}

/**
 * @function handleSearchLobbies
 * @description Handles the searchLobbies message from the client
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Search request data
 * @param playerID Player ID from the validated session
 * @returns Promise resolving to response object
 */
async function handleSearchLobbies(ws: any, redis: Redis, data: any, playerID: string): Promise<object> {
    try {
        const params = data.parameters || {};
        
        // Call getLobbies with the parameters
        const lobbySearchResults = await Lobby.getFilteredLobbies(
            redis,
            {
                playerNum: params.playerNum,
                levelSize: params.levelSize,
                gridSize: params.gridSize,
                playersJoined: params.joinedPlayers,
                creator: params.creator,
                lobbyState: params.lobbyState,
                allowSpectators: params.allowSpectators,
            },
            params.maxListLength,
            params.searchListLength
        );
        console.log(`Found ${lobbySearchResults.length} matching lobbies`);

        // Log the first lobby for debugging if any exist
        if (lobbySearchResults.length > 0) {
            console.log('First lobby sample:', JSON.stringify(lobbySearchResults[0]).substring(0, 200) + '...');
        }

        // Convert each lobby to its JSON representation and await all promises
        const lobbies = await Promise.all(lobbySearchResults.map(lobby => lobby.lobbySummaryJson(redis)));

        // Log the size of the lobbies array
        console.log('Lobbies array size:', JSON.stringify(lobbies).length, 'bytes');
        return {
            success: true,
            lobbies: lobbies,
            count: lobbies.length
        };
    } catch (error) {
        // Provide more detailed error information
        console.error('Error searching lobbies:', error instanceof Error ? error.stack : error);

        return {
            success: false,
            error: ERROR_MESSAGES.INTERNAL_ERROR
        };
    }
}


/**
 * @function handleCreateLobby
 * @description Handles the createLobby message from the client
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Lobby creation request data
 * @param playerID Player ID from the validated session
 * @returns Promise resolving to response object
 */
async function handleCreateLobby(ws: any, redis: Redis, data: any, playerID: string): Promise<object> {
    try {
        const params = data.parameters || {};
        const lobbyData = params.lobbyData || {};
        
        // Cast lobbyData to a LobbyData object
        const lobbyDataObj: LobbyData = {
            playerNum: lobbyData.playerNum,
            levelSize: lobbyData.levelSize,
            gridSize: lobbyData.gridSize,
            allowSpectators: lobbyData.allowSpectators,
        }
        
        console.log(`Creating lobby ${params.lobbyID} with data:`, lobbyDataObj, playerID);

        // Call RedisManager to create the lobby
        let newLobby = await Lobby.createLobby(redis, params.lobbyID, lobbyDataObj, playerID);
        console.log(`Lobby ${params.lobbyID} created successfully`);

        // Send response back to client
        return {
            success: true,
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            lobby: await newLobby.lobbySummaryJson(redis)
        };
    } catch (error) {
        console.error('Error creating lobby:', error);
        return {
            success: false,
            error: ERROR_MESSAGES.INTERNAL_ERROR
        };
    }
}

/**
 * @function handleRegisterPlayer
 * @description Handles the registration of a player
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Player registration request data
 * @returns Promise resolving to response object
 */
async function handleRegisterPlayer(ws: any, redis: Redis, data: any): Promise<object> {
    const params = data.parameters || {};
    const username = params.username;
    
    if (!username) {
        return {
            success: false,
            message: ERROR_MESSAGES.INVALID_USERNAME,
        };
    }
    
    console.log("Checking if player " + username + " exists.");

    //Check if the user is already registered.
    if ((await getPlayerID(redis, ws.id))) {
        return {
            success: false,
            message: ERROR_MESSAGES.CONCURRENT_LOGIN,
        }
    }

    try {
        let newPlayer = await Player.createPlayer(redis, username);
        if (newPlayer != null && newPlayer != undefined) {
            const playerID = newPlayer.getPlayerID();
            
            // Register the player with the connection
            playerRegistered(redis, ws.id, playerID);
            
            // Create a session for the player
            const sessionID = await createSession(redis, playerID, ws.id);
            
            return {
                success: true,
                message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
                sessionID: sessionID
            }
        }
    } catch (error) {
        return {
            success: false,
            message: ERROR_MESSAGES.REGISTRATION_FAILED,
        }
    }
    return {
        success: true,
        message: ERROR_MESSAGES.USERNAME_EXISTS,
    }
}
