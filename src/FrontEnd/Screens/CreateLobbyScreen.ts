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
import { LobbyInfo } from "../MenuObjects/LobbyDot";

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

    //Transition varaibles
    private transition_in_active: boolean = false;
    private transition_out_active: boolean = false;
    private transitionTimer: number = 0;
    private transitionDuration: number = 60; // 1 second at 60fps
    private transitionComplete: boolean = false;
    private lineOpacity: number = 255;
    private selectedButton: string = "";

    //Lobby list
    // private lobbyList: LobbyInfo[];

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);
        this.webManager = WebManager.getInstance();

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

        //Retrieve A list of lobbies
        // this.lobbyList = List();
        
    }

    /**
     * @method handleTransitionOut
     * @description This method is called when the screen is transitioning out.
     */
    private handleTransitionOut(): void 
    {
        // Only change screen when transition is complete
        if (this.transitionTimer >= this.transitionDuration) {
            if (this.selectedButton === 'Return') {
                GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
            } else if (this.selectedButton == 'Create') {
                const action = () => {
                    this.webManager.initiateConnectionIfNotEstablished().then(connected => {
                        if (connected) {
                            // Generate a unique lobby name
                            const lobbyName = `lobby_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                            
                            // Create a unique player ID
                            const playerID = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                            
                            // Create the lobby
                            this.webManager.createLobby(
                                lobbyName,
                                this.playerNumSlider.getValue(),
                                this.levelSizeSlider.getValue(),
                                this.slotNumSlider.getValue(),
                                playerID
                            ).then(success => {
                                console.log(`Lobby creation ${success ? 'successful' : 'failed'}: ${lobbyName}`);
                                // Store the lobby information for later use
                                localStorage.setItem('currentLobby', lobbyName);
                                localStorage.setItem('playerID', playerID);
                            }).catch(error => {
                                console.error('Error creating lobby:', error);
                            });
                        } else {
                            console.error('Failed to establish WebSocket connection');
                        }
                    });    
                }

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
                // Store which button was selected
                if (this.lobbyNav.getCurrentlySelected() instanceof MenuButton) {
                    this.selectedButton = (this.lobbyNav.getCurrentlySelected() as MenuButton).getText();
                    this.transition_out_active = true;
                }
                
                this.lobbyNav.confirm();
                this.keylistener.deactivate();
            }
        }
    }

    public resize(): void{
        
    }

    /**
     * @method getLobbyList
     * @description Queries the database to get a list of available lobbies and their info.
     */
    private getLobbyList() {
        this.webManager.getLobbyList({});
    }
}
