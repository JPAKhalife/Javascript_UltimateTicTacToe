/**
 * @file RedisHash.ts
 * @description RedisHash class for Redis hash-backed objects with automatic versioning and optimistic locking
 * @author John Khalife
 * @created 2025-12-23
 */

import Redis, { ChainableCommander } from "ioredis";
import { RedisObject, ConcurrentModificationError } from "./RedisObject";

/**
 * RedisHash class for Redis hash-backed objects
 * @template T The type of data stored in the Redis hash
 */
export abstract class RedisHash<T extends Record<string, any>> extends RedisObject {
  protected data: T;
  protected version: number;

  /**
   * @constructor
   * @param id Unique identifier for this object
   * @param data Initial data
   * @param redisClient Redis client instance
   */
  constructor(id: string, data: T, redisClient: Redis) {
    super(id, redisClient);
    this.data = data;
    this.version = 0;
  }

  /**
   * Save the object to Redis with optimistic locking
   * @throws {ConcurrentModificationError} If the object was modified concurrently
   */
  async save(): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    let retries = 0;

    while (retries < RedisHash.MAX_RETRIES) {
      try {
        const key = this.getRedisKey();

        // Watch the key for changes
        await redisClient.watch(key);

        // Get current version from Redis
        const storedVersion = await redisClient.hget(key, "version");

        if (
          storedVersion !== null &&
          parseInt(storedVersion) !== this.version
        ) {
          await redisClient.unwatch();
          throw new ConcurrentModificationError(
            `Object ${this.id} was modified concurrently`,
          );
        }

        // Prepare data for saving
        const saveData = {
          ...this.data,
          version: (this.version + 1).toString(),
        };

        // Start transaction
        const multi = redisClient.multi();
        multi.hset(key, saveData);

        // Execute transaction
        const results = await multi.exec();
        if (results === null) {
          if (retries < RedisHash.MAX_RETRIES - 1) {
            retries++;
            continue;
          }
          throw new ConcurrentModificationError(
            "Transaction failed, concurrent modification detected",
          );
        }

        // Update local version
        this.version++;
        return;
      } catch (error) {
        if (error instanceof ConcurrentModificationError) {
          if (retries < RedisHash.MAX_RETRIES - 1) {
            retries++;
            continue;
          }
        }
        throw error;
      }
    }

    throw new Error(
      `Failed to save object ${this.id} after ${RedisHash.MAX_RETRIES} retries`,
    );
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
   * Get the object's version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Get all data
   */
  protected getData(): T {
    return this.data;
  }
}
