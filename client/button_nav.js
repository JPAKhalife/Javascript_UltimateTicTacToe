/**
 *  This file is intended to create button functionality in ultimate tic tact toe
 *  This game is can only be interacted with through arrows and keys on the keyboard, so this class is intented to create an array of buttons to be able to find the closest button to switch to.
 *  
 * 
 * 
 * 
 * 
 */

//this is the constructor function
function button_nav(button_array) {

//this is the array of buttons
this.button_array = button_array;



//currently selected button
this.currently_selected = button_array[0];
this.currently_selected.setStatus(true);

}

//this method is intended to draw all of the buttons
button_nav.prototype.drawAll = function() {
    for (i = 0 ; i < this.button_array.length ; i ++) {
        this.button_array[i].draw_button();
    }
}

//this function fades all the other buttons
button_nav.prototype.fadeAll = function () {
    for (i = 0 ; i < this.button_array ; i++) {
        
    }
}

//this function is responsible for reseting the buttons
button_nav.prototype.reset = function () {



    for (i = 0 ; i < this.button_array.length ; i++) {
        this.button_array[i].reset();
    }

    this.currently_selected = this.button_array[0];
    this.currently_selected.setStatus(true);
}


//this function is meant to confriemd a button
button_nav.prototype.confirm = function() {

    this.currently_selected.confirmed = true;

}




//this will find the closest button given a direction
button_nav.prototype.findClosest = function(direction) {

    //used to factor in the direction of the 
    direction_multiplier = 1;

    //initial value for comparison
    closestButton = 0;
    foundwithin = false;

    //getting the direction multiplier
    if (direction == 2 || direction == 3) {
        direction_multiplier = -1;
    }


    //first screening
    in_range = [];

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
button_nav.prototype.selectClosest = function(button,direction) {
    closest = this.findClosest(button,direction)
    if (this.button_array[closest] != this.currently_selected) {
        this.button_array[closest].setStatus(true);
        this.currently_selected.setStatus(false);
        this.currently_selected = this.button_array[closest];
    }

}

button_nav.prototype.select = function(button) {
    this.button_array[button].setStatus(true);
}

button_nav.prototype.unselect = function(button) {
    this.button_array[button].setStatus(false);
}

button_nav.prototype.changeSelected = function(button) {
    unselect(this.button_array.indexOf(this.currently_selected));
    this.currently_selected = this.button_array[button];
    select(button);
}