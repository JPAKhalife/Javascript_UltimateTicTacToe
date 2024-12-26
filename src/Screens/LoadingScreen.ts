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
import Cutscene from "../Cutscene";
import {Text, Img } from "../ShapeWrapper";
import { whiteTicTac, getCanvasSize, HEADER, fontRobot, fontminecraft, getRandomInt } from "../sketch";

//Constants for the loading screen
const LOADING_TRANSITION_IN = 180;

export default class LoadingScreen implements Menu {

    private sketch: p5;
    private keylistener: KeyListener;
    private spinner: Img;
    private title: Text;
    private loadingMessage: Text;
    private transition_in: Cutscene;
    private loadCutscene: Cutscene;

    

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);

        //This is the spinner that sits in the corner
        this.spinner = new Img(whiteTicTac,0,0,this.sketch,getCanvasSize()*0.10,getCanvasSize()*0.10);
        this.spinner.setRectOrientation(this.sketch.CENTER);
        this.spinner.setImageOrientation(this.sketch.CENTER);
        this.spinner.setAngleMode(this.sketch.RADIANS);
        this.spinner.trnslate((getCanvasSize() / 8)*(-1), (getCanvasSize() / 8)*7);
        
        //This is the title
        this.title = new Text(HEADER.LOADING_SCREEN_TITLE_MESSAGES[0]  + HEADER.DOTS[0],getCanvasSize()/2,getCanvasSize()/5,this.sketch,getCanvasSize()*0.07,fontRobot,this.sketch.color(255,255,255));
        this.title.setFill(sketch.color(255,255,255,0));
        this.title.setTextOrientation(this.sketch.CENTER,this.sketch.CENTER);
    
        //This is the loading message
        this.loadingMessage = new Text(HEADER.LOADING_SCREEN_MESSAGES[0],getCanvasSize()/2,getCanvasSize()/2,this.sketch,getCanvasSize()*0.03,fontminecraft,this.sketch.color(255,255,255));
        this.loadingMessage.setFill(sketch.color(255,255,255,0));
        this.loadingMessage.setRectOrientation(this.sketch.CENTER);
        this.loadingMessage.setTextOrientation(this.sketch.CENTER,this.sketch.CENTER);
        this.loadingMessage.setTextBox(getCanvasSize(),getCanvasSize())
        
        //This is the transition in cutscene
        this.transition_in = new Cutscene(this.keylistener,this.spinner,this.title,this.loadingMessage,(getCanvasSize()/2)/120,0);
    
        //Set the animation condition of the transition in cutscene.
        this.transition_in.setCondition(() => {
            //deactivate when title fades in
            if (this.transition_in.getShape(1).opacity >= 255) {
                this.transition_in.deactivate();
                this.keylistener.activate();
            }
    
        });
    
        //Set the animation of the transition in cutscene
        this.transition_in.setAnimation(() => {
            //Start by moving in the spinner
            if (this.transition_in.getShape(0).tx >= (getCanvasSize()/8*7)) {
                //Once the tic tac has reached its position, stop and fade in.
                this.transition_in.getShape(1).setFill(255,255,255,this.transition_in.getShape(4));
                this.transition_in.getShape(2).setFill(255,255,255,this.transition_in.getShape(4));
                this.transition_in.setShape(4,this.transition_in.getShape(4) + 255/(LOADING_TRANSITION_IN/2));
            } else {
                this.transition_in.getShape(0).tx += (getCanvasSize())/(LOADING_TRANSITION_IN/2);
            }
        });
    
        //Activate the transition in since we want it to be good
        this.keylistener.deactivate();
        this.transition_in.activate();
    
        //This is the loading cutscene, it will run constantly, regardless of other animations running.
        this.loadCutscene = new Cutscene(this.keylistener,this.spinner,0,0,getRandomInt(0,HEADER.LOADING_SCREEN_MESSAGES.length - 1),this.loadingMessage,0,this.title);
    
        // TODO: When the back end has been created, set the deactivate condition
    
        this.loadCutscene.setAnimation(() => {
            this.loadCutscene.getShape(0).rotateExact(this.loadCutscene.getShape(2),this.sketch.DEGREES);
            this.loadCutscene.getShape(0).setTint(255/2*this.sketch.cos(this.loadCutscene.getShape(1)) + 255/2);
            this.loadCutscene.setShape(1,this.loadCutscene.getShape(1) + 2);
            this.loadCutscene.setShape(2,this.loadCutscene.getShape(2) + 3);
            if ((this.loadCutscene.getShape(2)/3) % 60 == 0) {
                this.loadCutscene.setShape(5,this.loadCutscene.getShape(5) + 1);
                this.loadCutscene.getShape(6).setText(HEADER.LOADING_SCREEN_TITLE_MESSAGES[0]  + HEADER.DOTS[this.loadCutscene.getShape(5)%HEADER.DOTS.length]);
            } 
            if ((this.loadCutscene.getShape(2)/3) % 480 == 0) {
                this.loadCutscene.setShape(3,this.loadCutscene.getShape(3)+1);
                this.loadCutscene.getShape(4).setText(HEADER.LOADING_SCREEN_MESSAGES[this.loadCutscene.getShape(3)%HEADER.LOADING_SCREEN_MESSAGES.length]);
            }
            //Just so we don't get integer overflow if the loadind screen stays on too long,
            if ((this.loadCutscene.getShape(2)/3) > 2147483645/3) {
                this.loadCutscene.setShape(2,0);
            }
        });
    
        this.loadCutscene.activate();
        // TODO: Make an exit cutscene when it is neccessary
    }
    

    public draw(): void {
        this.sketch.background(0);
        this.spinner.render();
        this.title.render();
        this.loadingMessage.render();
        //Listen for our relevant cutscenes
        this.loadCutscene.listen();
        this.transition_in.listen();
    }

    public resize(): void {

    }
}
