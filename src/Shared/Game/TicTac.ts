/**
 * @file TicTacBoard.ts
 * @description  This file is responsible for keeping track of the tictac game state
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2026-01-06
 */

import GameBoardState from "./GameBoardState";
import GameRules, { TicTacState } from "./GameRules";

// Re-export for backward compatibility
export { TicTacState };

// This object is intended to convey the state of the tictac (whether there was a win or not) and
// Where the cursor is supposed to go next.
export interface TictacStateObject {
  state: TicTacState;
  wonLevelSize: number;
  cursorCol: number;
  cursorRow: number;
}

// This is an object type that is used to send back information whenever the player makes a move.
export function moveResponse(
  state: TicTacState,
  wonLevelSize: number = 0,
): TictacStateObject {
  return {
    state: state,
    wonLevelSize: wonLevelSize,
    cursorCol: 0,
    cursorRow: 0,
  };
}

export const DEFAULT_GRID_SIZE = 3;
export const DEFAULT_PLAYER_NUMBER = 2;

/**
 * TicTac class - wrapper around GameBoardState and GameRules
 * Maintains backward compatibility with existing code while using the new architecture
 */
export default class TicTac {
  private boardState: GameBoardState;

  public constructor(maxLevelSize: number = 0, gridSize = 3) {
    this.boardState = new GameBoardState(gridSize, maxLevelSize);
    this.boardState.selectedLevel = 1;
  }

  /**
   * @method getSlot
   * @description This method returns the slot of the tictac
   * @param index
   * @returns A slot of the tictac
   */
  public getSlot(index: number): number {
    return this.boardState.getSlot(index);
  }

  /**
   * @method getArraySize
   * @description This method returns the size of the arrays
   * @returns {number}
   */
  public getArraySize(): number {
    return this.boardState.getArraySize();
  }

  /**
   * @method getWinner
   * @description This method returns the winner of the game
   * @returns {number}
   */
  public getWinner(): number {
    return GameRules.getWinner(this.boardState);
  }

  /**
   * @method getLevelSize
   * @description This method returns the levelsize of the tictac (number of tictacs inside tictacs)
   * @returns {number}
   */
  public getLevelSize(): number {
    return this.boardState.maxLevelSize;
  }

  /**
   * @method getSlotNum
   * @description This method should return the number of slots in a tictac
   * @returns {number}
   */
  public getGridSize() {
    return this.boardState.gridSize;
  }

  /**
   * @method getSelectedLevel
   * @description gives the current selected level
   * @returns an integer representing the currently selected level of the tictac.
   */
  public getSelectedLevel(): number {
    return this.boardState.selectedLevel;
  }

  /**
   * @method getSelectedIndex
   * @description returns the currently selected index of the tictac
   * @returns an integer representing the currently selected index of the tictac
   */
  public getSelectedIndex(): number {
    return this.boardState.selectedIndex;
  }

  /**
   * @method selectSlot
   * @description modifies the selected level and size variables to reflect the slot selected by the player.
   * @param cursorCol - the column being selected
   * @param cursorRow - the row being selected
   */
  public selectSlot(cursorCol: number, cursorRow: number): boolean {
    // Calculate the target index using the smart data model
    const targetIndex = this.boardState.getIndexAt(
      cursorRow,
      cursorCol,
      this.boardState.selectedIndex,
      this.boardState.maxLevelSize - this.boardState.selectedLevel,
    );

    if (this.getSlot(targetIndex) < 0) {
      return false;
    }

    // Update selectedIndex
    this.boardState.selectedIndex = targetIndex;

    // Level size should be incremented by one to indicate the size of the cursor/level of tictac that is selected.
    this.boardState.selectedLevel++;

    return true;
  }

  /**
   * @method updateSlot
   * @description This method sets a spot in the tictac and updates the position accordingly
   * @param turn - the value that the slot will be set to.
   * @param cursorCol - the column of the tictac that the cursor was in
   * @param cursorRow - the row of the tictac that the cursor was in
   * @returns TictacStateObject indicating the result of the move
   */
  public updateSlot(
    turn: number,
    cursorCol: number,
    cursorRow: number,
  ): TictacStateObject {
    const result = GameRules.applyMove(
      this.boardState,
      turn,
      cursorCol,
      cursorRow,
    );

    // Convert MoveResult to TictacStateObject for backward compatibility
    return {
      state: result.state,
      wonLevelSize: result.wonLevelSize,
      cursorCol: result.cursorCol,
      cursorRow: result.cursorRow,
    };
  }

  /**
   * @method getRelativeIndex
   * @description This method returns the spot in the tictac we are looking for.
   * @param levelSize - the level of tictac
   * @param index - the absolute index
   * @returns  returns a number between 0 - GRIDSIZE*GRIDSIZE - 1
   */
  public getRelativeIndex(levelSize: number, index: number): number {
    return this.boardState.getRelativeIndex(levelSize, index);
  }

  /**
   * @method isSpotOwnedOrFull
   * @description this method checks for whether or not a given spot is owned or full
   */
  public isSpotOwnedOrFull(index: number, min: number = 1): boolean {
    return GameRules.isSpotOwnedOrFull(this.boardState, index, min);
  }

  /**
   * @method getLevelOfIndex
   * @description returns the level of an index - whether or not it is base or higher
   */
  public getLevelOfIndex(index: number): number {
    const slotValue = this.getSlot(index);
    if (slotValue < 0) {
      return Math.abs(slotValue);
    }
    return 0;
  }

  /**
   * This method is intended to return the column of which tictac that a certain index is in.
   * @param levelSize - the level of Tictac that should be scanned
   * @param index
   * @returns An integer from 0 - GRIDSIZE - 1
   */
  public getCol(levelSize: number, index: number): number {
    return this.boardState.getCol(levelSize, index);
  }

  /**
   * This method is intended to return the row of which tictac that a certain index is in.
   * @param levelSize - the level of Tictac that should be scanned
   * @param index
   * @returns An integer from 0 - GRIDSIZE - 1
   */
  public getRow(levelSize: number, index: number): number {
    return this.boardState.getRow(levelSize, index);
  }

  /**
   * @method calculateSize
   * @description This method is calculates the size of a tictac of a certain levelSizes
   * @param levelsize - how deep the tictac is.
   * @returns a number indicating the number of slots in the tictac.
   */
  public calculateSize(levelSize: number): number {
    return this.boardState.getBoardSize(levelSize);
  }

  /**
   * @method calculateSideSize
   * @description This method is used to calculate the size of a tictac along it's side.
   * @param levelSize
   * @returns a number indicating the size length of a tictac level
   */
  public calculateSideSize(levelSize: number): number {
    return Math.sqrt((this.boardState.gridSize * this.boardState.gridSize) ^ levelSize);
  }

  /**
   * @method getOwner
   * @description This method returns the owner near a specific index
   * @param index - the index of the tictac you want to get the owner of
   * @param searchingLevel - the level of the tictac you want to get the owner of
   */
  public getOwner(index: number, searchingLevel: number = 1): number {
    return this.boardState.getOwner(index, searchingLevel);
  }

  /**
   * @method getFirstSpot
   * @description This method will return the index of the first spot of a tictac of the levelsize specified
   */
  public getFirstSpot(index: number, levelSize: number): number {
    return this.boardState.getFirstSpot(index, levelSize);
  }

  /**
   * Gets the underlying board state (useful for serialization/networking)
   */
  public getBoardState(): GameBoardState {
    return this.boardState;
  }

  /**
   * Sets the board state (useful for deserializing from network)
   */
  public setBoardState(state: GameBoardState): void {
    this.boardState = state;
  }

  /**
   * Clones this TicTac instance
   */
  public clone(): TicTac {
    const cloned = new TicTac(this.boardState.maxLevelSize, this.boardState.gridSize);
    cloned.setBoardState(this.boardState.clone());
    return cloned;
  }

  /**
   * Resets the board to initial state
   */
  public reset(): void {
    this.boardState.reset();
    this.boardState.selectedLevel = 1; // Restore initial selectedLevel
  }
}
