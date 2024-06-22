/**
 * @description A file containing the definition of every screen in the game.
 * 
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-22
 */

const Screens = {
    SCREEN_NUM: 8,
    START_SCREEN: 0,
    SETUP_SCREEN: 1,
    ONLINE_LOADING_SCREEN:2,
    OFFLINE_LOADING_SCREEN: 3
};

createScreens = function() {
//This is the creation of the start screen
startScreen = new Menu(Screens.START_SCREEN);

//Init method of the start screen
startScreen.setInit(function() {
    this.keylistener = new KeyListener();

    //This is the text for the title
    this.title = new Text(HEADER.START_SCREEN_TITLE,getCanvasSize()*0.05,fontPointless, getCanvasSize()/2,getCanvasSize()/5,color(255,255,255));
    this.title.setTextOrientation(CENTER,CENTER);
    this.title.setAngleMode(RADIANS);

    //This is the text for the author
    this.author = new Text(HEADER.START_SCREEN_AUTHOR,getCanvasSize()*0.05,fontAldoApache, getCanvasSize()/2,getCanvasSize()/10*3,color(127,127,127));
    this.author.setTextOrientation(CENTER,CENTER); 
    this.author.setAngleMode(RADIANS);

    //This is the text for the start message
    this.startMessage = new Text(HEADER.START_SCREEN_MESSAGE,getCanvasSize()*0.05,fontSquareo, getCanvasSize()/2,getCanvasSize()/2,color(200,200,200));
    this.startMessage.setTextOrientation(CENTER,CENTER);
    this.startMessage.setAngleMode(RADIANS); 

    //This is a variable to keep track of the sin function.
    this.s = 0;

    //Create a new animation for when the user presses the start button
    this.startCutscene = new Cutscene(this.keylistener, this.title,this.author,this.startMessage,this.s);
    
    //Set the animation condition
    this.startCutscene.setCondition(function() {
        if ((this.keylistener.listen() == KEY_EVENTS.SELECT) && (!Cutscene.isPlaying)) {
            this.activate();
        } else if (this.shapes[2].getY() < getCanvasSize()*-1){
            this.deactivate();
            GuiManager.changeScreen(Screens.SETUP_SCREEN);
        } else {
            this.shapes[2].setFillAlpha(128 + 128 * sin(millis() / 500));
        }
    });

    //Set the animation
    this.startCutscene.setAnimation(function () {
        //Set the y of all three titles - they all move at the same speed
        this.shapes[0].setY(getCanvasSize()/5 + getCanvasSize()*sin((this.shapes[3]+(100*asin(3/4) + 200*PI))/100) - getCanvasSize()/4*3);
        this.shapes[1].setY(getCanvasSize()/10*3 + getCanvasSize()*sin((this.shapes[3]+(100*asin(3/4) + 200*PI))/100) - getCanvasSize()/4*3);
        this.shapes[2].setY(getCanvasSize()/2 + getCanvasSize()*sin((this.shapes[3]+(100*asin(3/4) + 200*PI))/100) - getCanvasSize()/4*3);
        this.shapes[3]+=2;
        //Increase the flashing of the bottom titles
        this.shapes[2].setFillAlpha(128 * sin(millis() / 50));

    });
});

//Set the draw function for startScreen
startScreen.setDraw(function () {
    background(0);

    //Render titles
    this.title.render();
    this.author.render();
    this.startMessage.render();

    //listen for starting animation.
    this.startCutscene.listen();
}); 

//Set the resize function for startScreen
startScreen.setResize(function() {
});

//Initialize setup screen
setupScreen = new Menu(Screens.SETUP_SCREEN);

//Set the init function for setupScreen
setupScreen.setInit(function() {
    this.keylistener = new KeyListener();

    //Create floaters for the setup screen
    this.floater_array = new Array(4);
    for (i = 0 ; i < 4 ; i++) {
        this.floater_array[i] = new Floater(whiteTicTac,50,50);
        this.floater_array[i].setOpacity(0);
        this.floater_array[i].init();
    }
    
    //Opacity and border position
    this.opacity = 0;
    this.border_pos = 0;

    // Border rectangle
    this.border = new Rectangle(getCanvasSize()/2, getCanvasSize()/2, getCanvasSize() + STROKEWEIGHT, getCanvasSize() + STROKEWEIGHT);
    this.border.unsetFill();
    this.border.setStrokeWeight(STROKEWEIGHT);
    this.border.setRectOrientation(CENTER);
    this.border.setStroke(255,255,255,255);

    //This is the text for the title
    this.title = new Text(HEADER.SETUP_SCREEN_TITLE,getCanvasSize()*0.05,fontPointless, getCanvasSize()/2,getCanvasSize()/5,color(255,255,255));
    this.title.setTextOrientation(CENTER,CENTER);
    this.title.setStroke(255,255,255,this.opacity);
    this.title.setFill(255,255,255,0);

    //Here are the buttons for the setup screen
    this.multiplayer_menu_button_list = new ButtonNav([new menu_button(0.5,0.4,"Local",0.1,0.1,50*0.25,0),
        new menu_button(0.80,0.85, "How to play",0.05,0.15,50*0.25,0),
        new menu_button(0.20, 0.85, "Controls",0.05,0.15,50*0.25,0),
        new menu_button(0.5, 0.6 , "Online",0.1,0.1,50*0.25,0)]); 

        //This is the animation intended for transitioning into the setup screen
    this.transition_in = new Cutscene(this.keylistener, this.multiplayer_menu_button_list, this.floater_array, this.title, this.border, this.border_pos, this.opacity);
     
    //set the animation condition
    this.transition_in.setCondition(function () {
        if (this.shapes[1][this.shapes[1].length - 1].opacity >= 255) {
            this.deactivate();
        }
    })    

    //Set the animation condition
    this.transition_in.setAnimation(function () {
        if (this.shapes[4] >= STROKEWEIGHT*2) {
            for (i = 0 ; i < this.shapes[0].button_array.length ; i++) {
                if (this.shapes[0].button_array[i].opacity <= 255) { 
                this.shapes[0].button_array[i].fade_in(SETUP_SCREEN_ANIMATION_TIME/3*2);
            }
            }
            if (this.shapes[5] < 255) { 
                this.shapes[5] += 255/(SETUP_SCREEN_ANIMATION_TIME/3*2);
                this.shapes[2].setStroke(255,255,255, this.shapes[5]);
            }
            if (this.shapes[5] >= 255) {
                for (i = 0 ; i < this.shapes[1].length ; i++) {
                    this.shapes[1][i].fade_in(SETUP_SCREEN_ANIMATION_TIME/3);
                }
            }
            
        } else {
            this.shapes[4] += (STROKEWEIGHT*2)/(SETUP_SCREEN_ANIMATION_TIME/3);
            this.shapes[3].setWidth(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
            this.shapes[3].setHeight(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
        }
    });

    this.transition_in.activate(); //activate the transition into the setup screen

    //This is the animation intended for transioning out of the setup screen
    this.transition_out = new Cutscene(this.keylistener, this.multiplayer_menu_button_list, this.floater_array, this.title, this.border, STROKEWEIGHT*2, 255);
    
    this.transition_out.setCondition(function () {
        if (this.shapes[0].currently_selected.isconfirmed() && !Cutscene.isPlaying) {
            this.activate();
        } else if (this.shapes[4] >= 255) {
            this.deactivate();
            if (this.shapes[0].currently_selected.isconfirmed_animation_done()) {
                this.shapes[0].currently_selected.confirmed_animation = false;
                this.transition_out = false;
                //In the event that the online or local button is pushed, we want to set up the x and y values for a transition
                if (this.shapes[0].currently_selected.phrase == 'Online') {
                    GuiManager.changeScreen(Screens.ONLINE_LOADING_SCREEN);
                } else if (this.shapes[0].currently_selected.phrase == 'Local') {
                    GuiManager.changeScreen(Screens.OFFLINE_LOADING_SCREEN);
                } else if (this.shapes[0].currently_selected.phrase == 'Controls') {
                } else if (this.shapes[0].currently_selected.phrase == 'How to play') {
                } else {
                }
            }
        }
    });

    this.transition_out.setAnimation(function() {
        //Fade buttons
        for (i = 0 ; i < this.shapes[0].button_array.length ; i++) {
            if (this.shapes[0].button_array[i] == this.shapes[0].currently_selected) {
            } else {
                this.shapes[0].button_array[i].fade();
            }
        }
        //Fade out floaters
        for (i =  0 ; i < this.shapes[1].length ; i++) {
            this.shapes[1][i].fade_out(CONFIRMED_ANIMATION_TIME/4);
        }
        //Fade out border
        this.shapes[4] -= (STROKEWEIGHT*2)/(CONFIRMED_ANIMATION_TIME/4);
        this.shapes[3].setWidth(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
        this.shapes[3].setHeight(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
        this.shapes[2].setStroke(255,255,255,this.shapes[4]); //fade out the title
        this.shapes[5] -= 255/(CONFIRMED_ANIMATION_TIME/4);
    });
});    

//set the draw function of the setup screen
setupScreen.setDraw(function() {
    background(0);

    //Draw the border
    //this.border.callFunction('render');
    this.border.render();

    //Render out buttons
    for (i = 0; i < this.multiplayer_menu_button_list.button_array.length ; i++) {
        this.multiplayer_menu_button_list.drawAll();
    }

    //Render our floaters
    for (i = 0 ; i < this.floater_array.length ; i++) {
        this.floater_array[i].draw();
    }

    //Render our title
    this.title.render();

    //Detect any keypresses
    keypress = this.keylistener.listen();

    //Detect for out entry and exit animations
    this.transition_in.listen();
    this.transition_out.listen();


    //w
    if (keypress == KEY_EVENTS.UP) {
        this.multiplayer_menu_button_list.selectClosest(2);   
    //d
    } else if (keypress == KEY_EVENTS.RIGHT) {
        this.multiplayer_menu_button_list.selectClosest(1);
    //s
    } else if (keypress == KEY_EVENTS.DOWN) {
        this.multiplayer_menu_button_list.selectClosest(0);
    //a
    } else if (keypress == KEY_EVENTS.LEFT) {
        this.multiplayer_menu_button_list.selectClosest(3);
    //space
    } else if (keypress == KEY_EVENTS.SELECT) {
        this.opacity = 255;
        this.multiplayer_menu_button_list.confirm();
    }

});

// //This is the addition of online loading screen
// GuiManager.addScreen(new Menu(function() {
//     this.keylistener = new KeyListener();
//     this.spinner = new Img(whiteTicTac,width/2,height/2,getCanvasSize()*0.15,getCanvasSize()*0.15);
//     this.s = 0;
//     this.spinner.setTint(255*cos(((1/150)*PI)*(150+this.s)) + 255)
//     this.title = new Text(LOADING_SCREEN_TITLE_MESSAGES[0],getCanvasSize()*0.07,fontRobot, width/2,height/5,color(255,255,255));
//     this.loadingMessage = new Text(LOADING_SCREEN_MESSAGES[0] + DOTS[0],getCanvasSize()*0.03,fontminecraft, width/2,height/2,color(255,255,255));
//     this.loadCutscene = new Cutscene(this.keylistener,function() {
//         this.activate();
//     }, function() {
//         this.spinner.roll((6*PI) / (300+(150/PI)))*cos(((1/150)*PI)*(150+this.s)) + ((6*PI) / (300+(150/PI)),RADIANS);
//     },this.spinner);
// }, function() {
//     background(0);
//     this.spinner.render();
//     this.title.render();
//     this.loadingMessage.render();
// },Screens.ONLINE_LOADING_SCREEN));

// //This is the addition of offline loading screen
// GuiManager.addScreen(new Menu(function() {
//     this.keylistener = new KeyListener();
//     this.spinner = new Image(whiteTicTac,width/2,height/2,getCanvasSize()*0.15,getCanvasSize()*0.15);
//     this.s = 0;
//     this.spinner.setTint(255*cos(((1/150)*PI)*(150+this.s)) + 255)
//     this.title = new Text(LOADING_SCREEN_TITLE_MESSAGES[0],getCanvasSize()*0.07,fontRobot, width/2,height/5,color(255,255,255));
//     this.loadingMessage = new Text(LOADING_SCREEN_MESSAGES[0] + DOTS[0],getCanvasSize()*0.03,fontminecraft, width/2,height/2,color(255,255,255));
//     this.loadCutscene = new Cutscene(this.keylistener,function() {
//         this.activate();
//     }, function() {
//         this.spinner.roll((6*PI) / (300+(150/PI)))*cos(((1/150)*PI)*(150+this.s)) + ((6*PI) / (300+(150/PI)),RADIANS);
//     },this.spinner);
// }, function() {
//     background(0);
//     this.spinner.render();
//     this.title.render();
//     this.loadingMessage.render();
// }),Screens.OFFLINE_LOADING_SCREEN);



// //This method is meant to load the loading screen online
// gui.prototype.onlineLoadingScreen = function(keylistener) {
//     background(0)
//     fill(255,255,255,255);

//     if (this.transition == true) {
//         this.spin = 0;
//         this.s = 0;
//     } else {
//         if(round(millis())/1000 - this.timepassed/1000 >= 5) {
//             this.timepassed = round(millis( ));
            
//             this.displayedMessage++; 

//             if (this.displayedMessage == this.loadingMessage.length) {
//                 this.displayedMessage = 0;
//             }


//         }

//         push();
//         imageMode(CENTER);
//         angleMode(RADIANS);
//         frameRate(60)
//         translate((width / 5)*4, (height / 5)*4);
//         rotate(this.spin += ( ((6*PI) / (300+(150/PI)))*cos(((1/150)*PI)*(150+this.s)) + ((6*PI) / (300+(150/PI)))));
//         tint(255, 255*cos(((1/150)*PI)*(150+this.s)) + 255);
//         // rotate(this.spin += 0.06);
//         // tint(255, 255*cos((1/75)*PI*this.s) + 255);
//         image(whiteTicTac,0,0,getCanvasSize()*0.15,getCanvasSize()*0.15);
//         pop();
//         fill(255);
//         textAlign(CENTER,CENTER);
//         textFont(fontminecraft);
//         textSize(getCanvasSize()*(0.03))
//         text(this.loadingMessage[this.displayedMessage],width/2,height/2,width/4*3,height/4*3);
//         textSize(getCanvasSize()*0.07)
//         textFont(fontRobot);
//         text(this.titleMessage[0] + this.dots[this.t],width/2,height/5);
//         this.s++;
//         if (this.s % 60 == 0) {
//             this.t++;
//             if (this.t == 4) {
//                 this.t = 0
//             }
//         } 




// }
// }

// //This method is meant to load the loading screen online
// gui.prototype.offlineLoadingScreen = function(keylistener) {
//     background(0)
//     fill(255,255,255,255);

//     if (this.transition == true) {
//         this.spin = 0;
//         this.s = 0;
//     } else {
//         if(round(millis())/1000 - this.timepassed/1000 >= 5) {
//             this.timepassed = round(millis( ));
            
//             this.displayedMessage++; 

//             if (this.displayedMessage == this.loadingMessage.length) {
//                 this.displayedMessage = 0;
//             }


//         }

//         push();
//         imageMode(CENTER);
//         angleMode(RADIANS);
//         frameRate(60)
//         translate((width / 5)*4, (height / 5)*4);
//         rotate(this.spin += ( ((6*PI) / (300+(150/PI)))*cos(((1/150)*PI)*(150+this.s)) + ((6*PI) / (300+(150/PI)))));
//         tint(255, 255*cos(((1/150)*PI)*(150+this.s)) + 255);
//         // rotate(this.spin += 0.06);
//         // tint(255, 255*cos((1/75)*PI*this.s) + 255);
//         image(whiteTicTac,0,0,getCanvasSize()*0.15,getCanvasSize()*0.15);
//         pop();
//         fill(255);
//         textAlign(CENTER,CENTER);
//         textFont(fontminecraft);
//         textSize(getCanvasSize()*(0.03))
//         text(this.loadingMessage[this.displayedMessage],width/2,height/2,width/4*3,height/4*3);
//         textSize(getCanvasSize()*0.07)
//         textFont(fontRobot);
//         text(this.titleMessage[1] + this.dots[this.t],width/2,height/5);
//         this.s++;
//         if (this.s % 60 == 0) {
//             this.t++;
//             if (this.t == 4) {
//                 this.t = 0
//             }
//         } 




// }
    GuiManager.addScreen(startScreen);
    GuiManager.addScreen(setupScreen);
    //GuiManager.addScree
}