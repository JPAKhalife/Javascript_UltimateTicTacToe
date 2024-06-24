/**
 * @file GuiManager.js
 * @description This file is intended to house the gui manager class. as well as the gui class.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
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
        GuiManager.currentScreen.init();
    }

    /**
     * @function drawScreen Draws the current screen.
     */
    static drawScreen() {
        GuiManager.currentScreen.draw();
    }

    /**
     * @function changeScreen Changes the current screen.
     * @param {number} screen - The index of the screen to be set as the current screen.
     */
    static changeScreen(screen) {
        GuiManager.currentScreen = new Menu(
            screen,
            GuiManager.screens[screen].init,
            GuiManager.screens[screen].draw,
            GuiManager.screens[screen].resize);
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
    constructor(id,init = function() {},draw = function() {}, resize = function() {}) {
        this.id = id;
        this.init = init;
        this.draw = draw;
        this.resize = resize;
    }

    /**
     * @method setInit
     * @description Sets the init function 
     * @param {} init 
     */
    setInit(init = function() {}) {
        this.init = init;
    }

    /**
     * @method setDraw
     * @description Sets the draw function 
     * @param {} draw 
     */
    setDraw(draw = function() {}) {
        this.draw = draw;
    }

    /**
     * @method setResize
     * @description Sets the resize function 
     * @param {} resize 
     */
    setResize(resize = function() {}) {
        this.resize = resize;
    }
}