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

//variable that will hold the gui
var graphicalUserInterface;

//variable that will hold a game
var tictactoe;

//variables for the font
let fontSquareo, fontmono, fontminecraft, fontAldoApache, fontPointless, fontPixeled, fontRobot, fontommy;

//variables for images
let whiteTicTac;


//The setup function is run once at the first execution of the script.
function setup() {
    //creating the canvas at the size of the window, setting the canvas to a variable.

    var cnv = createCanvas(windowWidth, windowHeight);
    //making sure that the canvas does not accidentally make a scroll bar appear on different browsers.
    cnv.style("display", "block");

    //framerate
    frameRate(60);

    //This is where the graphical user interface is declared. It is responsible for switching screens and user interctions.
    graphicalUserInterface = new gui();

    //variable that holds a game
    tictactoe = new game();

}

//This method is run once before the setup function and is used to load images, fonts, and other assets
function preload() {
    fontSquareo = loadFont('assets/Squareo.ttf');
    fontAldoApache = loadFont('assets/AldotheApache.ttf');
    fontPointless = loadFont('assets/Pointless.ttf');
    fontPixeled = loadFont('assets/Pixeled.ttf');
    fontRobot = loadFont('assets/Robot Crush.ttf');
    fontommy = loadFont('assets/tommy.otf')
    fontmono = loadFont('assets/mono.otf')
    fontminecraft = loadFont('assets/minecraft.ttf')
    whiteTicTac = loadImage('assets/whitetictac.png')
}
  
//This method is called whenever the window is resized, and it's job is to resize the canvas back to the size of the window.
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}







//This is the draw function, which is called over and over again. It is the main event loop.
function draw() {
        graphicalUserInterface.drawScreen();
}

//this functio will be used to get an integer within a certain range
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//this function is meant to return the smallest window size.
function getSmallestWindowSize() {
    if (windowWidth <= windowHeight) {
        return windowWidth
    } else {
        return windowHeight
    }
}