// filepath: /Users/johnkhalife/Code/Javascript_UltimateTicTacToe/src/sketch.ts
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
import { Screens } from './Menu';
import ControlScreen from './Screens/ControlScreen';
import GameScreen from './Screens/GameScreen';
import LoadingScreen from './Screens/LoadingScreen';
import SetupScreen from './Screens/SetupScreen';
import StartScreen from './Screens/StartScreen';
import TestScreen from './Screens/TestScreen';
import TutorialScreen from './Screens/TutorialScreen';
import MultiplayerScreen from './Screens/MultiplayerScreen';
import CreateLobbyScreen from './Screens/CreateLobbyScreen';
import UsernameScreen from './Screens/UsernameScreen';

// These are the game constants. Modifying them changes the game itself.
export const FRAMERATE = 60;
const WINDOW_MARGIN = 10;
const GRID_LENGTH = 3;
const SMALL_GRID_LENGTH = 3;
const SMALL_BOARD_PERCENT = 75;
const BOARD_PERCENT = 60;
const LINEWIDTH_TO_BOARDWIDTH_RATIO = 0.01;
const SMALL_LINEWIDTH_TO_BOARDWIDTH_RATIO = 0.01;
const TEXT_SIZE_PERCENTAGE = 50;

export const HEADER = {
  START_SCREEN_TITLE: "Ultimate TicTacToe",
  START_SCREEN_MESSAGE: "Press Space to Start",
  START_SCREEN_AUTHOR: "Made by John Khalife",
  SETUP_SCREEN_TITLE: "Game Options",
  LOADING_SCREEN_MESSAGES: ["Check out this cool loading screen lol.", "To win, you have to get good.", "Ultimate Tictactoe is better than TicTacToe", "Don't forget to touch grass every once in a while.", "Fun Fact: This font doesn't have colons.", "Having trouble? Skill issue.", "Help, I can't think of loading messages.", "I should probably put some actually helpful tips here.", "Try to direct your opponent to a square where they can't do anything.", "Sometimes, you can force your opponent to send you to an advantageous square.", "Try to place your pieces such that there are multiple ways you can score a point."],
  LOADING_SCREEN_TITLE_MESSAGES: ["Seaching for players", "Preparing Game"],
  DOTS: ["", ".", "..", "..."],
  PLAYER_NAMES: ['PLAYER O', 'PLAYER X'],
};

const ATIME = {
  CONTROL_TUTORIAL_ANIMATION_TIME: 120,
  QUIT_SCREEN_ANIMATION_TIME: 60,
  UNSELECTED_ANIMATION_TIME: 5,
  HOVER_TIME_SMALL: 45,
  HOVER_TIME: 45,
};

const MENU_BORDER_WIDTH = 10;

export let fontSquareo: Font, fontmono: Font, fontminecraft: Font, fontAldoApache: Font, fontPointless: Font, fontPixeled: Font, fontRobot: Font, fontommy: Font, fontOSDMONO: Font;

export let whiteTicTac: Image, space: Image, arrows: Image, wasd: Image, tictacboard: Image, tictacboard_two: Image, tictacboard_three: Image;

const sketch = (p5: P5) => {
  p5.setup = () => {
    const canvas = p5.createCanvas(getSmallestWindowSize() - getSmallestWindowSize() * WINDOW_MARGIN / 100, getSmallestWindowSize() - getSmallestWindowSize() * WINDOW_MARGIN / 100);
    let container = document.getElementById('canvas');
    canvas.parent("canvas");

    p5.frameRate(FRAMERATE);

    //Define all images and fonts here.
    fontSquareo = p5.loadFont('/assets/Squareo.ttf');
    fontmono = p5.loadFont('/assets/mono.otf');
    fontminecraft = p5.loadFont('/assets/minecraft.ttf');
    fontAldoApache = p5.loadFont('/assets/AldotheApache.ttf');
    fontPointless = p5.loadFont('/assets/Pointless.ttf');
    fontPixeled = p5.loadFont('/assets/Pixeled.ttf');
    fontRobot = p5.loadFont('/assets/Robot Crush.ttf');
    fontommy = p5.loadFont('/assets/tommy.otf');
    fontOSDMONO = p5.loadFont('/assets/OSDMONO.ttf');

    whiteTicTac = p5.loadImage('/assets/whitetictac.png');
    space = p5.loadImage('/assets/spacebarimage.jpeg');
    arrows = p5.loadImage('/assets/Arrow Keys.png');
    wasd = p5.loadImage('/assets/wasd.png');
    tictacboard = p5.loadImage('/assets/tictacboard.png');
    tictacboard_two = p5.loadImage('/assets/tictacplay.png');
    tictacboard_three = p5.loadImage('/assets/tictacbigmove.png');

    //Add all screens to the Gui Manager adn set the screen to start
    GuiManager.addScreen(ControlScreen, Screens.CONTROL_SCREEN);
    GuiManager.addScreen(GameScreen, Screens.GAME_SCREEN);
    GuiManager.addScreen(LoadingScreen, Screens.LOADING_SCREEN);
    GuiManager.addScreen(SetupScreen, Screens.SETUP_SCREEN);
    GuiManager.addScreen(StartScreen, Screens.START_SCREEN);
    GuiManager.addScreen(TestScreen, Screens.TEST_SCREEN);
    GuiManager.addScreen(TutorialScreen, Screens.TUTORIAL_SCREEN);
    GuiManager.addScreen(MultiplayerScreen, Screens.MULTIPLAYER_SCREEN);
    GuiManager.addScreen(CreateLobbyScreen, Screens.CREATE_LOBBY_SCREEN);
    GuiManager.addScreen(UsernameScreen, Screens.USERNAME_SCREEN);
    GuiManager.changeScreen(Screens.CONTROL_SCREEN, p5);
    p5.background(255);
  };

  //A very simple draw function that just draws the screen.
  p5.draw = () => {
    p5.fill(255);
    GuiManager.drawScreen();
  };

  // Handle window resize events
  p5.windowResized = () => {
    // Resize the canvas based on the new window dimensions
    p5.resizeCanvas(
      getSmallestWindowSize() - getSmallestWindowSize() * WINDOW_MARGIN / 100,
      getSmallestWindowSize() - getSmallestWindowSize() * WINDOW_MARGIN / 100
    );
    
    // Notify the current screen of the resize
    GuiManager.resizeScreen();
  };
};

new P5(sketch);

/**
 * @function getRandomInt
 * @description This function returns a random integer between the min and max values.
 * @param min 
 * @param max 
 * @returns 
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getSmallestWindowSize(): number {
  if (window.innerWidth <= window.innerHeight) {
    return window.innerWidth;
  } else {
    return window.innerHeight;
  }
}

export function getCanvasSize(): number {
  return getSmallestWindowSize() - getSmallestWindowSize() * WINDOW_MARGIN / 100;
}
