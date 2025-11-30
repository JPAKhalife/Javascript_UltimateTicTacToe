/**
 * @file ServerConnections.ts
 * @description Manages server registry using Redis hash with expiry-based cleanup
 * @author John Khalife
 * @created 2025-11-29
 */

import { DatabaseManager } from "./DatabaseManager";
import { v4 as uuidv4 } from "uuid";
import os from "os";

/**
 * ServerConnections class for managing server registry in Redis
 * Uses a simple hash structure with expiry-based cleanup
 */
export class ServerConnections {
  private static instance: ServerConnections | null = null;
  private serverID: string;
  private address: string;
  private port: number;
  private refreshInterval: NodeJS.Timeout | null = null;

  // Redis key for the servers hash
  private static readonly SERVERS_HASH_KEY = "active_servers";
  // How often to refresh our entry (in milliseconds)
  private static readonly REFRESH_INTERVAL = 30000; // 30 seconds
  // How long each server entry should live (in seconds)
  private static readonly ENTRY_TTL = 60; // 60 seconds

  /**
   * Private constructor for singleton pattern
   */
  private constructor(serverID: string, address: string, port: number) {
    this.serverID = serverID;
    this.address = address;
    this.port = port;
  }

  /**
   * Initialize and get the singleton instance of ServerConnections
   * @param address The server's address (IP or hostname)
   * @param port The server's port
   */
  public static async initialize(
    address: string,
    port: number,
  ): Promise<ServerConnections> {
    if (ServerConnections.instance) {
      return ServerConnections.instance;
    }

    // Generate unique server ID
    const serverID =
      process.env.SERVER_ID ||
      `server_${os.hostname()}_${uuidv4().slice(0, 8)}`;

    ServerConnections.instance = new ServerConnections(serverID, address, port);

    try {
      // Register this server in Redis
      await ServerConnections.instance.registerServer();

      // Start refresh interval
      ServerConnections.instance.startRefreshInterval();

      // Setup graceful shutdown
      ServerConnections.instance.setupGracefulShutdown();

      console.log(
        `Server ${serverID} registered successfully at ${address}:${port}`,
      );
      return ServerConnections.instance;
    } catch (error) {
      console.error("Failed to initialize ServerConnections:", error);
      throw error;
    }
  }

  /**
   * Get the singleton instance (must be initialized first)
   */
  public static getInstance(): ServerConnections {
    if (!ServerConnections.instance) {
      throw new Error(
        "ServerConnections not initialized. Call initialize() first.",
      );
    }
    return ServerConnections.instance;
  }

  /**
   * Register this server in the Redis hash
   */
  private async registerServer(): Promise<void> {
    try {
      const redisClient = DatabaseManager.getInstance().getRegularClient();
      const serverAddress = `${this.address}:${this.port}`;

      // Set server entry in hash with expiry
      await redisClient.hset(
        ServerConnections.SERVERS_HASH_KEY,
        this.serverID,
        serverAddress,
      );
      await redisClient.expire(
        ServerConnections.SERVERS_HASH_KEY,
        ServerConnections.ENTRY_TTL,
      );

      console.log(
        `Server ${this.serverID} registered in Redis at ${serverAddress}`,
      );
    } catch (error) {
      console.error("Failed to register server:", error);
      throw error;
    }
  }

  /**
   * Start the refresh interval to keep our entry alive
   */
  private startRefreshInterval(): void {
    this.refreshInterval = setInterval(async () => {
      try {
        await this.refreshServerEntry();
      } catch (error) {
        console.error("Failed to refresh server entry:", error);
      }
    }, ServerConnections.REFRESH_INTERVAL);

    console.log(`Refresh interval started for server ${this.serverID}`);
  }

  /**
   * Refresh this server's entry in Redis to prevent expiry
   */
  private async refreshServerEntry(): Promise<void> {
    try {
      const redisClient = DatabaseManager.getInstance().getRegularClient();
      const serverAddress = `${this.address}:${this.port}`;

      // Update our entry and reset the hash expiry
      await redisClient.hset(
        ServerConnections.SERVERS_HASH_KEY,
        this.serverID,
        serverAddress,
      );
      await redisClient.expire(
        ServerConnections.SERVERS_HASH_KEY,
        ServerConnections.ENTRY_TTL,
      );

      console.log(`Server ${this.serverID} entry refreshed`);
    } catch (error) {
      console.error("Failed to refresh server entry:", error);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const cleanup = async () => {
      console.log(`Shutting down server ${this.serverID}`);
      await this.unregisterServer();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGUSR2", cleanup); // For nodemon
    process.on("exit", cleanup);
  }

  /**
   * Unregister this server from Redis
   */
  private async unregisterServer(): Promise<void> {
    try {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }

      const redisClient = DatabaseManager.getInstance().getRegularClient();

      // Remove our entry from the hash
      await redisClient.hdel(ServerConnections.SERVERS_HASH_KEY, this.serverID);

      console.log(`Server ${this.serverID} unregistered successfully`);
    } catch (error) {
      console.error("Failed to unregister server:", error);
    }
  }

  /**
   * Get all active servers from Redis
   * @returns Map of serverID -> address:port
   */
  public static async getAllActiveServers(): Promise<Map<string, string>> {
    try {
      const redisClient = DatabaseManager.getInstance().getRegularClient();
      const serversHash = await redisClient.hgetall(
        ServerConnections.SERVERS_HASH_KEY,
      );

      const servers = new Map<string, string>();
      for (const [serverID, address] of Object.entries(serversHash)) {
        servers.set(serverID, address);
      }

      return servers;
    } catch (error) {
      console.error("Failed to get active servers:", error);
      return new Map();
    }
  }

  /**
   * Get server address by server ID
   * @param serverID The server ID to look up
   * @returns The address:port string or null if not found
   */
  public static async getServerAddress(
    serverID: string,
  ): Promise<string | null> {
    try {
      const redisClient = DatabaseManager.getInstance().getRegularClient();
      const address = await redisClient.hget(
        ServerConnections.SERVERS_HASH_KEY,
        serverID,
      );
      return address;
    } catch (error) {
      console.error(`Failed to get address for server ${serverID}:`, error);
      return null;
    }
  }

  /**
   * Check if a server is active
   * @param serverID The server ID to check
   */
  public static async isServerActive(serverID: string): Promise<boolean> {
    try {
      const redisClient = DatabaseManager.getInstance().getRegularClient();
      const exists = await redisClient.hexists(
        ServerConnections.SERVERS_HASH_KEY,
        serverID,
      );
      return exists === 1;
    } catch (error) {
      console.error(`Failed to check if server ${serverID} is active:`, error);
      return false;
    }
  }

  /**
   * Get this server's ID
   */
  public getServerID(): string {
    return this.serverID;
  }

  /**
   * Get this server's address
   */
  public getAddress(): string {
    return this.address;
  }

  /**
   * Get this server's port
   */
  public getPort(): number {
    return this.port;
  }

  /**
   * Get this server's full address string
   */
  public getFullAddress(): string {
    return `${this.address}:${this.port}`;
  }

  /**
   * Get count of active servers
   */
  public static async getActiveServerCount(): Promise<number> {
    try {
      const redisClient = DatabaseManager.getInstance().getRegularClient();
      const count = await redisClient.hlen(ServerConnections.SERVERS_HASH_KEY);
      return count;
    } catch (error) {
      console.error("Failed to get active server count:", error);
      return 0;
    }
  }

  /**
   * Convert server data to a JSON-friendly format
   */
  public toJSON(): Record<string, any> {
    return {
      serverID: this.serverID,
      address: this.address,
      port: this.port,
      fullAddress: this.getFullAddress(),
    };
  }
}
