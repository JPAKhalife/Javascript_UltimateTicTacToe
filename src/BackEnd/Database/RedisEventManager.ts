/**
 * @file RedisEventManager.ts
 * @description Manages Redis pub/sub subscriptions with callback-based event handling
 * Supports both keyspace notifications and regular channel subscriptions
 * @author John Khalife
 * @created 2025-12-27
 */

import { DatabaseManager } from "./DatabaseManager";

/**
 * Enum for Redis keyspace event types
 * See: https://redis.io/docs/manual/keyspace-notifications/
 */
export enum RedisEventType {
  EXPIRED = "expired",
  DEL = "del",
  SET = "set",
  HSET = "hset",
  SADD = "sadd",
  SREM = "srem",
  LPUSH = "lpush",
  RPUSH = "rpush",
}

/**
 * Type for event callback functions
 */
export type EventCallback = (key: string, eventType: RedisEventType) => void | Promise<void>;

/**
 * Type for channel message callback functions
 */
export type ChannelMessageCallback = (channel: string, message: string) => void | Promise<void>;

/**
 * Internal structure to track keyspace event subscriptions
 */
interface KeyspaceSubscription {
  pattern: string; // Redis key pattern (e.g., "session:*")
  eventTypes: RedisEventType[];
  callbacks: Set<EventCallback>;
}

/**
 * Internal structure to track channel subscriptions
 */
interface ChannelSubscription {
  channel: string;
  callbacks: Set<ChannelMessageCallback>;
}

/**
 * RedisEventManager - Singleton class for managing Redis pub/sub subscriptions
 *
 * Features:
 * - Subscribe to keyspace notifications (expired, del, set, etc.)
 * - Subscribe to regular Redis channels
 * - Multiple callbacks per subscription
 * - Automatic subscription cleanup when no callbacks remain
 * - Pattern-based keyspace subscriptions
 */
export class RedisEventManager {
  private static instance: RedisEventManager | null = null;
  private keyspaceSubscriptions: Map<string, KeyspaceSubscription> = new Map();
  private channelSubscriptions: Map<string, ChannelSubscription> = new Map();
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): RedisEventManager {
    if (!RedisEventManager.instance) {
      RedisEventManager.instance = new RedisEventManager();
    }
    return RedisEventManager.instance;
  }

  /**
   * Initialize the event manager
   * Sets up the pmessage and message handlers on the subscriber client
   */
  public static initialize(): void {
    const instance = RedisEventManager.getInstance();
    if (instance.initialized) {
      return;
    }

    const subscriberClient = DatabaseManager.getInstance().getSubscriberClient();

    // Handle keyspace notifications (pmessage for pattern subscriptions)
    subscriberClient.on("pmessage", (pattern: string, channel: string, message: string) => {
      instance.handleKeyspaceEvent(pattern, channel, message);
    });

    // Handle regular channel messages
    subscriberClient.on("message", (channel: string, message: string) => {
      instance.handleChannelMessage(channel, message);
    });

    instance.initialized = true;
    console.info("[RedisEventManager] Initialized");
  }

  /**
   * Subscribe to keyspace notifications for a specific key or key pattern
   *
   * @param keyPattern - Redis key or pattern (e.g., "session:123" or "session:*")
   * @param eventTypes - Array of event types to listen for
   * @param callback - Function to call when event occurs
   *
   * @example
   * // Pattern subscription (uses psubscribe)
   * await RedisEventManager.subscribe(
   *   "session:*",
   *   [RedisEventType.EXPIRED, RedisEventType.DEL],
   *   async (key, eventType) => {
   *     console.log(`Key ${key} ${eventType}`);
   *   }
   * );
   *
   * // Exact key subscription (uses psubscribe with exact pattern)
   * await RedisEventManager.subscribe(
   *   "session:abc123",
   *   [RedisEventType.EXPIRED],
   *   async (key, eventType) => {
   *     console.log(`Specific session ${key} ${eventType}`);
   *   }
   * );
   */
  public static async subscribe(
    keyPattern: string,
    eventTypes: RedisEventType[],
    callback: EventCallback
  ): Promise<void> {
    const instance = RedisEventManager.getInstance();

    if (!instance.initialized) {
      RedisEventManager.initialize();
    }

    // Get or create subscription for this key pattern
    let subscription = instance.keyspaceSubscriptions.get(keyPattern);

    if (!subscription) {
      subscription = {
        pattern: keyPattern,
        eventTypes: eventTypes,
        callbacks: new Set([callback]),
      };
      instance.keyspaceSubscriptions.set(keyPattern, subscription);

      // Subscribe to Redis keyspace events for each event type
      // Always use psubscribe (pattern subscribe) since keyspace notifications
      // are pattern-based by nature (__keyevent@0__:expired)
      const subscriberClient = DatabaseManager.getInstance().getSubscriberClient();
      for (const eventType of eventTypes) {
        const channel = instance.getKeyspaceChannel(keyPattern, eventType);
        await subscriberClient.psubscribe(channel);
        console.info(`[RedisEventManager] Subscribed to keyspace event: ${channel} for pattern: ${keyPattern}`);
      }
    } else {
      // Add callback to existing subscription
      subscription.callbacks.add(callback);

      // Subscribe to any new event types
      const subscriberClient = DatabaseManager.getInstance().getSubscriberClient();
      for (const eventType of eventTypes) {
        if (!subscription.eventTypes.includes(eventType)) {
          subscription.eventTypes.push(eventType);
          const channel = instance.getKeyspaceChannel(keyPattern, eventType);
          await subscriberClient.psubscribe(channel);
          console.info(`[RedisEventManager] Subscribed to additional keyspace event: ${channel} for pattern: ${keyPattern}`);
        }
      }
    }
  }

  /**
   * Unsubscribe from keyspace notifications for a key pattern
   *
   * @param keyPattern - Redis key or pattern to unsubscribe from
   * @param callback - Optional specific callback to remove. If not provided, removes all callbacks
   */
  public static async unsubscribe(
    keyPattern: string,
    callback?: EventCallback
  ): Promise<void> {
    const instance = RedisEventManager.getInstance();
    const subscription = instance.keyspaceSubscriptions.get(keyPattern);

    if (!subscription) {
      return;
    }

    if (callback) {
      // Remove specific callback
      subscription.callbacks.delete(callback);
    } else {
      // Remove all callbacks
      subscription.callbacks.clear();
    }

    // If no callbacks remain, unsubscribe from Redis
    if (subscription.callbacks.size === 0) {
      const subscriberClient = DatabaseManager.getInstance().getSubscriberClient();
      for (const eventType of subscription.eventTypes) {
        const channel = instance.getKeyspaceChannel(keyPattern, eventType);
        await subscriberClient.punsubscribe(channel);
        console.info(`[RedisEventManager] Unsubscribed from keyspace event: ${channel}`);
      }
      instance.keyspaceSubscriptions.delete(keyPattern);
    }
  }

  /**
   * Subscribe to a regular Redis pub/sub channel
   *
   * @param channel - Channel name to subscribe to
   * @param callback - Function to call when message is received
   *
   * @example
   * await RedisEventManager.subscribeToChannel(
   *   "lobby:abc123",
   *   async (channel, message) => {
   *     const data = JSON.parse(message);
   *     console.log(`Message on ${channel}:`, data);
   *   }
   * );
   */
  public static async subscribeToChannel(
    channel: string,
    callback: ChannelMessageCallback
  ): Promise<void> {
    const instance = RedisEventManager.getInstance();

    if (!instance.initialized) {
      RedisEventManager.initialize();
    }

    // Get or create subscription for this channel
    let subscription = instance.channelSubscriptions.get(channel);

    if (!subscription) {
      subscription = {
        channel: channel,
        callbacks: new Set([callback]),
      };
      instance.channelSubscriptions.set(channel, subscription);

      // Subscribe to Redis channel
      const subscriberClient = DatabaseManager.getInstance().getSubscriberClient();
      await subscriberClient.subscribe(channel);
      console.info(`[RedisEventManager] Subscribed to channel: ${channel}`);
    } else {
      // Add callback to existing subscription
      subscription.callbacks.add(callback);
    }
  }

  /**
   * Unsubscribe from a regular Redis pub/sub channel
   *
   * @param channel - Channel name to unsubscribe from
   * @param callback - Optional specific callback to remove. If not provided, removes all callbacks
   */
  public static async unsubscribeFromChannel(
    channel: string,
    callback?: ChannelMessageCallback
  ): Promise<void> {
    const instance = RedisEventManager.getInstance();
    const subscription = instance.channelSubscriptions.get(channel);

    if (!subscription) {
      return;
    }

    if (callback) {
      // Remove specific callback
      subscription.callbacks.delete(callback);
    } else {
      // Remove all callbacks
      subscription.callbacks.clear();
    }

    // If no callbacks remain, unsubscribe from Redis
    if (subscription.callbacks.size === 0) {
      const subscriberClient = DatabaseManager.getInstance().getSubscriberClient();
      await subscriberClient.unsubscribe(channel);
      console.info(`[RedisEventManager] Unsubscribed from channel: ${channel}`);
      instance.channelSubscriptions.delete(channel);
    }
  }

  /**
   * Publish a message to a Redis channel
   *
   * @param channel - Channel to publish to
   * @param message - Message to publish (will be stringified if object)
   */
  public static async publish(channel: string, message: string | object): Promise<void> {
    const publisherClient = DatabaseManager.getInstance().getRegularClient();
    const messageStr = typeof message === "string" ? message : JSON.stringify(message);
    await publisherClient.publish(channel, messageStr);
  }

  /**
   * Handle incoming keyspace event notifications
   * @private
   */
  private handleKeyspaceEvent(pattern: string, channel: string, message: string): void {
    // Extract key from channel name
    // Channel format: __keyevent@0__:expired or __keyspace@0__:keyname
    const isKeyEvent = channel.startsWith("__keyevent@");
    const isKeySpace = channel.startsWith("__keyspace@");

    let key: string;
    let eventType: RedisEventType;

    if (isKeyEvent) {
      // Format: __keyevent@0__:expired, message is the key
      const eventName = channel.split(":")[1];
      eventType = eventName as RedisEventType;
      key = message;
    } else if (isKeySpace) {
      // Format: __keyspace@0__:keyname, message is the event type
      key = channel.split(":")[1];
      eventType = message as RedisEventType;
    } else {
      console.warn(`[RedisEventManager] Unknown keyspace notification format: ${channel}`);
      return;
    }

    // Find matching subscriptions and execute callbacks
    for (const [keyPattern, subscription] of this.keyspaceSubscriptions) {
      if (this.matchesPattern(key, keyPattern) && subscription.eventTypes.includes(eventType)) {
        for (const callback of subscription.callbacks) {
          try {
            const result = callback(key, eventType);
            if (result instanceof Promise) {
              result.catch(err => {
                console.error(`[RedisEventManager] Error in keyspace callback for ${key}:`, err);
              });
            }
          } catch (err) {
            console.error(`[RedisEventManager] Error in keyspace callback for ${key}:`, err);
          }
        }
      }
    }
  }

  /**
   * Handle incoming channel messages
   * @private
   */
  private handleChannelMessage(channel: string, message: string): void {
    const subscription = this.channelSubscriptions.get(channel);

    if (!subscription) {
      return;
    }

    // Execute all callbacks for this channel
    for (const callback of subscription.callbacks) {
      try {
        const result = callback(channel, message);
        if (result instanceof Promise) {
          result.catch(err => {
            console.error(`[RedisEventManager] Error in channel callback for ${channel}:`, err);
          });
        }
      } catch (err) {
        console.error(`[RedisEventManager] Error in channel callback for ${channel}:`, err);
      }
    }
  }

  /**
   * Get the Redis keyspace notification channel pattern for a key pattern and event type
   * @private
   */
  private getKeyspaceChannel(keyPattern: string, eventType: RedisEventType): string {
    // Use keyevent pattern for event-based subscriptions
    // Format: __keyevent@0__:expired
    return `__keyevent@0__:${eventType}`;
  }

  /**
   * Check if a key matches a pattern (supports * wildcard)
   * @private
   */
  private matchesPattern(key: string, pattern: string): boolean {
    if (pattern === key) {
      return true;
    }

    if (!pattern.includes("*")) {
      return false;
    }

    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
      .replace(/\*/g, ".*"); // Replace * with .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * Get subscription statistics (for debugging/monitoring)
   */
  public static getStats(): {
    keyspaceSubscriptions: number;
    channelSubscriptions: number;
    totalCallbacks: number;
  } {
    const instance = RedisEventManager.getInstance();
    let totalCallbacks = 0;

    for (const sub of instance.keyspaceSubscriptions.values()) {
      totalCallbacks += sub.callbacks.size;
    }

    for (const sub of instance.channelSubscriptions.values()) {
      totalCallbacks += sub.callbacks.size;
    }

    return {
      keyspaceSubscriptions: instance.keyspaceSubscriptions.size,
      channelSubscriptions: instance.channelSubscriptions.size,
      totalCallbacks,
    };
  }
}
