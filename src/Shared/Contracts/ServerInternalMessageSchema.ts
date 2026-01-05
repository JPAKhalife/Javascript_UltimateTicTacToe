/**
 * @file ServerInternalMessageSchema.ts
 * @description Zod schemas for messages sent between servers via Redis pub/sub.
 * These messages are used for inter-server coordination and lobby management.
 * Shared for type safety, but only imported/used by backend.
 *
 * @author John Khalife
 * @created 2026-01-01
 */

import * as z from "zod";
import { VALIDATION, GAME_STATES } from "../Constants";

/**
 * Message types for internal server-to-server communication
 */
export enum INTERNAL_MESSAGE_TYPES {
  // Messages that should be handled by the server only
  LOBBY_STATE_CHANGED = "lobby_state_changed",
}

/**
 * Base internal message that all server messages extend
 */
export const BaseInternalMessage = z.object({
  type: z.nativeEnum(INTERNAL_MESSAGE_TYPES),
});
export type BaseInternalMessage = z.infer<typeof BaseInternalMessage>;

// ============================================================================
// Server-Only Messages (forwardToClients: false)
// These messages are handled by the server and NOT forwarded to clients
// ============================================================================

/**
 * Lobby state changed message - notifies other servers of lobby state changes
 * Server-only: Used for cross-server lobby state synchronization
 */
export const LobbyStateChangedMessage = BaseInternalMessage.extend({
  type: z.literal(INTERNAL_MESSAGE_TYPES.LOBBY_STATE_CHANGED),
  lobbyID: z.string().uuid(),
  newState: z.enum([
    GAME_STATES.WAITING,
    GAME_STATES.RUNNING,
    GAME_STATES.PAUSED,
    GAME_STATES.CANCELLED,
    GAME_STATES.FINISHED,
  ]),
});
export type LobbyStateChangedMessage = z.infer<typeof LobbyStateChangedMessage>;

// ============================================================================
// Union Types and Validation
// ============================================================================

/**
 * Union of all internal messages
 */
export const InternalMessage = z.discriminatedUnion("type", [
  LobbyStateChangedMessage,
]);
export type InternalMessage = z.infer<typeof InternalMessage>;

/**
 * Union of messages that should only be handled by the server
 */
export type ServerOnlyMessage = LobbyStateChangedMessage;
