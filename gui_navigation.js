//This method is for the startscreen.
gui.prototype.startScreen = function(keylistener) {
    

    
    background(0);

    fill(0,this.opacity);
    rectMode(CORNER);
    rect(0,0,getCanvasSize(),getCanvasSize());


    if (this.transition_in) {
        if (this.opacity > 0) {
            this.opacity -= 255/QUIT_SCREEN_ANIMATION_TIME;
        }

        if (this.opacity <= 0) {
            this.transition_in = false;
        }
    }

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

    if (keylistener == KEY_EVENTS.SELECT && this.transition_out == false && this.transition_in == false) {
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


    if (this.y < height*-1 && this.transition_out) {

        for (let i = 0 ; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
            this.multiplayer_menu_button_list.button_array[i].set_opacity(0);

        }

        this.menuNumber++;
        this.y = 0;
        this.transition_out = false;
        this.transition_in = true;
        this.timepassed = round(millis());
        this.opacity = 0;

}




}

//This method is meant to load the loading screen online
gui.prototype.onlineLoadingScreen = function(keylistener) {
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
gui.prototype.offlineLoadingScreen = function(keylistener) {
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