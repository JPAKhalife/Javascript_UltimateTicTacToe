/**
 * @file Player.ts
 * @description This file is related to operations for players
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


/** 
    Player structure
    PlayerList {
    {
        playerID: xxx,
        username: xxx,
        lobbyID: xxx,
    }
    
    }
*/

// Player interface to define the structure of a player object
interface PlayerData {
    playerID: string;
    username: string;
    lobbyID?: string;
}

// Players object structure in Redis
interface PlayersObject {
    version: number;
    playerList: PlayerData[];
}

export default class Player {
    playerID: string;
    username: string;
    lobbyID?: string;

    constructor(playerID: string, username: string, lobbyID?: string) {
        this.playerID = playerID;
        this.username = username;
        this.lobbyID = lobbyID;
    }

    /**
     * @method getPlayer
     * @description This method retrieves a player from the database by their ID.
     * @param redisClient The Redis client to use for database operations
     * @param playerID The ID of the player to retrieve
     * @returns A Player object if found
     * @throws Error if player not found or database operation fails
     */
    static async getPlayer(redisClient: any, playerID: string): Promise<Player> {
        try {
            // Get the Players object
            const playersJson = await redisClient.get("Players");
            if (!playersJson) {
                throw new Error("Players object does not exist");
            }

            const playersObject: PlayersObject = JSON.parse(playersJson);

            // Check if playerList exists
            if (!playersObject.playerList || !Array.isArray(playersObject.playerList)) {
                throw new Error("Player list does not exist or is not an array");
            }

            // Find player in the list
            const playerData = playersObject.playerList.find(p => p.playerID === playerID);
            if (!playerData) {
                throw new Error(`Player ${playerID} not found`);
            }

            // Return a new Player instance
            return new Player(playerData.playerID, playerData.username, playerData.lobbyID);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error getting player ${playerID}: ${error}`);
        }
    }

    /**
     * @method removePlayer
     * @description This method removes a player from the database. They must already not be in a lobby in order to be removed.
     * Uses optimistic locking with versioning to handle race conditions.
     * @param redisClient The Redis client to use for database operations
     * @param playerID The ID of the player to remove
     * @returns true if the player was successfully removed
     * @throws Error if player not found, is in a lobby, or database operation fails
     */
    static async removePlayer(redisClient: any, playerID: string): Promise<boolean> {
        // Maximum number of retries for optimistic locking
        const MAX_RETRIES = 3;
        let retries = 0;

        while (retries < MAX_RETRIES) {
            try {
                // Get the Players object
                const playersJson = await redisClient.get("Players");
                if (!playersJson) {
                    throw new Error("Players object does not exist");
                }

                const playersObject: PlayersObject = JSON.parse(playersJson);

                // Ensure playerList exists and is an array
                if (!playersObject.playerList || !Array.isArray(playersObject.playerList)) {
                    playersObject.playerList = [];
                }

                // Find player in the list
                const playerIndex = playersObject.playerList.findIndex(p => p.playerID === playerID);
                
                // Check if player exists
                if (playerIndex === -1) {
                    throw new Error(`Player ${playerID} does not exist`);
                }

                // Check if player is in a lobby
                if (playersObject.playerList[playerIndex].lobbyID) {
                    throw new Error(`Player ${playerID} is still in a lobby`);
                }

                // Get current version
                const currentVersion = playersObject.version || 0;

                // Remove player from the list
                playersObject.playerList.splice(playerIndex, 1);

                // Increment version for optimistic locking
                playersObject.version = currentVersion + 1;

                // Use Lua script for atomic update with version check
                const luaScript = `
                    local playersJson = redis.call('GET', KEYS[1])
                    if not playersJson then
                        return 0  -- Players object doesn't exist
                    end
                    
                    local playersObject = cjson.decode(playersJson)
                    
                    -- Check version for optimistic locking
                    if playersObject.version ~= tonumber(ARGV[1]) then
                        return -1  -- Version mismatch, concurrent modification detected
                    end
                    
                    -- Update Players object
                    redis.call('SET', KEYS[1], ARGV[2])
                    
                    return 1  -- Success
                `;

                const result = await redisClient.eval(
                    luaScript,
                    1, // Number of keys
                    "Players", // KEYS[1]
                    currentVersion, // ARGV[1]
                    JSON.stringify(playersObject) // ARGV[2]
                );

                if (result === 0) {
                    throw new Error("Players object does not exist");
                } else if (result === -1) {
                    if (retries < MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new Error(`Concurrent modification detected for Players object, retry limit reached`);
                }

                return true;
            } catch (error) {
                if (error instanceof Error && error.message.includes("Concurrent modification")) {
                    retries++;
                    continue;
                }
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error(`Error removing player ${playerID}: ${error}`);
            }
        }

        throw new Error(`Failed to remove player ${playerID} after ${MAX_RETRIES} retries`);
    }

    /**
     * @method addPlayer
     * @description This method adds a player to a lobby and therefore puts them in multiplayer mode.
     * Uses watch/multi/exec pattern to handle race conditions.
     * @param redisClient The Redis client to use for database operations
     * @param lobbyID The ID of the lobby to add the player to
     * @param playerName The name of the player to add to the lobby
     * @param playerID The ID of the player to add to the lobby
     * @return A Player object representing the added player
     * @throws Error if lobby doesn't exist, is full, player already in lobby, or database operation fails
     */
    static async addPlayer(redisClient: any, lobbyID: string, playerName: string, playerID: string): Promise<Player> {
        // Maximum number of retries for optimistic locking
        const MAX_RETRIES = 3;
        let retries = 0;

        while(retries < MAX_RETRIES) {
            try {
                // Watch the keys we're going to modify to detect changes
                await redisClient.watch(lobbyID, "Players");

                // Check if lobby exists
                const lobbyExists = await redisClient.exists(lobbyID);
                if (!lobbyExists) {
                    await redisClient.unwatch();
                    throw new Error(`Lobby ${lobbyID} does not exist`);
                }

                // Get lobby data
                const lobbyJson = await redisClient.get(lobbyID);
                if (!lobbyJson) {
                    await redisClient.unwatch();
                    throw new Error(`Failed to retrieve lobby data for ${lobbyID}`);
                }

                const lobbyObject = JSON.parse(lobbyJson);

                // Check if lobby is full
                if (lobbyObject.playersJoined >= lobbyObject.playerNum) {
                    await redisClient.unwatch();
                    throw new Error(`Lobby ${lobbyID} is full`);
                }

                // Check if player is already in the lobby
                if (lobbyObject.players.includes(playerID)) {
                    await redisClient.unwatch();
                    throw new Error(`Player ${playerID} is already in lobby ${lobbyID}`);
                }

                // Start a Redis transaction
                const multi = redisClient.multi();

                // Update lobby data with version for optimistic locking
                lobbyObject.playersJoined += 1;
                lobbyObject.players.push(playerID);

                // Update lobby state if it's now full
                if (lobbyObject.playersJoined === lobbyObject.playerNum) {
                    lobbyObject.lobbyState = "ready";
                }

                // Increment version for optimistic locking
                lobbyObject.version = (lobbyObject.version || 0) + 1;

                multi.set(lobbyID, JSON.stringify(lobbyObject));

                // Update player data
                const playersJson = await redisClient.get("Players");
                let playersObject: PlayersObject;

                if (playersJson) {
                    playersObject = JSON.parse(playersJson);
                    // Ensure playerList exists and is an array
                    if (!playersObject.playerList || !Array.isArray(playersObject.playerList)) {
                        playersObject.playerList = [];
                    }
                } else {
                    // Initialize new Players object with empty list
                    playersObject = {
                        version: 0,
                        playerList: []
                    };
                }

                // Create new player data
                const newPlayer: PlayerData = {
                    playerID: playerID,
                    username: playerName,
                    lobbyID: lobbyID
                };

                // Add player to the list
                playersObject.playerList.push(newPlayer);

                // Increment version for optimistic locking
                playersObject.version = (playersObject.version || 0) + 1;

                multi.set("Players", JSON.stringify(playersObject));

                // Execute transaction
                const results = await multi.exec();

                // If results is null, the transaction failed due to watched keys changing
                if (results === null) {
                    if (retries < MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new Error(`Concurrent modification detected for lobby ${lobbyID}, retry limit reached`);
                }

                // Return a new Player instance
                return new Player(playerID, playerName, lobbyID);
            } catch (error) {
                if (error instanceof Error && error.message.includes("Concurrent modification")) {
                    retries++;
                    continue;
                }
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error(`Error adding player ${playerID} to lobby ${lobbyID}: ${error}`);
            }
        }
        
        throw new Error(`Failed to add player ${playerID} to lobby ${lobbyID} after ${MAX_RETRIES} retries`);
    }
}
