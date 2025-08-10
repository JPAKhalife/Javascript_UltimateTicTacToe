/**
 * @file GameScreen.ts
 * @description //This file is responsible for drawing the Game screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


import p5 from "p5";
import GameManager, { GameType } from "../GameManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import TicTacBoard from "../MenuObjects/TicTacBoard";
import { getCanvasSize, fontmono, HEADER, fontOSDMONO } from "../sketch";


export default class GameScreen implements Menu {

    private keylistener: KeyListener;
    private sketch: p5;
    private game: GameManager;
    private board: TicTacBoard;
    private gameType: GameType;

    constructor(sketch: p5, gameType = GameType.LOCAL, gridSize = 3, gridLevels = 2) {
        this.keylistener = new KeyListener(sketch);
        this.sketch = sketch;
        this.gameType = gameType;

        // Create a game given the parameters passed to the function
        this.game = new GameManager(gameType, gridSize, gridLevels);
        this.board = new TicTacBoard(this.sketch, this.game, 0.5,0.5,1);
    }

    public draw(): void {
        this.sketch.background(0);

        // Draw text information
        this.drawGameInfo();

        // Reset stroke settings before drawing the board
        this.sketch.stroke(255);
        this.sketch.strokeWeight(1);


        // Render our board
        this.board.draw();

        // Detect key presses that get put into the tictacboard
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
        }
    }

    /**
     * Draw all text information for the game screen
     */
    private drawGameInfo(): void {
        const canvasSize = getCanvasSize();

        // Set text properties
        this.sketch.textFont(fontOSDMONO);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.fill(255);
        this.sketch.noStroke(); // Prevent text from having stroke

        // Draw title
        this.sketch.textSize(canvasSize * 0.04);
        this.sketch.text("Utimate Tictactoe", canvasSize / 2, canvasSize / 20);

        // Draw mode
        this.sketch.textSize(canvasSize * 0.04);
        this.sketch.text("Local Mode", canvasSize / 2, canvasSize / 20 * 2);

        // Draw current player info
        this.sketch.textSize(canvasSize * 0.03);
        this.sketch.text("Current Player:", canvasSize / 2, canvasSize / 20 * 17);
        this.sketch.text(HEADER.PLAYER_NAMES[this.game.getTurn() - 1], canvasSize / 2, canvasSize / 20 * 18);

        // Draw online-specific information if needed
        if (this.gameType == GameType.ONLINE) {
            // TODO: Draw online-specific information
            // - Lobby name
            // - Number of spectators
            // - Opponent info
        }
    }
}
