/**
 * @file Lobby.ts
 * @description This file is intended to be used to house methods for lobbies.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Redis from "ioredis";
import Player from "./Player";
import { REDIS_KEYS, ERROR_MESSAGES } from "../Contants";
import { v4 as uuidv4 } from "uuid";
import { DatabaseManager } from "./DatabaseManager";

/*
example of a lobby hash:
"lobby:<lobbyID> {
    "lobbyName:"
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
    lobbyName: string;
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
    private allowSpectators: boolean;
    private lobbyName: string;

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
        this.allowSpectators = lobbyData.allowSpectators;
        this.lobbyName = lobbyData.lobbyName;
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
                lobbyName: lobbyHash.lobbyName,
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
     * @param lobbyData The data to be stored in the lobby
     * @param playerID The data of the player creating the lobby
     * @returns A Lobby object representing the created lobby
     * @throws Error if lobby creation fails or player addition fails
     */
    static async createLobby(lobbyData: LobbyData, playerID: string): Promise<Lobby> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            //Generate a unique lobby ID
            let lobbyID = uuidv4();

            // Check if lobby name already exists in the lobby_names set
            const lobbyNameExists = await redisClient.sismember(REDIS_KEYS.LOBBY_NAMES, lobbyData.lobbyName.toLowerCase());
            if (lobbyNameExists) {
                throw new Error(ERROR_MESSAGES.LOBBY_NAME_EXISTS);
            }

            // Check if lobby already exists
            const lobbyKey = REDIS_KEYS.LOBBY(lobbyID);
            const lobbyExists = await redisClient.exists(lobbyKey);
            if (lobbyExists) {
                throw new Error(`Lobby ${lobbyData.lobbyName} already exists`);
            }

            // Create game state array based on gridSize
            const gameStateSize = Math.pow(lobbyData.gridSize * lobbyData.gridSize, lobbyData.levelSize);
            const gameState = new Array(gameStateSize).fill(0);
            console.log(`Created game state array with size ${gameStateSize}`);

            // Create lobby hash fields
            const lobbyHash = {
                lobbyID: lobbyID,
                lobbyName: lobbyData.lobbyName,
                playerNum: lobbyData.playerNum.toString(),
                playersJoined: 1, // Start with 0 players, will be updated by Player.addPlayer
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
            const gameStateKey = REDIS_KEYS.GAME_STATES(lobbyID);
            if (gameState.length > 0) {
                multi.del(gameStateKey); // Ensure the list is empty
                multi.rpush(gameStateKey, ...gameState.map(val => val.toString()));
            }

            // Create empty players list
            const playersKey = REDIS_KEYS.LOBBY_PLAYERS(lobbyID);
            multi.del(playersKey);

            // Add to lobby list and lobby names set
            multi.rpush('LobbyList', lobbyID); // Note: No REDIS_KEYS constant for LobbyList
            multi.sadd(REDIS_KEYS.LOBBY_NAMES, lobbyData.lobbyName.toLowerCase());

            // Execute the transaction
            const execResult = await multi.exec();
            if (!execResult) {
                throw new Error('Failed to create lobby - transaction failed');
            }

            // Now add the player to the lobby using Player.addPlayer
            try {
                await Player.addPlayer(lobbyID, playerID);
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
                throw new Error(`Failed to retrieve updated lobby data for ${lobbyData.lobbyName}`);
            }

            // Convert game state strings to numbers
            const gameStateArray = gameStateData.map(val => parseInt(val));

            return Lobby.fromRedisData(lobbyID, lobbyHashData, gameStateArray, playersData);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error creating lobby ${lobbyData.lobbyName}: ${error}`);
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
    public async removeLobby(lobbyID: string): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            const lobbyKey = REDIS_KEYS.LOBBY(lobbyID);
            const gameStateKey = `gamestate:${lobbyID}`; // Note: No REDIS_KEYS constant for gamestate
            const playersKey = REDIS_KEYS.LOBBY_PLAYERS(lobbyID);

            // Check if lobby exists and get its name
            const lobbyData = await redisClient.hgetall(lobbyKey);
            if (!lobbyData || Object.keys(lobbyData).length === 0) {
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
            multi.lrem('LobbyList', 0, lobbyID); // Note: No REDIS_KEYS constant for LobbyList
            multi.srem(REDIS_KEYS.LOBBY_NAMES, lobbyData.lobbyName.toLowerCase()); // Remove from lobby names set

            const execResult = await multi.exec();
            if (!execResult) {
                throw new Error('Failed to remove lobby - transaction failed');
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
    static async doesLobbyExist(lobbyID: string): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            const lobbyKey = REDIS_KEYS.LOBBY(lobbyID);
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
    static async removePlayerFromLobby(lobbyID: string, playerID: string): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            const lobbyKey = REDIS_KEYS.LOBBY(lobbyID);
            const playersKey = REDIS_KEYS.LOBBY_PLAYERS(lobbyID);

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
                        const player = await Player.getPlayer(playerID);

                        // Only remove the player if they're still in this lobby
                        if (player && player.getLobbyID() === lobbyID) {
                            await Player.removePlayer(playerID);
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
    static async getPlayersInLobby(lobbyID: string): Promise<Player[]> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            const lobbyKey = REDIS_KEYS.LOBBY(lobbyID);
            const playersKey = REDIS_KEYS.LOBBY_PLAYERS(lobbyID);

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
                    const player = await Player.getPlayer(playerID);
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
    public async lobbySummaryJson(): Promise<Record<string, any>> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        return {
            lobbyID: this.lobbyID,
            lobbyName: this.lobbyName,
            playerNum: this.playerNum,
            playersJoined: this.playersJoined,
            levelSize: this.levelSize,
            gridSize: this.gridSize,
            creator: (await Player.getPlayer(this.creator))?.getUsername() || "Unknown",
            lobbyState: this.lobbyState,
            allowSpectators: this.allowSpectators
        };
    }

    /**
     * @method getLobby
     * @description Get a single lobby based on ID
     * @param redisClient - the redisClient database
     * @param lobbyID - the ID of the lobby to fetch
     * @returns A lobby object or null if not found
     */
    static async getLobby(lobbyID: string): Promise<Lobby | null> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            const lobbyKey = REDIS_KEYS.LOBBY(lobbyID);
            const gameStateKey = `gamestate:${lobbyID}`; // Note: No REDIS_KEYS constant for gamestate
            const playersKey = REDIS_KEYS.LOBBY_PLAYERS(lobbyID);

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
        sortBy: 'playerNum' | 'levelSize' | 'gridSize' | 'playersJoined' | 'creator' | 'lobbyState',
        sortOrder: 'asc' | 'desc' = 'asc',
        maxResults: number = 20,
        searchListLength: number = 100
    ): Promise<Lobby[]> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            // Get the list of all lobbies with a limit to prevent timeout
            const lobbyIDs = await redisClient.lrange('LobbyList', 0, searchListLength); // Note: No REDIS_KEYS constant for LobbyList

            if (lobbyIDs.length === 0) {
                return [];
            }

            // Get all lobby data in parallel
            const lobbies: Lobby[] = [];
            const lobbyPromises = lobbyIDs.map(async (lobbyID) => {
                try {
                    const lobby = await Lobby.getLobby(lobbyID);
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
        filters: {
            playerNum?: number,
            levelSize?: number,
            gridSize?: number,
            playersJoined?: number,
            lobbyState?: string,
            creator?: string,
            allowSpectators?: boolean
        },
        maxResults: number = 20,
        searchListLength: number = 100
    ): Promise<Lobby[]> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
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
                    const lobby = await Lobby.getLobby(lobbyID);
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
                if (filters.allowSpectators !== undefined && lobby.allowSpectators !== filters.allowSpectators) {
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

    /**
        * @method getGameState
        * @description Gets the current game state array for the lobby
        * @returns The game state array
     */
    public getGameState(): number[] {
        return this.gameState;
    }

    /**
     * @method getPlayerNum
     * @description Getter for playerNum
     */
    public getPlayerNum(): number {
        return this.playerNum;
    }

    /**
     * @method getPlayersJoined
     * @description Getter for playersJoined
     */
    public getPlayersJoined(): number {
        return this.playersJoined;
    }

    /**
     * @method getLevelSize
     * @description Getter for levelSize
     */
    public getLevelSize(): number {
        return this.levelSize;
    }

    /**
     * @method getGridSize
     * @description Getter for gridSize
     */
    public getGridSize(): number {
        return this.gridSize;
    }

    /**
     * @method getLobbyID
     * @description Getter for lobbyID
     */
    public getLobbyID(): string {
        return this.lobbyID;
    }

    /**
     * @method getCreator
     * @description Getter for creator
     */
    public getCreator(): string {
        return this.creator;
    }

    /**
     * @method getLobbyState
     * @description Getter for lobbyState
     */
    public getLobbyState(): string {
        return this.lobbyState;
    }

    /**
     * @method getPlayers
     * @description Getter for players
     */
    public getPlayers(): string[] {
        return this.players;
    }

    /**
     * @method getVersion
     * @description Getter for version
     */
    public getVersion(): number | undefined {
        return this.version;
    }

    /**
     * @method getAllowSpectators
     * @description Getter for allowSpectators
     */
    public getAllowSpectators(): boolean {
        return this.allowSpectators;
    }

    /**
     * @method getLobbyName
     * @description Getter for lobbyName
     */
    public getLobbyName(): string {
        return this.lobbyName;
    }

    /**
     * @method setPlayerNum
     * @description Setter for playerNum that updates Redis
     */
    public async setPlayerNum(newPlayerNum: number): Promise<void> {
        await this.updateLobbyField('playerNum', newPlayerNum.toString());
        this.playerNum = newPlayerNum;
    }

    /**
     * @method setPlayersJoined
     * @description Setter for playersJoined that updates Redis
     */
    public async setPlayersJoined(newPlayersJoined: number): Promise<void> {
        await this.updateLobbyField('playersJoined', newPlayersJoined.toString());
        this.playersJoined = newPlayersJoined;
    }

    /**
     * @method setLevelSize
     * @description Setter for levelSize that updates Redis
     */
    public async setLevelSize(newLevelSize: number): Promise<void> {
        await this.updateLobbyField('levelSize', newLevelSize.toString());
        this.levelSize = newLevelSize;
    }

    /**
     * @method setGridSize
     * @description Setter for gridSize that updates Redis
     */
    public async setGridSize(newGridSize: number): Promise<void> {
        await this.updateLobbyField('gridSize', newGridSize.toString());
        this.gridSize = newGridSize;
    }

    /**
     * @method setLobbyState
     * @description Setter for lobbyState that updates Redis
     */
    public async setLobbyState(newLobbyState: string): Promise<void> {
        await this.updateLobbyField('lobbyState', newLobbyState);
        this.lobbyState = newLobbyState;
    }

    /**
     * @method setAllowSpectators
     * @description Setter for allowSpectators that updates Redis
     */
    public async setAllowSpectators(newAllowSpectators: boolean): Promise<void> {
        await this.updateLobbyField('allowSpectators', newAllowSpectators.toString());
        this.allowSpectators = newAllowSpectators;
    }

    /**
     * @method setLobbyName
     * @description Setter for lobbyName that updates Redis and lobby names set
     */
    public async setLobbyName(newLobbyName: string): Promise<void> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        const MAX_RETRIES = 3;
        let retries = 0;

        while (retries < MAX_RETRIES) {
            try {
                const lobbyKey = REDIS_KEYS.LOBBY(this.lobbyID);

                // Check if new lobby name already exists
                const lobbyNameExists = await redisClient.sismember(REDIS_KEYS.LOBBY_NAMES, newLobbyName.toLowerCase());
                if (lobbyNameExists && newLobbyName.toLowerCase() !== this.lobbyName.toLowerCase()) {
                    throw new Error(ERROR_MESSAGES.LOBBY_NAME_EXISTS);
                }

                // Watch the lobby for changes
                await redisClient.watch(lobbyKey);

                // Get current version
                const currentVersion = await redisClient.hget(lobbyKey, 'version');
                if (!currentVersion) {
                    await redisClient.unwatch();
                    throw new Error(`Lobby ${this.lobbyID} no longer exists`);
                }

                if (this.version !== undefined && parseInt(currentVersion) !== this.version) {
                    await redisClient.unwatch();
                    throw new Error('Concurrent modification detected');
                }

                const newVersion = parseInt(currentVersion) + 1;

                // Start transaction
                const multi = redisClient.multi();

                // Update lobby name in hash
                multi.hset(lobbyKey, {
                    lobbyName: newLobbyName,
                    version: newVersion.toString()
                });

                // Update lobby names set
                multi.srem(REDIS_KEYS.LOBBY_NAMES, this.lobbyName.toLowerCase());
                multi.sadd(REDIS_KEYS.LOBBY_NAMES, newLobbyName.toLowerCase());

                const results = await multi.exec();
                if (results === null) {
                    if (retries < MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new Error('Concurrent modification detected, retry limit reached');
                }

                // Update local state
                this.lobbyName = newLobbyName;
                this.version = newVersion;
                return;
            } catch (error) {
                if (error instanceof Error && error.message.includes('Concurrent modification')) {
                    retries++;
                    continue;
                }
                throw error;
            }
        }
    }

    /**
     * @method setGameState
     * @description Setter for gameState that updates Redis
     */
    public async setGameState(newGameState: number[]): Promise<void> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        try {
            const gameStateKey = REDIS_KEYS.GAME_STATES(this.lobbyID);

            // Clear existing game state and set new one
            const multi = redisClient.multi();
            multi.del(gameStateKey);
            if (newGameState.length > 0) {
                multi.rpush(gameStateKey, ...newGameState.map(val => val.toString()));
            }

            const results = await multi.exec();
            if (!results) {
                throw new Error('Failed to update game state');
            }

            // Update local state
            this.gameState = [...newGameState];
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Error updating game state for lobby ${this.lobbyID}: ${error}`);
        }
    }

    /**
     * @method updateLobbyField
     * @description Helper method to update a single field in the lobby hash with optimistic locking
     * @param field The field name to update
     * @param value The new value for the field
     */
    private async updateLobbyField(field: string, value: string): Promise<void> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        const MAX_RETRIES = 3;
        let retries = 0;

        while (retries < MAX_RETRIES) {
            try {
                const lobbyKey = REDIS_KEYS.LOBBY(this.lobbyID);

                // Watch the lobby for changes
                await redisClient.watch(lobbyKey);

                // Get current version
                const currentVersion = await redisClient.hget(lobbyKey, 'version');
                if (!currentVersion) {
                    await redisClient.unwatch();
                    throw new Error(`Lobby ${this.lobbyID} no longer exists`);
                }

                if (this.version !== undefined && parseInt(currentVersion) !== this.version) {
                    await redisClient.unwatch();
                    throw new Error('Concurrent modification detected');
                }

                const newVersion = parseInt(currentVersion) + 1;

                // Start transaction
                const multi = redisClient.multi();
                multi.hset(lobbyKey, {
                    [field]: value,
                    version: newVersion.toString()
                });

                const results = await multi.exec();
                if (results === null) {
                    if (retries < MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new Error('Concurrent modification detected, retry limit reached');
                }

                // Update local version
                this.version = newVersion;
                return;
            } catch (error) {
                if (error instanceof Error && error.message.includes('Concurrent modification')) {
                    retries++;
                    continue;
                }
                throw error;
            }
        }
    }
}
