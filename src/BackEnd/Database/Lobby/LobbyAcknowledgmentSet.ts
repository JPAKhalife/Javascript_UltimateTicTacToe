/**
 * @file LobbyAcknowledgmentSet.ts
 * @description Tracks which players have acknowledged they're ready to start the game
 * @author John Khalife
 * @created 2025-12-27
 */

import { RedisSet } from "../RedisBase/RedisSet";
import { REDIS_KEYS } from "../../Contants";
import { DatabaseManager } from "../DatabaseManager";

/**
 * LobbyAcknowledgmentSet - Redis set storing player IDs who have acknowledged
 */
export class LobbyAcknowledgmentSet extends RedisSet<string> {
  /**
   * Create a new LobbyAcknowledgmentSet
   * @param lobbyID The lobby ID
   * @param items Initial set of player IDs (optional)
   */
  constructor(lobbyID: string, items: Set<string> = new Set()) {
    super(lobbyID, items);
  }

  /**
   * Serialize a player ID (already a string, so just return it)
   */
  protected serializeItem(playerID: string): string {
    return playerID;
  }

  /**
   * Deserialize a player ID (already a string, so just return it)
   */
  protected deserializeItem(value: string): string {
    return value;
  }

  /**
   * Get the Redis key for this acknowledgment set
   */
  protected getRedisKey(): string {
    return REDIS_KEYS.LOBBY_ACK_SET(this.id);
  }

  /**
   * Override size() to exclude the __init__ placeholder if it exists
   * @returns The number of actual player acknowledgments (excluding placeholder)
   */
  async size(): Promise<number> {
    const redisClient = this.getRedisClient();
    const key = this.getRedisKey();

    const totalSize = await redisClient.scard(key);
    const hasPlaceholder = await redisClient.sismember(key, "__init__");

    // Subtract 1 if the placeholder still exists
    return hasPlaceholder ? totalSize - 1 : totalSize;
  }

  /**
   * Create a new acknowledgment set for a lobby with 5-second expiry
   * When the set expires, it triggers handleLobbyAckTimeout
   * @param lobbyID The lobby ID
   */
  static async create(lobbyID: string): Promise<LobbyAcknowledgmentSet> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();
    const key = REDIS_KEYS.LOBBY_ACK_SET(lobbyID);

    // Create the set with a placeholder value and set expiry in one atomic operation
    // This ensures the key exists and can have an expiry set on it
    await redisClient.sadd(key, "__init__");
    const expireResult = await redisClient.expire(key, 5);

    console.info(`[LobbyAcknowledgmentSet] Created acknowledgment set for lobby ${lobbyID} with 5s expiry (expire result: ${expireResult})`);

    // Now remove the placeholder so the set is effectively empty
    await redisClient.srem(key, "__init__");

    const ackSet = new LobbyAcknowledgmentSet(lobbyID);
    return ackSet;
  }

  /**
   * Get an existing acknowledgment set by lobby ID
   * @param lobbyID The lobby ID
   */
  static async getById(lobbyID: string): Promise<LobbyAcknowledgmentSet | null> {
    try {
      const ackSet = new LobbyAcknowledgmentSet(lobbyID);
      await ackSet.load();
      return ackSet;
    } catch (error) {
      return null;
    }
  }
}
