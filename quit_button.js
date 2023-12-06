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

function quit_button(x,y,phrase) {

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
quit_button.prototype.draw = function() {

    //this will check if the button is being hovered over or not
    if (this.selected) {


    } else {


    }

        

}

//this is a mtehtod that sets the opacity of the button
quit_button.prototype.set_opacity = function(opacity) {
    this.opacity = opacity;
}

//This method sets the selected status of the button
quit_button.prototype.setStatus = function(status) {
    this.selected = status;
}

//this is responsible for drawing the default appearance
quit_button.prototype.draw_default = function() {

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
quit_button.prototype.draw_hovered = function() {

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

