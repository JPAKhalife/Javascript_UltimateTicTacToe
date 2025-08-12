/**
 * @file CreateLobbyScreen.ts
 * @description This file is responsible for creating a new lobby
 * @author John Khalife (refactored by Cline)
 * @created 2024-06-9
 * @updated 2025-08-12
 */

import p5 from "p5";
import { Screens } from "../Menu";
import { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize } from "../sketch";
import { MenuButton } from "../MenuObjects/MenuButton";
import MenuNav from "../MenuObjects/MenuNav";
import GuiManager from "../GuiManager";
import Slider from "../MenuObjects/Slider";
import WebManager from "../WebManager";
import Field from "../MenuObjects/Field";
import LoadingSpinner from "../MenuObjects/LoadingSpinner";
import BaseMenuItem from "../MenuObjects/BaseMenuItem";
import TransitionableScreen from "./TransitionableScreen";

const CREATE_LOBBY_ANIMATION_TIME = 60;

export default class CreateLobbyScreen extends TransitionableScreen {
    private webManager: WebManager;

    // UI Elements
    private returnToOnlineScreen: MenuButton;
    private createButton: MenuButton;
    private lobbyNav: MenuNav;
    private levelSizeSlider: Slider;
    private slotNumSlider: Slider;
    private playerNumSlider: Slider;
    private lobbyNameField: Field;
    private loadingIcon: LoadingSpinner;
    private showLoadingIcon: boolean;

    constructor(sketch: p5) {
        // Initialize with custom options
        super(sketch, {
            animationTime: CREATE_LOBBY_ANIMATION_TIME,
            borderWidth: 0,  // No border, we'll use custom side lines
            useBorder: false,
            fadeContent: true
        });
        
        this.webManager = WebManager.getInstance();
        this.showLoadingIcon = false;

        // Create loading spinner
        this.loadingIcon = new LoadingSpinner(sketch, 0.5, 0.94, 0.04);

        // Create UI elements
        this.returnToOnlineScreen = new MenuButton(
            this.sketch, 0.5, 0.13, "Return", 0.05, 0.2, 0.015, 0
        );
        
        this.createButton = new MenuButton(
            this.sketch, 0.5, 0.86, "Create", 0.05, 0.2, 0.015, 0
        );
        
        // Create the lobby name field
        this.lobbyNameField = new Field(
            this.sketch, 0.5, 0.30, 0.4, 0.08, 
            this.keylistener, 36, "Lobby Name", 0.025, 0.5, 0.24
        );
        
        // Create sliders
        this.levelSizeSlider = new Slider(
            this.sketch, this.keylistener, 0.5, 0.46, 
            0.5, 0.005, 1, 9, 1, 2, "Level Size"
        );
        
        this.slotNumSlider = new Slider(
            this.sketch, this.keylistener, 0.5, 0.76, 
            0.5, 0.005, 1, 9, 1, 3, "Slot Number"
        );
        
        this.playerNumSlider = new Slider(
            this.sketch, this.keylistener, 0.5, 0.61, 
            0.5, 0.005, 2, 10, 1, 2, "Player Number"
        );

        // Create menu navigation
        this.lobbyNav = new MenuNav([
            this.returnToOnlineScreen,
            this.levelSizeSlider,
            this.slotNumSlider,
            this.lobbyNameField,
            this.createButton,
            this.playerNumSlider
        ], this.sketch);

        // Register UI elements for automatic transition handling
        this.registerUIElements([
            this.returnToOnlineScreen,
            this.levelSizeSlider,
            this.slotNumSlider,
            this.lobbyNameField,
            this.createButton,
            this.playerNumSlider
        ]);
    }

    /**
     * @method drawContent
     * @description Draws the create lobby screen content
     */
    protected drawContent(): void {
        // Draw side lines
        this.drawSideLines();
        
        // Draw all menu items
        this.lobbyNav.drawAll();
        
        // Draw loading spinner if needed
        if (this.showLoadingIcon) {
            this.loadingIcon.draw();
        }
    }

    /**
     * @method drawSideLines
     * @description Draws the side lines of the screen
     */
    private drawSideLines(): void {
        this.sketch.push();
        this.sketch.stroke(255, 255, 255, this.opacity);
        this.sketch.strokeWeight(5);
        const canvasSize = getCanvasSize();
        // Use percentages for line positions (0.2 and 0.8)
        this.sketch.line(canvasSize * 0.2, 0, canvasSize * 0.2, canvasSize);
        this.sketch.line(canvasSize * 0.8, 0, canvasSize * 0.8, canvasSize);
        this.sketch.pop();
    }

    /**
     * @method handleInput
     * @description Handles user input
     */
    protected handleInput(): void {
        let keypress = this.lobbyNav.getKeyEvent();
        
        // If the field is in edit mode, handle field-specific input
        if (this.lobbyNameField.isInEditMode()) {
            if (keypress !== KEY_EVENTS.NONE && keypress !== KEY_EVENTS.ENTER) {
                const canvasSize = getCanvasSize();
                this.lobbyNameField.draw(canvasSize, keypress);
            }
        } else {
            // Normal navigation when not in edit mode
            if (keypress === KEY_EVENTS.UP) {
                this.lobbyNav.selectClosest(270);
            } else if (keypress === KEY_EVENTS.RIGHT) {
                this.lobbyNav.selectClosest(0);
            } else if (keypress === KEY_EVENTS.DOWN) {
                this.lobbyNav.selectClosest(90);
            } else if (keypress === KEY_EVENTS.LEFT) {
                this.lobbyNav.selectClosest(180);
            } else if (keypress === KEY_EVENTS.SELECT) {
                // Handle button selection
                if (this.lobbyNav.getCurrentlySelected() instanceof MenuButton) {
                    const selectedButton = (this.lobbyNav.getCurrentlySelected() as MenuButton);
                    
                    if (selectedButton.getText() === 'Return') {
                        this.startTransitionOut(Screens.MULTIPLAYER_SCREEN);
                    } else if (selectedButton.getText() === 'Create') {
                        this.showLoadingIcon = true;
                        this.keylistener.deactivate();
                        setTimeout(() => this.createLobby(), 1000);
                    }
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
        return this.lobbyNav.getCurrentlySelected();
    }

    /**
     * @method createLobby
     * @description Creates a new lobby with the specified parameters
     */
    private createLobby(): void {
        // Get the lobby name
        const lobbyName = this.lobbyNameField.getText();
        if (lobbyName === "") {
            this.lobbyNameField.shake();
            this.lobbyNameField.setError("The lobby name cannot be empty.");
            this.showLoadingIcon = false;
            this.keylistener.activate();
            return;
        }

        // Get the player ID from local storage
        let playerID = localStorage.getItem("playerID") || "defaultPlayerID";

        // Create the lobby
        try { 
            this.webManager.createLobby(
                lobbyName,
                this.playerNumSlider.getValue(),
                this.levelSizeSlider.getValue(),
                this.slotNumSlider.getValue(),
                playerID
            ).then(success => {
                console.log(`Lobby creation ${success ? 'successful' : 'failed'}: ${lobbyName}`);
                if (success) {
                    // Store the lobby information for later use
                    localStorage.setItem('currentLobby', lobbyName);
                    localStorage.setItem('playerID', playerID);
                    this.createButton.setConfirmed(true);
                    this.showLoadingIcon = false;
                    
                    // Start transition to loading screen
                    this.startTransitionOut(Screens.LOADING_SCREEN);
                    
                    // Override onTransitionOutComplete to handle the loading screen
                    this.onTransitionOutComplete = () => {
                        const action = () => {};
                        const condition = () => true;
                        
                        GuiManager.changeScreen(
                            Screens.LOADING_SCREEN,
                            this.sketch,
                            Screens.GAME_SCREEN,
                            "Creating Lobby",
                            action,
                            condition
                        );
                    };
                } else {
                    console.error(`Lobby creation failed: ${lobbyName}`);
                    this.lobbyNameField.shake();
                    this.lobbyNameField.setError("Lobby creation failed: API error");
                    this.showLoadingIcon = false;
                    this.keylistener.activate();
                }
            }).catch(error => {
                console.error('Error creating lobby:', error);
                this.lobbyNameField.shake();
                this.lobbyNameField.setError(error);
                this.showLoadingIcon = false;
                this.keylistener.activate();
            });
        } catch(error) {
            console.error('Error creating lobby:', error as string);
            this.lobbyNameField.shake();
            this.lobbyNameField.setError(error as string);
            this.showLoadingIcon = false;
            this.keylistener.activate();
        }
    }
}
