/**
 *  This file is intended to create button functionality in ultimate tic tact toe
 *  This game is can only be interacted with through arrows and keys on the keyboard, so the button designs and 
 *  interactions reflect this
 * 
 * 
 * 
 * 
 */


// This is the initializor
function menu_button() {
    this.selected = false;
    


}

menu_button.prototype.standard_button = function(x,y,phrase) {

    stroke(255);
    fill(0);
    rectMode(CENTER);
    rect(x, y,100,25);
    textSize(12);
    fill(255);
    noStroke()
    textAlign(CENTER,CENTER);
    text(phrase,x, y,100,25);    
    
}
