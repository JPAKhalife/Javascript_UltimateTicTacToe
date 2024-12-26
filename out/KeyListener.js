"use strict";
/**
 * @file KeyListener.ts
 * @description This is a listener inteded to listen for key events and notify relevant parties
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_EVENTS = void 0;
//here are a series of key events that can occur (ASCII values)
exports.KEY_EVENTS = {
    UP: [38, 87, 119],
    DOWN: [83, 115, 40],
    RIGHT: [68, 100, 39],
    LEFT: [65, 97, 37],
    SELECT: [32],
    ESCAPE: [27],
    NONE: []
};
//this is input delay, measured in frames
var INPUT_DELAY = 5;
//this will listen for keypresses and return an event
var KeyListener = /** @class */ (function () {
    function KeyListener(sketch) {
        this.do_listen = true;
        this.inputdelay = 0;
        this.sketch = sketch;
    }
    /**
     * @method deactivate
     * @description This method deactivates the key listener
     */
    KeyListener.prototype.deactivate = function () {
        this.do_listen = false;
    };
    /**
     * @method activate
     * @description This method activates the key listener
     */
    KeyListener.prototype.activate = function () {
        this.do_listen = true;
    };
    /**
     * @method listen
     * @description This method listens for key events
     * @returns {KEY_EVENTS}
     */
    KeyListener.prototype.listen = function () {
        if (this.inputdelay <= 0) {
            if (this.do_listen == false) {
                return exports.KEY_EVENTS.NONE;
            }
            if (this.sketch.keyIsPressed) {
                if (exports.KEY_EVENTS.UP.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return exports.KEY_EVENTS.UP;
                }
                else if (exports.KEY_EVENTS.DOWN.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return exports.KEY_EVENTS.DOWN;
                }
                else if (exports.KEY_EVENTS.RIGHT.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return exports.KEY_EVENTS.RIGHT;
                }
                else if (exports.KEY_EVENTS.LEFT.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return exports.KEY_EVENTS.LEFT;
                }
                else if (exports.KEY_EVENTS.SELECT.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return exports.KEY_EVENTS.SELECT;
                }
                else if (exports.KEY_EVENTS.ESCAPE.includes(this.sketch.keyCode)) {
                    this.inputdelay = INPUT_DELAY;
                    return exports.KEY_EVENTS.ESCAPE;
                }
            }
        }
        if (this.inputdelay > 0) {
            this.inputdelay--;
        }
        return exports.KEY_EVENTS.NONE;
    };
    return KeyListener;
}());
exports.default = KeyListener;
