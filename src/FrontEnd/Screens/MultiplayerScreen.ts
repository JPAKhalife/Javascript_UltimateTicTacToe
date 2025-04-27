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
import { getCanvasSize, getRandomInt } from "../sketch";
import { MenuButton } from "../MenuObjects/MenuButton";
import MenuNav from "../MenuObjects/MenuNav";
import GuiManager from "../GuiManager";
import LobbyDot from "../MenuObjects/LobbyDot";
import { FRAMERATE } from "../Constants";

const LOBBY_REFRESH_TIME = 3 * FRAMERATE; // 3 seconds
const DEFAULT_LOBBY_NUM = 1; // Default number of lobbies to display at a time

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


    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);

        // Initialize bounds
        this.XMIN = getCanvasSize() / 5;
        this.XMAX = getCanvasSize() / 5 * 4;
        this.YMIN = getCanvasSize() / 4;
        this.YMAX = getCanvasSize() / 4 * 3;

        // Define menu buttons
        this.returnToSetupScreen = new MenuButton(this.sketch, 0.15, 0.20, "Return", 0.05, 0.2, 50 * 0.25, 255);
        this.createNewLobby = new MenuButton(this.sketch, 0.85, 0.20, "Create Lobby", 0.05, 0.2, 50 * 0.25, 255);
        this.lobbyNav = new MenuNav([
            this.returnToSetupScreen,
            this.createNewLobby
        ]);
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

        // Draw all MenuItem objects
        this.lobbyNav.drawAll();

        //Lobby dot timer
        if (this.lobbyRefreshTime <= 0) {
            this.handleMutiplayerLobbies(DEFAULT_LOBBY_NUM);
            this.lobbyRefreshTime = LOBBY_REFRESH_TIME;
        } else {
            this.lobbyRefreshTime--;
        }

        // TODO: Add some stats to show how many lobbies are open / players online


        // Check for transition out
        if (this.transition_out_active) {
            this.handleTransitionOut();
        }

        // Detect any keypresses
        let keypress = this.keylistener.listen();
        // Handle keypresses
        if (!this.transition_in_active && !this.transition_out_active) {
            if (keypress === KEY_EVENTS.UP) {
                this.lobbyNav.selectClosest(2);
            } else if (keypress === KEY_EVENTS.RIGHT) {
                this.lobbyNav.selectClosest(1);
            } else if (keypress === KEY_EVENTS.DOWN) {
                this.lobbyNav.selectClosest(0);
            } else if (keypress === KEY_EVENTS.LEFT) {
                this.lobbyNav.selectClosest(3);
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
     * @method handleMutiplayerLobbies
     * @description This method is used to access any multiplayer lobbies that exist, and display them in the empty space in the middle of the screen.
     * @param number {number} The number of multiplayer lobbies to search for
     */
    handleMutiplayerLobbies(lobbyNum: number): void {
        // const isPointWithinBounds = (x: number, y: number, bounds: { xMin: number, xMax: number, yMin: number, yMax: number }): boolean => {
        //     return x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax;
        // };
        for (let i = 0 ; i < lobbyNum ; i++) {
            // Generate our x and y coordinates
            let x = getRandomInt(this.XMIN, this.XMAX);
            let y = getRandomInt(this.YMIN, this.YMAX);

            // Create a new lobbyDot
            this.lobbyNav.addItem(new LobbyDot(this.sketch, x, y, 5, getRandomInt(3,15) * FRAMERATE, 0, this.lobbyNav));
        }
    }
}
