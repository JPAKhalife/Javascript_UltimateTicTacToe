/**
 * @file SetupScreen.ts
 * @description //This file is responsible for drawing the setup screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import Floater from "../MenuObjects/Floater";
import GuiManager from "../GuiManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import MenuNav from "../MenuObjects/MenuNav";
import {MenuButton} from "../MenuObjects/MenuButton";
import {Text, Rectangle } from "../ShapeWrapper";
import { whiteTicTac, getCanvasSize, HEADER, fontPointless } from "../sketch";
import WebManager from "../WebManager";

export const STROKEWEIGHT = 15;
const SETUP_SCREEN_ANIMATION_TIME = 120;

export default class SetupScreen implements Menu {

    private keylistener: KeyListener;
    private sketch: p5;
    private floater_array: Floater[]
    private opacity: number;
    private border_pos: number;
    private border: Rectangle;
    private title: Text;
    private multiplayer_MenuButton_list: MenuNav;
    private transition_in_active: boolean;
    private transition_out_active: boolean;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(this.sketch);

        // Create floaters for the setup screen
        this.floater_array = new Array<Floater>(4);
        for (let i = 0; i < 4; i++) {
            this.floater_array[i] = new Floater(this.sketch, whiteTicTac, 50, 50);
            this.floater_array[i].setOpacity(0);
            this.floater_array[i].init();
        }
        
        // Opacity and border position
        this.opacity = 0;
        this.border_pos = 0;

        // Border rectangle
        this.border = new Rectangle(getCanvasSize() + STROKEWEIGHT, getCanvasSize() + STROKEWEIGHT, this.sketch,getCanvasSize()/2, getCanvasSize()/2 );
        this.border.unsetFill();
        this.border.setStrokeWeight(STROKEWEIGHT);
        this.border.setRectOrientation(this.sketch.CENTER);
        this.border.setStroke(sketch.color(255, 255, 255, 255));

        // This is the text for the title
        this.title = new Text(HEADER.SETUP_SCREEN_TITLE, getCanvasSize()/2, getCanvasSize()/5, this.sketch, getCanvasSize()*0.05, fontPointless, this.sketch.color(255, 255, 255));
        this.title.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.title.setStroke(sketch.color(255, 255, 255, this.opacity));
        this.title.setFill(sketch.color(255, 255, 255, 0));

        // Here are the buttons for the setup screen
        this.multiplayer_MenuButton_list = new MenuNav([
            new MenuButton(this.sketch, 0.5, 0.4, "Local", 0.1, 0.1, 50*0.25, 0),
            new MenuButton(this.sketch, 0.80, 0.85, "How to play", 0.05, 0.15, 50*0.25, 0),
            new MenuButton(this.sketch, 0.20, 0.85, "Controls", 0.05, 0.15, 50*0.25, 0),
            new MenuButton(this.sketch, 0.5, 0.6, "Online", 0.1, 0.1, 50*0.25, 0)
        ], this.sketch);

        this.transition_in_active = true;
        this.transition_out_active = false;

        this.keylistener.deactivate(); // We don't want the user to be capable of inputs during the animation
    }

    private transitionIn(): void {
        if (this.border_pos >= STROKEWEIGHT * 2) {
            for (let i = 0; i < this.multiplayer_MenuButton_list.getLength(); i++) {
                if ((this.multiplayer_MenuButton_list.getAtIndex(i) as MenuButton).getOpacity() <= 255) {
                    (this.multiplayer_MenuButton_list.getAtIndex(i) as MenuButton).fadeIn(SETUP_SCREEN_ANIMATION_TIME / 3 * 2);
                }
            }
            if (this.opacity < 255) {
                this.opacity = Math.min(this.opacity + 255 / (SETUP_SCREEN_ANIMATION_TIME / 3 * 2), 255);
                this.title.setStroke(this.sketch.color(255, 255, 255, this.opacity));
            }
            if (this.opacity >= 255) {
                for (let i = 0; i < this.floater_array.length; i++) {
                    this.floater_array[i].fadeIn(SETUP_SCREEN_ANIMATION_TIME / 3);
                }
            }
            if (this.floater_array[this.floater_array.length - 1].getOpacity() >= 255) {
                this.transition_in_active = false;
                this.keylistener.activate();
            }

        } else {
            this.border_pos += (STROKEWEIGHT * 2) / (SETUP_SCREEN_ANIMATION_TIME / 3);
            this.border.setWidth(getCanvasSize() + STROKEWEIGHT - this.border_pos);
            this.border.setHeight(getCanvasSize() + STROKEWEIGHT - this.border_pos);
        }
    }

    private transitionOut(): void {
        for (let i = 0; i < this.multiplayer_MenuButton_list.getLength(); i++) {
            if (this.multiplayer_MenuButton_list.getAtIndex(i) !== this.multiplayer_MenuButton_list.getCurrentlySelected()) {
                (this.multiplayer_MenuButton_list.getAtIndex(i) as MenuButton).fade ();
            }
        }
        for (let i = 0; i < this.floater_array.length; i++) {
            this.floater_array[i].fadeOut(MenuButton.CONFIRMED_ANIMATION_TIME / 4);
        }
        this.border_pos -= (STROKEWEIGHT * 2) / (MenuButton.CONFIRMED_ANIMATION_TIME / 4);
        this.border.setWidth(getCanvasSize() + STROKEWEIGHT - this.border_pos);
        this.border.setHeight(getCanvasSize() + STROKEWEIGHT - this.border_pos);
        this.title.setStroke(this.sketch.color(255, 255, 255, this.border_pos));
        this.opacity -= 255 / (MenuButton.CONFIRMED_ANIMATION_TIME / 4);

        if (this.border_pos <= 0) {
            this.transition_out_active = false;
            this.keylistener.activate();
            const selectedPhrase = (this.multiplayer_MenuButton_list.getCurrentlySelected() as MenuButton).getText();
            if (selectedPhrase === 'Online') {
                const loadingAction = () => {
                    WebManager.getInstance().initiateWebsocketConnection();
                };
                const proceedCondition = () => {
                    return WebManager.getInstance().isConnected();
                };
                GuiManager.changeScreen(Screens.LOADING_SCREEN, this.sketch, Screens.MULTIPLAYER_SCREEN, "Connecting to Server", loadingAction, proceedCondition );
            } else if (selectedPhrase === 'Local') {
                GuiManager.changeScreen(Screens.GAME_SCREEN, this.sketch);
            } else if (selectedPhrase === 'Controls') {
                GuiManager.changeScreen(Screens.CONTROL_SCREEN, this.sketch);
            } else if (selectedPhrase === 'How to play') {
                GuiManager.changeScreen(Screens.TUTORIAL_SCREEN, this.sketch);
            } else {
                GuiManager.changeScreen(Screens.START_SCREEN, this.sketch);
            }
        }
    }

    public draw(): void {
        this.sketch.background(0);

        // Draw the border
        this.border.render();
    
        // Render out buttons
        this.multiplayer_MenuButton_list.drawAll();
    
        // Render our floaters
        for (let i = 0; i < this.floater_array.length; i++) {
            this.floater_array[i].draw();
        }
    
        // Render our title
        this.title.render();
    
        // Detect any keypresses
        let keypress = this.multiplayer_MenuButton_list.getKeyEvent();
    
        // Detect for our entry and exit animations
        if (this.transition_in_active) {
            this.transitionIn();
        }
        if (this.transition_out_active) {
            this.transitionOut();
        }
    
        // Handle keypresses
        if (!this.transition_in_active && !this.transition_out_active) {
            if (keypress === KEY_EVENTS.UP) {
                this.multiplayer_MenuButton_list.selectClosest(270);
            } else if (keypress === KEY_EVENTS.RIGHT) {
                this.multiplayer_MenuButton_list.selectClosest(0);
            } else if (keypress === KEY_EVENTS.DOWN) {
                this.multiplayer_MenuButton_list.selectClosest(90);
            } else if (keypress === KEY_EVENTS.LEFT) {
                this.multiplayer_MenuButton_list.selectClosest(180);
            } else if (keypress === KEY_EVENTS.SELECT) {
                this.opacity = 255;
                this.multiplayer_MenuButton_list.confirm();
                this.transition_out_active = true;
                this.keylistener.deactivate();
            }
        }
    }

    public resize(): void {
        // Handle resize logic if needed
    }
}
