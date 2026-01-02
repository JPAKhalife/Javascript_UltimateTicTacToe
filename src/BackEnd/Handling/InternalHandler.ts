/**
 * @file InternalHandler.ts
 * @description This file processes internal server events (such as expiry of sessions)
 * and registers callbacks with RedisEventManager
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-12-27
 */

import { disconnect } from "../Database/ClientConnections";
import { Lobby } from "../Database/Lobby/Lobby";
import { handleGameStart } from "./GameHandler";
import { REDIS_KEYS, SERVER_ID } from "../Contants";
import { DatabaseManager } from "../Database/DatabaseManager";
import { RedisEventManager, RedisEventType } from "../Database/RedisEventManager";

/**
 * NOTE: Session expiry is now handled per-session in Session.ts
 * Each session subscribes to its own expiry event and handles cleanup
 */

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

  const totalPlayers = Number(lobby.get("playerNum"));

  console.info(
    `[InternalHandler] Starting game with ${totalPlayers} players.`
  );

  // Start the game with however many players have acknowledged
  await handleGameStart(lobby);
}

/**
 * @function registerInternalEventHandlers
 * @description Register all internal event handlers with RedisEventManager
 * This should be called once during server initialization
 *
 * NOTE: Session expiry events are handled per-session in Session.create()
 * This function only registers global pattern subscriptions for:
 * - Connection expiry (all connections)
 * - Lobby acknowledgment timeouts (all lobbies)
 */
export async function registerInternalEventHandlers(): Promise<void> {
  console.info("[InternalHandler] Registering internal event handlers");

  // Register handler for connection expiry events
  // Global pattern subscription for all connections
  await RedisEventManager.subscribe(
    REDIS_KEYS.CONNECTION("*"),
    [RedisEventType.EXPIRED],
    async (expiredKey: string, eventType: RedisEventType) => {
      if (eventType === RedisEventType.EXPIRED) {
        await handleConnectionExpiry(expiredKey);
      }
    }
  );

  // Register handler for lobby acknowledgment set expiry events
  // When a lobby_ack_set expires, it means not all players acknowledged in time
  // Global pattern subscription for all lobby acknowledgment sets
  await RedisEventManager.subscribe(
    REDIS_KEYS.LOBBY_ACK_SET("*"),
    [RedisEventType.EXPIRED],
    async (expiredKey: string, eventType: RedisEventType) => {
      if (eventType === RedisEventType.EXPIRED) {
        console.info(`[InternalHandler] Lobby acknowledgment set expired (key: ${expiredKey})`);
        await handleLobbyAckTimeout(expiredKey);
      }
    }
  );

  console.info("[InternalHandler] Global event handlers registered (connections, lobby acks)");
  console.info("[InternalHandler] Session expiry handlers are registered per-session");
}
