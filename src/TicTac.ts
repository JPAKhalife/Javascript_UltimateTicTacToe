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
        this.grid = Array((this.GRID_SIZE*this.GRID_SIZE)**this.maxLevelSize).fill(0);
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
    private setSlot(index: number,item: number): void 
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
     * @method selectSlot
     * @description modifies the selected level and size variables to reflect the slot selected by the player.
     * @param cursorCol - a number signifying the 
     */
    public selectSlot(cursorCol: number, cursorRow: number) {
        //*Level size should be incremented by one to indicate the size of the cursor/level of tictac that is selected.
        this.selectedLevel++; 
        //*Selected tictac size needs to be added to by cursor position (toget the selected tictac pos), then multiplied by the number of slots in a tictac.
        this.selectedIndex += (this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE)*(this.GRID_SIZE*this.GRID_SIZE);
        console.log("multiplied the selectedIndexTo: " + this.selectedIndex);
        console.log("The selected levelSize is: " + this.selectedLevel);
    }

    /**
     * @method updateSlot
     * @description This method sets a spot in the tictac and updates the position accordingly
     * @param turn - the value that the slot will be set to.
     * @param cursorCol - the column of the tictac that the cursor was in
     * @param cursorRow - the row of the tictac that the cursor was in 
     * @returns boolean that says whether or not the placement was successful
     */
    public updateSlot(turn: number, cursorCol: number, cursorRow: number): boolean {
        if (this.grid[this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE] != 0) {
            return false;
        }
        this.grid[this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE] = turn; //Set the new slot
        //Now where should I send the user?
        //For now, keep the user on the same levelsize, send them to the equivalent square
        this.selectedIndex -= ((this.GRID_SIZE*this.GRID_SIZE))*this.getRelativeIndex(this.selectedLevel - 2,this.selectedIndex); //Go to the first "index"
        this.selectedIndex += (cursorCol + cursorRow*this.GRID_SIZE)*(this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - (this.selectedLevel - 1));
        return true;
    }


    /**
     * @method getRelativeIndex 
     * @description This method returns the spot in the tictac we are looking for.
     * @param {*} levelSize 
     * @param {*} index 
     * @returns  returns a number between 0 - GRIDSIZE*GRIDSZE - 1
     */
    public getRelativeIndex(levelSize: number,index: number) {
        //So the first thing to do is check the levelsize.
        //We do this to get the number of spots a single tictac of levelSize is supposed to envelop
        //Legend: Levelsize of 0 would represent the largest tictac, levelsize of say 1 would be smallest tictacs on a standard board
        //That means the total number of slots envoloped by one tictac of that size would be 
        let size = (this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - levelSize);
        //Now we need to find a multiple of size that is the closest value to index - where it must be below index by a max of size.
        let factor = Math.floor(index/size);
        //Now to get the tictac, it would be
        let range = index - factor*size;
        //Then we need to divide range by this.GRIDSIZE*this.GRIDSIZE, so that we can split it into that many and return a number from 
        let divisions = Math.floor((size)/(this.GRID_SIZE*this.GRID_SIZE));
        //Then we find how many times divisions fits into range
        return Math.floor(range/divisions);
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