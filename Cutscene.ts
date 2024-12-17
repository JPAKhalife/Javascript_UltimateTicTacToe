/**
 * @file Cutscene.ts
 * @description This file contains the definition of the Cutscene class.
 */

import KeyListener from "./KeyListener";

/**
 * @class Cutscene
 * @Description This class is used to create animations in the gui.
 * */
export default class Cutscene {
    //We need a static variable to keep track of whether or not an animation is currently playing
    public static isPlaying = false;

    //This is the keylistener for the cutscene
    private keylistener: KeyListener;
    //This is the condition for the cutscene
    public animationCondition: Function;
    //This is the animation for the cutscene
    public animation: Function;
    //These are the shapes in the cutscene
    private shapes: any[];
    //This is the onActivate function
    public onActivate: Function;
    //This is the onDeactivate function
    public onDeactivate: Function;
    //This is the doCutscene variable
    private doCutscene: boolean;

    /**
     * @constructor
     * @param {*} keylistener
     * @param {*} doCutscene 
     * @param {*} animation 
     * @param  {...any} shapes 
     */
    constructor(keylistener: KeyListener, ...shapes) {
        this.keylistener = keylistener
        //Each animation needs to have a listen method to check when to start and end an animation
        this.animationCondition = function () {};
        //This keeps track of whether or not the animation is being played
        this.doCutscene = false;
        //Each animatino needs to have the animate method to animate the animation
        this.animation = function () {};
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
    listen(): void 
    {
        this.animationCondition();
        if (this.doCutscene) {
            this.animation();
        }
    }

    /**
     * @method activate
     * @description This method activates the animation
     */
    activate(): void 
    {
        this.doCutscene = true;
        Cutscene.isPlaying = true;
    }

    /**
     * @method deactivate
     * @description This method deactivates the animation
     
     */
    deactivate(): void 
    { 
        this.doCutscene = false;
        Cutscene.isPlaying = false;
    }

    /**
     * @method setOnActivate
     * @param {*} func 
     */
    setOnActivate(func: Function): void 
    {
        this.onActivate = func;
    }

    /**
     * @method setOnDeactivate
     * @param {*} func 
     */
    setOnDeactivate(func: Function): void {
        this.onDeactivate = func;
    }

    /**
     * @method setAnimationCondition
     * @description Sets the animation method for this cutscene
     * @param {@} animation 
     */
    setAnimation(animation: Function = function() {}): void 
    {
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
