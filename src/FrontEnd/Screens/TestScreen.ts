/**
 * @file TestScreen.ts
 * @description //This file is responsible for drawing the test screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */



import GameManager from "../GameManager";
import Menu, { Screens } from "../Menu"
import { GameType } from "../GameManager";
import TicTacBoard from "../MenuObjects/TicTacBoard";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import p5 from "p5";
import { getCanvasSize } from "../sketch";
import MenuNav from "../MenuObjects/MenuNav";


export default class TestScreen implements Menu {

    private lobbyNav: MenuNav;
    private keylistener: KeyListener;
    private sketch: p5
    
    constructor(sketch: p5) {
        this.sketch = sketch
        this.keylistener = new KeyListener(sketch);
        this.lobbyNav = new MenuNav([], this.sketch);
    }
    
    public init(): void {

    }

    public draw(): void {
        this.sketch.background(0);

        let keypress = this.keylistener.listen();
            if (keypress === KEY_EVENTS.UP) {
                this.lobbyNav.selectClosest(270);
            } else if (keypress === KEY_EVENTS.RIGHT) {
                this.lobbyNav.selectClosest(0);
            } else if (keypress === KEY_EVENTS.DOWN) {
                this.lobbyNav.selectClosest(90);
            } else if (keypress === KEY_EVENTS.LEFT) {
                this.lobbyNav.selectClosest(180);
            } else if (keypress === KEY_EVENTS.SELECT) {
                // this.keylistener.deactivate();
            }
    }
}
