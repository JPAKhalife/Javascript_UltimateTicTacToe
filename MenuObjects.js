

/**
 * @class Floater
 * @Description This class is used to create menu floaters
 * @constructor
 * @param {*} image
 * @param {*} width
 * @param {*} length
 */
class Floater {
    constructor(image, width, length) {
    
    this.floater = new Img(image,0,0,width,length);
    this.floater.setAngleMode(DEGREES);
    this.floater.setImageOrientation(CENTER);
    //These are for the current x and y velocity
    this.vx = 0;
    this.vy = 0;
    //This controls the spin speed of the bouncer
    this.sv = 0;
    //This is the current opacity of the bouncer
    this.opacity = 255;
    this.width = width;
    this.length = length;
    //These are the translate coordinates
    this.x = 0;
    this.y = 0;

    }

    /**
     * @method init
     * @description This method initializes the floater
     */
    init() {
        this.vx = this.random_Velocity();
        this.vy = this.random_Velocity();
        this.sv = this.random_Velocity();
        this.x = this.random_Coord();
        this.y = this.random_Coord();
    }

    /**
     * @method setTint
     * @description This method sets the tint of the floater
     */
    reset() {
        this.opacity = 0;
    }

    /**
     * @method setTint
     * @description This method sets the tint of the floater
     */
    draw() {
        this.floater.trnslate(this.x,this.y);
        this.floater.roll(this.sv,DEGREES);
        this.floater.setTint(this.opacity);
        this.floater.render();
        this.x += this.vx;
        this.y += this.vy;

        if (this.doBounce()) {
            this.bounce();
        }
    }

    /**
     * @method doBounce
     * @description This method checks if the floater is bouncing
     * @returns {boolean}
     */
    doBounce() {
        if (this.x + this.width/2 > getCanvasSize() || this.x - this.width/2 < 0 || this.y + this.length/2 > getCanvasSize() || this.y - this.length/2 < 0) {
            return true;
        }
    }

    /**
     * @method bounce
     * @description This method bounces the floater
     */
    bounce() {
        if (this.x  + this.width/2 > getCanvasSize() || this.x - this.width/2 < 0) {
            this.vx = this.vx*-1;
        }
    
        if (this.y  + this.length/2 > getCanvasSize() || this.y - this.length/2 < 0) {
            this.vy = this.vy*-1;
        }
        
        this.sv = this.sv*-1;
        
    }

    /**
     * @method setOpacity
     * @description This is a setter that sets the opacity of the floater
     * @param {*} opacity 
     */
    setOpacity(opacity) {
        this.opacity = opacity;
    }

    /**
     * @method fade_in
     * @description This method fades in the floater
     * @param {*} time 
     */
    fade_in(time) {
        this.opacity += 255/time;
    }

    /**
     * @method random_Coord
     * @description This method returns a random coordinate
     * @return {number}
     */
    random_Coord() {
        return random(0 + this.width/2,getCanvasSize() - this.width/2);
    }

    /**
     * @method random_Velocity
     * @description This method returns a random velocity
     * @returns {number}
     */
    random_Velocity() {
        return random(-3,3);
    }

    /**
     * @method fade_out
     * @description This method fades out the floater
     * @param {*} time 
     */
    fade_out(time) {
        this.opacity -= 255/time;
    }
}


/**
 * @class ButtonNav
 * @description This class is used to create a button navigation system
 */
class ButtonNav {

/**
 * @constructor
 * @param {*} button_array 
 */
constructor(button_array) {
    //this is the array of buttons
    this.button_array = button_array;
    //currently selected button
    this.currently_selected = button_array[0];
    this.currently_selected.setStatus(true);
}

/**
 * @method drawAll
 * @description This method is intended to draw all of the buttons
 */
drawAll() {
    for (i = 0 ; i < this.button_array.length ; i ++) {
        this.button_array[i].draw_button();
    }
}

/**
 * @method reset
 * @description This method resets all of the buttons
 */
reset() {
    for (i = 0 ; i < this.button_array.length ; i++) {
        this.button_array[i].reset();
    }

    this.currently_selected = this.button_array[0];
    this.currently_selected.setStatus(true);
}


//this function is meant to confriemd a button
/**
 * @method confirm
 * @description This method confirms a button
 */
confirm() {

    this.currently_selected.confirmed = true;

}




//this will find the closest button given a direction
/**
 * @method findClosest
 * @description This method finds the closest button given a direction
 * @param {*} direction
 * */
findClosest(direction) {

    //used to factor in the direction of the 
    let direction_multiplier = 1;

    //initial value for comparison
    let closestButton = 0;
    let foundwithin = false;

    //getting the direction multiplier
    if (direction == 2 || direction == 3) {
        direction_multiplier = -1;
    }

    //first screening
   let in_range = [];

    //finding all of the watchamacallits in a certain direction
    for (i = 0 ; i < this.button_array.length ; i++) {
        if (this.button_array[i].relevant_value(direction) > this.currently_selected.relevant_value(direction) && direction_multiplier == 1) {

            in_range.push(this.button_array[i]);
            foundwithin = true;
        }

        if (this.button_array[i].relevant_value(direction) < this.currently_selected.relevant_value(direction) && direction_multiplier == -1) {

            in_range.push(this.button_array[i]);
            foundwithin = true;
        }
    }

    //findind the cloest in the other coordinate
    for (i = 0 ; i < in_range.length ; i++) {
        if (Math.abs(this.currently_selected.opposite_relevant_value(direction) - in_range[i].opposite_relevant_value(direction)) < Math.abs(this.currently_selected.opposite_relevant_value(direction) - in_range[closestButton].opposite_relevant_value(direction))) {
            closestButton = i;
        }
    }

    
    if (foundwithin) {
        return this.button_array.indexOf(in_range[closestButton]);
    } else {
        return this.button_array.indexOf(this.currently_selected);
    }
    





}

//this will select the closest button given a direction
/**
 * @method selectClosest
 * @description This method selects the closest button given a direction
 * @param {*} button 
 * @param {*} direction 
 */
selectClosest(button,direction) {
    let closest = this.findClosest(button,direction)
    if (this.button_array[closest] != this.currently_selected) {
        this.button_array[closest].setStatus(true);
        this.currently_selected.setStatus(false);
        this.currently_selected = this.button_array[closest];
    }

}

/**
 * @method select
 * @description This method selects a button
 * @param {*} button 
 */
select(button) {
    this.button_array[button].setStatus(true);
}

/**
 * @method unselect
 * @description This method deselects a button
 * @param {*} button 
 */
unselect(button) {
    this.button_array[button].setStatus(false);
}

/**
 * @method changeSelected
 * @description This method changes the selected button
 * @param {*} button 
 */
changeSelected(button) {
    unselect(this.button_array.indexOf(this.currently_selected));
    this.currently_selected = this.button_array[button];
    select(button);
}
}

//the purpose of this class is to create a new type of button that will be used for the quit screen
//this button will simply be text with no outline, however when hovered a white rectangle will appear and the text and rectangle will shake slightly
//upon being selected, the text will turn white and the button will go black.


//here are some constants that are relevant to the button
//time it takes for the hovering animation to complete
const QUIT_SELECTION_ANIMATION_TIME = 10;
//time it takes for the confirmed animatino to complete
const QUIT_CONFIRMED_ANIMATION_TIME = 10;
//jar animation time
const JAR_ANIMATION_TIME = 10;
//this is the amount of pixels that the button will move by
const PIXEL_MOVEMENT = 2;

function QuitButton(x,y,phrase) {

    //this is out x coordinate
    this.x  = x;

    //this is our y coordinate
    this.y = y;

    //these are the variables that hold the variatinon on x and y
    this.jar_x = 0;
    this.jar_y = 0;

    //whether or not the button is selected
    this.selected = false;

    //whether or not the button is confirmed
    this.confirmed = false;

    //this contains the current fill of the square around the button
    this.square_fill = 0;

    //this contains the fill of the text on the button
    this.text_fill = 255;

    //this determines whether or not the jar animation will be played
    this.do_jar = false;

    //this contains the opcaity of the button
    this.opacity = 255;





}


//this is our draw method.
QuitButton.prototype.draw = function() {

    //this will check if the button is being hovered over or not
    if (this.selected) {


    } else {


    }

        

}

//this is a mtehtod that sets the opacity of the button
QuitButton.prototype.set_opacity = function(opacity) {
    this.opacity = opacity;
}

//This method sets the selected status of the button
QuitButton.prototype.setStatus = function(status) {
    this.selected = status;
}

//this is responsible for drawing the default appearance
QuitButton.prototype.draw_default = function() {

    fill(this.square_fill,this.opacity);
    noStroke();
    rectMode(CENTER);
    rect(this.x,this.y,getCanvasSize()*0.05,getCanvasSize()*0.025);
    textAlign(CENTER);
    fill(this.text_fill,this.opacity);
    text(phrase,this.x + getCanvasSize()*0.05/2,this.y + getCanvasSize()*0.025/2);


    if (this.square_fill > 0) {
        this.square_fill -= 255/QUIT_SELECTION_ANIMATION_TIME;
    }


}

//this is responsible for drawing the hovered appearance
QuitButton.prototype.draw_hovered = function() {

    if (this.square_fill < 255) {
        this.square_fill += 255/QUIT_SELECTION_ANIMATION_TIME;
    }

    fill(this.square_fill,this.opacity);
    noStroke();
    rectMode(CENTER);
    rect(this.x + this.jar_x,this.y + this.jar_y,getCanvasSize()*0.05,getCanvasSize()*0.025);
    textAlign(CENTER);
    fill(this.text_fill,this.opacity);
    text(phrase,this.x + getCanvasSize()*0.05/2,this.y + getCanvasSize()*0.025/2);

    if (this.do_jar == true) {
        
        if (this.jar_x < PIXEL_MOVEMENT) {
            this.do_jar = false;
        } else {
            this.jar_x += PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
            this.jar_y += PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
        }
        
    } else {
        if (this.jar_x > 0) {
            this.jar_x -= PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
            this.jar_y -= PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
        }
    }





}


/**
 *  This file is intended to create button functionality in ultimate tic tact toe
 *  This game is can only be interacted with through arrows and keys on the keyboard, so the button designs and 
 *  interactions reflect this
 * 
 * 
 * 
 * 
 */

//These are constants that have to do with the button
//modify these in order to change how the button behaves




// This is the initializor
function menu_button(x,y,phrase,length,width,textsize,opacity = 255) {

    //whether or not the button is selected
    this.selected = false;

    //whether or not the button is confirmed
    this.confirmed = false;

    //the coordinates on the canvas of the button
    this.x = x;
    this.y = y;

    //the word in the button
    this.phrase = phrase;

    //the current animation time of the button
    this.animation_time = 0;

    //length and width of the button
    this.length = length;
    this.width = width;

    //current length and width of the button
    this.current_length = length;
    this.current_width = width;

    //this is the text size 
    this.text_size = textsize;
    this.current_text_size = textsize;

    //this is the current colour of the button
    this.current_button_fill = DEFAULT_BUTTON_SHADE;
    
    //this is the current colour of the text in the button
    this.current_text_fill = SELECTED_BUTTON_SHADE;

    //variable that will control the amount the confirmed square grows by
    this.cw = 0;
    this.cl = 0;

    //this will control the opacity of the ring that occurs when a selection is confirmed
    this.opacity = opacity;


    //contains the status of the confirmed animation
    this.confirmed_animation = false;
}



//This method is intented to draw the standard appearance of the button
menu_button.prototype.standard_button = function() {
    
    textFont('Arial');

    //checking if the animation time is finished
    if (this.animation_time == 0) {
        noFill();

    } else {

        //adding to the length and width
        this.current_width -= ((this.width) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;
        this.current_length -= ((this.length) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;

        //changing the button fill to the desired fill
        this.current_button_fill -= (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;
        this.current_text_fill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;

        fill(this.current_button_fill,this.opacity);
    

        this.animation_time--;
    }

    strokeWeight(1);
    stroke(255,this.opacity);
    rectMode(CENTER);
    
    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),this.current_width * getCanvasSize(),this.current_length * getCanvasSize());
    textSize(this.current_text_size);
    fill(this.current_text_fill,this.opacity);
    noStroke();
    textAlign(CENTER,CENTER);
    text(this.phrase,this.x * getCanvasSize(), this.y * getCanvasSize(),this.current_width * getCanvasSize(),this.current_length * getCanvasSize());    
    
}

//this method resets all variables so that the buttons can be pressed again.
menu_button.prototype.reset = function() {
    this.cw = 0;
    this.cl = 0;
    this.opacity = 255;
    this.confirmed = false;
    this.confirmed_animation = false;
    this.animation_time = 0;
    this.selected = false;
    this.current_length = this.length;
    this.current_width = this.width;
    this.current_text_fill = 255;
    this.current_button_fill = 0;
    this.current_text_size = this.text_size;
}

//this method returns whether or not the button is selected
menu_button.prototype.isSelected = function() {

    if (this.selected == true) {
        return true;
    } else {
        return false;
    }
}


//This method sets the selected status of the button
menu_button.prototype.setStatus = function(status) {
    this.selected = status;
}

//this method draws the button when it has been selected and does the animation for when it is selected
menu_button.prototype.selected_button = function() {
    textFont('Arial');

    //checking if the animation time is finished
    if (this.animation_time > ATIME.SELECTED_ANIMATION_TIME) {

    } else {

        //adding to the length and width
        this.current_width += ((this.width) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;
        this.current_length += ((this.length) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;

        //changing the button fill to the desired fill
        this.current_button_fill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;
        this.current_text_fill -= (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;
    

        this.animation_time++;
    }

    strokeWeight(1);
    stroke(255,this.opacity);
    fill(this.current_button_fill,this.opacity);

    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),this.current_width * getCanvasSize(),this.current_length * getCanvasSize());
    textSize(this.current_text_size);
    fill(this.current_text_fill,this.opacity);
    noStroke()
    textAlign(CENTER,CENTER);
    text(this.phrase,this.x * getCanvasSize(), this.y * getCanvasSize(),this.current_width * getCanvasSize(),this.current_length * getCanvasSize());   


}

//this method draws the button when it has been confrmed and does the animation for when it is confirmed
menu_button.prototype.confirmed_button = function() {
    textFont('Arial');
    first_half = true

    // //checking if the animation time is finished
    if (this.animation_time > ATIME.CONFIRMED_ANIMATION_TIME) {
        this.opacity = 0;
        this.confirmed_animation = true;

    } else {
        
        this.cl += ((CONFIRMED_GROWTH_PERCENT / 100) * (this.current_length * getCanvasSize()) + (this.current_length * getCanvasSize())) / ATIME.CONFIRMED_ANIMATION_TIME;
        this.cw += ((CONFIRMED_GROWTH_PERCENT / 100) * (this.current_width * getCanvasSize()) + (this.current_width * getCanvasSize())) / ATIME.CONFIRMED_ANIMATION_TIME;
        this.current_text_fill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.CONFIRMED_ANIMATION_TIME;
        this.opacity -= (255/ATIME.CONFIRMED_ANIMATION_TIME)
    

        this.animation_time++;
    }
    
    noStroke()
    fill(255);
    //fill(this.current_button_fill);

    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),(this.current_width * getCanvasSize()) - this.cw ,(this.current_length * getCanvasSize()) - this.cls);
    textSize(this.current_text_size);
    fill(this.current_text_fill);
    tint(0,255);
    textAlign(CENTER,CENTER);
    text(this.phrase,this.x * getCanvasSize(), this.y * getCanvasSize(),this.current_width * getCanvasSize(),this.current_length * getCanvasSize());  

    //this is the second rectangle that will be acting as the 


    stroke(255,this.opacity);
    fill(0);
    strokeWeight(OUTLINE_WEIGHT);
    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),OUTLINE_WEIGHT + this.cw,this.cl + OUTLINE_WEIGHT);
    
    


}

menu_button.prototype.fade = function() {

    this.opacity -= (255/(ATIME.CONFIRMED_ANIMATION_TIME/4));
}

//returns true or false depending on i the button is confirmed
menu_button.prototype.isconfirmed = function( ) {
    return this.confirmed;

}

//checks if the confirmed animatino is finished or not
menu_button.prototype.isconfirmed_animation_done = function( ) {
    return this.confirmed_animation;

}




//This is the function that gets called for the button to be drawn, selected or not, it decides which will be drawn
menu_button.prototype.draw_button = function() {

    if (this.confirmed == true) {
        this.confirmed_button();
        
    } else if (this.isSelected() == false) {
        this.standard_button();
    } else 
    if (this.isSelected() == true) {
        this.selected_button();

    }

}

//this function will return the relevant value based on the direction it is given
menu_button.prototype.relevant_value = function(direction) {

    if (direction == 0 || direction == 2) {
        return this.y;
    } else if (direction == 1 || direction == 3) {
        return this.x;
    }


}

//this function will return the opposite relevant value based on the direction it is given
menu_button.prototype.opposite_relevant_value = function(direction) {

    if (direction == 0 || direction == 2) {
        return this.x;
    } else if (direction == 1 || direction == 3) {
        return this.y;
    }


}

//this function will control the fading in animation of all buttons
menu_button.prototype.fade_in = function(time) {
    this.opacity += (255/(time));
}

//this function will control the fading in animation of all buttons
menu_button.prototype.set_opacity = function(opacity) {
    this.opacity = opacity;
}




//creating the object type smallltictac.
class TicTacBoard {
    constructor(game,x,y,gridsize) {
        this.x = x - gridsize/2;
        this.y = y - gridsize/2;
        this.gridsize = gridsize;
            
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

        //we take the tictac as a pointer to the tictac this tictac is responsible for displaying
        this.game = game;
        this.tictac = game.getBoard();

        this.board = [];
        for (let i = 0 ; i < GRID_SIZE ; i ++) {
            this.board[i] = [];
            for (let j = 0 ; j < GRID_SIZE ; j++) {
                let slotItem = this.tictac.getSlot(i,j);
                if (slotItem instanceof TicTac) {
                    this.board[i][j] = new TicTacBoard(this.tictac.getSlot(i,j),(this.x + (gridsize/GRID_SIZE)/2) + j*(gridsize/GRID_SIZE),(this.y + (gridsize/GRID_SIZE)/2) + i*(gridsize/GRID_SIZE));
                } else {
                    this.board[i][j] = this.tictac.getSlot(i,j);
                }
                
            }
        }

        //We need to find a way to create 
    }

    draw() {
        let linenum = GRID_SIZE - 1;
        let linewidth = linenum*this.gridsize*SMALL_LINEWIDTH_TO_BOARDWIDTH_RATIO;
        let gridwidth = ((this.gridsize  - linewidth))/GRID_SIZE;

        fill(255);
        strokeWeight(linewidth);
        stroke(255);

        //This loop draws all the proper lines.
        for (let i = 0 ; i < linenum ; i++) {
            line(this.x + gridwidth*(i+1),this.y,this.x + gridwidth*(i+1),this.y + this.gridsize);
            line(this.x,this.y+gridwidth*(i+1),this.x + this.gridsize,this.y + gridwidth * (i+1));
        }

        fill(0);

        //Then we need to draw the contents of what is inside the tictac.
        //Each tictac is either all tictacs or all values. So there 
        //We only use x and os if the player number is 2. Otherwise, numbers will suffice.
        //this loop is intended to draw the x inside of every single spot of the grid
        for (let i = 0 ; i < SMALL_GRID_LENGTH ; i++) {
            for (let j = 0 ; j < SMALL_GRID_LENGTH ; j ++) {
                if (this.board[i][j] instanceof TicTac) {
                    this.board[i][j].draw();
                } else if (this.board[i][j] == 0) {
                    //Do nothing
                } else if (this.board[i][j] == 1) {
                    stroke(255);
                    line(this.x + gridwidth*i + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,this.y + gridwidth*j + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,this.x + gridwidth*i + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,this.y + gridwidth*j + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2);
                    line(this.x + gridwidth*i + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,this.y + gridwidth*j + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,this.x + gridwidth*i + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,this.y + gridwidth*j + gridwidth*(SMALLEST_BOARD_PERCENT / 100) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2);
                } else  if (this.tictac.getSlot(i,j) == 2) {
                    stroke(255);
                    ellipseMode(CENTER)
                    ellipse(this.x + gridwidth/2 + gridwidth*i,this.y + gridwidth/2 + gridwidth*j,gridwidth*(SMALLEST_BOARD_PERCENT/100),gridwidth*(SMALLEST_BOARD_PERCENT/100));
                } else {
                    //Draw the number in the grid instead.
                    textSize(gridwidth*(SMALLEST_BOARD_PERCENT/100));
                    text(this.tictac.getSlot(i,j),this.x + gridwidth/2 + gridwidth*i,this.y + gridwidth/2 + gridwidth*j);
                }
            }



        }
            //creating a hover animation
            if (this.select) {

            } else {
                this.hover(x,y,gridwidth);
            }
    }

    up() {
        if (this.cursor_y == 0) {
            this.cursor_y = SMALL_GRID_LENGTH - 1;
        } else {
            this.cursor_y -= 1;
        }
    }

    down() {
        if (this.cursor_y == SMALL_GRID_LENGTH - 1) {
            this.cursor_y = 0;
        } else {
            this.cursor_y += 1;
        }
    }

    left() {
        if (this.cursor_x == 0) {
            this.cursor_x = SMALL_GRID_LENGTH - 1;
        } else {
            this.cursor_x -= 1;
        }
    }
    
    right() {
        if (this.cursor_x == SMALL_GRID_LENGTH - 1) {
            this.cursor_x = 0;
        } else {
            this.cursor_x += 1;
        }
    
    }

    space() {
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


    select(row,column,user) {
        //doing a little check to make sure the value being set is correct.
        if (user > PLAYER_NUMBER) {
            throw 'The value cannot be set because this player does not exist.';
        } else {
            this.lastmove = [row,column]
            this.grid[row][column] = user;
        }
    }

    setselected(set) {
        this.isselected = set;
        this.inputdelay = INPUT_DELAY;
        this.cursor_x = 0;
        this.cursor_y = 0;
    }

    isTaken(row,column) {
        switch (this.owner(row,column)) {
            case 0:
                //this spot is not taken, return false.
                return false;
            default:
                // this spot is taken by a user, return true.
                return true;
                
    
        }
    }
    
    
    hover(x,y,gridwidth) {
    
        if (this.isselected) {
    
            rectMode(CORNER);
            noFill();
            rect(x + gridwidth*(this.cursor_x) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,y + gridwidth*(this.cursor_y) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,gridwidth*(SMALLEST_BOARD_PERCENT/100),gridwidth*(SMALLEST_BOARD_PERCENT/100));
    
    
            // if (this.hovertime <= 0) {
            //     this.hoveron = true;
            // } else if (this.hovertime >= HOVER_TIME_SMALL) {
            //     this.hoveron = false;
            // }
    
            // if (this.hoveron == true) {
            //     fill(255);
            //     rectMode(CORNER);
            //     rect(x + gridwidth*(this.cursor_x) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,y + gridwidth*(this.cursor_y) + (gridwidth*((1-(SMALLEST_BOARD_PERCENT / 100))))/2,gridwidth*(SMALLEST_BOARD_PERCENT/100),gridwidth*(SMALLEST_BOARD_PERCENT/100));
            //     this.hovertime++;
            // } else {
            //     this.hovertime--;
            // } 
            
    
        }
        
    }
    
    isFull = function() {
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

    owner(row,column) {
    
        // We need to check whether or not the value in the grid is correct or not.
        // if not, the game is not running properly and there is no point in continuing it.
        if (this.grid[row][column] > PLAYER_NUMBER) {
            throw 'The value of this spot in the grid is not correct. This player should not exist.';
        } else {
            return this.grid[row][column];
        }
    
    } 
}




