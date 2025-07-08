/**
 * @file Lobby.ts
 * @description This file is intended to be used to house methods for lobbies.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Redis from "ioredis";
import Player from "./Player";

/*
example of a lobbyJSON object:
"lobby1: {
    "playerNum": 2,
    "playersJoined": 1,
    "levelSize": 2,
    "gridSize": 3
    "creator": "player1",
    "lobbyState": "waiting"
    "gameState": <any-length list-array of numbers>
    "players": [playerID, playerID2...]
}

All lobby IDs should be appended to a list called LobbyList for retrieveal
*/

// Import PlayerData interface from Player.ts or define a compatible one
export type PlayerData = {
    playerID: string;
    username: string;
    version?: number; // Added for optimistic locking
}

export type LobbyData = {
    playerNum: number;
    levelSize: number;
    gridSize: number;
    version?: number; // Added for optimistic locking
};

// This class's purpose is to perform operations relating to the lobby objects stored in redis
export default class Lobby {

    // Lobby members
    private playerNum: number;
    private playersJoined: number;
    private levelSize: number;
    private gridSize: number;
    private lobbyID: string;
    private creator: string;
    private lobbyState: string;
    private gameState: number[];
    private players: string[];
    private version?: number;

    // This constructor shall only be called internally. static methods must be called in order to create a lobby object
    private constructor(lobbyID: string, lobbyData: LobbyData, creatorID: string) {
        // Assign the relevant members
        this.playerNum = lobbyData.playerNum;
        this.levelSize = lobbyData.levelSize;
        this.gridSize = lobbyData.gridSize;
        this.lobbyID = lobbyID;
        this.creator = creatorID;
        this.playersJoined = 0;
        this.lobbyState = "waiting";
        this.gameState = [];
        this.players = [];
        this.version = lobbyData.version;
    }

    /**
     * @method fromRedisObject
     * @description Constructor that takes a Redis lobby object and creates a Lobby instance
     * @param lobbyID The ID of the lobby
     * @param redisObject The Redis object representing the lobby
     * @returns A new Lobby instance
     */
    private static fromRedisObject(lobbyID: string, redisObject: any): Lobby {
        const lobby = new Lobby(
            lobbyID,
            {
                playerNum: redisObject.playerNum,
                levelSize: redisObject.levelSize,
                gridSize: redisObject.gridSize,
                version: redisObject.version
            },
            redisObject.creator
        );
        
        // Set additional properties from Redis object
        lobby.playersJoined = redisObject.playersJoined;
        lobby.lobbyState = redisObject.lobbyState;
        lobby.gameState = redisObject.gameState;
        lobby.players = redisObject.players;
        
        return lobby;
    }

    /**
     * @method createLobby
     * @description This method is meant to create a lobby for a game and add the creator as the first player.
     * First creates the lobby, then uses Player.addPlayer to add the creator to the lobby.
     * @param redisClient The Redis client to use for database operations
     * @param lobbyID The ID of the lobby to be created
     * @param lobbyData The data to be stored in the lobby
     * @param playerData The data of the player creating the lobby
     * @returns A Lobby object representing the created lobby
     * @throws Error if lobby creation fails or player addition fails
     */
    static async createLobby(redisClient: Redis, lobbyID: string, lobbyData: LobbyData, playerData: PlayerData): Promise<Lobby> {
        try {
            // Check if lobby already exists
            const lobbyExists = await redisClient.exists(lobbyID);
            if (lobbyExists) {
                throw new Error(`Lobby ${lobbyID} already exists`);
            }

            // Create game state array based on gridSize
            const gameStateSize = (lobbyData.gridSize * lobbyData.gridSize) ^ lobbyData.levelSize;
            const gameState = new Array(gameStateSize).fill(0);

            // Create lobby object with version for optimistic locking
            const lobbyObject = {
                playerNum: lobbyData.playerNum,
                playersJoined: 0, // Start with 0 players, will be updated by Player.addPlayer
                levelSize: lobbyData.levelSize,
                gridSize: lobbyData.gridSize,
                creator: playerData.playerID,
                lobbyState: "waiting",
                gameState: gameState,
                players: [], // Start with empty players array, will be updated by Player.addPlayer
                version: 1 // Initial version
            };

            // Lua script for lobby creation only (no player manipulation)
            const luaScript = `
                -- Check if lobby exists
                if redis.call('EXISTS', KEYS[1]) == 1 then
                    return 0  -- Lobby exists
                end
                
                -- Store lobby data
                redis.call('SET', KEYS[1], ARGV[1])
                
                -- Add to lobby list
                redis.call('RPUSH', 'LobbyList', KEYS[1])
                
                return 1  -- Success
            `;

            // Execute the Lua script
            const result = await redisClient.eval(
                luaScript,
                1, // Number of keys
                lobbyID, // KEYS[1]
                JSON.stringify(lobbyObject) // ARGV[1]
            );

            if (result === 0) {
                throw new Error(`Lobby ${lobbyID} already exists`);
            }

            // Now add the player to the lobby using Player.addPlayer
            try {
                await Player.addPlayer(redisClient, lobbyID, playerData.username, playerData.playerID);
            } catch (error) {
                // If player addition fails, clean up by removing the lobby
                await redisClient.del(lobbyID);
                await redisClient.lrem('LobbyList', 0, lobbyID);
                
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error(`Failed to add player to lobby: ${error}`);
            }

            // Get the updated lobby object from Redis
            const updatedLobbyJson = await redisClient.get(lobbyID);
            if (!updatedLobbyJson) {
                throw new Error(`Failed to retrieve updated lobby data for ${lobbyID}`);
            }
            
            const updatedLobbyObject = JSON.parse(updatedLobbyJson);
            return Lobby.fromRedisObject(lobbyID, updatedLobbyObject);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error creating lobby ${lobbyID}: ${error}`);
        }
    }

    /**
     * @method removeLobby
     * @description This method removes a lobby from the database. This will occur when there are no longer any players connected to the lobby.
     * Uses a Lua script to ensure atomicity of the check and delete operations.
     * @param redisClient The Redis client to use for database operations
     * @param lobbyID The ID of the lobby to remove
     * @returns true if the lobby was successfully removed
     * @throws Error if lobby doesn't exist, has players, or operation fails
     */
    public async removeLobby(redisClient: Redis, lobbyID: string): Promise<boolean> {
        try {
            // Lua script for atomic lobby removal
            const luaScript = `
                -- Check if lobby exists
                if redis.call('EXISTS', KEYS[1]) == 0 then
                    return 0  -- Lobby doesn't exist
                end
                
                -- Get lobby data
                local lobbyJson = redis.call('GET', KEYS[1])
                if not lobbyJson then
                    return -1  -- Failed to retrieve lobby data
                end
                
                -- Parse lobby data
                local lobbyObject = cjson.decode(lobbyJson)
                
                -- Check if there are any players in the lobby
                if lobbyObject.players and #lobbyObject.players > 0 then
                    return -2  -- Players still in lobby
                end
                
                -- Remove the lobby from Redis
                redis.call('DEL', KEYS[1])
                
                -- Remove from lobby list
                redis.call('LREM', 'LobbyList', 0, KEYS[1])
                
                return 1  -- Success
            `;

            // Execute the Lua script
            const result = await redisClient.eval(
                luaScript,
                1, // Number of keys
                lobbyID // KEYS[1]
            );

            if (result === 0) {
                throw new Error(`Lobby ${lobbyID} does not exist`);
            } else if (result === -1) {
                throw new Error(`Failed to retrieve lobby data for ${lobbyID}`);
            } else if (result === -2) {
                throw new Error(`Error removing lobby ${lobbyID}: There are still players left in the lobby`);
            }

            return true;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error removing lobby ${lobbyID}: ${error}`);
        }
    }

    /**
     * @method doesLobbyExist
     * @description Checks if a lobby exists in the database
     * @param redisClient The Redis client to use for database operations
     * @param lobbyID The ID of the lobby to check
     * @returns true if the lobby exists, false otherwise
     * @throws Error if the operation fails
     */
    static async doesLobbyExist(redisClient: Redis, lobbyID: string): Promise<boolean> {
        try {
            return (await redisClient.exists(lobbyID)) > 0;
        } catch(error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error checking if lobby ${lobbyID} exists: ${error}`);
        }
    }

    /**
     * @method removePlayerFromLobby
     * @description Removes a player from a lobby
     * @param redisClient The Redis client to use for database operations
     * @param lobbyID The ID of the lobby to remove the player from
     * @param playerID The ID of the player to remove
     * @returns true if the player was successfully removed
     * @throws Error if lobby doesn't exist, player not in lobby, or operation fails
     */
    static async removePlayerFromLobby(redisClient: Redis, lobbyID: string, playerID: string): Promise<boolean> {
        try {
            // Check if lobby exists
            const lobbyExists = await redisClient.exists(lobbyID);
            if (!lobbyExists) {
                throw new Error(`Lobby ${lobbyID} does not exist`);
            }

            // Get lobby data
            const lobbyJson = await redisClient.get(lobbyID);
            if (!lobbyJson) {
                throw new Error(`Failed to retrieve lobby data for ${lobbyID}`);
            }

            const lobbyObject = JSON.parse(lobbyJson);

            // Check if player is in the lobby
            if (!lobbyObject.players.includes(playerID)) {
                throw new Error(`Player ${playerID} is not in lobby ${lobbyID}`);
            }

            // Maximum number of retries for optimistic locking
            const MAX_RETRIES = 3;
            let retries = 0;

            while (retries < MAX_RETRIES) {
                try {
                    // Watch the lobby key for changes
                    await redisClient.watch(lobbyID);

                    // Get the current version of the lobby
                    const currentLobbyJson = await redisClient.get(lobbyID);
                    if (!currentLobbyJson) {
                        await redisClient.unwatch();
                        throw new Error(`Lobby ${lobbyID} no longer exists`);
                    }

                    const currentLobbyObject = JSON.parse(currentLobbyJson);
                    
                    // Remove player from the lobby
                    const playerIndex = currentLobbyObject.players.indexOf(playerID);
                    if (playerIndex === -1) {
                        await redisClient.unwatch();
                        throw new Error(`Player ${playerID} is not in lobby ${lobbyID}`);
                    }

                    currentLobbyObject.players.splice(playerIndex, 1);
                    currentLobbyObject.playersJoined -= 1;
                    
                    // Update lobby state
                    if (currentLobbyObject.playersJoined === 0) {
                        currentLobbyObject.lobbyState = "empty";
                    } else {
                        currentLobbyObject.lobbyState = "waiting";
                    }

                    // Increment version for optimistic locking
                    currentLobbyObject.version = (currentLobbyObject.version || 0) + 1;

                    // Start a transaction
                    const multi = redisClient.multi();
                    multi.set(lobbyID, JSON.stringify(currentLobbyObject));

                    // Execute the transaction
                    const results = await multi.exec();

                    // If results is null, the transaction failed due to watched keys changing
                    if (results === null) {
                        if (retries < MAX_RETRIES - 1) {
                            retries++;
                            continue;
                        }
                        throw new Error(`Concurrent modification detected for lobby ${lobbyID}, retry limit reached`);
                    }

                    // Now update the player to remove the lobby reference
                    try {
                        // Get the player first to check if they're still in this lobby
                        const player = await Player.getPlayer(redisClient, playerID);
                        
                        // Only remove the player if they're still in this lobby
                        if (player.lobbyID === lobbyID) {
                            await Player.removePlayer(redisClient, playerID);
                        }
                    } catch (error) {
                        // If player doesn't exist or is not in this lobby, just continue
                        if (error instanceof Error && !error.message.includes("not found")) {
                            throw error;
                        }
                    }

                    return true;
                } catch (error) {
                    if (error instanceof Error && error.message.includes("Concurrent modification")) {
                        retries++;
                        continue;
                    }
                    throw error;
                }
            }

            throw new Error(`Failed to remove player ${playerID} from lobby ${lobbyID} after ${MAX_RETRIES} retries`);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error removing player ${playerID} from lobby ${lobbyID}: ${error}`);
        }
    }

    /**
     * @method getPlayersInLobby
     * @description Gets all players in a lobby
     * @param redisClient The Redis client to use for database operations
     * @param lobbyID The ID of the lobby to get players from
     * @returns An array of Player objects representing the players in the lobby
     * @throws Error if lobby doesn't exist or operation fails
     */
    static async getPlayersInLobby(redisClient: Redis, lobbyID: string): Promise<Player[]> {
        try {
            // Check if lobby exists
            const lobbyExists = await redisClient.exists(lobbyID);
            if (!lobbyExists) {
                throw new Error(`Lobby ${lobbyID} does not exist`);
            }

            // Get lobby data
            const lobbyJson = await redisClient.get(lobbyID);
            if (!lobbyJson) {
                throw new Error(`Failed to retrieve lobby data for ${lobbyID}`);
            }

            const lobbyObject = JSON.parse(lobbyJson);

            // Get all players in the lobby
            const players: Player[] = [];
            for (const playerID of lobbyObject.players) {
                try {
                    const player = await Player.getPlayer(redisClient, playerID);
                    players.push(player);
                } catch (error) {
                    // If a player can't be found, just skip them
                    console.error(`Could not find player ${playerID} in lobby ${lobbyID}`);
                }
            }

            return players;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error getting players in lobby ${lobbyID}: ${error}`);
        }
    }

    /**
     * @method getLobbies
     * @description This method is intended to be used in order to fetch a list of lobbies based on search parameters
     * @param gridSize - the number of slots in a single grid (one axis)
     * @param joinedPlayers - the number of players who are in the game (or spectating)
     * @param playerNum - the nnumber of players who can play the game
     * @param levelSize - the number of levels to the tictac grid
     * @param maxListLength - the maximum length of the list 
     * @param searchListLength - the number of spots on the list that will be searched (can be used to limit function time)
     * @param redisClient - The redis client being interacted with
     * @returns a list of lobby objects
     */
    static async getLobbies(
        redisClient: Redis,
        playerNum?: number,
        levelSize?: number,
        gridSize?: number,
        joinedPlayers?: number,
        maxListLength?: number,
        searchListLength?: number
    ): Promise<Lobby[]> {
        // Define a Lua script for searching lobbies
        const luaScript = `
            -- Get the list of all lobbies
            local lobbyList = redis.call('LRANGE', 'LobbyList', 0, ARGV[7] or -1)
            local matchingLobbies = {}
            local matchingKeys = {}
            local addedElements = 0

            for _, lobbyKey in ipairs(lobbyList) do
                local lobbyJson = redis.call('GET', lobbyKey)
                if lobbyJson then
                    local lobbyObject = cjson.decode(lobbyJson)

                    -- Apply filters
                    if (not ARGV[3] or tonumber(lobbyObject.playerNum) == tonumber(ARGV[3])) and
                       (not ARGV[4] or tonumber(lobbyObject.levelSize) == tonumber(ARGV[4])) and
                       (not ARGV[5] or tonumber(lobbyObject.gridSize) == tonumber(ARGV[5])) and
                       (not ARGV[6] or tonumber(lobbyObject.playersJoined) == tonumber(ARGV[6])) then
                        table.insert(matchingLobbies, lobbyJson)
                        table.insert(matchingKeys, lobbyKey)
                        addedElements = addedElements + 1
                    end

                    if (addedElements >= ARGV[1]) then
                        break
                    end
                end
            end

            return {matchingLobbies, matchingKeys}
        `;

        try {
            // Execute the Lua script
            const result = await redisClient.eval(
                luaScript,
                0, // No keys are passed
                maxListLength?.toString() || "-1", // ARGV[1]: Max list length
                playerNum?.toString() || "", // ARGV[3]: Player number filter
                levelSize?.toString() || "", // ARGV[4]: Level size filter
                gridSize?.toString() || "", // ARGV[5]: Grid size filter
                joinedPlayers?.toString() || "", // ARGV[6]: Joined players filter
                searchListLength?.toString() || "", // ARGV[7]: the length of the list to retrieve
            );
            

            // Parse the result into Lobby objects
            const lobbies: Lobby[] = [];
            const lobbyJsons = (result as any)[0];
            const lobbyKeys = (result as any)[1];
            
            for (let i = 0; i < lobbyJsons.length; i++) {
                const lobbyJson = lobbyJsons[i];
                const lobbyKey = lobbyKeys[i];
                const lobbyObject = JSON.parse(lobbyJson);
                // Use the fromRedisObject method to create a Lobby instance
                lobbies.push(Lobby.fromRedisObject(lobbyKey, lobbyObject));
            }
            return lobbies;
        } catch (error) {
            throw Error("There was an error calling getLobbies: " + error);
        }
    }

    /**
     * @method toJSON
     * @description Converts the Lobby object to a format suitable for JSON serialization and web requests
     * @returns An object representing the lobby that can be directly stringified to JSON
     */
    public toJSON(): Record<string, any> {
        return {
            lobbyID: this.lobbyID,
            playerNum: this.playerNum,
            playersJoined: this.playersJoined,
            levelSize: this.levelSize,
            gridSize: this.gridSize,
            creator: this.creator,
            lobbyState: this.lobbyState,
            gameState: this.gameState,
            players: this.players,
            // Exclude version as it's used for internal optimistic locking
        };
    }

    /**
     * @method getLobby
     * @description Get a single lobby based on ID
     * @param redisClient - the redisClient database
     * @param lobbyID - the ID of the lobby to fetch
     * @returns A lobby object or null if not found
     */
    static async getLobby(redisClient: Redis, lobbyID: string): Promise<Lobby | null> {
        try {
            // Check if the lobby exists
            const doesLobbyExist = await redisClient.exists(lobbyID);
            if (doesLobbyExist === 0) {
                return null;
            }

            // Get the lobby data from Redis
            const lobbyJson = await redisClient.get(lobbyID);
            if (!lobbyJson) {
                return null;
            }

            // Parse the JSON and create a Lobby object
            const lobbyObject = JSON.parse(lobbyJson);
            return Lobby.fromRedisObject(lobbyID, lobbyObject);
        } catch(error) {
            throw new Error(`There was an error calling getLobby: ${error}`);
        }
    }
}
