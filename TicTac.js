

//This is the class that will be responsible for the holding of information
//Each tictac owns a grid of 3x3 (or more in the future who knows)
const TicTacState = {
    ONGOING:0,
    DRAW:1,
    WIN:2,
}
const DEFAULT_GRID_SIZE = 3;
const DEFAULT_PLAYER_NUMBER = 2;


class TicTac {
    //We will start by initializing the tictac
    //Create the grid - grids can contain a  number or a tictac literally anything
    constructor(maxLevelSize = 0,gridSize = DEFAULT_GRID_SIZE,parent = null) {
        //Non recursive solution
        //All that is required for this tictac is that it is an array of signed integers
        //The length of this array will be equal to (GRID_SIZE^2)^levelSize

        //Within this array 0 means that nobody owns that particular square
        //Anything greater than zero indicates that the nth player owns that square.
        //Numbers less than zero will indicate a level size - and right after that number will be result of that tictac
        //Grid size constant
        this.GRID_SIZE = gridSize;
        this.maxLevelSize = maxLevelSize;
        //Initialize the board with a grid of zeroes
        this.grid = Array((this.GRID_SIZE*this.GRID_SIZE)**this.maxLevelSize).fill(1);
        //We set the state variable
        this.state = TicTacState.ONGOING;
    }

    //Each tictac should be able to return the spot in a grid
    getSlot(index) {
        return this.grid[index];
    }

    //This method is for tictacs on the base of the recursive stack.
    setSlot(index,item) {
        this.grid[index] = item;
    }

    getArraySize() {
        return this.grid.length;
    }

    getWinner() {
        //Check if the entire grid has been won
        if (this.grid[0] == this.maxLevelSize) {
            return this.grid[1];
        }
        return 0;
    } 

    /**
     * This method calculates the next spot for the player's cursor to move.
     * This should also be synced with the server to avoid client side cheating.
     */
    sendCursor() {

    }
}