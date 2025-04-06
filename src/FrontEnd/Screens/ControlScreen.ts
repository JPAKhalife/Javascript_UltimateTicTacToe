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
import {Text, Img, ShapeGroup } from "../ShapeWrapper";
import { arrows, fontOSDMONO, getCanvasSize, space, wasd } from "../sketch";
import Cutscene from "../Cutscene";
import GuiManager from "../GuiManager";

const CONTROL_SCREEN_TRANSITION_TIME =  60;


export default class ControlScreen implements Menu {

    private keylistener: KeyListener;
    private sketch: p5;
    private screenState: [number, number];
    private tutorialImages: ShapeGroup[];
    private paragraphs: ShapeGroup[];
    private transitioning: boolean;
    private transitioningIn: boolean;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);
        this.screenState = [0, 0]; // First is value, second is opacity
        this.transitioning = false;
        this.transitioningIn = true;

        this.tutorialImages = [
            new ShapeGroup(new Img(arrows, 100, 150, this.sketch, getCanvasSize() * 0.25, getCanvasSize() / 2), new Img(wasd,100, 150, this.sketch, getCanvasSize() / 4 * 3, getCanvasSize() / 2)),
            new ShapeGroup(new Img(space, 100, 150, this.sketch, getCanvasSize() / 2, getCanvasSize() / 2))
        ];
        for (let i = 0; i < this.tutorialImages.length; i++) {
            this.tutorialImages[i].callFunctionOnAll('setRectOrientation', this.sketch.CENTER);
            this.tutorialImages[i].callFunctionOnAll('setImageOrientation', this.sketch.CENTER);
            this.tutorialImages[i].callFunctionOnAll('setTint', 0);
        }

        this.paragraphs = [
            new ShapeGroup(
                new Text('Use the WASD and/or Arrow keys to navigate through menus and the Ultimate Tictactoe grid.', getCanvasSize() / 2, getCanvasSize() / 5 * 2, this.sketch),
                new Text('Press space to continue', getCanvasSize() / 2, getCanvasSize() / 4 * 2, this.sketch)),
            new ShapeGroup(
                new Text('Press space to select in the menus or play a spot on the Ultimate Tictactoe Grid.', getCanvasSize() / 2, getCanvasSize() / 5 * 2, this.sketch),
                new Text('Press space to continue', getCanvasSize() / 2, getCanvasSize() / 5 * 3, this.sketch))
        ];
        for (let i = 0; i < this.paragraphs.length; i++) {
            this.paragraphs[i].callFunctionOnAll("setFill", 255, 255, 255, 0);
            this.paragraphs[i].callFunctionOnAll("setTextSize", getCanvasSize() * 0.02);
            this.paragraphs[i].callFunctionOnAll("setFont", fontOSDMONO);
            this.paragraphs[i].callFunctionOnAll("setRectOrientation", this.sketch.CENTER);
            this.paragraphs[i].callFunctionOnAll("setTextOrientation", this.sketch.CENTER, this.sketch.CENTER);
            this.paragraphs[i].callFunctionOnAll("setTextBox", getCanvasSize() / 4 * 3, getCanvasSize() / 4 * 1);
        }

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
                    if (this.screenState[0] >= this.tutorialImages.length - 1) {
                        GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
                    } else {
                        this.screenState[0]++;
                        this.screenState[1] = 0;
                        this.transitioningIn = true;
                    }
                }
            }

            this.tutorialImages[this.screenState[0]].callFunctionOnAll('setTint', this.screenState[1]);
            this.paragraphs[this.screenState[0]].callFunctionOnAll('setTint', this.sketch.color(255,this.screenState[1]));
            this.paragraphs[this.screenState[0]].callFunctionOnAll('setFill', this.sketch.color(255,this.screenState[1]));
        }
    }

    public draw(): void {
        this.sketch.background(0);

        this.tutorialImages[this.screenState[0]].callFunctionOnAll('render');
        this.paragraphs[this.screenState[0]].callFunctionOnAll('render');

        this.handleTransition();

        if (this.keylistener.listen() == KEY_EVENTS.SELECT) {
            this.transitioning = true;
        }
    }

    public resize(): void {
    }
}
