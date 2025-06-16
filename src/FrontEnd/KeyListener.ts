
/**
 * @file KeyListener.ts
 * @description This is a listener inteded to listen for key events and notify relevant parties
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";

//here are a series of key events that can occur (ASCII values)
export enum KEY_EVENTS {
    UP = "UP",
    DOWN = "DOWN",
    RIGHT = "RIGHT",
    LEFT = "LEFT",
    SELECT = "SELECT",
    ESCAPE = "ESCAPE",
    ENTER = "ENTER",
    NONE = "NONE"
}

export const KEY_CODES: { [key: string]: KEY_EVENTS } = {
    "38": KEY_EVENTS.UP,
    "87": KEY_EVENTS.UP,
    "119": KEY_EVENTS.UP,
    "83": KEY_EVENTS.DOWN,
    "115": KEY_EVENTS.DOWN,
    "40": KEY_EVENTS.DOWN,
    "68": KEY_EVENTS.RIGHT,
    "100": KEY_EVENTS.RIGHT,
    "39": KEY_EVENTS.RIGHT,
    "65": KEY_EVENTS.LEFT,
    "97": KEY_EVENTS.LEFT,
    "37": KEY_EVENTS.LEFT,
    "32": KEY_EVENTS.SELECT,
    "27": KEY_EVENTS.ESCAPE,
    "13": KEY_EVENTS.ENTER,
    "-1": KEY_EVENTS.NONE
};

//this is input delay, measured in frames
const INPUT_DELAY = 5;

//this will listen for keypresses and return an event
export default class KeyListener 
{

    //this boolean determines whether the listening is turned on or off
    private do_listen: boolean;
    //this is the delay between keypresses
    private inputdelay: number;
    private setDelay: number;
    private sketch: p5;
    //A list of disabled keys
    private disabledKeys: KEY_EVENTS[];

    constructor(sketch: p5, inputdelay: number = INPUT_DELAY)
    {
        this.do_listen = true;
        this.inputdelay = 0;
        this.setDelay = inputdelay
        this.sketch = sketch;
        this.disabledKeys = [];
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
     * @method disableKey
     * @description This method adds to the list of disabled keys
     * @param key
     */
    public disableKey(key: KEY_EVENTS[]): void {
        this.disabledKeys.push(...key);
    }

    /**
     * @method enableKey
     * @description THis method enables the list of keys
     * @param key 
     */
    public enableKey(key: KEY_EVENTS[]): void {
        key.forEach(element => {
            if (this.disabledKeys.includes(element)) {
                this.disabledKeys.splice(this.disabledKeys.indexOf(element), 1);
            }
        });
    }

    /**
     * @method listen
     * @description This method listens for key events
     * @returns {KEY_EVENTS}
     */
    public listen (): KEY_EVENTS
    {  
        if (this.inputdelay <= 0) {
            if (this.do_listen == false) {
                return KEY_EVENTS.NONE;
            }
            if (this.sketch.keyIsPressed && KEY_CODES[this.sketch.keyCode]) {
                this.inputdelay = this.setDelay;
                this.sketch.keyIsPressed = false; //*This prevents key from being held down
                return  KEY_CODES[this.sketch.keyCode];
            }
        }
        if (this.inputdelay > 0) {
            this.inputdelay--;
        }

        return KEY_EVENTS.NONE;
    }
}