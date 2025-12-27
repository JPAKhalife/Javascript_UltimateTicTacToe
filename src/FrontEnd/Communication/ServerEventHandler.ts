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
 * @function createGameStartPromise
 * @description Creates a promise that resolves when the game state changes to "running".
 * Sets up game listeners BEFORE joining/creating a lobby to avoid race conditions.
 * (Server may send GAME_STATE_UPDATE immediately if this is the last player)
 * @param requestService - The ServerRequestService instance to use for adding/removing listeners
 * @returns A promise that resolves to true when the game starts
 */
export function createGameStartPromise(requestService: ServerRequestService): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const onGameStart = (update: any) => {
      // Check for game_state_update message with state "running"
      if (update.type === FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE && update.state === GAME_STATES.RUNNING) {
        console.info("[createGameStartPromise] Game state has been updated to running");

        //The game has started, switching to core game event handlers

        resolve(true);
      }
    };
    // Add listeners NOW, before joining/creating lobby
      requestService.addGameListeners(onGameStart);
  });
}
