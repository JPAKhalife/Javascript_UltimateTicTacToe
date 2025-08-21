/**
 * @file Connections.ts
 * @description This file contains methods relating to 
 * maintaining information about active connections.
 * This includes connectionID, as well as active sessions.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2025-08-20
 */

const activeWebsockets = new Map<string, any>(); // Map of connection IDs to WebSocket objects

import Redis from "ioredis";
import Player from "./Player";
import { AUTH_CONSTANTS, REDIS_KEYS } from "../Contants";

/**
 * @method newConnection
 * @description Registers a new WebSocket connection
 * @param redisClient Redis client for regular operations
 * @param ws WebSocket object
 * @param connectionID Unique connection ID
 */
export function newConnection(redisClient: Redis, ws: any, connectionID: string) {
    activeWebsockets.set(connectionID, ws);
    // Use Math.floor to ensure integer value for Redis expiration time
    redisClient.set(REDIS_KEYS.CONNECTION(connectionID), "", "EX", Math.floor(AUTH_CONSTANTS.CONNECTION_EXPIRE_TIME));
}

/**
 * @method playerRegistered
 * @description Associates a player ID with a connection ID
 * @param redisClient Redis client for regular operations
 * @param connectionID Connection ID to associate with
 * @param playerID Player ID to associate
 */
export function playerRegistered(redisClient: Redis, connectionID: string, playerID: string) {
    redisClient.set(REDIS_KEYS.CONNECTION(connectionID), playerID);
}

/**
 * @method getPlayerID
 * @description Gets the playerID from the database for a given connection
 * @param redisClient Redis client for regular operations
 * @param connectionID Connection ID to look up
 * @returns Player ID associated with the connection, or null if not found
 */
export async function getPlayerID(redisClient: Redis, connectionID: string): Promise<string | null> {
    return await redisClient.get(REDIS_KEYS.CONNECTION(connectionID));
}

/**
 * @method removeConnection
 * @description Removes a connection from the system
 * @param redisClient Redis client for regular operations
 * @param connectionID Connection ID to remove
 */
export async function removeConnection(redisClient: Redis, connectionID: string): Promise<void> {
    const playerID = await getPlayerID(redisClient, connectionID);
    if (playerID) {
        Player.removePlayer(redisClient, playerID);
    }
    redisClient.del(REDIS_KEYS.CONNECTION(connectionID));
    activeWebsockets.delete(connectionID);
}

/**
 * @method disconnect
 * @description Disconnects a WebSocket connection and removes it from the system
 * @param redisClient Redis client for regular operations
 * @param key Connection key or ID to disconnect
 */
export function disconnect(redisClient: Redis, key: string): void {
    // Extract the connection ID from the key if it's in the format "connection:connectionID"
    const prefix = 'connection:';
    const connectionID = key.startsWith(prefix) ? key.substring(prefix.length) : key;
    
    const ws = activeWebsockets.get(connectionID);
    if (ws) {
        try {
            ws.close();
            console.log(`WebSocket for connection ${connectionID} closed successfully`);
        } catch (error) {
            console.error(`Error closing WebSocket for connection ${connectionID}:`, error);
        }
    } else {
        console.log(`No active WebSocket found for connection ${connectionID}`);
    }
    
    removeConnection(redisClient, connectionID);
}



export function getWebsocketObject(connectionID: string) {
    return activeWebsockets.get(connectionID);
}
