/**
 * @file TicTacBoard.ts
 * @description  This file is responsible for keeping track of the tictac game state
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


//Each tictac owns a grid of 3x3 (or more in the future who knows)
export enum TicTacState {
    ONGOING,
    DRAW,
    WIN,
    ERROR
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
     * @method setOwner
     * @description This method sets the owner of a tictac
     * @param index
     * @param item
     * @param levelsize
     */
    private setOwner(index: number, item: number, levelSize: number) {
        if (levelSize > 0) {
            this.setSlot(index,levelSize*-1);
            this.setSlot(index+1,item);
        } else {
            this.setSlot(index, item);
        }
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
    public selectSlot(cursorCol: number, cursorRow: number): boolean {
        if (this.getSlot(this.selectedIndex + (this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE)*(this.GRID_SIZE*this.GRID_SIZE)) < 0) {
            return false;
        }
        //*Level size should be incremented by one to indicate the size of the cursor/level of tictac that is selected.
        this.selectedLevel++; 
        //*Selected tictac size needs to be added to by cursor position (toget the selected tictac pos), then multiplied by the number of slots in a tictac.
        this.selectedIndex += (this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE)*(this.GRID_SIZE*this.GRID_SIZE);
        console.log("multiplied the selectedIndexTo: " + this.selectedIndex);
        console.log("The selected levelSize is: " + this.selectedLevel);
        return true;
    }

    /**
     * @method updateSlot
     * @description This method sets a spot in the tictac and updates the position accordingly
     * @param turn - the value that the slot will be set to.
     * @param cursorCol - the column of the tictac that the cursor was in
     * @param cursorRow - the row of the tictac that the cursor was in 
     * @returns boolean that says whether or not the placement was successful
     */
    public updateSlot(turn: number, cursorCol: number, cursorRow: number): TicTacState {
        if (this.grid[this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE] != 0) {
            return TicTacState.ERROR;
        }
        this.grid[this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE] = turn; //Set the new slot
        //Then we check for a win
        let state = this.checkForWinOrFull(this.selectedIndex + cursorCol + cursorRow*this.GRID_SIZE);
        if (state != TicTacState.ONGOING) {
            return state;
        }
        
        //Now where should I send the user?
        //For now, keep the user on the same levelsize, send them to the equivalent square
        //You need to check whether or not the square they are being sent to has been taken already
        //If it has, give them a pick of the tictacs at that levelsize.
        let destination = this.selectedIndex - ((this.GRID_SIZE*this.GRID_SIZE))*this.getRelativeIndex(this.selectedLevel - 2,this.selectedIndex) + (cursorCol + cursorRow*this.GRID_SIZE)*(this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - (this.selectedLevel - 1));
        for (let i = this.selectedLevel ; i > 0 ; i--) {
            // console.log("selectedIndex: " + this.selectedIndex)
            // console.log("Index of destination " + destination);
            // console.log("Value of tictac " + this.getSlot(destination));
            // console.log("current elvelsize: " + this.selectedLevel );
            //Check if the spot being sent to is full or won.
            if (this.getSlot(destination) < (this.maxLevelSize - this.selectedLevel)*-1) {
                //console.log("spot full");
                this.selectedLevel--;
                destination = this.getFirstSpot(destination,this.selectedLevel);
                //destination = Math.floor(destination/this.calculateSize(this.selectedLevel) - this.getRelativeIndex(this.selectedLevel - 1,destination)*this.calculateSize(this.selectedLevel - 1))
                // destination = destination/(this.GRID_SIZE*this.GRID_SIZE);
                // destination = destination - ((this.GRID_SIZE*this.GRID_SIZE))*this.getRelativeIndex(this.selectedLevel - 2,destination)
            }
        }
        this.selectedIndex = destination;

        
        return TicTacState.ONGOING;
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
        let divisions = (size)/(this.GRID_SIZE*this.GRID_SIZE);
        //Then we find how many times divisions fits into range
        return Math.floor(range/divisions);
    }

    /**
     * @method checkForWin
     * @description This method checks whenever a tictac is placed to see whether or not a grid has been won.
     * 
     */
    private checkForWinOrFull(index: number): TicTacState  {
        //We start by checking for win. This entails first checking only the tictac played in
        //If that tictac has been won, then check higher levels of tictac, and so on.
        //In addition, a win is only needed to be checked in rows and columns from where an item was placed.

        //So we start with a loop from smallest to largest levelsize.
        for (let i = this.maxLevelSize; i >= 1 ; i--) {
            console.log("started loop of levelSize " + i);
            //Get the appropriate column and row that the placed spot is in.
            let slotRow = this.getRow(i - 1,index);
            let slotCol = this.getCol(i - 1,index);
            let slotSize = this.calculateSize(this.maxLevelSize - i);
            //Calculate the origin of the tictac (spot zero) for ease of checking
            let origin = index - slotRow*this.GRID_SIZE*slotSize - slotCol*slotSize;

            //Whether or not isWon
            let isWon = true;

            //Check the row that the slot was placed in.
            for (let j = 1 ; j < this.GRID_SIZE ; j ++) {
                //Rows are stored next to each other, so no need for math
                if (this.getOwner(origin + slotRow*this.GRID_SIZE*slotSize + j*slotSize) != this.getOwner(origin + slotRow*this.GRID_SIZE*slotSize + j*slotSize - slotSize)) {
                    console.log("Row win broken");
                    isWon = false;
                    break;
                }
            }
            if (isWon) {
                console.log("Row win detected");
                this.setOwner(origin,this.getSlot(index),i - 1);
                if (i == 1) {
                    return TicTacState.WIN;
                }
                continue;
            }
            isWon = true;
            //Then check the column that the slot was placed in
            for (let j = 1 ; j < this.GRID_SIZE; j++) {
                console.log("Column, ahead (" + (origin + slotCol*slotSize + j*slotSize*this.GRID_SIZE) + ", " + this.getOwner(origin + slotCol*slotSize + j*slotSize*this.GRID_SIZE) + ")");
                console.log("Column, behind(" + (origin + slotCol*slotSize + (j - 1)*slotSize*this.GRID_SIZE) + ", " + this.getOwner(origin + slotCol*slotSize + (j - 1)*slotSize*this.GRID_SIZE) + ")");

                if (this.getOwner(origin + slotCol*slotSize + j*slotSize*this.GRID_SIZE) != this.getOwner(origin + slotCol*slotSize + (j - 1)*slotSize*this.GRID_SIZE)) {
                    console.log("Col win broken");
                    isWon = false;
                    break;
                }
            }
            if (isWon) {
                console.log("Col win detected");
                this.setOwner(origin,this.getSlot(index),i - 1);
                if (i == 1) {
                    return TicTacState.WIN;
                }
                continue;
            }
            isWon = true;

            //Now, depending on whether or not the slot was placed in the middle, check diagonals
            if (slotCol == slotRow) {
                for (let j = 1 ; j < this.GRID_SIZE ; j++) {
                    if (this.getOwner(origin + j*this.GRID_SIZE*slotSize + j*slotSize) != this.getOwner(origin + j*this.GRID_SIZE*slotSize + j*slotSize - slotSize - slotSize*this.GRID_SIZE)) {
                        console.log("diag win broken");
                        isWon = false;
                        break;
                    }
                }
                if (isWon) {
                    console.log("diag win detected");
                    this.setOwner(origin,this.getSlot(index),i - 1);
                    if (i == 1) {
                        return TicTacState.WIN;
                    }
                    continue;
                }
                isWon = true;
            }

            if (slotRow == this.GRID_SIZE - slotCol - 1) {
                for (let j = 1 ; j < this.GRID_SIZE ; j++) {
                    if (this.getOwner(origin + slotSize*j*this.GRID_SIZE + ((this.GRID_SIZE - 1)*slotSize - j*slotSize)) != this.getOwner(origin + j*slotSize*this.GRID_SIZE + ((this.GRID_SIZE - 1)*slotSize - slotSize*j) + slotSize - slotSize*this.GRID_SIZE)) {
                        console.log("backdiag win broken");
                        isWon = false;
                        break;
                    }
                }
                if (isWon) {
                    console.log("backdiag win detected");
                    this.setOwner(origin,this.getSlot(index),i - 1);
                    if (i == 1) {
                        return TicTacState.WIN;
                    }
                    continue;
                }
            }

            //Finally, we need to check if the grid is full - do this by iterating through the entire grid.
            let isFull = true;
            for (let j = 0 ; j < this.GRID_SIZE*this.GRID_SIZE*slotSize ; j+= slotSize) {
                if (this.getOwner(origin + j) == 0) {
                    console.log("full broken");
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                console.log("full detected");
                this.setOwner(origin,0,i - 1);
                if (i == 1) {
                    return TicTacState.DRAW;
                }
            } else {
                break;
            }
        }
        //Assuming none of these checks passed, the tictac is ongoing.
        return TicTacState.ONGOING
    }

    /**
     * This method is intended to return the column of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index 
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    public getCol(levelSize: number,index: number) {
        return this.getRelativeIndex(levelSize,index) % this.GRID_SIZE;
    }
    
    /**
     * This method is intended to return the row of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index 
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    public getRow(levelSize: number,index: number) {
        //The index needs to be reduced to a number out of nine.
        return Math.floor(this.getRelativeIndex(levelSize,index) / this.GRID_SIZE);
    }

    /**
     * @method calculateSize
     * @description This method is calculates the size of a tictac of a certain levelSizes
     * @param levelsize - how deep the tictac is.
     * @returns a number indicating the number of slots in the tictac.
     */
    public calculateSize(levelSize: number):number {
        return Math.pow((this.GRID_SIZE*this.GRID_SIZE),levelSize);
    }

    /**
     * @method calculateSideSize
     * @description This method is iused to calcualte the size of a tictac along it's size.
     * @param levelSize
     * @returns a number indicating the size length of a tictac level
     */
    public calculateSideSize(levelSize: number):number {
        return Math.sqrt((this.GRID_SIZE*this.GRID_SIZE)^levelSize);
    }

    /**
     * @method getOwner
     * @description This method returns the owner near a specific index
     * @param index - the index of the tictac you want to get the owner of
     */
    public getOwner(index: number): number {
        if (this.getSlot(index) < 0) {
            return this.getSlot(index + 1);
        } 
        return this.getSlot(index);
    }


    /**
     * @method getFirstSpot
     * @description This method will return the index of the first spot of a tictac of the levesize specified
     */
    public getFirstSpot(index: number, levelSize: number) {
        return index - (index % this.calculateSize(levelSize));
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