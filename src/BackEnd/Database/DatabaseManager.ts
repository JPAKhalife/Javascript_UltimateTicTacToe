/**
 * @file DatabaseManager.ts
 * @description Singleton class to manage Redis database connections
 * @author John Khalife
 * @created 2025-09-20
 */

import Redis from "ioredis";
import { REDIS_KEYS } from "../Contants";
import {
  handleSessionExpiry,
  handleConnectionExpiry,
} from "../Handling/InternalHandler";
import { handleForwardLobbyMessage } from "../Handling/ServerRedisGameEventHandler";

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private regularClient: Redis | null = null;
  private subscriberClient: Redis | null = null;
  private initialized: boolean = false;

  private constructor() {
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = parseInt(process.env.REDIS_PORT || "6379");

    console.info(`DatabaseManager initialized with ${redisHost}:${redisPort}`);

    this.regularClient = new Redis({
      host: redisHost,
      port: redisPort,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.subscriberClient = new Redis({
      host: redisHost,
      port: redisPort,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });
  }

  /**
   * @method getInstance
   * @description Get the singleton instance of DatabaseManager
   * @returns DatabaseManager instance
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }

    // Ensure initialization happens when instance is accessed
    if (!DatabaseManager.instance.initialized) {
      DatabaseManager.instance.initializeClients();
    }

    return DatabaseManager.instance;
  }

  /**
   * @method initialize
   * @description Initialize the database with host and port
   * @param host Redis host
   * @param port Redis port
   */
  public initialize(host: string, port: number): void {
    if (this.initialized) {
      console.info("DatabaseManager already initialized");
      return;
    }

    try {
      this.regularClient = this.createRegularConnection(host, port);
      this.subscriberClient = this.createSubscriberConnection(host, port);
      this.initialized = true;
      console.info(`DatabaseManager initialized with ${host}:${port}`);
    } catch (error) {
      console.error("Failed to initialize DatabaseManager:", error);
      throw error;
    }
  }

  /**
   * @method initializeClients
   * @description Initialize Redis clients with default localhost settings (called lazily)
   * @private
   */
  private initializeClients(): void {
    if (this.initialized) {
      return;
    }

    // Use environment variables for lazy initialization
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = parseInt(process.env.REDIS_PORT || "6379");
    this.initialize(redisHost, redisPort);
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

    redisClient.on("error", (err) => {
      console.error(
        "Error occurred while connecting or accessing Redis regular server:",
        err,
      );
    });

    redisClient.on("connect", () => {
      console.info("Connected to Redis regular server");
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

    redisClient.config("SET", "notify-keyspace-events", "Ex");

    redisClient.on("error", (err) => {
      console.error(
        "Error occurred while connecting or accessing Redis subscriber server:",
        err,
      );
    });

    redisClient.on("connect", () => {
      console.info("Connected to Redis subscriber server");
    });

    redisClient.psubscribe("__keyevent@0__:expired", (err, count) => {
      if (err) {
        console.error("Failed to subscribe to key expiration events:", err);
      } else {
        console.info(`Subscribed to ${count} key expiration event(s).`);
      }
    });

    redisClient.on("pmessage", (pattern, channel, expiredKey) => {
      console.info(`Key expired: ${expiredKey}`);
      if (expiredKey.includes(REDIS_KEYS.SESSION(""))) {
        handleSessionExpiry(expiredKey);
      } else if (expiredKey.includes(REDIS_KEYS.CONNECTION(""))) {
        handleConnectionExpiry(expiredKey);
      }
    });

    redisClient.on("message", (channel, message) => {
      //Check if the channel name fontains lobby:
      if (channel.startsWith("lobby:")) {
        const lobbyID = channel.split(":")[1];
        handleForwardLobbyMessage(lobbyID, JSON.parse(message));
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
