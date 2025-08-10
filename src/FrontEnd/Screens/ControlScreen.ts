/**
 * @file ControlScreen.ts
 * @description //This file is responsible for Drawing the control screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import { arrows, fontOSDMONO, getCanvasSize, space, wasd } from "../sketch";
import GuiManager from "../GuiManager";

const CONTROL_SCREEN_TRANSITION_TIME = 60;

export default class ControlScreen implements Menu {

    private keylistener: KeyListener;
    private sketch: p5;
    private screenState: [number, number]; // [current screen, opacity]
    private transitioning: boolean;
    private transitioningIn: boolean;
    private opacity: number;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);
        this.screenState = [0, 0]; // First is value, second is opacity
        this.transitioning = false;
        this.transitioningIn = true;
        this.opacity = 0;

        this.transitioningIn = true;
        this.transitioning = true;
        this.keylistener.deactivate();
    }

    private handleTransition(): void {
        if (this.transitioning) {
            if (this.transitioningIn) {
                if (this.screenState[1] < 255) {
                    this.screenState[1] += 255 / CONTROL_SCREEN_TRANSITION_TIME;
                } else {
                    this.transitioning = false;
                    this.transitioningIn = false;
                    this.keylistener.activate();
                }
            } else {
                if (this.screenState[1] > 0) {
                    this.screenState[1] -= 255 / CONTROL_SCREEN_TRANSITION_TIME;
                } else {
                    if (this.screenState[0] >= 1) { // We have 2 screens (0 and 1)
                        GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
                    } else {
                        this.screenState[0]++;
                        this.screenState[1] = 0;
                        this.transitioningIn = true;
                    }
                }
            }
        }
    }

    public draw(): void {
        this.sketch.background(0);

        // Draw the appropriate screen based on screenState[0]
        if (this.screenState[0] === 0) {
            this.sketch.push();
                // First screen - arrows and WASD keys
                this.sketch.rectMode(this.sketch.CENTER);
                this.sketch.imageMode(this.sketch.CENTER);
                this.sketch.tint(255, this.screenState[1]);
            this.sketch.image(arrows, getCanvasSize() * 0.25, getCanvasSize() / 2, getCanvasSize() * 0.15 * 1.5, getCanvasSize() * 0.15);
            this.sketch.image(wasd, getCanvasSize() / 4 * 3, getCanvasSize() / 2, getCanvasSize() * 0.15 * 1.5, getCanvasSize() * 0.15);
                // Draw text for first screen
                this.sketch.rectMode(this.sketch.CENTER);
                this.sketch.textFont(fontOSDMONO);
                this.sketch.textSize(getCanvasSize() * 0.02);
                this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
                this.sketch.fill(255, this.screenState[1]);
                this.sketch.text('Use the WASD and/or Arrow keys to navigate through menus and the Ultimate Tictactoe grid.', 
                    getCanvasSize() / 2, getCanvasSize() / 5 * 2, getCanvasSize() / 4 * 3, getCanvasSize() / 4 * 1);
                this.sketch.text('Press space to continue', 
                    getCanvasSize() / 2, getCanvasSize() / 4 * 2, getCanvasSize() / 4 * 3, getCanvasSize() / 4 * 1);
            this.sketch.pop();
        } else if (this.screenState[0] === 1) {
            this.sketch.push();
                // Second screen - spacebar
                this.sketch.imageMode(this.sketch.CENTER);
                this.sketch.rectMode(this.sketch.CENTER);
                this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
                this.sketch.textFont(fontOSDMONO);
                this.sketch.textSize(getCanvasSize() * 0.02)
                //Second screen - text
                this.sketch.tint(255, this.screenState[1]);
            this.sketch.image(space, getCanvasSize() / 2, getCanvasSize() / 2, getCanvasSize() * 0.15 * 1.5, getCanvasSize() * 0.15);
                this.sketch.fill(255, this.screenState[1]);
                this.sketch.text('Press space to select in the menus or play a spot on the Ultimate Tictactoe Grid.',
                    getCanvasSize() / 2, getCanvasSize() / 5 * 2 - 10, getCanvasSize() / 4 * 3, getCanvasSize() / 4 * 1);
                this.sketch.text('Press space to continue',
                    getCanvasSize() / 2, getCanvasSize() / 5 * 3, getCanvasSize() / 4 * 3, getCanvasSize() / 4 * 1);
            this.sketch.pop();
        }

        this.handleTransition();

        if (this.keylistener.listen() == KEY_EVENTS.SELECT) {
            this.transitioning = true;
        }
    }
}
