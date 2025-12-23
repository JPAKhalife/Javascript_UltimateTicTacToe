/**
 * @file RedisObject.ts
 * @description Base class for Redis-backed objects with common functionality
 * @author John Khalife
 * @created 2025-11-16
 * @updated 2025-12-23
 */

import Redis, { ChainableCommander } from "ioredis";

/**
 * Error thrown when a concurrent modification is detected
 */
export class ConcurrentModificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConcurrentModificationError";
  }
}

/**
 * Base class for all Redis-backed objects
 * Provides common functionality for Redis operations
 */
export abstract class RedisObject {
  public id: string;
  protected redisClient: Redis;
  protected static readonly MAX_RETRIES = 3;

  /**
   * @constructor
   * @param id Unique identifier for this object
   * @param redisClient Redis client instance
   */
  constructor(id: string, redisClient: Redis) {
    if (!id || id.trim() === "") {
      throw new Error("id cannot be empty");
    }
    if (!redisClient) {
      throw new Error("Redis client is required");
    }
    this.id = id;
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
   * @protected
   * @throws {Error} If Redis client is not initialized or connected
   */
  protected checkRedisClient(): void {
    const redisClient = this.getRedisClient();
    if (!redisClient) {
      throw new Error("Redis client is not initialized");
    }
    if (redisClient.status !== "ready") {
      throw new Error(
        `Redis client is not ready. Current status: ${redisClient.status}`,
      );
    }
  }

  /**
   * Get the Redis key for this object
   * Must be implemented by child classes to define their key pattern
   * @abstract
   */
  protected abstract getRedisKey(): string;

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
   * Execute multiple Redis operations in a transaction
   * @param operations Function that defines the operations to perform
   */
  public async withTransaction<R>(
    operations: (multi: ChainableCommander) => void,
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
          throw new ConcurrentModificationError(
            "Transaction failed, concurrent modification detected",
          );
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

    throw new Error(
      `Transaction failed after ${RedisObject.MAX_RETRIES} retries`,
    );
  }

  /**
   * Get the object's ID
   */
  public getId(): string {
    return this.id;
  }
}
