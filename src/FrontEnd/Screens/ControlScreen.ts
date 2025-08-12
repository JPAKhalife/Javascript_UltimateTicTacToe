/**
 * @file ControlScreen.ts
 * @description This file is responsible for drawing the control screen
 * @author John Khalife (refactored by Cline)
 * @created 2024-06-9
 * @updated 2025-08-12
 */

import p5 from "p5";
import { KEY_EVENTS } from "../KeyListener";
import { Screens } from "../Menu";
import { arrows, fontOSDMONO, getCanvasSize, space, wasd } from "../sketch";
import TransitionableScreen from "./TransitionableScreen";

const CONTROL_SCREEN_TRANSITION_TIME = 60;

export default class ControlScreen extends TransitionableScreen {
    // Screen state: [current screen index, screen content opacity]
    private screenState: [number, number];
    private internalTransitioning: boolean;
    private internalTransitioningIn: boolean;

    constructor(sketch: p5) {
        // Initialize with no border since we'll handle our own transitions
        super(sketch, {
            useBorder: false,
            fadeContent: false,
            animationTime: CONTROL_SCREEN_TRANSITION_TIME
        });
        
        // Initialize screen state
        this.screenState = [0, 0]; // First is screen index, second is opacity
        this.internalTransitioning = false;
        this.internalTransitioningIn = true;
        
        // Start with transition in
        this.internalTransitioning = true;
        this.internalTransitioningIn = true;
    }

    /**
     * @method handleInternalTransition
     * @description Handles transitions between the two control screens
     */
    private handleInternalTransition(): void {
        if (this.internalTransitioning) {
            if (this.internalTransitioningIn) {
                if (this.screenState[1] < 255) {
                    this.screenState[1] += 255 / CONTROL_SCREEN_TRANSITION_TIME;
                } else {
                    this.internalTransitioning = false;
                    this.internalTransitioningIn = false;
                    this.keylistener.activate();
                }
            } else {
                if (this.screenState[1] > 0) {
                    this.screenState[1] -= 255 / CONTROL_SCREEN_TRANSITION_TIME;
                } else {
                    if (this.screenState[0] >= 1) { // We have 2 screens (0 and 1)
                        // If we've shown both screens, transition out to setup screen
                        this.startTransitionOut(Screens.SETUP_SCREEN);
                    } else {
                        // Move to the next screen
                        this.screenState[0]++;
                        this.screenState[1] = 0;
                        this.internalTransitioningIn = true;
                    }
                }
            }
        }
    }

    /**
     * @method drawContent
     * @description Draws the control screen content
     */
    protected drawContent(): void {
        // Draw the appropriate screen based on screenState[0]
        if (this.screenState[0] === 0) {
            this.drawFirstScreen();
        } else if (this.screenState[0] === 1) {
            this.drawSecondScreen();
        }

        // Handle internal transitions between screens
        this.handleInternalTransition();
    }

    /**
     * @method drawFirstScreen
     * @description Draws the first control screen (arrows and WASD)
     */
    private drawFirstScreen(): void {
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
    }

    /**
     * @method drawSecondScreen
     * @description Draws the second control screen (spacebar)
     */
    private drawSecondScreen(): void {
        this.sketch.push();
        // Second screen - spacebar
        this.sketch.imageMode(this.sketch.CENTER);
        this.sketch.rectMode(this.sketch.CENTER);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.textFont(fontOSDMONO);
        this.sketch.textSize(getCanvasSize() * 0.02);
        
        // Second screen - image and text
        this.sketch.tint(255, this.screenState[1]);
        this.sketch.image(space, getCanvasSize() / 2, getCanvasSize() / 2, getCanvasSize() * 0.15 * 1.5, getCanvasSize() * 0.15);
        
        this.sketch.fill(255, this.screenState[1]);
        this.sketch.text('Press space to select in the menus or play a spot on the Ultimate Tictactoe Grid.',
            getCanvasSize() / 2, getCanvasSize() / 5 * 2 - 10, getCanvasSize() / 4 * 3, getCanvasSize() / 4 * 1);
        this.sketch.text('Press space to continue',
            getCanvasSize() / 2, getCanvasSize() / 5 * 3, getCanvasSize() / 4 * 3, getCanvasSize() / 4 * 1);
        this.sketch.pop();
    }

    /**
     * @method handleInput
     * @description Handles user input
     */
    protected handleInput(): void {
        if (this.keylistener.listen() == KEY_EVENTS.SELECT && !this.internalTransitioning) {
            this.keylistener.deactivate();
            this.internalTransitioning = true;
            this.internalTransitioningIn = false;
        }
    }
}
