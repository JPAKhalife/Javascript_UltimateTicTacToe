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
import { getCanvasSize } from "../sketch";
import { MenuButton } from "../MenuObjects/MenuButton";
import MenuNav from "../MenuObjects/MenuNav";
import GuiManager from "../GuiManager";

export default class MultiplayerScreen implements Menu {
    
    private sketch: p5;
    private keylistener: KeyListener;

    //Buttons
    private returnToSetupScreen: MenuButton;
    private createNewLobby: MenuButton;
    private lobbyNav: MenuNav;

    //Transition varaibles
    private transition_in_active: boolean = false;
    private transition_out_active: boolean = false;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);

        //This is where the menu buttons will be defined
        this.returnToSetupScreen = new MenuButton(this.sketch, 0.15, 0.20, "Return", 0.05, 0.2, 50*0.25, 255);
        this.createNewLobby = new MenuButton(this.sketch, 0.85, 0.20, "Create Lobby", 0.05, 0.2, 50*0.25, 255);
        this.lobbyNav = new MenuNav([
            this.returnToSetupScreen,
            this.createNewLobby
        ]);
        
    }

    /**
     * @method handleTransitionIn
     * @description This method is called when the screen is transitioning out.
     */
    private handleTransitionOut(): void 
    {
        const selectedPhrase = (this.lobbyNav.getCurrentlySelected() as MenuButton).getText();
            if (selectedPhrase === 'Return') {
                GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
            } else if (selectedPhrase === 'Create Lobby') {
                GuiManager.changeScreen(Screens.GAME_SCREEN, this.sketch);
            } else {
                GuiManager.changeScreen(Screens.START_SCREEN, this.sketch);
            }
    }

    
    public draw(): void 
    {
        this.sketch.background(0);

        //Add two lines along the top and bottom of the screen
        //this.sketch.push();
            this.sketch.stroke(255);
            this.sketch.strokeWeight(5);
            this.sketch.line(0,getCanvasSize()/4,getCanvasSize(),getCanvasSize()/4);
            this.sketch.line(0,getCanvasSize()/4*3,getCanvasSize(),getCanvasSize()/4*3);
        //this.sketch.pop();

        //TODO: Add a button to the top right corner to create a new lobby
        this.createNewLobby.draw();
        // TODO: Add a button to the top left corner to go back to the menu
        this.returnToSetupScreen.draw();

        // TODO: Add some stats to show how many lobbies are open / players online

        // TODO: Add keylistener bits

        //Check for transitionout
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

    public resize(): void{
        
    }
}