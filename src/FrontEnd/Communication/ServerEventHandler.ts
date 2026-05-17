/**
 * @file ServerEventHandler.ts
 * @description This is the event handling layer for messages from the server
 * @author John Khalife
 * @created 2025-12-23
 */

import { FROM_SERVER_MESSAGE_TYPES, GameStateInfo, GameStateUpdateMessage, GameUpdateMessage } from "../../Shared/Contracts/MessageToClientSchema";
import { GAME_STATES } from "../Constants";
import GuiManager from "../GuiManager";
import { Screens } from "../Menu";
import LoadingScreen from "../Screens/LoadingScreen";
import ServerRequestService from "./ServerRequestService";
import { GameType } from "../GameManager/GameManager";
import p5 from "p5";
import { AcknowledgeReadyRequest } from "../../Shared/Contracts/MessageToServerSchema";
import OnlineGameManager from "../GameManager/OnlineGameManager";
import GameScreen from "../Screens/GameScreen";

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

      const waitForLoadingScreen = () => {
        const screen = GuiManager.getCurrentScreen();
        if (screen instanceof LoadingScreen) {
          screen.onTransitionInComplete(() => {
            console.info("[ServerEventHandler] Entry animation done, sending acknowledgment for lobby:", lobbyID);
            requestService.AcknowledgeReady(lobbyID);
          });
        } else {
          setTimeout(waitForLoadingScreen, 100);
        }
      };
      waitForLoadingScreen();
      return;
    }

    // Handle GAME_STATE_UPDATE messages
    if (message.type === FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE) {
      //If we changed the gamestate to running - start the game!
      if (message.state === GAME_STATES.RUNNING) {
        console.info("[ServerEventHandler] Game state has been updated to running");

        // Trigger the callback (e.g., transition to game screen)
        const currentScreen = GuiManager.getCurrentScreen();
        if (currentScreen instanceof LoadingScreen) {
          currentScreen.setNextScreen(Screens.GAME_SCREEN); //Ensure screen is set to game screen.
          currentScreen.activateTransitionOut(); // Activate the transition out of the loading screen.
        } else {
          console.debug("[ServerEventHandler] Not on LoadingScreen when RUNNING state received, retrying in 2s");
          setTimeout(() => onGameEvent(message), 2000);
          return;
        }

        //Remove the game listeners, add new ones
        requestService.removeGameListeners();
        requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.GAME_UPDATE, handleGameUpdates);
        requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE, handleGameStateUpdates);
        requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.ACKNOWLEDGMENT_REQUEST, handleAcknowlegementRequests);        //If we changed the gamestate to canceled, that means acknowlegement failed. Return to the Multiplayer Screen!
      } else if (message.state === GAME_STATES.CANCELLED) {
        requestService.removeGameListeners();
        GuiManager.changeScreen(Screens.LOADING_SCREEN, sketch, Screens.MULTIPLAYER_SCREEN);
      }

    }
  };

  // Add listeners NOW, before joining/creating lobby
  requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE, onGameEvent);
  requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.ACKNOWLEDGMENT_REQUEST, onGameEvent);
  requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.GAME_INFO, handleResync);

}

/**
 * @function setupRejoinListeners
 * @description Wires up game event listeners when rejoining an active game after reconnecting.
 * Called instead of setupGameStartListener because the game is already running.
 */
export function setupRejoinListeners(): void {
  const requestService = ServerRequestService.getInstance();
  requestService.removeGameListeners();
  requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.GAME_UPDATE, handleGameUpdates);
  requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE, handleGameStateUpdates);
  requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.GAME_INFO, handleResync);
  requestService.addGameListener(FROM_SERVER_MESSAGE_TYPES.ACKNOWLEDGMENT_REQUEST, handleAcknowlegementRequests);
}

/**
 * @function handleAcknowlegementRequests
 * @description handles an acknowlegement request
 * @param message
 */
export function handleAcknowlegementRequests(message: AcknowledgeReadyRequest) {
  ServerRequestService.getInstance().AcknowledgeReady(localStorage.getItem("lobbyID") as string);
}

/**
 * @function handleResync
 * @description Handles a resync from the server
 * @param message
 */
export function handleResync(message: GameStateInfo) {
  // First, check if we are currently on the gamescreen. If not, initialize a new online game with the desired setup.
  if (GuiManager.getCurrentScreen() instanceof GameScreen) {
    const game = (GuiManager.getCurrentScreen() as GameScreen).getGameManager() as OnlineGameManager;
    game.setGameStateInfo(message);
    console.debug("[HandleResync] setting gamemanager state");
  } else {
    localStorage.setItem("gameState", JSON.stringify(message));
    console.debug("[HandleResync] storing gamestate ", message);
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
  //switch statement for each respective state that can be given
  switch (message.state) {
    case GAME_STATES.CANCELLED:
      //Cancel the game and return to the multiplayer Menu :/
      requestService.removeGameListeners();
      localStorage.removeItem("gameState");
      GuiManager.changeScreen(Screens.LOADING_SCREEN, GuiManager.getCurrentScreen().getSketch(), Screens.MULTIPLAYER_SCREEN);
      break;
    case GAME_STATES.FINISHED: {
      // Stop listening for further game events - the lobby is being cleaned up
      requestService.removeGameListeners();
      localStorage.removeItem("gameState");
      // Show the winner overlay on the game screen
      const screen = GuiManager.getCurrentScreen();
      if (screen instanceof GameScreen) {
        screen.showWinner(message.message ?? "Game over!");
      }
      break;
    }
    case GAME_STATES.PAUSED: {
      const screen = GuiManager.getCurrentScreen();
      if (screen instanceof GameScreen) {
        screen.showPause(message.message ?? "A player disconnected");
      }
      break;
    }
    case GAME_STATES.RUNNING: {
      // Unpausing — hide the pause overlay if present
      const screen = GuiManager.getCurrentScreen();
      if (screen instanceof GameScreen) {
        screen.hidePause();
      }
      break;
    }
    case GAME_STATES.WAITING:
      //!We should never receive this gamestate in the current implementation. After the game starts, it doesn't go back to waiting
      //? Maybe consider going back to waiting if a user disconnects - either have a timeout until a cancel event if the same user doesn't rejoin or open the lobby again to joiners?
      console.error("[HandleGameUpdates] Received a waiting event change. This shouldn't happen.");
      break;
  }
}


/**
 * @function handleGameUpdates
 * @description Responsible for handling GameUpdate messages during the course of the game.
 * @param message 
 */
export function handleGameUpdates(message: GameUpdateMessage) {
  const screen = GuiManager.getCurrentScreen();
  if (screen instanceof GameScreen) {
    const game = screen.getGameManager() as OnlineGameManager;
    game.handleGameUpdate(message);
  }
}