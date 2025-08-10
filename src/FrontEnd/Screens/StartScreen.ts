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
    
    // Position properties
    private titleX: number;
    private titleY: number;
    private authorX: number;
    private authorY: number;
    private startMessageX: number;
    private startMessageY: number;
    
    // Text size properties
    private titleSize: number;
    private authorSize: number;
    private startMessageSize: number;
    
    // Color properties
    private titleColor: p5.Color;
    private authorColor: p5.Color;
    private startMessageColor: p5.Color;
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
        
        // Set positions
        this.titleX = getCanvasSize()/2;
        this.titleY = getCanvasSize()/5;
        this.authorX = getCanvasSize()/2;
        this.authorY = getCanvasSize()/10*3;
        this.startMessageX = getCanvasSize()/2;
        this.startMessageY = getCanvasSize()/2;
        
        // Set text sizes
        this.titleSize = getCanvasSize()*0.05;
        this.authorSize = getCanvasSize()*0.05;
        this.startMessageSize = getCanvasSize()*0.05;
        
        // Set colors
        this.titleColor = sketch.color(255, 255, 255);
        this.authorColor = sketch.color(127, 127, 127);
        this.startMessageColor = sketch.color(200, 200, 200);
        this.startMessageAlpha = 255;

        //This is a variable to keep track of the sin function.
        this.s = 0;
    }

    public draw(): void {
        this.sketch.background(0);

        // Set text properties and render title
        this.sketch.textFont(fontPointless);
        this.sketch.textSize(this.titleSize);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.angleMode(this.sketch.RADIANS);
        this.sketch.fill(this.titleColor);
        this.sketch.text(this.titleText, this.titleX, this.titleY);
        
        // Render author
        this.sketch.textFont(fontAldoApache);
        this.sketch.textSize(this.authorSize);
        this.sketch.fill(this.authorColor);
        this.sketch.text(this.authorText, this.authorX, this.authorY);
        
        // Render start message
        this.sketch.textFont(fontSquareo);
        this.sketch.textSize(this.startMessageSize);
        this.sketch.fill(this.startMessageColor);
        // Apply alpha to the start message
        this.sketch.fill(
            this.sketch.red(this.startMessageColor),
            this.sketch.green(this.startMessageColor),
            this.sketch.blue(this.startMessageColor),
            this.startMessageAlpha
        );
        this.sketch.text(this.startMessageText, this.startMessageX, this.startMessageY);
    
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
        } else if (this.startMessageY < getCanvasSize() * -1) {
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
        const animOffset = getCanvasSize() * this.sketch.sin((this.animationCounter + (100 * this.sketch.asin(3/4) + 200 * this.sketch.PI)) / 100) - getCanvasSize() / 4 * 3;
        
        // Set the y of all three titles - they all move at the same speed
        this.titleY = getCanvasSize() / 5 + animOffset;
        this.authorY = getCanvasSize() / 10 * 3 + animOffset;
        this.startMessageY = getCanvasSize() / 2 + animOffset;
        
        this.animationCounter += 2;
        
        // Increase the flashing of the bottom titles
        this.startMessageAlpha = 128 * this.sketch.sin(this.sketch.millis() / 50);
    }

    public resize(): void {

    }
}
