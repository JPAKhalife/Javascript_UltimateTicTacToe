/**
 * @file Session.ts
 * @description Utilities for session token generation and validation
 * @author John Khalife
 * @created 2025-08-20
 */

import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import { AUTH_CONSTANTS, REDIS_KEYS, ENV_CONFIG } from '../Contants';
import crypto from 'crypto';
import { DatabaseManager } from './DatabaseManager';

/**
 * @interface SessionData
 * @description Interface for session data stored in Redis
 */
export interface SessionData {
    sessionID: string;
    playerID: string;
    connectionID: string;
    createdAt: string;
    lastActive: string;
    ip: string;
    agent: string;
}

/**
 * @class Session
 * @description Class for managing user sessions
 */
export default class Session {
    private sessionID: string;
    private playerID: string;
    private connectionID: string;
    private createdAt: string;
    private lastActive: string;
    private ip: string;
    private agent: string;

    /**
     * @constructor
     * @description Creates a new Session instance
     * @param {string} sessionID The session ID
     * @param {string} playerID The player ID associated with this session
     * @param {string} connectionID The connection ID associated with this session
     * @param {number} createdAt The timestamp when the session was created
     * @param {number} lastActive The timestamp when the session was last active
     * @param {string} ip The IP address associated with this session
     * @param {string} agent The user agent hash associated with this session
     */
    constructor(
        sessionID: string,
        playerID: string,
        connectionID: string,
        createdAt: string,
        lastActive: string,
        ip: string = '',
        agent: string = ''
    ) {
        if (!sessionID || sessionID.trim() === "") {
            throw new Error("sessionID cannot be empty");
        }
        if (!playerID || playerID.trim() === "") {
            throw new Error("playerID cannot be empty");
        }
        if (!connectionID || connectionID.trim() === "") {
            throw new Error("connectionID cannot be empty");
        }

        this.sessionID = sessionID;
        this.playerID = playerID;
        this.connectionID = connectionID;
        this.createdAt = createdAt;
        this.lastActive = lastActive;
        this.ip = ip;
        this.agent = agent;
    }

    static initializeWithSessionData(sessionData: SessionData): Session {
        return new Session(sessionData.sessionID, sessionData.playerID, sessionData.connectionID, sessionData.createdAt, sessionData.lastActive, sessionData.ip, sessionData.agent);
    }

    /**
     * @method generateSessionID
     * @description Generates a new session ID using nanoid
     * @returns {string} A new session ID
     */
    static generateSessionID(): string {
        return nanoid(AUTH_CONSTANTS.SESSION_ID_LENGTH);
    }

    /**
     * @method getClientInfo
     * @description Extracts and processes client information from request
     * @param {any} req The request object
     * @returns {object} The processed client information
     */
    private static getClientInfo(req: any): { ip: string, agent: string } {
        // Get IP address
        const ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            '0.0.0.0';

        // Get and hash user agent
        const userAgent = req.headers['user-agent'] || 'unknown';
        const agent = crypto
            .createHash('sha256')
            .update(userAgent)
            .digest('base64url')
            .substring(0, 16); // Keep it reasonably short

        return { ip, agent };
    }

    /**
     * @method generateHmacToken
     * @description Generates an HMAC token with the specified components
     * @param {string} baseId The base identifier
     * @param {number} timestamp The token creation timestamp
     * @param {string} agent The user agent hash
     * @param {string} ip The client IP address
     * @returns {string} The HMAC signature
     */
    private static generateHmacToken(baseId: string, timestamp: number, agent: string, ip: string): string {
        // Encode all parts of the token to prevent delimiter issues and add obfuscation
        const encodedBaseId = Buffer.from(baseId).toString('base64url');
        const encodedTimestamp = Buffer.from(timestamp.toString()).toString('base64url');
        const encodedAgent = Buffer.from(agent).toString('base64url');
        const encodedIp = Buffer.from(ip).toString('base64url');
        
        const payload = `${encodedBaseId}.${encodedTimestamp}.${encodedAgent}.${encodedIp}`;

        // Create HMAC signature using the server's secret key
        const signature = crypto
            .createHmac('sha256', ENV_CONFIG.DEFAULT_SECRET_KEY)
            .update(payload)
            .digest('base64url');

        // Return the complete token
        return `${payload}.${signature}`;
    }

    /**
     * @method parseAndVerifyToken
     * @description Parses and verifies an HMAC token
     * @param {string} token The token to verify
     * @returns {object|null} The parsed token data or null if invalid
     */
    private static parseAndVerifyToken(token: string): { baseId: string, timestamp: number, agent: string, ip: string } | null {
        try {
            // Split the token
            const parts = token.split('.');
            console.log("Token parts: ", parts);
            if (parts.length !== 5) { // encodedBaseId, encodedTimestamp, encodedAgent, encodedIp, signature
                return null;
            }

            // Extract encoded parts
            const [encodedBaseId, encodedTimestamp, encodedAgent, encodedIp, receivedSignature] = parts;

            // Decode all parts
            const baseId = Buffer.from(encodedBaseId, 'base64url').toString();
            const timestampStr = Buffer.from(encodedTimestamp, 'base64url').toString();
            const agent = Buffer.from(encodedAgent, 'base64url').toString();
            const ip = Buffer.from(encodedIp, 'base64url').toString();

            // Parse timestamp
            const timestamp = parseInt(timestampStr);
            if (isNaN(timestamp)) {
                console.error("Invalid timestamp format");
                return null;
            }

            // Recreate the payload with encoded values (important for signature verification)
            const payload = `${encodedBaseId}.${encodedTimestamp}.${encodedAgent}.${encodedIp}`;
            
            // Recalculate signature
            const expectedSignature = crypto
                .createHmac('sha256', ENV_CONFIG.DEFAULT_SECRET_KEY)
                .update(payload)
                .digest('base64url');

            // Verify signature
            if (receivedSignature !== expectedSignature) {
                console.error("Signature mismatch");
                return null; // Signature mismatch
            }

            return { baseId, timestamp, agent, ip };
        } catch (error) {
            console.error("Error parsing token:", error);
            return null;
        }
    }

    /**
     * @method createSession
     * @description Creates a new session and stores it in Redis
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} playerID The ID of the player associated with this session
     * @param {string} connectionID The ID of the connection associated with this session
     * @param {any} req The request object containing client information
     * @returns {Promise<string>} A promise that resolves to the new session token
     */
    static async createSession(
        playerID: string,
        connectionID: string,
        req: any
    ): Promise<string> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Generate base ID
        const baseId = this.generateSessionID();
        const now = Date.now();

        // Get client info
        const { ip, agent } = this.getClientInfo(req);

        // Create HMAC token
        const token = this.generateHmacToken(baseId, now, agent, ip);

        // Store session data in Redis (using baseId as the key)
        await redisClient.hset(
            REDIS_KEYS.SESSION(baseId),
            'sessionID', baseId,
            'playerID', playerID,
            'connectionID', connectionID,
            'createdAt', now.toString(),
            'lastActive', now.toString(),
            'ip', ip,
            'agent', agent
        );

        // Add session to player's sessions list
        await redisClient.sadd(REDIS_KEYS.PLAYER_SESSIONS(playerID), baseId);

        return token;
    }

    /**
     * @method validateSession
     * @description Validates a session ID and returns the associated session data
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} token The session token to validate
     * @param {any} req The request object containing client information
     * @returns {Promise<SessionManager | null>} A promise that resolves to the session manager or null if invalid
     */
    static async validateSession(
        token: string,
        req: any
    ): Promise<Session | null> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Parse and verify the token
        const tokenData = this.parseAndVerifyToken(token);
        if (!tokenData) {
            return null; // Invalid token
        }

        const { baseId, timestamp, agent, ip } = tokenData;

        console.log("Validate session: ", baseId, timestamp, agent, ip);
        // Check if token is expired
        const now = Date.now();
        // const tokenAge = now - timestamp;
        // if (tokenAge > AUTH_CONSTANTS.TOKEN_EXPIRY) {
        //     return null; // Token expired
        // }

        // // Optional: Verify client info hasn't changed significantly
        // const currentClientInfo = this.getClientInfo(req);
        // if (currentClientInfo.agent !== agent) {
        //     return null; // User agent changed
        // }

        // IP validation could be optional or configurable
        // Commented out by default as legitimate users might change IP addresses
        // if (currentClientInfo.ip !== ip) {
        //   return null; // IP changed
        // }

        // Check if session exists in Redis
        const sessionKey = REDIS_KEYS.SESSION(baseId);
        const exists = await redisClient.exists(sessionKey);
        if (!exists) {
            return null;
        }
        console.log("Session key does exist")

        // Get session data
        const sessionData = await redisClient.hgetall(sessionKey);
        if (!sessionData || !sessionData.playerID || !sessionData.connectionID) {
            return null;
        }

        console.log("session data does exists: ", sessionData);

        // Update last active timestamp
        await redisClient.hset(sessionKey, 'lastActive', now.toString());

        return new Session(
            baseId,
            sessionData.playerID,
            sessionData.connectionID,
            sessionData.createdAt,
            now.toString(),
            sessionData.ip,
            sessionData.agent
        );
    }

    /**
     * @method getSessionByConnectionID
     * @description Gets a session by connection ID
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} connectionID The connection ID to look up
     * @returns {Promise<string | null>} A promise that resolves to the session ID or null if not found
     */
    static async getSessionByConnectionID(
        connectionID: string
    ): Promise<string | null> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        //! This is a simplified implementation. Not fit for production
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
     * @method getSessionByKey
     * @description Gets a session object from redis given the key used in redis
     * @param redisClient - gives access to the database
     * @param key 
     */
    static async getSessionByKey(key: string): Promise<Session | null> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        
        try {
            //Get the session info from the hashmap

            let sessionData: Record<string,string> = await redisClient.hgetall(key);
            if (sessionData) {
                return new Session(sessionData["sessionID"], sessionData["playerID"], sessionData["connectionID"], sessionData["createdAt"], sessionData["lastActive"], sessionData["ip"], sessionData["agent"]);
            }


        } catch (error) {
            throw Error("Unable to retrieve session from database");
        }
        return null;
        
    }

    /**
     * @method getSessionBySessionID
     * @description Gets a session object from redis given the sessionID
     * @param redisClient - gives access to the database
     * @param sessionID - the session ID
     */
    static async getSessionBySessionID(sessionID: string): Promise<Session | null> {
        return Session.getSessionByKey(REDIS_KEYS.SESSION(sessionID));
    }

    /**
     * @method invalidateSession
     * @description Invalidates a session
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} token The session token to invalidate
     * @returns {Promise<boolean>} A promise that resolves to true if successful
     */
    static async invalidateSession(
        token: string
    ): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Parse the token to get the baseId
        const tokenData = this.parseAndVerifyToken(token);
        if (!tokenData) {
            return false; // Invalid token
        }

        const { baseId } = tokenData;

        // Get player ID before deleting session
        const playerID = await redisClient.hget(REDIS_KEYS.SESSION(baseId), 'playerID');

        // Delete session
        await redisClient.del(REDIS_KEYS.SESSION(baseId));

        // Remove from player's sessions list if player ID exists
        if (playerID) {
            await redisClient.srem(REDIS_KEYS.PLAYER_SESSIONS(playerID), baseId);
        }

        return true;
    }

    /**
     * @method setSessionExpiry
     * @description Sets an expiry time on a session
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} token The session token to set expiry on
     * @param {number} expirySeconds The number of seconds until expiry
     * @returns {Promise<boolean>} A promise that resolves to true if successful
     */
    static async setSessionExpiry(
        token: string,
        expirySeconds: number = AUTH_CONSTANTS.SESSION_EXPIRE_TIME
    ): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Parse the token to get the baseId
        const tokenData = this.parseAndVerifyToken(token);
        if (!tokenData) {
            return false; // Invalid token
        }

        const { baseId } = tokenData;
        const key = REDIS_KEYS.SESSION(baseId);
        const exists = await redisClient.exists(key);

        if (!exists) {
            return false;
        }

        await redisClient.expire(key, expirySeconds);
        return true;
    }

    /**
     * @method refreshSession
     * @description Refreshes a session by removing its expiry
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} token The session token to refresh
     * @returns {Promise<boolean>} A promise that resolves to true if successful
     */
    static async refreshSession(
        token: string
    ): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Parse the token to get the baseId
        const tokenData = this.parseAndVerifyToken(token);
        if (!tokenData) {
            return false; // Invalid token
        }

        const { baseId } = tokenData;
        const key = REDIS_KEYS.SESSION(baseId);
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

    /**
     * @method updateSessionConnectionID
     * @description Updates the connectionID associated with a session
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} token The session token to update
     * @param {string} newConnectionID The new connection ID to associate with the session
     * @returns {Promise<boolean>} A promise that resolves to true if successful
     */
    static async updateSessionConnectionID(
        token: string,
        newConnectionID: string
    ): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Parse the token to get the baseId
        const tokenData = this.parseAndVerifyToken(token);
        if (!tokenData) {
            return false; // Invalid token
        }

        const { baseId } = tokenData;
        const key = REDIS_KEYS.SESSION(baseId);
        const exists = await redisClient.exists(key);

        if (!exists) {
            return false;
        }

        // Update connectionID and last active timestamp
        const now = Date.now();
        await redisClient.hset(
            key,
            'connectionID', newConnectionID,
            'lastActive', now.toString()
        );

        // Remove expiry
        await redisClient.persist(key);
        return true;
    }

    /**
     * @method isConnectionActive
     * @description Checks if a connection is active
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} connectionID The connection ID to check
     * @returns {Promise<boolean>} A promise that resolves to true if the connection is active
     */
    static async isConnectionActive(
        connectionID: string
    ): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        console.log(`[SessionManager] Checking if connection ID ${connectionID} is active`);
        
        // Check if the connection exists in Redis
        const redisKey = REDIS_KEYS.CONNECTION(connectionID);
        console.log(`[SessionManager] Looking up Redis key: ${redisKey}`);
        
        const startTime = Date.now();
        const exists = await redisClient.exists(redisKey);
        const checkTime = Date.now() - startTime;
        
        const isActive = exists === 1;
        console.log(`[SessionManager] Connection check took ${checkTime}ms, result: ${isActive ? 'active' : 'inactive'}`);
        
        return isActive;
    }

    /**
     * @method getSessionConnectionID
     * @description Gets the connectionID associated with a session
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} token The session token
     * @returns {Promise<string | null>} A promise that resolves to the connectionID or null if not found
     */
    static async getSessionConnectionID(
        token: string
    ): Promise<string | null> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Parse the token to get the baseId
        const tokenData = this.parseAndVerifyToken(token);
        if (!tokenData) {
            return null; // Invalid token
        }

        const { baseId } = tokenData;
        const key = REDIS_KEYS.SESSION(baseId);
        
        // Get the connectionID from the session
        return await redisClient.hget(key, 'connectionID');
    }

    /**
     * @method getSessionPlayerID
     * @description Gets the playerID associated with a session
     * @param {Redis} redisClient Redis client for database operations
     * @param {string} token The session token
     * @returns {Promise<string | null>} A promise that resolves to the playerID or null if not found
     */
    static async getSessionPlayerID(
        token: string
    ): Promise<string | null> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        // Parse the token to get the baseId
        const tokenData = this.parseAndVerifyToken(token);
        if (!tokenData) {
            return null; // Invalid token
        }

        const { baseId } = tokenData;
        const key = REDIS_KEYS.SESSION(baseId);
        
        // Get the playerID from the session
        return await redisClient.hget(key, 'playerID');
    }

    // Instance getter methods

    /**
     * @method getSessionID
     * @description Returns the sessionID
     * @returns {string} The session ID
     */
    public getSessionID(): string {
        return this.sessionID;
    }

    /**
     * @method getPlayerID
     * @description Returns the playerID associated with this session
     * @returns {string} The player ID
     */
    public getPlayerID(): string {
        return this.playerID;
    }

    /**
     * @method getConnectionID
     * @description Returns the connectionID associated with this session
     * @returns {string} The connection ID
     */
    public getConnectionID(): string {
        return this.connectionID;
    }

    /**
     * @method getCreatedAt
     * @description Returns the timestamp when this session was created
     * @returns {number} The creation timestamp
     */
    public getCreatedAt(): string {
        return this.createdAt;
    }

    /**
     * @method getLastActive
     * @description Returns the timestamp when this session was last active
     * @returns {number} The last active timestamp
     */
    public getLastActive(): string {
        return this.lastActive;
    }

    /**
     * @method getIP
     * @description Returns the IP address associated with this session
     * @returns {string} The IP address
     */
    public getIP(): string {
        return this.ip;
    }

    /**
     * @method getAgent
     * @description Returns the user agent hash associated with this session
     * @returns {string} The user agent hash
     */
    public getAgent(): string {
        return this.agent;
    }

    /**
     * @method toSessionData
     * @description Converts this SessionManager instance to a SessionData object
     * @returns {SessionData} The SessionData object
     */
    public toSessionData(): SessionData {
        return {
            sessionID: this.sessionID,
            playerID: this.playerID,
            connectionID: this.connectionID,
            createdAt: this.createdAt,
            lastActive: this.lastActive,
            ip: this.ip,
            agent: this.agent
        };
    }
}
