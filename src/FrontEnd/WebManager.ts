/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

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
        return new Promise((resolve, reject) => {
            // Check if WebSocket is connected
            if (!this.isConnected()) {
                reject(new Error('WebSocket connection not established'));
                return;
            }

            // Generate a unique message ID
            const messageId = `createLobby_${this.messageIdCounter++}`;

            // Create message payload
            const message = {
                type: 'createLobby',
                messageId,
                data: {
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

            // Register callback for this message
            this.messageCallbacks.set(messageId, (response) => {
                if (response.success) {
                    resolve(true);
                } else {
                    console.error('Failed to create lobby:', response.error);
                    resolve(false);
                }
            });

            // Send the message
            this.socket?.send(JSON.stringify(message));
            
            // Add a timeout for the response
            setTimeout(() => {
                if (this.messageCallbacks.has(messageId)) {
                    this.messageCallbacks.delete(messageId);
                    console.error('Lobby creation request timed out');
                    resolve(false);
                }
            }, 10000); // 10 second timeout
        });
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
     * @method sendMessage
     * @description Send a message to the server with a specific type
     * @param type The message type
     * @param data The message data
     * @returns Promise that resolves with the server response
     */
    public async sendMessage<T, R>(type: string, data: T): Promise<R> {
        return new Promise(async (resolve, reject) => {
            // Ensure connection is established
            const connected = await this.initiateConnectionIfNotEstablished();
            if (!connected) {
                reject(new Error('Failed to establish WebSocket connection'));
                return;
            }
            
            // Generate a unique message ID
            const messageId = `${type}_${this.messageIdCounter++}`;
            
            // Create message payload
            const message = {
                type,
                messageId,
                data
            };
            
            // Register callback for this message
            this.messageCallbacks.set(messageId, (response) => {
                resolve(response as R);
            });
            
            // Send the message
            this.socket?.send(JSON.stringify(message));
            
            // Add a timeout for the response
            setTimeout(() => {
                if (this.messageCallbacks.has(messageId)) {
                    this.messageCallbacks.delete(messageId);
                    reject(new Error(`Request timed out: ${type}`));
                }
            }, 10000); // 10 second timeout
        });
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
}
