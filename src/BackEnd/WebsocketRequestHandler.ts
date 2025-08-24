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
import { LobbyCreateRequest, LobbySearchRequest, MESSAGE_TYPES, RegisterRequest, ReconnectRequest } from './MessageSchema';
import {
    createSession,
    validateSession,
    setSessionExpiry,
    refreshSession,
    updateSessionConnectionID,
    isConnectionActive,
    getSessionConnectionID
} from './Utils/SessionManager';
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
    console.log(`[WebSocket] Connection established from client, IP: ${req.connection.remoteAddress}`);

    // Assign a unique ID to the websocket connection
    if (!ws.id) {
        ws.id = uuidv4();
        newConnection(redis, ws, ws.id);
        console.log(`[WebSocket] Assigning connection ID: ${ws.id}`);
    }
    // Handle cleanup when the connection is closed
    ws.on('close', () => {
        console.log(`[WebSocket] Connection ${ws.id} closed`);
        removeConnection(redis, ws.id);
    });

    // Handle incoming messages from the client
    ws.on('message', async (message: any) => {
        let returnMessage: ReturnMessage = {};
        let messageID: string | null = null;
        try {
            const data = JSON.parse(message.toString());
            console.log(`[WebSocket] Received message from client (connection ID: ${ws.id}):`, data);
            messageID = data.messageID;

            // Handle reconnect requests
            if (data.type === MESSAGE_TYPES.RECONNECT && data.sessionID) {
                console.log(`[WebSocket] Processing reconnect request with message ID: ${messageID}`);
                returnMessage = await handleReconnect(ws, redis, data, req);
            }
            // Check for session ID in authenticated requests
            else if (data.sessionID && data.type !== MESSAGE_TYPES.REGISTER_PLAYER) {
                // Validate the session
                console.log(`[WebSocket] Validating session with ID: ${data.sessionID.substring(0, 8)}...`);
                const sessionData = await validateSession(redis, data.sessionID, req);

                // Check if session is valid and either belongs to this connection or is a reconnect attempt
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
                    returnMessage = await handleRegisterPlayer(ws, redis, data, req);
                } else {
                    returnMessage = {
                        success: false,
                        error: ERROR_MESSAGES.AUTHENTICATION_REQUIRED
                    };
                }
            }

        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
            returnMessage = {
                success: false,
                error: ERROR_MESSAGES.INTERNAL_ERROR
            };
        }
        
        // Append the MessageID back to the return message before responding.
        if (messageID) {
            returnMessage['messageID'] = messageID;
        }

        // Send the response back to the client
        sendResponseToClient(ws, returnMessage, messageID);
    });
}

/**
 * @function sendResponseToClient
 * @description Sends a response back to the client, with fallback mechanisms
 * @param ws WebSocket connection
 * @param returnMessage The message to send
 * @param messageID The message ID for logging
 */
function sendResponseToClient(ws: any, returnMessage: ReturnMessage, messageID: string | null) {
    // Log the response being sent back to the client
    console.log(`[WebSocket] Preparing to send response for message ID ${messageID}:`, returnMessage);

    // Stringify the response
    const responseString = JSON.stringify(returnMessage);
    console.log(`[WebSocket] Response size: ${responseString.length} bytes`);

    // First, try to send using the provided WebSocket
    try {
        // Check WebSocket state
        console.log(`[WebSocket] Direct WebSocket readyState: ${ws.readyState}`);
        
        if (ws.readyState === 1) { // 1 = OPEN
            ws.send(responseString);
            console.log(`[WebSocket] Response sent successfully using direct WebSocket`);
            return;
        } else {
            console.warn(`[WebSocket] Direct WebSocket not in OPEN state (state: ${ws.readyState})`);
        }
    } catch (error) {
        console.error(`[WebSocket] Error sending with direct WebSocket:`, error);
    }

    // If direct send failed, try to get the WebSocket from the activeWebsockets map
    try {
        console.log(`[WebSocket] Attempting to retrieve WebSocket from activeWebsockets map for ID: ${ws.id}`);
        const storedWs = getWebsocketObject(ws.id);
        
        if (storedWs) {
            console.log(`[WebSocket] Found WebSocket in map, readyState: ${storedWs.readyState}`);
            
            if (storedWs.readyState === 1) {
                storedWs.send(responseString);
                console.log(`[WebSocket] Response sent successfully using stored WebSocket`);
                return;
            } else {
                console.warn(`[WebSocket] Stored WebSocket not in OPEN state (state: ${storedWs.readyState})`);
            }
        } else {
            console.warn(`[WebSocket] No WebSocket found in activeWebsockets map for ID: ${ws.id}`);
        }
    } catch (fallbackError) {
        console.error(`[WebSocket] Error sending with stored WebSocket:`, fallbackError);
    }

    // If we get here, both attempts failed
    console.error(`[WebSocket] Failed to send response - all attempts failed`);
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
 * @param req HTTP request object
 * @returns Promise resolving to response object
 */
async function handleRegisterPlayer(ws: any, redis: Redis, data: any, req: any): Promise<object> {
    const params = data.parameters || {};
    const username = params.username;

    if (!username) {
        return {
            success: false,
            message: ERROR_MESSAGES.INVALID_USERNAME,
        };
    }

    console.log(`[Register] Checking if player ${username} exists`);

    // Check if the user is already registered.
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
            const sessionID = await createSession(redis, playerID, ws.id, req);

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

/**
 * @function handleReconnect
 * @description Handles the reconnection of a client using an existing session ID
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Reconnect request data
 * @param req HTTP request object
 * @returns Promise resolving to response object
 */
async function handleReconnect(ws: any, redis: Redis, data: any, req: any): Promise<object> {
    try {
        console.log(`[Reconnect] Starting reconnection process for connection ID: ${ws.id}`);
        console.log(`[Reconnect] Session ID provided: ${data.sessionID.substring(0, 8)}...`);
        
        // Validate the session
        console.log(`[Reconnect] Validating session token`);
        const startValidation = Date.now();
        const sessionData = await validateSession(redis, data.sessionID, req);
        const validationTime = Date.now() - startValidation;
        console.log(`[Reconnect] Session validation took ${validationTime}ms`);
        
        if (!sessionData) {
            console.log(`[Reconnect] Session validation failed - invalid token`);
            return {
                success: false,
                error: ERROR_MESSAGES.TOKEN_INVALID
            };
        }
        
        console.log(`[Reconnect] Session validation successful for player ID: ${sessionData.playerID}`);
        
        // Get the current connection ID associated with the session
        const currentConnectionID = sessionData.connectionID;
        console.log(`[Reconnect] Current connection ID from session: ${currentConnectionID}`);
        
        // Check if the current connection is still active
        console.log(`[Reconnect] Checking if current connection is still active`);
        const startConnectionCheck = Date.now();
        const isActive = await isConnectionActive(redis, currentConnectionID);
        const connectionCheckTime = Date.now() - startConnectionCheck;
        console.log(`[Reconnect] Connection check took ${connectionCheckTime}ms, result: ${isActive ? 'active' : 'inactive'}`);
        
        if (isActive) {
            console.log(`[Reconnect] Current connection is still active - concurrent login not allowed`);
            return {
                success: false,
                error: ERROR_MESSAGES.CONCURRENT_LOGIN
            };
        }
        
        // Ensure the WebSocket object is properly stored in the activeWebsockets map
        console.log(`[Reconnect] Re-registering WebSocket object in activeWebsockets map`);
        newConnection(redis, ws, ws.id);
        
        // Update the session with the new connection ID
        console.log(`[Reconnect] Updating session with new connection ID: ${ws.id}`);
        const startUpdate = Date.now();
        const updated = await updateSessionConnectionID(redis, data.sessionID, ws.id);
        const updateTime = Date.now() - startUpdate;
        console.log(`[Reconnect] Session update took ${updateTime}ms, result: ${updated ? 'success' : 'failed'}`);
        
        if (!updated) {
            console.log(`[Reconnect] Failed to update session with new connection ID`);
            return {
                success: false,
                error: ERROR_MESSAGES.INTERNAL_ERROR
            };
        }
        
        // Register the player with the connection
        console.log(`[Reconnect] Registering player ID ${sessionData.playerID} with connection ID ${ws.id}`);
        const startRegistration = Date.now();
        playerRegistered(redis, ws.id, sessionData.playerID);
        const registrationTime = Date.now() - startRegistration;
        console.log(`[Reconnect] Player registration took ${registrationTime}ms`);
        
        // Verify the WebSocket is still valid
        console.log(`[Reconnect] Verifying WebSocket state: ${ws.readyState}`);
        if (ws.readyState !== 1) { // 1 = OPEN
            console.warn(`[Reconnect] WebSocket not in OPEN state (state: ${ws.readyState})`);
        }
        
        // Create a direct response to ensure it's sent immediately
        const directResponse = {
            success: true,
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            playerID: sessionData.playerID,
            messageID: data.messageID
        };
        
        // Try to send the response directly
        console.log(`[Reconnect] Attempting to send response directly`);
        try {
            const responseString = JSON.stringify(directResponse);
            ws.send(responseString);
            console.log(`[Reconnect] Direct response sent successfully`);
        } catch (sendError) {
            console.error(`[Reconnect] Error sending direct response:`, sendError);
        }
        
        // Return success for the normal response flow as well
        console.log(`[Reconnect] Reconnection successful for player ID: ${sessionData.playerID}`);
        return {
            success: true,
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            playerID: sessionData.playerID
        };
    } catch (error) {
        console.error('[Reconnect] Error handling reconnect:', error);
        return {
            success: false,
            error: ERROR_MESSAGES.INTERNAL_ERROR
        };
    }
}
