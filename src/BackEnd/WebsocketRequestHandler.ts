import Redis from 'ioredis';
import Lobby from './Database/Lobby';

type ReturnMessage = Record<string, any>

export function handleWebsocketRequest(ws: any, req: any, redis: Redis) {
    console.log("WebSocket connection established from client");

    // Send a message to the client upon connection
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

    // Handle incoming messages from the client
    ws.on('message', async (message: any) => {
        let returnMessage: ReturnMessage = {};
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
        if (messageID) {
            
            returnMessage['messageID'] = messageID;
        }
        
        // Log the response being sent back to the client
        console.log('Sending response to client:', returnMessage);
        
        // Stringify and send the response
        const responseString = JSON.stringify(returnMessage);
        console.log('Response size:', responseString.length, 'bytes');
        
        try {
            ws.send(responseString);
            console.log('Response sent successfully');
        } catch (error) {
            console.error('Error sending response to client:', error);
        }
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
        // Set default values for parameters to prevent timeout issues
        const { 
            playerNum, 
            levelSize, 
            gridSize, 
            joinedPlayers, 
            maxListLength = 20, 
            searchListLength = 100 
        } = parameters;

        console.log('Searching lobbies with parameters:', {
            playerNum, levelSize, gridSize, joinedPlayers, maxListLength, searchListLength
        });

        // Call getLobbies with the parameters
        const lobbySearchResults = await Lobby.getLobbies(
            redis, 
            playerNum, 
            levelSize, 
            gridSize, 
            joinedPlayers, 
            maxListLength, 
            searchListLength
        );
        console.log(`Found ${lobbySearchResults.length} matching lobbies`);
        
        // Log the first lobby for debugging if any exist
        if (lobbySearchResults.length > 0) {
            console.log('First lobby sample:', JSON.stringify(lobbySearchResults[0]).substring(0, 200) + '...');
        }
        
        // Convert each lobby to its JSON representation
        const lobbies = lobbySearchResults.map(lobby => lobby.toJSON());
        
        // Log the size of the lobbies array
        console.log('Lobbies array size:', JSON.stringify(lobbies).length, 'bytes');
        return {
            success: true,
            lobbies: lobbies,
            count: lobbies.length
        };
    } catch (error) {
        // Provide more detailed error information
        let errorMessage = 'Error searching lobbies';
        
        if (error instanceof Error) {
            errorMessage = `Error searching lobbies: ${error.message}`;
            console.error(errorMessage, error.stack);
        } else {
            console.error('Error searching lobbies:', error);
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}


/**
 * @function handleCreateLobby
 * @description Handles the createLobby message from the client
 * @param ws WebSocket connection
 * @param data Message data
 */
async function handleCreateLobby(ws: any, redis: Redis, parameters: any): Promise<object> {
    try {
        //Deconstruct the data received
        const { lobbyID, lobbyData, playerData } = parameters;

        console.log(`Creating lobby ${lobbyID} with data:`, lobbyData, playerData);

        // Call RedisManager to create the lobby
        let newLobby = await Lobby.createLobby(redis, lobbyID, lobbyData, playerData);
        console.log(`Lobby ${lobbyID} created successfully`);

        // Send response back to client
        return {
            success: true,
            message: `Lobby ${lobbyID} created successfully`,
            lobby: newLobby.toJSON()
        };
    } catch (error) {
        console.error('Error creating lobby:', error);
        return {
            success: false,
            error: 'Error creating lobby'
        };
    }
}
