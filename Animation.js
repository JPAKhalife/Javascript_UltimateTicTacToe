/**
 * @file Animation.js
 * @description This file contains the definition of the Animation class.
 */

/**
 * @class Animation
 * @Description This class is used to create animations in the gui.
 * */
class Animation {
    //We need a static variable to keep track of whether or not an animation is currently playing
    static isPlaying = false;

    /**
     * @constructor
     * @param {*} keylistener
     * @param {*} doAnimation 
     * @param {*} animation 
     * @param  {...any} shapes 
     */
    constructor(keylistener = null, animationCondition = {}, animation = {}, ...shapes) {
        this.keylistener = keylistener
        //Each animation needs to have a listen method to check when to start and end an animation
        this.animationCondition = animationCondition;
        //This keeps track of whether or not the animation is being played
        this.doAnimation = false;
        //Each animatino needs to have the animate method to animate the animation
        this.animate = animation;
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
        if (this.doAnimation) {
            this.animate();
        }
    }

    /**
     * @method activate
     * @description This method activates the animation
     */
    activate() {
        this.doAnimation = true;
        isPlaying = true;
    }

    /**
     * @method deactivate
     * @description This method deactivates the animation
     
     */
    deactivate() { 
        this.doAnimation = false;
        isPlaying = false;
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
}
