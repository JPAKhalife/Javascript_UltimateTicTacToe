/**
 * @file NewLobby.ts
 * @description Lobby class that extends RedisObject for Redis-backed lobby management
 * @author John Khalife
 * @created 2025-11-16
 */

import { RedisObject, ConcurrentModificationError } from "../RedisObject";
import { REDIS_KEYS, ERROR_MESSAGES, GAME_CONSTANTS } from "../../Contants";
import { DatabaseManager } from "../DatabaseManager";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../Player";
import { subscribeToLobby, unsubscribeFromLobby } from "../../Handling/ServerRedisGameEventHandler";
import { unsubscribe } from "diagnostics_channel";

/**
 * Interface defining the structure of lobby data stored in Redis
 */
interface LobbyData {
  lobbyID: string;
  lobbyName: string;
  playerNum: number;
  playersJoined: number;
  levelSize: number;
  gridSize: number;
  creator: string;
  currentPlayer: string;
  lobbyState: string;
  allowSpectators: boolean;
}

/**
 * Input data for creating a new lobby
 */
export interface CreateLobbyData {
  lobbyName: string;
  playerNum: number;
  levelSize: number;
  gridSize: number;
  allowSpectators: boolean;
}

/**
 * Lobby class extending RedisObject for Redis-backed lobby management
 */
export class Lobby extends RedisObject<LobbyData> {
  private gameState: number[] = [];
  private players: string[] = [];

  /**
   * Create a new lobby
   * @param lobbyData The data for the new lobby
   * @param creatorId The ID of the player creating the lobby
   */
  static async create(
    lobbyData: CreateLobbyData,
    creatorId: string,
  ): Promise<Lobby> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();

    // Check if lobby name already exists
    const lobbyNameExists = await redisClient.sismember(
      REDIS_KEYS.LOBBY_NAMES,
      lobbyData.lobbyName.toLowerCase(),
    );
    if (lobbyNameExists) {
      throw new Error(ERROR_MESSAGES.LOBBY_NAME_EXISTS);
    }

    const lobbyId = uuidv4();
    const data: LobbyData = {
      lobbyID: lobbyId,
      lobbyName: lobbyData.lobbyName,
      playerNum: lobbyData.playerNum,
      playersJoined: 1, // Start with creator
      levelSize: lobbyData.levelSize,
      gridSize: lobbyData.gridSize,
      creator: creatorId,
      currentPlayer: "",
      lobbyState: "waiting",
      allowSpectators: lobbyData.allowSpectators,
    };

    const lobby = new Lobby(
      lobbyId,
      data,
      DatabaseManager.getInstance().getRegularClient(),
    );

    try {
      // Create game state array
      const gameStateSize = Math.pow(
        lobbyData.gridSize * lobbyData.gridSize,
        lobbyData.levelSize,
      );
      const gameState = new Array(gameStateSize).fill(0);

      // Create lobby with all related data atomically
      await lobby.withTransaction((multi) => {
        // Store lobby data
        multi.hset(lobby.getRedisKey(), {
          ...data,
          version: "0",
        });

        // Store game state
        const gameStateKey = REDIS_KEYS.GAME_STATES(lobbyId);
        multi.del(gameStateKey);
        if (gameState.length > 0) {
          multi.rpush(gameStateKey, ...gameState.map((val) => val.toString()));
        }

        // Create empty players list
        const playersKey = REDIS_KEYS.LOBBY_PLAYERS(lobbyId);
        multi.del(playersKey);
        multi.rpush(playersKey, creatorId);

        // Add to lobby list and names set
        multi.rpush("LobbyList", lobbyId);
        multi.sadd(REDIS_KEYS.LOBBY_NAMES, lobbyData.lobbyName.toLowerCase());
      });

      // Add the creator to the lobby
      const player = await Player.getById(creatorId);
      if (player) {
        await player.joinLobby(lobbyId);
      }

      lobby.gameState = gameState;
      lobby.players = [creatorId];

      return lobby;
    } catch (error) {
      // Clean up if creation fails
      await lobby.withTransaction((multi) => {
        multi.del(lobby.getRedisKey());
        multi.del(REDIS_KEYS.GAME_STATES(lobbyId));
        multi.del(REDIS_KEYS.LOBBY_PLAYERS(lobbyId));
        multi.lrem("LobbyList", 0, lobbyId);
        multi.srem(REDIS_KEYS.LOBBY_NAMES, lobbyData.lobbyName.toLowerCase());
      });

      throw new Error(`Failed to create lobby: ${error}`);
    }
  }

  /**
   * Get a lobby by its ID
   * @param lobbyId The ID of the lobby to retrieve
   */
  static async getById(lobbyId: string): Promise<Lobby | null> {
    try {
      const lobby = new Lobby(
        lobbyId,
        {
          lobbyID: lobbyId,
          lobbyName: "",
          playerNum: 0,
          playersJoined: 0,
          levelSize: 0,
          gridSize: 0,
          creator: "",
          currentPlayer: "",
          lobbyState: "",
          allowSpectators: false,
        },
        DatabaseManager.getInstance().getRegularClient(),
      );

      await lobby.load();

      // Load additional data
      const redisClient = DatabaseManager.getInstance().getRegularClient();
      const [gameState, players] = await Promise.all([
        redisClient.lrange(REDIS_KEYS.GAME_STATES(lobbyId), 0, -1),
        redisClient.lrange(REDIS_KEYS.LOBBY_PLAYERS(lobbyId), 0, -1),
      ]);

      lobby.gameState = gameState.map((val) => parseInt(val));
      lobby.players = players;

      return lobby;
    } catch (error) {
      return null;
    }
  }

  /**
   * Add a player to the lobby
   * @param playerId The ID of the player to add
   */
  async addPlayer(playerId: string): Promise<void> {
    const player = await Player.getById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (
      this.get("playersJoined") >= this.get("playerNum") &&
      !this.get("allowSpectators")
    ) {
      throw new Error(`Lobby ${this.id} is full`);
    }

    await this.withTransaction(async (multi) => {
      // Add player to lobby's player list
      multi.rpush(REDIS_KEYS.LOBBY_PLAYERS(this.id), playerId);

      // Update lobby data
      const newPlayersJoined = this.get("playersJoined") + 1;
      const newState =
        newPlayersJoined >= this.get("playerNum") ? "ready" : "waiting";

      await this.set("playersJoined", newPlayersJoined);
      await this.set("lobbyState", newState);
    });

    //Subscribe
    await subscribeToLobby(this.id, player.get("playerID"));

    // Update player's lobby reference
    await player.joinLobby(this.id);
    this.players.push(playerId);
  }

  /**
   * Remove a player from the lobby
   * @param playerId The ID of the player to remove
   */
  async removePlayer(playerId: string): Promise<void> {
    if (!this.players.includes(playerId)) {
      throw new Error(`Player ${playerId} is not in lobby ${this.id}`);
    }

    const player = await Player.getById(playerId);
    if (player) {
      await player.leaveLobby();
    }
    //Unsubscribe
    unsubscribeFromLobby(this.id, playerId);
    await this.withTransaction(async (multi) => {
      // Remove player from lobby's player list
      multi.lrem(REDIS_KEYS.LOBBY_PLAYERS(this.id), 0, playerId);

      // Update lobby data
      const newPlayersJoined = Math.max(0, this.get("playersJoined") - 1);
      const newState = newPlayersJoined === 0 ? "empty" : "waiting";

      await this.set("playersJoined", newPlayersJoined);
      await this.set("lobbyState", newState);
    });

    this.players = this.players.filter((id) => id !== playerId);
  }

  /**
   * Delete the lobby and clean up all related data
   */
  async delete(): Promise<void> {
    // Remove all players first
    for (const playerId of this.players) {
      const player = await Player.getById(playerId);
      if (player) {
        await player.leaveLobby();
      }
    }

    await this.withTransaction((multi) => {
      // Remove all lobby data
      multi.del(this.getRedisKey());
      multi.del(REDIS_KEYS.GAME_STATES(this.id));
      multi.del(REDIS_KEYS.LOBBY_PLAYERS(this.id));
      multi.lrem("LobbyList", 0, this.id);
      multi.srem(REDIS_KEYS.LOBBY_NAMES, this.get("lobbyName").toLowerCase());
    });
  }

  /**
   * Get the Redis key for this lobby
   */
  protected getRedisKey(): string {
    return REDIS_KEYS.LOBBY(this.id);
  }

  /**
   * Get all players in the lobby
   */
  async getPlayers(): Promise<Player[]> {
    const players: Player[] = [];
    for (const playerId of this.players) {
      const player = await Player.getById(playerId);
      if (player) {
        players.push(player);
      }
    }
    return players;
  }

  /**
   * Get all the player Ids
   */
  getPlayerIDs(): string[] {
    return this.players;
  }

  /**
   * Get the game state
   */
  getGameState(): number[] {
    return this.gameState;
  }

  /**
   * Update the game state
   */
  async setGameState(newState: number[]): Promise<void> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();
    const gameStateKey = REDIS_KEYS.GAME_STATES(this.id);

    await this.withTransaction((multi) => {
      multi.del(gameStateKey);
      if (newState.length > 0) {
        multi.rpush(gameStateKey, ...newState.map((val) => val.toString()));
      }
    });

    this.gameState = [...newState];
  }

  /**
   * Convert lobby data to a JSON-friendly format
   */
  async toJSON(): Promise<Record<string, any>> {
    const creator = await Player.getById(this.get("creator"));
    return {
      lobbyID: this.id,
      lobbyName: this.get("lobbyName"),
      playerNum: this.get("playerNum"),
      playersJoined: this.get("playersJoined"),
      levelSize: this.get("levelSize"),
      gridSize: this.get("gridSize"),
      creator: creator?.get("username") || "Unknown",
      lobbyState: this.get("lobbyState"),
      allowSpectators: this.get("allowSpectators"),
      gameState: this.gameState,
      players: await Promise.all(
        this.players.map(async (id) => {
          const player = await Player.getById(id);
          return player?.get("username") || "Unknown";
        }),
      ),
    };
  }
}
