/**
 * @file Session.ts
 * @description Session class that extends RedisObject for Redis-backed session management
 * @author John Khalife
 * @created 2025-08-20
 * @updated 2025-11-29
 */

import { RedisObject } from "./RedisObject";
import { nanoid } from 'nanoid';
import { AUTH_CONSTANTS, REDIS_KEYS, ENV_CONFIG } from '../Contants';
import crypto from 'crypto';
import { DatabaseManager } from './DatabaseManager';
import { ServerConnections } from './ServerConnections';

/**
 * Interface defining the structure of session data stored in Redis
 */
export interface SessionData {
    sessionID: string;
    playerID: string;
    connectionID: string;
    serverID: string;
    createdAt: string;
    lastActive: string;
    ip: string;
    agent: string;
}

/**
 * Session class extending RedisObject for Redis-backed session management
 */
export default class Session extends RedisObject<SessionData> {
    /**
     * Create a new session
     * @param playerID The ID of the player associated with this session
     * @param connectionID The ID of the connection associated with this session
     * @param req The request object containing client information
     */
    static async create(
        playerID: string,
        connectionID: string,
        req: any
    ): Promise<{ session: Session; token: string }> {
        if (!playerID || playerID.trim() === "") {
            throw new Error("playerID cannot be empty");
        }
        if (!connectionID || connectionID.trim() === "") {
            throw new Error("connectionID cannot be empty");
        }

        // Generate session ID
        const sessionID = Session.generateSessionID();
        const now = new Date().toISOString();
        
        // Get client info
        const { ip, agent } = Session.getClientInfo(req);
        
        // Get current server ID
        const serverConnections = ServerConnections.getInstance();
        const serverID = serverConnections.getServerID();

        const sessionData: SessionData = {
            sessionID,
            playerID,
            connectionID,
            serverID,
            createdAt: now,
            lastActive: now,
            ip,
            agent
        };

        const session = new Session(sessionID, sessionData, DatabaseManager.getInstance().getRegularClient());

        try {
            // Save the session data and add to player's sessions list atomically
            await session.withTransaction(multi => {
                multi.hset(session.getRedisKey(), {
                    ...sessionData,
                    version: "0"
                });
                multi.sadd(REDIS_KEYS.PLAYER_SESSIONS(playerID), sessionID);
            });

            // Create HMAC token
            const token = Session.generateHmacToken(sessionID, Date.now(), agent, ip);

            return { session, token };
        } catch (error) {
            throw new Error(`Failed to create session: ${error}`);
        }
    }

    /**
     * Get a session by its ID
     * @param sessionID The ID of the session to retrieve
     */
    static async getById(sessionID: string): Promise<Session | null> {
        try {
            const dummyData: SessionData = {
                sessionID,
                playerID: "",
                connectionID: "",
                serverID: "",
                createdAt: "",
                lastActive: "",
                ip: "",
                agent: ""
            };
            
            const session = new Session(sessionID, dummyData, DatabaseManager.getInstance().getRegularClient());
            await session.load();
            return session;
        } catch (error) {
            return null;
        }
    }

    /**
     * Validate a session token and return the session
     * @param token The session token to validate
     * @param req The request object containing client information
     */
    static async validateSession(
        token: string,
        req: any
    ): Promise<Session | null> {
        // Parse and verify the token
        const tokenData = Session.parseAndVerifyToken(token);
        if (!tokenData) {
            return null; // Invalid token
        }

        const { baseId, timestamp, agent, ip } = tokenData;

        console.log("Validate session: ", baseId, timestamp, agent, ip);

        try {
            // Get session by ID
            const session = await Session.getById(baseId);
            if (!session) {
                return null;
            }

            // Update last active timestamp
            await session.set('lastActive', new Date().toISOString());

            return session;
        } catch (error) {
            console.error("Error validating session:", error);
            return null;
        }
    }

    /**
     * Get session by connection ID
     * @param connectionID The connection ID to look up
     */
    static async getByConnectionID(connectionID: string): Promise<Session | null> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        
        try {
            // This is a simplified implementation. In production, consider using a secondary index
            const sessionKeys = await redisClient.keys(`${REDIS_KEYS.SESSION("*")}`);
            
            for (const key of sessionKeys) {
                const connID = await redisClient.hget(key, 'connectionID');
                if (connID === connectionID) {
                    const sessionID = key.substring(REDIS_KEYS.SESSION("").length);
                    return await Session.getById(sessionID);
                }
            }
            
            return null;
        } catch (error) {
            console.error("Error getting session by connection ID:", error);
            return null;
        }
    }

    /**
     * Update the connection ID for this session
     * @param newConnectionID The new connection ID
     */
    async updateConnectionID(newConnectionID: string): Promise<void> {
        await this.set('connectionID', newConnectionID);
        await this.set('lastActive', new Date().toISOString());
    }

    /**
     * Update the server ID for this session (for cross-server scenarios)
     * @param newServerID The new server ID
     */
    async updateServerID(newServerID: string): Promise<void> {
        await this.set('serverID', newServerID);
        await this.set('lastActive', new Date().toISOString());
    }

    /**
     * Invalidate this session
     */
    async invalidate(): Promise<void> {
        const playerID = this.get('playerID');
        
        await this.withTransaction(multi => {
            // Delete session
            multi.del(this.getRedisKey());
            
            // Remove from player's sessions list
            if (playerID) {
                multi.srem(REDIS_KEYS.PLAYER_SESSIONS(playerID), this.id);
            }
        });
    }

    /**
     * Check if connection is active
     * @param connectionID The connection ID to check
     */
    static async isConnectionActive(connectionID: string): Promise<boolean> {
        const redisClient = DatabaseManager.getInstance().getRegularClient();
        console.log(`[Session] Checking if connection ID ${connectionID} is active`);
        
        const redisKey = REDIS_KEYS.CONNECTION(connectionID);
        const exists = await redisClient.exists(redisKey);
        
        const isActive = exists === 1;
        console.log(`[Session] Connection ${connectionID} is ${isActive ? 'active' : 'inactive'}`);
        
        return isActive;
    }

    // Static utility methods

    /**
     * Generate a new session ID using nanoid
     */
    static generateSessionID(): string {
        return nanoid(AUTH_CONSTANTS.SESSION_ID_LENGTH);
    }

    /**
     * Extract and process client information from request
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
            .substring(0, 16);

        return { ip, agent };
    }

    /**
     * Generate an HMAC token with the specified components
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
     * Parse and verify an HMAC token
     */
    private static parseAndVerifyToken(token: string): { baseId: string, timestamp: number, agent: string, ip: string } | null {
        try {
            // Split the token
            const parts = token.split('.');
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
                return null;
            }

            return { baseId, timestamp, agent, ip };
        } catch (error) {
            console.error("Error parsing token:", error);
            return null;
        }
    }

    // Instance getter methods

    /**
     * Get the session ID
     */
    public getSessionID(): string {
        return this.get('sessionID');
    }

    /**
     * Get the player ID associated with this session
     */
    public getPlayerID(): string {
        return this.get('playerID');
    }

    /**
     * Get the connection ID associated with this session
     */
    public getConnectionID(): string {
        return this.get('connectionID');
    }

    /**
     * Get the server ID associated with this session
     */
    public getServerID(): string {
        return this.get('serverID');
    }

    /**
     * Get the creation timestamp
     */
    public getCreatedAt(): string {
        return this.get('createdAt');
    }

    /**
     * Get the last active timestamp
     */
    public getLastActive(): string {
        return this.get('lastActive');
    }

    /**
     * Get the IP address associated with this session
     */
    public getIP(): string {
        return this.get('ip');
    }

    /**
     * Get the user agent hash associated with this session
     */
    public getAgent(): string {
        return this.get('agent');
    }

    /**
     * Get the Redis key for this session
     */
    protected getRedisKey(): string {
        return REDIS_KEYS.SESSION(this.id);
    }

    /**
     * Convert this session to a SessionData object
     */
    public toSessionData(): SessionData {
        return {
            sessionID: this.get('sessionID'),
            playerID: this.get('playerID'),
            connectionID: this.get('connectionID'),
            serverID: this.get('serverID'),
            createdAt: this.get('createdAt'),
            lastActive: this.get('lastActive'),
            ip: this.get('ip'),
            agent: this.get('agent')
        };
    }

    /**
     * Convert session data to a JSON-friendly format
     */
    public toJSON(): Record<string, any> {
        return {
            sessionID: this.id,
            playerID: this.get('playerID'),
            connectionID: this.get('connectionID'),
            serverID: this.get('serverID'),
            createdAt: this.get('createdAt'),
            lastActive: this.get('lastActive'),
            ip: this.get('ip'),
            agent: this.get('agent'),
            version: this.getVersion()
        };
    }

    // Legacy static methods for backward compatibility

    /**
     * @deprecated Use Session.create() instead
     */
    static async createSession(
        playerID: string,
        connectionID: string,
        req: any
    ): Promise<string> {
        const { token } = await Session.create(playerID, connectionID, req);
        return token;
    }

    /**
     * @deprecated Use session.updateConnectionID() instead
     */
    static async updateSessionConnectionID(
        token: string,
        newConnectionID: string
    ): Promise<boolean> {
        try {
            const tokenData = Session.parseAndVerifyToken(token);
            if (!tokenData) {
                return false;
            }

            const session = await Session.getById(tokenData.baseId);
            if (!session) {
                return false;
            }

            await session.updateConnectionID(newConnectionID);
            return true;
        } catch (error) {
            console.error("Error updating session connection ID:", error);
            return false;
        }
    }

    /**
     * @deprecated Use session.invalidate() instead
     */
    static async invalidateSession(token: string): Promise<boolean> {
        try {
            const tokenData = Session.parseAndVerifyToken(token);
            if (!tokenData) {
                return false;
            }

            const session = await Session.getById(tokenData.baseId);
            if (!session) {
                return false;
            }

            await session.invalidate();
            return true;
        } catch (error) {
            console.error("Error invalidating session:", error);
            return false;
        }
    }

    /**
     * @deprecated Use Session.validateSession() instead
     */
    static async refreshSession(token: string): Promise<boolean> {
        try {
            const session = await Session.validateSession(token, {});
            return session !== null;
        } catch (error) {
            console.error("Error refreshing session:", error);
            return false;
        }
    }
}
