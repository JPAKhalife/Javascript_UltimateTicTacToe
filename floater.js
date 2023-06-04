//this file is meant to hold a class that controls the bouncers on the start screen

const { prototype } = require("../../../.vscode/extensions/samplavigne.p5-vscode-1.2.11/p5types");


//declaring the floater object type
function bouncer(image,width,length) {
    this.x = 0
    this.y = 0
    this.a = 0
    this.vx = 1;
    this.vy = 1;
    this.s = 1;
    this.image = image
    //copy of the current image that will be manipulated.
    this.current_image = this.image.copy();
    this.width = width;
    this.length = length;

    

}

//this is meant to reset the floater's values
prototype.bouncer.reset = function() {

    

}

//This method is meant to draw the floater
bouncer.prototype.draw = function() {
    image(whiteTicTac,this.x, this.y, this.width, this.length);
}

//This method is meant to check if the object is going off the canvas
bouncer.prototype.doBounce = function() {

}

//this method is used to bouce the object
bouncer.prototype.bounce = function() {

}
