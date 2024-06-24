//here are a series of key events that can occur
const KEY_EVENTS = {
    UP: [38,87,119],
    DOWN: [83,115,40],
    RIGHT: [68,100,39],
    LEFT: [65,97,37],
    SELECT: [32],
    ESCAPE: [27],
    NONE: []
    
}


//this will listen for keypresses and return an event
function KeyListener() {

    //this boolean determines whether the listening is turned on or off
    this.do_listen = true;
    this.inputdelay = 0;

}

KeyListener.prototype.deactivate = function() {
    this.do_listen = false;
}

KeyListener.prototype.activate = function() {
    this.do_listen = true;
}

KeyListener.prototype.listen = function() {

    if (this.inputdelay <= 0) {
        if (this.do_listen == false) {
            return KEY_EVENTS.NONE;
        }

        if (keyIsPressed) {
            if (KEY_EVENTS.UP.includes(keyCode)) {
                this.inputdelay = INPUT_DELAY;
                return KEY_EVENTS.UP;
            } else if (KEY_EVENTS.DOWN.includes(keyCode)) {
                this.inputdelay = INPUT_DELAY;
                return KEY_EVENTS.DOWN;
            } else if (KEY_EVENTS.RIGHT.includes(keyCode)) {
                this.inputdelay = INPUT_DELAY;
                return KEY_EVENTS.RIGHT;
            } else if (KEY_EVENTS.LEFT.includes(keyCode)) {
                this.inputdelay = INPUT_DELAY;
                return KEY_EVENTS.LEFT;
            } else if (KEY_EVENTS.SELECT.includes(keyCode)) {
                this.inputdelay = INPUT_DELAY;
                return KEY_EVENTS.SELECT;
            } else if (KEY_EVENTS.ESCAPE.includes(keyCode)) {
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