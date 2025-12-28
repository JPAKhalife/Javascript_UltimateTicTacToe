/**
 * @file ServerEventHandler.ts
 * @description This is the event handling layer for messages from the server
 * @author John Khalife
 * @created 2025-12-23
 */

import { FROM_SERVER_MESSAGE_TYPES } from "../../Shared/Contracts/MessageToClientSchema";
import { GAME_STATES } from "../Constants";
import GuiManager from "../GuiManager";
import { Screens } from "../Menu";
import LoadingScreen from "../Screens/LoadingScreen";
import ServerRequestService from "./ServerRequestService";

// Flag to track if game has started (to handle race condition)
let gameHasStarted = false;

/**
 * @function setupGameStartListener
 * @description Sets up a listener that triggers a callback when the game state changes to "running".
 * Sets up game listeners BEFORE joining/creating a lobby to avoid race conditions.
 * (Server may send GAME_STATE_UPDATE immediately if this is the last player)
 * @param requestService - The ServerRequestService instance to use for adding/removing listeners
 */
export function setupGameStartListener(
  requestService: ServerRequestService
): void {
  // Reset the flag when setting up a new listener
  gameHasStarted = false;

  const onGameStart = (update: any) => {
    // Check for game_state_update message with state "running"
    if (update.type === FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE && update.state === GAME_STATES.RUNNING) {
      console.info("[setupGameStartListener] Game state has been updated to running");

      // Set flag that game has started
      gameHasStarted = true;

      // Remove listeners before triggering callback
      requestService.removeGameListeners();

      // Trigger the callback (e.g., transition to game screen)
      const currentScreen = GuiManager.getCurrentScreen();
      if (currentScreen instanceof LoadingScreen) {
        currentScreen.setNextScreen(Screens.GAME_SCREEN); //Ensure screen is set to game screen.
        currentScreen.activateTransitionOut(); // Activate the transition out of the loading screen.
      }
    }
  };
  // Add listeners NOW, before joining/creating lobby
  requestService.addGameListeners(onGameStart);
}

/**
 * @function checkIfGameStarted
 * @description Check if the game has already started (for race condition handling)
 * This should be called by LoadingScreen when it's created to handle cases where
 * the game start event arrived before the LoadingScreen was ready
 * @returns true if game has started, false otherwise
 */
export function checkIfGameStarted(): boolean {
  return gameHasStarted;
}

/**
 * @function resetGameStartedFlag
 * @description Reset the game started flag
 */
export function resetGameStartedFlag(): void {
  gameHasStarted = false;
}
