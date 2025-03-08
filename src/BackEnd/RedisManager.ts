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
    playerName: string;
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
     * @params lobbyName The name of the lobby to be created
     * @params lobbyData The data to be stored in the lobby
     * @returns A boolean representing whether or not the lobby was created successfully
     */
    public createLobby(lobbyName: string, lobbyData: LobbyData, playerData: PlayerData): boolean {
        //This method has yet to be implemented
        return false;
    }

    /**
     * @method addPlayer
     * @description This method adds a player to a lobby and therefore puts them in multiplayer mode.
     * @params lobbyName The name of the lobby to add the player to
     * @params playerName The name of the player to add to the lobby
     * @params playerID The ID of the player to add to the lobby
     * @return A boolean representing whether or not the player was added successfully
     */
    public addPlayer(lobbyName: string, playerName: string, playerID: string): boolean {
        //This method has yet to be implemented
        return false;
    }
}
