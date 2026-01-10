/**
 * @file OnlineGameManager.ts
 * @description /This file is responsible for managing the onlineGameManager
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import TicTac, { TictacStateObject } from "../../Shared/Game/TicTac";
import { DEFAULT_GRID_SIZE, DEFAULT_PLAYER_NUMBER } from "../../Shared/Game/TicTac";
import { TicTacState } from "../../Shared/Game/TicTac";
import type { GameUpdateMessage, GameStateUpdateMessage } from "../Communication/WebManager";
import type { GameStateInfo, PlayerInfo } from "../../Shared/Contracts/MessageToClientSchema";
import ServerRequestService from "../Communication/ServerRequestService";
import { GameManager, GameType } from "./GameManager";
import GuiManager from "../GuiManager";
import StartScreen from '../Screens/StartScreen';
import GameBoardState from "../../Shared/Game/GameBoardState";

//This class activates as soon as a game is started
export default class OnlineGameManager implements GameManager {
  private gameType: GameType = GameType.ONLINE;
  private board: TicTac;
  private turn: number;
  private isWon: boolean;
  private playerNumber: number;
  private requestService: ServerRequestService;
  private lobbyID: string ;
  private playerList: PlayerInfo[] = [];
  private gameState: GameStateInfo;

  constructor(
    gameStateInfo: GameStateInfo
  ) {
    this.isWon = false;
    // this.requestService.addGameListeners(this.handleGameUpdate.bind(this));

    // Store game state information if provided
    if (!gameStateInfo) { 
      throw Error("Online Game initialized without GameInfo");
     }
    console.debug("[OnlineGameManager] Initializing online game with gamestate: ", gameStateInfo);
    //This is used to keep track of the current player's turn
    this.turn = gameStateInfo.currentTurn as number;
    this.playerNumber = gameStateInfo.playerNum as number;
    this.lobbyID = gameStateInfo.lobbyID;
    this.requestService = ServerRequestService.getInstance();
    //The game manager will own a single tictac - which will hold all of the other tictacs and the lowest level slots
    //This is initialized with recursion
    this.board = new TicTac(gameStateInfo.levelSize, gameStateInfo.gridSize);
    this.gameState = gameStateInfo;
    this.playerList = gameStateInfo.playerList;
    this.turn = gameStateInfo.currentTurn;
    this.playerNumber = gameStateInfo.playerNum;

    // If board state was provided (for reconnection or spectator joining running game), apply it
    if (gameStateInfo.board) {
      const boardState = GameBoardState.fromJSON({
        grid: gameStateInfo.board,
        gridSize: gameStateInfo.gridSize,
        maxLevelSize: gameStateInfo.levelSize,
        selectedLevel: 1,
        selectedIndex: 0,
      });
      this.board.setBoardState(boardState);
      console.info("[GameManager] Board state restored from server");
    }

    console.info("[GameManager] Initialized with game state:", {
      lobbyID: gameStateInfo.lobbyID,
      playerCount: gameStateInfo.playerList.length,
      currentTurn: gameStateInfo.currentTurn,
      gridSize: gameStateInfo.gridSize,
      levelSize: gameStateInfo.levelSize,
      hasBoardState: !!gameStateInfo.board,
    });
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
      if (!this.requestService || !this.lobbyID) {
        console.error(
          "Cannot make move: ServerRequestService or lobbyID not initialized",
        );
        // return { state: TicTacState.INVALID };
      }

      // Send move to server
      if (this.requestService && this.lobbyID) {
        const success = await this.requestService.makeMove(this.lobbyID, {
          col: cursorCol,
          row: cursorRow,
        });
      } else {
        console.error("ServerRequestService or lobbyID is null");
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

  /**
   * @method setGameStateInfo
   * @description Set the game info based on new incoming information
   * @param gameStateInfo The new game state information from the server
   */
  setGameStateInfo(gameStateInfo: GameStateInfo): void {
    this.gameState = gameStateInfo;
    this.lobbyID = gameStateInfo.lobbyID;
    this.playerList = gameStateInfo.playerList;
    this.turn = gameStateInfo.currentTurn;
    this.playerNumber = gameStateInfo.playerNum;

    // Update board state if provided
    if (gameStateInfo.board) {
      const boardState = GameBoardState.fromJSON({
        grid: gameStateInfo.board,
        gridSize: gameStateInfo.gridSize,
        maxLevelSize: gameStateInfo.levelSize,
        selectedLevel: 1,
        selectedIndex: 0,
      });
      this.board.setBoardState(boardState);
      console.info("[GameManager] Board state updated from server");
    }

    console.info("[GameManager] Game state updated:", {
      lobbyID: gameStateInfo.lobbyID,
      playerCount: gameStateInfo.playerList.length,
      currentTurn: gameStateInfo.currentTurn,
      hasBoardState: !!gameStateInfo.board,
    });
  }
}
