/**
 * @file ServerEventHandler.ts
 * @description This is the event handling layer for messages from the server
 * @author John Khalife
 * @created 2025-12-23
 */

import { FROM_SERVER_MESSAGE_TYPES, GameStateUpdateMessage, GameUpdateMessage } from "../../Shared/Contracts/MessageToClientSchema";
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

      // Check if we're already on the LoadingScreen to avoid restarting it
      const currentScreen = GuiManager.getCurrentScreen();
      const alreadyOnLoadingScreen = currentScreen instanceof LoadingScreen;

      if (alreadyOnLoadingScreen) {
        console.info("[ServerEventHandler] Already on LoadingScreen, not recreating screen");
      } else {
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
        } else {
          console.error("[ServerEventHandler] Missing lobby information for LoadingScreen transition");
        }
      }

      // Send acknowledgment to server that we received the request and are ready
      console.info("[ServerEventHandler] Sending acknowledgment for lobby:", lobbyID);
      requestService.AcknowledgeReady(lobbyID);
      return;
    }

    // Handle GAME_STATE_UPDATE messages
    if (message.type === FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE) {
      //If we changed the gamestate to running - start the game!
      if (message.state === GAME_STATES.RUNNING) {
        console.info("[ServerEventHandler] Game state has been updated to running");


        //Remove the game listeners, add new ones
        requestService.removeGameListeners();
        requestService.addGameListeners(handleGameMessages);

        // Trigger the callback (e.g., transition to game screen)
        const currentScreen = GuiManager.getCurrentScreen();
        if (currentScreen instanceof LoadingScreen) {
          currentScreen.setNextScreen(Screens.GAME_SCREEN); //Ensure screen is set to game screen.
          currentScreen.activateTransitionOut(); // Activate the transition out of the loading screen.
        }
      //If we changed the gamestate to canceled, that means acknowlegement failed. Return to the Multiplayer Screen!
      } else if (message.state === GAME_STATES.CANCELLED) {
        requestService.removeGameListeners();
        GuiManager.changeScreen(Screens.LOADING_SCREEN,sketch,Screens.MULTIPLAYER_SCREEN);
      }

    }
  };

  // Add listeners NOW, before joining/creating lobby
  requestService.addGameListeners(onGameEvent);
}

/**
 * @function handleGameMessages
 * @description Responsible for handling online updates during the course of the game
 * @param message the message sent from the server
 */
export function handleGameMessages(message: any) {
  const requestService = ServerRequestService.getInstance();
  //Check the type of the message
  switch (message.type) {
    //If the user sends another acknowlegement request (for some reason)
    case FROM_SERVER_MESSAGE_TYPES.ACKNOWLEDGMENT_REQUEST:
      console.debug("[handleGameMessages] Received acknowlegement request");
      requestService.AcknowledgeReady(localStorage.getItem("lobbyID") || "");
      break;
    case FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE:
      handleGameStateUpdates(message);
  }
}

/**
 * @function handleGameStateUpdates
 * @description Responsible for handling GameStateUpdate messages during the course of the game.
 * @param message
 */
export function handleGameStateUpdates(message: GameStateUpdateMessage) {
  const requestService = ServerRequestService.getInstance();
  console.debug("[handleGameStateUpdates] Received game state update of state ", message.state || "UNKNOWN");
  //Another switch statement for each respective state that can be given
  switch (message.state) {
    case GAME_STATES.CANCELLED:
      //Cancel the game and return to the multiplayer Menu :/
      requestService.removeGameListeners();
      GuiManager.changeScreen(Screens.LOADING_SCREEN, GuiManager.getCurrentScreen().getSketch(), Screens.MULTIPLAYER_SCREEN);
      break;
    case GAME_STATES.PAUSED:
      //TODO: Add a pause screen that slides over the gamescreen and disappears nicely as well.
      break;
    case GAME_STATES.RUNNING:
      //TODO: The only time we should get this event (since we are already running is when we are unpausing)
      break;
    case GAME_STATES.WAITING:
      //!We should never receive this gamestate in the current implementation. After the game starts, it doesn't go back to waiting
      //? Maybe consider going back to waiting if a user disconnects - either have a timeout until a cancel event if the same user doesn't rejoin or open the lobby again to joiners?
      console.error("[HandleGameUpdates] Received a waiting event change. This shouldn't happen.");
      break;
    // Note: GAME_STATES.FINISHED is not currently part of GameStateUpdateMessage schema
    // If you need to handle FINISHED state, add it to the schema in MessageToClientSchema.ts:
    // state: z.enum([GAME_STATES.WAITING, GAME_STATES.RUNNING, GAME_STATES.PAUSED, GAME_STATES.CANCELLED, GAME_STATES.FINISHED])
  }
}


/**
 * @function handleGameUpdates
 * @description Responsible for handling GameUpdate messages during the course of the game.
 * @param message 
 */
export function handleGameUpdates(message: GameUpdateMessage) {

}