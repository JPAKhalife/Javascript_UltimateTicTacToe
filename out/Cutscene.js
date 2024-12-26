"use strict";
/**
 * @file Cutscene.ts
 * @description This file contains the definition of the Cutscene class.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class Cutscene
 * @Description This class is used to create animations in the gui.
 * */
var Cutscene = /** @class */ (function () {
    /**
     * @constructor
     * @param {*} keylistener
     * @param {*} doCutscene
     * @param {*} animation
     * @param  {...any} shapes
     */
    function Cutscene(keylistener) {
        var shapes = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            shapes[_i - 1] = arguments[_i];
        }
        this.keylistener = keylistener;
        //Each animation needs to have a listen method to check when to start and end an animation
        this.animationCondition = function () { };
        //This keeps track of whether or not the animation is being played
        this.doCutscene = false;
        //Each animatino needs to have the animate method to animate the animation
        this.animation = function () { };
        //Any aditional arguments are for shapes
        this.shapes = [];
        for (var i = 0; i < shapes.length; i++) {
            this.shapes.push(shapes[i]);
        }
        this.onActivate = function () { };
        this.onDeactivate = function () { };
    }
    /**
     * @method listen
     * @description This method listens for when the animation should start and stop
     * */
    Cutscene.prototype.listen = function () {
        this.animationCondition();
        if (this.doCutscene) {
            this.animation();
        }
    };
    /**
     * @method activate
     * @description This method activates the animation
     */
    Cutscene.prototype.activate = function () {
        this.doCutscene = true;
        Cutscene.isPlaying = true;
    };
    /**
     * @method deactivate
     * @description This method deactivates the animation
     
     */
    Cutscene.prototype.deactivate = function () {
        this.doCutscene = false;
        Cutscene.isPlaying = false;
    };
    /**
     * @method setOnActivate
     * @param {*} func
     */
    Cutscene.prototype.setOnActivate = function (func) {
        this.onActivate = func;
    };
    /**
     * @method setOnDeactivate
     * @param {*} func
     */
    Cutscene.prototype.setOnDeactivate = function (func) {
        this.onDeactivate = func;
    };
    /**
     * @method setAnimationCondition
     * @description Sets the animation method for this cutscene
     * @param {@} animation
     */
    Cutscene.prototype.setAnimation = function (animation) {
        if (animation === void 0) { animation = function () { }; }
        this.animation = animation;
    };
    /**
     * @method setcondition
     * @description Sets the condition method for this cutscene
     * @param {@} condition
     */
    Cutscene.prototype.setCondition = function (condition) {
        if (condition === void 0) { condition = function () { this.activate(); }; }
        this.animationCondition = condition;
    };
    //We need a static variable to keep track of whether or not an animation is currently playing
    Cutscene.isPlaying = false;
    return Cutscene;
}());
exports.default = Cutscene;
