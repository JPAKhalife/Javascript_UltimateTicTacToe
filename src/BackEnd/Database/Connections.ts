/**
 * @file Connections.ts
 * @description This file contains methods relating to 
 * maintaining information about active connections
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

const activeWebsockets = new Map<string, any>(); // Map of connection IDs to WebSocket objects
const deviceConnections = new Map<string, string>(); // Map of device IDs to connection IDs

import Redis from "ioredis";
import Player from "./Player";
const EXPIRE_TIME = Math.floor(3600 / 4); // Ensure integer value for Redis expiration time

/**
 * @method newConnection
 * @description Registers a new WebSocket connection
 * @param redisClient Redis client for regular operations
 * @param ws WebSocket object
 * @param connectionID Unique connection ID
 * @param deviceID Optional device ID to associate with this connection
 */
export function newConnection(redisClient: Redis, ws: any, connectionID: string, deviceID?: string) {
    activeWebsockets.set(connectionID, ws);
    // Use Math.floor to ensure integer value for Redis expiration time
    redisClient.set(`connection:${connectionID}`, "", "EX", Math.floor(EXPIRE_TIME));
    
    // If a device ID is provided, associate it with this connection
    if (deviceID) {
        storeDeviceConnection(redisClient, deviceID, connectionID);
    }
}

/**
 * @method storeDeviceConnection
 * @description Associates a device ID with a connection ID
 * @param redisClient Redis client for regular operations
 * @param deviceID Device ID to associate
 * @param connectionID Connection ID to associate with
 */
export function storeDeviceConnection(redisClient: Redis, deviceID: string, connectionID: string) {
    // Store in memory
    deviceConnections.set(deviceID, connectionID);
    
    // Store in Redis with the same expiration time as the connection
    redisClient.set(`device:${deviceID}`, connectionID, "EX", Math.floor(EXPIRE_TIME));
}

/**
 * @method getConnectionByDeviceId
 * @description Gets the connection ID associated with a device ID
 * @param redisClient Redis client for regular operations
 * @param deviceID Device ID to look up
 * @returns Connection ID associated with the device, or null if not found
 */
export async function getConnectionByDeviceId(redisClient: Redis, deviceID: string): Promise<string | null> {
    // First check in-memory map for faster access
    const connectionID = deviceConnections.get(deviceID);
    if (connectionID) {
        return connectionID;
    }
    
    // If not found in memory, check Redis
    return await redisClient.get(`device:${deviceID}`);
}

/**
 * @method playerRegistered
 * @description Associates a player ID with a connection ID
 * @param redisClient Redis client for regular operations
 * @param connectionID Connection ID to associate with
 * @param playerID Player ID to associate
 */
export function playerRegistered(redisClient: Redis, connectionID: string, playerID: string) {
    redisClient.set(`connection:${connectionID}`, playerID);
}

/**
 * @method getPlayerID
 * @description Gets the playerID from the database for a given connection
 * @param redisClient Redis client for regular operations
 * @param connectionID Connection ID to look up
 * @returns Player ID associated with the connection, or null if not found
 */
export async function getPlayerID(redisClient: Redis, connectionID: string): Promise<string | null> {
    return await redisClient.get("connection:" + connectionID);
}

/**
 * @method removeConnection
 * @description Removes a connection from the system
 * @param redisClient Redis client for regular operations
 * @param connectionID Connection ID to remove
 * @param deviceID Optional device ID associated with this connection
 */
export async function removeConnection(redisClient: Redis, connectionID: string, deviceID?: string): Promise<void> {
    const playerID = await getPlayerID(redisClient, connectionID);
    if (playerID) {
        Player.removePlayer(redisClient, playerID);
    }
    redisClient.del(`connection:${connectionID}`);
    activeWebsockets.delete(connectionID);
    // If a device ID is provided, remove the device-to-connection mapping
    if (deviceID) {
        redisClient.del(`device:${deviceID}`);
        deviceConnections.delete(deviceID);
    } else {
        // If no device ID is provided, try to find and remove any device mappings for this connection
        for (const [deviceId, connId] of deviceConnections.entries()) {
            if (connId === connectionID) {
                redisClient.del(`device:${deviceId}`);
                deviceConnections.delete(deviceId);
                break; // Assuming one device can only have one connection
            }
        }
    }

}

/**
 * @method disconnect
 * @description Disconnects a WebSocket connection and removes it from the system
 * @param redisClient Redis client for regular operations
 * @param key Connection key or ID to disconnect
 */
export function disconnect(redisClient: Redis, key: string): void {
    // Extract the connection ID from the key if it's in the format "connection:connectionID"
    const connectionID = key.startsWith('connection:') ? key.substring('connection:'.length) : key;
    
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
