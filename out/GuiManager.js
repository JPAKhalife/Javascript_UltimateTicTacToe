"use strict";
/**
 * @file GuiManager.js
 * @description This file is intended to house the gui manager class. as well as the gui class.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Menu = void 0;
/**
 * @class Represents a GUI Manager that manages screens in a game.
 */
var GuiManager = /** @class */ (function () {
    function GuiManager() {
    }
    /**
     * @function addScreen Adds a screen to the GUI manager.
     * @param {Screen} screen - The screen to be added.
     */
    GuiManager.addScreen = function (screen) {
        GuiManager.screens.push(screen);
    };
    /**
     * @function iniScreen Initializes the current screen.
     */
    GuiManager.initScreen = function () {
        GuiManager.currentScreen.init();
    };
    /**
     * @function drawScreen Draws the current screen.
     */
    GuiManager.drawScreen = function () {
        GuiManager.currentScreen.draw();
    };
    /**
     * @function changeScreen Changes the current screen.
     * @param {number} screen - The index of the screen to be set as the current screen.
     */
    GuiManager.changeScreen = function (screen) {
        GuiManager.currentScreen = new Menu(screen, GuiManager.screens[screen].init, GuiManager.screens[screen].draw, GuiManager.screens[screen].resize);
        GuiManager.initScreen();
    };
    /**
     * @function getCurrentScreen Returns the index of the current screen.
     * @return {number} The index of the current screen.
     */
    GuiManager.getCurrentScreen = function () {
        return GuiManager.currentScreen;
    };
    GuiManager.screens = [];
    return GuiManager;
}());
exports.default = GuiManager;
/**
 * @Class A class that contains all the attributes a screen should have.
 * */
var Menu = /** @class */ (function () {
    /**
     * @constructor Initializes the Menu class.
     * @param {*} init
     * @param {*} draw
     * @param {*} id
     */
    function Menu(id, init, draw, resize) {
        if (init === void 0) { init = function () { }; }
        if (draw === void 0) { draw = function () { }; }
        if (resize === void 0) { resize = function () { }; }
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
    Menu.prototype.setInit = function (init) {
        if (init === void 0) { init = function () { }; }
        this.init = init;
    };
    /**
     * @method setDraw
     * @description Sets the draw function
     * @param {} draw
     */
    Menu.prototype.setDraw = function (draw) {
        if (draw === void 0) { draw = function () { }; }
        this.draw = draw;
    };
    /**
     * @method setResize
     * @description Sets the resize function
     * @param {} resize
     */
    Menu.prototype.setResize = function (resize) {
        if (resize === void 0) { resize = function () { }; }
        this.resize = resize;
    };
    return Menu;
}());
exports.Menu = Menu;
