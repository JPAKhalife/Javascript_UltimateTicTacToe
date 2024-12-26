/**
 * @file GuiManager.js
 * @description This file is intended to house the gui manager class. as well as the gui class.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Menu from './Menu'

/**
 * @class Represents a GUI Manager that manages screens in a game.
 */
export default class GuiManager {
    static screens: (new (...args: any[]) => Menu)[] = [];
    static currentScreen: Menu;

    /**
     * @function addScreen Adds a screen to the GUI manager.
     * @param {Screen} screen - The screen to be added.
     */
    public static addScreen(screen: (new (...args: any[]) => Menu)) {
        GuiManager.screens.push(screen);
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
    static changeScreen(screen: number) {
        GuiManager.currentScreen = new GuiManager.screens[screen]();

    }

    /**
     * @function getCurrentScreen Returns the index of the current screen.
     * @return {number} The index of the current screen.
     */
    static getCurrentScreen() {
        return GuiManager.currentScreen;
    }
}



