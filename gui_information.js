//this method is for the control screen
gui.prototype.controlScreen_navigate = function(keylistener) {


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
            if (keylistener == KEY_EVENTS.SELECT) {
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

    
    }
    
    //this method is for the control screen
    gui.prototype.controlScreen_select = function(keylistener) {
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
            this.opacity =  0;
            for (i = 0 ; i < this.floater_array.length ; i++) {
                this.floater_array[i].setOpacity(0);
    
            }
            
    
            this.transition_in = true;
        }
    }
    
    //controls for this menu (just space
    
    if (this.transition_in == false && this.transition_out == false) {
    
        
    
    
            //space
            if (keylistener == KEY_EVENTS.SELECT) {
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
        text();
        text();
    
    
    
    
    }
    
    //this method is for the tutorial screen. this particular aspect will show the board and provide the objective.
    gui.prototype.tutorialScreen_one = function (keylistener) {
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
            if (keylistener == KEY_EVENTS.SELECT) {
                this.transition_out = true;
    
            }
    
            
        
    }
    
    
    
    imageMode(CENTER);
    rectMode(CENTER);
    tint(255,this.opacity);
    image(tictacboard,getCanvasSize()/2,getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4);
    //this is the messages to teach the player
    
    textFont(fontOSDMONO);
    textSize(getCanvasSize()*0.02);
    fill(255,255,255,this.opacity);
    text("The Bigtictactoe board consists of one large tictactoe grid.",getCanvasSize()/2,getCanvasSize()/10*1);
    text("Each slot in the grid contains one smaller tictactoe grid.",getCanvasSize()/2,getCanvasSize()/10*2);
    text("The goal of the game is to get three points in a row on the large board.",getCanvasSize()/2,getCanvasSize()/10*7);
    text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4);
    
    
    }
    
    //this method is for the tutorial screen. this particular aspect will show the board and provide the objective.
    gui.prototype.tutorialScreen_two = function (keylistener) {
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
            if (keylistener == KEY_EVENTS.SELECT) {
                this.transition_out = true;
    
            }
    
            
        
    }
    
    imageMode(CENTER);
    rectMode(CENTER);
    tint(255,this.opacity);
    image(tictacboard_two,getCanvasSize()/2,getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4);
    
    //this is the messages to teach the player
    textFont(fontOSDMONO);
    textSize(getCanvasSize()*0.02);
    fill(255,255,255,this.opacity);
    text("To start, player one can choose anyone of the small grids to play in.",getCanvasSize()/2,getCanvasSize()/10);
    text("They are then able to mark anywhere in that small grid.",getCanvasSize()/2,getCanvasSize()/10*2);
    text("The next player will then be sent to the corresponding area on the large grid.",getCanvasSize()/2,getCanvasSize()/10*7);
    text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4);
    
    
    }
    
    //this method is for the tutorial screen. this particular aspect will show the board and provide the objective.
    gui.prototype.tutorialScreen_three = function (keylistener) {
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
            this.opacity =  0;
            for (i = 0 ; i < this.floater_array.length ; i++) {
                this.floater_array[i].setOpacity(0);
    
            }
    
            this.transition_in = true;
        }
    }
    
    //controls for this menu (just space
    
    if (this.transition_in == false && this.transition_out == false) {
    
        
    
    
        
    
            //space
            if (keylistener == KEY_EVENTS.SELECT) {
                this.transition_out = true;
    
            }
    
            
        
    }
    textFont(fontOSDMONO);
    textSize(getCanvasSize()*0.02);
    fill(255,255,255,this.opacity);
    
    imageMode(CENTER);
    rectMode(CENTER);
    tint(255,this.opacity);
    image(tictacboard_three,getCanvasSize()/2,getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4);
    
    //this is the messages to teach the player
    text("The player can then choose any grid to play in if the grid they are sent to is taken.",getCanvasSize()/2,getCanvasSize()/10);
    text("When a small grid is won, it becomes unable to be played in.",getCanvasSize()/2,getCanvasSize()/10*2);
    text("That is everything! Have Fun!",getCanvasSize()/2,getCanvasSize()/10*7)
    text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4);
    
    
    
    }