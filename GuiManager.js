/**
 * @file GuiManager.js
 * @description This file is intended to house the gui manager class. as well as the gui class.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-13
 */


/**
 * @class Represents a GUI Manager that manages screens in a game.
 */
class GuiManager {
    static screens = [];
    static currentScreen = null;

    /**
     * @function addScreen Adds a screen to the GUI manager.
     * @param {Screen} screen - The screen to be added.
     */
    static addScreen(screen) {
        GuiManager.screens.push(screen);
    }

    /**
     * @function iniScreen Initializes the current screen.
     */
    static initScreen() {
        GuiManager.screens[GuiManager.currentScreen].init();
    }

    /**
     * @function drawScreen Draws the current screen.
     */
    static drawScreen() {
        GuiManager.screens[GuiManager.currentScreen].draw();
    }

    /**
     * @function changeScreen Changes the current screen.
     * @param {number} screen - The index of the screen to be set as the current screen.
     */
    static changeScreen(screen) {
        GuiManager.currentScreen = screen;
        GuiManager.initScreen();
    }

    /**
     * @function getCurrentScreen Returns the index of the current screen.
     * @return {number} The index of the current screen.
     */
    static getCurrentScreen() {
        return GuiManager.currentScreen;
    }
}

/**
 * @Class A class that contains all the attributes a screen should have.
 * */
class Menu {
    /**
     * @constructor Initializes the Menu class.
     * @param {*} init 
     * @param {*} draw 
     * @param {*} id 
     */
    constructor(init,draw,id) {
        this.id = id;
        this.init = init;
        this.draw = draw;
    }
}