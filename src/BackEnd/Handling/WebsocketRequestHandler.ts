/**
 * @file WebsocketRequestHandler.ts
 * @description This is the file that processes websocket requests
 * 
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import Redis from 'ioredis';
import Lobby, { LobbyData } from '../Database/Lobby';
import Player from '../Database/Player';
import {
    newConnection,
    playerRegistered,
    getPlayerID,
    removeConnection,
    getWebsocketObject,
} from '../Database/Connections';
import { URL } from 'url';
import {
    LobbyCreateRequest,
    LobbySearchRequest,
    MESSAGE_TYPES,
    RegisterRequest,
    ReconnectRequest,
    BaseRequest,
    AuthenticatedRequest,
    LobbyJoinRequest,
} from '../Contracts/MessageSchema';
import Session from '../Database/Session';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../Contants';
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

            // Validate the base request schema
            const baseRequestValidation = BaseRequest.safeParse(data);
            if (!baseRequestValidation.success) {
                console.error('[WebSocket] Invalid base request schema:', baseRequestValidation.error);
                returnMessage = {
                    success: false,
                    error: ERROR_MESSAGES.INVALID_SCHEMA,
                };
                sendResponseToClient(ws, returnMessage, messageID);
                return;
            }

            // Handle reconnect requests
            if (data.type === MESSAGE_TYPES.RECONNECT) {
                const reconnectValidation = ReconnectRequest.safeParse(data);
                if (!reconnectValidation.success) {
                    console.error('[WebSocket] Invalid reconnect request schema:', reconnectValidation.error);
                    returnMessage = {
                        success: false,
                        error: ERROR_MESSAGES.INVALID_SCHEMA,
                    };
                } else {
                    console.log(`[WebSocket] Processing reconnect request with message ID: ${messageID}`);
                    returnMessage = await handleReconnect(ws, redis, reconnectValidation.data, req);
                }
            }
            // Check for session ID in authenticated requests
            else if (data.sessionID && data.type !== MESSAGE_TYPES.REGISTER_PLAYER) {
                const authRequestValidation = AuthenticatedRequest.safeParse(data);
                if (!authRequestValidation.success) {
                    console.error('[WebSocket] Invalid authenticated request schema:', authRequestValidation.error);
                    returnMessage = {
                        success: false,
                        error: ERROR_MESSAGES.INVALID_SCHEMA,
                    };
                } else {
                    // Validate the session
                    console.log(`[WebSocket] Validating session with ID: ${data.sessionID.substring(0, 8)}...`);
                    const sessionData = await Session.validateSession(redis, data.sessionID, req);

                    if (sessionData && sessionData.getConnectionID() === ws.id) {
                        await Session.refreshSession(redis, data.sessionID);

                        if (data.type === MESSAGE_TYPES.CREATE_LOBBY) {
                            const createLobbyValidation = LobbyCreateRequest.safeParse(data);
                            if (!createLobbyValidation.success) {
                                console.error('[WebSocket] Invalid create lobby request schema:', createLobbyValidation.error);
                                returnMessage = {
                                    success: false,
                                    error: ERROR_MESSAGES.INVALID_SCHEMA,
                                };
                            } else {
                                returnMessage = await handleCreateLobby(ws, redis, createLobbyValidation.data, sessionData.getPlayerID());
                            }
                        } else if (data.type === MESSAGE_TYPES.SEARCH_LOBBY) {
                            const searchLobbyValidation = LobbySearchRequest.safeParse(data);
                            if (!searchLobbyValidation.success) {
                                console.error('[WebSocket] Invalid search lobby request schema:', searchLobbyValidation.error);
                                returnMessage = {
                                    success: false,
                                    error: ERROR_MESSAGES.INVALID_SCHEMA,
                                };
                            } else {
                                returnMessage = await handleSearchLobbies(ws, redis, searchLobbyValidation.data, sessionData.getPlayerID());
                            }
                        } else if (data.type === MESSAGE_TYPES.JOIN_LOBBY) {
                            returnMessage = await handleJoinLobby(ws, redis, data, sessionData.getPlayerID());
                        } else {
                            returnMessage = {
                                messageID: data.messageID,
                                message: 'Message received',
                                data,
                            };
                        }
                    } else {
                        returnMessage = {
                            success: false,
                            error: ERROR_MESSAGES.TOKEN_INVALID,
                        };
                    }
                }
            } else {
                if (data.type === MESSAGE_TYPES.REGISTER_PLAYER) {
                    const registerValidation = RegisterRequest.safeParse(data);
                    if (!registerValidation.success) {
                        console.error('[WebSocket] Invalid register player request schema:', registerValidation.error);
                        returnMessage = {
                            success: false,
                            error: ERROR_MESSAGES.INVALID_SCHEMA,
                        };
                    } else {
                        returnMessage = await handleRegisterPlayer(ws, redis, registerValidation.data, req);
                    }
                } else {
                    if (Object.values(MESSAGE_TYPES).includes(data.type)) {
                        returnMessage = {
                            success: false,
                            error: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
                        };
                    } else {
                        returnMessage = {
                            success: false,
                            error: ERROR_MESSAGES.INVALID_SCHEMA,
                        };
                    }
                }
            }
        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
            returnMessage = {
                success: false,
                error: ERROR_MESSAGES.INTERNAL_ERROR,
            };
        }

        if (messageID) {
            returnMessage['messageID'] = messageID;
        }

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

    // If we get here, attempt failed
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
async function handleSearchLobbies(ws: any, redis: Redis, data: LobbySearchRequest, playerID: string): Promise<object> {
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
async function handleCreateLobby(ws: any, redis: Redis, data: LobbyCreateRequest, playerID: string): Promise<object> {
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
async function handleRegisterPlayer(ws: any, redis: Redis, data: RegisterRequest, req: any): Promise<object> {
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
            const sessionID = await Session.createSession(redis, playerID, ws.id, req);

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
async function handleReconnect(ws: any, redis: Redis, data: ReconnectRequest, req: any): Promise<object> {
    try {
        console.log(`[Reconnect] Starting reconnection process for connection ID: ${ws.id}`);
        console.log(`[Reconnect] Session ID provided: ${data.sessionID.substring(0, 8)}...`);

        // Validate the session
        console.log(`[Reconnect] Validating session token`);
        const startValidation = Date.now();
        const sessionData = await Session.validateSession(redis, data.sessionID, req);
        const validationTime = Date.now() - startValidation;
        console.log(`[Reconnect] Session validation took ${validationTime}ms`);

        if (!sessionData) {
            console.log(`[Reconnect] Session validation failed - invalid token`);
            return {
                success: false,
                error: ERROR_MESSAGES.TOKEN_INVALID
            };
        }

        console.log(`[Reconnect] Session validation successful for player ID: ${sessionData.getPlayerID()}`);

        // Get the current connection ID associated with the session
        const currentConnectionID = sessionData.getConnectionID();
        console.log(`[Reconnect] Current connection ID from session: ${currentConnectionID}`);

        // Check if the current connection is still active
        console.log(`[Reconnect] Checking if current connection is still active`);
        const startConnectionCheck = Date.now();
        const isActive = await Session.isConnectionActive(redis, currentConnectionID);
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
        const updated = await Session.updateSessionConnectionID(redis, data.sessionID, ws.id);
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
        console.log(`[Reconnect] Registering player ID ${sessionData.getPlayerID()} with connection ID ${ws.id}`);
        const startRegistration = Date.now();
        playerRegistered(redis, ws.id, sessionData.getPlayerID());
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
            playerID: sessionData.getPlayerID(),
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
        console.log(`[Reconnect] Reconnection successful for player ID: ${sessionData.getPlayerID()}`);
        return {
            success: true,
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            playerID: sessionData.getPlayerID()
        };
    } catch (error) {
        console.error('[Reconnect] Error handling reconnect:', error);
        return {
            success: false,
            error: ERROR_MESSAGES.INTERNAL_ERROR
        };
    }
}

/**
 * @function handleJoinLobby
 * @description Handles the joinLobby message from the client
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Join lobby request data
 */
async function handleJoinLobby(ws: any, redis: Redis, data: LobbyJoinRequest, playerID: string): Promise<object> {
    try {
        const params = data.parameters || {};
        const lobbyID = params.lobbyID;

        if (!lobbyID) {
            return {
                success: false,
                error: ERROR_MESSAGES.INVALID_REQUEST_FORMAT
            };
        }

        console.log(`Player ${playerID} attempting to join lobby ${lobbyID}`);

        // Fetch the lobby
        const lobby = await Lobby.getLobby(redis, lobbyID);
        if (!lobby) {
            return {
                success: false,
                error: ERROR_MESSAGES.LOBBY_NOT_FOUND
            };
        }

        // Attempt to add the player to the lobby
        const joinResult = await Player.addPlayer(redis, lobbyID, playerID);
        if (!joinResult) {
            return {
                success: false,
                error: ERROR_MESSAGES.LOBBY_JOIN_FAILED
            };
        }

        console.log(`Player ${playerID} joined lobby ${lobbyID} successfully`);

        // Return success response with updated lobby info
        return {
            success: true,
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            lobby: await lobby.lobbySummaryJson(redis)
        };
    } catch (error) {
        console.error('Error joining lobby:', error);
        return {
            success: false,
            error: ERROR_MESSAGES.INTERNAL_ERROR
        };
    }
}
