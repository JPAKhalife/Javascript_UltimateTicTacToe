/**
 * @file GameRules.ts
 * @description Pure game logic for Ultimate Tic-Tac-Toe.
 *              Contains stateless functions that operate on GameBoardState.
 *              Shared between frontend and backend for consistent game rules.
 * @author John Khalife
 * @created 2026-01-06
 */

import GameBoardState from "./GameBoardState";

/**
 * Enum representing the state of the game after a move
 */
export enum TicTacState {
  ONGOING,      // Game continues
  DRAW,         // Board is full with no winner
  WIN,          // A player has won the entire game
  LESSER_WIN,   // A sub-board was won but game continues
  ERROR,        // Invalid move attempted
}

/**
 * Result object returned after a move is applied
 */
export interface MoveResult {
  state: TicTacState;
  wonLevelSize: number;  // The level at which a win occurred (0 = no win)
  cursorCol: number;     // Where the cursor should move (for UI)
  cursorRow: number;     // Where the cursor should move (for UI)
}

/**
 * Helper function to create a MoveResult
 */
export function createMoveResult(
  state: TicTacState,
  wonLevelSize: number = 0,
): MoveResult {
  return {
    state: state,
    wonLevelSize: wonLevelSize,
    cursorCol: 0,
    cursorRow: 0,
  };
}

/**
 * Pure game logic for Ultimate Tic-Tac-Toe
 * All methods are static and operate on GameBoardState without modifying it
 * (except for the apply methods which are intended to mutate state)
 */
export default class GameRules {
  /**
   * Validates if a move is legal
   * @param state - The current game state
   * @param index - The absolute index where the player wants to move
   * @param player - The player ID making the move
   * @returns true if the move is valid
   */
  public static isValidMove(
    state: GameBoardState,
    index: number,
    player: number,
  ): boolean {
    // Check bounds
    if (index < 0 || index >= state.getArraySize()) {
      return false;
    }

    // Check if slot is already occupied
    if (state.getSlot(index) !== 0) {
      return false;
    }

    // Check if the move is within the allowed region (Ultimate TicTacToe constraint)
    if (state.selectedLevel > 0) {
      const expectedStart = state.selectedIndex;
      const boardSize = state.getBoardSize(
        state.maxLevelSize - state.selectedLevel + 1,
      );
      const expectedEnd = expectedStart + boardSize;

      if (index < expectedStart || index >= expectedEnd) {
        return false;
      }
    }

    // Check if the containing board is already owned
    if (this.isSpotOwnedOrFull(state, index)) {
      return false;
    }

    return true;
  }

  /**
   * Applies a move to the game state and updates the state accordingly
   * @param state - The game state to modify
   * @param turn - The player ID making the move
   * @param cursorCol - Column within the selected board
   * @param cursorRow - Row within the selected board
   * @returns MoveResult indicating the outcome
   */
  public static applyMove(
    state: GameBoardState,
    turn: number,
    cursorCol: number,
    cursorRow: number,
  ): MoveResult {
    const index =
      state.selectedIndex + cursorCol + cursorRow * state.gridSize;

    console.debug(`[TicTac] applyMove: player=${turn}, col=${cursorCol}, row=${cursorRow}, index=${index}, selectedIndex=${state.selectedIndex}, selectedLevel=${state.selectedLevel}`);

    // Validate the move
    if (state.getSlot(index) !== 0) {
      console.debug(`[TicTac] applyMove: ERROR - slot already occupied (value=${state.getSlot(index)})`);
      return createMoveResult(TicTacState.ERROR);
    }

    // Place the move
    state.setSlot(index, turn);
    console.debug(`[TicTac] applyMove: placed player ${turn} at index ${index}`);

    // Check for win or draw
    const winResult = this.checkForWinOrFull(state, index);
    console.debug(`[TicTac] applyMove: winResult state=${TicTacState[winResult.state]}, wonLevel=${winResult.wonLevelSize}`);

    // Calculate where the cursor should go next
    this.updateCursorPosition(state, index, cursorCol, cursorRow, winResult);
    console.debug(`[TicTac] applyMove: new cursor position - selectedIndex=${state.selectedIndex}, selectedLevel=${state.selectedLevel}`);

    return winResult;
  }

  /**
   * Updates the cursor position after a move according to Ultimate TicTacToe rules
   * The player must move in the sub-board corresponding to the cell that was just played
   */
  private static updateCursorPosition(
    state: GameBoardState,
    index: number,
    cursorCol: number,
    cursorRow: number,
    winResult: MoveResult,
  ): void {
    // If the game is won or no level was won, reset to root
    if (winResult.wonLevelSize === 0 || winResult.state === TicTacState.WIN) {
      state.selectedIndex = 0;
      state.selectedLevel = 0;
      return;
    }

    // Get the relative position at each level
    const relativeSpots: number[] = [];
    for (let i = 0; i < state.maxLevelSize; i++) {
      relativeSpots.push(state.getRelativeIndex(i, index));
    }

    // Navigate from the top of the board — levelSize must not exceed maxLevelSize.
    // wonLevelSize equals the loop counter i from checkForWinOrFull (not the won level directly),
    // so the original formula overflows when wonLevelSize < maxLevelSize.
    let destination = state.getFirstSpot(
      index,
      Math.min(state.maxLevelSize - winResult.wonLevelSize + 2, state.maxLevelSize),
    );

    // Navigate to the appropriate destination board
    for (
      let j = Math.max(winResult.wonLevelSize - 1, 1);
      j < relativeSpots.length;
      j++
    ) {
      const col = relativeSpots[j] % state.gridSize;
      const row = Math.floor(relativeSpots[j] / state.gridSize);
      const newSpot = state.getIndexAt(row, col, destination, state.maxLevelSize - j);

      if (state.getOwner(newSpot, state.maxLevelSize - j) === 0) {
        destination = newSpot;
        state.selectedLevel = j + 1;
      } else {
        // The destination is owned, find the highest level that isn't owned
        state.selectedLevel = state.maxLevelSize - j + 1;
        while (
          state.getOwner(newSpot, state.maxLevelSize - state.selectedLevel + 1) !== 0
        ) {
          state.selectedLevel--;
        }
        break;
      }
    }

    state.selectedIndex = destination;
  }

  /**
   * Checks if a win or draw occurred after placing a piece at the given index
   * @param state - The game state
   * @param index - The index where the last move was made
   * @returns MoveResult indicating win/draw/ongoing
   */
  public static checkForWinOrFull(
    state: GameBoardState,
    index: number,
  ): MoveResult {
    console.debug(`[TicTac] checkForWinOrFull: checking index=${index}, maxLevelSize=${state.maxLevelSize}`);

    // Check from smallest to largest level
    for (let i = state.maxLevelSize; i >= 1; i--) {
      const slotRow = state.getRow(i - 1, index);
      const slotCol = state.getCol(i - 1, index);
      const slotSize = state.getBoardSize(state.maxLevelSize - i);
      const origin = state.getFirstSpot(index, state.maxLevelSize - i + 1);
      const checkingLevel = state.maxLevelSize - i;

      console.debug(`[TicTac] checkForWinOrFull: level i=${i}, row=${slotRow}, col=${slotCol}, slotSize=${slotSize}, origin=${origin}, checkingLevel=${checkingLevel}`);

      // Check row
      let winner = this.checkLine(state, origin, slotRow, slotSize, "row", checkingLevel);
      if (winner !== 0) {
        console.debug(`[TicTac] checkForWinOrFull: ROW WIN! winner=${winner}, setting owner at origin=${origin}, levelSize=${state.maxLevelSize - i + 1}`);
        state.setOwner(origin, winner, state.maxLevelSize - i + 1);
        if (i === 1) {
          console.debug(`[TicTac] checkForWinOrFull: GAME WON by player ${winner}`);
          return createMoveResult(TicTacState.WIN, i);
        }
        continue;
      }

      // Check column
      winner = this.checkLine(state, origin, slotCol, slotSize, "col", checkingLevel);
      if (winner !== 0) {
        console.debug(`[TicTac] checkForWinOrFull: COLUMN WIN! winner=${winner}, setting owner at origin=${origin}, levelSize=${state.maxLevelSize - i + 1}`);
        state.setOwner(origin, winner, state.maxLevelSize - i + 1);
        if (i === 1) {
          console.debug(`[TicTac] checkForWinOrFull: GAME WON by player ${winner}`);
          return createMoveResult(TicTacState.WIN, i);
        }
        continue;
      }

      // Check diagonals (only if applicable)
      if (slotCol === slotRow) {
        winner = this.checkLine(state, origin, 0, slotSize, "diag1", checkingLevel);
        if (winner !== 0) {
          console.debug(`[TicTac] checkForWinOrFull: DIAGONAL1 WIN! winner=${winner}, setting owner at origin=${origin}, levelSize=${state.maxLevelSize - i + 1}`);
          state.setOwner(origin, winner, state.maxLevelSize - i + 1);
          if (i === 1) {
            console.debug(`[TicTac] checkForWinOrFull: GAME WON by player ${winner}`);
            return createMoveResult(TicTacState.WIN, i);
          }
          continue;
        }
      }

      if (slotRow === state.gridSize - slotCol - 1) {
        winner = this.checkLine(state, origin, 0, slotSize, "diag2", checkingLevel);
        if (winner !== 0) {
          console.debug(`[TicTac] checkForWinOrFull: DIAGONAL2 WIN! winner=${winner}, setting owner at origin=${origin}, levelSize=${state.maxLevelSize - i + 1}`);
          state.setOwner(origin, winner, state.maxLevelSize - i + 1);
          if (i === 1) {
            console.debug(`[TicTac] checkForWinOrFull: GAME WON by player ${winner}`);
            return createMoveResult(TicTacState.WIN, i);
          }
          continue;
        }
      }

      // Check if board is full (draw)
      if (this.isBoardFull(state, origin, slotSize, checkingLevel)) {
        console.debug(`[TicTac] checkForWinOrFull: BOARD FULL (draw) at origin=${origin}, levelSize=${state.maxLevelSize - i + 1}`);
        state.setOwner(origin, 0, state.maxLevelSize - i + 1);
        if (i === 1) {
          console.debug(`[TicTac] checkForWinOrFull: GAME DRAW`);
          return createMoveResult(TicTacState.DRAW, i);
        }
      }

      // No win found at this level, stop checking higher levels
      console.debug(`[TicTac] checkForWinOrFull: No win at level i=${i}, returning ONGOING`);
      return createMoveResult(TicTacState.ONGOING, i);
    }

    console.debug(`[TicTac] checkForWinOrFull: Completed all levels, returning ONGOING`);
    return createMoveResult(TicTacState.ONGOING, 0);
  }

  /**
   * Checks if a line (row/column/diagonal) has all the same owner
   * @returns The owner ID if the line is won, 0 otherwise
   */
  private static checkLine(
    state: GameBoardState,
    origin: number,
    lineIndex: number,
    slotSize: number,
    lineType: "row" | "col" | "diag1" | "diag2",
    levelSize: number,
  ): number {
    const firstOwner = this.getLineCell(state, origin, lineIndex, 0, slotSize, lineType, levelSize);

    console.debug(`[TicTac] checkLine: type=${lineType}, lineIndex=${lineIndex}, origin=${origin}, levelSize=${levelSize}, firstOwner=${firstOwner}`);

    if (firstOwner === 0) {
      console.debug(`[TicTac] checkLine: first cell empty, no win`);
      return 0; // Empty cell, can't be a win
    }

    const owners: number[] = [firstOwner];
    for (let j = 1; j < state.gridSize; j++) {
      const owner = this.getLineCell(state, origin, lineIndex, j, slotSize, lineType, levelSize);
      owners.push(owner);
      if (owner !== firstOwner) {
        console.debug(`[TicTac] checkLine: mismatch at position ${j}: owner=${owner} vs firstOwner=${firstOwner}, owners=[${owners.join(", ")}]`);
        return 0;
      }
    }

    console.debug(`[TicTac] checkLine: WIN DETECTED! All cells owned by ${firstOwner}, owners=[${owners.join(", ")}]`);
    return firstOwner; // Return the winner
  }

  /**
   * Gets the owner of a cell in a line (row/col/diagonal)
   */
  private static getLineCell(
    state: GameBoardState,
    origin: number,
    lineIndex: number,
    position: number,
    slotSize: number,
    lineType: "row" | "col" | "diag1" | "diag2",
    levelSize: number,
  ): number {
    const index = state.getIndexInLine(origin, lineIndex, position, slotSize, lineType);
    return state.getOwner(index, levelSize);
  }

  /**
   * Checks if a board is completely full
   */
  private static isBoardFull(
    state: GameBoardState,
    origin: number,
    slotSize: number,
    levelSize: number,
  ): boolean {
    for (let j = 0; j < state.gridSize * state.gridSize; j++) {
      if (state.getOwner(origin + j * slotSize, levelSize) === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if a spot is owned or the cell is occupied
   * @param state - The game state
   * @param index - The index to check
   * @param minLevel - Minimum level to check (default 1)
   */
  public static isSpotOwnedOrFull(
    state: GameBoardState,
    index: number,
    minLevel: number = 1,
  ): boolean {
    // Check if the cell itself is occupied
    if (minLevel <= 0) {
      minLevel = 1;
      if (state.getSlot(index) > 0) {
        return true;
      }
    }

    // Check if any containing board is owned
    for (let i = minLevel; i <= state.maxLevelSize; i++) {
      const firstSpot = state.getFirstSpot(index, i);
      if (state.isBoardOwned(firstSpot, i)) {
        return true;
      }
    }

    return false;
  }

  /**
   * @deprecated Use state.getBoardSize() instead
   * Kept for backward compatibility with existing code
   */
  public static calculateSize(gridSize: number, levelSize: number): number {
    return Math.pow(gridSize * gridSize, levelSize);
  }

  /**
   * @deprecated Use state.getRelativeIndex() instead
   * Kept for backward compatibility with existing code
   */
  public static getRelativeIndex(
    state: GameBoardState,
    levelSize: number,
    index: number,
  ): number {
    return state.getRelativeIndex(levelSize, index);
  }

  /**
   * @deprecated Use state.getCol() instead
   * Kept for backward compatibility with existing code
   */
  public static getCol(
    state: GameBoardState,
    levelSize: number,
    index: number,
  ): number {
    return state.getCol(levelSize, index);
  }

  /**
   * @deprecated Use state.getRow() instead
   * Kept for backward compatibility with existing code
   */
  public static getRow(
    state: GameBoardState,
    levelSize: number,
    index: number,
  ): number {
    return state.getRow(levelSize, index);
  }

  /**
   * @deprecated Use state.getFirstSpot() instead
   * Kept for backward compatibility with existing code
   */
  public static getFirstSpot(
    state: GameBoardState,
    index: number,
    levelSize: number,
  ): number {
    return state.getFirstSpot(index, levelSize);
  }

  /**
   * Gets the winner of the entire game
   * @returns Player ID of winner, or 0 if no winner yet
   */
  public static getWinner(state: GameBoardState): number {
    // Check if the board at index 0 is owned at the max level
    const slotValue = state.getSlot(0);
    if (slotValue < 0) {
      const levelSize = Math.abs(slotValue);
      if (levelSize === state.maxLevelSize) {
        return state.getSlot(1); // Owner is at index 1
      }
    }
    return 0;
  }
}
