/**********************************************************************************************
*                                                                                             *
* Author: John Khalife                                                                        *
* Date Created: 17/08/2022                                                                    *
* Description: This is a javascript version of the bigtictactoe game that I made in C++.      *
* It will hopefully be better coded than the last one, and I will first create the game       *
* then convert it into a multiplayer game hosted on my web server.                            *
*                                                                                             *
**********************************************************************************************/


//These are the game constants. Modifying them changes the game itself.
//This variable changes the size of the tictacs.
const GRID_LENGTH = 2;
//This variable changes the number of players in a game.
const PLAYER_NUMBER = 2;

//it's messy, but I have to declare some undefined variables here to define in the setup function.
//I need them to be global variables so I can call them in the other script files
// they are being defined in the setup function because I need access to the variables width and length.
var graphicalUserInterface;
var playButton;


//The setup function is run once at the first execution of the script.
function setup() {
    //creating the canvas at the size of the window, setting the canvas to a variable.
    var cnv = createCanvas(windowWidth, windowHeight*0.9);
    //making sure that the canvas does not accidentally make a scroll bar appear on different browsers.
    cnv.style("display", "block");

    //This is where the graphical user interface is declared. It is responsible for switching screens and user interctions.
    graphicalUserInterface = new gui();


    //This is where all of the buttons are declared.
    playButton = new button(width/2 -  width*0.2/2, height/2 -  height*0.2/2, width*0.2, height*0.2,
    color(255, 153, 51),true,"Play",10,0,"Helvetica",true,color(204, 51, 255),255,
    false,undefined,undefined,true,undefined,undefined,undefined,undefined,undefined,undefined,undefined,function() {
        graphicalUserInterface.menuNumber = 1;
});

  }
  
//This method is called whenever the window is resized, and it's job is to resize the canvas back to the size of the window.
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

    //redeclaring the buttons so they resize with everything else
    playButton = new button(width/2 -  width*0.2/2, height/2 -  height*0.2/2, width*0.2, height*0.2,
    color(255, 153, 51),true,"Play",10,0,"Helvetica",true,color(204, 51, 255),255,
    false,undefined,undefined,true,undefined,undefined,undefined,undefined,undefined,undefined,undefined,function() {
        graphicalUserInterface.menuNumber = 1;
});
}







//This is the draw function, which is called over and over again. It is the main event loop.
function draw() {
    //drawing the proper screen that the game should be on
    switch(graphicalUserInterface.menuNumber) {
        case 0:
            graphicalUserInterface.startScreen();
            break;
        case 1:
            break;
        default:
            throw "This screen does not exist";
    }
}
  