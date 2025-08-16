import Redis from 'ioredis';
import Lobby, { LobbyData } from './Database/Lobby';
import Player from './Database/Player';
import {
    newConnection,
    playerRegistered,
    getPlayerID,
    removeConnection,
    getConnectionByDeviceId,
    getWebsocketObject,
    storeDeviceConnection,
} from './Database/Connections';
import { URL } from 'url';
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
    console.log("WebSocket connection established from client");

    // Extract device ID from URL query parameters if present
    let deviceId: string | null = null;
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        deviceId = url.searchParams.get('deviceId');
        if (deviceId) {
            console.log(`Device ID provided: ${deviceId}`);
        }
    } catch (error) {
        console.error('Error parsing URL:', error);
    }

    // Check if this device already has an active connection
    if (deviceId) {
        const existingConnectionId = await getConnectionByDeviceId(redis, deviceId);
        if (existingConnectionId) {
            console.log(`Device ${deviceId} already has connection ${existingConnectionId}`);

            // Get the existing websocket object
            const existingWs = getWebsocketObject(existingConnectionId);
            if (existingWs) {
                // Close the existing connection
                try {
                    existingWs.send(JSON.stringify({
                        type: 'system',
                        message: 'You have connected from another session. This session will be closed.'
                    }));
                    existingWs.close(1000, "Replaced by newer connection");
                    console.log(`Closed existing connection ${existingConnectionId} for device ${deviceId}`);
                } catch (error) {
                    console.error(`Error closing existing connection: ${error}`);
                }
            }

            // Clean up the old connection
            removeConnection(redis, existingConnectionId, deviceId);
        }
    }

    // Assign a unique ID to the websocket connection
    if (!ws.id) {
        ws.id = uuidv4();
        newConnection(redis, ws, ws.id, deviceId || undefined);
        console.log(`Assigning connection ID: ${ws.id}${deviceId ? ` for device ${deviceId}` : ''}`);
    }
    // Handle cleanup when the connection is closed
    ws.on('close', () => {
        console.log(`WebSocket connection ${ws.id} closed`);
        removeConnection(redis, ws.id, deviceId || undefined);
    });

    // Handle incoming messages from the client
    ws.on('message', async (message: any) => {
        let returnMessage: ReturnMessage = {};
        let messageID: string | null = null;
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message from client:', data);
            messageID = data.messageID;
            let sentPlayerID = data?.playerID

            if (sentPlayerID && typeof sentPlayerID === 'string') {
                // Ensure that a valid playerID is present
                const playerID = await getPlayerID(redis, ws.id);
                if (playerID && playerID == sentPlayerID) {
                    // Handle message types for registered players
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
                } else {
                    returnMessage = {
                        success: false,
                        error: 'A valid playerID is required to perform this action.'
                    };
                }
            } else {
                //Handle message types for unregistered users
                if (data.type === 'registerPlayer') {
                    returnMessage = await handleRegisterPlayer(ws, redis, data.parameters);
                } else {
                    returnMessage = {
                        messageID: data.messageID,
                        message: 'Message received',
                        data
                    };
                }
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
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param parameters Search parameters
 * @returns Promise resolving to response object
 */
async function handleSearchLobbies(ws: any, redis: Redis, parameters: any): Promise<object> {
    try {
        // Set default values for parameters to prevent timeout issues
        const {
            playerNum,
            levelSize,
            gridSize,
            joinedPlayers,
            lobbyState,
            creator,
            allowSpectators,
            maxResults = 20,
            searchListLength = 100
        } = parameters;

        console.log('Searching lobbies with parameters:', {
            playerNum, levelSize, gridSize, joinedPlayers, maxResults, searchListLength
        });

        // Call getLobbies with the parameters
        const lobbySearchResults = await Lobby.getFilteredLobbies(
            redis,
            {
                playerNum: playerNum,
                levelSize: levelSize,
                gridSize: gridSize,
                playersJoined: joinedPlayers,
                creator: creator,
                lobbyState: lobbyState,
                allowSpectators: allowSpectators,
            },
            maxResults,
            searchListLength
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
 * @param redis Redis client for regular operations
 * @param parameters Lobby creation parameters
 * @returns Promise resolving to response object
 */
async function handleCreateLobby(ws: any, redis: Redis, parameters: any): Promise<object> {
    try {
        //Deconstruct the data received
        const { lobbyID, lobbyData, playerID } = parameters;
        // Cast lobbyData to a LobbyData object
        const lobbyDataObj: LobbyData = lobbyData as LobbyData;
        // Validate lobbyID and playerID
        if (!(checkValue(lobbyID, 36) && checkValue(playerID, 36))) {
            return {
                success: false,
                message: "The values passed in the request were not valid.",
            };
        }

        // Validate all values in lobbyData
        for (const [key, value] of Object.entries(lobbyDataObj)) {
            if (!checkValue(value as any, 36)) {
                return {
                    success: false,
                    message: `Invalid value for ${key} in lobbyData.`,
                };
            }
        }

        console.log(`Creating lobby ${lobbyID} with data:`, lobbyData, playerID);

        // Call RedisManager to create the lobby
        let newLobby = await Lobby.createLobby(redis, lobbyID, lobbyData, playerID);
        console.log(`Lobby ${lobbyID} created successfully`);

        // Send response back to client
        return {
            success: true,
            message: `Lobby ${lobbyID} created successfully`,
            lobby: await newLobby.lobbySummaryJson(redis)
        };
    } catch (error) {
        console.error('Error creating lobby:', error);
        return {
            success: false,
            error: 'Error creating lobby'
        };
    }
}

/**
 * @function handleRegisterPlayer
 * @description Handles the registration of a player
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param parameters Player registration parameters
 * @returns Promise resolving to response object
 */
async function handleRegisterPlayer(ws: any, redis: Redis, parameters: any): Promise<object> {
    //Deconstruct the data
    const { identifier, checkUsername } = parameters
    console.log("Checking if player " + identifier + " exists.")

    //Verify the values passed    
    if (!(checkValue(identifier, 36) && checkValue(checkUsername))) {
        return {
            success: false,
            message: "The values passed in the request were not valid.",
        }
    }

    //Check if the user is already registered.
    if ((await getPlayerID(redis, ws.id))) {
        return {
            success: false,
            message: "You are already registered to a player.",
        }
    }

    try {
        let newPlayer = await Player.createPlayer(redis, identifier);
        if (newPlayer != null && newPlayer != undefined) {
            playerRegistered(redis, ws.id, newPlayer.getPlayerID());
            return {
                success: true,
                message: "The player " + newPlayer.getUsername() + " was registered",
                playerID: newPlayer.getPlayerID()
            }
        }
    } catch (error) {
        return {
            success: false,
            message: "There was an error attempting to check the existence of the player: " + error,
        }
    }
    return {
        success: true,
        message: "The player already exists",
    }


}

/**
 * @function checkValue
 * @description Checks that a number is within tha appropriate range
 * @param value: the value to be checked - any type
 * @param maxValue the max value or length of th value
 * @param minValue the min value or length of the value
 */
function checkValue<T extends string | number>(value: T, maxValue: number = 0, minValue: number = 1): boolean {
    if (typeof value === 'string') {
        return value.length <= maxValue && value.length >= minValue;
    } else if (typeof value === 'number') {
        return value <= maxValue && value >= minValue;
    } else if (typeof value === 'boolean') {
        return true;
    }
    return false;
}
