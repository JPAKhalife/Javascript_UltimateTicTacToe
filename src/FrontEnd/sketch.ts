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

// These are the game constants. Modifying them changes the game itself.
const FRAMERATE = 60;
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

    GuiManager.addScreen(ControlScreen, Screens.CONTROL_SCREEN);
    GuiManager.addScreen(GameScreen, Screens.GAME_SCREEN);
    GuiManager.addScreen(LoadingScreen, Screens.LOADING_SCREEN);
    GuiManager.addScreen(SetupScreen, Screens.SETUP_SCREEN);
    GuiManager.addScreen(StartScreen, Screens.START_SCREEN);
    GuiManager.addScreen(TestScreen, Screens.TEST_SCREEN);
    GuiManager.addScreen(TutorialScreen, Screens.TUTORIAL_SCREEN);
    GuiManager.changeScreen(Screens.TEST_SCREEN, p5);
    p5.background(255);
  };

  p5.draw = () => {
    p5.fill(255);
    GuiManager.drawScreen();
  };
};

new P5(sketch);

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