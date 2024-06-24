/**
 * @file Cutscene.js
 * @description This file contains the definition of the Cutscene class.
 */

/**
 * @class Cutscene
 * @Description This class is used to create animations in the gui.
 * */
class Cutscene {
    //We need a static variable to keep track of whether or not an animation is currently playing
    static isPlaying = false;

    /**
     * @constructor
     * @param {*} keylistener
     * @param {*} doCutscene 
     * @param {*} animation 
     * @param  {...any} shapes 
     */
    constructor(keylistener = null, ...shapes) {
        this.keylistener = keylistener
        //Each animation needs to have a listen method to check when to start and end an animation
        this.animationCondition = function () {};
        //This keeps track of whether or not the animation is being played
        this.doCutscene = false;
        //Each animatino needs to have the animate method to animate the animation
        this.animate = function () {};
        //Any aditional arguments are for shapes
        this.shapes = [];
        for (let i = 0; i < shapes.length; i++) {
            this.shapes.push(shapes[i]);
        }
        this.onActivate = function() {};
        this.onDeactivate = function() {};
    }

    /**
     * @method listen
     * @description This method listens for when the animation should start and stop
     * */
    listen() {
        this.animationCondition();
        if (this.doCutscene) {
            this.animation();
        }
    }

    /**
     * @method activate
     * @description This method activates the animation
     */
    activate() {
        this.doCutscene = true;
        Cutscene.isPlaying = true;
    }

    /**
     * @method deactivate
     * @description This method deactivates the animation
     
     */
    deactivate() { 
        this.doCutscene = false;
        Cutscene.isPlaying = false;
    }

    /**
     * @method setOnActivate
     * @param {*} func 
     */
    setOnActivate(func) {
        this.onActivate = func;
    }

    /**
     * @method setOnDeactivate
     * @param {*} func 
     */
    setOnDeactivate(func) {
        this.onDeactivate = func;
    }

    /**
     * @method setAnimationCondition
     * @description Sets the animation method for this cutscene
     * @param {@} animation 
     */
    setAnimation(animation = function() {}) {
        this.animation = animation;

    }

    /**
     * @method setcondition
     * @description Sets the condition method for this cutscene
     * @param {@} condition 
     */
    setCondition(condition = function() {this.activate()}) {
        this.animationCondition = condition;
    }
}
