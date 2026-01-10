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
export interface LobbyData {
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
    super(lobbyID, lobbyData);
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

    const lobbyID = uuidv4();
    const data: LobbyData = {
      lobbyID: lobbyID,
      lobbyName: lobbyData.lobbyName,
      playerNum: lobbyData.playerNum,
      playersJoined: 0,
      creator: creatorId,
      lobbyState: "waiting",
      allowSpectators: lobbyData.allowSpectators,
    };

    //Create the empty players list
    const playerList = await PlayerList.create(lobbyID);

    //Create the game object.
    const game = await Game.create(lobbyID, lobbyData.levelSize, lobbyData.gridSize);

    //Add to list of lobbies
    // Add to lobby list and names set
    redisClient.rpush(REDIS_KEYS.LOBBY_LIST, lobbyID);
    redisClient.sadd(REDIS_KEYS.LOBBY_NAMES, lobbyData.lobbyName.toLowerCase());

    const lobby = new Lobby(lobbyID, data, game, playerList);
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
   * @param lobbyID The ID of the lobby to retrieve
   */
  static async getById(lobbyID: string): Promise<Lobby | null> {
    try {
      const game = await Game.getById(lobbyID);
      const playerList = await PlayerList.getById(lobbyID);
      if (!game || !playerList) {
        return null;
      }

      const lobby = new Lobby(
        lobbyID,
        {
          lobbyID: lobbyID,
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
    const playersJoined = Number(this.get("playersJoined"));
    const playerNum = Number(this.get("playerNum"));
    // Handle both boolean and string values from Redis (string 'true'/'false' or boolean true/false)
    const allowSpectatorsValue = this.get("allowSpectators") as boolean | string;
    const allowSpectators = allowSpectatorsValue === true || allowSpectatorsValue === "true";

    if (playersJoined >= playerNum && !allowSpectators) {
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
      const currentState = this.get("lobbyState");

      // Only update state if game is not already running or paused
      // This allows spectators to join without changing the game state
      let newState = currentState;
      if (currentState !== "running" && currentState !== "paused") {
        newState = newPlayersJoined >= Number(this.get("playerNum")) ? "ready" : "waiting";
      }

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
  async removePlayer(playerID: string): Promise<void> {
    if (!this.players.getItems().includes(playerID)) {
      throw new Error(`Player ${playerID} is not in lobby ${this.id}`);
    }

    await this.removePlayerData(playerID);

    await this.withTransaction(async (multi) => {
      // Remove player from lobby's player list
      multi.lrem(REDIS_KEYS.LOBBY_PLAYERS(this.id), 0, playerID);

      // Update lobby data
      const newPlayersJoined = Math.max(0, Number(this.get("playersJoined")) - 1);
      const newState = newPlayersJoined === 0 ? "empty" : "waiting";

      await this.set("playersJoined", newPlayersJoined);
      await this.set("lobbyState", newState);
    });

    this.players.remove(playerID)
  }

  /**
   * @method removePlayerData
   * @description Only remove the player, don't worry about lobbystate changes. Called directly when a lobby will no longer be used.
   * @param playerID 
   */
  async removePlayerData(playerID: string) {
    const player = await Player.getById(playerID);
    if (player) {
      await player.leaveLobby();
    }
    //Unsubscribe
    await unsubscribeFromLobby(this.id, playerID);
  }

  /**
   * Delete the lobby and clean up all related data
   */
  async delete(): Promise<void> {
    // Remove all players from the lobby first
    for (const playerId of this.players.getItems()) {
      const player = await Player.getById(playerId);
      if (player) {
        await this.removePlayerData(playerId);
      }
    }
    //Remove the playerList
    this.players.delete();
    //Remove the game
    this.game.delete();
    await this.withTransaction((multi) => {
      // Remove all lobby data stored in retrieval hashes
      multi.lrem(REDIS_KEYS.LOBBY_LIST, 0, this.id);
      multi.srem(REDIS_KEYS.LOBBY_NAMES, this.get("lobbyName").toLowerCase());
      multi.del(this.getRedisKey());

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
