// This file is meant to be the home of the class for the larger tic tac that holds all the other small tic tacs.


//creating the class for the big tic tac.
function bigtictac() {
    //each big tic tac will have a 2d array full of small tic tacs.
    //creating a 1d array.
    this.grid = new Array(GRID_LENGTH)
    //filling the array with 1d arrays.
    for (let i = 0 ; i < GRID_LENGTH ; i ++) {
        this.grid[i] = new Array(GRID_LENGTH)
        //setting all of the spots in the array to a small tic tac.
        for (let j = 0 ; j < GRID_LENGTH ; j ++) {
            this.grid[i][j] = new smalltictac();
        }
    }

    // a big tic tac should have a variable that declares who the winner is.
    this.winner = 0;

    //boolean that declares whether or not the grid is full.
    this.full = false;

}

//This method is meant to return a true or false value as to whether the game had been won.
bigtictac.prototype.isWon = function() {
    //setting the result of whoWon to this.winner.
    this.winner = this.whoWon();
    //checking the result of this.winner.
    switch(this.winner) {
        case 0:
            return false;
        default:
            return true;
    }   
}

//This method returns a number that indicates who won.
bigtictac.prototype.whoWon = function () {

    //checking all the rows of the grid for a match.
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        //making another loop to iterate through the colunms.
        for (let j = 0 ; j < GRID_LENGTH ; j++) {
            
            //checking if the grid is won.
            if (this.grid[i][j].isWon()) {
                
                //checking if the loop is at the last spot in the array.
                if (j != GRID_LENGTH - 1) {
                    if (this.grid[i][j].winner == this.grid[i][j+1].winner) {
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = GRID_LENGTH;
                    }
                } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot in the row.
                    if (this.grid[i][j].winner == this.grid[i][0].winner) {
                        //hurray! the game is won.
                        return this.grid[i][j].winner;
                    } else {
                        //oof, very last spot is not right. proceed to the next check.
                        //this is the end of the loop.
                    }   
                }
            } else {
                //if this grid is not won, then it is either full or in progress, so it would be best to move onto the next row.
                j = GRID_LENGTH;
            }
        }
    }

    //checking all the columns of the grid for a match.
    for (let i = 0 ; i < GRID_LENGTH ; i++) {
        //making another loop to iterate through the colunms.
        for (let j = 0 ; j < GRID_LENGTH ; j++) {
            
            //checking if the spot is taken.
            if (this.grid[j][i].winner) {
                
                //checking if the loop is at the last spot in the array.
                if (j != GRID_LENGTH - 1) {
                    if (this.grid[j][i].winner == this.grid[j][i+1].winner) {
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = GRID_LENGTH;
                    }
                } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot in the row.
                    if (this.grid[j][i].winner == this.grid[0][i].winner) {
                        //hurray! the game is won.
                        return this.grid[j][i].winner;
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
        if (this.grid[i][i].isWon()) {
            //checking if it is at the last spot in the array.
            if (i != GRID_LENGTH-1) {
                if (this.grid[i][i].winner == this.grid[i+1][i+1].winner) {
                    //these spots are owned by the same person, keep going!
                } else {
                    //these spots are not owned by the same person, give up the check.
                    i = GRID_LENGTH;
                }
            } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot.
                    if (this.grid[i][i].winner == this.grid[0][0].winner) {
                        //hurray! the game is won.
                        return this.grid[i][i].winner;
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
        if (this.grid[GRID_LENGTH-i][i].isWon()) {
            //checking if it is at the last spot in the array.
            if (i != GRID_LENGTH-1) {
                if (this.grid[GRID_LENGTH-i][i].winner == this.grid[GRID_LENGTH-i-1][i+1].winner) {
                    //these spots are owned by the same person, keep going!
                } else {
                    //these spots are not owned by the same person, give up the check.
                    i = GRID_LENGTH;
                }
            } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot.
                    if (this.grid[GRID_LENGTH-i][i].winner == this.grid[GRID_LENGTH][0].winner) {
                        //hurray! the game is won.
                        return this.grid[GRID_LENGTH-i][i].winner;
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


//This method is meant to select a spot inside a small tic tac.
bigtictac.prototype.select = function(bigrow, bigcolumn, smallrow, smallcolumn,user) {
    //no need to check the user input, because the select function does this.
    try {
        this.grid[bigrow,bigcolumn].select(smallrow, smallcolumn,user);
    } catch (err) {

    }
    
}

    //This method will be used to check if the bigtictactow grid is full.
bigtictac.prototype.isFull = function() {
    if (this.isWon() == false) {
        //starting a  nested for loop to check every single spot in the bigtictac.
        for (let i = 0 ; i < GRID_LENGTH ; i++) {
            for (let j = 0 ; j < GRID_LENGTH ; j ++) {   
                if (this.grid[i][j].isWon() || this.grid[i][j].isFull()) {

                } else {
                    return false;
                }
            }

        }
            
        //since all of the spots are full or won, then we can return true
        return true;


    } else {
        return false;
    }


}

//this method is meant to draw the bigtictac
bigtictac.prototype.draw = function(x, y) {

    //variable that will hold the width of the grid
    let boardwidth;

    //getting the smallest dimension of the canvas
    if (height <= width) {
        boardwidth = height;
    } else {
        boardwidth = width;
    }

    let linewidth = boardwidth*0.1

    let gridwidth = ((boardwidth - linewidth))/GRID_LENGTH;

    let linenum = (GRID_LENGTH-1)*2;

    //creating a for loop to draw the proper lines versically
    for (let i = 0 ; i < linenum/2 ; i++) {
        line(x + gridwidth*i+1,)
    }






    


}
