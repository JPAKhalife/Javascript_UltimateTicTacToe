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
import { Player } from "./Player";
import { AUTH_CONSTANTS, REDIS_KEYS } from "../Contants";
import { DatabaseManager } from "./DatabaseManager";

/**
 * @method newConnection
 * @description Registers a new WebSocket connection
 * @param ws WebSocket object
 * @param connectionID Unique connection ID
 */
export function newConnection(ws: any, connectionID: string) {
    let redisClient = DatabaseManager.getInstance().getRegularClient();
    console.log(`[Connections] Registering new WebSocket connection with ID: ${connectionID}`);
    console.log(`[Connections] WebSocket readyState: ${ws.readyState}`);
    
    // Store the WebSocket object in the activeWebsockets map
    activeWebsockets.set(connectionID, ws);
    console.log(`[Connections] activeWebsockets map size after adding: ${activeWebsockets.size}`);
    
    // Verify the WebSocket was added correctly
    const storedWs = activeWebsockets.get(connectionID);
    if (storedWs === ws) {
        console.log(`[Connections] WebSocket object successfully stored in activeWebsockets map`);
    } else {
        console.error(`[Connections] Failed to store WebSocket object in activeWebsockets map`);
    }
    
    // Use Math.floor to ensure integer value for Redis expiration time
    console.log(`[Connections] Setting Redis key for connection: ${REDIS_KEYS.CONNECTION(connectionID)}`);
    redisClient.set(REDIS_KEYS.CONNECTION(connectionID), "", "EX", Math.floor(AUTH_CONSTANTS.CONNECTION_EXPIRE_TIME));
}

/**
 * @method playerRegistered
 * @description Associates a player ID with a connection ID
 * @param connectionID Connection ID to associate with
 * @param playerID Player ID to associate
 */
export function playerRegistered(connectionID: string, playerID: string) {
    console.log(`[Connections] Registering player ID ${playerID} with connection ID ${connectionID}`);
    
    // Check if the connection exists in the activeWebsockets map
    if (activeWebsockets.has(connectionID)) {
        console.log(`[Connections] Connection ID ${connectionID} found in activeWebsockets map`);
    } else {
        console.warn(`[Connections] Connection ID ${connectionID} NOT found in activeWebsockets map`);
    }
    
    // Set the player ID in Redis
    let redisClient = DatabaseManager.getInstance().getRegularClient();
    redisClient.set(REDIS_KEYS.CONNECTION(connectionID), playerID)
        .then(() => {
            console.log(`[Connections] Successfully set player ID ${playerID} for connection ${connectionID} in Redis`);
        })
        .catch(error => {
            console.error(`[Connections] Error setting player ID in Redis:`, error);
        });
}

/**
 * @method getPlayerID
 * @description Gets the playerID from the database for a given connection
 * @param connectionID Connection ID to look up
 * @returns Player ID associated with the connection, or null if not found
 */
export async function getPlayerID(connectionID: string): Promise<string | null> {
    let redisClient = DatabaseManager.getInstance().getRegularClient();
    return await redisClient.get(REDIS_KEYS.CONNECTION(connectionID));
}

/**
 * @method removeConnection
 * @description Removes a connection from the system and sets expiry on associated sessions
 * @param connectionID Connection ID to remove
 */
export async function removeConnection(connectionID: string): Promise<void> {
    let redisClient = DatabaseManager.getInstance().getRegularClient();
    const playerID = await getPlayerID(connectionID);

    // Find all sessions associated with this connection and set expiry
    await setExpiryOnConnectionSessions(connectionID);

    //! It should not be neccessary to remove the player when removing a connection - we want reconnections to be possible
    // if (playerID) {
    //     Player.removePlayer(redisClient, playerID);
    // } 
    redisClient.del(REDIS_KEYS.CONNECTION(connectionID));
    activeWebsockets.delete(connectionID);
}

/**
 * @method setExpiryOnConnectionSessions
 * @description Sets expiry on all sessions associated with a connection ID
 * @param connectionID Connection ID to find sessions for
 */
async function setExpiryOnConnectionSessions(connectionID: string): Promise<void> {
    let redisClient = DatabaseManager.getInstance().getRegularClient();
    // This is a simplified implementation. In a production system, you might want to
    // use a secondary index or a more efficient lookup method.
    const sessionPrefix = 'session:';
    const keys = await redisClient.keys(`${sessionPrefix}*`);

    for (const key of keys) {
        const connID = await redisClient.hget(key, 'connectionID');
        if (connID === connectionID) {
            // Set expiry on this session
            await redisClient.expire(key, AUTH_CONSTANTS.SESSION_EXPIRE_TIME);
            console.log(`Set expiry on session ${key} associated with disconnected connection ${connectionID}`);
        }
    }
}

/**
 * @method disconnect
 * @description Disconnects a WebSocket connection and removes it from the system
 * @param key Connection key or ID to disconnect
 */
export function disconnect(key: string): void {
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

    removeConnection(connectionID);
}



export function getWebsocketObject(connectionID: string) {
    console.log(`[Connections] Getting WebSocket object for connection ID: ${connectionID}`);
    
    const ws = activeWebsockets.get(connectionID);
    
    if (ws) {
        console.log(`[Connections] WebSocket object found for connection ID: ${connectionID}, readyState: ${ws.readyState}`);
        return ws;
    } else {
        console.warn(`[Connections] No WebSocket object found for connection ID: ${connectionID}`);
        return null;
    }
}
