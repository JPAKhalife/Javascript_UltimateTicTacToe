/**
 * @file SetupScreen.ts
 * @description This file is responsible for drawing the setup screen
 * @author John Khalife (refactored by Cline)
 * @created 2024-06-9
 * @updated 2025-08-12
 */

import p5 from "p5";
import Floater from "../MenuObjects/Floater";
import GuiManager from "../GuiManager";
import { KEY_EVENTS } from "../KeyListener";
import { Screens } from "../Menu";
import MenuNav from "../MenuObjects/MenuNav";
import { MenuButton } from "../MenuObjects/MenuButton";
import { whiteTicTac, getCanvasSize, HEADER, fontPointless } from "../sketch";
import WebManager from "../WebManager";
import BaseMenuItem from "../MenuObjects/BaseMenuItem";
import TransitionableScreen from "./TransitionableScreen";

export const STROKEWEIGHT = 15;
const SETUP_SCREEN_ANIMATION_TIME = 120;

export default class SetupScreen extends TransitionableScreen {
    private floater_array: Floater[];
    private menuButtonList: MenuNav;

    constructor(sketch: p5) {
        // Initialize the TransitionableScreen with custom options
        super(sketch, {
            animationTime: SETUP_SCREEN_ANIMATION_TIME,
            borderWidth: 0.017,
            borderAnimationTime: 30,
            useBorder: true,
            fadeContent: true
        });

        // Create floaters for the setup screen
        this.floater_array = new Array<Floater>(4);
        for (let i = 0; i < 4; i++) {
            // Use smaller percentage values (5% of canvas size) instead of fixed pixel values
            this.floater_array[i] = new Floater(this.sketch, whiteTicTac, 0.05, 0.05);
            this.floater_array[i].setOpacity(0);
            this.floater_array[i].init();
        }

        // Create buttons for the setup screen
        this.menuButtonList = new MenuNav([
            new MenuButton(this.sketch, 0.5, 0.4, "Local", 0.1, 0.1, 0.015, 0),
            new MenuButton(this.sketch, 0.80, 0.85, "How to play", 0.05, 0.15, 0.015, 0),
            new MenuButton(this.sketch, 0.20, 0.85, "Controls", 0.05, 0.15, 0.015, 0),
            new MenuButton(this.sketch, 0.5, 0.6, "Online", 0.1, 0.1, 0.015, 0)
        ], this.sketch);

        // Register UI elements for automatic transition handling
        const menuButtons: BaseMenuItem[] = [];
        for (let i = 0; i < this.menuButtonList.getLength(); i++) {
            menuButtons.push(this.menuButtonList.getAtIndex(i));
        }
        this.registerUIElements(menuButtons);
    }

    /**
     * @method onTransitionInComplete
     * @description Called when transition in is complete
     * Override to handle floater animations
     */
    protected onTransitionInComplete(): void {
        // Fade in floaters after the main transition is complete
        for (let i = 0; i < this.floater_array.length; i++) {
            this.floater_array[i].fadeIn(SETUP_SCREEN_ANIMATION_TIME / 3);
        }
    }

    /**
     * @method drawContent
     * @description Draws the setup screen content
     */
    protected drawContent(): void {
        // Render out buttons
        this.menuButtonList.drawAll();

        // Render our floaters
        for (let i = 0; i < this.floater_array.length; i++) {
            this.floater_array[i].draw();
        }

        // Render the title directly with p5.js functions
        this.sketch.push();
        this.sketch.textFont(fontPointless);
        this.sketch.textSize(getCanvasSize() * 0.05);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.stroke(255, 255, 255, this.opacity);
        this.sketch.fill(255, 255, 255, 0);
        this.sketch.text(HEADER.SETUP_SCREEN_TITLE, getCanvasSize() / 2, getCanvasSize() / 5);
        this.sketch.pop();
    }

    /**
     * @method handleInput
     * @description Handles user input
     */
    protected handleInput(): void {
        const keypress = this.menuButtonList.getKeyEvent();

        if (keypress === KEY_EVENTS.UP) {
            this.menuButtonList.selectClosest(270);
        } else if (keypress === KEY_EVENTS.RIGHT) {
            this.menuButtonList.selectClosest(0);
        } else if (keypress === KEY_EVENTS.DOWN) {
            this.menuButtonList.selectClosest(90);
        } else if (keypress === KEY_EVENTS.LEFT) {
            this.menuButtonList.selectClosest(180);
        } else if (keypress === KEY_EVENTS.SELECT) {
            this.menuButtonList.confirm();

            // Fade out floaters
            for (let i = 0; i < this.floater_array.length; i++) {
                this.floater_array[i].fadeOut(MenuButton.CONFIRMED_ANIMATION_TIME / 4);
            }

            // Get the selected button and determine the next screen
            const selectedPhrase = (this.menuButtonList.getCurrentlySelected() as MenuButton).getText();

            if (selectedPhrase === 'Online') {
                // Navigate to multiplayer screen with loading screen in between
                const loadingAction = () => {
                    WebManager.getInstance().initiateConnectionIfNotEstablished();
                };
                const proceedCondition = () => {
                    return WebManager.getInstance().isConnected();
                };

                // Start transition out
                this.startTransitionOut(Screens.LOADING_SCREEN);

                // Override the onTransitionOutComplete to handle the loading screen
                this.onTransitionOutComplete = () => {
                    GuiManager.changeScreen(
                        Screens.LOADING_SCREEN,
                        this.sketch,
                        Screens.USERNAME_SCREEN,
                        "Connecting to Server",
                        loadingAction,
                        proceedCondition
                    );
                };
            } else if (selectedPhrase === 'Local') {
                this.startTransitionOut(Screens.GAME_SCREEN);
            } else if (selectedPhrase === 'Controls') {
                this.startTransitionOut(Screens.CONTROL_SCREEN);
            } else if (selectedPhrase === 'How to play') {
                this.startTransitionOut(Screens.TUTORIAL_SCREEN);
            } else {
                this.startTransitionOut(Screens.START_SCREEN);
            }
        }
    }

    /**
     * @method getSelectedElement
     * @description Gets the currently selected UI element
     * @returns The selected element or null if none
     */
    protected getSelectedElement(): BaseMenuItem | null {
        return this.menuButtonList.getCurrentlySelected();
    }
}
