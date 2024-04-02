//this method will be used to draw the win screen
gui.prototype.winScreen = function(keylistener) {

}

//this method will be used to draw the lose screen
gui.prototype.loseScreen = function(keylistener) {

}

//This method is meant to load tha game screen when the game is being played locally
gui.prototype.offlineGameScreen = function(keylistener) {
    background(0);

    //transition in - We want the tictac to come in from the bottom, the words to come in from left on top and right on bottom
    if (this.transition_in) {

        //we increment our values if this is not the case
        this.x -= 3;
        this.y -= 3;

        //We then need to check if our default values are set to zero.
        if (this.x <= 0 && this.y <= 0) {
            //when our values are zero, that means that the transition has ended.
            this.transition_in = false;
        }



        //That is all that needs to be done for now. (we may add acceleration in the future.)


    }



    if (this.inputdelay <= 0) {
    
    //This is our event listenter for keypresses
    if (keylistener == KEY_EVENTS.UP) {
        this.bigtic.up();
        this.inputdelay = INPUT_DELAY;

    } else if (keylistener == KEY_EVENTS.DOWN) {
        this.bigtic.down();
        this.inputdelay = INPUT_DELAY;

    } else if (keylistener == KEY_EVENTS.LEFT) {
        this.bigtic.left();
        this.inputdelay = INPUT_DELAY;

    } else if (keylistener == KEY_EVENTS.RIGHT) {
        this.bigtic.right();
        this.inputdelay = INPUT_DELAY;

    } else if (keylistener == KEY_EVENTS.SELECT) {
        this.bigtic.select();
        this.inputdelay = INPUT_DELAY;

    } else if (keylistener == KEY_EVENTS.ESCAPE) {
        if (this.quit_open) {
            this.quit_open = true;
            this.transition_in = true;
            this.inputdelay = INPUT_DELAY;
        } else {

        }



    }
    } else {
        this.inputdelay--;
    }



    //draws the current player's turn

    strokeWeight(3);
    //making a box for text to fit it
    stroke(255,this.opacity);
    textAlign(CENTER);
    fill(255);
    textSize(getCanvasSize()*0.05);
    textFont(fontOSDMONO);
    
    text("Utimate Tictactoe",getCanvasSize()/2 - this.x ,getCanvasSize()/20*1);
    textSize(getCanvasSize()*0.04);
    text("Local Mode",getCanvasSize()/2 - this.x ,getCanvasSize()/20*2);
    textSize(getCanvasSize()*0.03);
    text('Current Player:',getCanvasSize()/2 + this.x,getCanvasSize()/20*17);
    text(PLAYER_NAMES[this.bigtic.current_player - 1],getCanvasSize()/2 + this.x,getCanvasSize()/20*18);


    //draw the big tic tac
    this.bigtic.draw(getCanvasSize()/2 - (getCanvasSize() * (BOARD_PERCENT/100))/2,getCanvasSize()/2 - (getCanvasSize() * (BOARD_PERCENT/100))/2 + this.y);



    //this will be where the text goes 

    //checks if the tictac is won or not
    if (this.bigtic.won == true) {
        this.transition_out = true;
    }

    if (this.transition_out) {
        //we increment our values if this is not the case
        this.x += 3;
        this.y += 3;
    
        //We then need to check if our default values are set to zero.
        if (this.x >= getCanvasSize() && this.y >= getCanvasSize()) {
            //when our values are zero, that means that the transition has ended.
            this.transition_out = false;
            //this.transition_in = true;
            this.menuNumber = 0;
            this.s = 0;
            this.x = 0;
            this.y = 0;
            this.opacity = 0;
        }
    

    if (this.opacity <= 0) {
            
    }
}
    


            






}



//This method is meant to load the game screen for online games
gui.prototype.onlineGameScreen = function(keylistener) {
    background(255);
}
