/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import { time } from "console";
const { v4: uuidv4 } = require('uuid');

/**
 * Interface representing lobby information
 */
export interface LobbyInfo {
    lobbyID: string;
    playerNum: number;
    levelSize: number;
    gridSize: number;
    playersJoined: number;
    creator: string;
    lobbyState: string;
    allowSpectators: boolean;
}

export default class WebManager {
    private static instance: WebManager | null = null;
    private socket: WebSocket | null = null;
    private messageCallbacks: Map<string, (response: any) => void> = new Map();
    private messageIDCounter: number = 0;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = -1;
    private reconnectDelay: number = 1000; // Base delay in ms
private sessionId: string | null = null;
    
/**
 * Private constructor to enforce singleton pattern
 */
private constructor() {
    // Private constructor to enforce singleton pattern
    this.sessionId = this.getStoredSessionId();
}

/**
 * @method getStoredSessionId
 * @description Get the session ID from localStorage if it exists
 * @returns {string|null} The session ID or null if it doesn't exist
 * @private
 */
private getStoredSessionId(): string | null {
    return localStorage.getItem('session_id');
}

/**
 * @method setSessionId
 * @description Store the session ID in localStorage
 * @param {string} sessionId The session ID to store
 */
public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    localStorage.setItem('session_id', sessionId);
}

/**
 * @method clearSessionId
 * @description Clear the stored session ID
 */
public clearSessionId(): void {
    this.sessionId = null;
    localStorage.removeItem('session_id');
}

/**
 * @method getSessionId
 * @description Get the current session ID
 * @returns {string|null} The session ID or null if not set
 */
public getSessionId(): string | null {
    return this.sessionId;
}

    
    /**
     * @method getInstance
     * @description Get the singleton instance of WebManager
     * @returns {WebManager} The singleton instance
     */
    public static getInstance(): WebManager {
        if (!WebManager.instance) {
            WebManager.instance = new WebManager();
        }
        return WebManager.instance;
    }

    /**
     * @method initiateWebsocketConnection
     * @description This method is used to initiate the websocket connection
     * @returns {Promise<boolean>} A promise that resolves to true if connection was successful
     */
    public async initiateWebsocketConnection(): Promise<boolean> {
        return new Promise((resolve) => {
            const serverAddress = process.env.REMOTE_SERVER_ADDRESS || 'ws://localhost:3000';
            // No longer append the device ID as a query parameter for security
            // Instead, we'll use the session ID in the message body
            const connectionUrl = serverAddress;

            this.socket = new WebSocket(connectionUrl);

            this.socket.onopen = async () => {
                console.log('WebSocket connection established - clientside');
                
                // Reset reconnect attempts on successful connection
                this.reconnectAttempts = 0;
                
                // Check if we have a stored session ID for reconnection
                const sessionId = this.getSessionId();
                if (sessionId) {
                    // Attempt to reconnect with the stored session ID
                    const reconnected = await this.attemptReconnect(sessionId);
                    if (reconnected) {
                        console.log('Successfully reconnected with existing session');
                    } else {
                        console.log('Failed to reconnect with existing session, clearing session ID');
                        this.clearSessionId();
                    }
                } else {
                    // Just send a simple hello message if no session ID
                    this.socket?.send(JSON.stringify({ message: 'Hello from the client' }));
                }
                
                resolve(true);
            };
        
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Handle response messages with messageID
                    if (data.messageID && this.messageCallbacks.has(data.messageID)) {
                        const callback = this.messageCallbacks.get(data.messageID);
                        if (callback) {
                            callback(data);
                            this.messageCallbacks.delete(data.messageID);
                        }
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                    return
                }
            };
        
            this.socket.onclose = (event) => {
                console.log('WebSocket connection closed', event);
                this.scheduleReconnect();
            };
        
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                resolve(false);
            };
            
            // Add a timeout for the connection attempt
            setTimeout(() => {
                if (this.socket?.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket connection timeout');
                    resolve(false);
                }
            }, 5000);
        });
    }

    /**
     * @method isConnected
     * @description Check if the WebSocket is connected
     * @returns {boolean} True if connected, false otherwise
     */
    public isConnected(): boolean {
        return !!this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * @method scheduleReconnect
     * @description Schedule a reconnection attempt with exponential backoff
     * @private
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts || this.maxReconnectAttempts < 0) {
            this.reconnectAttempts++;
            const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 120000);
            
            console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.initiateWebsocketConnection();
            }, delay);
        } else {
            console.error('Maximum reconnection attempts reached');
        }
    }
    
    /**
     * @method attemptReconnect
     * @description Attempts to reconnect using a stored session ID
     * @param {string} sessionId The session ID to use for reconnection
     * @returns {Promise<boolean>} A promise that resolves to true if reconnection was successful
     * @private
     */
    private async attemptReconnect(sessionId: string): Promise<boolean> {
        try {
            // Create the reconnect message
            const message = {
                type: 'reconnect',
                sessionID: sessionId,
                messageID: this.generateMessageID('reconnect')
            };
            
            // Send the reconnect request
            const response = await this.sendRequest<{ success: boolean, playerID: string }>(message, 'reconnect');
            
            // If successful, return true
            return response && response.success === true;
        } catch (error) {
            console.error('Error attempting to reconnect:', error);
            return false;
        }
    }

    /**
     * @method createLobby
     * @description Sends a request to the server to create a new lobby
     * @param lobbyID Name of the lobby to create
     * @param playerNum Number of players allowed in the lobby
     * @param levelSize Size of the level
     * @param gridSize Size of the grid
     * @param playerID Unique ID of the player creating the lobby
     * @param allowSpectators whether or not spectators should be allowed
     * @returns Promise that resolves with the result of the lobby creation
     */
    public async createLobby(
        lobbyID: string,
        playerNum: number,
        levelSize: number,
        gridSize: number,
        playerID: string,
        allowSpectators: boolean
    ): Promise<boolean> {
        try {
            // Create message payload
            const message = {
                type: 'create_lobby',
                sessionID: this.getSessionId(),
                parameters: {
                    lobbyID,
                    lobbyData: {
                        playerNum,
                        levelSize,
                        gridSize,
                        allowSpectators
                    },
                    playerID: playerID
                }
            };

            // Use the sendRequest method to create the lobby
            const response = await this.sendRequest<{ success: boolean }>(message, 'create_lobby');
            console.log("Response received: ", response);

            // Return the success status from the response
            return response && response.success === true;
        } catch (error) {
            console.error('Error creating lobby:', error);
            return false;
        }
    }

    /**
     * @method initiateConnectionIfNotEstablished
     * @description Check if the connection is established, initiate it if it is not
     * @returns {Promise<boolean>} A promise that resolves to true when the connection is established
     */
    public async initiateConnectionIfNotEstablished(): Promise<boolean> {
        // If already connected, return true
        if (this.isConnected()) {
            return true;
        }
        
        // If connecting, wait for it to complete
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
            return new Promise((resolve) => {
                const checkConnection = () => {
                    if (this.isConnected()) {
                        resolve(true);
                    } else if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                        resolve(this.initiateWebsocketConnection());
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                
                checkConnection();
            });
        }
        
        // Otherwise, initiate a new connection
        return this.initiateWebsocketConnection();
    }
    
    
    /**
     * @method closeConnection
     * @description Close the WebSocket connection
     */
    public closeConnection(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    /**
     * @method getLobbyList
     * @description Get a list of lobbies on the server
     * @param playerNum: number of players who can play the game
     * @param levelSize: The number of layers in the tictac
     * @param gridSize: The number of slots in a tictac
     * @param joinedPlayers: The number of players who have joined the lobby (spectators included)
     * @returns Promise<LobbyInfo[]> a promise that resolves to an array of lobbies and their info
     */
    public async getLobbyList(parameters: {lobbyID?: string, playerNum?: number, levelSize?: number, gridSize?: number, joinedPlayers?: number, maxListLength?: number, lobbyState?: string, creator?: string}): Promise<LobbyInfo[]> {
        try {
            let playerID = localStorage.getItem('playerID');
            // Create the message payload
            const message = {
                type: 'search_lobby',
                sessionID: this.getSessionId(),
                parameters: {
                    lobbyID: parameters.lobbyID,
                    playerNum: parameters.playerNum,
                    levelSize: parameters.levelSize,
                    gridSize: parameters.gridSize,
                    creator: parameters.creator,
                    lobbyState: parameters.lobbyState,
                    joinedPlayers: parameters.joinedPlayers,
                    maxListLength: parameters.maxListLength
                }
            };
            
            // Use the sendRequest method to get the lobby list
            const response = await this.sendRequest<{ success: boolean; lobbies: any[] }>(message, 'search_lobby');
            
            // Parse the response into LobbyInfo objects
            if (response && response.success && Array.isArray(response.lobbies)) {
                return response.lobbies.map(lobby => ({
                    lobbyID: lobby.lobbyID,
                    playerNum: lobby.playerNum,
                    levelSize: lobby.levelSize,
                    gridSize: lobby.gridSize,
                    playersJoined: lobby.playersJoined,
                    creator: lobby.creator,
                    lobbyState: lobby.lobbyState,
                    allowSpectators: lobby.allowSpectators
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Error getting lobby list:', error);
            return [];
        }
    }

    /**
     * @method sendRequest
     * @description This is the method used by all methods that interact with the server to send requests.
     * @param message the message content being sent
     * @param action the action being taken
     */
    public sendRequest<T = any>(message: any, action: string): Promise<T> {
        return new Promise((resolve, reject) => {
            // Check if WebSocket is connected
            if (!this.isConnected()) {
                reject(new Error('WebSocket connection not established'));
                return;
            }

            //Generate a messageID for callbacks
            const messageID = this.generateMessageID(action);
            
            // Add the messageID to the message if it doesn't have one
            if (!message.messageID) {
                message.messageID = messageID;
            }
            
            // Add the session ID to the message if available (except for registration)
            if (this.sessionId && action !== 'registerPlayer') {
                message.sessionID = this.sessionId;
            }

            //Register callbacks for the message
            this.messageCallbacks.set(messageID, (response) => {
                // Store the response for future reference
                console.log(`Received response for ${action}:`, response);
                
                if (response.success) {
                    // Return the entire response object since it contains all the data we need
                    resolve(response as T);
                } else {
                    console.error('Failed to ' + action +':', response.error);
                    reject(new Error(response.error || `Failed to ${action}`));
                }
            });

            // Send the message
            this.socket?.send(JSON.stringify(message));
            
            // Add a timeout for the response
            setTimeout(() => {
                if (this.messageCallbacks.has(messageID)) {
                    this.messageCallbacks.delete(messageID);
                    console.error(action + ' request timed out');
                    reject(new Error(`${action} request timed out`));
                }
            }, 10000); // 10 second timeout
        });
    }

    /**
     * @method generateMethodID
     * @description This method is used to automatically generate a message ID
     * This is done with the format action_time_messagenum
     * @param action a string that describes the action being requested by the message
     * @returns a string representing the message ID
     */
    private generateMessageID(action: string): string {
        const now = new Date();
        return action + "_" + now.toISOString() + "_" + this.messageIDCounter++;
    }

    /**
     * @method checkAndRegisterPlayer
     * @description This method makes a request for a new player to be generated. This allows the
     * client to join game servers when it receives a session id.
     * @param username the username that the player chose
     * @return The sessionID and message.
     */
    public async checkAndRegisterPlayer(username: string): Promise<[string, string]> {
        try {
            const message = {
                type: 'register_player',
                parameters: {
                    username: username,
                    checkUsername: true
                }
            }

            const response = await this.sendRequest<{ success: boolean, message: string, sessionID: string }>(message, 'registerPlayer');
            //Store the session ID
            if (response.success && response.sessionID) {
                this.setSessionId(response.sessionID);
                console.log('Session ID stored:', response.sessionID);
            }

            // The session ID will be automatically stored by the sendRequest method
            return [
                response.sessionID ? response.sessionID : "",
                response.message
            ];

        } catch(error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return ["", errorMessage]
        }
    }

}
