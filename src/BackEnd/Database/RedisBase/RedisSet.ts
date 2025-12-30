/**
 * @file RedisSet.ts
 * @description RedisSet class for Redis set-backed objects
 * @author John Khalife
 * @created 2025-12-27
 */

import { RedisObject } from "./RedisObject";

/**
 * RedisSet class for Redis set-backed objects
 * @template T The type of elements stored in the Redis set
 */
export abstract class RedisSet<T> extends RedisObject {
  protected items: Set<T>;

  /**
   * @constructor
   * @param id Unique identifier for this object
   * @param items Initial items
   */
  constructor(id: string, items: Set<T> = new Set()) {
    super(id);
    this.items = items;
  }

  /**
   * Serialize an item to string for Redis storage
   * @param item The item to serialize
   * @abstract
   */
  protected abstract serializeItem(item: T): string;

  /**
   * Deserialize a string from Redis to an item
   * @param value The string value from Redis
   * @abstract
   */
  protected abstract deserializeItem(value: string): T;

  /**
   * Save the set to Redis
   */
  async save(): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    await this.withTransaction((multi) => {
      // Clear existing set
      multi.del(key);

      // Add all items if any exist
      if (this.items.size > 0) {
        const serializedItems = Array.from(this.items).map(item => this.serializeItem(item));
        multi.sadd(key, ...serializedItems);
      }
    });
  }

  /**
   * Load the set from Redis
   */
  async load(): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const values = await redisClient.smembers(key);
    this.items = new Set(values.map(value => this.deserializeItem(value)));
  }

  /**
   * Add an item to the set
   * @param item The item to add
   * @returns True if item was added (wasn't already in set), false if already existed
   */
  async add(item: T): Promise<boolean> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const serialized = this.serializeItem(item);
    const added = await redisClient.sadd(key, serialized);

    if (added > 0) {
      this.items.add(item);
      return true;
    }

    return false;
  }

  /**
   * Remove an item from the set
   * @param item The item to remove
   * @returns True if item was removed, false if it didn't exist
   */
  async remove(item: T): Promise<boolean> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const serialized = this.serializeItem(item);
    const removed = await redisClient.srem(key, serialized);

    if (removed > 0) {
      this.items.delete(item);
      return true;
    }

    return false;
  }

  /**
   * Check if the set contains an item
   * @param item The item to check
   * @returns True if the set contains the item
   */
  async contains(item: T): Promise<boolean> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const serialized = this.serializeItem(item);
    const exists = await redisClient.sismember(key, serialized);

    return exists === 1;
  }

  /**
   * Check if the set contains an item (local check only)
   * @param item The item to check
   * @returns True if the local set contains the item
   */
  has(item: T): boolean {
    return this.items.has(item);
  }

  /**
   * Get the size of the set
   * @returns The number of items in the set
   */
  async size(): Promise<number> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    return await redisClient.scard(key);
  }

  /**
   * Get the size of the local set
   * @returns The number of items in the local set
   */
  localSize(): number {
    return this.items.size;
  }

  /**
   * Get all items in the set
   * @returns An array of all items
   */
  getItems(): T[] {
    return Array.from(this.items);
  }

  /**
   * Clear all items from the set
   */
  async clear(): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    await redisClient.del(key);
    this.items.clear();
  }

  /**
   * Pop a random item from the set
   * @returns The popped item or null if set is empty
   */
  async pop(): Promise<T | null> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const value = await redisClient.spop(key);
    if (value === null) {
      return null;
    }

    const item = this.deserializeItem(value);
    this.items.delete(item);
    return item;
  }

  /**
   * Get a random item from the set without removing it
   * @returns A random item or null if set is empty
   */
  async random(): Promise<T | null> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const value = await redisClient.srandmember(key);
    if (value === null) {
      return null;
    }

    return this.deserializeItem(value);
  }

  /**
   * Check if the set is empty
   * @returns True if the set has no items
   */
  isEmpty(): boolean {
    return this.items.size === 0;
  }

  /**
   * Perform multiple additions without saving after each operation
   * @param items Items to add
   */
  async addMultiple(items: T[]): Promise<void> {
    if (items.length === 0) return;

    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const serializedItems = items.map(item => this.serializeItem(item));
    await redisClient.sadd(key, ...serializedItems);

    items.forEach(item => this.items.add(item));
  }
}
