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

// Bounds for lobby icons as percentages of canvas size
const LOBBY_BOUNDS = {
    MIN_X: 0.25, // 25% from left
    MAX_X: 0.8,  // 80% from left
    MIN_Y: 0.25, // 25% from top
    MAX_Y: 0.75  // 75% from top
};

// Text sizes as percentages of canvas size
const TEXT_SIZES = {
    HEADER: 0.024, // ~24px on a 1000px canvas
    SUBHEADER: 0.018, // ~18px on a 1000px canvas
    NORMAL: 0.016, // ~16px on a 1000px canvas
    SMALL: 0.014 // ~14px on a 1000px canvas
};

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

    private webManager: WebManager;
    private lobbyList: LobbyInfo[];

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);
        this.webManager = WebManager.getInstance();
        this.lobbyList = [];
        this.fetchLobbyList(DEFAULT_LOBBY_DISPLAY_NUM);

        // Define menu buttons
        this.returnToSetupScreen = new MenuButton(this.sketch, 0.15, 0.20, "Return", 0.05, 0.2, 0.015, 255);
        this.createNewLobby = new MenuButton(this.sketch, 0.85, 0.20, "Create Lobby", 0.05, 0.2, 0.015, 255);
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
        // Clear background
        this.sketch.background(0);
        const canvasSize = getCanvasSize();
        
        // Draw border lines
        this.drawBorderLines(canvasSize);
        
        // Draw all menu items
        this.lobbyNav.drawAll();

        // Handle lobby refresh timer
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

        // Handle key navigation
        this.handleKeyNavigation();
    }
    
    /**
     * @method drawBorderLines
     * @description Draws the border lines of the screen
     * @param canvasSize The current canvas size
     */
    private drawBorderLines(canvasSize: number): void {
        this.sketch.stroke(255);
        this.sketch.strokeWeight(5);
        
        // Top horizontal line
        this.sketch.line(0, canvasSize * LOBBY_BOUNDS.MIN_Y, canvasSize, canvasSize * LOBBY_BOUNDS.MIN_Y);
        
        // Bottom horizontal line
        this.sketch.line(0, canvasSize * LOBBY_BOUNDS.MAX_Y, canvasSize, canvasSize * LOBBY_BOUNDS.MAX_Y);
        
        // Left vertical line
        this.sketch.line(canvasSize * LOBBY_BOUNDS.MIN_X, canvasSize * LOBBY_BOUNDS.MIN_Y, 
                         canvasSize * LOBBY_BOUNDS.MIN_X, canvasSize * LOBBY_BOUNDS.MAX_Y);
    }
    
    /**
     * @method handleKeyNavigation
     * @description Handles key navigation between menu items
     */
    private handleKeyNavigation(): void {
        let keypress = this.lobbyNav.getKeyEvent();
        
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

    /**
     * @method displayMutiplayerLobbies
     * @description This method is used to access any multiplayer lobbies that exist, and display them in the empty space in the middle of the screen.
     * @param number {number} The number of multiplayer lobbies to search for
     */
    displayMutiplayerLobby(): void {
        if (this.lobbyList.length <= 0) {return;}
        
        // Check if we need to update an existing lobby dot
        for (let i = 0; i < this.lobbyNav.getLength(); i++) {
            if (this.lobbyNav.getAtIndex(i) instanceof LobbyDot) {
                let lobbyDot = (this.lobbyNav.getAtIndex(i) as LobbyDot);
                if(this.lobbyList.at(0)?.lobbyID == lobbyDot.getLobbyInfo().lobbyID) {
                    lobbyDot.setLobbyInfo(this.lobbyList.shift() ?? (() => { throw new Error("Lobby list is empty"); })())
                    return;
                }
            }
        }

        // Generate random position within the lobby area
        const canvasSize = getCanvasSize();
        
        // Calculate random position directly using percentage bounds
        const xPercent = LOBBY_BOUNDS.MIN_X + Math.random() * (LOBBY_BOUNDS.MAX_X - LOBBY_BOUNDS.MIN_X);
        const yPercent = LOBBY_BOUNDS.MIN_Y + Math.random() * (LOBBY_BOUNDS.MAX_Y - LOBBY_BOUNDS.MIN_Y);

        // Create a new LobbyDot and add it to the lobbyNav
        this.lobbyNav.addItem(new LobbyDot(
            this.sketch,
            xPercent,
            yPercent,
            0.005, // 0.5% of canvas size for dot size
            getRandomInt(3, 15) * FRAMERATE,
            this.lobbyList.shift() ?? (() => { throw new Error("Lobby list is empty"); })(),
            this.lobbyNav,
            0.25, // 25% of canvas width for box X position
            0.5,  // 50% of canvas height for box Y position
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
        const canvasSize = getCanvasSize();
        const leftPanelX = canvasSize * 0.125; // Center of left panel (12.5% of canvas width)
        const topMargin = canvasSize * LOBBY_BOUNDS.MIN_Y + canvasSize * 0.03; // Start below the top line with 3% margin
        const lineHeight = canvasSize * 0.03; // Space between lines (3% of canvas height)
        
        // Set common text properties
        this.sketch.fill(255); // White text
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
        
        // Display header
        this.sketch.textSize(TEXT_SIZES.HEADER * canvasSize);
        this.sketch.text("LOBBY INFO", leftPanelX, topMargin);
        
        // Check if a lobby is selected
        if (this.lobbyNav.getCurrentlySelected() instanceof LobbyDot) {
            this.displaySelectedLobbyInfo(leftPanelX, topMargin, lineHeight, canvasSize);
        } else {
            this.displayGeneralLobbyInfo(leftPanelX, topMargin, lineHeight, canvasSize);
        }
    }
    
    /**
     * @method displaySelectedLobbyInfo
     * @description Displays information for the selected lobby
     */
    private displaySelectedLobbyInfo(leftPanelX: number, topMargin: number, lineHeight: number, canvasSize: number): void {
        // Get selected lobby info
        const selectedLobbyInfo = (this.lobbyNav.getCurrentlySelected() as LobbyDot).getLobbyInfo();
        
        // Display detailed lobby information
        this.sketch.textSize(TEXT_SIZES.SUBHEADER * canvasSize);
        this.sketch.text("Name: " + selectedLobbyInfo.lobbyID, leftPanelX, topMargin + lineHeight * 2);
        
        this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
        this.sketch.text("Status: " + selectedLobbyInfo.state, leftPanelX, topMargin + lineHeight * 3.5);
        this.sketch.text("Players: " + selectedLobbyInfo.joinedPlayers + "/" + selectedLobbyInfo.players, 
            leftPanelX, topMargin + lineHeight * 4.5);
        
        // Draw a divider
        this.drawDivider(leftPanelX, topMargin + lineHeight * 5.5, canvasSize * 0.083, canvasSize);
        
        // Game configuration
        this.sketch.textSize(TEXT_SIZES.SUBHEADER * canvasSize);
        this.sketch.text("GAME CONFIG", leftPanelX, topMargin + lineHeight * 6.5);
        
        this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
        this.sketch.text("Grid Size: " + selectedLobbyInfo.gridsize + "×" + selectedLobbyInfo.gridsize, 
            leftPanelX, topMargin + lineHeight * 8);
        this.sketch.text("Level Size: " + selectedLobbyInfo.levelsize, 
            leftPanelX, topMargin + lineHeight * 9);
        
        // Instructions
        this.sketch.textSize(TEXT_SIZES.SMALL * canvasSize);
        this.sketch.text("Press ENTER to join", leftPanelX, topMargin + lineHeight * 11);
    }
    
    /**
     * @method displayGeneralLobbyInfo
     * @description Displays general lobby information when no lobby is selected
     */
    private displayGeneralLobbyInfo(leftPanelX: number, topMargin: number, lineHeight: number, canvasSize: number): void {
        // Display general lobby information
        this.sketch.textSize(TEXT_SIZES.SUBHEADER * canvasSize);
        this.sketch.text("AVAILABLE LOBBIES", leftPanelX, topMargin + lineHeight * 2);
        
        // Count lobby dots
        let lobbyCount = 0;
        for (let i = 0; i < this.lobbyNav.getLength(); i++) {
            if (this.lobbyNav.getAtIndex(i) instanceof LobbyDot) {
                lobbyCount++;
            }
        }
        
        this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
        this.sketch.text("Open Lobbies: " + lobbyCount, leftPanelX, topMargin + lineHeight * 3.5);
        
        // Draw a divider
        this.drawDivider(leftPanelX, topMargin + lineHeight * 5, canvasSize * 0.083, canvasSize);
        
        // Instructions
        this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
        this.sketch.text("INSTRUCTIONS", leftPanelX, topMargin + lineHeight * 6);
        
        this.sketch.textSize(TEXT_SIZES.SMALL * canvasSize);
        this.sketch.text("Use arrow keys to", leftPanelX, topMargin + lineHeight * 7.5);
        this.sketch.text("navigate between lobbies", leftPanelX, topMargin + lineHeight * 8.5);
        this.sketch.text("Select a lobby to", leftPanelX, topMargin + lineHeight * 10);
        this.sketch.text("view details", leftPanelX, topMargin + lineHeight * 11);
    }
    
    /**
     * @method drawDivider
     * @description Draws a horizontal divider line
     */
    private drawDivider(centerX: number, y: number, width: number, canvasSize: number): void {
        this.sketch.stroke(255);
        this.sketch.strokeWeight(1);
        this.sketch.line(
            centerX - width, // Left end of divider
            y, 
            centerX + width, // Right end of divider
            y
        );
        this.sketch.noStroke();
    }
}
