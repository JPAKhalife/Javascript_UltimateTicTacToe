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
import WebManager from "../WebManager";

export default class CreateLobbyScreen implements Menu {
    
    private sketch: p5;
    private keylistener: KeyListener;

    //Buttons
    private returnToOnlineScreen: MenuButton;
    private lobbyNav: MenuNav;
    //Sliders
    private levelSizeSlider: Slider;
    private slotNumSlider: Slider;
    private playerNumSlider: Slider;

    //Transition varaibles
    private transition_in_active: boolean = false;
    private transition_out_active: boolean = false;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);

        //This is where the menu buttons will be defined
        this.returnToOnlineScreen = new MenuButton(this.sketch, 0.5, 0.20, "Return", 0.05, 0.2, 50*0.25, 255);
        let createLobbyButton = new MenuButton(this.sketch, 0.5, 0.80, "Create", 0.05, 0.2, 50*0.25, 255);
        this.levelSizeSlider = new Slider(this.sketch, this.keylistener, getCanvasSize()/2, getCanvasSize() * 0.35, getCanvasSize()/2, 5, 1, 9, 1, 2, "Level Size");
        this.slotNumSlider = new Slider(this.sketch, this.keylistener, getCanvasSize()/2, getCanvasSize() * 0.65, getCanvasSize()/2, 5, 1, 9, 1, 3, "Slot Number");
        this.playerNumSlider = new Slider(this.sketch, this.keylistener, getCanvasSize()/2, getCanvasSize() * 0.50, getCanvasSize()/2, 5, 2, 10, 1, 2, "Player Number");


        this.lobbyNav = new MenuNav([
            this.returnToOnlineScreen,
            this.levelSizeSlider,
            this.slotNumSlider,
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
        const selectedPhrase = (this.lobbyNav.getCurrentlySelected() as MenuButton).getText();
            if (selectedPhrase === 'Return') {
                GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
            } else if (selectedPhrase == 'Create') {
                WebManager.initiateConnectionIfNotEstablished();

                // Use a default level size since we can't directly access the slider's value
                const levelSize = 10; // Default level size
                
                // Generate a unique lobby name
                const lobbyName = `lobby_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                
                // Create a unique player ID
                const playerID = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                
                // Create the lobby
                WebManager.createLobby(
                    lobbyName,
                    this.playerNumSlider.getValue(),
                    this.levelSizeSlider.getValue(),
                    this.slotNumSlider.getValue(), // Default grid size of 3x3
                    playerID
                ).then(success => {
                    console.log(`Lobby creation ${success ? 'successful' : 'failed'}: ${lobbyName}`);
                    // Store the lobby information for later use
                    localStorage.setItem('currentLobby', lobbyName);
                    localStorage.setItem('playerID', playerID);
                }).catch(error => {
                    console.error('Error creating lobby:', error);
                });
                
                GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
            } else {
                GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch); 
            }
    }

    
    public draw(): void 
    {
        this.sketch.background(0);

        //Add two lines along the top and bottom of the screen
        this.sketch.push();
            this.sketch.stroke(255);
            this.sketch.strokeWeight(5);
            this.sketch.line(getCanvasSize()/5, 0, getCanvasSize()/5, getCanvasSize());
            this.sketch.line(getCanvasSize()/5*4, 0, getCanvasSize()/5*4, getCanvasSize());
        this.sketch.pop();

        this.returnToOnlineScreen.draw();

        // Draw the buttons for options
        this.lobbyNav.drawAll();

        //Check for transitionout
        if (this.transition_out_active) {
            this.handleTransitionOut();
        }

        // Detect any keypresses
        let keypress = this.lobbyNav.getKeyEvent();
        // Handle keypresses
        if (!this.transition_in_active && !this.transition_out_active) {
            if (keypress === KEY_EVENTS.UP) {
                this.lobbyNav.selectClosest(270);
            } else if (keypress === KEY_EVENTS.RIGHT) {
                this.lobbyNav.selectClosest(0);
            } else if (keypress === KEY_EVENTS.DOWN) {
                this.lobbyNav.selectClosest(90);
            } else if (keypress === KEY_EVENTS.LEFT) {
                this.lobbyNav.selectClosest(180);
            } else if (keypress === KEY_EVENTS.SELECT) {
                this.lobbyNav.confirm();
                this.transition_out_active = true;
                this.keylistener.deactivate();
            }
        }
    }

    public resize(): void{
        
    }
}
