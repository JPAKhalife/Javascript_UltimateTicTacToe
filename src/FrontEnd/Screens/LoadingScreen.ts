/**
 * @file LoadingScreen.ts
 * @description //This file is responsible for drawing the loading screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import Menu, { Screens } from "../Menu"
import KeyListener from "../KeyListener";
import {Text, Img } from "../ShapeWrapper";
import { whiteTicTac, getCanvasSize, HEADER, fontRobot, fontminecraft, getRandomInt, fontAldoApache } from "../sketch";
import WebManager from "../WebManager";

//Constants for the loading screen
const LOADING_TRANSITION_IN = 180;

export default class LoadingScreen implements Menu {

    private sketch: p5;
    private keylistener: KeyListener;
    private spinner: Img;
    private title: Text;
    private loadingMessage: Text;
    private spinnerAngle: number;
    private spinnerOpacity: number;
    private titleOpacity: number;
    private loadingMessageIndex: number;
    private titleDotIndex: number;
    private frameCounter: number;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);

        // Spinner properties
        this.spinner = new Img(whiteTicTac, getCanvasSize() * 0.10, getCanvasSize() * 0.10, this.sketch,0, 0);
        this.spinner.setRectOrientation(this.sketch.CENTER);
        this.spinner.setImageOrientation(this.sketch.CENTER);
        this.spinner.setAngleMode(this.sketch.RADIANS);
        this.spinner.translate((getCanvasSize() / 8) * (-1), (getCanvasSize() / 8) * 7);
        this.spinnerAngle = 0;
        this.spinnerOpacity = 0;

        // Title properties
        this.title = new Text(HEADER.LOADING_SCREEN_TITLE_MESSAGES[0] + HEADER.DOTS[0], getCanvasSize() / 2, getCanvasSize() / 5, this.sketch, getCanvasSize() * 0.07, fontRobot, this.sketch.color(255, 255, 255));
        this.title.setFill(this.sketch.color(255, 255, 255, 0));
        this.title.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.titleOpacity = 0;
        this.titleDotIndex = 0;

        // Loading message properties
        this.loadingMessage = new Text(HEADER.LOADING_SCREEN_MESSAGES[0], getCanvasSize() / 2, getCanvasSize() / 2, this.sketch, getCanvasSize() * 0.03, fontminecraft, this.sketch.color(255, 255, 255));
        this.loadingMessage.setFill(this.sketch.color(255, 255, 255, 0));
        this.loadingMessage.setRectOrientation(this.sketch.CENTER);
        this.loadingMessage.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.loadingMessage.setTextBox(getCanvasSize(), getCanvasSize());
        this.loadingMessageIndex = 0;

        // Frame counter for animations
        this.frameCounter = 0;

        // Start transition in animation
        this.keylistener.deactivate();
        this.startTransitionIn();
    }

    private startTransitionIn(): void {
        this.spinnerOpacity = 0;
        this.titleOpacity = 0;
    }

    private animateTransitionIn(): void {
        if (this.spinner.getTX() < (getCanvasSize() / 8 * 7)) {
            this.spinner.setTX(this.spinner.getTX() + (getCanvasSize()) / (LOADING_TRANSITION_IN / 2));
        } else if (this.titleOpacity < 255) {
            this.title.setFill(this.sketch.color(255, 255, 255, this.titleOpacity));
            this.loadingMessage.setFill(this.sketch.color(255, 255, 255, this.titleOpacity));
            this.titleOpacity += 255 / (LOADING_TRANSITION_IN / 2);
        } else {
            this.keylistener.activate();
        }
    }

    private animateLoading(): void {
        this.spinner.setAngleMode(this.sketch.DEGREES);
        this.spinner.setOrientation(this.spinnerAngle);
        this.spinner.setTint(this.sketch.color(255,255 / 2 * this.sketch.cos(this.spinnerOpacity) + 255 / 2));
        this.spinnerOpacity += 2;
        this.spinnerAngle += 3;

        if ((this.frameCounter / 3) % 60 === 0) {
            this.titleDotIndex++;
            this.title.setText(HEADER.LOADING_SCREEN_TITLE_MESSAGES[0] + HEADER.DOTS[this.titleDotIndex % HEADER.DOTS.length]);
        }

        if ((this.frameCounter / 3) % 240 === 0) {
            this.loadingMessageIndex++;
            this.loadingMessage.setFont(fontAldoApache);
            this.loadingMessage.setText(HEADER.LOADING_SCREEN_MESSAGES[this.loadingMessageIndex % HEADER.LOADING_SCREEN_MESSAGES.length]);
        }

        if ((this.frameCounter / 3) > 2147483645 / 3) {
            this.frameCounter = 0;
        }

        this.frameCounter++;
    }

    public draw(): void {
        this.sketch.background(0);
        this.spinner.render();
        this.title.render();
        this.loadingMessage.render();

        this.animateTransitionIn();
        this.animateLoading();
    }

    public resize(): void {
    }
}
