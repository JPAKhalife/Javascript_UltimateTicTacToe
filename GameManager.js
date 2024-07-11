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
    constructor(gametype = GameTypes.LOCAL) {
        //The game manager should have a variable that keeps track of whether or not it is playing online or offline
        this.GAMETYPE = gametype;
        //The game manager will own a single tictac - which will hold all of the other tictacs and the lowest level slots
        //This is initialized with recursion
        this.board = new TicTac(1); //TODO: Create a constant for the number of tictacs inside tictacs u
        //This is used to keep track of the current player's turn
        this.turn = 0;
    }

    //I need to come up with a way that I can update a slot inside an infinitely recursive tictactoe board.
    //This method takes O(n) time.
    updateSlotRecursive(addr) {
        //The current idea is to input an array of coordinate tuples. When inputed into this function, a series of recursive calls will occur
        this.board.place(addr,this.turn);
        this.turn++;
    }

    updateSlot(tictac, row,col) {
        //Then the update will happen on the local side.
        if (tictac.getSlot(row,col) instanceof TicTac) {
            return tictac.getSlot(row,col);
        } else {
            tictac.setSlot(row,col,this.turn);
            return true;
        }
    }

    receiveUpdates() {
        //This method only needs to be called when playing online mode. It is intended for interacting with the sql database.
    }

    //This method is meant to evaluate a tictac for a win.
    checkWin(tictac, row, col) {

        //To win, there needs to be GRDISIZE of the same value in a row.
        //This method will be called whenever a tictac is updated, and therefore only needs
        //to check the row, col, and potentially diagonal that the move was played in.

        for (i = 1 ; i < GRID_SIZE; i ++) {
            if (tictac.getOwner(i,col) != tictac.getOwner(i-1,col)) {
                break;
            }
            if (i == GRID_SIZE - 1) {
                tictac.setWinner(tictac.getOwner(i,col));
                return true;
            }
        }

        for (i = 1 ; i < GRID_SIZE ; i++) {
            if (tictac.getOwner(row,i) != tictac.getOwner(row,i-1)) {
                break;
            }
            if (i == GRID_SIZE - 1) {
                tictac.setWinner(tictac.getOwner(row,i));
                return true;
            }
        }

        //How to check if diagonal
        if (row == col) {
            //Now we need to check for a diagonal
            for (i = 1 ; i < GRID_SIZE ; i++) {
                if (tictac.getOwner(i,i) != tictac.getOwner(i-1,i-1)) {
                    break;
                }
                if (i == GRID_SIZE - 1) {
                    tictac.setWinner(tictac.getOwner(i,i));
                    return true;
                }
            }
        } else if (row == (GRID_SIZE - 1 - col)) {
            //Now we need to check for a diagonal in the other direction.
            for (i = 1 ; i < GRID_SIZE ; i++) {
                if (tictac.getOwner(i,i) != tictac.getOwner(i-1,GRID_SIZE - 1 - i - 1)) {
                    break;
                }
                if (i == GRID_SIZE - 1) {
                    tictac.setWinner(tictac.getOwner(i,GRID_SIZE - 1 - i));
                    return true;
                }
            }
        }
        return false;
    }

    getBoard() {
        return this.board;
    }
}