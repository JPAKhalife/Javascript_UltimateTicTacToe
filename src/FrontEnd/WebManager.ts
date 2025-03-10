/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

export default class WebManager {
    private socket: WebSocket;

    constructor() {
        //Open a websocket connection to the server. while the cutscene plays
        //TODO: Find some way to automate/not hardcode the server addres
        this.socket = new WebSocket('ws://localhost:3000');

        this.socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        this.socket.onmessage = (event) => {
            console.log('Message from server ', event.data);
            // Handle incoming messages
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error', error);
        };
    }

}