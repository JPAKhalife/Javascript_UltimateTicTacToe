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
Possible example of a lobbyJSON object:
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
        //First I need to add the entry to the lobby dictionary
        try {
            this.redisClient.sadd('lobbyList', lobbyName);
        } catch (error) {
            console.error('Error occurred while entering lobby into set:', error);
            return false;
        }
        
        //Then I need to create a lobby object with the data
        try {
            this.redisClient.hset(lobbyName, 'playerNum', lobbyData.playerNum);
            this.redisClient.hset(lobbyName, 'playersJoined', 0);
            this.redisClient.hset(lobbyName, 'levelSize', lobbyData.levelSize);
            this.redisClient.hset(lobbyName, 'gridSize', lobbyData.gridSize);
            this.redisClient.hset(lobbyName, 'creator', playerData.playerID);
        } catch (error) {
            console.error('Error occurred while creating lobby hash:', error);
            return false;
        }
        //A Lobby may only be created by a player. Therefore, Add the player now.
        this.addPlayer(lobbyName, playerData.playerName,playerData.playerID);
        return true;

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
        let playersJoined;
        let playerNum;
        try {
            //First get the number of players in the game.
            playersJoined = this.redisClient.hget(lobbyName, 'playersJoined');
            playerNum = this.redisClient.hget(lobbyName, 'playerNum');
        } catch(err) {
            console.error('Error occurred while getting number of players in lobby:', err);
            return false;
        }
        //Make sure that you CAN add that player to the lobby.
        if (playersJoined >= playerNum) {
            console.error('Error: Cannot add player to lobby. Lobby is full.');
            return false;
        }
       
        try {

            
            //this.redisClient.hset(lobbyName, 'player1', playerData.playerID);
            this.redisClient.hset(lobbyName, 'playersJoined', 1);
            //Add the player to the player set
            this.redisClient.sadd('Players', playerID);
            this.redisClient.hset(lobbyName, 'playersJoined', 1);
            //Add the player to the lobby
            // this.redisClient.sadd(lobbyName, 'player' +  , playerID);
            //Add the player as a hash set and put in their username + lobbyname
            this.redisClient.hset(playerID, 'playerName', playerName, 'lobbyName',lobbyName);
        } catch (error) {
            console.error('Error occurred while adding player to lobby:', error);
            return false;
        }
        return true;
    }

}
