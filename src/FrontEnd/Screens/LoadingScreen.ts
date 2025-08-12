/**
 * @file LoadingScreen.ts
 * @description This file is responsible for drawing the loading screen
 * @author John Khalife (refactored by Cline)
 * @created 2024-06-9
 * @updated 2025-08-12
 */

import p5 from "p5";
import { Screens } from "../Menu";
import { whiteTicTac, getCanvasSize, HEADER, fontRobot, fontAldoApache, FRAMERATE } from "../sketch";
import GuiManager from "../GuiManager";
import LoadingSpinner from "../MenuObjects/LoadingSpinner";
import TransitionableScreen from "./TransitionableScreen";

// Constants for the loading screen
const LOADING_TRANSITION_IN = 180;

// Text sizes as percentages of canvas size
const TEXT_SIZES = {
    TITLE: 0.07,      // Title text size
    MESSAGE: 0.03     // Loading message text size
};

export default class LoadingScreen extends TransitionableScreen {
    private spinner: LoadingSpinner;
    private titleOpacity: number;
    private loadingMessageIndex: number;
    private titleDotIndex: number;
    private frameCounter: number;
    private transitionTimer: number;
    private proceed: boolean;
    private finalNextScreen: Screens;
    private titleText: string;
    private args: any[];
    private loadingAction?: () => void;
    private proceedCondition?: () => boolean;

    constructor(sketch: p5, nextScreen?: Screens, titleText?: string, loadingAction?: () => void, proceedCondition?: () => boolean, ...args: any[]) {
        // Initialize with custom options - no border, we'll handle our own transitions
        super(sketch, {
            useBorder: false,
            fadeContent: false
        });
        
        this.args = args || [];
        this.titleText = titleText || HEADER.LOADING_SCREEN_TITLE_MESSAGES[0];
        this.finalNextScreen = nextScreen || Screens.START_SCREEN;
        this.loadingAction = loadingAction;
        this.proceedCondition = proceedCondition;

        // Create spinner with custom animation
        this.spinner = new LoadingSpinner(sketch, -0.125, 0.875, 0.10, whiteTicTac, (counter: number) => {
            this.sketch.angleMode(this.sketch.DEGREES);
            return 255 / 2 * this.sketch.cos(counter) + 255 / 2;
        }, 3);

        // Initialize animation properties
        this.titleOpacity = 0;
        this.titleDotIndex = 0;
        this.loadingMessageIndex = 0;
        this.frameCounter = 0;
        this.transitionTimer = FRAMERATE * 3;

        // Override transition state to use our custom transitions
        this.transitionInActive = true;
        this.transitionOutActive = false;

        // Execute loading action if provided
        if (this.loadingAction) {
            this.loadingAction();
        }

        this.proceed = true;
        // If proceedCondition is provided, use it to determine when to proceed
        if (this.proceedCondition) {
            this.proceed = false;
            this.checkProceedCondition();
        }
    }

    private checkProceedCondition(): void {
        if (this.proceedCondition && this.proceedCondition()) {
            this.proceed = true;
        } else if (this.proceedCondition) {
            setTimeout(() => this.checkProceedCondition(), 100); // Check again after 100ms
        }
    }
    protected transitionIn(): void {
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
     * @method transitionOut
     * @description Custom transition out animation for the loading screen
     * Overrides the parent class method
     */
    protected transitionOut(): void {
        this.titleOpacity -= 255 / (LOADING_TRANSITION_IN / 2);
        this.spinner.setX(this.spinner.getXPercent() - 1 / (LOADING_TRANSITION_IN / 2));

        if (this.titleOpacity <= 0 && this.spinner.getXPercent() <= 0 - this.spinner.getWidthPercent()) {
            this.transitionOutActive = false;
            this.onTransitionOutComplete();
        }
    }

    /**
     * @method onTransitionOutComplete
     * @description Called when transition out is complete
     * Overrides the parent class method
     */
    protected onTransitionOutComplete(): void {
        this.keylistener.activate();
        GuiManager.changeScreen(this.finalNextScreen, this.sketch, ...this.args);
    }

    /**
     * @method animateLoading
     * @description Animates the loading dots and message
     */
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

    /**
     * @method drawContent
     * @description Draws the loading screen content
     */
    protected drawContent(): void {
        // Draw the spinner
        this.spinner.draw();
        
        // Draw title
        this.drawTitle();
        
        // Draw loading message
        this.drawLoadingMessage();
        
        // Check for the transition Timer to start the transition out
        if (this.transitionTimer <= 0 && this.proceed && !this.transitionOutActive && !this.transitionInActive) {
            // If the connection has been established, start the transition out   
            this.transitionOutActive = true;
            this.keylistener.deactivate();
            this.transitionTimer = FRAMERATE * 3;
        } else if (!this.transitionOutActive && !this.transitionInActive && this.proceed) {
            this.transitionTimer--;
        }

        // Animate the loading dots and message
        this.animateLoading();
    }

    /**
     * @method drawTitle
     * @description Draws the title with animated dots
     */
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

    /**
     * @method drawLoadingMessage
     * @description Draws the loading message
     */
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

    /**
     * @method handleInput
     * @description Handles user input
     * Required by TransitionableScreen but not used in this screen
     */
    protected handleInput(): void {
        // No input handling needed for loading screen
    }
}
