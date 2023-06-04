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
    this.t = 0;

    //This integer counts the spin of the tictac
    this.spin = 0;

    //This is an object for calling buttons
    this.drawbutton = new menu_button();

    //these booleans control transitions
    this.transition_out = false;   
    this.transition_in = false;
    this.screen = false;

    //This variable is intended to hold the messages displayed in the loading screen 
    this.loadingMessage = ["Check out this cool loading screen lol.", "To win, you have to get good.", "Ultimate Tictactoe is better than TicTacToe", "Don't forget to touch grass every once in a while.", "Fun Fact: This font doesn't have colons.", "Having trouble? Skill issue.","Help, I can't think of loading messages.","I should probably put some actually helpful tips here.","Try to direct your opponent to a square where they can't do anything.", "Sometimes, you can force your opponent to send you to an advantageous square.", "Try to place your pieces such that there are multiple ways you can score a point."]

    //This varuable holds the various messages for the title of the loading screen
    this.titleMessage = ["Seaching for players","Loading"]

    this.dots = ["",".","..","..."]

    //variable that controls the mssage displayed
    this.displayedMessage = getRandomInt(0,this.loadingMessage.length - 1);

    //this variable controls how much time has elapsed
    this.timepassed = round(millis());
}

//This method will draw the screen depending on what the menu number is equal to.
gui.prototype.drawScreen = function() {
        //drawing the proper screen that the game should be on
        switch(this.menuNumber) {
            case 0:
                this.setupScreen();
                break;
            case 1:
                this.setupScreen();
                break
            case 2:
                this.spin = 0;
                this.gameScreen();
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
        // KEEP THIS IN MIND: TRIG FUNCTIONS EXIST
        //NOTE #2: MILLIS() RETURNS MILLISECONDS PASSED SINCE START AND IS USEFUL FOR ANIMATIONS
        //set setalpha modifies alpha channel
        angleMode(RADIANS)
        changingAlpha.setAlpha(128 * sin(millis() / 50));
        this.y = height*sin((this.s+(100*asin(3/4) + 200*PI))/100) - height/4*3 
        this.s+=2;

        if (this.y < height*-1) {
            this.menuNumber++;
            this.y = 0;
            this.transition = false;
            this.timepassed = round(millis());
   
    }

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



}

//This method is meant to load the loading screen
gui.prototype.loadingScreen = function() {
    background(0)

    if (this.transition == true) {
        this.spin = 0;
        this.s = 0;
    } else {
        if(round(millis())/1000 - this.timepassed/1000 >= 5) {
            this.timepassed = round(millis( ));
            
            this.displayedMessage++; 

            if (this.displayedMessage == this.loadingMessage.length) {
                this.displayedMessage = 0;
            }


        }

        push();
        imageMode(CENTER);
        angleMode(RADIANS);
        frameRate(60)
        translate((width / 5)*4, (height / 5)*4);
        rotate(this.spin += ( ((6*PI) / (300+(150/PI)))*cos(((1/150)*PI)*(150+this.s)) + ((6*PI) / (300+(150/PI)))));
        tint(255, 255*cos(((1/150)*PI)*(150+this.s)) + 255);
        // rotate(this.spin += 0.06);
        // tint(255, 255*cos((1/75)*PI*this.s) + 255);
        image(whiteTicTac,0,0,width*height*0.0001,width*height*0.0001);
        pop();
        rectMode(CENTER);
        fill(255);
        textAlign(CENTER,CENTER);
        textFont(fontminecraft);
        textSize(width*height*0.00002)
        text(this.loadingMessage[this.displayedMessage],width/2,height/2,width*height*0.001,width*height*0.0001);
        textSize(width*height*0.00004)
        textFont(fontRobot);
        text(this.titleMessage[0] + this.dots[this.t],width/2,height/4,width*height*0.001,width*height*0.0001);
        this.s++;
        if (this.s % 60 == 0) {
            this.t++;
            if (this.t == 4) {
                this.t = 0
            }
        } 




}
}

//This method is meant to load the game setup screen
gui.prototype.setupScreen = function() {
    background(0);

    this.drawbutton.standard_button(width/2, height / 2, "Test");


}

//This method is meant to load tha game screen
gui.prototype.offlineGameScreen = function() {
    background(255);
}

//This method is meant to load the game screen for online games
gui.prototype.onlineGameScreen = function() {
    background(255);
}










