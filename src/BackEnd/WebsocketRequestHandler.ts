import Redis from 'ioredis';
import Lobby from './Database/Lobby';

export function handleWebsocketRequest(ws: any, req: any, redis: Redis) {
    console.log("WebSocket connection established from client");

    // Send a message to the client upon connection
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

    // Handle incoming messages from the client
    ws.on('message', async (message: any) => {
        let returnMessage;
        let messageID: string | null = null;
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message from client:', data);
            messageID = data.messageID;

            // Handle different message types
            if (data.type === 'createLobby') {
                returnMessage = await handleCreateLobby(ws, redis, data.parameters)
            } else if (data.type === 'searchLobbies') {
                returnMessage = await handleSearchLobbies(ws, redis, data.parameters);
            } else {
                returnMessage = {
                    messageID: data.messageID,
                    message: 'Message received',
                    data
                };
            }
        } catch (error) {
            console.error('Error processing message:', error);
            returnMessage = {
                success: false,
                error: 'Error processing message'
            };
        }
        //Append the MessageID back to the return message before responding.
        returnMessage.messageID = messageID;
        ws.send(JSON.stringify(returnMessage));
    });
}


/**
 * @function handleSearchLobbies
 * @description Handles the searchLobbies message from the client
 * @param ws Websocket connection
 * @param data Message data
 */
async function handleSearchLobbies(ws: any, redis: Redis, parameters: any): Promise<object> {
    try {
        //Deconstruct the object
        const { lobbyID, playerNum, levelSize, gridSize, joinedPlayers, maxListLength } = parameters;


    } catch (error) {
        console.error('Error searching lobbies:', error);
        return {
            success: false,
            error: 'Error creating lobby'
        };
    }

    return {};
}


/**
 * @function handleCreateLobby
 * @description Handles the createLobby message from the client
 * @param ws WebSocket connection
 * @param data Message data
 */
async function handleCreateLobby(ws: any, redis: Redis, parameters: any): Promise<object> {
    let messageID: string | undefined;

    try {
        //Deconstruct the data received
        const { lobbyID, lobbyData, playerData } = parameters;

        console.log(`Creating lobby ${lobbyID} with data:`, lobbyData, playerData);

        // Call RedisManager to create the lobby
        let newLobby = Lobby.createLobby(redis, lobbyID, lobbyData, playerData);

        // Send response back to client
        return {
            messageID,
            success: true,
            message: "Lobby ${lobbyID} created successfully"
        };
    } catch (error) {
        console.error('Error creating lobby:', error);
        return {
            success: false,
            error: 'Error creating lobby'
        };
    }
}
