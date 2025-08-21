/**
 * @file Player.ts
 * @description This file is related to operations for players
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Redis from "ioredis";
import { REDIS_KEYS } from "../Contants";
const { v4: uuidv4 } = require('uuid');



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

    constructor(playerID: string, username: string, lobbyID?: string) {
        if (!playerID || playerID.trim() === "") {
            throw new Error("playerID cannot be empty");
        }
        if (!username || username.trim() === "") {
            throw new Error("username cannot be empty");
        }
        this.playerID = playerID;
        this.username = username;
        this.lobbyID = lobbyID ?? "";
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
                let doesUserNamesExist = await redisClient.exists(REDIS_KEYS.USERNAMES);
                if (doesUserNamesExist) {
                let playerID = await redisClient.hget(REDIS_KEYS.USERNAMES, identifier);
                if (playerID) {
                    let retrievedPlayer = await redisClient.hgetall(REDIS_KEYS.PLAYER(playerID));
                    if (retrievedPlayer && retrievedPlayer.playerID && retrievedPlayer.username) {
                        return new Player(retrievedPlayer.playerID, retrievedPlayer.username, retrievedPlayer.lobbyID);
                    }
                }
            } 
            } else {
                let retrievedPlayer = await redisClient.hgetall(REDIS_KEYS.PLAYER(identifier));
                if (retrievedPlayer && retrievedPlayer.playerID && retrievedPlayer.username) {
                    return new Player(retrievedPlayer.playerID, retrievedPlayer.username, retrievedPlayer.lobbyID);
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
    static async removePlayer(redisClient: Redis, playerID: string): Promise<boolean> {
        // Maximum number of retries for optimistic locking
        const MAX_RETRIES = 3;
        let retries = 0;

        while (retries < MAX_RETRIES) {
            try {
                //First grab the username of the player
                const username = await redisClient.hget(REDIS_KEYS.PLAYER(playerID), "username");
                const lobbyID = await redisClient.hget(REDIS_KEYS.PLAYER(playerID), "lobbyID");
                if (!username) {retries++; continue}
                //Create multi operation
                const multi = redisClient.multi();
                //Remove the username hash entry
                multi.hdel(REDIS_KEYS.USERNAMES, username);
                //Remove the player key entry
                multi.del(REDIS_KEYS.PLAYER(playerID));
                //remove player from playerlobbylist (no point in removing the creator yet)
                if (lobbyID) {
                    multi.lrem(REDIS_KEYS.LOBBY_PLAYERS(lobbyID), 0, playerID);
                }
                //Execute the transaction
                const results = await multi.exec();
                // If results is null, the transaction failed due to watched keys changing
                if (results === null) {
                    if (retries < MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new Error(`Concurrent modification detected for player ${playerID}, retry limit reached`);
                } else {
                    return true;
                }
            } catch(error) {
                retries++;
                console.log("Error detected attempting player removal: " + error + " attempting retry #" + retries)
                continue;
            }
        }
        return false;
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
    static async addPlayer(redisClient: Redis, lobbyID: string, playerID: string): Promise<Player> {
        // Maximum number of retries for optimistic locking
        const MAX_RETRIES = 3;
        let retries = 0;
        const lobbyKey = REDIS_KEYS.LOBBY(lobbyID);
        const lobbyPlayersKey = REDIS_KEYS.LOBBY_PLAYERS(lobbyID);
        const playerKey = REDIS_KEYS.PLAYER(playerID);
        while(retries < MAX_RETRIES) {
            try {
                // Watch the keys we're going to modify to detect changes
                await redisClient.watch(lobbyID, "Players");

                // Check if lobby exists
                const lobbyExists = await redisClient.exists(lobbyKey);
                if (!lobbyExists) {
                    await redisClient.unwatch();
                    throw new Error(`Lobby ${lobbyID} does not exist`);
                }

                //Check if the player being added exists
                if (!(await redisClient.exists(playerKey))) {
                    throw new Error(`Player ${playerID} does not exist`);
                }  

                // Get lobby data
                const lobby = await redisClient.hgetall(lobbyKey);
                if (!lobby) {
                    await redisClient.unwatch();
                    throw new Error(`Failed to retrieve lobby data for ${lobbyID}`);
                }


                // Check if lobby is full
                if (lobby.playersJoined >= lobby.playerNum) {
                    await redisClient.unwatch();
                    throw new Error(`Lobby ${lobbyID} is full`);
                }

                // Check if player is already in the lobby
                const lobbyPlayers = await redisClient.lrange(lobbyPlayersKey, 0, -1);
                if (lobbyPlayers.includes(playerID)) {
                    await redisClient.unwatch();
                    throw new Error(`Player ${playerID} is already in lobby ${lobbyID}`);
                }

                // Start a Redis transaction
                const multi = redisClient.multi();

                // Update lobby data with version for optimistic locking
                multi.hincrby(lobbyKey, "playersJoined", 1);
                multi.lpush(lobbyPlayersKey, playerID);

                // Update lobby state if it's now full
                if (lobby.playersJoined === lobby.playerNum) {
                    multi.hset(lobbyKey, "lobbyState", "ready");
                }
                // Increment version for optimistic locking
                multi.hincrby(lobbyKey, "version", 1);

                //Update player object to have proper lobbyID
                multi.hset(playerKey, "lobbyID", lobbyID);
                multi.hincrby(playerKey, "version", 1);

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
                let returnPlayer = await Player.getPlayer(redisClient, playerID);
                if (!returnPlayer) {
                    throw new Error(`Failed to retrieve player ${playerID} after adding to lobby ${lobbyID}`);
                }
                return returnPlayer;
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
     * @param lobbyID The ID of the lobby the player is currently in. null or zero means not joined.
     */
    static async createPlayer(redisClient: Redis, username: string, lobbyID?: string): Promise<Player | null> {
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
                let newPlayerID = uuidv4();
                multi.hset(
                    REDIS_KEYS.PLAYER(newPlayerID),
                    {
                        'playerID': newPlayerID,
                        'username': username,
                        'lobbyID': lobbyID,
                        'version': 0,
                    }
                )
                //Set the player's username hash
                multi.hset(REDIS_KEYS.USERNAMES, username, newPlayerID);
                    
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
                console.log("Return new player");
                return this.getPlayer(redisClient, newPlayerID, false);
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
     * @method getUsername
     * @description Returns the Username of the player
     * @returns Username as a string
     */
    public getUsername(): string {
        return this.username;
    }



}
