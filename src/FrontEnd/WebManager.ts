/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import { time } from "console";

export default class WebManager {
    private static instance: WebManager | null = null;
    private socket: WebSocket | null = null;
    private messageCallbacks: Map<string, (response: any) => void> = new Map();
    private messageIdCounter: number = 0;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000; // Base delay in ms
    
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        // Private constructor to enforce singleton pattern
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

            this.socket = new WebSocket(serverAddress);

            this.socket.onopen = () => {
                console.log('WebSocket connection established - clientside');
                this.socket?.send(JSON.stringify({ message: 'Hello from the client' }));
                this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                resolve(true);
            };
        
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Message from server:', data.message);
                    
                    // Handle response messages with messageId
                    if (data.messageId && this.messageCallbacks.has(data.messageId)) {
                        const callback = this.messageCallbacks.get(data.messageId);
                        if (callback) {
                            callback(data);
                            this.messageCallbacks.delete(data.messageId);
                        }
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
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
        console.log("Is connected? " + (!!this.socket && this.socket.readyState === WebSocket.OPEN));
        return !!this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * @method scheduleReconnect
     * @description Schedule a reconnection attempt with exponential backoff
     * @private
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
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
     * @returns Promise that resolves with the result of the lobby creation
     */
    public async createLobby(
        lobbyID: string,
        playerNum: number,
        levelSize: number,
        gridSize: number,
        playerID: string
    ): Promise<boolean> {
        try {
            // Create message payload
            const message = {
                type: 'createLobby',
                parameters: {
                    lobbyID,
                    lobbyData: {
                        playerNum,
                        levelSize,
                        gridSize
                    },
                    playerData: {
                        playerNum: 1, // First player is always player 1
                        playerID
                    }
                }
            };

            // Use the sendRequest method to create the lobby
            const response = await this.sendRequest<{ success: boolean }>(message, 'createLobby');
            
            // Return true if the lobby was created successfully
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
     * @param lobbyID: The ID of the lobby
     * @param levelSize: The number of layers in the tictac
     * @param gridSize: The number of slots in a tictac
     * @param joinedPlayers: The number of players who have joined the lobby (spectators included)
     * @returns Promise<LobbyInfo[]> a promise that resolves to an array of lobbies and their info
     */
    public async getLobbyList(parameters: {lobbyID?: string, playerNum?: number, levelSize?: number, gridSize?: number, joinedPlayers?: number, maxListLength?: number}): Promise<any[]> {
        try {
            // Create the message payload
            const message = {
                type: 'searchLobbies',
                parameters: {
                    lobbyID: parameters.lobbyID,
                    playerNum: parameters.playerNum,
                    levelSize: parameters.levelSize,
                    gridSize: parameters.gridSize,
                    joinedPlayers: parameters.joinedPlayers,
                    maxListLength: parameters.maxListLength
                }
            };
            
            // Use the sendRequest method to get the lobby list
            return await this.sendRequest<any[]>(message, 'searchLobbies');
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
            if (!message.messageId) {
                message.messageId = messageID;
            }

            //Register callbacks for the message
            this.messageCallbacks.set(messageID, (response) => {
                // Store the response for future reference
                console.log(`Received response for ${action}:`, response);
                
                if (response.success) {
                    // Return the actual response data instead of just a boolean
                    resolve(response.data as T);
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
        return action + "_" + now.toISOString() + "_" + this.messageIdCounter++;
    }

}
