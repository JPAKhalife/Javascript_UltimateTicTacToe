/**
 * @file GuiManager
 * @description This file is intended to house the gui manager class. as well as the gui class.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import Menu, { Screens } from "./Menu";
import { MAX_DRAW_ATTEMPS as MAX_DRAW_ATTEMPTS } from "./Constants";

/**
 * @class Represents a GUI Manager that manages screens in a game.
 */
export default class GuiManager {
  static screens: [new (...args: any[]) => Menu, Screens][] = [];
  static currentScreen: Menu;
  static attempts: number = 0;

  /**
   * @function addScreen Adds a screen to the GUI manager.
   * @param {Screen} screen - The screen to be added.
   */
  public static addScreen(screen: new (...args: any[]) => Menu, id: Screens) {
    GuiManager.screens.push([screen, id]);
  }

  /**
   * @function drawScreen Draws the current screen.
   */
  public static drawScreen() {
    GuiManager.currentScreen.draw();
  }

  /**
   * @function changeScreen Changes the current screen.
   * @param {number} screen - The index of the screen to be set as the current screen.
   */
  static changeScreen(screen: Screens, sketch: p5, ...args: any[]) {
    for (let i = 0; i < GuiManager.screens.length; i++) {
      if (screen == GuiManager.screens[i][1]) {
        try {
          GuiManager.currentScreen = new GuiManager.screens[i][0](
            sketch,
            ...args,
          );
        } catch (error) {
          console.error(error);
          if (this.attempts < MAX_DRAW_ATTEMPTS) {
            this.attempts++;
            GuiManager.changeScreen(Screens.START_SCREEN, sketch);
          }
        }

      }
    }
  }

  /**
   * @function getCurrentScreen Returns the index of the current screen.
   * @return {number} The index of the current screen.
   */
  static getCurrentScreen() {
    return GuiManager.currentScreen;
  }
}
