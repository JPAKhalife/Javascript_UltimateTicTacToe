/**********************************************************************************************
*                                                                                             *
* Author: John Khalife                                                                        *
* Date Created: 17/08/2022                                                                    *
* Description: This is a javascript version of the bigtictactoe game that I made in C++.      *
* It will hopefully be better coded than the last one, and I will first create the game       *
* then convert it into a multiplayer game hosted on my web server.                            *
*                                                                                             *
**********************************************************************************************/


// This file is meant to be the home of the class for the larger tic tac that holds all the other small tic tacs.
// this file is meant to hold the class for the small tic tac.

//These are the game constants. Modifying them changes the game itself.
//controls the framerate of the game
const FRAMERATE = 60;
//this variable determines how much less of the smallest windowlength you want the canvas to be (percentage)
const WINDOW_MARGIN = 10;
//This variable changes the number of spots in the big tic tac
const GRID_LENGTH = 3;
//this variable changes the number of spots in the small tic tac
const SMALL_GRID_LENGTH = 3;
//this variable determines the size of the x and o based on the size of the gap in the small tic tac it is meant to fill
const SMALL_BOARD_PERCENT = 75;
//this variable determines the size of the small tictac bsed on the size of the gap in the bigtictac it is supposed to fill
const SMALLEST_BOARD_PERCENT = 75;
//this variable determines the suze of the big tic tac based on the size of the canvas
const BOARD_PERCENT = 60;
//this is input delay, measured in frames
const INPUT_DELAY = 10;
//constance used on the creation oc the big tic tac
//exactly what it says
const LINEWIDTH_TO_BOARDWIDTH_RATIO = 0.01;
const SMALL_LINEWIDTH_TO_BOARDWIDTH_RATIO = 0.01;
//percent of the length or width of the convas that the board will take up
//This is the percentage that the button's size will grow when it is selected
const GROWTH_PERCENT = 25;
const CONFIRMED_GROWTH_PERCENT = 100;
//This is the default shade of gray of the button fill (0-255)
const DEFAULT_BUTTON_SHADE = 0;
//this is the desired shade of gray of the button when it is seleceted
const SELECTED_BUTTON_SHADE = 255;
//This controls the text size
const TEXT_SIZE_PERCENTAGE = 50;
//the weight of the stroke around the btton during the confirmed animation
const STROKEWEIGHT = 15;
//here are a bunch of constants which are meant to hold the title messages
const HEADER = {
    START_SCREEN_TITLE:"Ultimate TicTacToe",
    START_SCREEN_MESSAGE: "Press Space to Start",
    START_SCREEN_AUTHOR: "Made by John Khalife",
    SETUP_SCREEN_TITLE: "Game Options",
    LOADING_SCREEN_MESSAGES: ["Check out this cool loading screen lol.", "To win, you have to get good.", "Ultimate Tictactoe is better than TicTacToe", "Don't forget to touch grass every once in a while.", "Fun Fact: This font doesn't have colons.", "Having trouble? Skill issue.","Help, I can't think of loading messages.","I should probably put some actually helpful tips here.","Try to direct your opponent to a square where they can't do anything.", "Sometimes, you can force your opponent to send you to an advantageous square.", "Try to place your pieces such that there are multiple ways you can score a point."],
    LOADING_SCREEN_TITLE_MESSAGES: ["Seaching for players","Preparing Game"],
    DOTS: ["",".","..","..."],
    PLAYER_NAMES: ['PLAYER O','PLAYER X'],
}
//This constant is meant to be used for animation times - measured in frames.
const ATIME = {
    SETUP_SCREEN_ANIMATION_TIME: 120,
    CONTROL_TUTORIAL_ANIMATION_TIME: 120,
    QUIT_SCREEN_ANIMATION_TIME: 60,
    SELECTED_ANIMATION_TIME: 5,
    UNSELECTED_ANIMATION_TIME: 5,
    HOVER_TIME_SMALL: 45,
    HOVER_TIME: 45,
    LOADING_TRANSITION_IN: 180,
    CONFIRMED_ANIMATION_TIME: 60,
    INFORMATION_SCREEN_TRANSITION_TIME: 60,
}

//this variable holds the width of the border around the menu screen in pixels
const MENU_BORDER_WIDTH = 10;
//the outline of the second rect around the utton
const OUTLINE_WEIGHT = 5;





//it's messy, but I have to declare some undefined variables here to define in the setup function.
//I need them to be global variables so I can call them in the other script files
// they are being defined in the setup function because I need access to the variables width and length.

//variable that will hold the gui
var graphicalUserInterface;

//variable that will hold a game
var tictactoe;

//variables for the font
let fontSquareo, fontmono, fontminecraft, fontAldoApache, fontPointless, fontPixeled, fontRobot, fontommy,fontOSDMONO;

//variables for images
let whiteTicTac,space,arrows,wasd,tictacboard,tictacboard_two,tictacboard_three;


//The setup function is run once at the first execution of the script.
function setup() {
    //creating the canvas at the size of the window, setting the canvas to a variable.
    var cnv = createCanvas(getSmallestWindowSize() - getSmallestWindowSize()*WINDOW_MARGIN/100, getSmallestWindowSize() - getSmallestWindowSize()*WINDOW_MARGIN/100);

    //Create the screen objects.
    createScreens();
    //making sure that the canvas does not accidentally make a scroll bar appear on different browsers.
    //cnv.style("display", "block");

    //framerate
    frameRate(FRAMERATE);

    //variable that holds a game
    tictactoe = new game();

    GuiManager.changeScreen(Screens.START_SCREEN);

    background(255);

}

//This method is run once before the setup function and is used to load images, fonts, and other assets
function preload() {
    tictacboard = loadImage('assets/tictacboard.png');
    tictacboard_two = loadImage('assets/tictacplay.png');
    tictacboard_three = loadImage('assets/tictacbigmove.png');
    fontSquareo = loadFont('assets/Squareo.ttf');
    fontAldoApache = loadFont('assets/AldotheApache.ttf');
    fontPointless = loadFont('assets/Pointless.ttf');
    fontPixeled = loadFont('assets/Pixeled.ttf');
    fontRobot = loadFont('assets/Robot Crush.ttf');
    fontommy = loadFont('assets/tommy.otf');
    fontmono = loadFont('assets/mono.otf');
    fontOSDMONO = loadFont('assets/OSDMONO.ttf')
    fontminecraft = loadFont('assets/minecraft.ttf');
    whiteTicTac = loadImage('assets/whitetictac.png');
    fontabsender = loadFont('assets/absender1.ttf');
    space = loadImage('assets/Sace bar image.jpeg');
    arrows = loadImage('assets/Arrow Keys.png');
    wasd = loadImage('assets/wasd.png');
}
  
//This method is called whenever the window is resized, and it's job is to resize the canvas back to the size of the window.
function windowResized() {
    smallest = getSmallestWindowSize();
    resizeCanvas(smallest - smallest*WINDOW_MARGIN/100, smallest - smallest*WINDOW_MARGIN/100);
    GuiManager.initScreen();

}







//This is the draw function, which is called over and over again. It is the main event loop.
function draw() {
        GuiManager.drawScreen();
        //graphicalUserInterface.drawScreen(keyListener.listen());
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
        return windowWidth;
    } else {
        return windowHeight;
    }
}

function getCanvasSize() {
    return getSmallestWindowSize() - getSmallestWindowSize()*WINDOW_MARGIN/100;;
}