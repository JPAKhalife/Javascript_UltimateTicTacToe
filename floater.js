//this file is meant to hold a class that controls the bouncers on the start screen



//declaring the floater object type
function floater(image,width,length) {
    //these are the current x and y coordinates
    this.x = 0;
    this.y = 0;

    //these are the current x and y velocity 
    this.vx = 0;
    this.vy = 0;

    //this controls the spin speed of the bouncer
    this.s = 0;

    //this controls the velocity of the spin.
    this.sv = 0;

    //this controls the opacity of the floater
    this.opacity = 0;

    //this is the image that the bouncer wil display
    this.image = image

    this.width = width;
    this.length = length;

    

}

//this function is intended to assign the bouncer a bunch of random values
floater.prototype.start = function() {
    //random x and y
    this.x = this.random_Coord();
    this.y = this.random_Coord();
    //random velocityies
    this.vx = this.random_Velocity();
    this.vy = this.random_Velocity();
    this.sv = this.random_Velocity();



    
}

//this is meant to reset the floater's values
floater.prototype.reset = function() {
    this.opacity = 0;

    

}

//This method is meant to draw the floater
floater.prototype.draw = function() {
    tint(100,this.opacity);
    angleMode(DEGREES);
    imageMode(CENTER);

    push()
        
        translate(this.x,this.y);
        rotate(this.s);
        image(whiteTicTac,0, 0, this.width, this.length);
        
    pop();

        this.s += this.sv;


    this.y += this.vy;
    this.x += this.vx;

    if (this.doBounce()) {
        this.bounce();
    }
}

//This method is meant to check if the object is going off the canvas
floater.prototype.doBounce = function() {

    if (this.x + this.width/2 > getCanvasSize() || this.x - this.width/2 < 0 || this.y + this.length/2 > getCanvasSize() || this.y - this.length/2 < 0) {
        return true;
    }



}

//this method is used to bouce the object
floater.prototype.bounce = function() {
    if (this.x + this.width/2 > getCanvasSize() || this.x - this.width/2 < 0) {
        this.vx = this.vx*-1;
    }

    if (this.y + this.length/2 > getCanvasSize() || this.y - this.length/2 < 0) {
        this.vy = this.vy*-1;
    }
    
    
    this.sv = this.sv*-1;

}

//this method is used to change the opacity
floater.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
}

//thi method will be used to fade in 
floater.prototype.fade_in = function(time) {
    this.opacity += 255/time;

}

//this function gives a random coord within the screen.
floater.prototype.random_Coord = function() {
    return random(0 + this.width/2,getCanvasSize() - this.width/2);

}

//this function will return a random velocity
floater.prototype.random_Velocity = function() {
    return random(-2,2);
}

//this function will fade out the floaters
floater.prototype.fade_out = function(time) {
    this.opacity -= 255/time;
}
