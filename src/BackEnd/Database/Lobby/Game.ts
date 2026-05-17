/**
 * @file Game.ts
 * @description This file is responsible for containing information relevant to the game itself.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2025-12-23
 */

import { REDIS_KEYS } from "../../Contants";
import { RedisHash } from "../RedisBase/RedisHash";
import { Board } from "./Board";
import { PlayerList } from "./PlayerList";
import { DatabaseManager } from "../DatabaseManager";

/**
 * Interface defining the structure of game data stored in Redis
 */
export interface GameData {
  levelSize: number;
  gridSize: number;
  playerNum: number;
  currentPlayerIndex: number;
  selectedLevel: number;
  selectedIndex: number;
  winnerId?: string;
}

/**
 * Game class extending RedisHash for Redis-backed game management
 * Handles game state, board, and player turn logic
 *
 * Implements required static factory methods:
 * - static async create(lobbyID, levelSize, gridSize): Promise<Game>
 * - static async getById(lobbyID): Promise<Game | null>
 */
export class Game extends RedisHash<GameData> {
  // Every game has one board
  private board: Board;
  // Every game has a player list
  private playerList: PlayerList;
  // The lobbyID identifies the lobby this belongs to
  private lobbyID: string;

  /**
   * Private constructor - use static factory methods instead
   * @param lobbyID The ID of the lobby this game belongs to
   * @param gameData Initial game data
   * @param board Board instance
   * @param playerList PlayerList instance
   */
  private constructor(
    lobbyID: string,
    gameData: GameData,
    board: Board,
    playerList: PlayerList
  ) {
    super(lobbyID, gameData);
    this.lobbyID = lobbyID;
    this.board = board;
    this.playerList = playerList;
  }

  /**
   * Create a new game for a lobby
   * @param lobbyID The ID of the lobby to create a game for
   * @param levelSize The level size of the game board
   * @param gridSize The grid size of the game board
   * @returns A new Game instance
   */
  public static async create(
    lobbyID: string,
    levelSize: number,
    gridSize: number,
    playerNum: number
  ): Promise<Game> {
    // Load the player list (should already exist from lobby creation)
    const playerList = await PlayerList.getById(lobbyID);
    if (!playerList) {
      throw new Error(
        `[Game] PlayerList not found for lobby ${lobbyID}. Cannot create game.`
      );
    }

    // Create an empty board (no array initialization yet - deferred until game starts)
    const board = new Board(lobbyID);

    // Create game data
    const gameData: GameData = {
      levelSize,
      gridSize,
      playerNum,
      currentPlayerIndex: 0, // First player starts
      selectedLevel: 1,
      selectedIndex: 0,
      winnerId: undefined,
    };

    // Create the game instance
    const game = new Game(lobbyID, gameData, board, playerList);

    // Save the game to Redis
    await game.save();

    return game;
  }

  /**
   * Get an existing game by lobby ID
   * @param lobbyID The ID of the lobby to get the game for
   * @returns The Game instance or null if not found
   */
  public static async getById(lobbyID: string): Promise<Game | null> {
    try {
      const redisClient = DatabaseManager.getInstance().getRegularClient();

      // Load game data from Redis hash
      const gameKey = REDIS_KEYS.GAME(lobbyID);
      const gameData = await redisClient.hgetall(gameKey);

      if (!gameData || Object.keys(gameData).length === 0) {
        console.warn(`[Game] Game data not found for lobby ${lobbyID}`);
        return null;
      }

      // Load board and player list using static factory methods
      const [board, playerList] = await Promise.all([
        Board.getById(lobbyID),
        PlayerList.getById(lobbyID),
      ]);

      if (!board) {
        console.warn(
          `[Game] Board not found for lobby ${lobbyID} when loading game`
        );
        return null;
      }

      if (!playerList) {
        console.warn(
          `[Game] PlayerList not found for lobby ${lobbyID} when loading game`
        );
        return null;
      }

      // Parse game data
      const parsedData: GameData = {
        levelSize: parseInt(gameData.levelSize),
        gridSize: parseInt(gameData.gridSize),
        playerNum: parseInt(gameData.playerNum),
        currentPlayerIndex: parseInt(gameData.currentPlayerIndex),
        selectedLevel: parseInt(gameData.selectedLevel ?? "1"),
        selectedIndex: parseInt(gameData.selectedIndex ?? "0"),
        winnerId: gameData.winnerId || undefined,
      };

      // Create the fully loaded game instance
      const game = new Game(lobbyID, parsedData, board, playerList);
      game.version = parseInt(gameData.version || "0");

      return game;
    } catch (error) {
      console.warn(`[Game] Failed to load game for lobby ${lobbyID}:`, error);
      return null;
    }
  }

  /**
   * Get the Redis key for this game
   */
  protected getRedisKey(): string {
    return REDIS_KEYS.GAME(this.lobbyID);
  }

  /**
   * Initialize the board for the game when the game starts
   * This defers board creation until the game actually begins to save memory
   */
  public async initializeGame(): Promise<void> {
    // Calculate board size based on level and grid size
    const boardSize = Math.pow(this.data.gridSize * this.data.gridSize, this.data.levelSize);

    // Initialize the board with the calculated size
    await this.board.initializeBoard(boardSize);
  }

  /**
   * Get the current player ID whose turn it is
   * @returns The player ID of the current player
   */
  public getCurrentPlayerId(): string {
    const players = this.playerList.getItems();
    return players[this.data.currentPlayerIndex];
  }

  /**
   * Advance to the next player's turn
   */
  public async nextTurn(): Promise<void> {
    this.data.currentPlayerIndex = (this.data.currentPlayerIndex + 1) % this.data.playerNum;
    await this.save();
  }

  /**
   * Advance to the next player's turn and update the cursor state in one save
   */
  public async advanceTurn(selectedLevel: number, selectedIndex: number): Promise<void> {
    this.data.currentPlayerIndex = (this.data.currentPlayerIndex + 1) % this.data.playerNum;
    this.data.selectedLevel = selectedLevel;
    this.data.selectedIndex = selectedIndex;
    await this.save();
  }

  /**
   * Get the board instance
   * @returns The Board instance
   */
  public getBoard(): Board {
    return this.board;
  }

  /**
   * Get the board state as an array
   * @returns Array representing the board state
   */
  public getBoardState(): number[] {
    return this.board.getBoardState();
  }

  /**
   * Get the player list
   * @returns The PlayerList instance
   */
  public getPlayerList(): PlayerList {
    return this.playerList;
  }


  /**
   * Make a move on the board
   * @param playerId The ID of the player making the move
   * @param position The position on the board to place the move
   * @returns True if move was valid and made, false otherwise
   */
  public async makeMove(playerId: string, position: number): Promise<boolean> {
    // Check if it's this player's turn
    if (this.getCurrentPlayerId() !== playerId) {
      console.warn(
        `[Game] Player ${playerId} tried to move but it's not their turn`
      );
      return false;
    }

    // Check if the position is valid and empty
    const cellValue = await this.board.getCellValue(position);
    if (cellValue === null || cellValue !== 0) {
      console.warn(
        `[Game] Invalid move at position ${position} - cell is ${cellValue}`
      );
      return false;
    }

    // Get the player's index (1-based for board representation)
    const players = this.playerList.getItems();
    const playerIndex = players.indexOf(playerId) + 1;

    // Make the move
    await this.board.setCellValue(position, playerIndex);

    return true;
  }

  /**
   * Check if a position is valid and empty
   * @param position The position to check
   * @returns True if the move is valid
   */
  public async isValidMove(position: number): Promise<boolean> {
    const cellValue = await this.board.getCellValue(position);
    return cellValue !== null && cellValue === 0;
  }

  /**
   * Delete the game and clean up all related data
   */
  public async delete(): Promise<void> {
    await this.board.delete();
    await this.withTransaction((multi) => {
      multi.del(this.getRedisKey());
    });
  }

  /**
   * Convert game data to a JSON-friendly format
   */
  public toJSON(): Record<string, any> {
    return {
      lobbyID: this.lobbyID,
      levelSize: this.data.levelSize,
      gridSize: this.data.gridSize,
      currentPlayerIndex: this.data.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayerId(),
      playerIds: this.getPlayerList().getItems(),
      boardState: this.getBoardState(),
      winnerId: this.data.winnerId,
    };
  }
}
