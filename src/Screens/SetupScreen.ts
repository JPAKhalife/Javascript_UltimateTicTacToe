/**
 * @file SetupScreen.ts
 * @description //This file is responsible for drawing the setup screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


import p5 from "p5";
import Cutscene from "../Cutscene";
import Floater from "../Floater";
import GuiManager from "../GuiManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import ButtonNav from "../MenuObjects/ButtonNav";
import MenuButton from "../MenuObjects/MenuButton";
import {Text, Rectangle } from "../ShapeWrapper";
import { whiteTicTac, getCanvasSize, HEADER, fontPointless } from "../sketch";


const STROKEWEIGHT = 15;
const SETUP_SCREEN_ANIMATION_TIME = 120;

export default class SetupScreen implements Menu {

    private keylistener: KeyListener;
    private sketch: p5;
    private floater_array: any[]
    private opacity: number;
    private border_pos: number;
    private border: Rectangle;
    private title: Text;
    private multiplayer_MenuButton_list: ButtonNav;
    private transition_in: Cutscene;
    private transition_out: Cutscene;
    private static id: Screens = Screens.SETUP_SCREEN;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);

        //Create floaters for the setup screen
        this.floater_array = new Array(4);
        for (let i = 0 ; i < 4 ; i++) {
            this.floater_array[i] = new Floater(this.sketch,whiteTicTac,50,50);
            this.floater_array[i].setOpacity(0);
            this.floater_array[i].init();
        }
        
        //Opacity and border position
        this.opacity = 0;
        this.border_pos = 0;

        // Border rectangle
        this.border = new Rectangle(getCanvasSize()/2, getCanvasSize()/2, this.sketch, getCanvasSize() + STROKEWEIGHT, getCanvasSize() + STROKEWEIGHT);
        this.border.unsetFill();
        this.border.setStrokeWeight(STROKEWEIGHT);
        this.border.setRectOrientation(this.sketch.CENTER);
        this.border.setStroke(sketch.color(255,255,255,255));

        //This is the text for the title
        this.title = new Text(HEADER.SETUP_SCREEN_TITLE, getCanvasSize()/2,getCanvasSize()/5, this.sketch, getCanvasSize()*0.05,fontPointless,this.sketch.color(255,255,255));
        this.title.setTextOrientation(this.sketch.CENTER,this.sketch.CENTER);
        this.title.setStroke(sketch.color(255,255,255,this.opacity));
        this.title.setFill(sketch.color(255,255,255,0));

        //Here are the buttons for the setup screen
        this.multiplayer_MenuButton_list = new ButtonNav([new MenuButton(this.sketch,0.5,0.4,"Local",0.1,0.1,50*0.25,0),
            new MenuButton(this.sketch,0.80,0.85, "How to play",0.05,0.15,50*0.25,0),
            new MenuButton(this.sketch,0.20, 0.85, "Controls",0.05,0.15,50*0.25,0),
            new MenuButton(this.sketch,0.5, 0.6 , "Online",0.1,0.1,50*0.25,0)]); 

            //This is the animation intended for transitioning into the setup screen
        this.transition_in = new Cutscene(this.keylistener, this.multiplayer_MenuButton_list, this.floater_array, this.title, this.border, this.border_pos, this.opacity);
        
        //set the animation condition
        this.transition_in.setCondition(() => {
            if (this.transition_in.getShape(1)[this.transition_in.getShape(1).length - 1].opacity >= 255) {
                this.transition_in.deactivate();
                this.keylistener.activate()
            }
        })    

        //Set the animation condition
        this.transition_in.setAnimation(() => {
            if (this.transition_in.getShape(4) >= STROKEWEIGHT*2) {
                for (let i = 0 ; i < this.transition_in.getShape(0).buttonArray.length ; i++) {
                    if (this.transition_in.getShape(0).buttonArray[i].opacity <= 255) { 
                    this.transition_in.getShape(0).buttonArray[i].fadeIn(SETUP_SCREEN_ANIMATION_TIME/3*2);
                }
                }
                if (this.transition_in.getShape(5) < 255) { 
                    this.transition_in.setShape(5,this.transition_in.getShape(5 + 255/(SETUP_SCREEN_ANIMATION_TIME/3*2)));
                    this.transition_in.getShape(2).setStroke(255,255,255, this.transition_in.getShape(5));
                }
                if (this.transition_in.getShape(5) >= 255) {
                    for (let i = 0 ; i < this.transition_in.getShape(1).length ; i++) {
                        this.transition_in.getShape(1)[i].fadeIn(SETUP_SCREEN_ANIMATION_TIME/3);
                    }
                }
                
            } else {
                this.transition_in.setShape(4,this.transition_in.getShape(4) + (STROKEWEIGHT*2)/(SETUP_SCREEN_ANIMATION_TIME/3)); 
                this.transition_in.getShape(3).setWidth(getCanvasSize() + STROKEWEIGHT - this.transition_in.getShape(4));
                this.transition_in.getShape(3).setHeight(getCanvasSize() + STROKEWEIGHT - this.transition_in.getShape(4));
            }
        });

        this.keylistener.deactivate(); //We don't want the user to be capable of inputs during the animation
        this.transition_in.activate(); //activate the transition into the setup screen

        //This is the animation intended for transioning out of the setup screen
        this.transition_out = new Cutscene(this.keylistener, this.multiplayer_MenuButton_list, this.floater_array, this.title, this.border, STROKEWEIGHT*2, 255);
        
        this.transition_out.setCondition(() => {
            if (this.transition_out.getShape(0).currentlySelected.isConfirmed() && !Cutscene.isPlaying) {
                this.transition_out.activate();
                this.keylistener.deactivate();
            } else if (this.transition_out.getShape(0).currentlySelected.isConfirmedAnimationDone()) {
                this.transition_out.deactivate();
                this.keylistener.activate();
                //In the event that the online or local button is pushed, we want to set up the x and y values for a transition
                if (this.transition_out.getShape(0).currentlySelected.phrase == 'Online') {
                    GuiManager.changeScreen(Screens.LOADING_SCREEN);
                } else if (this.transition_out.getShape(0).currentlySelected.phrase == 'Local') {
                    GuiManager.changeScreen(Screens.GAME_SCREEN);
                } else if (this.transition_out.getShape(0).currentlySelected.phrase == 'Controls') {
                    GuiManager.changeScreen(Screens.CONTROL_SCREEN)
                } else if (this.transition_out.getShape(0).currentlySelected.phrase == 'How to play') {
                    GuiManager.changeScreen(Screens.HOW_TO_PLAY_SCREEN);
                } else {
                    GuiManager.changeScreen(Screens.START_SCREEN);
                }
            }
        });

        this.transition_out.setAnimation(() => {
            //Fade buttons
            for (let i = 0 ; i < this.transition_out.getShape(0).buttonArray.length ; i++) {
                if (this.transition_out.getShape(0).buttonArray[i] == this.transition_out.getShape(0).currentlySelected) {
                } else {
                    this.transition_out.getShape(0).buttonArray[i].fade();
                }
            }
            //Fade out floaters
            for (let i =  0 ; i < this.transition_out.getShape(1).length ; i++) {
                this.transition_out.getShape(1)[i].fadeOut(MenuButton.CONFIRMED_ANIMATION_TIME/4);
            }
            //Fade out border
            this.transition_out.setShape(4,this.transition_out.getShape(4) - (STROKEWEIGHT*2)/(MenuButton.CONFIRMED_ANIMATION_TIME/4));
            this.transition_out.getShape(3).setWidth(getCanvasSize() + STROKEWEIGHT - this.transition_out.getShape(4));
            this.transition_out.getShape(3).setHeight(getCanvasSize() + STROKEWEIGHT - this.transition_out.getShape(4));
            this.transition_out.getShape(2).setStroke(255,255,255,this.transition_out.getShape(4)); //fade out the title
            this.transition_out.setShape(5,this.transition_out.getShape(5) -  255/(MenuButton.CONFIRMED_ANIMATION_TIME/4));
        });
    }

    public draw(): void {
        this.sketch.background(0);

        //Draw the border
        //this.border.callFunction('render');
        this.border.render();
    
        //Render out buttons
        for (let i = 0; i < this.multiplayer_MenuButton_list.getLength() ; i++) {
            this.multiplayer_MenuButton_list.drawAll();
        }
    
        //Render our floaters
        for (let i = 0 ; i < this.floater_array.length ; i++) {
            this.floater_array[i].draw();
        }
    
        //Render our title
        this.title.render();
    
        //Detect any keypresses
        let keypress = this.keylistener.listen();
    
        //Detect for out entry and exit animations
        this.transition_in.listen();
        this.transition_out.listen();
    
    
        //w
        if (keypress == KEY_EVENTS.UP) {
            this.multiplayer_MenuButton_list.selectClosest(2);   
        //d
        } else if (keypress == KEY_EVENTS.RIGHT) {
            this.multiplayer_MenuButton_list.selectClosest(1);
        //s
        } else if (keypress == KEY_EVENTS.DOWN) {
            this.multiplayer_MenuButton_list.selectClosest(0);
        //a
        } else if (keypress == KEY_EVENTS.LEFT) {
            this.multiplayer_MenuButton_list.selectClosest(3);
        //space
        } else if (keypress == KEY_EVENTS.SELECT) {
            this.opacity = 255;
            this.multiplayer_MenuButton_list.confirm();
        }

    }

    public resize(): void {

    }

    public getID(): Screens {
        return SetupScreen.id;
    }
}

