/**
 * @file DatabaseManager.ts
 * @description Singleton class to manage Redis database connections
 * @author John Khalife
 * @created 2025-09-20
 */

import Redis from "ioredis";
import { REDIS_KEYS } from "../Contants";
import { handleSessionExpiry, handleConnectionExpiry } from "../Handling/InternalHandler";

export class DatabaseManager {
    private static instance: DatabaseManager;
    private regularClient: Redis | null = null;
    private subscriberClient: Redis | null = null;

    private constructor() {}

    /**
     * @method getInstance
     * @description Get the singleton instance of DatabaseManager
     * @returns DatabaseManager instance
     */
    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    /**
     * @method initialize
     * @description Initialize Redis connections
     * @param host Redis host
     * @param port Redis port
     */
    public initialize(host: string, port: number): void {
        if (this.regularClient || this.subscriberClient) {
            throw new Error("DatabaseManager is already initialized");
        }

        this.regularClient = this.createRegularConnection(host, port);
        this.subscriberClient = this.createSubscriberConnection(host, port);
    }

    /**
     * @method getRegularClient
     * @description Get the Redis client for regular operations
     * @returns Redis client for regular operations
     * @throws Error if DatabaseManager is not initialized
     */
    public getRegularClient(): Redis {
        if (!this.regularClient) {
            throw new Error("DatabaseManager is not initialized");
        }
        return this.regularClient;
    }

    /**
     * @method getSubscriberClient
     * @description Get the Redis client for subscriptions
     * @returns Redis client for subscriptions
     * @throws Error if DatabaseManager is not initialized
     */
    public getSubscriberClient(): Redis {
        if (!this.subscriberClient) {
            throw new Error("DatabaseManager is not initialized");
        }
        return this.subscriberClient;
    }

    /**
     * @method createRegularConnection
     * @description Creates a Redis connection for regular operations
     * @param host Redis host
     * @param port Redis port
     * @returns Redis client configured for regular operations
     * @private
     */
    private createRegularConnection(host: string, port: number): Redis {
        const redisClient = new Redis({
            host: host,
            port: port,
        });

        redisClient.on('error', (err) => {
            console.error('Error occurred while connecting or accessing Redis regular server:', err);
        });

        redisClient.on('connect', () => {
            console.log('Connected to Redis regular server');
        });

        return redisClient;
    }

    /**
     * @method createSubscriberConnection
     * @description Creates a Redis connection dedicated to subscribing to keyspace notifications
     * @param host Redis host
     * @param port Redis port
     * @returns Redis client configured for subscription
     * @private
     */
    private createSubscriberConnection(host: string, port: number): Redis {
        const redisClient = new Redis({
            host: host,
            port: port,
        });

        redisClient.config('SET', 'notify-keyspace-events', 'Ex');

        redisClient.on('error', (err) => {
            console.error('Error occurred while connecting or accessing Redis subscriber server:', err);
        });

        redisClient.on('connect', () => {
            console.log('Connected to Redis subscriber server');
        });

        redisClient.psubscribe('__keyevent@0__:expired', (err, count) => {
            if (err) {
                console.error('Failed to subscribe to key expiration events:', err);
            } else {
                console.log(`Subscribed to ${count} key expiration event(s).`);
            }
        });

        redisClient.on('pmessage', (pattern, channel, expiredKey) => {
            console.log(`Key expired: ${expiredKey}`);
            if (expiredKey.includes(REDIS_KEYS.SESSION(""))) {
                handleSessionExpiry(expiredKey);
            } else if (expiredKey.includes(REDIS_KEYS.CONNECTION(""))) {
                handleConnectionExpiry(expiredKey);
            }
        });

        return redisClient;
    }

    /**
     * @method closeConnections
     * @description Close all Redis connections
     */
    public async closeConnections(): Promise<void> {
        if (this.regularClient) {
            await this.regularClient.quit();
            this.regularClient = null;
        }
        if (this.subscriberClient) {
            await this.subscriberClient.quit();
            this.subscriberClient = null;
        }
    }
}
