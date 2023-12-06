//this method will be used to draw the win screen
gui.prototype.winScreen = function(keylistener) {

}

//this method will be used to draw the lose screen
gui.prototype.loseScreen = function(keylistener) {

}

//This method is meant to load tha game screen when the game is being played locally
gui.prototype.offlineGameScreen = function(keylistener) {
    background(0);

    //transition in
    if (this.transition_in) {

    }

    if (this.transition_out) {
        this.opacity -= 255/QUIT_SCREEN_ANIMATION_TIME;

        if (this.opacity <= 0) {
                this.menuNumber = 13;
        }
    }

    if (this.inputdelay <= 0) {
    

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


    //draw the big tic tac
    this.bigtic.draw(getCanvasSize()/5*2 - (getCanvasSize() * (BOARD_PERCENT/100))/2,getCanvasSize()/5*2 - (getCanvasSize() * (BOARD_PERCENT/100))/2);


    //draws the current player's turn

    //making a box for text to fit it
    noFill();
    strokeWeight(3);
    stroke(255,this.opacity);


    rect(getCanvasSize()/20*17 - getCanvasSize()*0.25/2,getCanvasSize()/5*2  - getCanvasSize()*0.60/2,getCanvasSize()*0.25,getCanvasSize()*0.60);
    textAlign(CENTER);
    textSize(getCanvasSize()*0.02);
    textFont(fontOSDMONO);
    fill(255,this.opacity);
    noStroke();
    text("Utimate Tictactoe:",getCanvasSize()/20*17 - getCanvasSize()*0.25/2 + getCanvasSize()*0.25/2,getCanvasSize()/20*3);
    text("Local Mode",getCanvasSize()/20*17 - getCanvasSize()*0.25/2+ getCanvasSize()*0.25/2,getCanvasSize()/20*4);
    text('Current Player:',getCanvasSize()/20*17 - getCanvasSize()*0.25/2+ getCanvasSize()*0.25/2,getCanvasSize()/20*12);
    text(PLAYER_NAMES[this.bigtic.current_player - 1],getCanvasSize()/20*17 - getCanvasSize()*0.25/2+ getCanvasSize()*0.25/2,getCanvasSize()/20*13);

//, 
    
    noFill();
    strokeWeight(3);
    stroke(255,this.opacity);
    rect(getCanvasSize()/10*1,getCanvasSize()/40*29 ,getCanvasSize()*0.875,getCanvasSize()*0.20);
    text('Number of squares claimed by X: ');
    text('Number of squares claimed by O: ');
    text('Number of unclaimed squares: ' )

    //this will be where the text goes 

    //checks if the tictac is won or not
    if (this.bigtic.won == true) {
        this.transition_out = true;
    }
    


            






}



//This method is meant to load the game screen for online games
gui.prototype.onlineGameScreen = function(keylistener) {
    background(255);
}
