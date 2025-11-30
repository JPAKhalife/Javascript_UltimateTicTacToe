/**
 * @file GameManager.ts
 * @description //This file is responsible for keeping track of the game state
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import TicTac, { TictacStateObject } from "./TicTac";
import { DEFAULT_GRID_SIZE, DEFAULT_PLAYER_NUMBER } from "./TicTac";
import { TicTacState } from "./TicTac";
import WebManager, { GameUpdate } from "./WebManager";

//This is a constant that holds the types of games that can exist
export enum GameType {
  LOCAL,
  ONLINE,
}

//This class activates as soon as a game is started
export default class GameManager {
  private gameType: GameType;
  private board: TicTac;
  private turn: number;
  private isWon: boolean;
  private playerNumber: number;
  private webManager: WebManager | null = null;
  private lobbyId: string | null = null;

  constructor(
    gameType: GameType = GameType.LOCAL,
    gridSize: number = DEFAULT_GRID_SIZE,
    gridLevels: number = 2,
    lobbyId?: string,
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

    console.log(
      "[GameManager] Initializing game with mode: ",
      gameType === GameType.LOCAL ? "LOCAL" : "ONLINE",
    );

    // Set up online game if applicable
    if (gameType === GameType.ONLINE && lobbyId) {
      this.lobbyId = lobbyId;
      this.webManager = WebManager.getInstance();
      this.webManager.addGameListener(this.handleGameUpdate.bind(this));
    }
  }

  /**
   * @method handleGameUpdate
   * @description Handle game updates from the server
   * @param update The game update from the server
   */
  private handleGameUpdate(update: GameUpdate): void {
    // Update game state
    if (update.gameState) {
      // this.board.updateFromServer(update.gameState);
    }
    if (update.turn) {
      this.turn = update.turn;
    }
  }

  /**
   * @method cleanup
   * @description Clean up resources when the game ends
   */
  public cleanup(): void {
    if (this.gameType === GameType.ONLINE && this.webManager) {
      this.webManager.removeGameListener(this.handleGameUpdate.bind(this));
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
      if (!this.webManager || !this.lobbyId) {
        console.error(
          "Cannot make move: WebManager or lobbyId not initialized",
        );
        // return { state: TicTacState.INVALID };
      }

      // Send move to server
      if (this.webManager && this.lobbyId) {
        const success = await this.webManager.makeMove(this.lobbyId, {
          col: cursorCol,
          row: cursorRow,
        });
      } else {
        console.error("WebManager or lobbyId is null");
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
}
