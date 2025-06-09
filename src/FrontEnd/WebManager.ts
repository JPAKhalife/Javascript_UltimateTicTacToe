/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

export default class WebManager {
    static socket: WebSocket;
    
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
        };
    
        WebManager.socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
        };
    
        WebManager.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

}