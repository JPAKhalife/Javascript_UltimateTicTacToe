/**
 * @file redis.ts
 * @description This file is intended to be used to house methods for querying a Redis database.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Redis from 'ioredis'; // Import ioredis for Redis connection

type LobbyData = {
    playerNum: number;
    levelSize: number;
    gridSize: number;
};

type PlayerData = {
    playerNum: number;
    playerID: string;
}

/*
example of a lobbyJSON object:
"lobby1: {
    "playerNum": 2,
    "playersJoined": 1,
    "levelSize": 2,
    "gridSize": 3
    "creator": "player1",
    "lobbyState": "waiting"
    "gameState": [0,0,0,0,0,0,0,0,0]
    "players": [playerID, playerID2...]
}

Example of a playerJSON object for containing all players:
"Players": {
    "player1": {
        "playerName": "John",
        "lobbyName": "lobby1"
    }
    "player2": {
        "playerName": "Jane",
        "lobbyName": "lobby1"
    }
}
*/ 

export default class RedisManager {

    //A manager needs to have a client to connect to the Redis server
    private redisClient: Redis;
    private host: string;
    private port: number;

    constructor(host: string,port: number) {
        this.host = host;
        this.port = port;
        //Create the client object
        this.redisClient = new Redis({
            host: this.host,
            port: this.port,
        });
        this.redisClient.on('error', (err) => {
            console.error('Error occurred while connecting or accessing Redis server:', err);
        });
        this.redisClient.on('connect', () => {
            console.log('Connected to Redis server');
        });
    }

    /**
     * @method createLobby
     * @description This method is meant to create a lobby for a game.
     * @params lobbyID The ID of the lobby to be created
     * @params lobbyData The data to be stored in the lobby
     * @returns A boolean representing whether or not the lobby was created successfully
     */
    public async createLobby(lobbyID: string, lobbyData: LobbyData, playerData: PlayerData): Promise<boolean> {
        try {
            // Check if lobby already exists
            const lobbyExists = await this.redisClient.exists(lobbyID);
            if (lobbyExists) {
                console.log(`Lobby ${lobbyID} already exists`);
                return false;
            }

            //Check if player already exists
            const playerExists = await this.redisClient.exists(playerData.playerID);
            //If the player already exists, then they must be in a game.
            if (playerExists) {
                console.log('Player ' + playerData.playerID + ' already exists');
                return false;
            }

            // Create game state array based on gridSize
            const gameStateSize = (lobbyData.gridSize * lobbyData.gridSize) ^ lobbyData.levelSize;
            const gameState = new Array(gameStateSize).fill(0);

            // Create lobby object
            const lobbyObject = {
                playerNum: lobbyData.playerNum,
                playersJoined: 1, // Starting with 1 player (the creator)
                levelSize: lobbyData.levelSize,
                gridSize: lobbyData.gridSize,
                creator: playerData.playerID,
                lobbyState: "waiting",
                gameState: gameState,
                players: [playerData.playerID]
            };

            // Start a Redis transaction
            const multi = this.redisClient.multi();

            // Store lobby data
            multi.set(lobbyID, JSON.stringify(lobbyObject));

            // Check if Players object exists
            const playersExists = await this.redisClient.exists("Players");
            
            if (!playersExists) {
                // Create new Players object if it doesn't exist
                const playersObject: any = {};
                playersObject[playerData.playerID] = {
                    lobbyName: lobbyID
                };
                multi.set("Players", JSON.stringify(playersObject));
            } else {
                // Update existing Players object
                const playersJson = await this.redisClient.get("Players");
                if (playersJson) {
                    const playersObject = JSON.parse(playersJson);
                    playersObject[playerData.playerID] = {
                        lobbyName: lobbyID
                    };
                    multi.set("Players", JSON.stringify(playersObject));
                }
            }

            // Execute transaction
            await multi.exec();
            console.log(`Lobby ${lobbyID} created successfully`);
            return true;
        } catch (error) {
            console.error(`Error creating lobby ${lobbyID}:`, error);
            return false;
        }
    }

    /**
     * @method removeLobby
     * @description This method removes a lobby from the database. This will occur when there are no longer any players connected to the lobby.
     * @params lobbyID
     * @returns A boolean that states whether or not the deletion was successsful
     */
    public async removeLobby(lobbyID: string): Promise<boolean> {
        
        // Check if lobby already exists
        const lobbyExists = await this.redisClient.exists(lobbyID);
        if (!lobbyExists) {
            console.log(`Lobby ${lobbyID} does not exist`);
            return false;
        }

        try {
            // Retrieve lobby data
            const lobbyJson = await this.redisClient.get(lobbyID);
            if (!lobbyJson) {
                console.log(`Failed to retrieve lobby data for ${lobbyID}`);
                return false;
            }

            // Parse lobby data
            const lobbyObject = JSON.parse(lobbyJson);

            //Check if there are any players in the lobbyJson
            if (lobbyObject.players) {
                console.log('Error removing lobby ' + lobbyID + ': There are still players left in the lobby')
                return false;
            }

            // Remove the lobby from Redis
            await this.redisClient.del(lobbyID);
            console.log(`Lobby ${lobbyID} removed successfully`);
        } catch (error) {
            console.error(`Error removing lobby ${lobbyID}:`, error);
            return false;
        }
        return true;
    }

    /**
     * @method removePlayer
     * @description This method removes a player from the database. They must already not be in a lobby in order to be removed.
     * @params playerID
     * @returns A boolean indicating whether or not the deletion was successful.
     */
    public async removePlayer(playerID: string) {
        //Check if the player already exists
        let playersObject;
        try {
            let playersJson = await this.redisClient.get(playerID);
            playersObject = playersJson ? JSON.parse(playersJson) : null;
        } catch (error) {
            console.log("There was an error retrieving Players data while attempting to delete player " + playerID);
        }

        if (playersObject) {
            if (!playersObject[playerID]) {
                console.log(`Player ${playerID} does not exist.`);
                return false;
            }
            if (playersObject[playerID].lobbyID) {
                console.log('Player ' + playerID + 'is still in a lobby.');
            }
        }

        try {
            const multi = this.redisClient.multi();
            delete playersObject[playerID];
            multi.set("Players", JSON.stringify(playersObject));
            await multi.exec();
            console.log(`Player ${playerID} removed successfully`);
            return true;
        } catch (error) {
            console.error(`Error removing player ${playerID}:`, error);
            return false;
        }
    }



    /**
     * @method addPlayer
     * @description This method adds a player to a lobby and therefore puts them in multiplayer mode.
     * @params lobbyID The is of the lobby to add the player to
     * @params playerName The name of the player to add to the lobby
     * @params playerID The ID of the player to add to the lobby
     * @return A boolean representing whether or not the player was added successfully
     */
    public async addPlayer(lobbyID: string, playerName: string, playerID: string): Promise<boolean> {
        try {
            // Check if lobby exists
            const lobbyExists = await this.redisClient.exists(lobbyID);
            if (!lobbyExists) {
                console.log(`Lobby ${lobbyID} does not exist`);
                return false;
            }

            // Get lobby data
            const lobbyJson = await this.redisClient.get(lobbyID);
            if (!lobbyJson) {
                console.log(`Failed to retrieve lobby data for ${lobbyID}`);
                return false;
            }

            const lobbyObject = JSON.parse(lobbyJson);

            // Check if lobby is full
            if (lobbyObject.playersJoined >= lobbyObject.playerNum) {
                console.log(`Lobby ${lobbyID} is full`);
                return false;
            }

            // Check if player is already in the lobby
            if (lobbyObject.players.includes(playerID)) {
                console.log(`Player ${playerID} is already in lobby ${lobbyID}`);
                return false;
            }

            // Start a Redis transaction
            const multi = this.redisClient.multi();

            // Update lobby data
            lobbyObject.playersJoined += 1;
            lobbyObject.players.push(playerID);

            // Update lobby state if it's now full
            if (lobbyObject.playersJoined === lobbyObject.playerNum) {
                lobbyObject.lobbyState = "ready";
            }

            multi.set(lobbyID, JSON.stringify(lobbyObject));

            // Update player data
            const playersJson = await this.redisClient.get("Players");
            if (playersJson) {
                const playersObject = JSON.parse(playersJson);
                playersObject[playerID] = {
                    playerName: playerName,
                    lobbyName: lobbyID
                };
                multi.set("Players", JSON.stringify(playersObject));
            } else {
                // Create Players object if it doesn't exist
                const playersObject: any = {};
                playersObject[playerID] = {
                    playerName: playerName,
                    lobbyName: lobbyID
                };
                multi.set("Players", JSON.stringify(playersObject));
            }

            // Execute transaction
            await multi.exec();
            console.log(`Player ${playerID} added to lobby ${lobbyID} successfully`);
            return true;
        } catch (error) {
            console.error(`Error adding player ${playerID} to lobby ${lobbyID}:`, error);
            return false;
        }
    }
}
