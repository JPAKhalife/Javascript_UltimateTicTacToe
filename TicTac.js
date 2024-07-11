

//This is the class that will be responsible for the holding of information
//Each tictac owns a grid of 3x3 (or more in the future who knows)
const TicTacState = {
    ONGOING:0,
    DRAW:1,
    WIN:2,
}
const GRID_SIZE = 3;
const PLAYER_NUMBER = 2;


class TicTac {
    //We will start by initializing the tictac
    //Create the grid - grids can contain a  number or a tictac literally anything
    constructor(parent,n = 0) {
        //Initialize the grid with the init val
        this.grid = [];
        if (n == 0) {
            for (let i = 0 ; i < GRID_SIZE; i++) {
                this.grid[i] = [];
                for (let j = 0 ; j < GRID_SIZE; j++) {
                    this.grid[i][j] = 0;
                }
            }
        } else {
            for (let i = 0 ; i < GRID_SIZE; i++) {
                this.grid[i] = [];
                for (let j = 0 ; j < GRID_SIZE; j++) {
                    this.grid[i][j] = new TicTac(this, n - 1);
                }
            }
        }

        //We set the state variable
        this.state = TicTacState.ONGOING;
        //Create the winner variable - does not have to be initialized
        this.winner = 0;
        //Each tictac should know the identity of it's parent. This way when a move is made,
        //The tictac aboce it can be updated.
        this.parent = parent;
    }

    //Each tictac should be able to return the spot in a grid
    getSlot(row,col) {
        return this.grid[row][col];
    }

    //This method is for tictacs on the base of the recursive stack.
    setSlot(row,col,item) {
        this.grid[row][col] = item;
    }

    //This method returns the owner of a slot
    getOwner(row,col) {
        let owner = this.getSlot(row,col);
        if (owner instanceof TicTac) {
            //Call recursively until a number is found
            return owner.getWinner();
        }
        return owner;
    }

    getWinner() {
        return this.winner;
    }

    setWinner(winner) {
        this.winner = winner;
    }
}