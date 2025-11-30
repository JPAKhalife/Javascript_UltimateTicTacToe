/**
 * @file NewPlayer.ts
 * @description Player class that extends RedisObject for Redis-backed player data
 * @author John Khalife
 * @created 2025-11-16
 */

import { RedisObject, ConcurrentModificationError } from "./RedisObject";
import { REDIS_KEYS } from "../Contants";
import { DatabaseManager } from "./DatabaseManager";
import { v4 as uuidv4 } from "uuid";

/**
 * Interface defining the structure of player data stored in Redis
 */
interface PlayerData {
  playerID: string;
  username: string;
  lobbyID?: string;
  sessionID?: string;
}

/**
 * Player class extending RedisObject for Redis-backed player management
 */
export class Player extends RedisObject<PlayerData> {
  /**
   * Create a new player
   * @param username The player's username
   * @param lobbyID Optional lobby ID if player is joining a lobby directly
   */
  static async create(
    username: string,
    lobbyID?: string,
  ): Promise<Player | null> {
    if (!username || username.trim() === "") {
      throw new Error("Username cannot be empty");
    }

    // Check if player already exists with this username
    if (await Player.getByUsername(username)) {
      return null;
    }

    const playerID = uuidv4();
    const playerData: PlayerData = {
      playerID,
      username,
      lobbyID,
    };

    const player = new Player(
      playerID,
      playerData,
      DatabaseManager.getInstance().getRegularClient(),
    );

    try {
      // Save the player data and username mapping atomically
      await player.withTransaction((multi) => {
        multi.hset(player.getRedisKey(), {
          ...playerData,
          version: "0",
        });
        multi.hset(REDIS_KEYS.USERNAMES, username, playerID);
      });

      return player;
    } catch (error) {
      throw new Error(`Failed to create player: ${error}`);
    }
  }

  /**
   * Get a player by their ID
   * @param playerID The ID of the player to retrieve
   */
  static async getById(playerID: string): Promise<Player | null> {
    try {
      const player = new Player(
        playerID,
        { playerID, username: "", lobbyID: "" },
        DatabaseManager.getInstance().getRegularClient(),
      );
      await player.load();
      return player;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get a player by their username
   * @param username The username of the player to retrieve
   */
  static async getByUsername(username: string): Promise<Player | null> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();

    try {
      const playerID = await redisClient.hget(REDIS_KEYS.USERNAMES, username);
      if (!playerID) {
        return null;
      }

      return Player.getById(playerID);
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove a player from Redis
   * @param playerID The ID of the player to remove
   */
  static async remove(playerID: string): Promise<boolean> {
    const player = await Player.getById(playerID);
    if (!player) {
      return false;
    }

    try {
      // Remove player data and username mapping atomically
      await player.withTransaction((multi) => {
        multi.del(player.getRedisKey());
        multi.hdel(REDIS_KEYS.USERNAMES, player.get("username"));
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add this player to a lobby
   * @param lobbyID The ID of the lobby to join
   */
  async joinLobby(lobbyID: string): Promise<void> {
    if (this.get("lobbyID")) {
      throw new Error("Player is already in a lobby");
    }
    
    await this.set("lobbyID", lobbyID);
  }

  /**
   * Remove this player from their current lobby
   */
  async leaveLobby(): Promise<void> {
    if (!this.get("lobbyID")) {
      throw new Error("Player is not in a lobby");
    }

    await this.set("lobbyID", undefined);
  }

  /**
   * Get the Redis key for this player
   */
  protected getRedisKey(): string {
    return REDIS_KEYS.PLAYER(this.id);
  }
}
