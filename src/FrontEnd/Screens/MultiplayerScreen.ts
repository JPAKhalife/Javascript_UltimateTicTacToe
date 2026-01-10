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
import LobbyDot, { LobbyInfo } from "../MenuObjects/LobbyDot";
import { FRAMERATE } from "../Constants";
import { LobbyInfo as LobbyDotInfo } from "../MenuObjects/LobbyDot";
import LoadingSpinner from "../MenuObjects/LoadingSpinner";
import ServerRequestService from "../Communication/ServerRequestService";
import { handleJoinLobbyResponse } from "../Communication/ServerResponseHandler";
import { GameStateInfo } from "../../Shared/Contracts/MessageToClientSchema";
import { GameType } from "../GameManager/GameManager";

const LOBBY_REFRESH_TIME = 7 * FRAMERATE; // 3 seconds
const DEFAULT_LOBBY_DISPLAY_NUM = 5; // Default number of lobbies to display at a time

// Bounds for lobby icons as percentages of canvas size
const LOBBY_BOUNDS = {
  MIN_X: 0.25, // 25% from left
  MAX_X: 0.8, // 80% from left
  MIN_Y: 0.25, // 25% from top
  MAX_Y: 0.75, // 75% from top
};

// Text sizes as percentages of canvas size
const TEXT_SIZES = {
  HEADER: 0.024, // ~24px on a 1000px canvas
  SUBHEADER: 0.018, // ~18px on a 1000px canvas
  NORMAL: 0.016, // ~16px on a 1000px canvas
  SMALL: 0.014, // ~14px on a 1000px canvas
};

export default class MultiplayerScreen implements Menu {
  private sketch: p5;
  private keylistener: KeyListener;

  //Buttons
  private returnToSetupScreen: MenuButton;
  private createNewLobby: MenuButton;
  private lobbyNav: MenuNav;
  //Loading Spinner
  private loadingSpinner: LoadingSpinner;

  //Transition variables
  private transition_in_active: boolean = true;
  private transition_out_active: boolean = false;
  private transitionTimer: number = 0;
  private transitionDuration: number = 60; // 1 second at 60fps
  private transitionComplete: boolean = false;
  private lineOpacity: number = 0;
  private elementsOpacity: number = 0;
  private lobbyRefreshTime: number = LOBBY_REFRESH_TIME;
  private showLoadingIcon: boolean;

  private requestService: ServerRequestService;
  private lobbyList: LobbyInfo[];

  // Error message display
  private errorMessage: string | null = null;
  private errorMessageOpacity: number = 0;
  private errorMessageTimer: number = 0;
  private errorMessageDuration: number = 3 * FRAMERATE; // 3 seconds

  constructor(sketch: p5) {
    this.sketch = sketch;
    this.keylistener = new KeyListener(sketch);
    this.requestService = ServerRequestService.getInstance();
    this.lobbyList = [];
    this.showLoadingIcon = false;
    this.fetchLobbyList(DEFAULT_LOBBY_DISPLAY_NUM);
    this.loadingSpinner = new LoadingSpinner(this.sketch, 0.125, 0.7, 0.05);
    // Define menu buttons
    this.returnToSetupScreen = new MenuButton(
      this.sketch,
      0.15,
      0.2,
      "Return",
      0.05,
      0.2,
      0.015,
      0,
    );
    this.createNewLobby = new MenuButton(
      this.sketch,
      0.85,
      0.2,
      "Create Lobby",
      0.05,
      0.2,
      0.015,
      0,
    );
    this.lobbyNav = new MenuNav(
      [this.returnToSetupScreen, this.createNewLobby],
      this.sketch,
    );

    // Start transition in
    this.keylistener.deactivate(); // Disable input during transition
  }

  public getSketch(): p5 {
    return this.sketch;
  }

  /**
   * @method startTransitionIn
   * @description Initializes the transition in animation
   */
  private startTransitionIn(): void {
    this.elementsOpacity = 0;
    this.lineOpacity = 0;
    this.transition_in_active = true;
  }

  /**
   * @method animateTransitionIn
   * @description Animates the transition in by fading in all elements
   */
  private animateTransitionIn(): void {
    // Fade in border lines
    if (this.lineOpacity < 255) {
      this.lineOpacity = Math.min(
        this.lineOpacity + 255 / (this.transitionDuration / 2),
        255,
      );
    }
    // Then fade in buttons and other elements
    else if (this.elementsOpacity < 255) {
      this.elementsOpacity += 255 / (this.transitionDuration / 2);

      // Update opacity of menu buttons
      for (let i = 0; i < this.lobbyNav.getLength(); i++) {
        if (this.lobbyNav.getAtIndex(i) instanceof MenuButton) {
          (this.lobbyNav.getAtIndex(i) as MenuButton).setOpacity(
            this.elementsOpacity,
          );
        }
      }

      // If elements are fully visible, end transition
      if (this.elementsOpacity >= 255) {
        this.transition_in_active = false;
        this.keylistener.activate(); // Enable input after transition
      }
    }
  }

  /**
   * @method handleTransitionOut
   * @description This method is called when the screen is transitioning out.
   */
  private handleTransitionOut(): void {
    // Only change screen when transition is complete
    if (this.transitionTimer >= this.transitionDuration) {
      const selected = this.lobbyNav.getCurrentlySelected();

      // Handle LobbyDot selection (doesn't have getText method)
      if (selected instanceof LobbyDot) {
        const lobby = selected;
        //In the event we've pressed a lobby dot.
        if (lobby.isSelectionTransitionComplete()) {
          // Success - result is GameStateInfo
          const gameStateStr = localStorage.getItem("gameState");
          if (!gameStateStr) {
            // Trigger error animation on the lobby dot
            (this.lobbyNav.getCurrentlySelected() as LobbyDot).startErrorAnimation();
            return;
          }

          const gameState: GameStateInfo = JSON.parse(gameStateStr);

          // Determine if this is a spectator joining a running game
          const isSpectator = gameState.playerList.length > gameState.playerNum;
          const isGameRunning = gameState.lobbyState === "running";
          const loadingProcess = (isSpectator && isGameRunning) ? undefined : () => { };
          const titleText = (isSpectator && isGameRunning) ? "Joining game..." : "Waiting for game to start...";
          GuiManager.changeScreen(
            Screens.LOADING_SCREEN,
            this.sketch,
            Screens.GAME_SCREEN,
            titleText,
            loadingProcess,
            GameType.ONLINE,
            gameState.gridSize,
            gameState.levelSize,
            gameState.lobbyID,
          );
          this.transitionComplete = true;

        }
      } else if (selected instanceof MenuButton) {
        // Handle MenuButton selections
        const selectedPhrase = selected.getText();
        if (selectedPhrase === "Return") {
          GuiManager.changeScreen(Screens.SETUP_SCREEN, this.sketch);
        } else if (selectedPhrase === "Create Lobby") {
          GuiManager.changeScreen(Screens.CREATE_LOBBY_SCREEN, this.sketch);
        }
      }
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
      if (
        item instanceof MenuButton &&
        item !== this.lobbyNav.getCurrentlySelected()
      ) {
        item.fade(255 / this.transitionDuration);
      } else if (item instanceof LobbyDot) {
        item.fade(255 / this.transitionDuration);
      }
    }

    // Fade out the border lines and text
    this.lineOpacity -= 255 / this.transitionDuration;
    this.elementsOpacity -= 255 / this.transitionDuration;

    // Increment the transition timer
    this.transitionTimer++;
  }

  public draw(): void {
    // Stop drawing once LobbyDot transition is complete
    if (this.transitionComplete) {
      this.sketch.background(0);
      return;
    }

    // Clear background
    this.sketch.background(0);
    const canvasSize = getCanvasSize();

    // Find any LobbyDot that is in transition mode
    let transitioningLobbyDot: LobbyDot | null = null;
    for (let i = 0; i < this.lobbyNav.getLength(); i++) {
      const item = this.lobbyNav.getAtIndex(i);
      if (item instanceof LobbyDot && item.isSelectionTransitionActive()) {
        transitioningLobbyDot = item;
        break;
      }
    }

    // Draw border lines
    this.drawBorderLines(canvasSize);

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

    // Draw all menu items using the lobbyNav's drawAll method
    // This ensures buttons work correctly
    this.lobbyNav.drawAll();

    // Display lobby information on the left panel
    this.displayLobbyInfo();

    // Handle transitions
    if (this.transition_in_active) {
      this.animateTransitionIn();
    } else if (this.transition_out_active && !this.transitionComplete) {
      this.animateTransitionOut();
      this.handleTransitionOut();
    }

    //Check for loading Icon
    if (this.showLoadingIcon) {
      this.loadingSpinner.draw();
    }

    // If there's a transitioning LobbyDot, draw it again to ensure it's on top
    if (transitioningLobbyDot) {
      transitioningLobbyDot.draw(canvasSize);
    }

    // Draw error message if present
    if (this.errorMessage) {
      this.drawErrorMessage(canvasSize);
    }

    // Handle key navigation (always active)
    this.handleKeyNavigation();
  }

  /**
   * @method drawBorderLines
   * @description Draws the border lines of the screen
   * @param canvasSize The current canvas size
   */
  private drawBorderLines(canvasSize: number): void {
    this.sketch.stroke(255, this.lineOpacity);
    this.sketch.strokeWeight(5);

    // Top horizontal line
    this.sketch.line(
      0,
      canvasSize * LOBBY_BOUNDS.MIN_Y,
      canvasSize,
      canvasSize * LOBBY_BOUNDS.MIN_Y,
    );

    // Bottom horizontal line
    this.sketch.line(
      0,
      canvasSize * LOBBY_BOUNDS.MAX_Y,
      canvasSize,
      canvasSize * LOBBY_BOUNDS.MAX_Y,
    );

    // Left vertical line
    this.sketch.line(
      canvasSize * LOBBY_BOUNDS.MIN_X,
      canvasSize * LOBBY_BOUNDS.MIN_Y,
      canvasSize * LOBBY_BOUNDS.MIN_X,
      canvasSize * LOBBY_BOUNDS.MAX_Y,
    );
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
        //Functionality for if the user selects a lobby
        if (this.lobbyNav.getCurrentlySelected() instanceof LobbyDot) {
          // Start the selection transition animation
          const selectedLobbyDot =
            this.lobbyNav.getCurrentlySelected() as LobbyDot;
          this.keylistener.deactivate();
          this.showLoadingIcon = true;
          setTimeout(() => this.joinLobby(selectedLobbyDot), 1000);
        } else {
          this.lobbyNav.confirm();
          this.transition_out_active = true;
          this.transitionTimer = 0;
          this.transitionComplete = false;
        }
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
    if (this.lobbyList.length <= 0) {
      return;
    }

    // Check if we need to update an existing lobby dot
    for (let i = 0; i < this.lobbyNav.getLength(); i++) {
      if (this.lobbyNav.getAtIndex(i) instanceof LobbyDot) {
        let lobbyDot = this.lobbyNav.getAtIndex(i) as LobbyDot;
        if (this.lobbyList.at(0)?.lobbyID == lobbyDot.getLobbyInfo().lobbyID) {
          lobbyDot.setLobbyInfo(
            this.lobbyList.shift() ??
            (() => {
              throw new Error("Lobby list is empty");
            })(),
          );
          return;
        }
      }
    }

    // Generate random position within the lobby area
    const canvasSize = getCanvasSize();

    // Calculate random position directly using percentage bounds
    const xPercent =
      LOBBY_BOUNDS.MIN_X +
      Math.random() * (LOBBY_BOUNDS.MAX_X - LOBBY_BOUNDS.MIN_X);
    const yPercent =
      LOBBY_BOUNDS.MIN_Y +
      Math.random() * (LOBBY_BOUNDS.MAX_Y - LOBBY_BOUNDS.MIN_Y);

    // Create a new LobbyDot and add it to the lobbyNav
    this.lobbyNav.addItem(
      new LobbyDot(
        this.sketch,
        xPercent,
        yPercent,
        0.005, // 0.5% of canvas size for dot size
        getRandomInt(3, 15) * FRAMERATE,
        this.lobbyList.shift() ??
        (() => {
          throw new Error("Lobby list is empty");
        })(),
        this.lobbyNav,
        0.25, // 25% of canvas width for box X position
        0.5, // 50% of canvas height for box Y position
      ),
    );
  }

  /**
   * @method fetchLobbyList
   * @description Fetches the list of lobbies from the server and converts them to LobbyDotInfo format
   */
  private async fetchLobbyList(maxListLength: number): Promise<void> {
    try {
      // Await the promise from searchLobbies
      const lobbies = await this.requestService.searchLobbies({
        maxListLength: maxListLength,
      });
      // Convert lobby info objects to LobbyDotInfo objects
      lobbies.map((lobby) => {
        this.lobbyList.push(
          new LobbyDotInfo(
            lobby.lobbyID,
            lobby.lobbyName,
            lobby.lobbyState,
            lobby.playerNum,
            lobby.gridSize,
            lobby.levelSize,
            lobby.playersJoined,
            lobby.allowSpectators,
          ),
        );
      });
    } catch (error) {
      console.error("Error fetching lobby list:", error);
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
    this.sketch.fill(255, this.elementsOpacity); // White text with opacity
    this.sketch.noStroke();
    this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);

    // Display header
    this.sketch.textSize(TEXT_SIZES.HEADER * canvasSize);
    this.sketch.text("LOBBY INFO", leftPanelX, topMargin);

    // Check if a lobby is selected
    if (this.lobbyNav.getCurrentlySelected() instanceof LobbyDot) {
      this.displaySelectedLobbyInfo(
        leftPanelX,
        topMargin,
        lineHeight,
        canvasSize,
      );
    } else {
      this.displayGeneralLobbyInfo(
        leftPanelX,
        topMargin,
        lineHeight,
        canvasSize,
      );
    }
  }

  /**
   * @method displaySelectedLobbyInfo
   * @description Displays information for the selected lobby
   */
  private displaySelectedLobbyInfo(
    leftPanelX: number,
    topMargin: number,
    lineHeight: number,
    canvasSize: number,
  ): void {
    // Get selected lobby info
    const selectedLobbyInfo = (
      this.lobbyNav.getCurrentlySelected() as LobbyDot
    ).getLobbyInfo();

    // Display detailed lobby information
    this.sketch.textSize(TEXT_SIZES.SUBHEADER * canvasSize);
    this.sketch.text(
      "Name: " + selectedLobbyInfo.lobbyName,
      leftPanelX,
      topMargin + lineHeight * 2,
    );

    this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
    this.sketch.text(
      "Status: " + selectedLobbyInfo.state,
      leftPanelX,
      topMargin + lineHeight * 3.5,
    );
    this.sketch.text(
      "Players: " +
      selectedLobbyInfo.joinedPlayers +
      "/" +
      selectedLobbyInfo.playerNum,
      leftPanelX,
      topMargin + lineHeight * 4.5,
    );

    // Draw a divider
    this.drawDivider(
      leftPanelX,
      topMargin + lineHeight * 5.5,
      canvasSize * 0.083,
      canvasSize,
    );

    // Game configuration
    this.sketch.textSize(TEXT_SIZES.SUBHEADER * canvasSize);
    this.sketch.text("GAME CONFIG", leftPanelX, topMargin + lineHeight * 6.5);

    this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
    this.sketch.text(
      "Grid Size: " +
      selectedLobbyInfo.gridsize +
      "×" +
      selectedLobbyInfo.gridsize,
      leftPanelX,
      topMargin + lineHeight * 8,
    );
    this.sketch.text(
      "Level Size: " + selectedLobbyInfo.levelsize,
      leftPanelX,
      topMargin + lineHeight * 9,
    );
    this.sketch.text(
      "Allow Spectators: " + selectedLobbyInfo.allowSpectators,
      leftPanelX,
      topMargin + lineHeight * 10,
    );

    // Instructions
    this.sketch.textSize(TEXT_SIZES.SMALL * canvasSize);
    this.sketch.text(
      "Press ENTER to join",
      leftPanelX,
      topMargin + lineHeight * 12,
    );
  }

  /**
   * @method displayGeneralLobbyInfo
   * @description Displays general lobby information when no lobby is selected
   */
  private displayGeneralLobbyInfo(
    leftPanelX: number,
    topMargin: number,
    lineHeight: number,
    canvasSize: number,
  ): void {
    // Display general lobby information
    this.sketch.textSize(TEXT_SIZES.SUBHEADER * canvasSize);
    this.sketch.text(
      "AVAILABLE LOBBIES",
      leftPanelX,
      topMargin + lineHeight * 2,
    );

    // Count lobby dots
    let lobbyCount = 0;
    for (let i = 0; i < this.lobbyNav.getLength(); i++) {
      if (this.lobbyNav.getAtIndex(i) instanceof LobbyDot) {
        lobbyCount++;
      }
    }

    this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
    this.sketch.text(
      "Open Lobbies: " + lobbyCount,
      leftPanelX,
      topMargin + lineHeight * 3.5,
    );

    // Draw a divider
    this.drawDivider(
      leftPanelX,
      topMargin + lineHeight * 5,
      canvasSize * 0.083,
      canvasSize,
    );

    // Instructions
    this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
    this.sketch.text("INSTRUCTIONS", leftPanelX, topMargin + lineHeight * 6);

    this.sketch.textSize(TEXT_SIZES.SMALL * canvasSize);
    this.sketch.text(
      "Use arrow keys to",
      leftPanelX,
      topMargin + lineHeight * 7.5,
    );
    this.sketch.text(
      "navigate between lobbies",
      leftPanelX,
      topMargin + lineHeight * 8.5,
    );
    this.sketch.text(
      "Select a lobby to",
      leftPanelX,
      topMargin + lineHeight * 10,
    );
    this.sketch.text("view details", leftPanelX, topMargin + lineHeight * 11);
  }

  /**
   * @method drawDivider
   * @description Draws a horizontal divider line
   */
  private drawDivider(
    centerX: number,
    y: number,
    width: number,
    canvasSize: number,
  ): void {
    this.sketch.stroke(255, this.elementsOpacity);
    this.sketch.strokeWeight(1);
    this.sketch.line(
      centerX - width, // Left end of divider
      y,
      centerX + width, // Right end of divider
      y,
    );
    this.sketch.noStroke();
  }

  /**
   * @method joinLobby
   * @description join the lobby
   */
  private async joinLobby(selectedLobbyDot: LobbyDot): Promise<void> {
    const lobbyID = selectedLobbyDot.getLobbyInfo().lobbyID;

    await handleJoinLobbyResponse(
      lobbyID,
      this.sketch,
      selectedLobbyDot,
      (errorMsg?: string) => {
        // If joining failed, re-enable input and show error
        this.keylistener.activate();
        this.showLoadingIcon = false;
        if (errorMsg) {
          this.showErrorMessage(errorMsg);
        }
      }
    );
  }

  /**
   * @method showErrorMessage
   * @description Displays an error message with fade in/out animation
   * @param message The error message to display
   */
  public showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.errorMessageOpacity = 0;
    this.errorMessageTimer = this.errorMessageDuration;
  }

  /**
   * @method drawErrorMessage
   * @description Draws the error message with fade in/out animation
   * @param canvasSize The current canvas size
   */
  private drawErrorMessage(canvasSize: number): void {
    // Fade in during first half, fade out during second half
    const halfDuration = this.errorMessageDuration / 2;

    if (this.errorMessageTimer > halfDuration) {
      // Fade in
      const progress = (this.errorMessageDuration - this.errorMessageTimer) / halfDuration;
      this.errorMessageOpacity = Math.min(progress * 255, 255);
    } else {
      // Fade out
      const progress = this.errorMessageTimer / halfDuration;
      this.errorMessageOpacity = Math.max(progress * 255, 0);
    }

    // Draw error message at the bottom center of the screen
    this.sketch.push();
    this.sketch.fill(255, this.errorMessageOpacity); // White color
    this.sketch.noStroke();
    this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
    this.sketch.textSize(TEXT_SIZES.NORMAL * canvasSize);
    this.sketch.text(
      this.errorMessage || "",
      canvasSize * 0.5,
      canvasSize * 0.85 // Near bottom of screen
    );
    this.sketch.pop();

    // Decrement timer
    this.errorMessageTimer--;

    // Clear message when timer reaches 0
    if (this.errorMessageTimer <= 0) {
      this.errorMessage = null;
      this.errorMessageOpacity = 0;
    }
  }

  public beginTransitionOut() {
    this.transition_out_active = true;
    this.transitionTimer = 0;
    this.transitionComplete = false;
  }
}
