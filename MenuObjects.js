/**
 * This file is intended to house custom objects that are drawn on the GUI
 */


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
        this.vx = this.randomVelocity();
        this.vy = this.randomVelocity();
        this.sv = this.randomVelocity();
        this.x = this.randomCoord();
        this.y = this.randomCoord();
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
     * @method fadeIn
     * @description This method fades in the floater
     * @param {*} time 
     */
    fadeIn(time) {
        this.opacity += 255/time;
    }

    /**
     * @method randomCoord
     * @description This method returns a random coordinate
     * @return {number}
     */
    randomCoord() {
        return random(0 + this.width/2,getCanvasSize() - this.width/2);
    }

    /**
     * @method randomVelocity
     * @description This method returns a random velocity
     * @returns {number}
     */
    randomVelocity() {
        return random(-3,3);
    }

    /**
     * @method fadeOut
     * @description This method fades out the floater
     * @param {*} time 
     */
    fadeOut(time) {
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
 * @param {*} buttonArray 
 */
constructor(buttonArray) {
    //this is the array of buttons
    this.buttonArray = buttonArray;
    //currently selected button
    this.currentlySelected = buttonArray[0];
    this.currentlySelected.setStatus(true);
}

/**
 * @method drawAll
 * @description This method is intended to draw all of the buttons
 */
drawAll() {
    for (i = 0 ; i < this.buttonArray.length ; i ++) {
        this.buttonArray[i].drawButton();
    }
}

/**
 * @method reset
 * @description This method resets all of the buttons
 */
reset() {
    for (i = 0 ; i < this.buttonArray.length ; i++) {
        this.buttonArray[i].reset();
    }

    this.currentlySelected = this.buttonArray[0];
    this.currentlySelected.setStatus(true);
}


//this function is meant to confriemd a button
/**
 * @method confirm
 * @description This method confirms a button
 */
confirm() {

    this.currentlySelected.confirmed = true;

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
    for (i = 0 ; i < this.buttonArray.length ; i++) {
        if (this.buttonArray[i].relevantValue(direction) > this.currentlySelected.relevantValue(direction) && direction_multiplier == 1) {

            in_range.push(this.buttonArray[i]);
            foundwithin = true;
        }

        if (this.buttonArray[i].relevantValue(direction) < this.currentlySelected.relevantValue(direction) && direction_multiplier == -1) {

            in_range.push(this.buttonArray[i]);
            foundwithin = true;
        }
    }

    //findind the cloest in the other coordinate
    for (i = 0 ; i < in_range.length ; i++) {
        if (Math.abs(this.currentlySelected.oppositeRelevantValue(direction) - in_range[i].oppositeRelevantValue(direction)) < Math.abs(this.currentlySelected.oppositeRelevantValue(direction) - in_range[closestButton].oppositeRelevantValue(direction))) {
            closestButton = i;
        }
    }

    
    if (foundwithin) {
        return this.buttonArray.indexOf(in_range[closestButton]);
    } else {
        return this.buttonArray.indexOf(this.currentlySelected);
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
    if (this.buttonArray[closest] != this.currentlySelected) {
        this.buttonArray[closest].setStatus(true);
        this.currentlySelected.setStatus(false);
        this.currentlySelected = this.buttonArray[closest];
    }

}

/**
 * @method select
 * @description This method selects a button
 * @param {*} button 
 */
select(button) {
    this.buttonArray[button].setStatus(true);
}

/**
 * @method unselect
 * @description This method deselects a button
 * @param {*} button 
 */
unselect(button) {
    this.buttonArray[button].setStatus(false);
}

/**
 * @method changeSelected
 * @description This method changes the selected button
 * @param {*} button 
 */
changeSelected(button) {
    unselect(this.buttonArray.indexOf(this.currentlySelected));
    this.currentlySelected = this.buttonArray[button];
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
    this.jarX = 0;
    this.jarY = 0;

    //whether or not the button is selected
    this.selected = false;

    //whether or not the button is confirmed
    this.confirmed = false;

    //this contains the current fill of the square around the button
    this.squareFill = 0;

    //this contains the fill of the text on the button
    this.textFill = 255;

    //this determines whether or not the jar animation will be played
    this.doJar = false;

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
QuitButton.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
}

//This method sets the selected status of the button
QuitButton.prototype.setStatus = function(status) {
    this.selected = status;
}

//this is responsible for drawing the default appearance
QuitButton.prototype.drawDefault = function() {

    fill(this.squareFill,this.opacity);
    noStroke();
    rectMode(CENTER);
    rect(this.x,this.y,getCanvasSize()*0.05,getCanvasSize()*0.025);
    textAlign(CENTER);
    fill(this.textFill,this.opacity);
    text(phrase,this.x + getCanvasSize()*0.05/2,this.y + getCanvasSize()*0.025/2);


    if (this.squareFill > 0) {
        this.squareFill -= 255/QUIT_SELECTION_ANIMATION_TIME;
    }


}

//this is responsible for drawing the hovered appearance
QuitButton.prototype.drawHovered = function() {

    if (this.squareFill < 255) {
        this.squareFill += 255/QUIT_SELECTION_ANIMATION_TIME;
    }

    fill(this.squareFill,this.opacity);
    noStroke();
    rectMode(CENTER);
    rect(this.x + this.jarX,this.y + this.jarY,getCanvasSize()*0.05,getCanvasSize()*0.025);
    textAlign(CENTER);
    fill(this.textFill,this.opacity);
    text(phrase,this.x + getCanvasSize()*0.05/2,this.y + getCanvasSize()*0.025/2);

    if (this.doJar == true) {
        
        if (this.jarX < PIXEL_MOVEMENT) {
            this.doJar = false;
        } else {
            this.jarX += PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
            this.jarY += PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
        }
        
    } else {
        if (this.jarX > 0) {
            this.jarX -= PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
            this.jarY -= PIXEL_MOVEMENT/JAR_ANIMATION_TIME/2;
        }
    }
}


/**
 *  This class is intended to create button functionality in ultimate tic tact toe
 *  This game is can only be interacted with through arrows and keys on the keyboard, so the button designs and 
 *  interactions reflect this
 * 
 * 
 * 
 * 
 */
function MenuButton(x,y,phrase,length,width,textsize,opacity = 255) {
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
    this.animationTime = 0;

    //length and width of the button
    this.length = length;
    this.width = width;

    //current length and width of the button
    this.currentLength = length;
    this.currentWidth = width;

    //this is the text size 
    this.textSize = textsize;
    this.currentTextSize = textsize;

    //this is the current colour of the button
    this.currentButtonFill = DEFAULT_BUTTON_SHADE;
    
    //this is the current colour of the text in the button
    this.currentTextFill = SELECTED_BUTTON_SHADE;

    //variable that will control the amount the confirmed square grows by
    this.cw = 0;
    this.cl = 0;

    //this will control the opacity of the ring that occurs when a selection is confirmed
    this.opacity = opacity;


    //contains the status of the confirmed animation
    this.confirmedAnimation = false;
}



//This method is intented to draw the standard appearance of the button
MenuButton.prototype.standardButton = function() {

    textFont('Arial');
    //checking if the animation time is finished
    if (this.animationTime == 0) {
        noFill();
    } else {
        //adding to the length and width
        this.currentWidth -= ((this.width) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;
        this.currentLength -= ((this.length) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;

        //changing the button fill to the desired fill
        this.currentButtonFill -= (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;
        this.currentTextFill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;

        fill(this.currentButtonFill,this.opacity);    
        this.animationTime--;
    }

    strokeWeight(1);
    stroke(255,this.opacity);
    rectMode(CENTER);
    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),this.currentWidth * getCanvasSize(),this.currentLength * getCanvasSize());
    textSize(this.currentTextSize);
    fill(this.currentTextFill,this.opacity);
    noStroke();
    textAlign(CENTER,CENTER);
    text(this.phrase,this.x * getCanvasSize(), this.y * getCanvasSize(),this.currentWidth * getCanvasSize(),this.currentLength * getCanvasSize());    
    
}

//this method resets all variables so that the buttons can be pressed again.
MenuButton.prototype.reset = function() {
    this.cw = 0;
    this.cl = 0;
    this.opacity = 255;
    this.confirmed = false;
    this.confirmedAnimation = false;
    this.animationTime = 0;
    this.selected = false;
    this.currentLength = this.length;
    this.currentWidth = this.width;
    this.currentTextFill = 255;
    this.currentButtonFill = 0;
    this.currentTextSize = this.textSize;
}

//this method returns whether or not the button is selected
MenuButton.prototype.isSelected = function() {

    if (this.selected == true) {
        return true;
    } else {
        return false;
    }
}


//This method sets the selected status of the button
MenuButton.prototype.setStatus = function(status) {
    this.selected = status;
}

//this method draws the button when it has been selected and does the animation for when it is selected
MenuButton.prototype.selectedButton = function() {
    textFont('Arial');
    //checking if the animation time is finished
    if (this.animationTime > ATIME.SELECTED_ANIMATION_TIME) {

    } else {
        //adding to the length and width
        this.currentWidth += ((this.width) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;
        this.currentLength += ((this.length) * (GROWTH_PERCENT / 100)) / ATIME.SELECTED_ANIMATION_TIME;

        //changing the button fill to the desired fill
        this.currentButtonFill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;
        this.currentTextFill -= (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.SELECTED_ANIMATION_TIME;
        this.animationTime++;
    }
    strokeWeight(1);
    stroke(255,this.opacity);
    fill(this.currentButtonFill,this.opacity);

    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),this.currentWidth * getCanvasSize(),this.currentLength * getCanvasSize());
    textSize(this.currentTextSize);
    fill(this.currentTextFill,this.opacity);
    noStroke()
    textAlign(CENTER,CENTER);
    text(this.phrase,this.x * getCanvasSize(), this.y * getCanvasSize(),this.currentWidth * getCanvasSize(),this.currentLength * getCanvasSize());   
}

//this method draws the button when it has been confrmed and does the animation for when it is confirmed
MenuButton.prototype.confirmedButton = function() {
    textFont('Arial');
    first_half = true
    //checking if the animation time is finished
    if (this.animationTime > ATIME.CONFIRMED_ANIMATION_TIME) {
        this.opacity = 0;
        this.confirmedAnimation = true;
    } else {
        this.cl += ((CONFIRMED_GROWTH_PERCENT / 100) * (this.currentLength * getCanvasSize()) + (this.currentLength * getCanvasSize())) / ATIME.CONFIRMED_ANIMATION_TIME;
        this.cw += ((CONFIRMED_GROWTH_PERCENT / 100) * (this.currentWidth * getCanvasSize()) + (this.currentWidth * getCanvasSize())) / ATIME.CONFIRMED_ANIMATION_TIME;
        this.currentTextFill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / ATIME.CONFIRMED_ANIMATION_TIME;
        this.opacity -= (255/ATIME.CONFIRMED_ANIMATION_TIME)
        this.animationTime++;
    }
    noStroke()
    fill(255);
    //fill(this.currentButtonFill);
    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),(this.currentWidth * getCanvasSize()) - this.cw ,(this.currentLength * getCanvasSize()) - this.cls);
    textSize(this.currentTextSize);
    fill(this.currentTextFill);
    tint(0,255);
    textAlign(CENTER,CENTER);
    text(this.phrase,this.x * getCanvasSize(), this.y * getCanvasSize(),this.currentWidth * getCanvasSize(),this.currentLength * getCanvasSize());  
    //this is the second rectangle that will be acting as the 
    stroke(255,this.opacity);
    fill(0);
    strokeWeight(OUTLINE_WEIGHT);
    rect(this.x * getCanvasSize(), this.y * getCanvasSize(),OUTLINE_WEIGHT + this.cw,this.cl + OUTLINE_WEIGHT);
}

MenuButton.prototype.fade = function() {

    this.opacity -= (255/(ATIME.CONFIRMED_ANIMATION_TIME/4));
}

//returns true or false depending on i the button is confirmed
MenuButton.prototype.isConfirmed = function( ) {
    return this.confirmed;

}

//checks if the confirmed animatino is finished or not
MenuButton.prototype.isConfirmedAnimationDone = function( ) {
    return this.confirmedAnimation;

}

//This is the function that gets called for the button to be drawn, selected or not, it decides which will be drawn
MenuButton.prototype.drawButton = function() {

    if (this.confirmed == true) {
        this.confirmedButton();
        
    } else if (this.isSelected() == false) {
        this.standardButton();
    } else 
    if (this.isSelected() == true) {
        this.selectedButton();

    }

}

//this function will return the relevant value based on the direction it is given
MenuButton.prototype.relevantValue = function(direction) {

    if (direction == 0 || direction == 2) {
        return this.y;
    } else if (direction == 1 || direction == 3) {
        return this.x;
    }


}

//this function will return the opposite relevant value based on the direction it is given
MenuButton.prototype.oppositeRelevantValue = function(direction) {
    if (direction == 0 || direction == 2) {
        return this.x;
    } else if (direction == 1 || direction == 3) {
        return this.y;
    }
}

//this function will control the fading in animation of all buttons
MenuButton.prototype.fadeIn = function(time) {
    this.opacity += (255/(time));
}

//this function will control the fading in animation of all buttons
MenuButton.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
}

//creating the object type smallltictac.
class TicTacBoard {
    /**
     * A constructor for the TicTacBoard
     * @param {*} gameManager
     * @param {*} tictac 
     * @param {*} x 
     * @param {*} y 
     * @param {*} gridSize 
     */
    constructor(gameManager,tictac,x,y,gridSize) {
        //Size and location
        this.gridSize = gridSize*BOARD_SHRINK_CONSTANT; 
        this.x = x - this.gridSize/2;
        this.y = y - this.gridSize /2;
        this.GRID_SIZE = tictac.GRID_SIZE;
        //These variables help with the line sizing.
        this.lineNum = this.GRID_SIZE - 1;
        // What section is selected by the player 
        // Coordinates of the cursor on the tictac
        this.cursorRow = 0;
        this.cursorCol = 0;
        //This represents what levelsize the selected tictac is
        this.selectedLevelSize = 1;
        //This represents the index of the selected tictac
        this.selectedTicTacIndex = 0;
        this.cursorOn = true; //Whether or not the cursor should be rendered.
        //we take the tictac as a pointer to the tictac this tictac is responsible for displaying
        this.game = gameManager;
        this.tictac = tictac;
        //This is the levelSize
        this.maxLevelSize = this.tictac.maxLevelSize;
        //This is the cache that holds all of the points in the tictac
        this.cache = Array.from({ length: (this.maxLevelSize + 1) }, () => []);;
        //Now we need to cache the points
        this.cachePoints();
    }

    /**
     * This method is intended to cache every single point of the tictac.
     */
    cachePoints() {
        for (let i = 0 ; i <= this.maxLevelSize ; i++) {
            let space = ((this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - i));
            for (let j = 0 ; j < this.tictac.getArraySize()/space ; j++) {
                //Set initial coordinates to watchamacallit
                let x = this.x;
                let y = this.y;
                //Iterate through all current levelsizes to get x and y coordinates
                for (let z = 0 ; z < i ; z++) {
                    let col =  this.getCol(z,j*space); //Get the relative column
                    let row = this.getRow(z,j*space); //Get the relative row
                    x += col*this.calculateSize(z+1) + col*this.calculateMarginSize(z+1) + this.calculateMarginSize(z+1)/2;
                    y += row*this.calculateSize(z+1) + row*this.calculateMarginSize(z+1) + this.calculateMarginSize(z+1)/2;
                }
                this.cache[i].push([x,y]);
            }
        }
    }

    /**
     * This method is responsible for rendering the tictac + the cursor on the tictac
     */
    draw() {
        //*The plan: one loop to draw tictacs and larger symbols
        //*Another loop to draw the smallest symbols
        //*This avoids a number of if checks
        //*The reason is for this is that only larger symbols use negative numbers to signal they should be drawn
        stroke(255);
        //Iterate for larger structures - larger that the smallest unit in the array
        for (let i = 0 ; i < this.maxLevelSize ; i++) {
            let space = ((this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - i)); //represents the number of slots to skip per iteration
                for (let j = 0 ; j < this.tictac.getArraySize()/space ; j++) {
                    let relevantSlot = this.tictac.getSlot(j*space);
                    if (relevantSlot*-1 == (this.maxLevelSize - i)) {
                        this.drawIcon(i,j*space + 1,j); //Draw Icon if negative and iterating at equivalent levelsize
                    } else if (relevantSlot*-1 > (this.maxLevelSize - i)) {
                        i += (this.GRID_SIZE*this.GRID_SIZE)**(-1*relevantSlot) - 1; //Skip to the next open spot
                    } else {
                        //Otherwise draw tictac
                        this.drawTicTac(i,j);
                    }
                }
        }
        //Iterate for smaller structures - the smallest unit in the array
        for (let i = 0 ; i < this.tictac.getArraySize() ; i++) {
            let relevantSlot = this.tictac.getSlot(i);
            //Check to see if the tictac has been finished
            if (relevantSlot < 0) {
                //Skip to the next open spot
                i += (this.GRID_SIZE*this.GRID_SIZE)**(-1*relevantSlot) - 1;
            } else {
                this.drawIcon(this.maxLevelSize,i,i); //Otherwise try an Icon
            }
        } 
        //Drawing the cursor
        if (this.cursorOn) {
            this.renderCursor();
        }
    }

    /**
     * Draws a tictac of any size
     * @param {*} levelSize - How deep in the Big TicTac we are
     * @param {*} cacheIndex - the index of the coordinates to draw the tictac
     */
    drawTicTac(levelSize,cacheIndex) {
        let size = this.calculateSize(levelSize);
        let x = this.cache[levelSize][cacheIndex][0];
        let y = this.cache[levelSize][cacheIndex][1];
        strokeWeight(1);
        for (let i = 0 ; i < this.lineNum ; i++) {
            line(x + (size/this.GRID_SIZE)*(i+1),y,x + (size/this.GRID_SIZE)*(i+1),y + size);
            line(x,y+(size/this.GRID_SIZE)*(i+1),x + size,y + (size/this.GRID_SIZE) * (i+1));
        }
    }

    drawIcon(levelSize, tictacIndex, cacheIndex) {
        //Get the size
        let size = this.calculateSize(levelSize);
        //Get the coordinates from the cache
        let x = this.cache[levelSize][cacheIndex][0];
        let y = this.cache[levelSize][cacheIndex][1];
        strokeWeight(1);
        let slot = this.tictac.getSlot(tictacIndex)
        switch (slot) {
            case 0:
                //Do nothing.
            break;
            case 1:
                //Draw an X
                stroke(255);
                line(x,y,x + size,y + size);
                line(x + size,y,x,y + size);
            break;
            case 2:
                //Draw an O
                stroke(255);
                ellipseMode(CENTER)
                ellipse(x + size/2,y + size/2,size*(SMALLEST_BOARD_PERCENT/100),size*(SMALLEST_BOARD_PERCENT/100));
            break;
            default:
                //Draw the number in the grid instead. (used in case of >2 players)
                textSize(size);
                textAlign(CENTER,CENTER);
                text(slot,x + size/2, y + size/2);
            break;
        }

    }
    
    /**
     * Given a levelSize, return the size of a tictac grid inside the big tictac
     * @param {*} levelSize 
     * @returns a float containing the size
     */
    calculateSize(levelSize) {
        return this.gridSize*((BOARD_SHRINK_CONSTANT/(this.GRID_SIZE))**(levelSize));
    }

    /**
     * Calculates the margin size between the edge of the an item grid and the tictac it is inside of.
     * @param {*} levelSize 
     * @returns margin size (float)
     */
    calculateMarginSize(levelSize) {
        return ((this.calculateSize(levelSize)/BOARD_SHRINK_CONSTANT) * (1 - BOARD_SHRINK_CONSTANT));
    }

    /**
     * This method is intended to return the column of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index 
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    getCol(levelSize,index) {
        return this.getRelativeIndex(levelSize,index) % this.GRID_SIZE;
    }

    /**
     * This method is intended to return the row of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index 
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    getRow(levelSize,index) {
        //The index needs to be reduced to a number out of nine.
        return Math.floor(this.getRelativeIndex(levelSize,index) / this.GRID_SIZE);
    }

    /**
     * This method returns the spot in the tictac we are looking for.
     * @param {*} levelSize 
     * @param {*} index 
     * @returns  returns a number between 0 - GRIDSIZE*GRIDSZE - 1
     */
    getRelativeIndex(levelSize,index) {
        //So the first thing to do is check the levelsize.
        //We do this to get the number of spots a single tictac of levelSize is supposed to envelop
        //Legend: Levelsize of 0 would represent the largest tictac, levelsize of say 1 would be smallest tictacs on a standard board
        //That means the total number of slots envoloped by one tictac of that size would be 
        let size = (this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - levelSize);
        //Now we need to find a multiple of size that is the closest value to index - where it must be below index by a max of size.
        let factor = Math.floor(index/size);
        //Now to get the tictac, it would be
        let range = index - factor*size;
        //Then we need to divide range by this.GRIDSIZE*this.GRIDSIZE, so that we can split it into that many and return a number from 
        let divisions = Math.floor((size)/(this.GRID_SIZE*this.GRID_SIZE));
        //Then we find how many times divisions fits into range
        return Math.floor(range/divisions);
    }

    /**
     * This method moves the cursor up
     */
    cursorUp() {
        if (this.cursorRow <= 0) {
            this.cursorRow = this.GRID_SIZE - 1;
        } else {
            this.cursorRow -= 1;
        }
    }

    /**
     * This method moves the cursor down
     */
    cursorDown() {
        if (this.cursorRow >= this.GRID_SIZE - 1) {
            this.cursorRow = 0;
        } else {
            this.cursorRow += 1;
        }
    }

    /**
     * This method moves the cursor left
     */
    cursorLeft() {
        if (this.cursorCol <= 0) {
            this.cursorCol = this.GRID_SIZE - 1;
        } else {
            this.cursorCol -= 1;
        }
    }
    
    /**
     * This method moves the cursor right
     */
    cursorRight() {
        if (this.cursorCol >= this.GRID_SIZE - 1) {
            this.cursorCol = 0;
        } else {
            this.cursorCol += 1;
        }
    }

    /**
     * This method requests a change to be made to the board
     * @param {T} row 
     * @param {*} col 
     */
    playMove(row,col) {
    
        //This method must be called assuming that the player is on the right tile
        //You can only really play anything if the board you have clicked on is equal to zero or a tictac.
            if (this.board[this.cursorRow][this.cursorCol] == 0) {
                this.game.updateSlot(this.tictac,this.cursorRow,this.cursorCol);
            } else if (this.board[this.cursorRow][this.cursorCol] instanceof TicTacBoard) {
                //All that needs to be done is set the tictac to selected
                // Any tictac that is won will be overwritten with the winner of said tictac
                // Any tictac that is tied/full will be refused in the setSelected method.
                this.setSelected();
                this.board[this.cursorRow][this.cursorCol].setSelected();
                this.selectedBoard = this.board[this.cursorRow][this.cursorCol];
            }
    }
    
    /**
     * This method renders the cursor on the tictac
     */
    renderCursor() {
            rectMode(CORNER);
            noFill();
            strokeWeight(5);
            rect(this.cache[this.selectedLevelSize][this.selectedTicTacIndex + this.cursorRow*this.GRID_SIZE + this.cursorCol][0],
                this.cache[this.selectedLevelSize][this.selectedTicTacIndex + this.cursorRow*this.GRID_SIZE + this.cursorCol][1],
                this.calculateSize(this.selectedLevelSize),
                this.calculateSize(this.selectedLevelSize));
    }

    /**
     * This method is responsible for selecting the tictac.
     */
    selectTicTac() {
        if (this.selectedLevelSize == this.maxLevelSize) {
            this.playMove();
        } else {
            this.selectedLevelSize++;
        }
        
        this.cursorCol = 0;
        this.cursorRow = 0;
    }

    /**
     * This method is responsible for deleselecting the tictac
     */
    deselectTicTac() {
        this.selectedLevelSize--;
        // if (this.selectedLevelSize == 0) {
            
        // }
        this.cursorCol = 0;
        this.cursorRow = 0;
    }
}


