
//creating the class for the big tic tac.
function bigtictac() {

    //this determines the current strokeweight of the oiutline
    this.current_strokeweight = 0;

    this.directional_value = 1;

    //this determines whether or not the bigtictac is selected
    this.is_selected = true;

    //represents the current player
    this.current_player = 1;

    //this represents the timer for the hoverin animation
    this.hovertime = 0;

    //variable that determines whether the white rectangle to represent the square the player is horvering over will appear or not
    this.hoveron = true;

    //variable that is responsible for holding input delay
    this.inputdelay = 0;

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

    //this boolean determines whether or not the tic tac has been selected
    this.tictacselect = false;

    //boolean that says whether or not the game is won
    this.won = false;

    this.cursor_x = 0;
    this.cursor_y = 0;



}

//This method is meant to return a true or false value as to whether the game had been won.
bigtictac.prototype.isWon = function() {
    //setting the result of whoWon to this.winner.
    this.winner = this.whoWon();

    print('winner is : ', this.winner);
    //checking the result of this.winner.
    switch(this.winner) {
        case 0:
            return false;
        default:
            this.won = true;
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
            if (this.grid[j][i].won) {
                
                //checking if the loop is at the last spot in the array.
                if (j < GRID_LENGTH - 1) {

                    if (this.grid[j][i].winner == this.grid[j+1][i].winner && this.grid[j][i].winner != -1) {

                        
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = GRID_LENGTH;
                    }
                } else {

                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot in the row.
                    if (this.grid[j][i].winner == this.grid[0][i].winner && this.grid[j][i].winner != -1) {
                        //hurray! the game is won.
                        return this.grid[j][i].winner;
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
            if (this.grid[i][j].won) {
                
                //checking if the loop is at the last spot in the array.
                if (j < GRID_LENGTH - 1) {
                    if (this.grid[i][j].winner == this.grid[i][j+1].winner && this.grid[i][j].winner != -1) {
                        // These spots are owned by the same person, continue going through the loop.
                    } else {
                        // These spots are not owned by the same person, no point in continuoing the loop.
                        j = GRID_LENGTH;
                    }
                } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot in the row.
                    if (this.grid[i][j].winner == this.grid[i][0].winner && this.grid[i][j].winner != -1) {
                        //hurray! the game is won.
                        return this.grid[i][j].winner;
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
        if (this.grid[GRID_LENGTH-1-i][i].won) {
            //checking if it is at the last spot in the array.
            if (i < GRID_LENGTH-1) {
                if (this.grid[i][GRID_LENGTH-i-1].winner == this.grid[i+1][GRID_LENGTH-i-2].winner) {
                    //these spots are owned by the same person, keep going!
                } else {
                    //these spots are not owned by the same person, give up the check.
                    i = GRID_LENGTH;
                }
            } else {
                    //we got this far, so if the last spot in the array is taken by the right player, then the game is won.
                    //there is no next spot in the row, so we check the first spot.
                    if (this.grid[i][GRID_LENGTH-i-1].winner == this.grid[0][GRID_LENGTH-1].winner) {
                        //hurray! the game is won.
                        return this.grid[i][GRID_LENGTH-i-1].winner;
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
            //This checks to see if there are any empty spaces in the tictac
    let empty = false;

    for (i = 0 ; i < GRID_LENGTH; i ++) {
        for (j = 0 ; j < GRID_LENGTH; j++) {
            if (this.grid[i][j].winner == 0 && this.grid[i][j].won == false) {
                empty = true;
                j = GRID_LENGTH;
                i = GRID_LENGTH;
            }
        }

    }

    if (empty) {
        return 0;
    } else {
        return -1;
    }
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

    boardwidth = getCanvasSize() * (BOARD_PERCENT/100);


    let linewidth = boardwidth*LINEWIDTH_TO_BOARDWIDTH_RATIO;

    let gridwidth = ((boardwidth - linewidth))/GRID_LENGTH;

    let linenum = (GRID_LENGTH-1);

    //AHH I can't remember what this function does
    //this.hoveredover();

    fill(255);
    strokeWeight(linewidth);
    stroke(255);
    //creating a for loop to draw the proper lines 
    for (let i = 0 ; i < linenum ; i++) {

        line(x + gridwidth*(i+1),y,x + gridwidth*(i+1),y + boardwidth,);
        line(x,y+gridwidth*(i+1),x + boardwidth,y + gridwidth * (i+1));

    }

    //drawing the small tic tac inside of each grid of the big tic tac
    for (i = 0 ; i < GRID_LENGTH ; i++) {
        for (j = 0; j < GRID_LENGTH ; j++) {
            if (this.grid[i][j].won) {
                //draw x
                if (this.grid[i][j].winner % 2 != 0) {
                    fill(0);
                    strokeWeight(boardwidth*LINEWIDTH_TO_BOARDWIDTH_RATIO)
                    stroke(255);
                    line(x + gridwidth*i + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,y + gridwidth*j + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,x + gridwidth*i + gridwidth*(SMALL_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,y + gridwidth*j + gridwidth*(SMALL_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2);
                    line(x + gridwidth*i + gridwidth*(SMALL_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,y + gridwidth*j + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,x + gridwidth*i + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,y + gridwidth*j + gridwidth*(SMALL_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2);

                //draw o
                } else {
                    fill(0);
                    strokeWeight(boardwidth*LINEWIDTH_TO_BOARDWIDTH_RATIO)
                    stroke(255);
                    ellipseMode(CENTER)
                    ellipse(x + gridwidth/2 + gridwidth*i,y + gridwidth/2 + gridwidth*j,gridwidth*(SMALL_BOARD_PERCENT/100),gridwidth*(SMALL_BOARD_PERCENT/100));

                }
            } else {
                if (this.grid[i][j].winner == -1) {

                } else {
                    this.grid[i][j].draw(x + gridwidth*(i) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,y + gridwidth*(j) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,gridwidth,this.current_player);
                }
                
            }

        }
    }





    if (this.tictacselect) {

    } else {
        this.hover(x,y,gridwidth);
    }

            if (this.grid[this.cursor_x][this.cursor_y].select == true) {
                current_x = this.grid[this.cursor_x][this.cursor_y].cursor_x;
                current_y = this.grid[this.cursor_x][this.cursor_y].cursor_y;
                this.grid[this.cursor_x][this.cursor_y].select = false;
                
                if (this.current_player >= PLAYER_NUMBER) {
                    this.current_player = 1;
                } else {
                    this.current_player++;
                }

                if (this.grid[current_x][current_y].won || this.grid[current_x][current_y].winner == -1) {
                    this.grid[this.cursor_x][this.cursor_y].setselected(false);
                    this.tictacselect = false;
                    this.cursor_x = 0;
                    this.cursor_y = 0;
                    this.inputdelay = INPUT_DELAY;

                } else {
                    this.grid[this.cursor_x][this.cursor_y].setselected(false);
                    this.cursor_x = current_x;
                    this.cursor_y = current_y;
                    this.grid[this.cursor_x][this.cursor_y].setselected(true);
                    this.grid[this.cursor_x][this.cursor_y].current_player = this.current_player;
                }

                this.isWon();

            }

        
            



    


}

bigtictac.prototype.hover = function(x,y,gridwidth) {
    
    if (this.is_selected) {

    if (!this.tictacselect) {

        //This is  what was selected when the sauare was on.
        //the old code for the blinking. It didn't look very nice and you could only tell what was selected when the square was off
        // if (this.hovertime <= 0) {
        //     this.hoveron = true;
        // } else if (this.hovertime >= HOVER_TIME) {
        //     this.hoveron = false;
        // }

        // if (this.hoveron == true) {
        //     // rectMode(CORNER);
        //     // fill(255);
        //     //noStroke();
        //     noFill();
        //     rect(x + gridwidth*(this.cursor_x) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,y + gridwidth*(this.cursor_y) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,gridwidth*(SMALL_BOARD_PERCENT/100),gridwidth*(SMALL_BOARD_PERCENT/100));
        //     this.hovertime++;
        // } else {
        //     this.hovertime--;
        // } 
        

        rectMode(CORNER);
        noFill();
        rect(x + gridwidth*(this.cursor_x) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,y + gridwidth*(this.cursor_y) + (gridwidth*((1-(SMALL_BOARD_PERCENT / 100))))/2,gridwidth*(SMALL_BOARD_PERCENT/100),gridwidth*(SMALL_BOARD_PERCENT/100));




    }

}
    
}

//this method is intended to draw a square around the tictac grid to imply that it is being hovered over
bigtictac.prototype.hoveredover = function() {
    
    if (this.current_strokeweight == 10 && this.is_selected == false) {
        this.directional_value = -1;


    } else if (this.current_strokeweight == 0 && this.is_selected == true) {
        this.directional_value = 1;
    }

    if (this.is_selected == false && this.current_strokeweight > 0) {
        this.current_strokeweight += this.directional_value;
    } else if (this.is_selected == true && this.current_strokeweight < 10) {
        this.current_strokeweight += this.directional_value;
    }



    //drawing a rectangle around the tictac
    noFill();
    console.log(this.current_strokeweight);
    strokeWeight(this.current_strokeweight);
    stroke(255);
    rectMode(CORNER);
    rect(this.x, this.y,getCanvasSize() * (BOARD_PERCENT/100),getCanvasSize() * (BOARD_PERCENT/100));

}


//This function is intended to move the cursor up
bigtictac.prototype.up = function() {


    if (this.tictacselect) {
        this.grid[this.cursor_x][this.cursor_y].up();
    } else {
        if (this.cursor_y == 0) {
            this.cursor_y = GRID_LENGTH - 1;
        } else {
            this.cursor_y -= 1;
        }
    }


    


}

//this function is intented to move the cursor down
bigtictac.prototype.down = function() {

    if (this.tictacselect) {
        this.grid[this.cursor_x][this.cursor_y].down();
    } else {
        if (this.cursor_y == GRID_LENGTH - 1) {
            this.cursor_y = 0;
        } else {
            this.cursor_y += 1;
        }
    }

}

//this function is intended to move the cursor left
bigtictac.prototype.left = function() {


    if (this.tictacselect) {
        this.grid[this.cursor_x][this.cursor_y].left();
    } else {
        if (this.cursor_x == 0) {
            this.cursor_x = GRID_LENGTH - 1;
        } else {
            this.cursor_x -= 1;
        }
    }
    }


//this function is intended to move the cursor right
bigtictac.prototype.right = function() {


    if (this.tictacselect) {
        this.grid[this.cursor_x][this.cursor_y].right();
    } else {
        if (this.cursor_x == GRID_LENGTH - 1) {
            this.cursor_x = 0;
        } else {
            this.cursor_x += 1;
        }
    }


}

//this function is intended to select
bigtictac.prototype.select = function() {


    if (this.tictacselect) {
        this.grid[this.cursor_x][this.cursor_y].space();
    } else {
        if (this.grid[this.cursor_x][this.cursor_y].won) {

        } else {
            this.tictacselect = true;
            this.grid[this.cursor_x][this.cursor_y].setselected(true);
            this.grid[this.cursor_x][this.cursor_y].current_player = this.current_player;
        }
    }




    this.isWon();
}