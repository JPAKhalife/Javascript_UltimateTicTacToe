/**
 * @file GameHandler.ts
 * @description This file is responsible for the handling of the game events that can occur
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import Redis from "ioredis";
import { GAME_STATES } from "../Contants";
import { DatabaseManager } from "../Database/DatabaseManager";
import { Lobby } from "../Database/Lobby/Lobby";
import { FROM_SERVER_MESSAGE_TYPES, GameStateUpdateMessage, GameUpdateMessage } from '../../Shared/Contracts/MessageToClientSchema';
import { handleForwardLobbyMessage } from "./ServerRedisGameEventHandler";

/**
 * @function handleGameReadyCheck
 * @description This function checks whether or not the game is ready to started (transition from waiting to running)
 * @param lobby - The ID of the lobby to check
 */
export async function handleGameReadyCheck(lobby: Lobby) {
  let redisClient = DatabaseManager.getInstance().getRegularClient();
  //First handle cases where this method is pointless.

  //Get the lobby Object
  if (!lobby) {
    throw Error(
      "Lobby not found. This should not happen and indicates an error in the back-end.",
    );
  }

  //Check if the game is already running
  if (lobby.get("lobbyState") === GAME_STATES.RUNNING) {
    console.info(
      `[GameHandler] Lobby ${lobby.get("lobbyID")} game is already running. No action taken.`,
    );
    return;
  }

  //Check if there are enough players to start the game
  if (lobby.get("playersJoined") < lobby.get("playerNum")) {
    return;
  }
  //? There may be other checks that are neccessary in the future

  // If all checks are passed, start the game
  console.info(
    `[GameHandler] All players have joined in lobby ${lobby.get("lobbyID")}. Starting game...`,
  );
  await handleGameStart(lobby);
}

/**
 * @function handleGameStart
 * @description This function handles the starting of the game (transition from waiting to running)
 * @param lobby the lobby object that the game should be started for
 */
export async function handleGameStart(lobby: Lobby) {
  //Set the lobby state to running!
  lobby.set("lobbyState", GAME_STATES.RUNNING);

  // Initialize the board now that the game is starting
  // This defers board creation until needed to save memory
  const game = lobby.getGame();
  await game.initializeGame();

  // Notify all clients that the game has begun
  const gameStateUpdate: GameStateUpdateMessage = {
    type: FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE,
    state: GAME_STATES.RUNNING,
    message: "Game has started! Good luck!",
  };
  handleForwardLobbyMessage(lobby.getId(), gameStateUpdate);

  // Call the handlePlayerChange method to notify the correct player of the turn change.
  handlePlayerChange(lobby);
}

/**
 * @function handlePlayerChange
 * @description This function handles the changing of the player turn in the game
 * @param lobby the lobby object that the player turn should be changed for
 */
export async function handlePlayerChange(lobby: Lobby) {
  const game = lobby.getGame();

  // Get the current player's turn (1-based index for display)
  const currentPlayerIndex = game.get("currentPlayerIndex");
  const turn = currentPlayerIndex + 1;

  // Get the board state
  const boardState = game.getBoardState();

  // Create the game update message
  const gameUpdateMessage: GameUpdateMessage = {
    type: FROM_SERVER_MESSAGE_TYPES.GAME_UPDATE,
    turn: turn,
    gameState: lobby.get("lobbyState"),
  };

  // Notify all clients of the player turn change
  handleForwardLobbyMessage(lobby.getId(), gameUpdateMessage);

  console.info(
    `[GameHandler] Player turn changed in lobby ${lobby.getId()}. Current turn: ${turn}`,
  );
}

/**
 * @function handleEvaluateGame
 * @description This function handles the evaluation of the game state to determine if there is a winner or if the game should continue
 * @param lobby the lobby object that the game should be evaluated for
 *
 */
export async function handleEvaluateGame(lobby: Lobby) { }

/**
 * @function handleGameWon
 * @description This function handles the end of the game when a player has won
 * @param lobby the lobby object that the game has been won in
 */
export async function handleGameWon(lobby: Lobby) { }
