/**
 * @file NewLobby.ts
 * @description Lobby class that extends RedisObject for Redis-backed lobby management
 * @author John Khalife
 * @created 2025-11-16
 */

import { RedisHash } from "../RedisBase/RedisHash";
import { ConcurrentModificationError } from "../RedisBase/RedisObject";
import { REDIS_KEYS, ERROR_MESSAGES, GAME_CONSTANTS } from "../../Contants";
import { DatabaseManager } from "../DatabaseManager";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../Player";
import { subscribeToLobby, unsubscribeFromLobby } from "../../Handling/ServerRedisGameEventHandler";
import { PlayerList } from './PlayerList';
import { Board } from "./Board";
import { Game } from "./Game";

/**
 * Interface defining the structure of lobby data stored in Redis
 */
interface LobbyData {
  lobbyID: string;
  lobbyName: string;
  playerNum: number;
  playersJoined: number;
  creator: string;
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
 * Lobby class extending RedisHash for Redis-backed lobby management
 */
export class Lobby extends RedisHash<LobbyData> {
  private players: PlayerList;
  private game: Game;

  constructor(lobbyID: string, lobbyData: LobbyData, game: Game, playerList: PlayerList) {
    super(lobbyID,lobbyData);
    this.players = playerList;
    this.game = game;
  }

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
      creator: creatorId,
      lobbyState: "waiting",
      allowSpectators: lobbyData.allowSpectators,
    };

    //Create the empty players list
    const playerList = await PlayerList.create(lobbyId);

    //Create the game object.
    const game = await Game.create(lobbyId, lobbyData.levelSize, lobbyData.gridSize);

    //Add to list of lobbies
    // Add to lobby list and names set
    redisClient.rpush("LobbyList", lobbyId);
    redisClient.sadd(REDIS_KEYS.LOBBY_NAMES, lobbyData.lobbyName.toLowerCase());

    const lobby = new Lobby(lobbyId, data, game, playerList);
    //Save the new values
    lobby.save();

    // Add the creator to the lobby
    const player = await Player.getById(creatorId);
    if (player) {
      await lobby.addPlayer(creatorId);
    }

    return lobby;
  }

  /**
   * Get a lobby by its ID
   * @param lobbyId The ID of the lobby to retrieve
   */
  static async getById(lobbyId: string): Promise<Lobby | null> {
    try {
      const game = await Game.getById(lobbyId);
      const playerList = await PlayerList.getById(lobbyId);
      if (!game || !playerList) {
        return null;
      }

      const lobby = new Lobby(
        lobbyId,
        {
          lobbyID: lobbyId,
          lobbyName: "",
          playerNum: 0,
          playersJoined: 0,
          creator: "",
          lobbyState: "",
          allowSpectators: false,
        },
        game,
        playerList
      );

      await lobby.load();
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

    //Check if the capacity allows for a player to join
    if (
      Number(this.get("playersJoined")) >= Number(this.get("playerNum")) &&
      !this.get("allowSpectators")
    ) {
      throw new Error(`Lobby ${this.id} is full`);
    }

    //Check if the playerID is already contained within the list of players
    if (this.players.getItems().includes(playerId)) {
      throw new Error(ERROR_MESSAGES.ALREADY_IN_LOBBY);
    }

    await this.withTransaction(async (multi) => {
      // Add player to lobby's player list
      multi.rpush(REDIS_KEYS.LOBBY_PLAYERS(this.id), playerId);

      // Update lobby data
      const newPlayersJoined = Number(this.get("playersJoined")) + 1;
      const newState =
        newPlayersJoined >= Number(this.get("playerNum")) ? "ready" : "waiting";

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
    if (!this.players.getItems().includes(playerId)) {
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
      const newPlayersJoined = Math.max(0, Number(this.get("playersJoined")) - 1);
      const newState = newPlayersJoined === 0 ? "empty" : "waiting";

      await this.set("playersJoined", newPlayersJoined);
      await this.set("lobbyState", newState);
    });

    this.players.remove(playerId)
  }

  /**
   * Delete the lobby and clean up all related data
   */
  async delete(): Promise<void> {
    // Remove all players first
    for (const playerId of this.players.getItems()) {
      const player = await Player.getById(playerId);
      if (player) {
        await this.removePlayer(playerId);
      }
    }

    await this.withTransaction((multi) => {
      // Remove all lobby data
      multi.del(this.getRedisKey());
      multi.del(REDIS_KEYS.BOARD(this.id));
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
    for (const playerId of this.players.getItems()) {
      const player = await Player.getById(playerId);
      if (player) {
        players.push(player);
      }
    }
    return players;
  }

  /**
   * Get playerList
   */
  getPlayerList(): PlayerList {
    return this.players;
  }

  /**
   * Get the game state
   */
  getGame(): Game {
    return this.game;
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
      creator: creator?.get("username") || "Unknown",
      lobbyState: this.get("lobbyState"),
      allowSpectators: this.get("allowSpectators"),
      gameState: this.game.getBoard().getItems(),
      players: await Promise.all(
        this.players.getItems().map(async (id) => {
          const player = await Player.getById(id);
          return player?.get("username") || "Unknown";
        }),
      ),
    };
  }
}
