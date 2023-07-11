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

    //this will controll how long between each delay input idk what I just said
    this.inputdelay = 0;

    //This integer counts the spin of the tictac
    this.spin = 0;

    //This is an object for calling buttons

    


    this.multiplayer_menu_button_list = new button_nav([new menu_button(0.20, 0.85, "Controls",0.05,0.15,50*0.25), new menu_button(0.80,0.85, "How to play",0.05,0.15,50*0.25), new menu_button(0.5,0.4,"Local",0.1,0.1,50*0.25),new menu_button(0.5, 0.6 , "Online",0.1,0.1,50*0.25)]); 
   
   
    //PUTTING THIS HEre to make all sapes have their centers as cooridnate
    rectMode(CENTER);


    //these booleans control transitions
    this.transition_out = false;   
    this.transition_in = false;
    this.transition_timer = 0;
    this.screen = false;

    //This variable is intended to hold the messages displayed in the loading screen 
    this.loadingMessage = ["Check out this cool loading screen lol.", "To win, you have to get good.", "Ultimate Tictactoe is better than TicTacToe", "Don't forget to touch grass every once in a while.", "Fun Fact: This font doesn't have colons.", "Having trouble? Skill issue.","Help, I can't think of loading messages.","I should probably put some actually helpful tips here.","Try to direct your opponent to a square where they can't do anything.", "Sometimes, you can force your opponent to send you to an advantageous square.", "Try to place your pieces such that there are multiple ways you can score a point."]

    //This varuable holds the various messages for the title of the loading screen
    this.titleMessage = ["Seaching for players","Preparing Game"]

    this.dots = ["",".","..","..."]

    //variable that controls the mssage displayed
    this.displayedMessage = getRandomInt(0,this.loadingMessage.length - 1);

    //this variable controls how much time has elapsed
    this.timepassed = round(millis());

    //this is the object that will hold the game
    this.currentgame = new game();

    //this will be a temprorary bigtictac for drawing
    this.bigtic = new bigtictac();

    //these are variables for the setting screen
    this.border_pos = -STROKEWEIGHT;

}

//This method will draw the screen depending on what the menu number is equal to.
gui.prototype.drawScreen = function() {
        //drawing the proper screen that the game should be on
        switch(this.menuNumber) {
            case 0:
                this.startScreen();
                break;
            case 1:
                this.setupScreen();
                break;
            case 2:
                this.onlineLoadingScreen();
                break;
            case 3:
                this.offlineGameScreen();
                //this.offlineLoadingScreen();
                break;
            case 4:
                this.onlineGameScreen();
                break;
            case 5:
                this.offlineGameScreen();
                break;
            case 6:
                this.tutorialScreen_one();
                break;
            case 7:
                this.tutorialScreen_two();
                break;
            case 8:
                this.tutorialScreen_three();
                break;
            case 9:
                this.controlScreen_navigate();
                break;
            case 10:
                this.controlScreen_select();
                break;
            default:
                throw "This screen does not exist";
        }

}

//this method is for the control screen
gui.prototype.controlScreen_navigate = function() {


//what to do during the animation transition in
if (this.transition_in) {
    this.opacity += 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity >= 255) {
        this.transition_in = false;
    }
}



//what to do for the animation for the transition out
if (this.transition_out) {
    this.opacity -= 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity <= 0) {
        this.transition_out = false;
        this.menuNumber++;
        this.transition_in = true;
    }
}

//controls for this menu (just space

if (this.transition_in == false && this.transition_out == false) {

    


    

        //space
        if (keyIsPressed && keyCode == 32) {
            this.transition_out = true;

        }

        
    
}

    background(0);
    tint(255,this.opacity);
    rectMode(CENTER);
    imageMode(CENTER);
    image(arrows, getCanvasSize()*0.25,getCanvasSize()/2,150,100);
    image(wasd, getCanvasSize()/4*3, getCanvasSize()/2,150,100 );
    textFont(fontOSDMONO);
    textSize(getCanvasSize()*0.02);
    fill(255,255,255,this.opacity);
    text('Use the WASD and/or Arrow keys to navigate through menus and the Ultimate Tictactoe grid.',getCanvasSize()/2, getCanvasSize()/5*2,getCanvasSize()/4*3,getCanvasSize()/4*1);
    text('Press space to continue',getCanvasSize()/2 , getCanvasSize()/4*2,getCanvasSize()/4*3,getCanvasSize()/4*3);

}

//this method is for the control screen
gui.prototype.controlScreen_select = function() {
    background(0);

    //what to do during the animation transition in
if (this.transition_in) {
    this.opacity += 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity >= 255) {
        this.transition_in = false;
    }
}


//what to do for the animation for the transition out
if (this.transition_out) {
    this.opacity -= 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity <= 0) {
        this.transition_out = false;
        this.menuNumber = 1;


        this.multiplayer_menu_button_list.reset();
        for (i = 0 ; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
            this.multiplayer_menu_button_list.button_array[i].set_opacity(0);

        }

        this.border_pos = -STROKEWEIGHT;
        

        this.transition_in = true;
    }
}

//controls for this menu (just space

if (this.transition_in == false && this.transition_out == false) {

    


        //space
        if (keyIsPressed && keyCode == 32) {
            this.transition_out = true;

        }

        
    
}
    tint(255,this.opacity);
    rectMode(CENTER);
    imageMode(CENTER);
    image(space,getCanvasSize()/2,getCanvasSize()/2,150,100);
    fill(255);
    textFont(fontOSDMONO);
    textSize(getCanvasSize()*0.02);
    fill(255,255,255,this.opacity);
    text('Press space to select in the menus or play a spot on the Ultimate Tictactoe Grid.',getCanvasSize()/2, getCanvasSize()/5*2,getCanvasSize()/4*3,getCanvasSize()/4*2);
    text('Press space to continue',getCanvasSize()/2, getCanvasSize()/5*3,getCanvasSize()/4*3,getCanvasSize()/4*3);




}

//this method is for the tutorial screen. this particular aspect will show the board and provide the objective.
gui.prototype.tutorialScreen_one = function () {
    background(0);

    //what to do during the animation transition in
if (this.transition_in) {
    this.opacity += 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity >= 255) {
        this.transition_in = false;
    }
}



//what to do for the animation for the transition out
if (this.transition_out) {
    this.opacity -= 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity <= 0) {
        this.transition_out = false;
        this.menuNumber++;
        this.transition_in = true;
    }
}

//controls for this menu (just space

if (this.transition_in == false && this.transition_out == false) {

    


    

        //space
        if (keyIsPressed && keyCode == 32) {
            this.transition_out = true;

        }

        
    
}



imageMode(CENTER);
rectMode(CENTER);
tint(255,this.opacity);
image(tictacboard,getCanvasSize()/2,getCanvasSize()/2,100,100);
//this is the messages to teach the player

textFont(fontOSDMONO);
textSize(getCanvasSize()*0.02);
fill(255,255,255,this.opacity);
text("The Bigtictactoe board consists of one large tictactoe grid.",getCanvasSize()/2,getCanvasSize()/5);
text("Each slot in the grid contains one smaller tictactoe grid.",getCanvasSize()/2,getCanvasSize()/5*2);
text("The goal of the game is to get three points in a row on the large board.",getCanvasSize()/2,getCanvasSize()/5*3);
text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4);


}

//this method is for the tutorial screen. this particular aspect will show the board and provide the objective.
gui.prototype.tutorialScreen_two = function () {
    background(0);

    //what to do during the animation transition in
if (this.transition_in) {
    this.opacity += 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity >= 255) {
        this.transition_in = false;
    }
}



//what to do for the animation for the transition out
if (this.transition_out) {
    this.opacity -= 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity <= 0) {
        this.transition_out = false;
        this.menuNumber++;
        this.transition_in = true;
    }
}

//controls for this menu (just space

if (this.transition_in == false && this.transition_out == false) {

    


    

        //space
        if (keyIsPressed && keyCode == 32) {
            this.transition_out = true;

        }

        
    
}

//this is the messages to teach the player
textFont(fontOSDMONO);
textSize(getCanvasSize()*0.02);
fill(255,255,255,this.opacity);
text("To start, player one can choose anyone of the small grids to play in.",getCanvasSize()/2,getCanvasSize()/5);
text("They are then able to mark anywhere in that small grid.",getCanvasSize()/2,getCanvasSize()/5*2);
text("The next player will then be sent to the corresponding area on the large grid.",getCanvasSize()/2,getCanvasSize()/5*3);
text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4);


}

//this method is for the tutorial screen. this particular aspect will show the board and provide the objective.
gui.prototype.tutorialScreen_three = function () {
    background(0);

    //what to do during the animation transition in
if (this.transition_in) {
    this.opacity += 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity >= 255) {
        this.transition_in = false;
    }
}



//what to do for the animation for the transition out
if (this.transition_out) {
    this.opacity -= 255/CONTROL_TUTORIAL_ANIMATION_TIME;
    if (this.opacity <= 0) {
        this.transition_out = false;
        this.menuNumber = 1;


        this.multiplayer_menu_button_list.reset();
        for (i = 0 ; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
            this.multiplayer_menu_button_list.button_array[i].set_opacity(0);

        }

        this.border_pos = -STROKEWEIGHT;
        

        this.transition_in = true;
    }
}

//controls for this menu (just space

if (this.transition_in == false && this.transition_out == false) {

    


    

        //space
        if (keyIsPressed && keyCode == 32) {
            this.transition_out = true;

        }

        
    
}
textFont(fontOSDMONO);
textSize(getCanvasSize()*0.02);
fill(255,255,255,this.opacity);
//this is the messages to teach the player
text("The player can then choose any grid to play in if the grid they are sent to is taken.",getCanvasSize()/2,getCanvasSize()/5);
text("When a small grid is won, it becomes unable to be played in.",getCanvasSize()/2,getCanvasSize()/5*2);
text("That is everything! Have Fun!",getCanvasSize()/2,getCanvasSize()/5*3)
text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4);



}


//This method is for the startscreen.
gui.prototype.startScreen = function() {
    

    
    background(0);

    //printing a title
    textSize(getCanvasSize()*0.05);
    fill(255);
    textAlign(CENTER,CENTER)
    textFont(fontPointless);
    text(START_SCREEN_TITLE,width/2 + this.x, height/5 + this.y);

    //printing the author
    fill(127);
    textAlign(CENTER,CENTER)
    textFont(fontAldoApache);
    textSize(getCanvasSize()*0.05);
    text(START_SCREEN_AUTHOR,width/2 + this.x, height/10*3 + this.y);

    if (keyIsPressed && keyCode == 32 && this.transition_out == false && this.transition_in == false) {
        this.transition_out = true;
        
    }

    //this is the part that draws the starttext that flashes in and out. 
    //It also contains an animation that makes the function flash a few times quickly when the start key is pressed
    
    //this text flies in and out of transparency
    textFont(fontSquareo);
    changingAlpha = color(200,200,200);


    if (this.transition_out) {
        // KEEP THIS IN MIND: TRIG FUNCTIONS EXIST
        //NOTE #2: MILLIS() RETURNS MILLISECONDS PASSED SINCE START AND IS USEFUL FOR ANIMATIONS
        //set setalpha modifies alpha channel
        angleMode(RADIANS)
        changingAlpha.setAlpha(128 * sin(millis() / 50));
        this.y = height*sin((this.s+(100*asin(3/4) + 200*PI))/100) - height/4*3 
        this.s+=2;

        if (this.y < height*-1) {

            for (let i = 0 ; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
                this.multiplayer_menu_button_list.button_array[i].set_opacity(0);

            }

            this.menuNumber++;
            this.y = 0;
            this.transition_out = false;
            this.transition_in = true;
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
    textSize(getCanvasSize()*0.05);
    text(START_SCREEN_MESSAGE,width/2 + this.x, height/2 + this.y);



}

//This method is meant to load the loading screen online
gui.prototype.onlineLoadingScreen = function() {
    background(0)
    fill(255,255,255,255);

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
        image(whiteTicTac,0,0,getCanvasSize()*0.15,getCanvasSize()*0.15);
        pop();
        fill(255);
        textAlign(CENTER,CENTER);
        textFont(fontminecraft);
        textSize(getCanvasSize()*(0.03))
        text(this.loadingMessage[this.displayedMessage],width/2,height/2,width/4*3,height/4*3);
        textSize(getCanvasSize()*0.07)
        textFont(fontRobot);
        text(this.titleMessage[0] + this.dots[this.t],width/2,height/5);
        this.s++;
        if (this.s % 60 == 0) {
            this.t++;
            if (this.t == 4) {
                this.t = 0
            }
        } 




}
}

//This method is meant to load the loading screen online
gui.prototype.offlineLoadingScreen = function() {
    background(0)
    fill(255,255,255,255);

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
        image(whiteTicTac,0,0,getCanvasSize()*0.15,getCanvasSize()*0.15);
        pop();
        fill(255);
        textAlign(CENTER,CENTER);
        textFont(fontminecraft);
        textSize(getCanvasSize()*(0.03))
        text(this.loadingMessage[this.displayedMessage],width/2,height/2,width/4*3,height/4*3);
        textSize(getCanvasSize()*0.07)
        textFont(fontRobot);
        text(this.titleMessage[1] + this.dots[this.t],width/2,height/5);
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

    //this cnotrols the transition in animation
    if (this.transition_in) {


        

        if (this.border_pos >= STROKEWEIGHT/2) {
            for (i = 0 ; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
                if (this.multiplayer_menu_button_list.button_array[i].opacity >= 255) {
                    this.transition_in = false;
                }
                
                this.multiplayer_menu_button_list.button_array[i].fade_in(SETUP_SCREEN_ANIMATION_TIME/3*2);

            }




        } else {
            this.border_pos += (STROKEWEIGHT*1.5 )/(SETUP_SCREEN_ANIMATION_TIME/3)
        }

    }
    
    //draging a rectangle with thick stroke in order to add a border to the screen
    if (this.transition_in) {
        fill(255);
    } else {
        fill(255,255,255,this.multiplayer_menu_button_list.button_array[0].opacity)
    }
    
    noStroke();
    strokeWeight(1);
    rect(this.border_pos,getCanvasSize()/2,STROKEWEIGHT,getCanvasSize());
    rect(getCanvasSize() - this.border_pos,getCanvasSize()/2,STROKEWEIGHT,getCanvasSize());
    rect(getCanvasSize()/2,this.border_pos,getCanvasSize(),STROKEWEIGHT);
    rect(getCanvasSize()/2,getCanvasSize() - this.border_pos ,getCanvasSize(),STROKEWEIGHT);
    fill(255,255,255,0)
    stroke(255,255,255,this.multiplayer_menu_button_list.button_array[0].opacity);
    textFont(fontPointless);
    textSize(getCanvasSize()*0.05)
    text('Game Options',getCanvasSize()/2,getCanvasSize()/5 );
    
    
    this.multiplayer_menu_button_list.drawAll();

    if (this.transition_in == false && this.transition_out == false) {

    
    if (this.inputdelay == 0) {
        

   

        //w
        if (keyIsPressed && keyCode == 87 || keyIsPressed && keyCode == 119) {
            this.multiplayer_menu_button_list.selectClosest(2);
            
            this.inputdelay = INPUT_DELAY;
            
        //d
        } else if (keyIsPressed && keyCode == 68 || keyIsPressed && keyCode == 100) {
            this.multiplayer_menu_button_list.selectClosest(1);
            this.inputdelay = INPUT_DELAY;

        //s
        } else if (keyIsPressed && keyCode == 83 || keyIsPressed && keyCode == 115) {
            this.multiplayer_menu_button_list.selectClosest(0);
            this.inputdelay = INPUT_DELAY;

        //a
        } else if (keyIsPressed && keyCode == 65 || keyIsPressed && keyCode == 97) {
            this.multiplayer_menu_button_list.selectClosest(3);
            this.inputdelay = INPUT_DELAY;
        //space
        } else if (keyIsPressed && keyCode == 32) {
            this.multiplayer_menu_button_list.confirm();
            this.inputdelay = INPUT_DELAY;

        }









    } else {
        this.inputdelay--;
    }
}

if (this.multiplayer_menu_button_list.currently_selected.isconfirmed()) {
    this.transition_out = true;
    for (i = 0 ; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
        if (this.multiplayer_menu_button_list.button_array[i] == this.multiplayer_menu_button_list.currently_selected) {
        } else {
            this.multiplayer_menu_button_list.button_array[i].fade();
        }

    }
}


    if (this.transition_out) {
        //checking if the confirmed animation is done and changing the screen
        if (this.multiplayer_menu_button_list.currently_selected.isconfirmed_animation_done()) {
            this.multiplayer_menu_button_list.currently_selected.confirmed_animation = false;
            this.transition_out = false;
            if (this.multiplayer_menu_button_list.currently_selected.phrase == 'Online') {
                this.menuNumber = 2;
            } else if (this.multiplayer_menu_button_list.currently_selected.phrase == 'Local') {
                this.menuNumber = 3;

            } else if (this.multiplayer_menu_button_list.currently_selected.phrase == 'Controls') {
                this.menuNumber = 9;
                this.opacity = 0;

            } else if (this.multiplayer_menu_button_list.currently_selected.phrase == 'How to play') {
                this.menuNumber = 6;
                this.opacity = 0;

            } else {
                this.menuNumber = 0;
            }
            this.transition_in = true;
            
        } 
    }





}

//This method is meant to load tha game screen when the game is being played locally
gui.prototype.offlineGameScreen = function() {
    background(0);
    if (this.bigtic.won == false) {
        this.bigtic.draw(0,0);
    } else {
        this.menuNumber = 1;
    }
    


            






}

//This method is meant to load the game screen for online games
gui.prototype.onlineGameScreen = function() {
    background(255);
}











