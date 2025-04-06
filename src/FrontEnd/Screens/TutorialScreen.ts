/**
 * @file TutorialScreen.ts
 * @description //This file is responsible for drawing the tutorial screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import GuiManager from "../GuiManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import { Img, ShapeGroup, Text } from "../ShapeWrapper";
import { tictacboard, getCanvasSize, tictacboard_two, tictacboard_three, fontOSDMONO } from "../sketch";

const TUTORIAL_SCREEN_TRANSITION_TIME =  60;

export default class TutorialScreen implements Menu {

    private sketch: p5
    private keylistener: KeyListener;
    private screenState: [number, number];
    private tutorialImages: Img[];
    private paragraphs: ShapeGroup[];
    private transitioning: boolean;
    private transitionIn: boolean;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);
        //There are multiple screens in one for this screen. We will have a single cutscene that is used to transition between all of them.
        this.screenState = [0, 0]; // [current screen index, opacity]
        //This array is used for all of the images on each screen
        this.tutorialImages = [
            new Img(tictacboard,getCanvasSize()*0.4,getCanvasSize()*0.4 ,this.sketch, getCanvasSize()/2, getCanvasSize()/20*9),
            new Img(tictacboard_two, getCanvasSize()*0.4,getCanvasSize()*0.4,this.sketch,getCanvasSize()/2, getCanvasSize()/20*9),
            new Img(tictacboard_three,getCanvasSize()*0.4,getCanvasSize()*0.4,this.sketch,getCanvasSize()/2,getCanvasSize()/20*9)
        ];
        for (let i = 0 ; i < this.tutorialImages.length ; i++) {
            this.tutorialImages[i].setRectOrientation(this.sketch.CENTER);
            this.tutorialImages[i].setImageOrientation(this.sketch.CENTER);
            this.tutorialImages[i].setTint(this.sketch.color(255,255));
        }
    
        //This array will contain all of the paragraphs for each screen
        this.paragraphs = [ 
        new ShapeGroup(
            new Text("The Bigtictactoe board consists of one large tictactoe grid.",getCanvasSize()/2,getCanvasSize()/10*1,this.sketch),
            new Text("Each slot in the grid contains one smaller tictactoe grid.",getCanvasSize()/2,getCanvasSize()/10*2,this.sketch),
            new Text("The goal of the game is to get three points in a row on the large board.",getCanvasSize()/2,getCanvasSize()/10*7,this.sketch),
            new Text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4,this.sketch)),
        new ShapeGroup(
            new Text("To start, player one can choose anyone of the small grids to play in.",getCanvasSize()/2,getCanvasSize()/10,this.sketch),
            new Text("They are then able to mark anywhere in that small grid.",getCanvasSize()/2,getCanvasSize()/10*2,this.sketch),
            new Text("The next player will then be sent to the corresponding area on the large grid.",getCanvasSize()/2,getCanvasSize()/10*7,this.sketch),
            new Text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4,this.sketch)),
        new ShapeGroup (
            new Text("The player can then choose any grid to play in if the grid they are sent to is taken.",getCanvasSize()/2,getCanvasSize()/10,this.sketch),
            new Text("When a small grid is won, it becomes unable to be played in.",getCanvasSize()/2,getCanvasSize()/10*2,this.sketch),
            new Text("That is everything! Have Fun!",getCanvasSize()/2,getCanvasSize()/10*7,this.sketch),
            new Text('Press space to continue.',getCanvasSize()/2,getCanvasSize()/5*4,this.sketch))
        ]
        for (let i = 0 ; i < this.paragraphs.length ; i++) {
            this.paragraphs[i].callFunctionOnAll("setFill", this.sketch.color(255,255,255,0));
            this.paragraphs[i].callFunctionOnAll("setTextSize",getCanvasSize()*0.02);
            this.paragraphs[i].callFunctionOnAll("setFont",fontOSDMONO);
            this.paragraphs[i].callFunctionOnAll("setRectOrientation",this.sketch.CENTER);
            this.paragraphs[i].callFunctionOnAll("setTextOrientation",this.sketch.CENTER,this.sketch.CENTER);
        }
    
        this.transitioning = false;
        this.transitionIn = true;
        this.startTransition();
    }

    private handleTransition(): void {
        if (this.transitioning) {
            if (this.transitionIn) {
                if (this.screenState[1] < 255) {
                    this.screenState[1] += 255 / TUTORIAL_SCREEN_TRANSITION_TIME;
                } else {
                    this.transitionIn = false;
                    this.transitioning = false;
                    this.keylistener.activate();
                }
            } else {
                if (this.screenState[1] > 0) {
                    this.screenState[1] -= 255 / TUTORIAL_SCREEN_TRANSITION_TIME;
                } else {
                    this.transitionIn = true;
                    if (this.screenState[0] >= this.tutorialImages.length - 1) {
                        GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
                    } else {
                        this.screenState[1] = 0;
                        this.screenState[0]++;
                    }
                }
            }
        }
    }

    private startTransition(): void {
        this.transitioning = true;
        this.keylistener.deactivate();
    }

    public draw(): void {
        this.sketch.background(0);
        this.tutorialImages[this.screenState[0]].setTint(this.sketch.color(255, this.screenState[1]));
        this.tutorialImages[this.screenState[0]].render();
        this.paragraphs[this.screenState[0]].callFunctionOnAll("setFill", this.sketch.color(255, this.screenState[1]));
        this.paragraphs[this.screenState[0]].callFunctionOnAll("render");
        this.handleTransition();

        if (this.keylistener.listen() === KEY_EVENTS.SELECT && !this.transitioning) {
            this.startTransition();
        }
    }

    public resize(): void {

    }
}