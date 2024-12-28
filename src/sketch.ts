/**********************************************************************************************
*                                                                                             *
* Author: John Khalife                                                                        *
* Date Created: 17/08/2022                                                                    *
* Description: This is a javascript version of the bigtictactoe game that I made in C++.      *
* It will hopefully be better coded than the last one, and I will first create the game       *
* then convert it into a multiplayer game hosted on my web server.                            *
*                                                                                             *
**********************************************************************************************/


import P5, { Image, Font } from 'p5';
import GuiManager from './GuiManager';
import {Screens} from './Menu';
import ControlScreen from './Screens/ControlScreen';
import GameScreen from './Screens/GameScreen';
import LoadingScreen from './Screens/LoadingScreen';
import SetupScreen from './Screens/SetupScreen';
import StartScreen from './Screens/StartScreen';
import TestScreen from './Screens/TestScreen';
import TutorialScreen from './Screens/TutorialScreen';

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

//this variable determines the suze of the big tic tac based on the size of the canvas
const BOARD_PERCENT = 60;

//constance used on the creation oc the big tic tac
//exactly what it says
const LINEWIDTH_TO_BOARDWIDTH_RATIO = 0.01;
const SMALL_LINEWIDTH_TO_BOARDWIDTH_RATIO = 0.01;
//This controls the text size
const TEXT_SIZE_PERCENTAGE = 50;
//here are a bunch of constants which are meant to hold the title messages
export const HEADER = {
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
    CONTROL_TUTORIAL_ANIMATION_TIME: 120,
    QUIT_SCREEN_ANIMATION_TIME: 60,
    UNSELECTED_ANIMATION_TIME: 5,
    HOVER_TIME_SMALL: 45,
    HOVER_TIME: 45,
}

//this variable holds the width of the border around the menu screen in pixels
const MENU_BORDER_WIDTH = 10;

//variables for the font
export let fontSquareo: Font, fontmono: Font, fontminecraft: Font, fontAldoApache: Font, fontPointless: Font, fontPixeled: Font, fontRobot: Font, fontommy: Font,fontOSDMONO: Font;

//variables for images
export let whiteTicTac: Image,space: Image,arrows: Image,wasd: Image,tictacboard: Image,tictacboard_two: Image,tictacboard_three: Image;



const sketch = (p5: P5) => {
    //The setup function is responsible for initializing values for the game.
    p5.setup = () => 
        {
            //creating the canvas at the size of the window, setting the canvas to a variable.
            const canvas = p5.createCanvas(getSmallestWindowSize() - getSmallestWindowSize()*WINDOW_MARGIN/100, getSmallestWindowSize() - getSmallestWindowSize()*WINDOW_MARGIN/100);
            let container = document.getElementById('canvas');
            canvas.parent("canvas");

            //framerate (should ideally be 60)
            p5.frameRate(FRAMERATE);
        
            //Add all screen types to the gui manager
            GuiManager.addScreen(ControlScreen,Screens.CONTROL_SCREEN);
            GuiManager.addScreen(GameScreen,Screens.GAME_SCREEN);
            GuiManager.addScreen(LoadingScreen,Screens.LOADING_SCREEN);
            GuiManager.addScreen(SetupScreen,Screens.SETUP_SCREEN);
            GuiManager.addScreen(StartScreen,Screens.START_SCREEN);
            GuiManager.addScreen(TestScreen,Screens.TEST_SCREEN);
            GuiManager.addScreen(TutorialScreen,Screens.TUTORIAL_SCREEN);
            //Change the screen to the default
            GuiManager.changeScreen(Screens.TEST_SCREEN,p5);
            p5.background(255);
        }

        //This method gets called over and over by the p5 library in a loop
        p5.draw = () => {
            p5.fill(255);
            GuiManager.drawScreen();
        };
}
new P5(sketch);

//The setup function is run once at the first execution of the script.

//This method is run once before the setup function and is used to load images, fonts, and other assets
// function preload() {
//     tictacboard = this.loadImage('assets/tictacboard.png');
//     tictacboard_two = this.loadImage('assets/tictacplay.png');
//     tictacboard_three = this.loadImage('assets/tictacbigmove.png');
//     fontSquareo = this.loadFont('assets/Squareo.ttf');
//     fontAldoApache = this.loadFont('assets/AldotheApache.ttf');
//     fontPointless = this.loadFont('assets/Pointless.ttf');
//     fontPixeled = this.loadFont('assets/Pixeled.ttf');
//     fontRobot = this.loadFont('assets/Robot Crush.ttf');
//     fontommy = this.loadFont('assets/tommy.otf');
//     fontmono = this.loadFont('assets/mono.otf');
//     fontOSDMONO = this.loadFont('assets/OSDMONO.ttf')
//     fontminecraft = this.loadFont('assets/minecraft.ttf');
//     whiteTicTac = this.loadImage('assets/whitetictac.png');
//     space = this.loadImage('assets/Sace bar image.jpeg');
//     arrows = this.loadImage('assets/Arrow Keys.png');
//     wasd = this.loadImage('assets/wasd.png');
// }
  
// //This method is called whenever the window is resized, and it's job is to resize the canvas back to the size of the window.
// function windowResized(): void {
//     let smallest = getSmallestWindowSize(this);
//     this.resizeCanvas(smallest - smallest*WINDOW_MARGIN/100, smallest - smallest*WINDOW_MARGIN/100);
//     GuiManager.initScreen();

//}

//This is the draw function, which is called over and over again. It is the main event loop.
function draw(): void {
        
}

/**
 * @function getRandomInt
 * @description get a random integer between the ranges given
 * @param min - the maximum value (inclusive)
 * @param max - the minimum value (inclusive)
 * @returns integer
 */
export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @function getSmallestWindowSize
 * @description This method checks the space afforded to the page by the user, and returns the smaller of the height and width values
 * @returns the smaller of the height and width
 */
export function getSmallestWindowSize(): number {
    if (window.innerWidth <= window.innerHeight) {
        return window.innerWidth;
    } else {
        return window.innerHeight;
    }
}

/**
 * @function getCanvasSize
 * @description This method gets the window size of the current canvas (based on what it was set to).
 * @returns the length of the canvas (in both dimensions)
 */
export function getCanvasSize(): number {
    return getSmallestWindowSize() - getSmallestWindowSize()*WINDOW_MARGIN/100;
}