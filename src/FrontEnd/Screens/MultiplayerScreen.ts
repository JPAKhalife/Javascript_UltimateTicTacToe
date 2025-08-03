/**
 * @file MultiplayerScreen.ts
 * @description This file is responsible for displaying all open lobbies
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import Menu, { Screens } from "../Menu";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize, getRandomInt } from '../sketch';
import { MenuButton } from "../MenuObjects/MenuButton";
import MenuNav from "../MenuObjects/MenuNav";
import GuiManager from "../GuiManager";
import LobbyDot, { LobbyInfo } from "../MenuObjects/LobbyDot";
import { FRAMERATE } from "../Constants";
import { LobbyInfo as LobbyDotInfo } from "../MenuObjects/LobbyDot";
import WebManager from '../WebManager'; 

const LOBBY_REFRESH_TIME = 7 * FRAMERATE; // 3 seconds
const DEFAULT_LOBBY_DISPLAY_NUM = 5; // Default number of lobbies to display at a time

export default class MultiplayerScreen implements Menu {
    
    private sketch: p5;
    private keylistener: KeyListener;

    //Buttons
    private returnToSetupScreen: MenuButton;
    private createNewLobby: MenuButton;
    private lobbyNav: MenuNav;

    //Transition variables
    private transition_in_active: boolean = false;
    private transition_out_active: boolean = false;
    private lobbyRefreshTime: number = LOBBY_REFRESH_TIME;

    // Bounds for lobby icons
    private XMIN: number;
    private XMAX: number;
    private YMIN: number;
    private YMAX: number;

    private webManager: WebManager;
    private lobbyList:  LobbyInfo[];


    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);
        this.webManager = WebManager.getInstance();
        this.lobbyList = [];
        this.fetchLobbyList(DEFAULT_LOBBY_DISPLAY_NUM)

        // Initialize bounds
        this.XMIN = getCanvasSize() / 4;
        this.XMAX = getCanvasSize() / 5 * 4;
        this.YMIN = getCanvasSize() / 4;
        this.YMAX = getCanvasSize() / 4 * 3;

        // Define menu buttons
        this.returnToSetupScreen = new MenuButton(this.sketch, 0.15, 0.20, "Return", 0.05, 0.2, 50 * 0.25, 255);
        this.createNewLobby = new MenuButton(this.sketch, 0.85, 0.20, "Create Lobby", 0.05, 0.2, 50 * 0.25, 255);
        this.lobbyNav = new MenuNav([
            this.returnToSetupScreen,
            this.createNewLobby
        ], this.sketch);
    }

    /**
     * @method handleTransitionOut
     * @description This method is called when the screen is transitioning out.
     */
    private handleTransitionOut(): void {
        const selectedPhrase = (this.lobbyNav.getCurrentlySelected() as MenuButton).getText();
        if (selectedPhrase === 'Return') {
            GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
        } else if (selectedPhrase === 'Create Lobby') {
            GuiManager.changeScreen(Screens.CREATE_LOBBY_SCREEN, this.sketch);
        } else {
            GuiManager.changeScreen(Screens.START_SCREEN, this.sketch);
        }
    }

    public draw(): void {
        this.sketch.background(0);
        // Add two lines along the top and bottom of the screen
        this.sketch.stroke(255);
        this.sketch.strokeWeight(5);
        this.sketch.line(0, getCanvasSize() / 4, getCanvasSize(), getCanvasSize() / 4);
        this.sketch.line(0, getCanvasSize() / 4 * 3, getCanvasSize(), getCanvasSize() / 4 * 3);

        //Add a third line along the left side of the screen
        this.sketch.line(getCanvasSize()/4,getCanvasSize() / 4,getCanvasSize() / 4,getCanvasSize() / 4 * 3);

        // Draw all BaseMenuItem objects
        this.lobbyNav.drawAll();

        //Lobby dot timer
        if (this.lobbyRefreshTime <= 0) {
            this.displayMutiplayerLobby();
            this.lobbyRefreshTime = LOBBY_REFRESH_TIME;   
            if (this.lobbyList.length <= 0) {
                this.fetchLobbyList(DEFAULT_LOBBY_DISPLAY_NUM);
            }
        } else {
            this.lobbyRefreshTime--;
        }

        // Display lobby information on the left panel
        this.displayLobbyInfo();


        // Check for transition out
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

    public resize(): void {
        // Update bounds based on the new canvas size
        this.XMIN = getCanvasSize() / 5;
        this.XMAX = getCanvasSize() / 5 * 4;
        this.YMIN = getCanvasSize() / 4;
        this.YMAX = getCanvasSize() / 4 * 3;
    }

    /**
     * @method displayMutiplayerLobbies
     * @description This method is used to access any multiplayer lobbies that exist, and display them in the empty space in the middle of the screen.
     * @param number {number} The number of multiplayer lobbies to search for
     */
    displayMutiplayerLobby(): void {
        if (this.lobbyList.length <= 0) {return;}
        for (let i = 0 ; i < this.lobbyNav.getLength() ; i++) {
            if (this.lobbyNav.getAtIndex(i) instanceof LobbyDot) {
                let lobbyDot = (this.lobbyNav.getAtIndex(i) as LobbyDot);
                if(this.lobbyList.at(0)?.lobbyID == lobbyDot.getLobbyInfo().lobbyID) {
                    lobbyDot.setLobbyInfo(this.lobbyList.shift() ?? (() => { throw new Error("Lobby list is empty"); })())
                    return;
                }
            }
        }

        // Generate our x and y coordinates
        let x = getRandomInt(this.XMIN, this.XMAX);
        let y = getRandomInt(this.YMIN, this.YMAX);

        // Create a new LobbyDot and add it to the lobbyNav
            this.lobbyNav.addItem(new LobbyDot(
                this.sketch,
                x,
                y,
                5,
                getRandomInt(3, 15) * FRAMERATE,
                this.lobbyList.shift() ?? (() => { throw new Error("Lobby list is empty"); })(),
                this.lobbyNav,
                getCanvasSize() / 4,
                getCanvasSize() / 2,
            ));
    }

        /**
     * @method fetchLobbyList
     * @description Fetches the list of lobbies from the server and converts them to LobbyDotInfo format
     */
    private async fetchLobbyList(maxListLength: number): Promise<void> {
        try {
            // Await the promise from getLobbyList
            const webManagerLobbies = await this.webManager.getLobbyList({maxListLength: maxListLength});
            // Convert WebManagerLobbyInfo objects to LobbyDotInfo objects
            webManagerLobbies.map(lobby => {
                this.lobbyList.push(new LobbyDotInfo(
                    lobby.lobbyID,
                    lobby.lobbyState,
                    lobby.playersJoined,
                    lobby.gridSize,
                    lobby.levelSize,
                    lobby.playersJoined,
                ));
            });
        } catch (error) {
            console.error('Error fetching lobby list:', error);
            this.lobbyList = [];
        }
    }

    /**
     * @method displayLobbyInfo
     * @description Displays lobby information on the left side of the screen
     */
    private displayLobbyInfo(): void {
        // Set text properties
        this.sketch.fill(255); // White text
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
        
        const leftPanelX = getCanvasSize() / 8; // Center of left panel
        const topMargin = getCanvasSize() / 4 + 30; // Start below the top line with some margin
        const lineHeight = 30; // Space between lines
        
        // Display header
        this.sketch.textSize(24);
        this.sketch.text("LOBBY INFO", leftPanelX, topMargin);
        
        // Check if a lobby is selected
        if (this.lobbyNav.getCurrentlySelected() instanceof LobbyDot) {
            // Get selected lobby info
            const selectedLobbyInfo = (this.lobbyNav.getCurrentlySelected() as LobbyDot).getLobbyInfo();
            
            // Display detailed lobby information
            this.sketch.textSize(18);
            this.sketch.text("ID: " + selectedLobbyInfo.lobbyID, leftPanelX, topMargin + lineHeight * 2);
            
            this.sketch.textSize(16);
            this.sketch.text("Status: " + selectedLobbyInfo.state, leftPanelX, topMargin + lineHeight * 3.5);
            this.sketch.text("Players: " + selectedLobbyInfo.joinedPlayers + "/" + selectedLobbyInfo.players, 
                leftPanelX, topMargin + lineHeight * 4.5);
            
            // Draw a divider
            this.sketch.stroke(255);
            this.sketch.strokeWeight(1);
            this.sketch.line(
                leftPanelX - getCanvasSize() / 12, 
                topMargin + lineHeight * 5.5, 
                leftPanelX + getCanvasSize() / 12, 
                topMargin + lineHeight * 5.5
            );
            this.sketch.noStroke();
            
            // Game configuration
            this.sketch.textSize(18);
            this.sketch.text("GAME CONFIG", leftPanelX, topMargin + lineHeight * 6.5);
            
            this.sketch.textSize(16);
            this.sketch.text("Grid Size: " + selectedLobbyInfo.gridsize + "×" + selectedLobbyInfo.gridsize, 
                leftPanelX, topMargin + lineHeight * 8);
            this.sketch.text("Level Size: " + selectedLobbyInfo.levelsize, 
                leftPanelX, topMargin + lineHeight * 9);
            
            // Instructions
            this.sketch.textSize(14);
            this.sketch.text("Press ENTER to join", leftPanelX, topMargin + lineHeight * 11);
        } else {
            // Display general lobby information
            this.sketch.textSize(18);
            this.sketch.text("AVAILABLE LOBBIES", leftPanelX, topMargin + lineHeight * 2);
            
            // Count lobby dots
            let lobbyCount = 0;
            for (let i = 0; i < this.lobbyNav.getLength(); i++) {
                if (this.lobbyNav.getAtIndex(i) instanceof LobbyDot) {
                    lobbyCount++;
                }
            }
            
            this.sketch.textSize(16);
            this.sketch.text("Open Lobbies: " + lobbyCount, leftPanelX, topMargin + lineHeight * 3.5);
            
            // Draw a divider
            this.sketch.stroke(255);
            this.sketch.strokeWeight(1);
            this.sketch.line(
                leftPanelX - getCanvasSize() / 12, 
                topMargin + lineHeight * 5, 
                leftPanelX + getCanvasSize() / 12, 
                topMargin + lineHeight * 5
            );
            this.sketch.noStroke();
            
            // Instructions
            this.sketch.textSize(16);
            this.sketch.text("INSTRUCTIONS", leftPanelX, topMargin + lineHeight * 6);
            
            this.sketch.textSize(14);
            this.sketch.text("Use arrow keys to", leftPanelX, topMargin + lineHeight * 7.5);
            this.sketch.text("navigate between lobbies", leftPanelX, topMargin + lineHeight * 8.5);
            this.sketch.text("Select a lobby to", leftPanelX, topMargin + lineHeight * 10);
            this.sketch.text("view details", leftPanelX, topMargin + lineHeight * 11);
        }
    }
}
