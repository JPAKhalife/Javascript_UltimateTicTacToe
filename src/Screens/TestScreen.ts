/**
 * @file TestScreen.ts
 * @description //This file is responsible for drawing the test screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */



import GameManager from "../GameManager";
import Menu from "../Menu"
import { GameType } from "../GameManager";
import TicTacBoard from "../MenuObjects/TicTacBoard";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import p5 from "p5";
import { getCanvasSize } from "../sketch";


export default class TestScreen implements Menu {

    private game: GameManager;
    private board: TicTacBoard;
    private keylistener: KeyListener;
    private sketch: p5
    
    constructor(sketch: p5) {
        this.sketch = sketch
        this.game = new GameManager(GameType.LOCAL, 3, 2);
        this.board = new TicTacBoard(sketch,this.game,this.game.getBoard(),getCanvasSize()/2,getCanvasSize()/2,getCanvasSize() - 100);
        this.keylistener = new KeyListener(sketch);
    }
    
    public init(): void {

    }

    public draw(): void {
        this.sketch.background(0);
        this.board.draw();
        let keyEvent = this.keylistener.listen();
        if (keyEvent == KEY_EVENTS.UP) {
            this.board.cursorUp();
        } else if (keyEvent == KEY_EVENTS.DOWN) {
            this.board.cursorDown();
        } else if (keyEvent == KEY_EVENTS.LEFT) {
            this.board.cursorLeft();
        } else if (keyEvent == KEY_EVENTS.RIGHT) {
            this.board.cursorRight();
        } else if (keyEvent == KEY_EVENTS.SELECT) {
            this.board.selectTicTac();
        } else if (keyEvent == KEY_EVENTS.ESCAPE) {
            //!TODO ADD an exit feature
        }
        
    }

    public resize(): void {
        this.board.cachePoints();
    }
}
