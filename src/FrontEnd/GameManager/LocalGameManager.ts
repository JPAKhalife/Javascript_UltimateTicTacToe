/**
 * @file GameManager.ts
 * @description //This file is responsible for keeping track of the game state
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import TicTac, { TictacStateObject } from "../TicTac";
import { DEFAULT_GRID_SIZE, DEFAULT_PLAYER_NUMBER } from "../TicTac";
import { TicTacState } from "../TicTac";
import { HEADER } from "../sketch";
import { GameManager, GameType } from "./GameManager";

//This class activates as soon as a game is started
export default class LocalGameManager implements GameManager {
  private board: TicTac;
  private turn: number;
  private playerNumber: number;

  constructor(
    gridSize: number = DEFAULT_GRID_SIZE,
    gridLevels: number = 2,
  ) {
    //The game manager will own a single tictac - which will hold all of the other tictacs and the lowest level slots
    //This is initialized with recursion
    this.board = new TicTac(gridLevels, gridSize);
    //This is used to keep track of the current player's turn
    this.turn = 1;
    this.playerNumber = DEFAULT_PLAYER_NUMBER;

    console.info("[LocalGameManager] Initializing local game");
  }

  /**
   * @method cleanup
   * @description Clean up resources when the game ends
   */
  public cleanup(): void {}

  /**
   * @method playMove
   * @description This method is used whenever the player makes a move on the grid.
   * @returns A boolean representing whether or not a move was played
   */
  public async playMove(
    cursorCol: number,
    cursorRow: number,
  ): Promise<TictacStateObject> {
      let state = this.board.updateSlot(this.turn, cursorCol, cursorRow);
      if (
        state.state == TicTacState.ONGOING ||
        state.state == TicTacState.LESSER_WIN
      ) {
        this.changeTurn();
      }
      return state;
  }

  public async handleMove(
    cursorCol: number,
    cursorRow: number,
    player?: number
  ): Promise<TictacStateObject> {
    return this.playMove(cursorCol,cursorRow);
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
   * @method getTurnName
   * @description This method returns the name of the turn
   */
  getTurnName(): string {
      return HEADER.PLAYER_NAMES[this.turn - 1];
  }

  /**
   * @method changeTurn
   * @description This method moves the turn to the next player
   */
  changeTurn(): void {
    this.turn = (this.turn % this.playerNumber) + 1;
  }
}
