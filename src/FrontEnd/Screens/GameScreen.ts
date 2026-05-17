/**
 * @file GameScreen.ts
 * @description //This file is responsible for drawing the Game screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import LocalGameManager from "../GameManager/LocalGameManager";
import OnlineGameManager from "../GameManager/OnlineGameManager";
import { GameManager, GameType } from "../GameManager/GameManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu";
import TicTacBoard from "../MenuObjects/TicTacBoard";
import { getCanvasSize, fontmono, HEADER, fontOSDMONO } from "../sketch";
import ScreenBorder from "../MenuObjects/ScreenBorder";
import type { GameStateInfo } from "../../Shared/Contracts/MessageToClientSchema";
import GuiManager from "../GuiManager";
import Popup from "../MenuObjects/Popup";

export default class GameScreen implements Menu {
  private keylistener: KeyListener;
  private sketch: p5;
  private game: LocalGameManager | OnlineGameManager;
  private board: TicTacBoard;
  private gameType: GameType;
  private border: ScreenBorder;
  private winnerPopup: Popup | null = null;
  private pausePopup: Popup | null = null;
  private fadeOutActive: boolean = false;
  private fadeOutAlpha: number = 0;
  private fadeInAlpha: number = 255;
  private static readonly FADE_SPEED = 255 / 30;

  constructor(
    sketch: p5,
    gameType = GameType.LOCAL,
    gridSize = 3,
    gridLevels = 2,
    lobbyID?: string,
  ) {
    this.keylistener = new KeyListener(sketch);
    this.sketch = sketch;
    this.gameType = gameType;
    console.info(
      "[GameScreen] Initializing game with mode: ",
      gameType === GameType.LOCAL ? "LOCAL" : "ONLINE",
    );

    // Create a game given the parameters passed to the function
    if (gameType === GameType.LOCAL) {
      // Local game - use LocalGameManager
      this.game = new LocalGameManager(gridSize, gridLevels);
    } else {
      const storedGameState = localStorage.getItem("gameState");
      if (!storedGameState) {
        throw new Error("Online game requires gameState in localStorage");
      }
      this.game = new OnlineGameManager(JSON.parse(storedGameState) as GameStateInfo);
    }

    this.board = new TicTacBoard(this.sketch, this.game, 0.5, 0.5, 0.8);
    this.border = new ScreenBorder(this.sketch, 0.01, 10, 255);
    this.border.setTransitionIn(true);
  }

  public getSketch(): p5 {
    return this.sketch;
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

    //Draw a border for the nice feel
    this.border.draw();

    // Fade-in overlay
    if (this.fadeInAlpha > 0) {
      this.sketch.push();
      this.sketch.noStroke();
      this.sketch.fill(0, this.fadeInAlpha);
      this.sketch.rect(0, 0, this.sketch.width, this.sketch.height);
      this.sketch.pop();
      this.fadeInAlpha = Math.max(this.fadeInAlpha - GameScreen.FADE_SPEED, 0);
      return;
    }

    // Render pause popup on top if a player disconnected
    if (this.pausePopup) {
      this.pausePopup.draw();
      return;
    }

    // Render win popup on top if game is over
    if (this.winnerPopup) {
      this.winnerPopup.draw();

      if (this.fadeOutActive) {
        this.fadeOutAlpha = Math.min(this.fadeOutAlpha + GameScreen.FADE_SPEED, 255);
        this.sketch.push();
        this.sketch.noStroke();
        this.sketch.fill(0, this.fadeOutAlpha);
        this.sketch.rect(0, 0, this.sketch.width, this.sketch.height);
        this.sketch.pop();
        if (this.fadeOutAlpha >= 255) {
          GuiManager.changeScreen(Screens.LOADING_SCREEN, this.sketch, Screens.MULTIPLAYER_SCREEN, "Returning to lobby");
        }
        return;
      }

      const keyEvent = this.keylistener.listen();
      if (keyEvent === KEY_EVENTS.ENTER) {
        this.fadeOutActive = true;
        this.border.setTransitionOut(true);
      }
      return;
    }

    // Spectators and players who are not yet on their turn cannot move the cursor
    if (this.game.isSpectator() || !this.game.isMyTurn()) {
      return;
    }

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
   * Show the pause overlay when a player disconnects. Dismissed automatically via hidePause().
   */
  public showPause(message: string): void {
    this.pausePopup = new Popup(this.sketch, 0.5, 0.5, {
      title: "Game Paused",
      message: message + "\n\nWaiting to reconnect...",
    });
    this.pausePopup.activateTransitionIn();
  }

  /**
   * Hide the pause overlay when the disconnected player reconnects.
   */
  public hidePause(): void {
    this.pausePopup = null;
  }

  /**
   * Show the win overlay with a message. Press SELECT to return to multiplayer.
   */
  public showWinner(message: string): void {
    this.winnerPopup = new Popup(this.sketch, 0.5, 0.5, {
      title: "Game Over",
      message: message + "\n\nPress ENTER to continue",
    });
    this.winnerPopup.activateTransitionIn();
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
    this.sketch.text(
      (this.gameType === GameType.LOCAL ? "Local" : "Online") + " Mode",
      canvasSize / 2,
      (canvasSize / 20) * 2,
    );

    // Draw current player info
    this.sketch.textSize(canvasSize * 0.03);
    this.sketch.text("Current Player:", canvasSize / 2, (canvasSize / 20) * 17);
    this.sketch.text(
      this.game.getTurnName(),
      canvasSize / 2,
      (canvasSize / 20) * 18,
    );

    // Draw online-specific information if needed
    if (this.gameType == GameType.ONLINE) {
      // TODO: Draw online-specific information
      // - Lobby name
      // - Number of spectators
      // - Opponent info
    }
  }

  public getGameManager(): GameManager {
    return this.game;
  }
}
