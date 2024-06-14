/**
 * @description A file containing the definition of every screen in the game.
 * 
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-13
 */

const Screens = {
    START_SCREEN: 0,
    SETUP_SCREEN: 1,
    ONLINE_LOADING_SCREEN:2,
    OFFLINE_LOADING_SCREEN: 3
};

//This is the addition of the start screen
GuiManager.addScreen(new Menu(function() {
    this.keylistener = new KeyListener();
    //This is the text for the title
    this.title = new Text(START_SCREEN_TITLE,getCanvasSize()*0.05,fontPointless, width/2,height/5,color(255,255,255));
    this.title.setTextOrientation(CENTER,CENTER);
    //This is the text for the author
    this.author = new Text(START_SCREEN_AUTHOR,getCanvasSize()*0.05,fontAldoApache, width/2,height/10*3,color(127,127,127));
    this.author.setTextOrientation(CENTER,CENTER); 
    //This is the text for the start message
    this.startMessage = new Text(START_SCREEN_MESSAGE,getCanvasSize()*0.05,fontSquareo, width/2,height/2,color(200,200,200));
    //This is a variable to keep track of the sin function.
    this.s = 0;

    //Create a new animation for when the user presses the start button
    startAnimation = new Animation(this.keylistener,function() {
        if ((this.keylistener == KEY_EVENTS.SELECT) && (!isPlaying)) {
            this.activate();
        } else if (shapes[2].getY() < height*-1){
            this.deactivate();
            GuiManager.changeScreen(Screens.SETUP_SCREEN);
        } else {
            shapes[2].setAlpha(128 + 128 * sin(millis() / 500));
        }
    },function() {
        for (let i = 0; i < shapes.length; i++) {
            shapes[i].setY(height*sin((this.s+(100*asin(3/4) + 200*PI))/100) - height/4*3);
        }
        shapes[3]+=2;
        shapes[2].setAlpha(128 * sin(millis() / 50));
    },this.title,this.author,this.startMessage,this.s);


}, function() {
    background(0);

    //Render titles
    this.title.render();
    this.author.render();
    this.startMessage.render();


    //listen for starting animation.
    startAnimation.listen();
},
Screens.START_SCREEN));

// //This is the addition of online loading screen
// GuiManager.addScreen(new Gui(function() {
//     this.keylistener = new KeyListener();
//     this.spinner = new Image(whiteTicTac,width/2,height/2,getCanvasSize()*0.15,getCanvasSize()*0.15);
//     this.s = 0;
//     this.spinner.setTint(255*cos(((1/150)*PI)*(150+this.s)) + 255)
//     this.title = new Text(LOADING_SCREEN_TITLE_MESSAGES[0],getCanvasSize()*0.07,fontRobot, width/2,height/5,color(255,255,255));
//     this.loadingMessage = new Text(LOADING_SCREEN_MESSAGES[0] + DOTS[0],getCanvasSize()*0.03,fontminecraft, width/2,height/2,color(255,255,255));
//     this.loadAnimation = new Animation(this.keylistener,function() {
        
//     }
// }, function() {
//     background(0);
//     this.spinner.render();
//     this.title.render();
//     this.loadingMessage.render();
// })


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
// }