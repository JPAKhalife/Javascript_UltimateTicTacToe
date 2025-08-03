/**
 * @file Player.ts
 * @description This file is related to operations for players
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Redis from "ioredis";


/** 
    Player structure

    //PlayerID - player object hash
    //Username - PlayerID hash for registering new users

    PlayerHash {
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
    address: string;
    lobbyID?: string;
}

// Players object structure in Redis
interface PlayersObject {
    version: number;
    playerList: PlayerData[];
}

export default class Player {
    private playerID: string;
    private username: string;
    private lobbyID: string;
    private address: string;

    constructor(playerID: string, username: string, address?: string, lobbyID?: string) {
        this.playerID = playerID;
        this.username = username;
        this.lobbyID = lobbyID ?? "";
        this.address = address ?? ""
    }

    /**
     * @method getPlayer
     * @description This method retrieves a player from the database by their ID or username.
     * @param redisClient The Redis client to use for database operations
     * @param identifier The ID or username of the player to retrieve
     * @param byUsername A boolean indicating whether to search by username (default: false)
     * @returns A Player object if found
     * @throws Error database operation fails
     */
    static async getPlayer(redisClient: Redis, identifier: string, byUsername: boolean = false): Promise<Player | null> {
        try {
            if (byUsername) {
                //Check the existence of the usernames hash
                let doesUserNamesExist = await redisClient.exists("usernames");
                if (doesUserNamesExist) {
                let playerID = await redisClient.hget("usernames", identifier);
                if (playerID) {
                        let retrievedPlayer = await redisClient.hgetall(playerID);
                        return new Player(retrievedPlayer.playerID, retrievedPlayer.username, retrievedPlayer.address, retrievedPlayer.lobbyID)
                }
                } 
            } else {
                let retrievedPlayer = await redisClient.hgetall(identifier);
                if (retrievedPlayer) {
                    return new Player(retrievedPlayer.playerID, retrievedPlayer.username, retrievedPlayer.address, retrievedPlayer.lobbyID)
                }
            }
        } catch (error) {
            throw new Error("There was an error with database operations: " + error);
        } 
        return null;
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
    static async addPlayer(redisClient: Redis, lobbyID: string, playerName: string, playerID: string): Promise<Player> {
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
                    lobbyID: lobbyID,
                    address: "blah"
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

    /**
     * @method createPlayer
     * @description This method creates a player and adds it to the playerList
     * @param redisClient The Redis client to use for database operations
     * @param username The name of the player to add to the lobby
     * @param address The address of the person registering
     * @param lobbyID The ID of the lobby the player is currently in. null or zero means not joined.
     */
    static async createPlayer(redisClient: Redis, username: string, address?: string, lobbyID?: string): Promise<Player | null> {
        const MAX_RETRIES = 3;
        let retries = 0;
        try {
            //First check if the player already exists.
            if (await Player.getPlayer(redisClient,username,true)) {
                console.log("player exists")
                return null;
            }
        } catch (error) {
            throw Error("There was an error checking the existence of the player: " + error);
        }

        //If the player does not exist, then it can be created.
        // Create new player data
        while (retries < MAX_RETRIES) {
            try {
                console.log("Transaction started")
                // Start a Redis transaction
                const multi = redisClient.multi();
                //Set the player
                let newPlayerID = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                multi.hset(
                    newPlayerID,
                    {
                        'username': username,
                        'address': address ?? "none",
                        'lobbyID': lobbyID,
                        'version': 0,
                    }
                )
                //Set the player's username hash
                multi.hset("usernames", username, newPlayerID);
                    
                // Execute transaction
                console.log("Execute transaction")
                const results = await multi.exec();
                // If results are null, the transaction failed due to watched keys changing
                if (results === null) {
                    if (retries < MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new Error(`Concurrent modification detected for lobby ${lobbyID}, retry limit reached`);
                }

                return this.getPlayer(redisClient, newPlayerID, false)
            } catch (error) {
                throw Error("There was an error creating the player.");
            }
        }
        return null;
    }

    //Getter methods
    /**
     * @method getLobbyID
     * @description Returns the lobbyID of the player
     * @returns Lobby id as a string, or an empty string.
     */
    public getLobbyID(): string {
        return this.lobbyID ?? "";
    }

    /**
     * @method getPlayerID
     * @description Returns the playerID of the player
     * @returns playerID as a string
     */
    public getPlayerID(): string {
        return this.playerID
    }

    /**
     * @method getAddress
     * @description Returns the Address of the player
     * @returns Address as a string, or an empty string.
     */
    public getAddress(): string {
        return this.address
    }

    /**
     * @method getUsername
     * @description Returns the Username of the player
     * @returns Username as a string
     */
    public getUsername(): string {
        return this.username;
    }



}
