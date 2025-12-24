/**
 * @file RedisList.ts
 * @description RedisList class for Redis list-backed objects
 * @author John Khalife
 * @created 2025-12-23
 */

import { RedisObject } from "./RedisObject";

/**
 * RedisList class for Redis list-backed objects
 * @template T The type of elements stored in the Redis list
 */
export abstract class RedisList<T> extends RedisObject {
  protected items: T[];

  /**
   * @constructor
   * @param id Unique identifier for this object
   * @param items Initial items
   */
  constructor(id: string, items: T[] = []) {
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
   * Save the list to Redis
   */
  async save(): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    await this.withTransaction((multi) => {
      // Clear existing list
      multi.del(key);

      // Add all items if any exist
      if (this.items.length > 0) {
        const serializedItems = this.items.map(item => this.serializeItem(item));
        multi.rpush(key, ...serializedItems);
      }
    });
  }

  /**
   * Load the list from Redis
   */
  async load(): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const values = await redisClient.lrange(key, 0, -1);
    this.items = values.map(value => this.deserializeItem(value));
  }

  /**
   * Push an item to the end of the list
   * @param item The item to push
   */
  async push(item: T): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    await redisClient.rpush(key, this.serializeItem(item));
    this.items.push(item);
  }

  /**
   * Pop an item from the end of the list
   * @returns The popped item or null if list is empty
   */
  async pop(): Promise<T | null> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const value = await redisClient.rpop(key);
    if (value === null) {
      return null;
    }

    const item = this.deserializeItem(value);
    this.items.pop();
    return item;
  }

  /**
   * Push an item to the beginning of the list
   * @param item The item to push
   */
  async unshift(item: T): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    await redisClient.lpush(key, this.serializeItem(item));
    this.items.unshift(item);
  }

  /**
   * Remove the first occurrence of an item from the list
   * @param item The item to remove
   * @returns True if item was removed, false otherwise
   */
  async remove(item: T): Promise<boolean> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const serialized = this.serializeItem(item);
    const removed = await redisClient.lrem(key, 1, serialized);

    if (removed > 0) {
      const index = this.items.findIndex(i => this.serializeItem(i) === serialized);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
      return true;
    }

    return false;
  }

  /**
   * Remove all occurrences of an item from the list
   * @param item The item to remove
   * @returns Number of items removed
   */
  async removeAll(item: T): Promise<number> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const serialized = this.serializeItem(item);
    const removed = await redisClient.lrem(key, 0, serialized);

    this.items = this.items.filter(i => this.serializeItem(i) !== serialized);

    return removed;
  }

  /**
   * Get an item at a specific index
   * @param index The index of the item
   * @returns The item at the index or null if out of bounds
   */
  async getAt(index: number): Promise<T | null> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const value = await redisClient.lindex(key, index);
    if (value === null) {
      return null;
    }

    return this.deserializeItem(value);
  }

  /**
   * Set an item at a specific index
   * @param index The index to set
   * @param item The item to set
   */
  async setAt(index: number, item: T): Promise<void> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    await redisClient.lset(key, index, this.serializeItem(item));
    if (index >= 0 && index < this.items.length) {
      this.items[index] = item;
    }
  }

  /**
   * Get the length of the list
   * @returns The length of the list
   */
  async length(): Promise<number> {
    this.checkRedisClient();
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    return await redisClient.llen(key);
  }

  /**
   * Get all items in the list
   * @returns A copy of all items
   */
  getItems(): T[] {
    return [...this.items];
  }

  /**
   * Check if the list contains an item
   * @param item The item to check
   * @returns True if the list contains the item
   */
  contains(item: T): boolean {
    const serialized = this.serializeItem(item);
    return this.items.some(i => this.serializeItem(i) === serialized);
  }

  /**
   * Get the size of the local items array
   * @returns The number of items in the local array
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Perform multiple updates without saving after each operation
   * Executes a callback function that can make multiple changes to the list
   * Then saves all changes to Redis in a single operation
   * @param updater Function that receives the items array and can modify it
   */
  async batchUpdate(updater: (items: T[]) => void): Promise<void> {
    updater(this.items);
    await this.save();
  }

  /**
   * Update multiple items at specific indices without saving after each
   * @param updates Array of {index, value} pairs to update
   */
  async batchSetAt(updates: Array<{ index: number; value: T }>): Promise<void> {
    for (const { index, value } of updates) {
      if (index >= 0 && index < this.items.length) {
        this.items[index] = value;
      }
    }
    await this.save();
  }
}
