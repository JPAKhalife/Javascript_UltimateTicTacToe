
/**
 * @file KeyListener.ts
 * @description This is a listener inteded to listen for key events and notify relevant parties
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";

//here are a series of key events that can occur (ASCII values)
export const KEY_EVENTS = {
    UP: [38,87,119],
    DOWN: [83,115,40],
    RIGHT: [68,100,39],
    LEFT: [65,97,37],
    SELECT: [32],
    ESCAPE: [27],
    NONE: []
    
}

//this is input delay, measured in frames
const INPUT_DELAY = 5;

//this will listen for keypresses and return an event
export default class KeyListener 
{

    //this boolean determines whether the listening is turned on or off
    private do_listen: boolean;
    //this is the delay between keypresses
    private inputdelay: number;
    private sketch: p5;

    constructor(sketch: p5) 
    {
        this.do_listen = true;
        this.inputdelay = 0;
        this.sketch = sketch;
    }

    /**
     * @method deactivate
     * @description This method deactivates the key listener
     */
    public deactivate(): void 
    {
        this.do_listen = false;
    }

    /**
     * @method activate
     * @description This method activates the key listener
     */
    public activate() : void
    {
        this.do_listen = true;
    }

    /**
     * @method listen
     * @description This method listens for key events
     * @returns {KEY_EVENTS}
     */
    public listen (): number[]
    {

        if (this.inputdelay <= 0) {
            if (this.do_listen == false) {
                return KEY_EVENTS.NONE;
            }
            if (this.sketch.keyIsPressed) {
                if (KEY_EVENTS.UP.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return KEY_EVENTS.UP;
                } else if (KEY_EVENTS.DOWN.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return KEY_EVENTS.DOWN;
                } else if (KEY_EVENTS.RIGHT.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return KEY_EVENTS.RIGHT;
                } else if (KEY_EVENTS.LEFT.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return KEY_EVENTS.LEFT;
                } else if (KEY_EVENTS.SELECT.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return KEY_EVENTS.SELECT;
                } else if (KEY_EVENTS.ESCAPE.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return KEY_EVENTS.ESCAPE;
                    
                }   
            }
        }
        if (this.inputdelay > 0) {
            this.inputdelay--;
        }

        return KEY_EVENTS.NONE;
    }
}