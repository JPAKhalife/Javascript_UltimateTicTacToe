/**
 * @file GameHandler.ts
 * @description This file is responsible for the handling of the game events that can occur
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import { GAME_STATES, REDIS_KEYS } from "../Contants";
import { Lobby } from "../Database/Lobby/Lobby";
import { FROM_SERVER_MESSAGE_TYPES, GameStateUpdateMessage, GameUpdateMessage, AcknowledgmentRequestMessage } from '../../Shared/Contracts/MessageToClientSchema';
import { INTERNAL_MESSAGE_TYPES, LobbyStateChangedMessage } from '../../Shared/Contracts/ServerInternalMessageSchema';
import { publishToLobby } from "./ServerRedisGameEventHandler";
import { LobbyAcknowledgmentSet } from "../Database/Lobby/LobbyAcknowledgmentSet";
import { DatabaseManager } from "../Database/DatabaseManager";

/**
 * @function handleGameReadyCheck
 * @description This function checks whether or not the game is ready to started (transition from waiting to running)
 * @param lobby - The ID of the lobby to check
 */
export async function handleGameReadyCheck(lobby: Lobby) {
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

  // If all checks are passed, send acknowledgment requests to all players
  console.info(
    `[GameHandler] All players have joined in lobby ${lobby.get("lobbyID")}. Sending acknowledgment requests...`,
  );

  const lobbyID = lobby.get("lobbyID");

  // 1. Create empty acknowledgment set with 5-second expiry
  // When the set expires, InternalHandler will call handleLobbyAckTimeout
  await LobbyAcknowledgmentSet.create(lobbyID);

  // 2. Send acknowledgment request to all players in the lobby
  const ackRequest: AcknowledgmentRequestMessage = {
    type: FROM_SERVER_MESSAGE_TYPES.ACKNOWLEDGMENT_REQUEST,
    message: "Please confirm you are ready to start the game",
  };
  await publishToLobby(lobbyID, ackRequest);

  console.info(`[GameHandler] Sent acknowledgment request to lobby ${lobbyID} (5 second timeout)`);
}

/**
 * @function cancelGameStartTimeout
 * @description Cancel the Redis-based timeout for a lobby (called when all players acknowledge early)
 * Deletes the acknowledgment set to prevent it from expiring and triggering game cancellation
 * @param lobbyID - The ID of the lobby
 */
export async function cancelGameStartTimeout(lobbyID: string): Promise<void> {
  const redisClient = DatabaseManager.getInstance().getRegularClient();
  const ackSetKey = REDIS_KEYS.LOBBY_ACK_SET(lobbyID);

  // Delete the acknowledgment set to prevent it from expiring and triggering timeout
  const deleted = await redisClient.del(ackSetKey);

  if (deleted > 0) {
    console.info(`[GameHandler] Cancelled acknowledgment timeout for lobby ${lobbyID}`);
  }
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
  await publishToLobby(lobby.getId(), gameStateUpdate);

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
  await publishToLobby(lobby.getId(), gameUpdateMessage);

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

/**
 * @function handleGameCancel
 * @description This function handles the game being cancelled and sends the event to all players
 * Sends two messages:
 * 1. Client message (GameStateUpdateMessage) - notifies players the game was cancelled
 * 2. Internal server message (LobbyStateChangedMessage) - triggers cleanup on all servers
 * @param lobby - The lobby to cancel
 * @param reason - Optional reason for cancellation
 */
export async function handleGameCancel(lobby: Lobby, reason?: string) {
  const lobbyID = lobby.getId();

  console.info(`[GameHandler] Cancelling game in lobby ${lobbyID}${reason ? `: ${reason}` : ''}`);

  // Update lobby state to cancelled
  lobby.set("lobbyState", GAME_STATES.CANCELLED);

  // 1. Send client-forwarded message to notify all players
  const clientMessage: GameStateUpdateMessage = {
    type: FROM_SERVER_MESSAGE_TYPES.GAME_STATE_UPDATE,
    state: GAME_STATES.CANCELLED,
    message: reason || "Game has been cancelled",
  };
  await publishToLobby(lobbyID, clientMessage);

  // 2. Send internal server message to trigger cleanup on all servers
  const internalMessage: LobbyStateChangedMessage = {
    type: INTERNAL_MESSAGE_TYPES.LOBBY_STATE_CHANGED,
    lobbyID: lobbyID,
    newState: GAME_STATES.CANCELLED,
  };
  await publishToLobby(lobbyID, internalMessage);

  console.info(`[GameHandler] Sent cancellation messages for lobby ${lobbyID}`);
}
