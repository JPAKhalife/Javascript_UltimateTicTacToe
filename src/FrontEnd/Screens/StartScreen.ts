/**
 * @file StartScreen.ts
 * @description //This file is responsible for drawing the Start screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


import p5 from "p5";
import GuiManager from "../GuiManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import { HEADER, getCanvasSize, fontPointless, fontAldoApache, fontSquareo } from "../sketch";

export default class StartScreen implements Menu {
    // Static property to track if animation is playing
    private static isPlaying: boolean = false;

    private sketch: p5;
    private keylistener: KeyListener;
    
    // Text properties
    private titleText: string;
    private authorText: string;
    private startMessageText: string;
    
    private animOffset: number;
    
    // Alpha value for start message - needed for animation
    private startMessageAlpha: number;
    
    private s: number;
    
    // Animation properties
    private animationActive: boolean = false;
    private animationCounter: number = 0;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);
        
        // Set text content
        this.titleText = HEADER.START_SCREEN_TITLE;
        this.authorText = HEADER.START_SCREEN_AUTHOR;
        this.startMessageText = HEADER.START_SCREEN_MESSAGE;
        this.animOffset = 0;
        
        // Set alpha for start message
        this.startMessageAlpha = 255;

        //This is a variable to keep track of the sin function.
        this.s = 0;
    }

    public draw(): void {
        this.sketch.background(0);

        // Set text properties and render title
        this.sketch.textFont(fontPointless);
        this.sketch.textSize(getCanvasSize()*0.05);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.angleMode(this.sketch.RADIANS);
        this.sketch.fill(this.sketch.color(255, 255, 255));
        this.sketch.text(this.titleText, getCanvasSize() / 2, getCanvasSize() / 5 + this.animOffset); 
        
        // Render author
        this.sketch.textFont(fontAldoApache);
        this.sketch.textSize(getCanvasSize()*0.05);
        this.sketch.fill(this.sketch.color(127, 127, 127)); 
        this.sketch.text(this.authorText, getCanvasSize() / 2, getCanvasSize() / 10 * 3 + this.animOffset); 
        
        // Render start message
        this.sketch.textFont(fontSquareo);
        this.sketch.textSize(getCanvasSize()*0.05); 
        const startMessageColor = this.sketch.color(200, 200, 200);
        this.sketch.fill(startMessageColor);
        // Apply alpha to the start message
        this.sketch.fill(
            this.sketch.red(startMessageColor),
            this.sketch.green(startMessageColor),
            this.sketch.blue(startMessageColor),
            this.startMessageAlpha
        );
        this.sketch.text(this.startMessageText, getCanvasSize() / 2, getCanvasSize() / 2 + this.animOffset); 
    
        //Check for animation conditions and run animation if active
        this.checkAnimationConditions();
        if (this.animationActive) {
            this.runAnimation();
        }
    }

    /**
     * Checks conditions for starting or ending the animation
     */
    private checkAnimationConditions(): void {
        if ((this.keylistener.listen() == KEY_EVENTS.SELECT) && (!StartScreen.isPlaying)) {
            this.activateAnimation();
            this.keylistener.deactivate();
        } else if ((getCanvasSize() / 2 + this.animOffset) < getCanvasSize() * -1) {
            this.deactivateAnimation();
            GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
        } else {
            this.startMessageAlpha = 128 + 128 * this.sketch.sin(this.sketch.millis() / 500);
        }
    }

    /**
     * Activates the animation
     */
    private activateAnimation(): void {
        this.animationActive = true;
        StartScreen.isPlaying = true;
    }

    /**
     * Deactivates the animation
     */
    private deactivateAnimation(): void {
        this.animationActive = false;
        StartScreen.isPlaying = false;
    }

    /**
     * Runs the animation
     */
    private runAnimation(): void {
        // Calculate the animation offset
        this.animOffset = getCanvasSize() * this.sketch.sin((this.animationCounter + (100 * this.sketch.asin(3/4) + 200 * this.sketch.PI)) / 100) - getCanvasSize() / 4 * 3;
        
        this.animationCounter += 2;
        
        // Increase the flashing of the bottom titles
        this.startMessageAlpha = 128 * this.sketch.sin(this.sketch.millis() / 50);
    }
}
