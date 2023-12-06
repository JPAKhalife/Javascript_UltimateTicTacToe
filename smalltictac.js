


//creating the object type smallltictac.
function smalltictac() {

    //represents the current turn
    this.current_player = 0;

    //each small tictac must have a 2d array with three rows and three colums, full of integers set to 0,1, or 2.
    //creating a 1d array
    this.grid = new Array(SMALL_GRID_LENGTH);
    //creating a 2d array by adding a 1d array of gridlength to every spot in the grid array.
    for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
        this.grid[i] = new Array(SMALL_GRID_LENGTH);
        //populating the array with zeroes
        for (let j = 0 ; j < SMALL_GRID_LENGTH ; j++) {
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


    //determines if the watchamacallit is selected
    this.isselected = false;

    //controls the hover animation
    this.hovertime = 0;
    this.hoveron = false;



    //checks whether the position is selected or not
    this.select = false;



    //coordinates of the cursor on the tictac
    this.cursor_x = 0;
    this.cursor_y = 0;

    //this is for input delay
    this.inputdelay = 0;


}

//this method is intended to draw the small tic tac
smalltictac.prototype.draw = function(x,y,gridsize,turn) {

    //variable that will hold the width of the grid
    let boardwidth = gridsize * (SMALL_BOARD_PERCENT/100);
 
    let linewidth = boardwidth*SMALL_LINEWIDTH_TO_BOARDWIDTH_RATIO;

    let gridwidth = ((boardwidth - linewidth))/SMALL_GRID_LENGTH;

    let linenum = (SMALL_GRID_LENGTH-1);

    fill(255);
    strokeWeight(linewidth);
    stroke(255);
    //creating a for loop to draw the proper lines 
    for (let i = 0 ; i < linenum ; i++) {
        line(x + gridwidth*(i+1),y,x + gridwidth*(i+1),y + boardwidth,);
        line(x,y+gridwidth*(i+1),x + boardwidth,y + gridwidth * (i+1));
    }

    fill(0);

    //this loop is intended to draw the x inside of every single spot of the grid
    for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
        for (let j = 0 ; j < SMALL_GRID_LENGTH ; j ++) {
            if (this.grid[i][j] == 1) {
                stroke(255);
                line(x + gridwidth*i + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,y + gridwidth*j + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,x + gridwidth*i + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,y + gridwidth*j + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2);
                line(x + gridwidth*i + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,y + gridwidth*j + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,x + gridwidth*i + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,y + gridwidth*j + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2);

            } else  if (this.grid[i][j] == 2) {
                stroke(255);
                ellipseMode(CENTER)
                ellipse(x + gridwidth/2 + gridwidth*i,y + gridwidth/2 + gridwidth*j,gridwidth*(SMALLEST_BOARD_PERCENT/100),gridwidth*(SMALLEST_BOARD_PERCENT/100));
            }
        }



    }


        //creating a hover animation
        if (this.select) {

        } else {
            this.hover(x,y,gridwidth);
        }
        


}


//this method is intended to input an up action
smalltictac.prototype.up = function() {
    if (this.cursor_y == 0) {
        this.cursor_y = SMALL_GRID_LENGTH - 1;
    } else {
        this.cursor_y -= 1;
    }
}

//this method is intenteded to input a right action
smalltictac.prototype.right = function() {
    if (this.cursor_x == SMALL_GRID_LENGTH - 1) {
        this.cursor_x = 0;
    } else {
        this.cursor_x += 1;
    }

}

//this method is intended to input a down action
smalltictac.prototype.down = function() {
    if (this.cursor_y == SMALL_GRID_LENGTH - 1) {
        this.cursor_y = 0;
    } else {
        this.cursor_y += 1;
    }
}

//this method is intended to input a left action
smalltictac.prototype.left = function() {
    if (this.cursor_x == 0) {
        this.cursor_x = SMALL_GRID_LENGTH - 1;
    } else {
        this.cursor_x -= 1;
    }
}

//this method is intended to input a select action
smalltictac.prototype.space = function() {
    if (this.grid[this.cursor_x][this.cursor_y] == 0) {
        this.select = true;

        //setting the proper player symbol
        if (this.current_player % 2 == 0 && this.current_player != 0) {
            this.grid[this.cursor_x][this.cursor_y] = 1;
        } else if (this.current_player % 2 != 0 && this.current_player != 0) {
            this.grid[this.cursor_x][this.cursor_y] = 2;
        }

        //checking if the game is won
        if (this.isWon()) {
            this.won = true;
            this.winner = this.whoWon();
        }
        

        this.inputdelay = INPUT_DELAY;
    }
}

//This method is given a stop in the array and sets it to true. This will be used when a player makes a play.
smalltictac.prototype.select = function(row,column,user) {
    //doing a little check to make sure the value being set is correct.
    if (user > PLAYER_NUMBER) {
        throw 'The value cannot be set because this player does not exist.';
    } else {
        this.lastmove = [row,column]
        this.grid[row][column] = user;
    }
}

//this method is meant to select the small tictac
smalltictac.prototype.setselected = function(set) {
    this.isselected = set;
    this.inputdelay = INPUT_DELAY;
    this.cursor_x = 0;
    this.cursor_y = 0;
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

//this is the function that creates a hover animation over the whole tictac
smalltictac.prototype.hover = function(x,y,gridwidth) {

    if (this.isselected) {


        if (this.hovertime <= 0) {
            this.hoveron = true;
        } else if (this.hovertime >= HOVER_TIME_SMALL) {
            this.hoveron = false;
        }

        if (this.hoveron == true) {
            fill(255);
            rectMode(CORNER);
            rect(x + gridwidth*(this.cursor_x) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,y + gridwidth*(this.cursor_y) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,gridwidth*(SMALLEST_BOARD_PERCENT/100),gridwidth*(SMALLEST_BOARD_PERCENT/100));
            this.hovertime++;
        } else {
            this.hovertime--;
        } 
        

    }
    
}


//This method will be used to check if the smalltictac object has had all of their spots filled.
smalltictac.prototype.isFull = function() {
    for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
        for (let j = 0 ; j < SMALL_GRID_LENGTH ; j++) {
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
        //if no one won yet return false.
        case 0:
            return false;
        //if deadlock return false
        case -1:
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
    for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
        //making another loop to iterate through the colunms.
        for (let j = 0 ; j < SMALL_GRID_LENGTH; j++) {
            
            //checking if the spot is taken.
            if (this.isTaken(j,i)) {
                
                //checking if the loop is at the last spot in the array.
                if (j != SMALL_GRID_LENGTH - 1) {
                    if (this.owner(j,i) == this.owner(j+1,i)) {
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = SMALL_GRID_LENGTH;
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
                j = SMALL_GRID_LENGTH;
            }
        }
    }

    //checking all the columns of the grid for a match.
    for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
        //making another loop to iterate through the colunms.
        for (let j = 0 ; j < SMALL_GRID_LENGTH ; j++) {
            
            //checking if the spot is taken.
            if (this.isTaken(i,j)) {
                //checking if the loop is at the last spot in the array.
                if (j != SMALL_GRID_LENGTH - 1) {
                    
                    if (this.owner(i,j) == this.owner(i,j+1)) {
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = SMALL_GRID_LENGTH;
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
                j = SMALL_GRID_LENGTH;
            }
        }
    }

    //checking diagonally in the grid from top left to bottom right(this'll be a doozy).
    for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
        //checking if the spot is taken.
        if (this.isTaken(i,i)) {
            //checking if it is at the last spot in the array.
            if (i != SMALL_GRID_LENGTH-1) {
                if (this.owner(i,i) == this.owner(i+1,i+1)) {
                    //these spots are owned by the same person, keep going!
                } else {
                    //these spots are not owned by the same person, give up the check.
                    i = SMALL_GRID_LENGTH;
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
            i = SMALL_GRID_LENGTH;
        }
    }

    //checking diagonally from bottom left to top right. THE WORST DOOZY OF ALL.
    for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
        //checking if the spot is taken.
        if (this.isTaken(i,SMALL_GRID_LENGTH-i-1)) {
            //checking if it is at the last spot in the array.
            if (i < SMALL_GRID_LENGTH - 1) {
                if (this.owner(i,SMALL_GRID_LENGTH-1-i) == this.owner(i+1,SMALL_GRID_LENGTH-i-2)) {
                    //these spots are owned by the same person, keep going!
                } else {
                    //these spots are not owned by the same person, give up the check.
                    i = SMALL_GRID_LENGTH;
                }
            } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot.
                    if (this.owner(i,SMALL_GRID_LENGTH-i-1) == this.owner(0,SMALL_GRID_LENGTH-1)) {
                        //hurray! the game is won.
                        return this.owner(i,SMALL_GRID_LENGTH-i-1);
                    } else {
                        //oof, very last spot is not right. proceed to the next check.
                        //this is the end of the loop.
                    }   
            }

        } else {
            // if it is not taken, no point in continuing the loop.
            i = SMALL_GRID_LENGTH;
        }
    }





    //None of these checks returned. that means that either no one has won yet or there is a deadlock.

    //This checks to see if there are any empty spaces in the tictac
    let empty = false;

    for (i = 0 ; i < SMALL_GRID_LENGTH; i ++) {
        for (j = 0 ; j < SMALL_GRID_LENGTH; j++) {
            if (this.grid[i][j] == 0) {
                empty = true;
            }
        }

    }

    if (empty) {
        return 0;
    } else {
        return -1;
    }
    
}


