

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
    constructor(n = 0) {
        //There should be no parameters needed when making a tictac
        //Initialize the grid with the init val
        if (n == 0) {
            for (i = 0 ; i < GRID_SIZE; i++) {
                for (j = 0 ; j < GRID_SIZE; j++) {
                    this.grid[i][j] = 0;
                }
            }
        } else {
            for (i = 0 ; i < GRID_SIZE; i++) {
                for (j = 0 ; j < GRID_SIZE; j++) {
                    this.grid[i][j] = new TicTac(n - 1);
                }
            }
        }

        //We set the state variable
        this.state = TicTacState.ONGOING;
        //Create the winner variable - does not have to be initialized
        this.winner = 0;
    }

    //Each tictac should be able to return the spot in a grid
    getSlot(row,col) {
        return this.grid[row][col];
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

    //Each tictac needs to be able to evaluate itself for a win
    checkWin(row, col) {

        //To win, there needs to be GRDISIZE of the same value in a row.
        //This method will be called whenever a tictac is updated, and therefore only needs
        //to check the row, col, and potentially diagonal that the move was played in.

        for (i = 1 ; i < GRID_SIZE; i ++) {
            if (this.getOwner(i,col) != this.getOwner(i-1,col)) {
                break;
            }
            if (i == GRID_SIZE - 1) {
                this.winner = this.getOwner(i,col);
                return true;
            }
        }

        for (i = 1 ; i < GRID_SIZE ; i++) {
            if (this.getOwner(row,i) != this.getOwner(row,i-1)) {
                break;
            }
            if (i == GRID_SIZE - 1) {
                this.winner = this.getOwner(row,i);
                return true;
            }
        }

        //How to check if diagonal
        if (row == col) {
            //Now we need to check for a diagonal
            for (i = 1 ; i < GRID_SIZE ; i++) {
                if (this.getOwner(i,i) != this.getOwner(i-1,i-1)) {
                    break;
                }
                if (i == GRID_SIZE - 1) {
                    this.winner = this.getOwner(i,i);
                    return true;
                }
            }
        } else if (row == (GRID_SIZE - 1 - col)) {
            //Now we need to check for a diagonal in the other direction.
            for (i = 1 ; i < GRID_SIZE ; i++) {
                if (this.getOwner(i,i) != this.getOwner(i-1,GRID_SIZE - 1 - i - 1)) {
                    break;
                }
                if (i == GRID_SIZE - 1) {
                    this.winner = this.getOwner(i,GRID_SIZE - 1 - i);
                    return true;
                }
            }
        }
        return false;
    }

    getWinner() {
        return this.winner;
    }

    //This method is for tictacs on the base of the recursive stack.
    setSlot(row,col,item) {
        this.grid[row][col] = item;
    }

}