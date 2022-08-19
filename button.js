//This fule is meant to hold a class that creates buttons


//declaring the button object type.
function button(x = 0, y = 0, width = 100, length = 100, colour = color(0,0,0),doText = true ,text = "button", radius = 0, textColour = color(255,255,255),
font = 'Georgia', doHoverColour = true, hoverColour = color(255,255,255), hoverTextColour = color(0,0,0), doSelected = false, selectedColour = color(255,255,255), selectedTextColour = color(0,0,0), doStroke = false, strokeColour = color(0,0,0),
doHoverStrokeColour = false,hoverStrokeColour = color(0,0,0), doSelectedStrokeColour = false, selectedStrokeColour = color(0,0,0), strokeWeight = 1, doFill = true, selected = false,
 onClick = function() {return true;} ) {
    //variables for the coordinates and size of the button.
    this.x = x;
    this.y = y;
    this.width = width;
    this.length = length;
    //variables for the colour of the button, text, and what they look like when selected.
    this.colour = colour;
    this.selectedColour = selectedColour;
    this.textColour = textColour;
    this.selectedTextColour = selectedTextColour;
    this.doSelected = doSelected;
    this.doHoverColour = doHoverColour;
    this.hoverColour = hoverColour;
    this.hoverTextColour = hoverTextColour;
    this.doHoverStrokeColour = doHoverStrokeColour;
    this.hoverStrokeColour = hoverStrokeColour;
    this.doSelectedStrokeColour = doSelectedStrokeColour;
    this.selectedStrokeColour = selectedStrokeColour;
    // variables for the text.
    this.doText = doText;
    this.text = text;
    this.font = font;
    //variable that controls how round the corners of the rectangle will be.
    this.radius = radius;
    //variable that controls whether or not the button will have a border.
    this.doStroke = doStroke;
    this.strokeColour = strokeColour;
    this.strokeWeight = strokeWeight;
    //variable that controls whether or not the button will have a fill.
    this.doFill = doFill;
    button.prototype.onClick = onClick

    //vatiable that holds whether or not the button has been selected
    this.selected = selected;

}

//This method ismeant to draw the button
button.prototype.draw = function() {
    this.drawrect();
    this.drawtext();


}

//this method is meant to draw the rectangle
button.prototype.drawrect = function() {
        //setting the fill if there is one.
        if (this.doFill) {
            if (this.isHovering() && this.doHoverColour == true) {
                fill(this.hoverColour);
            } else if (this.selected && this.doSelected == true) {
                fill(this.selectedColour);
            } else {
                fill(this.colour);
            }
        } else {
            noFill();
        }
    
        //setting the strole if there is one.
        if (this.doStroke) {
            strokeWeight(this.strokeWeight);
            if (this.isHovering() && this.doHoverStrokeColour == true) {
                stroke(this.hoverStrokeColour);
            } else if (this.selected && this.doSelectedStrokeColour == true) {
                stroke(this.selectedStrokeColour);
            } else {
                stroke(this.strokeColour);
            }

        } else {
            noStroke();
        }

    
        //drawing the rectangle
        rect(this.x, this.y, this.width, this.length, this.radius);
}

//this method is meant to draw the text that is inside of the rextangle.
button.prototype.drawtext = function() {


        //checking if dotext is enabled
        if (this.doText) {
            // setting the text size and font
            textFont(this.font);
            textSize((this.length*this.width)*0.001);
            textAlign(CENTER,CENTER)
            //Checking what the right colour will be depending in if the button is clicked or hovered on
            if (this.isHovering() && this.doHoverColour == true) {
                fill(this.hoverTextColour);
            } else if (this.selected && this.doSelected == true) {
                fill(this.selectedTextColour);
            } else {
                fill(this.textColour);
            }


            text(this.text, this.x + this.width/2 , this.y + this.length/2);
        } else {

        }

    

}

//This method is meant to check whether or not the button has been clicked
button.prototype.isClicked = function() {
    if (mouseIsPressed() && mouseX >= this.x && mouseX <= (this.x + this.width) && mouseY >= this.y && mouseY <= (this.y + this.length)) {
        if (this.doSelected == true || this.doSelectedStrokeColour == true) {
            this.selected = true;
        }    
        this.onClick();
    } else {
    }
}

//This method is meant to detect if the mouse is hovering over the button
button.prototype.isHovering = function() {
    if (mouseX >= this.x && mouseX <= (this.x + this.width) && mouseY >= this.y && mouseY <= (this.y + this.length)) {
        return true;
    } else {
        return false;
    }

}

