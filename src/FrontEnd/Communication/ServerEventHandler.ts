/**
 * @file ServerEventHandler.ts
 * @description This is the event handling layer for messages from the server
 * @author John Khalife
 * @created 2025-12-23
 */

import { FROM_SERVER_MESSAGE_TYPES } from "../../Shared/Contracts/MessageToClientSchema";
import { GAME_STATES } from "../Constants";
import ServerRequestService from "./ServerRequestService";



/**
 * @function setupGameStartListener
 * @description Sets up a listener that triggers a callback when the game state changes to "running".
 * Sets up game listeners BEFORE joining/creating a lobby to avoid race conditions.
 * (Server may send GAME_STATE_UPDATE immediately if this is the last player)
 * @param requestService - The ServerRequestService instance to use for adding/removing listeners
 * @param onGameStartCallback - Callback function to execute when the game starts
 */
export function setupGameStartListener(
  requestService: ServerRequestService,
  onGameStartCallback: () => void
): void {
  const onGameStart = (update: any) => {
    // Check for game_state_update message with state "running"
    if (update.type === FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE && update.state === GAME_STATES.RUNNING) {
      console.info("[setupGameStartListener] Game state has been updated to running");

      // Remove listeners before triggering callback
      requestService.removeGameListeners();

      // Trigger the callback (e.g., transition to game screen)
      onGameStartCallback();
    }
  };
  // Add listeners NOW, before joining/creating lobby
  requestService.addGameListeners(onGameStart);
}
