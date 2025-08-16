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
example of a lobby hash:
"lobby:<lobbyID> {
    "lobbyID:"
    "playerNum": 2,
    "playersJoined": 1,
    "levelSize": 2,
    "gridSize": 3
    "creator": "player1",
    "lobbyState": "waiting"
}

    "gameState:<lobbyID> ": <any-length list-array of numbers>
    "lobbyplayers:<lobbyID> : [playerID, playerID2...]

    

All lobby IDs should be appended to a list called LobbyList for retrieveal
*/


export type LobbyData = {
    playerNum: number;
    levelSize: number;
    gridSize: number;
    allowSpectators: boolean;
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
     * @method fromRedisData
     * @description Constructor that takes Redis data and creates a Lobby instance
     * @param lobbyID The ID of the lobby
     * @param lobbyHash The Redis hash data representing the lobby
     * @param gameState The game state array
     * @param players The players array
     * @returns A new Lobby instance
     */
    private static fromRedisData(
        lobbyID: string,
        lobbyHash: Record<string, string>,
        gameState: number[],
        players: string[]
    ): Lobby {
        const lobby = new Lobby(
            lobbyID,
            {
                playerNum: parseInt(lobbyHash.playerNum),
                levelSize: parseInt(lobbyHash.levelSize),
                gridSize: parseInt(lobbyHash.gridSize),
                allowSpectators: lobbyHash.allowSpectators === "true",
                version: lobbyHash.version ? parseInt(lobbyHash.version) : undefined
            },
            lobbyHash.creator
        );

        // Set additional properties from Redis data
        lobby.playersJoined = parseInt(lobbyHash.playersJoined);
        lobby.lobbyState = lobbyHash.lobbyState;
        lobby.gameState = gameState;
        lobby.players = players;

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
    static async createLobby(redisClient: Redis, lobbyID: string, lobbyData: LobbyData, playerID: string): Promise<Lobby> {
        try {
            // Check if lobby already exists
            const lobbyKey = `lobby:${lobbyID}`;
            const lobbyExists = await redisClient.exists(lobbyKey);
            if (lobbyExists) {
                throw new Error(`Lobby ${lobbyID} already exists`);
            }

            // Create game state array based on gridSize
            const gameStateSize = Math.pow(lobbyData.gridSize * lobbyData.gridSize, lobbyData.levelSize);
            const gameState = new Array(gameStateSize).fill(0);
            console.log(`Created game state array with size ${gameStateSize}`);

            // Create lobby hash fields
            const lobbyHash = {
                playerNum: lobbyData.playerNum.toString(),
                playersJoined: "0", // Start with 0 players, will be updated by Player.addPlayer
                levelSize: lobbyData.levelSize.toString(),
                gridSize: lobbyData.gridSize.toString(),
                creator: playerID,
                lobbyState: "waiting",
                allowSpectators: lobbyData.allowSpectators,
                version: "1" // Initial version
            };

            // Use a transaction to create the lobby
            const multi = redisClient.multi();

            // Store lobby data as a hash
            multi.hset(lobbyKey, lobbyHash);

            // Store game state as a separate list
            const gameStateKey = `gamestate:${lobbyID}`;
            if (gameState.length > 0) {
                multi.del(gameStateKey); // Ensure the list is empty
                multi.rpush(gameStateKey, ...gameState.map(val => val.toString()));
            }

            // Create empty players list
            const playersKey = `lobbyplayers:${lobbyID}`;
            multi.del(playersKey);

            // Add to lobby list
            multi.rpush('LobbyList', lobbyID);

            // Execute the transaction
            await multi.exec();

            // Now add the player to the lobby using Player.addPlayer
            try {
                await Player.addPlayer(redisClient, lobbyID, playerID);
            } catch (error) {
                // If player addition fails, clean up by removing the lobby
                const cleanupMulti = redisClient.multi();
                cleanupMulti.del(lobbyKey);
                cleanupMulti.del(gameStateKey);
                cleanupMulti.del(playersKey);
                cleanupMulti.lrem('LobbyList', 0, lobbyID);
                await cleanupMulti.exec();

                if (error instanceof Error) {
                    throw error;
                }
                throw new Error(`Failed to add player to lobby: ${error}`);
            }

            // Get the updated lobby data from Redis
            const [lobbyHashData, gameStateData, playersData] = await Promise.all([
                redisClient.hgetall(lobbyKey),
                redisClient.lrange(gameStateKey, 0, -1),
                redisClient.lrange(playersKey, 0, -1)
            ]);

            if (!lobbyHashData || Object.keys(lobbyHashData).length === 0) {
                throw new Error(`Failed to retrieve updated lobby data for ${lobbyID}`);
            }

            // Convert game state strings to numbers
            const gameStateArray = gameStateData.map(val => parseInt(val));

            return Lobby.fromRedisData(lobbyID, lobbyHashData, gameStateArray, playersData);
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
     * Uses a transaction to ensure atomicity of the check and delete operations.
     * @param redisClient The Redis client to use for database operations
     * @param lobbyID The ID of the lobby to remove
     * @returns true if the lobby was successfully removed
     * @throws Error if lobby doesn't exist, has players, or operation fails
     */
    public async removeLobby(redisClient: Redis, lobbyID: string): Promise<boolean> {
        try {
            const lobbyKey = `lobby:${lobbyID}`;
            const gameStateKey = `gamestate:${lobbyID}`;
            const playersKey = `lobbyplayers:${lobbyID}`;

            // Check if lobby exists
            const lobbyExists = await redisClient.exists(lobbyKey);
            if (!lobbyExists) {
                throw new Error(`Lobby ${lobbyID} does not exist`);
            }

            // Check if there are any players in the lobby
            const playerCount = await redisClient.llen(playersKey);
            if (playerCount > 0) {
                throw new Error(`Error removing lobby ${lobbyID}: There are still players left in the lobby`);
            }

            // Use a transaction to remove the lobby and related data
            const multi = redisClient.multi();
            multi.del(lobbyKey);
            multi.del(gameStateKey);
            multi.del(playersKey);
            multi.lrem('LobbyList', 0, lobbyID);

            await multi.exec();

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
            const lobbyKey = `lobby:${lobbyID}`;
            return (await redisClient.exists(lobbyKey)) > 0;
        } catch (error) {
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
            const lobbyKey = `lobby:${lobbyID}`;
            const playersKey = `lobbyplayers:${lobbyID}`;

            // Check if lobby exists
            const lobbyExists = await redisClient.exists(lobbyKey);
            if (!lobbyExists) {
                throw new Error(`Lobby ${lobbyID} does not exist`);
            }

            // Check if player is in the lobby
            const isPlayerInLobby = await redisClient.lpos(playersKey, playerID);
            if (isPlayerInLobby === null) {
                throw new Error(`Player ${playerID} is not in lobby ${lobbyID}`);
            }

            // Maximum number of retries for optimistic locking
            const MAX_RETRIES = 3;
            let retries = 0;

            while (retries < MAX_RETRIES) {
                try {
                    // Watch the lobby hash and players list for changes
                    await redisClient.watch(lobbyKey, playersKey);

                    // Get the current version of the lobby
                    const version = await redisClient.hget(lobbyKey, 'version');
                    if (!version) {
                        await redisClient.unwatch();
                        throw new Error(`Lobby ${lobbyID} no longer exists or is missing version`);
                    }

                    // Get current players joined count
                    const playersJoined = await redisClient.hget(lobbyKey, 'playersJoined');
                    if (!playersJoined) {
                        await redisClient.unwatch();
                        throw new Error(`Failed to get players joined count for lobby ${lobbyID}`);
                    }

                    // Calculate new values
                    const newPlayersJoined = Math.max(0, parseInt(playersJoined) - 1);
                    const newLobbyState = newPlayersJoined === 0 ? "empty" : "waiting";
                    const newVersion = parseInt(version) + 1;

                    // Start a transaction
                    const multi = redisClient.multi();

                    // Update lobby hash
                    multi.hset(lobbyKey, {
                        playersJoined: newPlayersJoined.toString(),
                        lobbyState: newLobbyState,
                        version: newVersion.toString()
                    });

                    // Remove player from players list
                    multi.lrem(playersKey, 0, playerID);

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
                        if (player && player.getLobbyID() === lobbyID) {
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
            const lobbyKey = `lobby:${lobbyID}`;
            const playersKey = `lobbyplayers:${lobbyID}`;

            // Check if lobby exists
            const lobbyExists = await redisClient.exists(lobbyKey);
            if (!lobbyExists) {
                throw new Error(`Lobby ${lobbyID} does not exist`);
            }

            // Get players from the separate list
            const playerIDs = await redisClient.lrange(playersKey, 0, -1);

            // Get all players in the lobby
            const players: Player[] = [];
            for (const playerID of playerIDs) {
                try {
                    const player = await Player.getPlayer(redisClient, playerID);
                    if (player) {
                        players.push(player);
                    }
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
            const lobbyKey = `lobby:${lobbyID}`;
            const gameStateKey = `gamestate:${lobbyID}`;
            const playersKey = `lobbyplayers:${lobbyID}`;
            
            // Check if the lobby exists
            const doesLobbyExist = await redisClient.exists(lobbyKey);
            if (doesLobbyExist === 0) {
                return null;
            }

            // Get the lobby data from Redis
            const [lobbyHashData, gameStateData, playersData] = await Promise.all([
                redisClient.hgetall(lobbyKey),
                redisClient.lrange(gameStateKey, 0, -1),
                redisClient.lrange(playersKey, 0, -1)
            ]);

            if (!lobbyHashData || Object.keys(lobbyHashData).length === 0) {
                return null;
            }
            
            // Convert game state strings to numbers
            const gameStateArray = gameStateData.map(val => parseInt(val));
            
            return Lobby.fromRedisData(lobbyID, lobbyHashData, gameStateArray, playersData);
        } catch (error) {
            throw new Error(`There was an error calling getLobby: ${error}`);
        }
    }

    /**
     * @method getSortedLobbies
     * @description Get lobbies sorted by a specified attribute
     * @param redisClient - The Redis client to use for database operations
     * @param sortBy - The attribute to sort by (playerNum, levelSize, gridSize, playersJoined, creator, lobbyState)
     * @param sortOrder - The sort order (asc or desc)
     * @param maxResults - The maximum number of results to return
     * @param searchListLength - The number of lobbies to search from the beginning of the list
     * @returns A list of sorted lobby objects
     */
    static async getSortedLobbies(
        redisClient: Redis,
        sortBy: 'playerNum' | 'levelSize' | 'gridSize' | 'playersJoined' | 'creator' | 'lobbyState',
        sortOrder: 'asc' | 'desc' = 'asc',
        maxResults: number = 20,
        searchListLength: number = 100
    ): Promise<Lobby[]> {
        try {
            // Get the list of all lobbies with a limit to prevent timeout
            const lobbyIDs = await redisClient.lrange('LobbyList', 0, searchListLength);
            
            if (lobbyIDs.length === 0) {
                return [];
            }

            // Get all lobby data in parallel
            const lobbies: Lobby[] = [];
            const lobbyPromises = lobbyIDs.map(async (lobbyID) => {
                try {
                    const lobby = await Lobby.getLobby(redisClient, lobbyID);
                    if (lobby) {
                        lobbies.push(lobby);
                    }
                } catch (error) {
                    console.error(`Error getting lobby ${lobbyID}:`, error);
                    // Skip this lobby if there's an error
                }
            });

            await Promise.all(lobbyPromises);

            // Sort the lobbies based on the specified attribute
            lobbies.sort((a, b) => {
                let valueA: any;
                let valueB: any;

                // Extract the values to compare based on the sortBy parameter
                switch (sortBy) {
                    case 'playerNum':
                        valueA = a.playerNum;
                        valueB = b.playerNum;
                        break;
                    case 'levelSize':
                        valueA = a.levelSize;
                        valueB = b.levelSize;
                        break;
                    case 'gridSize':
                        valueA = a.gridSize;
                        valueB = b.gridSize;
                        break;
                    case 'playersJoined':
                        valueA = a.playersJoined;
                        valueB = b.playersJoined;
                        break;
                    case 'creator':
                        valueA = a.creator;
                        valueB = b.creator;
                        break;
                    case 'lobbyState':
                        valueA = a.lobbyState;
                        valueB = b.lobbyState;
                        break;
                    default:
                        valueA = 0;
                        valueB = 0;
                }

                // For string values, use localeCompare
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortOrder === 'asc' 
                        ? valueA.localeCompare(valueB) 
                        : valueB.localeCompare(valueA);
                }

                // For numeric values, use subtraction
                return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
            });

            // Return only the requested number of results
            return lobbies.slice(0, maxResults);
        } catch (error) {
            console.error("Error in getSortedLobbies:", error);
            if (error instanceof Error) {
                throw new Error(`There was an error calling getSortedLobbies: ${error.message}`);
            } else {
                throw new Error(`There was an error calling getSortedLobbies: ${error}`);
            }
        }
    }

    /**
     * @method getFilteredLobbies
     * @description Get lobbies that match specific filter criteria
     * @param redisClient - The Redis client to use for database operations
     * @param filters - An object containing filter criteria
     * @param maxResults - The maximum number of results to return
     * @param searchListLength - The number of lobbies to search from the beginning of the list
     * @returns A list of filtered lobby objects
     */
    static async getFilteredLobbies(
        redisClient: Redis,
        filters: {
            playerNum?: number,
            levelSize?: number,
            gridSize?: number,
            playersJoined?: number,
            lobbyState?: string,
            creator?: string
        },
        maxResults: number = 20,
        searchListLength: number = 100
    ): Promise<Lobby[]> {
        try {
            // Get the list of all lobbies with a limit to prevent timeout
            const lobbyIDs = await redisClient.lrange('LobbyList', 0, searchListLength);
            
            if (lobbyIDs.length === 0) {
                return [];
            }

            // Get all lobby data in parallel
            const lobbies: Lobby[] = [];
            const lobbyPromises = lobbyIDs.map(async (lobbyID) => {
                try {
                    const lobby = await Lobby.getLobby(redisClient, lobbyID);
                    if (lobby) {
                        lobbies.push(lobby);
                    }
                } catch (error) {
                    console.error(`Error getting lobby ${lobbyID}:`, error);
                    // Skip this lobby if there's an error
                }
            });

            await Promise.all(lobbyPromises);

            // Filter the lobbies based on the specified criteria
            const filteredLobbies = lobbies.filter(lobby => {
                // Check each filter criterion
                if (filters.playerNum !== undefined && lobby.playerNum !== filters.playerNum) {
                    return false;
                }
                if (filters.levelSize !== undefined && lobby.levelSize !== filters.levelSize) {
                    return false;
                }
                if (filters.gridSize !== undefined && lobby.gridSize !== filters.gridSize) {
                    return false;
                }
                if (filters.playersJoined !== undefined && lobby.playersJoined !== filters.playersJoined) {
                    return false;
                }
                if (filters.lobbyState !== undefined && lobby.lobbyState !== filters.lobbyState) {
                    return false;
                }
                if (filters.creator !== undefined && lobby.creator !== filters.creator) {
                    return false;
                }
                
                // If all criteria pass, include this lobby
                return true;
            });

            // Return only the requested number of results
            return filteredLobbies.slice(0, maxResults);
        } catch (error) {
            console.error("Error in getFilteredLobbies:", error);
            if (error instanceof Error) {
                throw new Error(`There was an error calling getFilteredLobbies: ${error.message}`);
            } else {
                throw new Error(`There was an error calling getFilteredLobbies: ${error}`);
            }
        }
    }
}
