/**
 * @file CreateLobbyScreen.ts
 * @description This file is responsible for displaying all open lobbies
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import Menu, { Screens } from "../Menu";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize } from "../sketch";
import { MenuButton } from "../MenuObjects/MenuButton";
import MenuNav from "../MenuObjects/MenuNav";
import GuiManager from "../GuiManager";
import Slider from "../MenuObjects/Slider";
import WebManager, { LobbyInfo as WebManagerLobbyInfo } from "../WebManager";
import Field from "../MenuObjects/Field";
import LoadingSpinner from "../MenuObjects/LoadingSpinner";


export default class CreateLobbyScreen implements Menu {
    
    private sketch: p5;
    private keylistener: KeyListener;
    private webManager: WebManager;

    //Buttons
    private returnToOnlineScreen: MenuButton;
    private lobbyNav: MenuNav;
    //Sliders
    private levelSizeSlider: Slider;
    private slotNumSlider: Slider;
    private playerNumSlider: Slider;
    //Fields
    private lobbyNameField: Field;
    //Icon
    private loadingIcon: LoadingSpinner;

    //Transition varaibles
    private transition_in_active: boolean = false;
    private transition_out_active: boolean = false;
    private transitionTimer: number = 0;
    private transitionDuration: number = 60; // 1 second at 60fps
    private transitionComplete: boolean = false;
    private lineOpacity: number = 255;
    private selectedButton: MenuButton;
    private showLoadingIcon: boolean;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);
        this.webManager = WebManager.getInstance();

        //This is where the menu buttons will be defined
        this.returnToOnlineScreen = new MenuButton(this.sketch, 0.5, 0.13, "Return", 0.05, 0.2, 50*0.25, 255);
        let createLobbyButton = new MenuButton(this.sketch, 0.5, 0.86, "Create", 0.05, 0.2, 50*0.25, 255);
        // Create the lobby name field with proper parameters (using relative positioning like in UsernameScreen)
        this.lobbyNameField = new Field(this.sketch, 0.5, 0.30, 0.4, 0.08, this.keylistener, 36, "Lobby Name", getCanvasSize() * 0.025, getCanvasSize() * 0.5, getCanvasSize()*0.3-60);
        this.lobbyNameField.setOpacity(255);
        this.levelSizeSlider = new Slider(this.sketch, this.keylistener, getCanvasSize()/2, getCanvasSize() * 0.46, getCanvasSize()/2, 5, 1, 9, 1, 2, "Level Size");
        this.slotNumSlider = new Slider(this.sketch, this.keylistener, getCanvasSize()/2, getCanvasSize() * 0.76, getCanvasSize()/2, 5, 1, 9, 1, 3, "Slot Number");
        this.playerNumSlider = new Slider(this.sketch, this.keylistener, getCanvasSize()/2, getCanvasSize() * 0.61, getCanvasSize()/2, 5, 2, 10, 1, 2, "Player Number");
        
        this.loadingIcon = new LoadingSpinner(sketch, getCanvasSize() / 2, getCanvasSize() * 0.94, 40);
        this.showLoadingIcon = false;
        this.selectedButton = this.returnToOnlineScreen;

        this.lobbyNav = new MenuNav([
            this.returnToOnlineScreen,
            this.levelSizeSlider,
            this.slotNumSlider,
            this.lobbyNameField,
            createLobbyButton,
            this.playerNumSlider
        ], this.sketch);

        
    }

    /**
     * @method handleTransitionOut
     * @description This method is called when the screen is transitioning out.
     */
    private handleTransitionOut(): void 
    {
        // Only change screen when transition is complete
        if (this.transitionTimer >= this.transitionDuration) {
            if (this.selectedButton.getText() === 'Return') {
                GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
            } else if (this.selectedButton.getText() == 'Create') {
                const action = () => {};
                const condition = () => {
                    return true;   
                }

                GuiManager.changeScreen(Screens.LOADING_SCREEN, this.sketch, Screens.GAME_SCREEN, "Creating Lobby", action, condition);
            }
            this.transitionComplete = true;
        }
    }
    
    /**
     * @method animateTransitionOut
     * @description Animates the transition out by fading all elements
     */
    private animateTransitionOut(): void {
        // Fade out all menu items
        for (let i = 0; i < this.lobbyNav.getLength(); i++) {
            const item = this.lobbyNav.getAtIndex(i);
            item.fade(255 / this.transitionDuration);
        }
        
        // Fade out the side lines
        this.lineOpacity -= 255 / this.transitionDuration;
        
        // Increment the transition timer
        this.transitionTimer++;
    }

    public draw(): void 
    {
        this.sketch.background(0);

        //Add two lines along the top and bottom of the screen
        this.sketch.push();
            this.sketch.stroke(255, this.lineOpacity);
            this.sketch.strokeWeight(5);
            this.sketch.line(getCanvasSize()/5, 0, getCanvasSize()/5, getCanvasSize());
            this.sketch.line(getCanvasSize()/5*4, 0, getCanvasSize()/5*4, getCanvasSize());
        this.sketch.pop();

        // Draw the buttons for options
        this.lobbyNav.drawAll();

        //Check for transitionout
        if (this.transition_out_active && !this.transitionComplete) {
            this.animateTransitionOut();
            this.handleTransitionOut();
        }

        if (this.showLoadingIcon) {
            this.loadingIcon.draw();
        }

        // Detect any keypresses
        let keypress = this.lobbyNav.getKeyEvent();
        // Handle keypresses
        if (!this.transition_in_active && !this.transition_out_active) {
            if (!this.lobbyNameField.isInEditMode()) {
                if (keypress === KEY_EVENTS.UP) {
                    this.lobbyNav.selectClosest(270);
                } else if (keypress === KEY_EVENTS.RIGHT) {
                    this.lobbyNav.selectClosest(0);
                } else if (keypress === KEY_EVENTS.DOWN) {
                    this.lobbyNav.selectClosest(90);
                } else if (keypress === KEY_EVENTS.LEFT) {
                    this.lobbyNav.selectClosest(180);
                } else if (keypress === KEY_EVENTS.SELECT) {
                    // Store which button was selected
                    if (this.lobbyNav.getCurrentlySelected() instanceof MenuButton) {
                        this.selectedButton = (this.lobbyNav.getCurrentlySelected() as MenuButton);
                        if (this.selectedButton.getText() === 'Create') {
                            this.showLoadingIcon = true;
                            this.keylistener.deactivate();
                            setTimeout(() => this.createLobby(), 1000);
                        }
                    }
                }
            }
        }
    }



    public resize(): void{
        
    }

    private createLobby(): void {
        // Generate a unique lobby name
        const lobbyName = this.lobbyNameField.getText();
        if (lobbyName == "") {
            this.lobbyNameField.shake();
            this.lobbyNameField.setError("The lobby name cannot be empty.");
            this.showLoadingIcon = false;
            this.keylistener.activate();
            return
        }

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
                this.selectedButton.setConfirmed(true);
                this.showLoadingIcon = false;
                this.transition_out_active = true;
            } else {
                console.error(`Lobby creation failed: ${lobbyName}`);
                this.lobbyNameField.shake();
                this.lobbyNameField.setError("Lobby creation failed: API error");
                this.showLoadingIcon = false;
                this.keylistener.activate();
                return;
            }
        }).catch(error => {
            console.error('Error creating lobby:', error);
            this.lobbyNameField.shake();
            this.lobbyNameField.setError(error);
            this.showLoadingIcon = false;
            this.keylistener.activate();
            return;
        });
        } catch(error) {
            console.error('Error creating lobby:', error as string);
            this.lobbyNameField.shake();
            this.lobbyNameField.setError(error as string);
            this.showLoadingIcon = false;
            this.keylistener.activate();
            return;
        }
    }
    
}
