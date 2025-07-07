/**
 * @file redis.ts
 * @description This file is intended to be used to house methods lobbies.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Redis from "ioredis";

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

All lobby names should be appended to a list for retrieveal
*/

export type PlayerData = {
    playerNum: number;
    playerID: string;
    version?: number; // Added for optimistic locking
}

export type LobbyData = {
    playerNum: number;
    levelSize: number;
    gridSize: number;
    version?: number; // Added for optimistic locking
};

//This class's purpose is to perform operations relating to the lobby objects stored in redis
export default class Lobby {

    //Lobby members
    private playerNum: number;
    private levelSize: number;
    private gridSize: number;

    //This constructor shall only be called internally. static methods must be called in order to create a lobby object
    private constructor(lobbyID: string, lobbyData: LobbyData, playerData: PlayerData) {
        //Assign the relevant members
        this.playerNum = lobbyData.playerNum;
        this.levelSize = lobbyData.levelSize;
        this.gridSize = lobbyData.gridSize;
        //TODO: Add player info to the members of the lobby
    }

    /**
     * @method createLobby
     * @description This method is meant to create a lobby for a game.
     * Uses a Lua script to ensure atomicity of the entire operation.
     * @params lobbyID The ID of the lobby to be created
     * @params lobbyData The data to be stored in the lobby
     * @returns A boolean representing whether or not the lobby was created successfully
     */
    static async createLobby(redisClient: Redis, lobbyID: string, lobbyData: LobbyData, playerData: PlayerData): Promise<Lobby> {
        try {
            // Create game state array based on gridSize
            const gameStateSize = (lobbyData.gridSize * lobbyData.gridSize) ^ lobbyData.levelSize;
            const gameState = new Array(gameStateSize).fill(0);

            // Create lobby object with version for optimistic locking
            const lobbyObject = {
                playerNum: lobbyData.playerNum,
                playersJoined: 1, // Starting with 1 player (the creator)
                levelSize: lobbyData.levelSize,
                gridSize: lobbyData.gridSize,
                creator: playerData.playerID,
                lobbyState: "waiting",
                gameState: gameState,
                players: [playerData.playerID],
                version: 1 // Initial version
            };

            // Lua script for atomic lobby creation
            const luaScript = `
                -- Check if lobby exists
                if redis.call('EXISTS', KEYS[1]) == 1 then
                    return 0  -- Lobby exists
                end
                
                -- Check if player exists in Players object
                local playersExists = redis.call('EXISTS', 'Players')
                if playersExists == 1 then
                    local playersJson = redis.call('GET', 'Players')
                    if playersJson then
                        local playersObject = cjson.decode(playersJson)
                        if playersObject[ARGV[2]] then
                            return -1  -- Player exists
                        end
                    end
                end
                
                -- Store lobby data
                redis.call('SET', KEYS[1], ARGV[1])
                
                -- Add to lobby list
                redis.call('RPUSH', 'LobbyList', KEYS[1])
                
                -- Update Players object
                local playersObject = {}
                if playersExists == 1 then
                    local playersJson = redis.call('GET', 'Players')
                    if playersJson then
                        playersObject = cjson.decode(playersJson)
                    end
                end
                
                -- Add player to Players object
                playersObject[ARGV[2]] = {
                    lobbyName = KEYS[1]
                }
                
                -- Store updated Players object
                redis.call('SET', 'Players', cjson.encode(playersObject))
                
                return 1  -- Success
            `;

            // Execute the Lua script
            const result = await redisClient.eval(
                luaScript,
                1, // Number of keys
                lobbyID, // KEYS[1]
                JSON.stringify(lobbyObject), // ARGV[1]
                playerData.playerID // ARGV[2]
            );

            if (result === 0) {
                throw Error(`Lobby ${lobbyID} already exists`);
            } else if (result === -1) {
                throw Error('Player ' + playerData.playerID + ' already exists')
            }

            console.log(`Lobby ${lobbyID} created successfully`);
            return new Lobby(lobbyID, lobbyData, playerData);
        } catch (error) {
            throw Error(`Error creating lobby ${lobbyID}:`, error)
        }
    }

    /**
     * @method removeLobby
     * @description This method removes a lobby from the database. This will occur when there are no longer any players connected to the lobby.
     * Uses a Lua script to ensure atomicity of the check and delete operations.
     * @params lobbyID
     * @returns A boolean that states whether or not the deletion was successsful
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
                console.log(`Lobby ${lobbyID} does not exist`);
                return false;
            } else if (result === -1) {
                console.log(`Failed to retrieve lobby data for ${lobbyID}`);
                return false;
            } else if (result === -2) {
                console.log(`Error removing lobby ${lobbyID}: There are still players left in the lobby`);
                return false;
            }

            console.log(`Lobby ${lobbyID} removed successfully`);
            return true;
        } catch (error) {
            console.error(`Error removing lobby ${lobbyID}:`, error);
            return false;
        }
    }

    static async doesLobbyExist(redisClient: Redis, lobbyID: string): Promise<boolean> {
        try {
            return (await redisClient.exists(lobbyID)) > 0;
        } catch(error) {
            console.error("Error checking for existing Lobby: " + error);
            return false;
        }
    }
}