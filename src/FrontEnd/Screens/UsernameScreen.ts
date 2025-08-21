/**
 * @file UsernameScreen.ts
 * @description This file is responsible for allowing users to enter their username
 * @author John Khalife
 * @created 2024-07-26
 * @updated 2024-07-26
 */

import p5 from "p5";
import Menu, { Screens } from "../Menu";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize, fontPointless, HEADER, whiteTicTac } from "../sketch";
import { MenuButton } from "../MenuObjects/MenuButton";
import MenuNav from "../MenuObjects/MenuNav";
import GuiManager from "../GuiManager";
import Field from "../MenuObjects/Field";
import WebManager from '../WebManager';
import LoadingSpinner from "../MenuObjects/LoadingSpinner";
import ScreenBorder from "../MenuObjects/ScreenBorder";

// Animation constants
const ANIMATION_TIME = 60; // 1 second at 60fps
const STROKEWEIGHT = 15;
const LOADING_TIME = ANIMATION_TIME * 2;

export default class UsernameScreen implements Menu {
    private sketch: p5;
    private keylistener: KeyListener;
    private webManager: WebManager;

    // UI Elements
    private usernameField: Field;
    private confirmButton: MenuButton;
    private menuNav: MenuNav;
    private spinner: LoadingSpinner;
    private border: ScreenBorder;


    // Animation variables
    private transitionInActive: boolean;
    private transitionOutActive: boolean;
    private opacity: number;
    private borderPos: number;
    private showLoadingIcon: boolean;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);
        this.webManager = WebManager.getInstance();

        this.spinner = new LoadingSpinner(sketch, 0.25, 0.5, 0.04);


        // Initialize animation variables
        this.transitionInActive = true;
        this.transitionOutActive = false;
        this.opacity = 0;
        this.borderPos = 0;
        this.showLoadingIcon = false;

        // Create username field
        this.usernameField = new Field(
            sketch,
            0.5, // x position (center)
            0.5, // y position (center)
            0.4, // width
            0.08, // height
            this.keylistener,
            20, // max length
            "Username" // label
        );
        this.usernameField.setOpacity(0); // Start invisible for animation

        // Create confirm button
        this.confirmButton = new MenuButton(
            this.sketch,
            0.5, // x position (center)
            0.7, // y position (below field)
            "Confirm", // text
            0.1, // height
            0.2, // width
            0.020, // text size
            0 // start with 0 opacity
        );

        // Create menu navigation
        this.menuNav = new MenuNav([
            this.usernameField,
            this.confirmButton
        ], this.sketch);

        //Screen Border
        this.border = new ScreenBorder(sketch, 0.017, 30);
        this.border.setTransitionIn(true);

        // Set the field as initially selected (it's the first item, index 0)
        this.menuNav.changeSelected(0);

        // Deactivate keylistener during animation
        this.keylistener.deactivate();
    }

    /**
     * @method transitionIn
     * @description Handles the transition in animation
     */
    private transitionIn(): void {
        if (!this.border.isTransitioning()) {
            // Fade in UI elements after border animation
            if (this.opacity < 255) {
                this.opacity = Math.min(this.opacity + 255 / (ANIMATION_TIME / 2), 255);
                this.usernameField.setOpacity(this.opacity);
                this.confirmButton.fadeIn(ANIMATION_TIME / 2);
            }

            if (this.opacity >= 255) {
                this.transitionInActive = false;
                this.keylistener.activate();
                console.log("Username Screen transition in complete");
            }
        }
    }

    /**
     * @method transitionOut
     * @description Handles the transition out animation and navigation
     */
    private transitionOut(): void {
        // Fade out UI elements
        this.confirmButton.fade((255 / (MenuButton.CONFIRMED_ANIMATION_TIME / 4)));
        this.usernameField.setOpacity(this.usernameField.getOpacity() - 255 / (ANIMATION_TIME / 2));

        // Fade out text
        this.opacity -= 255 / (ANIMATION_TIME / 2);

        // When animation is complete, navigate to next screen
        if (!this.border.isTransitioning()) {
            this.transitionOutActive = false;
            this.keylistener.activate();

            // Store username in localStorage
            const username = this.usernameField.getText();
            localStorage.setItem('username', username);

            //TODO: The username needs to be passed to the next screen, and also a check should be added on this screen.s
            GuiManager.changeScreen(Screens.MULTIPLAYER_SCREEN, this.sketch);
        }
    }

    /**
     * @method draw
     * @description Draws the username screen
     */
    public draw(): void {
        this.sketch.background(0);

        // Draw title and subtitle with stroke
        this.sketch.push();
        this.sketch.textFont(fontPointless);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.stroke(255, 255, 255, this.opacity);
        this.sketch.fill(255, 255, 255, 0);
        this.sketch.strokeWeight(1); // Ensure text stroke is visible

        //Draw border
        this.border.draw();

        // Draw title
        this.sketch.textSize(getCanvasSize() * 0.05);
        this.sketch.text("To start playing...", getCanvasSize() / 2, getCanvasSize() / 5);

        // Draw subtitle
        this.sketch.textSize(getCanvasSize() * 0.025);
        this.sketch.text("Enter your username below", getCanvasSize() / 2, getCanvasSize() / 3);
        this.sketch.pop();

        // Draw menu items (field and button)
        this.menuNav.drawAll();

        // Draw spinning loading icon if needed
        if (this.showLoadingIcon) {
            this.spinner.draw();
        }

        // Handle transitions
        if (this.transitionInActive) {
            this.transitionIn();
        }

        if (this.transitionOutActive) {
            this.transitionOut();
        }

        // Handle key events when not in transition
        if (!this.transitionInActive && !this.transitionOutActive) {
            // Get key event from menuNav
            const keypress = this.menuNav.getKeyEvent();

            // If the field is in edit mode, pass the key event to the field
            // But don't pass ENTER key events to prevent immediate exit
            if (this.usernameField.isInEditMode()) {
                if (keypress !== KEY_EVENTS.NONE && keypress !== KEY_EVENTS.ENTER) {
                    const canvasSize = getCanvasSize();
                    this.usernameField.draw(canvasSize, keypress);
                }
            } else {
                // Normal navigation when not in edit mode
                if (keypress === KEY_EVENTS.UP) {
                    this.menuNav.selectClosest(270);
                } else if (keypress === KEY_EVENTS.RIGHT) {
                    this.menuNav.selectClosest(0);
                } else if (keypress === KEY_EVENTS.DOWN) {
                    this.menuNav.selectClosest(90);
                } else if (keypress === KEY_EVENTS.LEFT) {
                    this.menuNav.selectClosest(180);
                } else if (keypress === KEY_EVENTS.SELECT) {
                    // If the confirm button is selected
                    if (this.menuNav.getCurrentlySelected() === this.confirmButton) {
                        this.showLoadingIcon = true; // Ensure icon is shown immediately when button is pressed
                        this.webManager.initiateConnectionIfNotEstablished();
                        setTimeout(() => this.checkUsername(), 1000);
                    }
                }
            }
        }
    }

    private checkUsername(): void {
        if (this.usernameField.getText() == "") {
            this.usernameField.setError("Please enter a username");
            this.usernameField.shake();
            this.showLoadingIcon = false;
            return;
        }
        let sessionPromise = this.webManager.checkAndRegisterPlayer(this.usernameField.getText()) as Promise<[string, string]>;
        sessionPromise.then(response => {
            const [sessionID, message] = response;
            
            //Valid session ID
            if (sessionID.length > 0) {
                // Session ID is already stored in WebManager.setSessionId
                // No need to store playerID anymore
                
                this.usernameField.setError("");
                this.keylistener.deactivate();
                this.transitionOutActive = true;
                this.border.setTransitionOut(true);
                this.confirmButton.setConfirmed(true);
                this.showLoadingIcon = false;
            } else {
                this.usernameField.setError(message);
                this.usernameField.shake();
                this.showLoadingIcon = false;
            }
        });
    }
}
