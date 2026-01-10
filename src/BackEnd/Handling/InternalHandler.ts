/**
 * @file InternalHandler.ts
 * @description This file processes internal server events (such as expiry of sessions)
 * and registers callbacks with RedisEventManager
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-12-27
 */

import { Lobby } from "../Database/Lobby/Lobby";
import { handleGameCancel } from "./GameHandler";

/**
 * NOTE: All expiry events are now handled per-object to avoid bandwidth overhead:
 * - Session expiry is handled per-session in Session.ts
 * - Lobby acknowledgment timeouts are handled per-lobby in Lobby.ts
 * - Connection cleanup happens via session expiry (no direct connection expiry monitoring)
 */

/**
 * @function handleLobbyAckTimeout
 * @description Handles when a lobby acknowledgment timeout expires (5 seconds without all players acknowledging)
 * Cancels the game since not all players acknowledged in time
 * @param expiredKey - The Redis key that expired (format: lobby_ack_set:lobbyID)
 */
export async function handleLobbyAckTimeout(expiredKey: string) {
  // Extract lobbyID from the key (format: lobby_ack_set:lobbyID)
  const lobbyID = expiredKey.replace("lobby_ack_set:", "");

  console.info(`[InternalHandler] Acknowledgment timeout expired for lobby ${lobbyID} (key: ${expiredKey})`);

  // Fetch the lobby
  const lobby = await Lobby.getById(lobbyID);
  if (!lobby) {
    console.warn(`[InternalHandler] Lobby ${lobbyID} not found for timeout handling`);
    return;
  }

  console.warn(
    `[InternalHandler] Not all players acknowledged in time for lobby ${lobbyID}. Cancelling game.`
  );

  // Cancel the game since not all players acknowledged in time
  await handleGameCancel(lobby, "Not all players acknowledged ready in time");
}

/**
 * @function registerInternalEventHandlers
 * @description Register all internal event handlers with RedisEventManager
 * This should be called once during server initialization
 *
 * NOTE: All event handlers are now registered per-object to avoid bandwidth overhead
 * in horizontally scaled systems:
 * - Session expiry events: handled per-session in Session.create()
 * - Lobby acknowledgment timeouts: handled per-lobby when ack set is created
 * - Connection expiry: no longer used (connections are cleaned up via session expiry)
 */
export async function registerInternalEventHandlers(): Promise<void> { }
