/**
 * @file RedisObject.ts
 * @description Base class for Redis-backed objects with automatic versioning and optimistic locking
 * @author John Khalife
 * @created 2025-11-16
 */

import Redis, { ChainableCommander } from "ioredis";

/**
 * Error thrown when a concurrent modification is detected
 */
export class ConcurrentModificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConcurrentModificationError';
    }
}

/**
 * Base class for all Redis-backed objects
 * @template T The type of data stored in Redis
 */
export abstract class RedisObject<T extends Record<string, any>> {
    protected data: T;
    protected version: number;
    protected id: string;
    protected redisClient: Redis;
    private static readonly MAX_RETRIES = 3;

    /**
     * @constructor
     * @param id Unique identifier for this object
     * @param data Initial data
     * @param redisClient Redis client instance
     */
    constructor(id: string, data: T, redisClient: Redis) {
        if (!id || id.trim() === "") {
            throw new Error("id cannot be empty");
        }
        if (!redisClient) {
            throw new Error("Redis client is required");
        }
        this.id = id;
        this.data = data;
        this.version = 0;
        this.redisClient = redisClient;
    }

    /**
     * Get the Redis client instance
     * @protected
     */
    protected getRedisClient(): Redis {
        return this.redisClient;
    }

    /**
     * Check if Redis client is initialized and connected
     * @private
     * @throws {Error} If Redis client is not initialized or connected
     */
    private checkRedisClient(): void {
        const redisClient = this.getRedisClient();
        if (!redisClient) {
            throw new Error("Redis client is not initialized");
        }
        if (redisClient.status !== 'ready') {
            throw new Error(`Redis client is not ready. Current status: ${redisClient.status}`);
        }
    }

    /**
     * Get the Redis key for this object
     * Must be implemented by child classes to define their key pattern
     * @abstract
     */
    protected abstract getRedisKey(): string;

    /**
     * Save the object to Redis with optimistic locking
     * @throws {ConcurrentModificationError} If the object was modified concurrently
     */
    async save(): Promise<void> {
        this.checkRedisClient();
        const redisClient = this.getRedisClient();
        let retries = 0;

        while (retries < RedisObject.MAX_RETRIES) {
            try {
                const key = this.getRedisKey();

                // Watch the key for changes
                await redisClient.watch(key);

                // Get current version from Redis
                const storedVersion = await redisClient.hget(key, 'version');

                if (storedVersion !== null && parseInt(storedVersion) !== this.version) {
                    await redisClient.unwatch();
                    throw new ConcurrentModificationError(`Object ${this.id} was modified concurrently`);
                }

                // Prepare data for saving
                const saveData = {
                    ...this.data,
                    version: (this.version + 1).toString()
                };

                // Start transaction
                const multi = redisClient.multi();
                multi.hset(key, saveData);

                // Execute transaction
                const results = await multi.exec();
                if (results === null) {
                    if (retries < RedisObject.MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new ConcurrentModificationError('Transaction failed, concurrent modification detected');
                }

                // Update local version
                this.version++;
                return;
            } catch (error) {
                if (error instanceof ConcurrentModificationError) {
                    if (retries < RedisObject.MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                }
                throw error;
            }
        }

        throw new Error(`Failed to save object ${this.id} after ${RedisObject.MAX_RETRIES} retries`);
    }

    /**
     * Load the object's data from Redis
     */
    async load(): Promise<void> {
        this.checkRedisClient();
        const redisClient = this.getRedisClient();
        const key = this.getRedisKey();

        const data = await redisClient.hgetall(key);
        if (!data || Object.keys(data).length === 0) {
            throw new Error(`Object ${this.id} not found`);
        }

        // Extract version
        const version = data.version;
        delete data.version;

        this.data = data as T;
        this.version = version ? parseInt(version) : 0;
    }

    /**
     * Delete the object from Redis
     */
    async delete(): Promise<void> {
        this.checkRedisClient();
        const redisClient = this.getRedisClient();
        const key = this.getRedisKey();

        await redisClient.del(key);
    }

    /**
     * Get a value from the object's data
     * @param key The key to get
     */
    public get<K extends keyof T>(key: K): T[K] {
        return this.data[key];
    }

    /**
     * Set a value in the object's data and save to Redis
     * @param key The key to set
     * @param value The value to set
     */
    public async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
        this.data[key] = value;
        await this.save();
    }

    /**
     * Execute multiple Redis operations in a transaction
     * @param operations Function that defines the operations to perform
     */
    protected async withTransaction<R>(
        operations: (multi: ChainableCommander) => void
    ): Promise<R | null> {
        this.checkRedisClient();
        const redisClient = this.getRedisClient();
        let retries = 0;

        while (retries < RedisObject.MAX_RETRIES) {
            try {
                const key = this.getRedisKey();
                await redisClient.watch(key);

                const multi = redisClient.multi();
                operations(multi);

                const results = await multi.exec();
                if (results === null) {
                    if (retries < RedisObject.MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                    throw new ConcurrentModificationError('Transaction failed, concurrent modification detected');
                }

                return results as R;
            } catch (error) {
                if (error instanceof ConcurrentModificationError) {
                    if (retries < RedisObject.MAX_RETRIES - 1) {
                        retries++;
                        continue;
                    }
                }
                throw error;
            }
        }

        throw new Error(`Transaction failed after ${RedisObject.MAX_RETRIES} retries`);
    }

    /**
     * Get the object's ID
     */
    getId(): string {
        return this.id;
    }

    /**
     * Get the object's version
     */
    getVersion(): number {
        return this.version;
    }
}
