/**
 * @file GameScreen.ts
 * @description This file is responsible for drawing the Game screen
 * @author John Khalife (refactored by Cline)
 * @created 2024-06-9
 * @updated 2025-08-12
 */

import p5 from "p5";
import GameManager, { GameType } from "../GameManager";
import { KEY_EVENTS } from "../KeyListener";
import { Screens } from "../Menu";
import TicTacBoard from "../MenuObjects/TicTacBoard";
import { getCanvasSize, fontOSDMONO, HEADER } from "../sketch";
import TransitionableScreen from "./TransitionableScreen";
import BaseMenuItem from "../MenuObjects/BaseMenuItem";

const GAME_SCREEN_ANIMATION_TIME = 60;

export default class GameScreen extends TransitionableScreen {
    private game: GameManager;
    private board: TicTacBoard;
    private gameType: GameType;
    private gameOver: boolean;

    constructor(sketch: p5, gameType = GameType.LOCAL, gridSize = 3, gridLevels = 2) {
        // Initialize with custom options
        super(sketch, {
            animationTime: GAME_SCREEN_ANIMATION_TIME,
            borderWidth: 0.017,
            borderAnimationTime: 30,
            useBorder: true,
            fadeContent: true
        });
        
        this.gameType = gameType;
        this.gameOver = false;

        // Create a game given the parameters passed to the function
        this.game = new GameManager(gameType, gridSize, gridLevels);
        this.board = new TicTacBoard(this.sketch, this.game, 0.5, 0.5, 1);
        
        // Register the board for transition handling
        this.registerUIElements([this.board]);
    }

    /**
     * @method drawContent
     * @description Draws the game screen content
     */
    protected drawContent(): void {
        // Draw text information
        this.drawGameInfo();

        // Reset stroke settings before drawing the board
        this.sketch.stroke(255, 255, 255, this.opacity);
        this.sketch.strokeWeight(1);

        // Render our board
        this.board.draw();
    }

    /**
     * @method handleInput
     * @description Handles user input
     */
    protected handleInput(): void {
        let keyEvent = this.keylistener.listen();
        
        if (keyEvent === KEY_EVENTS.UP) {
            this.board.cursorUp();
        } else if (keyEvent === KEY_EVENTS.DOWN) {
            this.board.cursorDown();
        } else if (keyEvent === KEY_EVENTS.LEFT) {
            this.board.cursorLeft();
        } else if (keyEvent === KEY_EVENTS.RIGHT) {
            this.board.cursorRight();
        } else if (keyEvent === KEY_EVENTS.SELECT) {
            const result = this.board.selectTicTac();
            
            // Check if the game is over after a move
            // We can determine this by checking if the board's top-level TicTac has a winner
            const winner = this.game.getBoard().getWinner();
            if (winner !== 0 || this.gameOver) {
                this.gameOver = true;
                // If game is over, transition to setup screen after a delay
                setTimeout(() => {
                    this.startTransitionOut(Screens.SETUP_SCREEN);
                }, 2000); // 2 second delay to show the final state
            }
        }
    }

    /**
     * @method getSelectedElement
     * @description Gets the currently selected UI element
     * @returns The board as the selected element
     */
    protected getSelectedElement(): BaseMenuItem | null {
        return this.board;
    }

    /**
     * Draw all text information for the game screen
     */
    private drawGameInfo(): void {
        const canvasSize = getCanvasSize();

        // Set text properties
        this.sketch.push();
        this.sketch.textFont(fontOSDMONO);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.fill(255, 255, 255, this.opacity);
        this.sketch.noStroke(); // Prevent text from having stroke

        // Draw title
        this.sketch.textSize(canvasSize * 0.04);
        this.sketch.text("Ultimate Tictactoe", canvasSize / 2, canvasSize / 20);

        // Draw mode
        this.sketch.textSize(canvasSize * 0.04);
        const modeText = this.gameType === GameType.ONLINE ? "Online Mode" : "Local Mode";
        this.sketch.text(modeText, canvasSize / 2, canvasSize / 20 * 2);

        // Draw current player info
        this.sketch.textSize(canvasSize * 0.03);
        this.sketch.text("Current Player:", canvasSize / 2, canvasSize / 20 * 17);
        this.sketch.text(HEADER.PLAYER_NAMES[this.game.getTurn() - 1], canvasSize / 2, canvasSize / 20 * 18);

        // Draw online-specific information if needed
        if (this.gameType === GameType.ONLINE) {
            // Draw online-specific information
            const lobbyName = localStorage.getItem('currentLobby') || 'Unknown Lobby';
            this.sketch.textSize(canvasSize * 0.025);
            this.sketch.text(`Lobby: ${lobbyName}`, canvasSize / 2, canvasSize / 20 * 3);
            
            // Could add more online-specific info here in the future:
            // - Number of spectators
            // - Opponent info
        }
        
        // Draw game over message if applicable
        const winner = this.game.getBoard().getWinner();
        if (winner !== 0 || this.gameOver) {
            this.gameOver = true;
            this.sketch.textSize(canvasSize * 0.06);
            this.sketch.fill(255, 255, 0, this.opacity); // Yellow text for emphasis
            
            let gameOverText = "Game Over!";
            
            if (winner > 0) {
                gameOverText = `${HEADER.PLAYER_NAMES[winner - 1]} Wins!`;
            } else if (winner === 0 && this.gameOver) {
                gameOverText = "It's a Draw!";
            }
            
            this.sketch.text(gameOverText, canvasSize / 2, canvasSize / 2);
            
            this.sketch.textSize(canvasSize * 0.03);
            this.sketch.text("Returning to menu...", canvasSize / 2, canvasSize / 2 + canvasSize * 0.08);
        }
        
        this.sketch.pop();
    }
}
