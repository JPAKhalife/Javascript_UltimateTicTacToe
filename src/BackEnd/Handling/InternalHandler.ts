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

/**
 * @function handleSessionExpiry
 * @description This function is meant to handle the cleanup related to function expiry
 */
export async function handleSessionExpiry(expiredKey: string) {
  console.log("Session expired, removing player Data if exists");
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
 * @description This function handles cleanup related to when a connecion expires
 */
export async function handleConnectionExpiry(expiredKey: string) {
  console.log("Disconnecting");
  disconnect(expiredKey);
}
