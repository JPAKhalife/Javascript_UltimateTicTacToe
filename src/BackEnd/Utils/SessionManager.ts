/**
 * @file SessionManager.ts
 * @description Utilities for session token generation and validation
 * @author John Khalife
 * @created 2025-08-20
 */

import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import { AUTH_CONSTANTS, REDIS_KEYS } from '../Contants';

/**
 * @interface SessionData
 * @description Interface for session data stored in Redis
 */
export interface SessionData {
    sessionID: string;
    playerID: string;
    connectionID: string;
    createdAt: number;
    lastActive: number;
}

/**
 * @function generateSessionID
 * @description Generates a new session ID using nanoid
 * @returns {string} A new session ID
 */
export function generateSessionID(): string {
    return nanoid(AUTH_CONSTANTS.SESSION_ID_LENGTH);
}

/**
 * @function createSession
 * @description Creates a new session and stores it in Redis
 * @param {Redis} redisClient Redis client for database operations
 * @param {string} playerID The ID of the player associated with this session
 * @param {string} connectionID The ID of the connection associated with this session
 * @returns {Promise<string>} A promise that resolves to the new session ID
 */
export async function createSession(
    redisClient: Redis,
    playerID: string,
    connectionID: string
): Promise<string> {
    const sessionID = generateSessionID();
    const now = Date.now();
    
    const sessionData: SessionData = {
        sessionID,
        playerID,
        connectionID,
        createdAt: now,
        lastActive: now
    };
    
    // Store session data in Redis
    await redisClient.hset(
        REDIS_KEYS.SESSION(sessionID),
        'sessionID', sessionID,
        'playerID', playerID,
        'connectionID', connectionID,
        'createdAt', now.toString(),
        'lastActive', now.toString()
    );
    
    // Add session to player's sessions list
    await redisClient.sadd(REDIS_KEYS.PLAYER_SESSIONS(playerID), sessionID);
    
    return sessionID;
}

/**
 * @function validateSession
 * @description Validates a session ID and returns the associated session data
 * @param {Redis} redisClient Redis client for database operations
 * @param {string} sessionID The session ID to validate
 * @returns {Promise<SessionData | null>} A promise that resolves to the session data or null if invalid
 */
export async function validateSession(
    redisClient: Redis,
    sessionID: string
): Promise<SessionData | null> {
    // Check if session exists
    const exists = await redisClient.exists(REDIS_KEYS.SESSION(sessionID));
    if (!exists) {
        return null;
    }
    
    // Get session data
    const sessionData = await redisClient.hgetall(REDIS_KEYS.SESSION(sessionID));
    if (!sessionData || !sessionData.playerID || !sessionData.connectionID) {
        return null;
    }
    
    // Update last active timestamp
    const now = Date.now();
    await redisClient.hset(REDIS_KEYS.SESSION(sessionID), 'lastActive', now.toString());
    
    return {
        sessionID: sessionData.sessionID,
        playerID: sessionData.playerID,
        connectionID: sessionData.connectionID,
        createdAt: parseInt(sessionData.createdAt),
        lastActive: now
    };
}

/**
 * @function getSessionByConnectionID
 * @description Gets a session by connection ID
 * @param {Redis} redisClient Redis client for database operations
 * @param {string} connectionID The connection ID to look up
 * @returns {Promise<string | null>} A promise that resolves to the session ID or null if not found
 */
export async function getSessionByConnectionID(
    redisClient: Redis,
    connectionID: string
): Promise<string | null> {
    // This is a simplified implementation. In a production system, you might want to
    // use a secondary index or a more efficient lookup method.
    const sessionPrefix = 'session:';
    const keys = await redisClient.keys(`${sessionPrefix}*`);
    
    for (const key of keys) {
        const connID = await redisClient.hget(key, 'connectionID');
        if (connID === connectionID) {
            return key.substring(sessionPrefix.length); // Extract session ID from key
        }
    }
    
    return null;
}

/**
 * @function invalidateSession
 * @description Invalidates a session
 * @param {Redis} redisClient Redis client for database operations
 * @param {string} sessionID The session ID to invalidate
 * @returns {Promise<boolean>} A promise that resolves to true if successful
 */
export async function invalidateSession(
    redisClient: Redis,
    sessionID: string
): Promise<boolean> {
    // Get player ID before deleting session
    const playerID = await redisClient.hget(REDIS_KEYS.SESSION(sessionID), 'playerID');
    
    // Delete session
    await redisClient.del(REDIS_KEYS.SESSION(sessionID));
    
    // Remove from player's sessions list if player ID exists
    if (playerID) {
        await redisClient.srem(REDIS_KEYS.PLAYER_SESSIONS(playerID), sessionID);
    }
    
    return true;
}

/**
 * @function setSessionExpiry
 * @description Sets an expiry time on a session
 * @param {Redis} redisClient Redis client for database operations
 * @param {string} sessionID The session ID to set expiry on
 * @param {number} expirySeconds The number of seconds until expiry
 * @returns {Promise<boolean>} A promise that resolves to true if successful
 */
export async function setSessionExpiry(
    redisClient: Redis,
    sessionID: string,
    expirySeconds: number = AUTH_CONSTANTS.SESSION_EXPIRE_TIME
): Promise<boolean> {
    const key = REDIS_KEYS.SESSION(sessionID);
    const exists = await redisClient.exists(key);
    
    if (!exists) {
        return false;
    }
    
    await redisClient.expire(key, expirySeconds);
    return true;
}

/**
 * @function refreshSession
 * @description Refreshes a session by removing its expiry
 * @param {Redis} redisClient Redis client for database operations
 * @param {string} sessionID The session ID to refresh
 * @returns {Promise<boolean>} A promise that resolves to true if successful
 */
export async function refreshSession(
    redisClient: Redis,
    sessionID: string
): Promise<boolean> {
    const key = REDIS_KEYS.SESSION(sessionID);
    const exists = await redisClient.exists(key);
    
    if (!exists) {
        return false;
    }
    
    // Update last active timestamp
    const now = Date.now();
    await redisClient.hset(key, 'lastActive', now.toString());
    
    // Remove expiry
    await redisClient.persist(key);
    return true;
}
