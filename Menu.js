/**
 * @description A file containing the definition of every screen in the game.
 * 
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-11-25
 */

const Screens = {
    SCREEN_NUM: 8,
    START_SCREEN: 0,
    SETUP_SCREEN: 1,
    LOADING_SCREEN:2,
    HOW_TO_PLAY_SCREEN: 3,
    CONTROL_SCREEN: 4,
    GAME_SCREEN: 5,
    TEST_SCREEN: 6,
};

createScreens = function() {

//This is a temporary test screen.
testScreen = new Menu(Screens.TEST_SCREEN);

testScreen.setInit(function() {
    this.game = new GameManager(GameTypes.LOCAL, DEFAULT_GRID_SIZE, 3);
    this.board = new TicTacBoard(this.game,this.game.getBoard(),getCanvasSize()/2,getCanvasSize()/2,getCanvasSize() - 100);
    this.board.setSelected();
    this.keylistener = new KeyListener();
});

testScreen.setDraw(function() {
    background(0);

    this.board.draw();

    // //Detect key presses that get put into the tictacboard
    // let keyEvent = this.keylistener.listen();
    // if (keyEvent == KEY_EVENTS.UP) {
    //     this.board.cursorUp();
    // } else if (keyEvent == KEY_EVENTS.DOWN) {
    //     this.board.cursorDown();
    // } else if (keyEvent == KEY_EVENTS.LEFT) {
    //     this.board.cursorLeft();
    // } else if (keyEvent == KEY_EVENTS.RIGHT) {
    //     this.board.cursorRight();
    // } else if (keyEvent == KEY_EVENTS.SELECT) {
    //     this.board.playMove();
    // }
}); 

//This is the creation of the start screen
startScreen = new Menu(Screens.START_SCREEN);

//Init method of the start screen
startScreen.setInit(function() {
    this.keylistener = new KeyListener();

    //This is the text for the title
    this.title = new Text(HEADER.START_SCREEN_TITLE, getCanvasSize()/2,getCanvasSize()/5,color(255,255,255),getCanvasSize()*0.05,fontPointless);
    this.title.setTextOrientation(CENTER,CENTER);
    this.title.setAngleMode(RADIANS);

    //This is the text for the author
    this.author = new Text(HEADER.START_SCREEN_AUTHOR, getCanvasSize()/2,getCanvasSize()/10*3,color(127,127,127),getCanvasSize()*0.05,fontAldoApache);
    this.author.setTextOrientation(CENTER,CENTER); 
    this.author.setAngleMode(RADIANS);

    //This is the text for the start message
    this.startMessage = new Text(HEADER.START_SCREEN_MESSAGE, getCanvasSize()/2,getCanvasSize()/2,color(200,200,200), getCanvasSize()*0.05,fontSquareo);
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
            this.keylistener.deactivate();
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
    this.title = new Text(HEADER.SETUP_SCREEN_TITLE, getCanvasSize()/2,getCanvasSize()/5,color(255,255,255),getCanvasSize()*0.05,fontPointless);
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
            this.keylistener.activate()
        }
    })    

    //Set the animation condition
    this.transition_in.setAnimation(function () {
        if (this.shapes[4] >= STROKEWEIGHT*2) {
            for (i = 0 ; i < this.shapes[0].button_array.length ; i++) {
                if (this.shapes[0].button_array[i].opacity <= 255) { 
                this.shapes[0].button_array[i].fade_in(ATIME.SETUP_SCREEN_ANIMATION_TIME/3*2);
            }
            }
            if (this.shapes[5] < 255) { 
                this.shapes[5] += 255/(ATIME.SETUP_SCREEN_ANIMATION_TIME/3*2);
                this.shapes[2].setStroke(255,255,255, this.shapes[5]);
            }
            if (this.shapes[5] >= 255) {
                for (i = 0 ; i < this.shapes[1].length ; i++) {
                    this.shapes[1][i].fade_in(ATIME.SETUP_SCREEN_ANIMATION_TIME/3);
                }
            }
            
        } else {
            this.shapes[4] += (STROKEWEIGHT*2)/(ATIME.SETUP_SCREEN_ANIMATION_TIME/3);
            this.shapes[3].setWidth(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
            this.shapes[3].setHeight(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
        }
    });

    this.keylistener.deactivate(); //We don't want the user to be capable of inputs during the animation
    this.transition_in.activate(); //activate the transition into the setup screen
    

    //This is the animation intended for transioning out of the setup screen
    this.transition_out = new Cutscene(this.keylistener, this.multiplayer_menu_button_list, this.floater_array, this.title, this.border, STROKEWEIGHT*2, 255);
    
    this.transition_out.setCondition(function () {
        if (this.shapes[0].currently_selected.isconfirmed() && !Cutscene.isPlaying) {
            this.activate();
            this.keylistener.deactivate();
        } else if (this.shapes[0].currently_selected.isconfirmed_animation_done()) {
            this.deactivate();
            this.keylistener.activate();
            //In the event that the online or local button is pushed, we want to set up the x and y values for a transition
            if (this.shapes[0].currently_selected.phrase == 'Online') {
                GuiManager.changeScreen(Screens.LOADING_SCREEN);
            } else if (this.shapes[0].currently_selected.phrase == 'Local') {
                GuiManager.changeScreen(Screens.GAME_SCREEN);
            } else if (this.shapes[0].currently_selected.phrase == 'Controls') {
                GuiManager.changeScreen(Screens.CONTROL_SCREEN)
            } else if (this.shapes[0].currently_selected.phrase == 'How to play') {
                GuiManager.changeScreen(Screens.HOW_TO_PLAY_SCREEN);
            } else {
                GuiManager.changeScreen(Screens.START_SCREEN);
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
            this.shapes[1][i].fade_out(ATIME.CONFIRMED_ANIMATION_TIME/4);
        }
        //Fade out border
        this.shapes[4] -= (STROKEWEIGHT*2)/(ATIME.CONFIRMED_ANIMATION_TIME/4);
        this.shapes[3].setWidth(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
        this.shapes[3].setHeight(getCanvasSize() + STROKEWEIGHT - this.shapes[4]);
        this.shapes[2].setStroke(255,255,255,this.shapes[4]); //fade out the title
        this.shapes[5] -= 255/(ATIME.CONFIRMED_ANIMATION_TIME/4);
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


//Adding the online loading screen
loadingScreen = new Menu(Screens.LOADING_SCREEN);

//Set the init
loadingScreen.setInit(function () {
    this.keylistener = new KeyListener();

    //This is the spinner that sits in the corner
    this.spinner = new Img(whiteTicTac,0,0,getCanvasSize()*0.10,getCanvasSize()*0.10);
    this.spinner.setRectOrientation(CENTER);
    this.spinner.setImageOrientation(CENTER);
    this.spinner.setAngleMode(RADIANS);
    this.spinner.trnslate((getCanvasSize() / 8)*(-1), (getCanvasSize() / 8)*7);
    
    //This is the title
    this.title = new Text(HEADER.LOADING_SCREEN_TITLE_MESSAGES[0]  + HEADER.DOTS[0], getCanvasSize()/2,getCanvasSize()/5,color(255,255,255),getCanvasSize()*0.07,fontRobot);
    this.title.setFill(255,255,255,0);
    this.title.setTextOrientation(CENTER,CENTER);

    //This is the loading message
    this.loadingMessage = new Text(HEADER.LOADING_SCREEN_MESSAGES[0], getCanvasSize()/2,getCanvasSize()/2,color(255,255,255),getCanvasSize()*0.03,fontminecraft);
    this.loadingMessage.setFill(255,255,255,0);
    this.loadingMessage.setRectOrientation(CENTER);
    this.loadingMessage.setTextOrientation(CENTER,CENTER);
    this.loadingMessage.setTextBox(getCanvasSize(),getCanvasSize())
    
    //This is the transition in cutscene
    this.transition_in = new Cutscene(this.keylistener,this.spinner,this.title,this.loadingMessage,(getCanvasSize()/2)/120,0);

    //Set the animation condition of the transition in cutscene.
    this.transition_in.setCondition(function() {
        //deactivate when title fades in
        if (this.shapes[1].opacity >= 255) {
            this.deactivate();
            this.keylistener.activate();
        }

    });

    //Set the animation of the transition in cutscene
    this.transition_in.setAnimation(function() {
        //Start by moving in the spinner
        if (this.shapes[0].tx >= (getCanvasSize()/8*7)) {
            //Once the tic tac has reached its position, stop and fade in.
            this.shapes[1].setFill(255,255,255,this.shapes[4]);
            this.shapes[2].setFill(255,255,255,this.shapes[4]);
            this.shapes[4] += 255/(ATIME.LOADING_TRANSITION_IN/2);
        } else {
            this.shapes[0].tx += (getCanvasSize())/(ATIME.LOADING_TRANSITION_IN/2);
        }
    });

    //Activate the transition in since we want it to be good
    this.keylistener.deactivate();
    this.transition_in.activate();

    //This is the loading cutscene, it will run constantly, regardless of other animations running.
    this.loadCutscene = new Cutscene(this.keylistener,this.spinner,0,0,getRandomInt(0,HEADER.LOADING_SCREEN_MESSAGES.length - 1),this.loadingMessage,0,this.title);

    // TODO: When the back end has been created, set the deactivate condition

    this.loadCutscene.setAnimation(function() {
        this.shapes[0].rotateExact(this.shapes[2],DEGREES);
        this.shapes[0].setTint(255/2*cos(this.shapes[1]) + 255/2);
        this.shapes[1] += 2;
        this.shapes[2] += 3
        if ((this.shapes[2]/3) % 60 == 0) {
            this.shapes[5]++;
            this.shapes[6].setText(HEADER.LOADING_SCREEN_TITLE_MESSAGES[0]  + HEADER.DOTS[this.shapes[5]%HEADER.DOTS.length]);
        } 
        if ((this.shapes[2]/3) % 480 == 0) {
            this.shapes[3]++;
            this.shapes[4].setText(HEADER.LOADING_SCREEN_MESSAGES[this.shapes[3]%HEADER.LOADING_SCREEN_MESSAGES.length]);
        }
        //Just so we don't get integer overflow if the loadind screen stays on too long,
        if ((this.shapes[2]/3) > 2147483645/3) {
            this.shapes[2] = 0;
        }
    });

    this.loadCutscene.activate();
    // TODO: Make an exit cutscene when it is neccessary


});

//Set the draw method
loadingScreen.setDraw(function() {
    background(0);
    this.spinner.render();
    this.title.render();
    this.loadingMessage.render();

    //Listen for our relevant cutscenes
    this.loadCutscene.listen();
    this.transition_in.listen();

});

//Set the resize method
loadingScreen.setResize(function() {});

//Create a new screen for How to play section
howToPlayScreen = new Menu(Screens.HOW_TO_PLAY_SCREEN);

//Set the init function of the howToPlayScreen
howToPlayScreen.setInit(function () {
    this.keylistener = new KeyListener();
    //There are multiple screens in one for this screen. We will have a single cutscene that is used to transition between all of them.
    this.screenState = {value: 0, opacity: 0};

    //This array is used for all of the images on each screen
    this.tutorialImages = [
        new Img(tictacboard, getCanvasSize()/2, getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4),
        new Img(tictacboard_two, getCanvasSize()/2, getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4),
        new Img(tictacboard_three,getCanvasSize()/2,getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4)
    ];
    for (i = 0 ; i < this.tutorialImages.length ; i++) {
        this.tutorialImages[i].setRectOrientation(CENTER);
        this.tutorialImages[i].setImageOrientation(CENTER);
        this.tutorialImages[i].setTint(0);
    }

    //This array will contain all of the paragraphs for each screen
    this.paragraphs = [ 
    new ShapeGroup(Text,
        new Text("The Bigtictactoe board consists of one large tictactoe grid.",getCanvasSize()/2,getCanvasSize()/10*1),
        new Text("Each slot in the grid contains one smaller tictactoe grid.",getCanvasSize()/2,getCanvasSize()/10*2),
        new Text("The goal of the game is to get three points in a row on the large board.",getCanvasSize()/2,getCanvasSize()/10*7),
        new Text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4)),
    new ShapeGroup(Text,
        new Text("To start, player one can choose anyone of the small grids to play in.",getCanvasSize()/2,getCanvasSize()/10),
        new Text("They are then able to mark anywhere in that small grid.",getCanvasSize()/2,getCanvasSize()/10*2),
        new Text("The next player will then be sent to the corresponding area on the large grid.",getCanvasSize()/2,getCanvasSize()/10*7),
        new Text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4)),
    new ShapeGroup (Text,
        new Text("The player can then choose any grid to play in if the grid they are sent to is taken.",getCanvasSize()/2,getCanvasSize()/10),
        new Text("When a small grid is won, it becomes unable to be played in.",getCanvasSize()/2,getCanvasSize()/10*2),
        new Text("That is everything! Have Fun!",getCanvasSize()/2,getCanvasSize()/10*7),
        new Text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4))
    ]
    for (i = 0 ; i < this.paragraphs.length ; i++) {
        this.paragraphs[i].callFunction("setFill",255,255,255,0);
        this.paragraphs[i].callFunction("setTextSize",getCanvasSize()*0.02);
        this.paragraphs[i].callFunction("setFont",fontOSDMONO);
        this.paragraphs[i].callFunction("setRectOrientation",CENTER);
        this.paragraphs[i].callFunction("setTextOrientation",CENTER,CENTER);
    }

    //Now we need a transition animation for when the user presses space.
    this.changeScreen = new Cutscene(this.keylistener,this.tutorialImages,this.paragraphs,this.screenState,true);

    this.changeScreen.setCondition(function() {
        if (this.keylistener.listen() == KEY_EVENTS.SELECT && !Cutscene.isPlaying) {
            this.keylistener.deactivate();
            this.activate()
        }
    });

    this.changeScreen.setAnimation(function () {
        //Check if we are transitioning in
        if (this.shapes[3]) {
            //If we are, fade in
            if (this.shapes[2].opacity < 255) {
                this.shapes[2].opacity += 255/ATIME.INFORMATION_SCREEN_TRANSITION_TIME;
            } else {
                //Once we have completely faded in, set the transition in to false,
                //And end the animation.
                this.shapes[3] = false;
                this.deactivate();
                this.keylistener.activate();
            }
        } else {
            //We are transitioning out
            if (this.shapes[2].opacity > 0) {
                this.shapes[2].opacity -= 255/ATIME.INFORMATION_SCREEN_TRANSITION_TIME;
            } else {
                //Once we have faded out, it is time to fade in.
                this.shapes[3] = true;
                if (this.shapes[2].value >= this.shapes[0].length - 1) {
                    //If we are at the end, change the screen
                    this.deactivate();
                    this.keylistener.activate();
                    GuiManager.changeScreen(Screens.SETUP_SCREEN);
                } else {
                    this.shapes[2].opacity = 0;
                    this.shapes[0][this.shapes[2].value].setTint(0);
                    this.shapes[1][this.shapes[2].value].callFunction('setFill',255,255,255,0);
                    this.shapes[2].value++;
                }
            }
        }
        //While the animation is going, set the tint no matter what
        this.shapes[0][this.shapes[2].value].setTint(this.shapes[2].opacity);
        this.shapes[1][this.shapes[2].value].callFunction('setFill',255,255,255,this.shapes[2].opacity);
    });

    this.changeScreen.activate();
});

//Set the draw function for the how to play screen
howToPlayScreen.setDraw(function() {
    background(0);

    //Render the proper image and text
    this.tutorialImages[this.screenState.value].render();
    this.paragraphs[this.screenState.value].callFunction('render');

    //Listen for the transition animation
    this.changeScreen.listen();
});

//Set the resize function for the how to play screen
howToPlayScreen.setResize(function() {

});

//Create the controls screen (works similarily to the how to play screen)
controlScreen = new Menu(Screens.CONTROL_SCREEN);

//set the init functino for the control screen
controlScreen.setInit(function() {
    this.keylistener = new KeyListener();
    //There are multiple screens in one for this screen. We will have a single cutscene that is used to transition between all of them.
    this.screenState = {value: 0, opacity: 0};

    //This array is used for all of the images on each screen
    this.tutorialImages = [
        new ShapeGroup(Img,new Img(arrows, getCanvasSize()*0.25,getCanvasSize()/2,150,100), new Img(wasd, getCanvasSize()/4*3, getCanvasSize()/2,150,100)),
        new ShapeGroup(Img,new Img(space,getCanvasSize()/2,getCanvasSize()/2,150,100))
       // new ShapeGroup(Img,new Img(tictacboard_three,getCanvasSize()/2,getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4))
    ];
    for (i = 0 ; i < this.tutorialImages.length ; i++) {
        this.tutorialImages[i].callFunction('setRectOrientation',CENTER);
        this.tutorialImages[i].callFunction('setImageOrientation',CENTER);
        this.tutorialImages[i].callFunction('setTint',0);
    }

    //This array will contain all of the paragraphs for each screen
    this.paragraphs = [ 
    new ShapeGroup(Text,
        new Text('Use the WASD and/or Arrow keys to navigate through menus and the Ultimate Tictactoe grid.',getCanvasSize()/2, getCanvasSize()/5*2),
        new Text('Press space to continue',getCanvasSize()/2 , getCanvasSize()/4*2)),
    new ShapeGroup(Text,
        new Text('Press space to select in the menus or play a spot on the Ultimate Tictactoe Grid.',getCanvasSize()/2, getCanvasSize()/5*2),
        new Text('Press space to continue',getCanvasSize()/2, getCanvasSize()/5*3)),
    ];
    for (i = 0 ; i < this.paragraphs.length ; i++) {
        this.paragraphs[i].callFunction("setFill",255,255,255,0);
        this.paragraphs[i].callFunction("setTextSize",getCanvasSize()*0.02);
        this.paragraphs[i].callFunction("setFont",fontOSDMONO);
        this.paragraphs[i].callFunction("setRectOrientation",CENTER);
        this.paragraphs[i].callFunction("setTextOrientation",CENTER,CENTER);
        this.paragraphs[i].callFunction("setTextBox",getCanvasSize()/4*3,getCanvasSize()/4*1);
    }

    //Now we need a transition animation for when the user presses space.
    this.changeScreen = new Cutscene(this.keylistener,this.tutorialImages,this.paragraphs,this.screenState,true);

    this.changeScreen.setCondition(function() {
        if (this.keylistener.listen() == KEY_EVENTS.SELECT && !Cutscene.isPlaying) {
            this.keylistener.deactivate();
            this.activate()
        }
    });

    this.changeScreen.setAnimation(function () {
        //Check if we are transitioning in
        if (this.shapes[3]) {
            //If we are, fade in
            if (this.shapes[2].opacity < 255) {
                this.shapes[2].opacity += 255/ATIME.INFORMATION_SCREEN_TRANSITION_TIME;
            } else {
                //Once we have completely faded in, set the transition in to false,
                //And end the animation.
                this.shapes[3] = false;
                this.deactivate();
                this.keylistener.activate();
            }
        } else {
            //We are transitioning out
            if (this.shapes[2].opacity > 0) {
                this.shapes[2].opacity -= 255/ATIME.INFORMATION_SCREEN_TRANSITION_TIME;
            } else {
                //Once we have faded out, it is time to fade in.
                this.shapes[3] = true;
                if (this.shapes[2].value >= this.shapes[0].length - 1) {
                    //If we are at the end, change the screen
                    this.deactivate();
                    this.keylistener.activate();
                    GuiManager.changeScreen(Screens.SETUP_SCREEN);
                } else {
                    this.shapes[2].opacity = 0;
                    this.shapes[0][this.shapes[2].value].callFunction('setTint',0);
                    this.shapes[1][this.shapes[2].value].callFunction('setFill',255,255,255,0);
                    this.shapes[2].value++;
                }
            }
        }
        //While the animation is going, set the tint no matter what
        this.shapes[0][this.shapes[2].value].callFunction('setTint',this.shapes[2].opacity);
        this.shapes[1][this.shapes[2].value].callFunction('setFill',255,255,255,this.shapes[2].opacity);
    });

    this.changeScreen.activate();


});

controlScreen.setDraw(function() {
    background(0);

    //Render the proper image and text
    this.tutorialImages[this.screenState.value].callFunction('render');
    this.paragraphs[this.screenState.value].callFunction('render');

    //Listen for the transition animation
    this.changeScreen.listen();
});

//Set the resize functino of the controlScreen
controlScreen.setResize(function() {

});


//Create a game screen for the local - and or online game
gameScreen = new Menu(Screens.GAME_SCREEN);

gameScreen.setInit(function(gameType = GameTypes.LOCAL, gridSize = 3, gridLevels = 2, lobby = null) {
    this.keylistener = new KeyListener();

    //Create a game given the parameters passed to the function.
    this.game = new GameManager(gameType,gridSize,gridLevels);
    this.board = new TicTacBoard(this.game,this.game.getBoard(),getCanvasSize()/2,getCanvasSize()/2,getCanvasSize());
    this.board.setSelected();

    //Despite that however, I need to display slightly different information depending on whether or not this is an online or offline game.
    //So the tictac will need to have a status attribute which keeps track of whether or not it is online or offline.

    //This display responsible for the offline game.
    //First we want to draw everything else except for the tictac
    this.title = new Text("Utimate Tictactoe",getCanvasSize()/2,getCanvasSize()/20*1);
    this.title.setTextSize(getCanvasSize()*0.04);
    this.mode = new Text("Local Mode",getCanvasSize()/2,getCanvasSize()/20*2);
    this.mode.setTextSize(getCanvasSize()*0.04);
    this.currentPlayerTitle = new Text('Current Player:',getCanvasSize()/2,getCanvasSize()/20*17);
    this.currentPlayerTitle.setTextSize(getCanvasSize()*0.03);
    this.currentPlayer = new Text(HEADER.PLAYER_NAMES[0],getCanvasSize()/2,getCanvasSize()/20*18); //TODO: Track the current player
    this.currentPlayer.setTextSize(getCanvasSize()*0.03);
    this.info = new ShapeGroup(Text, this.title, this.mode, this.currentPlayer, this.currentPlayerTitle);
    this.info.callFunction('setFont',fontOSDMONO);
    this.info.callFunction('setTextOrientation',CENTER,CENTER);
    this.info.callFunction('setFill',255,255,255,255);

    //This display is responsible for the online game
    //TODO: online gui
    //THings I want to display
    // * The lobby name
    // * The number of spectators
    // * Your opponent (maybe shown in a you vs opponent title)
    // * The current player.

});

gameScreen.setDraw(function() {
    background(0);
    //Render the information
    this.info.callFunction('render');
    //Render our board
    this.board.draw();

    //Detect key presses that get put into the tictacboard
    let keyEvent = this.keylistener.listen();
    if (keyEvent == KEY_EVENTS.UP) {
        this.board.cursorUp();
    } else if (keyEvent == KEY_EVENTS.DOWN) {
        this.board.cursorDown();
    } else if (keyEvent == KEY_EVENTS.LEFT) {
        this.board.cursorLeft();
    } else if (keyEvent == KEY_EVENTS.RIGHT) {
        this.board.cursorRight();
    } else if (keyEvent == KEY_EVENTS.SELECT) {
        this.board.playMove();
    }
});




    //Add all of these methods to the GuiManager in their own objects
    GuiManager.addScreen(startScreen);
    GuiManager.addScreen(setupScreen);
    GuiManager.addScreen(loadingScreen);
    GuiManager.addScreen(howToPlayScreen);
    GuiManager.addScreen(controlScreen);
    GuiManager.addScreen(gameScreen);
    GuiManager.addScreen(testScreen);
}