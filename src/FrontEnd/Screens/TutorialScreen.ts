/**
 * @file TutorialScreen.ts
 * @description This file is responsible for drawing the tutorial screen
 * @author John Khalife (refactored by Cline)
 * @created 2024-06-9
 * @updated 2025-08-12
 */

import p5 from "p5";
import { KEY_EVENTS } from "../KeyListener";
import { Screens } from "../Menu";
import { tictacboard, getCanvasSize, tictacboard_two, tictacboard_three, fontOSDMONO } from "../sketch";
import TransitionableScreen from "./TransitionableScreen";

const TUTORIAL_SCREEN_TRANSITION_TIME = 60;

export default class TutorialScreen extends TransitionableScreen {
    // Screen state: [current screen index, screen content opacity]
    private screenState: [number, number];
    private internalTransitioning: boolean;
    private internalTransitioningIn: boolean;
    
    // Store just the image references
    private tutorialImages: p5.Image[];
    
    // Define a type for text entries: [text, x-position, y-position]
    private paragraphTexts: Array<Array<[string, number, number]>>;

    constructor(sketch: p5) {
        // Initialize with no border since we'll handle our own transitions
        super(sketch, {
            useBorder: false,
            fadeContent: false,
            animationTime: TUTORIAL_SCREEN_TRANSITION_TIME
        });
        
        // Initialize screen state
        this.screenState = [0, 0]; // [current screen index, opacity]
        this.internalTransitioning = true;
        this.internalTransitioningIn = true;
        
        // Store just the image references
        this.tutorialImages = [
            tictacboard,
            tictacboard_two,
            tictacboard_three
        ];
        
        // Store text content as arrays of strings with positions as percentages of canvas size
        this.paragraphTexts = [
            [
                ["The Bigtictactoe board consists of one large tictactoe grid.", 0.5, 0.1],
                ["Each slot in the grid contains one smaller tictactoe grid.", 0.5, 0.2],
                ["The goal of the game is to get three points in a row on the large board.", 0.5, 0.7],
                ["Press space to continue.", 0.5, 0.8]
            ],
            [
                ["To start, player one can choose anyone of the small grids to play in.", 0.5, 0.1],
                ["They are then able to mark anywhere in that small grid.", 0.5, 0.2],
                ["The next player will then be sent to the corresponding area on the large grid.", 0.5, 0.7],
                ["Press space to continue.", 0.5, 0.8]
            ],
            [
                ["The player can then choose any grid to play in if the grid they are sent to is taken.", 0.5, 0.1],
                ["When a small grid is won, it becomes unable to be played in.", 0.5, 0.2],
                ["That is everything! Have Fun!", 0.5, 0.7],
                ["Press space to continue.", 0.5, 0.8]
            ]
        ];
    }

    /**
     * @method handleInternalTransition
     * @description Handles transitions between tutorial screens
     */
    private handleInternalTransition(): void {
        if (this.internalTransitioning) {
            if (this.internalTransitioningIn) {
                if (this.screenState[1] < 255) {
                    this.screenState[1] += 255 / TUTORIAL_SCREEN_TRANSITION_TIME;
                } else {
                    this.internalTransitioningIn = false;
                    this.internalTransitioning = false;
                    this.keylistener.activate();
                }
            } else {
                if (this.screenState[1] > 0) {
                    this.screenState[1] -= 255 / TUTORIAL_SCREEN_TRANSITION_TIME;
                } else {
                    if (this.screenState[0] >= this.tutorialImages.length - 1) {
                        // If we've shown all screens, transition out to setup screen
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
     * @method startInternalTransition
     * @description Starts the transition between tutorial screens
     */
    private startInternalTransition(): void {
        this.internalTransitioning = true;
        this.internalTransitioningIn = false;
        this.keylistener.deactivate();
    }

    /**
     * @method drawContent
     * @description Draws the tutorial screen content
     */
    protected drawContent(): void {
        // Get the current screen index and opacity
        const currentScreenIndex = this.screenState[0];
        const opacity = this.screenState[1];
        
        // Draw image
        this.sketch.push();
        this.sketch.imageMode(this.sketch.CENTER);
        this.sketch.tint(255, opacity);
        const imgX = getCanvasSize() * 0.5;  // 50% of canvas width
        const imgY = getCanvasSize() * 0.45; // 45% of canvas height
        const imgSize = getCanvasSize() * 0.4; // 40% of canvas size
        this.sketch.image(this.tutorialImages[currentScreenIndex], imgX, imgY, imgSize, imgSize);
        this.sketch.pop();
        
        // Draw text paragraphs
        this.sketch.push();
        this.sketch.textFont(fontOSDMONO);
        this.sketch.textSize(getCanvasSize() * 0.02);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.fill(255, opacity);
        
        const currentTexts = this.paragraphTexts[currentScreenIndex];
        for (const textInfo of currentTexts) {
            const [text, xPercent, yPercent] = textInfo;
            // Convert percentage coordinates to actual pixel coordinates
            const x = getCanvasSize() * xPercent;
            const y = getCanvasSize() * yPercent;
            this.sketch.text(text, x, y);
        }
        this.sketch.pop();
        
        // Handle internal transitions between screens
        this.handleInternalTransition();
    }

    /**
     * @method handleInput
     * @description Handles user input
     */
    protected handleInput(): void {
        if (this.keylistener.listen() === KEY_EVENTS.SELECT && !this.internalTransitioning) {
            this.startInternalTransition();
        }
    }
}
