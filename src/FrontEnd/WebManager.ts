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
    private deviceId: string;
    
/**
 * Private constructor to enforce singleton pattern
 */
private constructor() {
    // Private constructor to enforce singleton pattern
    this.deviceId = this.getOrCreateDeviceId();
}

/**
 * @method getOrCreateDeviceId
 * @description Get the device ID from localStorage or create a new one if it doesn't exist
 * @returns {string} The device ID
 * @private
 */
private getOrCreateDeviceId(): string {
    const storedId = localStorage.getItem('device_id');
    if (!storedId) {
        const newId = uuidv4();
        localStorage.setItem('device_id', newId);
        return newId;
    }
    return storedId;
}

/**
 * @method getDeviceId
 * @description Get the device ID
 * @returns {string} The device ID
 */
public getDeviceId(): string {
    return this.deviceId;
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
            // Append the device ID as a query parameter
            const connectionUrl = `${serverAddress}?deviceId=${encodeURIComponent(this.deviceId)}`;

            this.socket = new WebSocket(connectionUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connection established - clientside');
                this.socket?.send(JSON.stringify({ message: 'Hello from the client' }));
                this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                resolve(true);
            };
        
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Message from server:', data);
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
                type: 'createLobby',
                playerID: playerID,
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
            const response = await this.sendRequest<{ success: boolean }>(message, 'createLobby');
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
                type: 'searchLobbies',
                playerID: playerID,
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
            const response = await this.sendRequest<{ success: boolean; lobbies: any[] }>(message, 'searchLobbies');
            
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
     * client to join game servers when it receives a player id.
     * @param username the username that the player chose
     * @return The playerID, or an empty string.
     */
    public async checkAndRegisterPlayer(username: string): Promise<[string, string]> {
        try {
            const message = {
                type: 'registerPlayer',
                parameters: {
                    identifier: username,
                    checkUsername: true
                }
            }

            const response = await this.sendRequest<{ success: boolean, message: string, playerID: string }>(message, 'registerPlayer');
            console.log("Response received: ", response);

            return [response.playerID ? response.playerID : "", response.message];

        } catch(error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return ["", errorMessage]
        }
    }

}
