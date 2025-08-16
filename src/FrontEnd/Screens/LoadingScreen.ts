/**
 * @file LoadingScreen.ts
 * @description This file is responsible for drawing the loading screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import Menu, { Screens } from "../Menu"
import KeyListener from "../KeyListener";
import { whiteTicTac, getCanvasSize, HEADER, fontRobot, fontminecraft, fontAldoApache, FRAMERATE } from "../sketch";
import GuiManager from "../GuiManager";
import LoadingSpinner from "../MenuObjects/LoadingSpinner";

// Constants for the loading screen
const LOADING_TRANSITION_IN = 180;

// Text sizes as percentages of canvas size
const TEXT_SIZES = {
    TITLE: 0.07,      // Title text size
    MESSAGE: 0.03     // Loading message text size
};

export default class LoadingScreen implements Menu {

    private sketch: p5;
    private keylistener: KeyListener;
    private spinner: LoadingSpinner;
    private titleOpacity: number;
    private loadingMessageIndex: number;
    private titleDotIndex: number;
    private frameCounter: number;
    private transitionInActive: boolean;
    private transitionOutActive: boolean;
    private transitionTimer: number;
    private proceed: boolean;
    private nextScreen: Screens;
    private titleText: string;
    private args: any[];

    constructor(sketch: p5, nextScreen?: Screens, titleText?: string, loadingAction?: () => void, proceedCondition?: () => boolean, ...args: any[]) {
        this.sketch = sketch;
        this.args = args;
        this.keylistener = new KeyListener(this.sketch);
        this.titleText = titleText || HEADER.LOADING_SCREEN_TITLE_MESSAGES[0];
        this.nextScreen = nextScreen || Screens.START_SCREEN;

        this.spinner = new LoadingSpinner(sketch, -0.125, 0.875, 0.10, false, whiteTicTac, (counter: number) => {
            this.sketch.angleMode(this.sketch.DEGREES);
            return 255 / 2 * this.sketch.cos(counter) + 255 / 2;
        }, 3);

        // Initialize animation properties
        this.titleOpacity = 0;
        this.titleDotIndex = 0;
        this.loadingMessageIndex = 0;
        this.frameCounter = 0;
        this.transitionTimer = FRAMERATE * 3;

        // Transition markers
        this.transitionInActive = false;
        this.transitionOutActive = false;

        // Start transition in animation
        this.keylistener.deactivate();
        this.startTransitionIn();

        if (loadingAction) {
            loadingAction();
        }

        this.proceed = true;
        // If proceedCondition is provided, use it to determine when to proceed
        if (proceedCondition) {
            this.proceed = false;
            const checkProceed = () => {
                if (proceedCondition()) {
                    this.proceed = true;
                } else {
                    setTimeout(checkProceed, 100); // Check again after 100ms
                }
            };
            checkProceed();
        }
    }

    private startTransitionIn(): void {
        this.titleOpacity = 0;
        this.transitionInActive = true;
    }

    private animateTransitionIn(): void {
        if (this.spinner.getXPercent() < 0.875) {
            this.spinner.setX(this.spinner.getXPercent() + 1 / (LOADING_TRANSITION_IN / 2));
        } else if (this.titleOpacity < 255) {
            this.titleOpacity += 255 / (LOADING_TRANSITION_IN / 2);
        } else {
            this.keylistener.activate();
            this.transitionInActive = false;
        }
    }

    /**
     * @method animateTransitionOut
     * @description This method is responsible for animating the transition out of the loading screen
     */
    private animateTransitionOut(): void {
        this.titleOpacity -= 255 / (LOADING_TRANSITION_IN / 2);
        this.spinner.setX(this.spinner.getXPercent() - 1 / (LOADING_TRANSITION_IN / 2));

        if (this.titleOpacity <= 0 && this.spinner.getXPercent() <= 0 - this.spinner.getWidthPercent()) {
            this.transitionOutActive = false;
            this.keylistener.activate();
            GuiManager.changeScreen(this.nextScreen, this.sketch, this.args);
        }
    }

    private animateLoading(): void {
        if ((this.frameCounter / 3) % 60 === 0) {
            this.titleDotIndex++;
        }

        if ((this.frameCounter / 3) % 240 === 0) {
            this.loadingMessageIndex++;
        }

        if ((this.frameCounter / 3) > 2147483645 / 3) {
            this.frameCounter = 0;
        }

        this.frameCounter++;
    }

    private drawTitle(): void {
        const canvasSize = getCanvasSize();
        this.sketch.push();
        this.sketch.fill(255, 255, 255, this.titleOpacity);
        this.sketch.noStroke(); // Explicitly set no stroke
        this.sketch.textFont(fontRobot);
        this.sketch.textSize(canvasSize * TEXT_SIZES.TITLE);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text(
            this.titleText + HEADER.DOTS[this.titleDotIndex % HEADER.DOTS.length],
            canvasSize / 2,
            canvasSize / 5
        );
        this.sketch.pop();
    }

    private drawLoadingMessage(): void {
        const canvasSize = getCanvasSize();
        this.sketch.push();
        
        // Set text properties
        this.sketch.fill(255, 255, 255, this.titleOpacity);
        this.sketch.noStroke(); // Explicitly set no stroke
        this.sketch.textFont(fontAldoApache);
        this.sketch.textSize(canvasSize * TEXT_SIZES.MESSAGE);
        
        // Set text alignment to center
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        
        // Set rect mode to CENTER to make positioning easier
        this.sketch.rectMode(this.sketch.CENTER);
        
        // Get the current loading message
        const currentMessage = HEADER.LOADING_SCREEN_MESSAGES[this.loadingMessageIndex % HEADER.LOADING_SCREEN_MESSAGES.length];
        
        // Define text box dimensions
        const textBoxWidth = canvasSize * 0.8; // 80% of canvas width
        const textBoxHeight = canvasSize * 0.3; // 30% of canvas height
        
        // For debugging - uncomment to see the text box boundaries
        // this.sketch.noFill();
        // this.sketch.stroke(255, 50);
        // this.sketch.rect(canvasSize / 2, canvasSize / 2, textBoxWidth, textBoxHeight);
        
        // Draw the message directly at the center of the canvas
        this.sketch.text(
            currentMessage,
            canvasSize / 2, // Center X
            canvasSize / 2, // Center Y
            textBoxWidth,
            textBoxHeight
        );
        
        this.sketch.pop();
    }

    public draw(): void {
        // Clear the background
        this.sketch.background(0);

        // Draw the spinner, title, and loading message
        this.spinner.draw();
        this.drawTitle();
        this.drawLoadingMessage();

        // Check for the transition Timer to start the transition out
        if (this.transitionTimer <= 0) {
            // If the connection has been established, start the transition out   
            this.transitionOutActive = true;
            this.keylistener.deactivate();
            this.transitionTimer = FRAMERATE * 3;
        }

        // Handle transitions
        if (this.transitionInActive) {
            this.animateTransitionIn();
        } else if (this.transitionOutActive) {
            this.animateTransitionOut();
        } else if (this.proceed) {
            this.transitionTimer--;
        }

        // Animate the loading dots and message
        this.animateLoading();
    }
}
