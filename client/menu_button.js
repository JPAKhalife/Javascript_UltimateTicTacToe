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
function menu_button(x,y,phrase,length,width,textsize,buttoncode) {

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
    this.opacity = 255;


    //contains the status of the confirmed animation
    this.confirmed_animation = false;

    //a code to identify the button and execute functions based on the button's identity
    this.buttoncode = buttoncode;
 

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

