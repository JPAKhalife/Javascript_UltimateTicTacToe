

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
        this.current_width -= ((this.width) * (GROWTH_PERCENT / 100)) / SELECTED_ANIMATION_TIME;
        this.current_length -= ((this.length) * (GROWTH_PERCENT / 100)) / SELECTED_ANIMATION_TIME;

        //changing the button fill to the desired fill
        this.current_button_fill -= (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / SELECTED_ANIMATION_TIME;
        this.current_text_fill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / SELECTED_ANIMATION_TIME;

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
    if (this.animation_time > SELECTED_ANIMATION_TIME) {

    } else {

        //adding to the length and width
        this.current_width += ((this.width) * (GROWTH_PERCENT / 100)) / SELECTED_ANIMATION_TIME;
        this.current_length += ((this.length) * (GROWTH_PERCENT / 100)) / SELECTED_ANIMATION_TIME;

        //changing the button fill to the desired fill
        this.current_button_fill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / SELECTED_ANIMATION_TIME;
        this.current_text_fill -= (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / SELECTED_ANIMATION_TIME;
    

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
    if (this.animation_time > CONFIRMED_ANIMATION_TIME) {
        this.opacity = 0;
        this.confirmed_animation = true;

    } else {
        
        this.cl += ((CONFIRMED_GROWTH_PERCENT / 100) * (this.current_length * getCanvasSize()) + (this.current_length * getCanvasSize())) / CONFIRMED_ANIMATION_TIME;
        this.cw += ((CONFIRMED_GROWTH_PERCENT / 100) * (this.current_width * getCanvasSize()) + (this.current_width * getCanvasSize())) / CONFIRMED_ANIMATION_TIME;
        this.current_text_fill += (SELECTED_BUTTON_SHADE - DEFAULT_BUTTON_SHADE) / CONFIRMED_ANIMATION_TIME;
        this.opacity -= (255/CONFIRMED_ANIMATION_TIME)
    

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

    this.opacity -= (255/(CONFIRMED_ANIMATION_TIME/4));
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

