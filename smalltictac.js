// this file is meant to hold the class for the small tic tac.

//creating the object type smallltictac.
function smalltictac() {
    //each small tictac must have a 2d array with three rows and three colums, full of integers set to 0,1, or 2.
    //creating a 1d array
    this.grid = new Array(GRID_LENGTH);
    //creating a 2d array by adding a 1d array of gridlength to every spot in the grid array.
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        this.grid[i] = new Array(GRID_LENGTH);
        //populating the array with zeroes
        for (let j = 0 ; j < GRID_LENGTH ; j++) {
            this.grid[i][j] = 0;
        }
    }

    //boolean that declares whether or not the grid is full.
    this.full = false;
    //boolean that declares if the tictac is won and int that holds the winner
    this.winner = 0;
    this.won = false;

    //2d array that saves the last move interms of columr and row so that the user can be sent to the next small tictac
    this.lastmove = null;


}

//This method is given a stop in the array and sets it to true. This will be used when a player makes a play.
smalltictac.prototype.select = function(row,column,user) {
    //doing a little check to make sure the value being set is correct.
    if (user > PLAYER_NUMBER) {
        throw 'The value cannot be set because this player does not exist.'   
    } else {
        this.grid[row][column] = user;
    }
}

//this method will return a spot in the grid and check to make sure the value is proper.
smalltictac.prototype.owner = function(row,column) {
    
    // We need to check whether or not the value in the grid is correct or not.
    // if not, the game is not running properly and there is no point in continuing it.
    if (this.grid[row][column] > PLAYER_NUMBER) {
        throw 'The value of this spot in the grid is not correct. This player should not exist.';
    } else {
        return this.grid[row][column];
    }

} 

//This method will be used to check if a spot in an array is already set to true.
smalltictac.prototype.isTaken = function(row,column) {
    switch (this.owner(row,column)) {
        case 0:
            //this spot is not taken, return false.
            return false;
        default:
            // this spot is taken by a user, return true.
            return true;
            

    }
}


//This method will be used to check if the smalltictac object has had all of their spots filled.
smalltictac.prototype.isFull = function() {
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        for (let j = 0 ; j < GRID_LENGTH ; j++) {
            switch (this.owner(i,j)) {
                case 0:
                    //sets the full status of the object to false and returns false for use in if statements.
                    this.full = false;
                    return false;
                default:
                    //don't do anything, because there may be other spots that are not full.

            }
        }
    }

    //sets the full status of the object to true and returns true for use in if statements.
    this.full = true;
    return true;
}

//this method checks if the game is won
smalltictac.prototype.isWon = function() {
    //setting the winner variable to be the output of whowon
    try {
        this.winner = this.whoWon();
    } catch (err) {
        this.winner = 0;
    }
    //checking the results of the who won function
    switch (this.winner) {
        //if no one won return false.
        case 0:
            return false;
        //if someone won return true
        default:
            return true;
    }
}

//This method can be used to check if one of the players has won the smalltictac.
smalltictac.prototype.whoWon = function () {

    /*
   0 0 0 0
   0 0 1 2
   0 3 4 5 
   0 6 7 8 
    */

    //checking all the rows of the grid for a match.
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        //making another loop to iterate through the colunms.
        for (let j = 0 ; j < GRID_LENGTH ; j++) {
            
            //checking if the spot is taken.
            if (this.isTaken(i,j)) {
                
                //checking if the loop is at the last spot in the array.
                if (j != GRID_LENGTH - 1) {
                    if (this.owner(i,j) == this.owner(i,j+1)) {
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = GRID_LENGTH;
                    }
                } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot in the row.
                    if (this.owner(i,j) == this.owner(i,0)) {
                        //hurray! the game is won.
                        return this.owner(i,j);
                    } else {
                        //oof, very last spot is not right. proceed to the next check.
                        //this is the end of the loop.
                    }   
                }
            } else {
                //if this spot is not taken, there is no point in continuing the loop.
                j = GRID_LENGTH;
            }
        }
    }

    //checking all the columns of the grid for a match.
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        //making another loop to iterate through the colunms.
        for (let j = 0 ; j < GRID_LENGTH ; j++) {
            
            //checking if the spot is taken.
            if (this.isTaken(j,i)) {
                
                //checking if the loop is at the last spot in the array.
                if (j != GRID_LENGTH - 1) {
                    if (this.owner(j,i) == this.owner(j,i+1)) {
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = GRID_LENGTH;
                    }
                } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot in the row.
                    if (this.owner(j,i) == this.owner(0,i)) {
                        //hurray! the game is won.
                        return this.owner(j,i);
                    } else {
                        //oof, very last spot is not right. proceed to the next check.
                        //this is the end of the loop.
                    }   
                }
            } else {
                //if this spot is not taken, there is no point in continuing the loop.
                j = GRID_LENGTH;
            }
        }
    }

    //checking diagonally in the grid from top left to bottom right(this'll be a doozy).
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        //checking if the spot is taken.
        if (this.isTaken(i,i)) {
            //checking if it is at the last spot in the array.
            if (i != GRID_LENGTH-1) {
                if (this.owner(i,i) == this.owner(i+1,i+1)) {
                    //these spots are owned by the same person, keep going!
                } else {
                    //these spots are not owned by the same person, give up the check.
                    i = GRID_LENGTH;
                }
            } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot.
                    if (this.owner(i,i) == this.owner(0,0)) {
                        //hurray! the game is won.
                        return this.owner(i,i);
                    } else {
                        //oof, very last spot is not right. proceed to the next check.
                        //this is the end of the loop.
                    }   
            }

        } else {
            // if it is not taken, no point in continuing the loop.
            i = GRID_LENGTH;
        }
    }

    //checking diagonally from bottom left to top right. THE WORST DOOZY OF ALL.
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        //checking if the spot is taken.
        if (this.isTaken(GRID_LENGTH-i,i)) {
            //checking if it is at the last spot in the array.
            if (i != GRID_LENGTH-1) {
                if (this.owner(GRID_LENGTH-i,i) == this.owner(GRID_LENGTH-i-1,i+1)) {
                    //these spots are owned by the same person, keep going!
                } else {
                    //these spots are not owned by the same person, give up the check.
                    i = GRID_LENGTH;
                }
            } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot.
                    if (this.owner(GRID_LENGTH-i,i) == this.owner(GRID_LENGTH,0)) {
                        //hurray! the game is won.
                        return this.owner(GRID_LENGTH-i,i);
                    } else {
                        //oof, very last spot is not right. proceed to the next check.
                        //this is the end of the loop.
                    }   
            }

        } else {
            // if it is not taken, no point in continuing the loop.
            i = GRID_LENGTH;
        }
    }





    //None of these checks returned. that means that no one has won.
    return 0;
}


