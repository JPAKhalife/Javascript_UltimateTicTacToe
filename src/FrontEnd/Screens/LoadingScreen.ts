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
import { whiteTicTac, getCanvasSize, HEADER, fontRobot, fontminecraft, getRandomInt, fontAldoApache, FRAMERATE } from "../sketch";
import WebManager from "../WebManager";
import GuiManager from "../GuiManager";

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
    private transitionInActive: boolean;
    private transitionOutActive: boolean;
    private transitionTimer: number;
    private webManager: WebManager;
    private proceed: boolean;
    private nextScreen: Screens;
    private titleText: string;
    private args: any[];

    constructor(sketch: p5, nextScreen?: Screens, titleText?: string, loadingAction?: () => void, proceedCondition?: () => boolean, ...args: any[]) {
        this.sketch = sketch;
        this.args = args;
        this.keylistener = new KeyListener(this.sketch);
        this.webManager = WebManager.getInstance();
        this.titleText = titleText || HEADER.LOADING_SCREEN_TITLE_MESSAGES[0];
        this.nextScreen = nextScreen || Screens.START_SCREEN;

        // Spinner properties
        this.spinner = new Img(whiteTicTac, getCanvasSize() * 0.10, getCanvasSize() * 0.10, this.sketch, 0, 0);
        this.spinner.setRectOrientation(this.sketch.CENTER);
        this.spinner.setImageOrientation(this.sketch.CENTER);
        this.spinner.setAngleMode(this.sketch.RADIANS);
        this.spinner.translate((getCanvasSize() / 8) * (-1), (getCanvasSize() / 8) * 7);
        this.spinnerAngle = 0;
        this.spinnerOpacity = 0;

        // Title properties
        this.title = new Text(this.titleText + HEADER.DOTS[0], getCanvasSize() / 2, getCanvasSize() / 5, this.sketch, getCanvasSize() * 0.07, fontRobot, this.sketch.color(255, 255, 255));
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

        // Transition markers
        this.transitionInActive = false;
        this.transitionOutActive = false;

        // Frame counter for animations
        this.frameCounter = 0;
        this.transitionTimer = FRAMERATE * 3;

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
        this.spinnerOpacity = 0;
        this.titleOpacity = 0;
        this.transitionInActive = true;
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
            this.transitionInActive = false;
        }
    }

    /**
     * @method animateTransitionOut
     * @description This method is responsible for animating the transition out of the loading screen
     */
    private animateTransitionOut(): void 
    {
        this.titleOpacity -= 255 / (LOADING_TRANSITION_IN / 2);
        this.spinner.setTX(this.spinner.getTX() - (getCanvasSize()) / (LOADING_TRANSITION_IN / 2));
        this.title.setFill(this.sketch.color(255, 255, 255, this.titleOpacity));
        this.loadingMessage.setFill(this.sketch.color(255, 255, 255, this.titleOpacity));
        if (this.titleOpacity <= 0 && this.spinner.getTX() <= 0 - this.spinner.getWidth()) {
            this.transitionOutActive = false;
            this.keylistener.activate();
            GuiManager.changeScreen(this.nextScreen, this.sketch, this.args);
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
            this.title.setText(this.titleText + HEADER.DOTS[this.titleDotIndex % HEADER.DOTS.length]);
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

        //Check for the transition Timer to start the transition out
        if (this.transitionTimer <= 0) {
                //If the connection has been established, start the transition out   
                this.transitionOutActive = true;
                this.keylistener.deactivate();
                this.transitionTimer = FRAMERATE * 3;
        }

        //Check for the transitions
        if (this.transitionInActive) {
            this.animateTransitionIn();
        } else if (this.transitionOutActive) {
            this.animateTransitionOut();
        } else if (this.proceed) {
            this.transitionTimer--;
        }
        this.animateLoading();
    }

    public resize(): void {
    }
}
