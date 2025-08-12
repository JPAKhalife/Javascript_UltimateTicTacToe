/**
 * @file UsernameScreen.ts
 * @description This file is responsible for allowing users to enter their username
 * @author John Khalife (refactored by Cline)
 * @created 2024-07-26
 * @updated 2025-08-12
 */

import p5 from "p5";
import { Screens } from "../Menu";
import { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize, fontPointless } from "../sketch";
import { MenuButton } from "../MenuObjects/MenuButton";
import MenuNav from "../MenuObjects/MenuNav";
import Field from "../MenuObjects/Field";
import WebManager from '../WebManager';
import LoadingSpinner from "../MenuObjects/LoadingSpinner";
import BaseMenuItem from "../MenuObjects/BaseMenuItem";
import TransitionableScreen from "./TransitionableScreen";

// Animation constants
const ANIMATION_TIME = 60; // 1 second at 60fps

export default class UsernameScreen extends TransitionableScreen {
    private webManager: WebManager;

    // UI Elements
    private usernameField: Field;
    private confirmButton: MenuButton;
    private menuNav: MenuNav;
    private spinner: LoadingSpinner;
    private showLoadingIcon: boolean;

    constructor(sketch: p5) {
        // Initialize the TransitionableScreen with custom options
        super(sketch, {
            animationTime: ANIMATION_TIME,
            borderWidth: 0.017,
            borderAnimationTime: 30,
            useBorder: true,
            fadeContent: true
        });

        this.webManager = WebManager.getInstance();
        this.showLoadingIcon = false;

        // Create loading spinner
        this.spinner = new LoadingSpinner(sketch, 0.25, 0.5, 0.04);

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

        // Register UI elements for automatic transition handling
        this.registerUIElements([this.usernameField, this.confirmButton]);

        // Set the field as initially selected (it's the first item, index 0)
        this.menuNav.changeSelected(0);
    }

    /**
     * @method drawContent
     * @description Draws the username screen content
     */
    protected drawContent(): void {
        // Draw title and subtitle with stroke
        this.sketch.push();
        this.sketch.textFont(fontPointless);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.stroke(255, 255, 255, this.opacity);
        this.sketch.fill(255, 255, 255, 0);
        this.sketch.strokeWeight(1); // Ensure text stroke is visible

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
    }

    /**
     * @method handleInput
     * @description Handles user input
     */
    protected handleInput(): void {
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

    /**
     * @method getSelectedElement
     * @description Gets the currently selected UI element
     * @returns The selected element or null if none
     */
    protected getSelectedElement(): BaseMenuItem | null {
        return this.menuNav.getCurrentlySelected();
    }

    /**
     * @method checkUsername
     * @description Validates the username and transitions to the next screen if valid
     */
    private checkUsername(): void {
        if (this.usernameField.getText() == "") {
            this.usernameField.setError("Please enter a username");
            this.usernameField.shake();
            this.showLoadingIcon = false;
            return;
        }

        let playerIDPromise = this.webManager.checkAndRegisterPlayer(this.usernameField.getText()) as Promise<[string, string]>;
        playerIDPromise.then(response => {
            //Valid player ID
            if (response[0].length > 0) {
                localStorage.setItem("playerID", response[0]);
                this.usernameField.setError("");
                this.confirmButton.setConfirmed(true);
                this.showLoadingIcon = false;

                // Start transition out to next screen
                this.startTransitionOut(Screens.MULTIPLAYER_SCREEN);
            } else {
                this.usernameField.setError(response[1]);
                this.usernameField.shake();
                this.showLoadingIcon = false;
            }
        });
    }

    /**
     * @method onTransitionOutComplete
     * @description Called when transition out is complete
     */
    protected onTransitionOutComplete(): void {
        // Store username in localStorage
        const username = this.usernameField.getText();
        localStorage.setItem('username', username);

        // Call parent implementation to change screen
        super.onTransitionOutComplete();
    }
}
