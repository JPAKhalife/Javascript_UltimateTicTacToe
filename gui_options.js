//This method is meant to load the game setup screen
gui.prototype.setupScreen = function(keylistener) {
    background(0);

    //this cnotrols the transition in animation
    if (this.transition_in) {


        

        if (this.border_pos >= STROKEWEIGHT/2) {
            for (i = 0 ; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
                if (this.multiplayer_menu_button_list.button_array[0].opacity <= 255) { 
                this.multiplayer_menu_button_list.button_array[i].fade_in(SETUP_SCREEN_ANIMATION_TIME/3*2);
            }
            }

            if (this.multiplayer_menu_button_list.button_array[0].opacity <= 255) { 
                this.opacity += 255/(SETUP_SCREEN_ANIMATION_TIME/3*2);
            }

            if (this.multiplayer_menu_button_list.button_array[0].opacity >= 255) {
                for (i = 0 ; i < this.floater_array.length ; i++) {
                    this.floater_array[i].fade_in(SETUP_SCREEN_ANIMATION_TIME/3);
                }
            }

            if (this.floater_array[0].opacity >= 255) {
                this.transition_in = false;
                
            }
            
            




        } else {
            this.border_pos += (STROKEWEIGHT*1.5 )/(SETUP_SCREEN_ANIMATION_TIME/3)
        }

    }

    //drawing floaters
    for (i = 0 ; i < this.floater_array.length ; i++) {
        this.floater_array[i].draw();
    }
    
    //draging a rectangle with thick stroke in order to add a border to the screen
    if (this.transition_in) {
        fill(255);
    } else {
        fill(255,255,255,this.opacity);
    }

    
    noStroke();
    strokeWeight(1);
    rect(this.border_pos,getCanvasSize()/2,STROKEWEIGHT,getCanvasSize());
    rect(getCanvasSize() - this.border_pos,getCanvasSize()/2,STROKEWEIGHT,getCanvasSize());
    rect(getCanvasSize()/2,this.border_pos,getCanvasSize(),STROKEWEIGHT);
    rect(getCanvasSize()/2,getCanvasSize() - this.border_pos ,getCanvasSize(),STROKEWEIGHT);
    fill(255,255,255,0)
    stroke(255,255,255,this.opacity);
    textFont(fontPointless);
    textSize(getCanvasSize()*0.05)
    text('Game Options',getCanvasSize()/2,getCanvasSize()/5 );

    this.multiplayer_menu_button_list.drawAll();

    if (this.transition_in == false && this.transition_out == false) {
    if (this.inputdelay == 0) {
        //w
        if (keylistener == KEY_EVENTS.UP) {
            this.multiplayer_menu_button_list.selectClosest(2);
            
            this.inputdelay = INPUT_DELAY;
            
        //d
        } else if (keylistener == KEY_EVENTS.RIGHT) {
            this.multiplayer_menu_button_list.selectClosest(1);
            this.inputdelay = INPUT_DELAY;

        //s
        } else if (keylistener == KEY_EVENTS.DOWN) {
            this.multiplayer_menu_button_list.selectClosest(0);
            this.inputdelay = INPUT_DELAY;

        //a
        } else if (keylistener == KEY_EVENTS.LEFT) {
            this.multiplayer_menu_button_list.selectClosest(3);
            this.inputdelay = INPUT_DELAY;
        //space
        } else if (keylistener == KEY_EVENTS.SELECT) {
            this.opacity = 255;
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

    this.opacity -= 255/(CONFIRMED_ANIMATION_TIME/4);
    
    for (i =  0 ; i < this.floater_array.length ; i++) {
        this.floater_array[i].fade_out(CONFIRMED_ANIMATION_TIME/4);
    }
}



    if (this.transition_out) {

        


        //checking if the confirmed animation is done and changing the screen
        if (this.multiplayer_menu_button_list.currently_selected.isconfirmed_animation_done()) {
            this.multiplayer_menu_button_list.currently_selected.confirmed_animation = false;
            this.transition_out = false;
            //In the event that the online or local button is pushed, we want to set up the x and y values for a transition
            if (this.multiplayer_menu_button_list.currently_selected.phrase == 'Online') {
                this.menuNumber = 2;
                this.x = getCanvasSize();
                this.y = getCanvasSize();
            } else if (this.multiplayer_menu_button_list.currently_selected.phrase == 'Local') {
                this.menuNumber = 3;
                this.x = getCanvasSize();
                this.y = getCanvasSize();

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


//this method draws a quit screen which will descend on top of the current screen
gui.prototype.quitScreen = function(keylistener) {



 

    //background square
    fill(0,this.opacity);
    noStroke()
    rectMode(CENTER);
    rect(0,0,getCanvasSize(),getCanvasSize());

    //menu
    strokeWeight(2);
    stroke(255);
    fill(0);
    rect(getCanvasSize()/2,this.y,getCanvasSize*0.20,getCanvasSize()*0.1);
    textSize(getCanvasSize()*0.01);
    fill(255,255-this.opacity);
    textFont(fontOSDMONO);
    textAlign(CENTER);
    text("Are you sure you want to quit?",getCanvasSize()/2,this.y + getCanvasSize()*0.5);

    for (i = 0 ; i < this.quit_buttons.button_array.length ; i++) {
        this.quit_buttons.button_array[i].setOpacity(255-this.opacity);
    }


       //this is the area that starts the transitino
       if (this.transition_in) {

        //we want a square that is transparent but makes the backround less visible
        //this section will accompoish that
        //the background will dim before the menu opens up
        if (this.opacity > 150) {
            this.opacity -= 100/QUIT_SCREEN_ANIMATION_TIME/4;
        } else {
            if (this.y < getCanvasSize()) {
                this.y += (getCanvasSize()/2 + getCanvasSize()*0.10/2)/QUIT_SCREEN_ANIMATION_TIME/4*3;

                if (this.y == getCanvasSize()/2 + getCanvasSize()*0.10/2) {
                    this.transition_in = false;
                }


            }
        }





    }


    //this is the area that starts the transition out
    if (this.transition_out) {
        
        //We want everything to fade.
        //making the buttons and text and background fade to black.
        if (this.opacity > 0) {
            this.opacity -= 255/QUIT_SCREEN_ANIMATION_TIME;

        }

        if (this.opacity <= 0) {
            this.opacity = 255;
            this.transition_out = false;
            this.transition_in = true;
            this.menuNumber = 0;
        }
        
        
        //send the player to the startscreen when all is said and done

    }



}