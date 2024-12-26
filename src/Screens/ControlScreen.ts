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
    private changeScreen: Cutscene;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);
        //There are multiple screens in one for this screen. We will have a single cutscene that is used to transition between all of them.
        this.screenState = [0,0]; //First is value, second is opacity

        //This array is used for all of the images on each screen
        this.tutorialImages = [
            new ShapeGroup(new Img(arrows, getCanvasSize()*0.25,getCanvasSize()/2,this.sketch,150,100), new Img(wasd, getCanvasSize()/4*3, getCanvasSize()/2,this.sketch,150,100)),
            new ShapeGroup(new Img(space,getCanvasSize()/2,getCanvasSize()/2,this.sketch,150,100))
        // new ShapeGroup(Img,new Img(tictacboard_three,getCanvasSize()/2,getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4))
        ];
        for (let i = 0 ; i < this.tutorialImages.length ; i++) {
            this.tutorialImages[i].callFunctionOnAll('setRectOrientation',this.sketch.CENTER);
            this.tutorialImages[i].callFunctionOnAll('setImageOrientation',this.sketch.CENTER);
            this.tutorialImages[i].callFunctionOnAll('setTint',0);
        }

        //This array will contain all of the paragraphs for each screen
        this.paragraphs = [ 
        new ShapeGroup(
            new Text('Use the WASD and/or Arrow keys to navigate through menus and the Ultimate Tictactoe grid.',getCanvasSize()/2, getCanvasSize()/5*2,this.sketch),
            new Text('Press space to continue',getCanvasSize()/2 , getCanvasSize()/4*2,this.sketch)),
        new ShapeGroup(
            new Text('Press space to select in the menus or play a spot on the Ultimate Tictactoe Grid.',getCanvasSize()/2, getCanvasSize()/5*2,this.sketch),
            new Text('Press space to continue',getCanvasSize()/2, getCanvasSize()/5*3,this.sketch)),
        ];
        for (let i = 0 ; i < this.paragraphs.length ; i++) {
            this.paragraphs[i].callFunctionOnAll("setFill",255,255,255,0);
            this.paragraphs[i].callFunctionOnAll("setTextSize",getCanvasSize()*0.02);
            this.paragraphs[i].callFunctionOnAll("setFont",fontOSDMONO);
            this.paragraphs[i].callFunctionOnAll("setRectOrientation",this.sketch.CENTER);
            this.paragraphs[i].callFunctionOnAll("setTextOrientation",this.sketch.CENTER,this.sketch.CENTER);
            this.paragraphs[i].callFunctionOnAll("setTextBox",getCanvasSize()/4*3,getCanvasSize()/4*1);
        }

        //Now we need a transition animation for when the user presses space.
        this.changeScreen = new Cutscene(this.keylistener,this.tutorialImages,this.paragraphs,this.screenState,true);

        this.changeScreen.setCondition(() => {
            if (this.keylistener.listen() == KEY_EVENTS.SELECT && !Cutscene.isPlaying) {
                this.keylistener.deactivate();
                this.changeScreen.activate()
            }
        });

        this.changeScreen.setAnimation(() => {
            //Check if we are transitioning in
            if (this.changeScreen.getShape(3)) {
                //If we are, fade in
                if (this.changeScreen.getShape(2).opacity < 255) {
                    this.changeScreen.getShape(2).opacity += 255/CONTROL_SCREEN_TRANSITION_TIME;
                } else {
                    //Once we have completely faded in, set the transition in to false,
                    //And end the animation.
                    this.changeScreen.setShape(3,false);
                    this.changeScreen.deactivate();
                    this.keylistener.activate();
                }
            } else {
                //We are transitioning out
                if (this.changeScreen.getShape(2).opacity > 0) {
                    this.changeScreen.getShape(2).opacity -= 255/CONTROL_SCREEN_TRANSITION_TIME;
                } else {
                    //Once we have faded out, it is time to fade in.
                    this.changeScreen.setShape(3,true);
                    if (this.changeScreen.getShape(2).value >= this.changeScreen.getShape(0).length - 1) {
                        //If we are at the end, change the screen
                        this.changeScreen.deactivate();
                        this.keylistener.activate();
                        GuiManager.changeScreen(Screens.SETUP_SCREEN);
                    } else {
                        this.changeScreen.getShape(2).opacity = 0;
                        this.changeScreen.getShape(0)[this.changeScreen.getShape(2).value].callFunction('setTint',0);
                        this.changeScreen.getShape(1)[this.changeScreen.getShape(2).value].callFunction('setFill',255,255,255,0);
                        this.changeScreen.getShape(2).value++;
                    }
                }
            }
            //While the animation is going, set the tint no matter what
            this.changeScreen.getShape(0)[this.changeScreen.getShape(2).value].callFunction('setTint',this.changeScreen.getShape(2).opacity);
            this.changeScreen.getShape(1)[this.changeScreen.getShape(2).value].callFunction('setFill',255,255,255,this.changeScreen.getShape(2).opacity);
        });

        this.changeScreen.activate();

    }
    
    public draw(): void {
        this.sketch.background(0);

        //Render the proper image and text
        this.tutorialImages[this.screenState[0]].callFunctionOnAll('render');
        this.paragraphs[this.screenState[0]].callFunctionOnAll('render');

        //Listen for the transition animation
        this.changeScreen.listen();
    }

    public resize(): void {

    }
}
