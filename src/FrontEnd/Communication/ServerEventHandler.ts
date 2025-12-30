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
import { GameType } from "../GameManager";
import p5 from "p5";

/**
 * @function setupGameStartListener
 * @description Sets up listeners for game-related messages from the server:
 * - ACKNOWLEDGMENT_REQUEST: Server asking all players to acknowledge they're ready
 * - GAME_STATE_UPDATE (running): Server confirming game has started
 * Sets up game listeners BEFORE joining/creating a lobby to avoid race conditions.
 * @param requestService - The ServerRequestService instance to use for adding/removing listeners
 * @param sketch - The p5 sketch instance
 * @param gridSize - The grid size of the lobby
 * @param levelSize - The level size of the lobby
 * @param lobby - The ID of the lobby
 */
export function setupGameStartListener(
  requestService: ServerRequestService,
  sketch: p5,
  gridSize: number,
  levelSize: number,
  lobbyID: string
): void {
  const onGameEvent = (message: any) => {
    // Handle ACKNOWLEDGMENT_REQUEST - server asking all players to confirm they're ready
    if (message.type === FROM_SERVER_MESSAGE_TYPES.ACKNOWLEDGMENT_REQUEST) {
      console.info("[ServerEventHandler] Received ACKNOWLEDGMENT_REQUEST from server");

      // Transition to LoadingScreen with stored lobby info
      if (sketch && gridSize !== null && levelSize !== null && lobbyID !== null) {
        GuiManager.changeScreen(
          Screens.LOADING_SCREEN,
          sketch,
          Screens.GAME_SCREEN,
          "Waiting for game to start...",
          () => { }, // Empty function - listener handles transition
          GameType.ONLINE,
          gridSize,
          levelSize,
          lobbyID,
        );
        // Send acknowledgment to server that we received the request and are ready
        console.info("[ServerEventHandler] Sending acknowledgment for lobby:", lobbyID);
        requestService.AcknowledgeReady(lobbyID);
      } else {
        console.error("[ServerEventHandler] Missing lobby information for LoadingScreen transition");
      }
      return;
    }

    // Handle GAME_STATE_UPDATE with state "running" - game has actually started
    if (message.type === FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE && message.state === GAME_STATES.RUNNING) {
      console.info("[ServerEventHandler] Game state has been updated to running");

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
  requestService.addGameListeners(onGameEvent);
}
