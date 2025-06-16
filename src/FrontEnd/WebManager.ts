/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

export default class WebManager {
    static socket: WebSocket;
    private static messageCallbacks: Map<string, (response: any) => void> = new Map();
    private static messageIdCounter: number = 0;
    
    constructor() 
    {
        // This constructor is intentionally empty
        // The class is designed to be a singleton, so no instance should be created            
    }

    /**
     * @method initiateWebsocketConnection
     * @description This method is used to initiate the websocket connection
     * @returns {void}
     * @throws {Error} If the websocket connection fails
     */
    public static initiateWebsocketConnection()
    {
        const serverAddress = process.env.REMOTE_SERVER_ADDRESS || 'ws://localhost:3000';

        WebManager.socket = new WebSocket(serverAddress);

        WebManager.socket.onopen = () => {
            console.log('WebSocket connection established - clientside');
            WebManager.socket.send(JSON.stringify({ message: 'Hello from the client' }));
        };
    
        WebManager.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Message from server:', data.message);
            
            // Handle response messages with messageId
            if (data.messageId && WebManager.messageCallbacks.has(data.messageId)) {
                const callback = WebManager.messageCallbacks.get(data.messageId);
                if (callback) {
                    callback(data);
                    WebManager.messageCallbacks.delete(data.messageId);
                }
            }
        };
    
        WebManager.socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
        };
    
        WebManager.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    /**
     * @method createLobby
     * @description Sends a request to the server to create a new lobby
     * @param lobbyName Name of the lobby to create
     * @param playerNum Number of players allowed in the lobby
     * @param levelSize Size of the level
     * @param gridSize Size of the grid
     * @param playerName Name of the player creating the lobby
     * @param playerID Unique ID of the player creating the lobby
     * @returns Promise that resolves with the result of the lobby creation
     */
    public static createLobby(
        lobbyName: string,
        playerNum: number,
        levelSize: number,
        gridSize: number,
        playerID: string
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // Check if WebSocket is connected
            if (!WebManager.socket || WebManager.socket.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket connection not established'));
                return;
            }

            // Generate a unique message ID
            const messageId = `createLobby_${WebManager.messageIdCounter++}`;

            // Create message payload
            const message = {
                type: 'createLobby',
                messageId,
                data: {
                    lobbyName,
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
            WebManager.messageCallbacks.set(messageId, (response) => {
                if (response.success) {
                    resolve(true);
                } else {
                    console.error('Failed to create lobby:', response.error);
                    resolve(false);
                }
            });

            // Send the message
            WebManager.socket.send(JSON.stringify(message));
        });
    }

    /**
     * @method initiateConnectionIfNotEstablished
     * @description Check if the connection is established, initiate it if it is not
     */
    public static initiateConnectionIfNotEstablished() {
        if (WebManager.socket.readyState != WebManager.socket.OPEN) {
            WebManager.initiateWebsocketConnection();
        }
    }
}
