//This file is responsible for keeping track of the game state
// It should be able to do this regardless of whether or not this is an online or an offline game
// This class should be responsible for making requests to the database in order to send and get updates.

//This is a constant that holds the types of games that can exist
const GameTypes = {
    LOCAL: {},
    ONLINE: {}
}

//This class activates as soon as a game is started
class GameManager {
    constructor(gameType = GameTypes.LOCAL, gridSize = DEFAULT_GRID_SIZE, gridLevels = 2) {
        //The game manager should have a variable that keeps track of whether or not it is playing online or offline
        this.GAMETYPE = gameType;
        this.GRID_SIZE = gridSize;
        //The game manager will own a single tictac - which will hold all of the other tictacs and the lowest level slots
        //This is initialized with recursion
        this.board = new TicTac(gridLevels,gridSize); //TODO: Create a constant for the number of tictacs inside tictacs u
        //This is used to keep track of the current player's turn
        this.turn = 0;
        this.isWon = false;
    }

    updateSlot(tictac, row,col) {
        //TODO: Add A check for whether or not the game is online and do an update.
        //Local side update
        if (tictac.getSlot(row,col) == 0) {
            //You can update a zero filled square
            tictac.setSlot(row,col,this.turn);
            //Then a win check on that tictac is neccessary.
            if (this.checkWinOrFull(tictac,row,col)) {
                //*This condition may be important for later, we'll see
                if (this.tictac == tictac) {
                    //Win!
                    this.isWon = true;
                }
            }
            this.turn++;
        } else {
            //You cannot update a slot if it is anything other than zero
        }
    }

    receiveUpdates() {
        //This method only needs to be called when playing online mode. It is intended for interacting with the sql database.
    }

    //This method is meant to evaluate a tictac for a win.
    checkWinOrFull(tictac, row, col) {
        //To win, there needs to be GRDISIZE of the same value in a row.
        //This method will be called whenever a tictac is updated, and therefore only needs
        //to check the row, col, and potentially diagonal that the move was played in.
        for (i = 1 ; i < this.GRID_SIZE; i ++) {
            if (tictac.getOwner(i,col) != tictac.getOwner(i-1,col)) {
                break;
            }
            if (i == this.GRID_SIZE - 1) {
                tictac.setWinner(tictac.getOwner(i,col));
                this.checkParentWinOrFull(tictac,row,col);
                return true;
            }
        }

        for (i = 1 ; i < this.GRID_SIZE ; i++) {
            if (tictac.getOwner(row,i) != tictac.getOwner(row,i-1)) {
                break;
            }
            if (i == this.GRID_SIZE - 1) {
                tictac.setWinner(tictac.getOwner(row,i));
                this.checkParentWinOrFull(tictac,row,col);
                return true;
            }
        }

        //How to check if diagonal
        if (row == col) {
            //Now we need to check for a diagonal
            for (i = 1 ; i < this.GRID_SIZE ; i++) {
                if (tictac.getOwner(i,i) != tictac.getOwner(i-1,i-1)) {
                    break;
                }
                if (i == this.GRID_SIZE - 1) {
                    tictac.setWinner(tictac.getOwner(i,i));
                    this.checkParentWinOrFull(tictac,row,col);
                    return true;
                }
            }
        } else if (row == (this.GRID_SIZE - 1 - col)) {
            //Now we need to check for a diagonal in the other direction.
            for (i = 1 ; i < this.GRID_SIZE ; i++) {
                if (tictac.getOwner(i,i) != tictac.getOwner(i-1,this.GRID_SIZE - 1 - i - 1)) {
                    break;
                }
                if (i == this.GRID_SIZE - 1) {
                    tictac.setWinner(tictac.getOwner(i,this.GRID_SIZE - 1 - i));
                    this.checkParentWinOrFull(tictac,row,col);
                    return true;
                }
            }
        }

        //Iterate through every spot in the tictac and check if it is full.
        for (let i = 0 ; i < this.GRID_SIZE ; i++) {
            for (let j = 0 ; j < this.GRID_SIZE ; j++) {
                slot = tictac.getSlot(i,j);
                //If the spot is a tictac and is not full, then leave the loop
                if (slot instanceof TicTac) {
                    if (!slot.isFull) {
                        return false;
                    }
                // If any slot is zero, that means that there is still space in the tictac.
                } else if (slot == 0) {
                    return false;
                }
            }
        }

        //If the loop has made it this far without returning, then the tictac must be full.
        tictac.setFull();
        return true;
    }

    checkParentWinOrFull(tictac,row,col) {
        //I could put this in checkWinOrFull, but the code would be repetitive as it is called everytime we return with a win or full.
        if (tictac.parent) {
            this.checkWinOrFull(tictac.parent,row,col)
        }
    }

    getBoard() {
        return this.board;
    }
}