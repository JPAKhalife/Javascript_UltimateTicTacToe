/**
 * @file TicTacBoard.ts
 * @description  This file is responsible for keeping track of the tictac game state
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


//Each tictac owns a grid of 3x3 (or more in the future who knows)
const TicTacState = {
    ONGOING:0,
    DRAW:1,
    WIN:2,
}
export const DEFAULT_GRID_SIZE = 3;
export const DEFAULT_PLAYER_NUMBER = 2;

export default class TicTac {
    private GRID_SIZE = DEFAULT_GRID_SIZE;
    private grid: number[];
    private state: number;
    private maxLevelSize: number;
    private selectedLevel: number;
    private selectedIndex: number;

    public constructor(maxLevelSize: number = 0) {
        //Grid size constant
        this.maxLevelSize = maxLevelSize;
        //Initialize the board with a grid of zeroes
        this.grid = Array((this.GRID_SIZE*this.GRID_SIZE)**this.maxLevelSize).fill(1);
        //We set the state variable - indicating if tic tac is active or not
        //! Potentially unnecessary
        this.state = TicTacState.ONGOING;
        //*Information about where the cursor is needs to be held by this class in order for legal move checking (online and offline).
        //This represents what levelsize the selected tictac is
        this.selectedLevel = 1;
        //This represents the index of the selected tictac
        this.selectedIndex = 0;
    }

    /**
     * @method getSlot
     * @description This method returns the slot of the tictac
     * @param index 
     * @returns A slot of the tictac
     */
    public getSlot(index: number): number 
    {
        return this.grid[index];
    }

    /**
     * @method setSlot
     * @description This method sets the slot of the grid
     * @param index {number}
     * @param item {number}
     */
    public setSlot(index: number,item: number): void 
    {
        this.grid[index] = item;
    }

    /**
     * @method getArraySize
     * @description This method returns the size of the arrays
     * @returns {number}
     */
    public getArraySize(): number 
    {
        return this.grid.length;
    }

    /**
     * @method getWinner
     * @description This method returns the winner of the game
     * @returns {number}
     */
    public getWinner(): number 
    {
        //Check if the entire grid has been won
        if (this.grid[0] == this.maxLevelSize) {
            return this.grid[1];
        }
        return 0;
    } 

    /**
     * @method getLevelSize
     * @description This method returns the levelsize of the tictac (number of tictacs inside tictacs)
     * @returns {number}
     */
    public getLevelSize(): number {
        return this.maxLevelSize;
    }

    /**
     * @method getSlotNum
     * @description This method should return the number of slots in a tictac
     * @returns {number}
     */
    public getGridSize() {
        return this.GRID_SIZE;
    }

    /**
     * @method getSelectedLevel
     * @description gives the current selected level
     * @returns an integer representing the currently selected level of the tictac.
     */
    public getSelectedLevel(): number {
        return this.selectedLevel;
    }

    /**
     * @method getSelectedIndex
     * @description returns the currently selected index of the tictac
     * @returns an integer representing the currently selected index of the tictac
     */
    public getSelectedIndex(): number {
        return this.selectedIndex;
    }

    /**
     * @method sendCursor
     * @description This method calculates the next spot for the player's cursor to move.
     * This should also be synced with the server to avoid client side cheating.
     */
    // sendCursor(): number  
    // {

    // }
}