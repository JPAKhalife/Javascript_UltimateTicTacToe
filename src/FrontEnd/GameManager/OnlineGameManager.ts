/**
 * @file OnlineGameManager.ts
 * @description /This file is responsible for managing the onlineGameManager
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import TicTac, { TictacStateObject } from "../TicTac";
import { DEFAULT_GRID_SIZE, DEFAULT_PLAYER_NUMBER } from "../TicTac";
import { TicTacState } from "../TicTac";
import type { GameUpdateMessage, GameStateUpdateMessage } from "../Communication/WebManager";
import type { GameStateInfo, PlayerInfo } from "../../Shared/Contracts/MessageToClientSchema";
import ServerRequestService from "../Communication/ServerRequestService";
import { GameManager, GameType } from "./GameManager";

//This class activates as soon as a game is started
export default class OnlineGameManager implements GameManager {
  private gameType: GameType;
  private board: TicTac;
  private turn: number;
  private isWon: boolean;
  private playerNumber: number;
  private requestService: ServerRequestService | null = null;
  private lobbyId: string | null = null;
  private playerList: PlayerInfo[] = [];
  private gameState: GameStateInfo | null = null;

  constructor(
    gameType: GameType = GameType.LOCAL,
    gridSize: number = DEFAULT_GRID_SIZE,
    gridLevels: number = 2,
    lobbyId?: string,
    gameStateInfo?: GameStateInfo
  ) {
    //The game manager should have a variable that keeps track of whether or not it is playing online or offline
    this.gameType = gameType;
    //The game manager will own a single tictac - which will hold all of the other tictacs and the lowest level slots
    //This is initialized with recursion
    this.board = new TicTac(gridLevels, gridSize);
    //This is used to keep track of the current player's turn
    this.turn = 1;
    this.isWon = false;
    this.playerNumber = DEFAULT_PLAYER_NUMBER;

    console.info(
      "[GameManager] Initializing game with mode: ",
      gameType === GameType.LOCAL ? "LOCAL" : "ONLINE",
    );

    if (gameType === GameType.ONLINE) {
      this.lobbyId = lobbyId || null;
      this.requestService = ServerRequestService.getInstance();
      this.requestService.addGameListeners(this.handleGameUpdate.bind(this));

      // Store game state information if provided
      if (gameStateInfo) {
        this.gameState = gameStateInfo;
        this.playerList = gameStateInfo.playerList;
        this.turn = gameStateInfo.currentTurn;
        this.playerNumber = gameStateInfo.playerNum;

        // If board state was provided (for reconnection or spectator joining running game), apply it
        // TODO: Implement board state restoration when TicTac.setBoardState() is available
        if (gameStateInfo.board) {
          console.info("[GameManager] Board state received, restoration not yet implemented");
        }

        console.info("[GameManager] Initialized with game state:", {
          lobbyID: gameStateInfo.lobbyID,
          playerCount: gameStateInfo.playerList.length,
          currentTurn: gameStateInfo.currentTurn,
          hasBoardState: !!gameStateInfo.board,
        });
      }
    }
  }

  /**
   * @method handleGameUpdate
   * @description Handle game updates from the server
   * @param update The game update from the server
   */
  private handleGameUpdate(update: GameUpdateMessage | GameStateUpdateMessage): void {
    // Handle game state updates
    if (update.type === "game_state_update") {
      // Handle game state changes (started, paused, ended)
      console.info("[GameManager] Game state update:", update.state);
    } else if (update.type === "game_update") {
      // Handle game board updates
      if (update.gameState) {
        // this.board.updateFromServer(update.gameState);
      }
      if (update.turn) {
        this.turn = update.turn;
      }
    }
  }

  /**
   * @method cleanup
   * @description Clean up resources when the game ends
   */
  public cleanup(): void {
    if (this.gameType === GameType.ONLINE && this.requestService) {
      this.requestService.removeGameListeners();
    }
  }

  /**
   * @method playMove
   * @description This method is used whenever the player makes a move on the grid.
   * @returns A boolean representing whether or not a move was played
   */
  public async playMove(
    cursorCol: number,
    cursorRow: number,
  ): Promise<TictacStateObject> {
    if (this.gameType === GameType.ONLINE) {
      if (!this.requestService || !this.lobbyId) {
        console.error(
          "Cannot make move: ServerRequestService or lobbyId not initialized",
        );
        // return { state: TicTacState.INVALID };
      }

      // Send move to server
      if (this.requestService && this.lobbyId) {
        const success = await this.requestService.makeMove(this.lobbyId, {
          col: cursorCol,
          row: cursorRow,
        });
      } else {
        console.error("ServerRequestService or lobbyId is null");
      }

      // Server will send game_update if move is valid
      return {
        state: TicTacState.ONGOING,
        wonLevelSize: 0,
        cursorCol,
        cursorRow,
      };
    } else {
      // Local game logic
      let state = this.board.updateSlot(this.turn, cursorCol, cursorRow);
      if (
        state.state == TicTacState.ONGOING ||
        state.state == TicTacState.LESSER_WIN
      ) {
        this.changeTurn();
      }
      return state;
    }
  }

  /**
   * @method handleMove
   * @description Handle a move made by a player
   * @param cursorCol Column position
   * @param cursorRow Row position
   * @param player Optional player number
   * @returns A tictac state object
   */
  public async handleMove(
    cursorCol: number,
    cursorRow: number,
    player?: number
  ): Promise<TictacStateObject> {
    return this.playMove(cursorCol, cursorRow);
  }

  /**
   * @method getBoard
   * @description This method returns the board owned by the game manager
   * @returns {TicTac}
   */
  getBoard(): TicTac {
    return this.board;
  }

  /**
   * @method getTurn
   * @description This method returns the turn of the game
   * @returns {number}
   */
  getTurn(): number {
    return this.turn;
  }

  /**
   * @method changeTurn
   * @description This method moves the turn to the next player
   */
  changeTurn(): void {
    this.turn = (this.turn % this.playerNumber) + 1;
  }

  /**
   * @method getPlayerList
   * @description Get the list of players in the game
   * @returns {PlayerInfo[]} Array of player information
   */
  getPlayerList(): PlayerInfo[] {
    return this.playerList;
  }

  /**
   * @method getGameState
   * @description Get the complete game state information
   * @returns {GameStateInfo | null} The game state info or null if not available
   */
  getGameState(): GameStateInfo | null {
    return this.gameState;
  }

  /**
   * @method getPlayerName
   * @description Get the username for a specific player number
   * @param playerNumber The player number (1-based)
   * @returns {string} The player's username or "Unknown" if not found
   */
  getPlayerName(playerNumber: number): string {
    if (playerNumber < 1 || playerNumber > this.playerList.length) {
      return "Unknown";
    }
    return this.playerList[playerNumber - 1]?.username || "Unknown";
  }

  /**
   * @method getTurnName
   * @description Get the username of the player whose turn it is
   * @returns {string} The current player's username or "Player N" if not available
   */
  getTurnName(): string {
    const playerName = this.getPlayerName(this.turn);
    // If no player info available (local game or game state not loaded), use generic name
    if (playerName === "Unknown" || this.playerList.length === 0) {
      return `Player ${this.turn}`;
    }
    return playerName;
  }

  /**
   * @method getPlayerNumber
   * @description Get the total number of players in the game
   * @returns {number} The player count
   */
  getPlayerNumber(): number {
    return this.playerNumber;
  }
}
