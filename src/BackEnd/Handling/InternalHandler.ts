/**
 * @file InternalHandler.ts
 * @description This file processes internal server events (such as expiry of sessions)
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import Redis from "ioredis";
import { disconnect } from "../Database/ClientConnections";
import Session from "../Database/Session";
import { Player } from "../Database/Player";
import { Lobby } from "../Database/Lobby/Lobby";
import { handleGameStart } from "./GameHandler";
import { REDIS_KEYS, SERVER_ID } from "../Contants";
import { DatabaseManager } from "../Database/DatabaseManager";

/**
 * @function handleSessionExpiry
 * @description This function is meant to handle the cleanup related to function expiry
 */
export async function handleSessionExpiry(expiredKey: string) {
  console.info("Session expired, removing player Data if exists");
  //This will be useful for removing the player
  const session = await Session.getById(expiredKey);
  if (!session) {
    throw Error(
      "Session not found. This should not happen and indicates an error in the back-end.",
    );
  }
  Player.remove(session.get("playerID"));
  //TODO: This needs to be updated for when lobbies also need to be disconnected from the lobby.
}

/**
 * @function handleConnectionExpiry
 * @description This function handles cleanup related to when a connection expires
 * Only processes if this server owns the connection
 */
export async function handleConnectionExpiry(expiredKey: string) {
  // Extract connectionID from the expired key (format: connection:connectionID)
  const connectionID = expiredKey.replace(REDIS_KEYS.CONNECTION(""), "");

  // Check if this server owns this connection
  const redisClient = DatabaseManager.getInstance().getRegularClient();
  const ownerServerID = await redisClient.get(REDIS_KEYS.CONNECTION_SERVER(connectionID));

  if (ownerServerID !== SERVER_ID) {
    console.debug(
      `[InternalHandler] Connection ${connectionID} not owned by this server (owner: ${ownerServerID}, current: ${SERVER_ID}). Skipping cleanup.`
    );
    return;
  }

  console.info(`[InternalHandler] Connection ${connectionID} owned by this server. Disconnecting.`);
  disconnect(expiredKey);
}

/**
 * @function handleLobbyAckTimeout
 * @description Handles when a lobby acknowledgment timeout expires (5 seconds without all players acknowledging)
 * @param expiredKey - The Redis key that expired (format: lobby_ack_timeout:lobbyID)
 */
export async function handleLobbyAckTimeout(expiredKey: string) {
  // Extract lobbyID from the key
  const lobbyID = expiredKey.split(":")[1];

  console.info(`[InternalHandler] Acknowledgment timeout expired for lobby ${lobbyID}`);

  // Fetch the lobby
  const lobby = await Lobby.getById(lobbyID);
  if (!lobby) {
    console.warn(`[InternalHandler] Lobby ${lobbyID} not found for timeout handling`);
    return;
  }

  const acknowledgedPlayers = Number(lobby.get("acknowledgedPlayers") || 0);
  const totalPlayers = Number(lobby.get("playerNum"));

  console.info(
    `[InternalHandler] Starting game with ${acknowledgedPlayers}/${totalPlayers} players acknowledged`
  );

  // Start the game with however many players have acknowledged
  await handleGameStart(lobby);
}
