/**
 * @file StartScreen.ts
 * @description //This file is responsible for drawing the Start screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


import p5 from "p5";
import Cutscene from "../Cutscene";
import GuiManager from "../GuiManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import { HEADER, getCanvasSize, fontPointless, fontAldoApache, fontSquareo } from "../sketch";
import {Text} from "../ShapeWrapper";

export default class StartScreen implements Menu {

    private sketch: p5;
    private keylistener: KeyListener;
    private title: Text;
    private author: Text;
    private startMessage: Text;
    private s: number;
    private startCutscene: Cutscene;
    private static id: Screens = Screens.START_SCREEN;


    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);

        //This is the text for the title
        this.title = new Text(HEADER.START_SCREEN_TITLE,getCanvasSize()/2,getCanvasSize()/5, this.sketch, getCanvasSize()*0.05 , fontPointless,this.sketch.color(255,255,255));
        this.title.setTextOrientation(this.sketch.CENTER,this.sketch.CENTER);
        this.title.setAngleMode(this.sketch.RADIANS);

        //This is the text for the author
        this.author = new Text(HEADER.START_SCREEN_AUTHOR,getCanvasSize()/2,getCanvasSize()/10*3,this.sketch,getCanvasSize()*0.05,fontAldoApache,this.sketch.color(127,127,127));
        this.author.setTextOrientation(this.sketch.CENTER,this.sketch.CENTER); 
        this.author.setAngleMode(this.sketch.RADIANS);

        //This is the text for the start message
        this.startMessage = new Text(HEADER.START_SCREEN_MESSAGE,getCanvasSize()/2,getCanvasSize()/2,this.sketch,getCanvasSize()*0.05,fontSquareo,this.sketch.color(200,200,200));
        this.startMessage.setTextOrientation(this.sketch.CENTER,this.sketch.CENTER);
        this.startMessage.setAngleMode(this.sketch.RADIANS); 

        //This is a variable to keep track of the sin function.
        this.s = 0;

        //Create a new animation for when the user presses the start button
        this.startCutscene = new Cutscene(this.keylistener, this.title,this.author,this.startMessage,this.s);
        
        //Set the animation condition
        this.startCutscene.setCondition(function() {
            if ((this.keylistener.listen() == KEY_EVENTS.SELECT) && (!Cutscene.isPlaying)) {
                this.activate();
                this.keylistener.deactivate();
            } else if (this.shapes[2].getY() < getCanvasSize()*-1){
                this.deactivate();
                GuiManager.changeScreen(Screens.SETUP_SCREEN);
            } else {
                this.shapes[2].setFillAlpha(128 + 128 * this.sketch.sin(this.sketch.millis() / 500));
            }
        });

        //Set the animation
        this.startCutscene.setAnimation(function () {
            //Set the y of all three titles - they all move at the same speed
            this.shapes[0].setY(getCanvasSize()/5 + getCanvasSize()*this.sketch.sin((this.shapes[3]+(100*this.sketch.asin(3/4) + 200*this.sketch.PI))/100) - getCanvasSize()/4*3);
            this.shapes[1].setY(getCanvasSize()/10*3 + getCanvasSize()*this.sketch.sin((this.shapes[3]+(100*this.sketch.asin(3/4) + 200*this.sketch.PI))/100) - getCanvasSize()/4*3);
            this.shapes[2].setY(getCanvasSize()/2 + getCanvasSize()*this.sketch.sin((this.shapes[3]+(100*this.sketch.asin(3/4) + 200*this.sketch.PI))/100) - getCanvasSize()/4*3);
            this.shapes[3]+=2;
            //Increase the flashing of the bottom titles
            this.shapes[2].setFillAlpha(128 * this.sketch.sin(this.sketch.millis() / 50));

        });

    }

    public draw(): void {
        this.sketch.background(0);

        //Render titles
        this.title.render();
        this.author.render();
        this.startMessage.render();
    
        //listen for starting animation.
        this.startCutscene.listen();
    }

    public resize(): void {

    }

    public getID(): Screens {
        return StartScreen.id;
    }
}