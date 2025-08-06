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
import { Text, Rectangle, Img } from "../ShapeWrapper";
import WebManager from '../WebManager';

// Animation constants
const ANIMATION_TIME = 60; // 1 second at 60fps
const STROKEWEIGHT = 15;
const LOADING_TIME = ANIMATION_TIME*2;

export default class UsernameScreen implements Menu {
    private sketch: p5;
    private keylistener: KeyListener;
    private webManager: WebManager;

    // UI Elements
    private title: Text;
    private subtitle: Text;
    private usernameField: Field;
    private confirmButton: MenuButton;
    private menuNav: MenuNav;
    private border: Rectangle;
    
    // Animation variables
    private transitionInActive: boolean;
    private transitionOutActive: boolean;
    private opacity: number;
    private borderPos: number;
    private showLoadingIcon: boolean;
    private rotationAngle: number;
    private iconX: number;
    private iconY: number;
    
    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);
        this.webManager = WebManager.getInstance();
        
        // Initialize animation variables
        this.transitionInActive = true;
        this.transitionOutActive = false;
        this.opacity = 0;
        this.borderPos = 0;
        this.showLoadingIcon = false;
        this.rotationAngle = 0;
        this.iconX = 0;
        this.iconY = 0;
        
        // Create border rectangle
        this.border = new Rectangle(
            getCanvasSize() + STROKEWEIGHT, 
            getCanvasSize() + STROKEWEIGHT, 
            this.sketch,
            getCanvasSize()/2, 
            getCanvasSize()/2
        );
        this.border.unsetFill();
        this.border.setStrokeWeight(STROKEWEIGHT);
        this.border.setRectOrientation(this.sketch.CENTER);
        this.border.setStroke(sketch.color(255, 255, 255, 255));
        
        // Create title text
        this.title = new Text(
            "To start playing...", 
            getCanvasSize()/2, 
            getCanvasSize()/5, 
            this.sketch, 
            getCanvasSize()*0.05, 
            fontPointless, 
            this.sketch.color(255, 255, 255)
        );
        this.title.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.title.setStroke(sketch.color(255, 255, 255, this.opacity));
        this.title.setFill(sketch.color(255, 255, 255, 0));
        
        // Create subtitle text
        this.subtitle = new Text(
            "Enter your username below", 
            getCanvasSize()/2, 
            getCanvasSize()/3, 
            this.sketch, 
            getCanvasSize()*0.025, 
            fontPointless, 
            this.sketch.color(255, 255, 255)
        );
        this.subtitle.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.subtitle.setStroke(sketch.color(255, 255, 255, this.opacity));
        this.subtitle.setFill(sketch.color(255, 255, 255, 0));
        
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
            50*0.25, // text size
            0 // start with 0 opacity
        );

        // Store the position for the loading icon
        //this.confirmButton.getX() + getCanvasSize() * 0.1
        this.iconX = getCanvasSize()/4; // Position to the right of the button
        this.iconY = getCanvasSize()/2;
        
        
        // Create menu navigation
        this.menuNav = new MenuNav([
            this.usernameField,
            this.confirmButton
        ], this.sketch);
        
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
        if (this.borderPos >= STROKEWEIGHT * 2) {
            // Fade in UI elements after border animation
            if (this.opacity < 255) {
                this.opacity = Math.min(this.opacity + 255 / (ANIMATION_TIME / 2), 255);
                this.title.setStroke(this.sketch.color(255, 255, 255, this.opacity));
                this.subtitle.setStroke(this.sketch.color(255, 255, 255, this.opacity));
                this.usernameField.setOpacity(this.opacity);
                this.confirmButton.fadeIn(ANIMATION_TIME / 2);
            }
            
            if (this.opacity >= 255) {
                this.transitionInActive = false;
                this.keylistener.activate();
                console.log("Username Screen transition in complete");
            }
        } else {
            // Animate border shrinking in
            this.borderPos += (STROKEWEIGHT * 2) / (ANIMATION_TIME / 2);
            this.border.setWidth(getCanvasSize() + STROKEWEIGHT - this.borderPos);
            this.border.setHeight(getCanvasSize() + STROKEWEIGHT - this.borderPos);
        }
    }
    
    /**
     * @method transitionOut
     * @description Handles the transition out animation and navigation
     */
    private transitionOut(): void {
        // Note: Rotation is now handled in the draw method
        
        // Fade out UI elements
        this.confirmButton.fade();
        this.usernameField.setOpacity(this.usernameField.getOpacity() - 255 / (ANIMATION_TIME / 2));
        
        // Animate border expanding out
        this.borderPos -= (STROKEWEIGHT * 2) / (ANIMATION_TIME / 2);
        this.border.setWidth(getCanvasSize() + STROKEWEIGHT - this.borderPos);
        this.border.setHeight(getCanvasSize() + STROKEWEIGHT - this.borderPos);
        
        // Fade out text
        this.opacity -= 255 / (ANIMATION_TIME / 2);
        this.title.setStroke(this.sketch.color(255, 255, 255, this.opacity));
        this.subtitle.setStroke(this.sketch.color(255, 255, 255, this.opacity));
        
        // When animation is complete, navigate to next screen
        if (this.borderPos <= 0) {
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
        
        // Draw border
        this.border.render();
        
        // Draw title and subtitle
        this.title.render();
        this.subtitle.render();
        
        // Draw menu items (field and button)
        this.menuNav.drawAll();
        
        // Draw spinning loading icon if needed - using p5's image method directly
        
        if (this.showLoadingIcon) {
            this.sketch.push();            
            this.sketch.imageMode(this.sketch.CENTER);
            this.sketch.translate(this.iconX, this.iconY);
            this.sketch.rotate(this.rotationAngle);
            this.sketch.fill(255);
            this.sketch.tint(255,255)
            this.sketch.image(whiteTicTac, 0, 0, 40, 40);
            this.sketch.pop();
            
            // Increment rotation angle for continuous spinning
            this.rotationAngle += 4;
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
                    console.log("Key event in edit mode:", keypress);
                    this.usernameField.draw(keypress);
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
                        setTimeout(() => this.checkUsername(), 1000);
                    } else if (this.menuNav.getCurrentlySelected() === this.usernameField) {
                        console.log("Entering edit mode for username field");
                        this.usernameField.setEditMode(true);
                    }
                }
                // } else if (keypress === KEY_EVENTS.ENTER) {
                //     // Handle ENTER key separately to toggle edit mode
                //     if (this.menuNav.getCurrentlySelected() === this.usernameField) {
                //         console.log("ENTER key pressed on username field");
                //         this.usernameField.setEditMode(true);
                //     }
            }
        }
        }
    
    
    /**
     * @method resize
     * @description Handles resize events
     */
    public resize(): void {
        // Update positions and sizes if needed
    }

    private checkUsername(): void {
        if (this.usernameField.getText() == "") {
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
                this.keylistener.deactivate();
                this.transitionOutActive = true;
                this.confirmButton.setConfirmed(true);
                this.showLoadingIcon = false;
            } else {
                this.usernameField.setError(response[1]);
                this.usernameField.shake();
                this.showLoadingIcon = false;
            }
        });
    }
}
