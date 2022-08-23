//this file is meant to hold a class that will be responsible for the drawing of the different screens in the game.

//declaring the gui object type.
function gui() {
    //This integer is meant to control what screen is being displayed and when.
    this.menuNumber = 0;

    //this integer controls the transparency of the text
    this.alpha = 0;
    this.addingalpha = true;

    //these integers are always zero unless there is a transition
    this.x = 0;
    this.y = 0;

    //these integers are used to input the x value for the sin function
    this.s = 0;

    //these booleans control transitions
    this.transition = false;   
    this.screen = false;

}

//This method will draw the screen depending on what the menu number is equal to.
gui.prototype.drawScreen = function() {
        //drawing the proper screen that the game should be on
        switch(this.menuNumber) {
            case 0:
                this.startScreen();
                break;
            case 1:
                this.gameScreen();
                break
            default:
                throw "This screen does not exist";
        }

}

//This method is for the startscreen.
gui.prototype.startScreen = function() {
    

    
    background(0);

    //printing a title
    textSize(height*0.07);
    fill(255);
    textAlign(CENTER,CENTER)
    textFont(fontPointless);
    text("Ultimate TicTacToe",width/2 + this.x, height/5 + this.y);

    //printing the author
    fill(127);
    textAlign(CENTER,CENTER)
    textFont(fontAldoApache);
    textSize(height*0.05);
    text("Made by John Khalife",width/2 + this.x, height/10*3 + this.y);

    if (keyIsPressed == true && this.transition == false) {
        this.transition = true;
        
    }

    //this is the part that draws the starttext that flashes in and out. 
    //It also contains an animation that makes the function flash a few times quickly when the start key is pressed
    
    //this text flies in and out of transparency
    textFont(fontSquareo);
    changingAlpha = color(200,200,200);


    if (this.transition) {
        // KEEP THIS IN MIND: THERE ARE TRIG FUNCTIONS 
        //NOTE #2: MILLIS() RETURNS MILLISECONDS PASSED SINCE START AND IS USEFUL FOR ANIMATIONS
        //set setalpha modifies alpha channel
        angleMode(RADIANS)
        changingAlpha.setAlpha(128 + 128 * sin(millis() / 50));
        print(this.y)
        print(height)
        this.y = height*sin((this.s+(100*asin(3/4) + 200*PI))/100) - height/4*3 
        this.s++;
    } else {
        // KEEP THIS IN MIND: THERE ARE TRIG FUNCTIONS 
        //NOTE #2: MILLIS() RETURNS MILLISECONDS PASSED SINCE START AND IS USEFUL FOR ANIMATIONS
        //set setalpha modifies alpha channel
        changingAlpha.setAlpha(128 + 128 * sin(millis() / 500));
    }

    fill(changingAlpha);
    textAlign(CENTER,CENTER);
    textSize(height*0.05);
    text("Press Space to Start",width/2 + this.x, height/2 + this.y);

    if (this.y < height*-1) {
            this.menuNumber++;
            this.y = 0;
   
    }
}

gui.prototype.gameScreen = function() {
    background(255)
}







