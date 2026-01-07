/**
 * @file GameBoardState.ts
 * @description Pure data model for Ultimate Tic-Tac-Toe game board state.
 *              Handles storage and access of board data, separating concerns from game logic.
 *              Designed to be serializable for client-server synchronization.
 * @author John Khalife
 * @created 2026-01-06
 */

/**
 * Serializable representation of the game board state
 */
export interface GameBoardStateJSON {
  grid: number[];
  gridSize: number;
  maxLevelSize: number;
  selectedLevel: number;
  selectedIndex: number;
}

/**
 * Core game board state class
 *
 * Responsibilities:
 * - Store board data using negative number encoding for ownership
 * - Provide data access methods
 * - Handle serialization/deserialization
 * - Track game constraints (selected level/index for Ultimate TicTacToe rules)
 *
 * Encoding scheme:
 * - Positive numbers (>0): Player ID at that cell
 * - Zero (0): Empty cell
 * - Negative numbers (<0): Board ownership marker
 *   - grid[index] = -levelSize (indicates a board at this level is owned)
 *   - grid[index+1] = owner (player ID, 0 for draw)
 */
export default class GameBoardState {
  private grid: number[];

  readonly gridSize: number;
  readonly maxLevelSize: number;

  // Performance optimization: cache board size calculations
  private sizeCache: number[];

  // Game constraint state - where the player is allowed to play
  public selectedLevel: number;
  public selectedIndex: number;

  /**
   * Creates a new game board state
   * @param gridSize - Size of each tic-tac-toe grid (typically 3 for 3x3)
   * @param maxLevelSize - Maximum nesting level (0 = single board, 1 = standard Ultimate, 2+ = deeper nesting)
   */
  constructor(gridSize: number = 3, maxLevelSize: number = 0) {
    this.gridSize = gridSize;
    this.maxLevelSize = maxLevelSize;

    // Pre-compute all board sizes for performance
    this.sizeCache = [];
    for (let i = 0; i <= maxLevelSize; i++) {
      this.sizeCache[i] = Math.pow(gridSize * gridSize, i);
    }

    // Initialize grid: total size is (gridSize^2)^maxLevelSize
    this.grid = Array(this.sizeCache[maxLevelSize]).fill(0);

    // Initialize to no constraints (player can choose any board)
    this.selectedLevel = 0;
    this.selectedIndex = 0;
  }

  /**
   * Gets the value at a specific grid index
   * @param index - The 1D array index
   * @returns The value at that index (0 = empty, positive = player ID, negative = ownership marker)
   */
  public getSlot(index: number): number {
    if (index < 0 || index >= this.grid.length) {
      throw new Error(`Index ${index} out of bounds (grid size: ${this.grid.length})`);
    }
    return this.grid[index];
  }

  /**
   * Sets the value at a specific grid index
   * @param index - The 1D array index
   * @param value - The value to set (0 = empty, positive = player ID, negative = ownership marker)
   */
  public setSlot(index: number, value: number): void {
    if (index < 0 || index >= this.grid.length) {
      throw new Error(`Index ${index} out of bounds (grid size: ${this.grid.length})`);
    }
    this.grid[index] = value;
  }

  /**
   * Gets the owner of a board at a specific index and level
   * @param index - The index to check
   * @param searchingLevel - The level to check ownership at (0 = cell level, 1+ = board levels)
   * @returns Player ID of the owner (0 = unowned/empty)
   *
   * Uses the negative number encoding:
   * - If grid[index] < 0, it means a board is owned
   * - grid[index] = -levelSize
   * - grid[index+1] = owner
   */
  public getOwner(index: number, searchingLevel: number = 1): number {
    // For cell-level (searchingLevel = 0), return the cell value directly
    if (searchingLevel <= 0) {
      return this.getSlot(index);
    }

    const slotValue = this.getSlot(index);

    // Check if this slot has ownership marker (negative number)
    if (slotValue < 0) {
      const storedLevelSize = Math.abs(slotValue);

      // If searching for a level higher than what's stored, return 0
      if (searchingLevel > storedLevelSize) {
        return 0;
      }

      // Return the owner stored at index+1
      return this.getSlot(index + 1);
    }

    // No ownership marker
    return 0;
  }

  /**
   * Sets ownership of a board
   * @param index - Starting index of the board
   * @param owner - Player ID (0 = draw)
   * @param levelSize - The level at which this board was won
   *
   * Uses negative number encoding:
   * - grid[index] = -levelSize
   * - grid[index+1] = owner
   */
  public setOwner(index: number, owner: number, levelSize: number): void {
    if (levelSize <= 0) {
      // For level 0, just set the cell directly
      this.setSlot(index, owner);
      return;
    }

    // Store ownership using negative number encoding
    this.setSlot(index, -levelSize);
    this.setSlot(index + 1, owner);

    console.debug(`[TicTac] setOwner: index=${index}, owner=${owner}, levelSize=${levelSize} (grid[${index}]=${-levelSize}, grid[${index + 1}]=${owner})`);
  }

  /**
   * Gets the total number of cells in the grid
   */
  public getArraySize(): number {
    return this.grid.length;
  }

  /**
   * Checks if a board at the given index is owned
   * @param index - The index to check
   * @param levelSize - The level to check (1+ = board levels)
   * @returns true if owned at that level
   */
  public isBoardOwned(index: number, levelSize: number): boolean {
    const slotValue = this.getSlot(index);
    if (slotValue >= 0) {
      return false; // Not an ownership marker
    }
    const storedLevelSize = Math.abs(slotValue);
    return storedLevelSize >= levelSize;
  }

  /**
   * Serializes the game state to JSON-compatible object
   */
  public toJSON(): GameBoardStateJSON {
    return {
      grid: [...this.grid], // Copy array (includes ownership encoding)
      gridSize: this.gridSize,
      maxLevelSize: this.maxLevelSize,
      selectedLevel: this.selectedLevel,
      selectedIndex: this.selectedIndex,
    };
  }

  /**
   * Deserializes a game state from JSON
   */
  public static fromJSON(data: GameBoardStateJSON): GameBoardState {
    const state = new GameBoardState(data.gridSize, data.maxLevelSize);
    state.grid = [...data.grid];
    state.selectedLevel = data.selectedLevel;
    state.selectedIndex = data.selectedIndex;
    // sizeCache is automatically computed in constructor
    return state;
  }

  /**
   * Creates a deep copy of this game state
   * Useful for optimistic updates on the client
   */
  public clone(): GameBoardState {
    const cloned = new GameBoardState(this.gridSize, this.maxLevelSize);
    cloned.grid = [...this.grid];
    cloned.selectedLevel = this.selectedLevel;
    cloned.selectedIndex = this.selectedIndex;
    // sizeCache is automatically computed in constructor
    return cloned;
  }

  /**
   * Resets the board to initial state
   */
  public reset(): void {
    this.grid.fill(0);
    this.selectedLevel = 0;
    this.selectedIndex = 0;
  }

  // ============================================================================
  // Coordinate Math & Navigation Methods
  // These methods encapsulate the index/coordinate conversions that were
  // previously scattered throughout GameRules
  // ============================================================================

  /**
   * Calculates the number of cells in a board of a given level
   * Uses cached values for performance
   * @param levelSize - Level of nesting
   * @returns Number of cells (gridSize^2)^levelSize
   */
  public getBoardSize(levelSize: number): number {
    if (levelSize < 0 || levelSize > this.maxLevelSize) {
      throw new Error(`Invalid levelSize ${levelSize} (max: ${this.maxLevelSize})`);
    }
    return this.sizeCache[levelSize];
  }

  /**
   * Gets the relative index of a cell within its containing board at a specific level
   * @param levelSize - The level to check (0 = largest board)
   * @param index - The absolute index
   * @returns A number between 0 and (gridSize * gridSize) - 1
   */
  public getRelativeIndex(levelSize: number, index: number): number {
    const size = this.sizeCache[this.maxLevelSize - levelSize];
    const factor = Math.floor(index / size);
    const range = index - factor * size;
    const divisions = size / (this.gridSize * this.gridSize);
    return Math.floor(range / divisions);
  }

  /**
   * Gets the column of a cell at a specific level
   * @param levelSize - The level to check (0 = largest board)
   * @param index - The absolute index
   * @returns Column number (0 to gridSize - 1)
   */
  public getCol(levelSize: number, index: number): number {
    return this.getRelativeIndex(levelSize, index) % this.gridSize;
  }

  /**
   * Gets the row of a cell at a specific level
   * @param levelSize - The level to check (0 = largest board)
   * @param index - The absolute index
   * @returns Row number (0 to gridSize - 1)
   */
  public getRow(levelSize: number, index: number): number {
    return Math.floor(this.getRelativeIndex(levelSize, index) / this.gridSize);
  }

  /**
   * Gets the first index of a board at a specific level containing the given index
   * @param index - Any index within the board
   * @param levelSize - The level of the board
   * @returns The starting index of that board
   */
  public getFirstSpot(index: number, levelSize: number): number {
    const size = this.getBoardSize(levelSize);
    return index - (index % size);
  }

  /**
   * Gets the index of a cell within a line (row/column/diagonal)
   * Encapsulates the complex index arithmetic for line checking
   * @param origin - The starting index of the board
   * @param lineIndex - Which line (row/col number)
   * @param position - Position along the line (0 to gridSize - 1)
   * @param slotSize - Size of each sub-board at this level
   * @param lineType - Type of line to check
   * @returns The absolute index of the cell
   */
  public getIndexInLine(
    origin: number,
    lineIndex: number,
    position: number,
    slotSize: number,
    lineType: "row" | "col" | "diag1" | "diag2",
  ): number {
    switch (lineType) {
      case "row":
        return origin + lineIndex * this.gridSize * slotSize + position * slotSize;
      case "col":
        return origin + lineIndex * slotSize + position * slotSize * this.gridSize;
      case "diag1":
        return origin + position * this.gridSize * slotSize + position * slotSize;
      case "diag2":
        return origin + position * this.gridSize * slotSize +
               ((this.gridSize - 1) * slotSize - position * slotSize);
    }
  }

  /**
   * Gets the slot value at a specific row/col within a sub-board
   * @param row - Row within the board
   * @param col - Column within the board
   * @param origin - Starting index of the board
   * @param levelSize - Level of the board
   * @returns The index at that row/col position
   */
  public getIndexAt(row: number, col: number, origin: number, levelSize: number): number {
    const slotSize = this.getBoardSize(levelSize);
    return origin + col * slotSize + row * this.gridSize * slotSize;
  }
}
