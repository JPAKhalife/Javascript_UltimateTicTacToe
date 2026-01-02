/**
 * @file MessageToClientSchema.ts
 * @description Zod schemas for messages sent from server to client.
 * Shared between frontend and backend for type safety.
 *
 * @author John Khalife
 * @created 2025-12-23
 */

import * as z from "zod";
import { VALIDATION, GAME_CONSTANTS, GAME_STATES } from "../Constants";

export enum FROM_SERVER_MESSAGE_TYPES {
  GAME_UPDATE = "game_update",
  GAME_STATE_UPDATE = "game_state_update",
  ACKNOWLEDGMENT_REQUEST = "acknowledgment_request",
}

// ============================================================================
// Base Response Schemas
// ============================================================================

/**
 * Base response that all server responses extend
 */
export const BaseResponse = z.object({
  success: z.boolean(),
  messageID: z.string().optional(),
  type: z.string().optional(),
  message: z.string().max(VALIDATION.MAX_STANDARD_LENGTH).optional(),
  error: z.string().max(VALIDATION.MAX_STANDARD_LENGTH).optional(),
});
export type BaseResponse = z.infer<typeof BaseResponse>;

// ============================================================================
// Request-Specific Response Schemas
// ============================================================================

/**
 * Response for player registration
 */
export const RegisterPlayerResponse = BaseResponse.extend({
  sessionID: z.string(),
  message: z.string(),
});
export type RegisterPlayerResponse = z.infer<typeof RegisterPlayerResponse>;

/**
 * Response for lobby creation
 */
export const CreateLobbyResponse = BaseResponse.extend({
  lobbyID: z.string().uuid(),
});
export type CreateLobbyResponse = z.infer<typeof CreateLobbyResponse>;

/**
 * Lobby information object used in responses
 */
export const LobbyInfo = z.object({
  lobbyID: z.string().uuid(),
  lobbyName: z.string().max(VALIDATION.MAX_USERNAME_LENGTH),
  playerNum: z.number().int().lte(GAME_CONSTANTS.MAX_PLAYER_CAP),
  levelSize: z.number().int().lte(GAME_CONSTANTS.MAX_LEVELSIZE_CAP),
  gridSize: z.number().int().lte(GAME_CONSTANTS.MAX_GRIDSIZE_CAP),
  playersJoined: z.number().int(),
  creator: z.string().max(VALIDATION.MAX_USERNAME_LENGTH),
  lobbyState: z.string().max(VALIDATION.MAX_STANDARD_LENGTH),
  allowSpectators: z.boolean(),
});
export type LobbyInfo = z.infer<typeof LobbyInfo>;

/**
 * Response for lobby search
 */
export const SearchLobbyResponse = BaseResponse.extend({
  lobbies: z.array(LobbyInfo),
});
export type SearchLobbyResponse = z.infer<typeof SearchLobbyResponse>;

/**
 * Response for joining a lobby
 */
export const JoinLobbyResponse = BaseResponse.extend({
  lobby: LobbyInfo,
});
export type JoinLobbyResponse = z.infer<typeof JoinLobbyResponse>;

/**
 * Response for making a move
 */
export const MakeMoveResponse = BaseResponse.extend({});
export type MakeMoveResponse = z.infer<typeof MakeMoveResponse>;

/**
 * Response for reconnection
 */
export const ReconnectResponse = BaseResponse.extend({
  playerID: z.string(),
});
export type ReconnectResponse = z.infer<typeof ReconnectResponse>;

// ============================================================================
// Server-Initiated Message Schemas
// ============================================================================

/**
 * The game update message is responsible for sending game state updates to the client.
 * It is similar to the MakeMove message,
 * where it sends the move that was made so clients can update their game state,
 * but also includes the turn of the current player.
 */
export const GameUpdateMessage = z.object({
  type: z.literal("game_update"),
  gameState: z.string().optional(),
  board: z.array(z.number()).optional(),
  turn: z.number().int().gte(1),
  lastMove: z
    .object({
      player: z.string(),
      position: z.object({
        col: z.number().int().gte(0),
        row: z.number().int().gte(0),
      }),
    })
    .optional(),
});
export type GameUpdateMessage = z.infer<typeof GameUpdateMessage>;

/**
 * The game state update message is responsible for notifying the client of any change in game state.
 * This includes waiting, running, and paused states.
 */
export const GameStateUpdateMessage = z.object({
  type: z.literal("game_state_update"),
  state: z.enum([GAME_STATES.WAITING, GAME_STATES.RUNNING, GAME_STATES.PAUSED, GAME_STATES.CANCELLED, GAME_STATES.FINISHED]),
  message: z.string().max(VALIDATION.MAX_STANDARD_LENGTH).optional(),
});
export type GameStateUpdateMessage = z.infer<typeof GameStateUpdateMessage>;

/**
 * Server request for clients to acknowledge they are ready to start the game
 * Sent when all players have joined and game is about to start
 */
export const AcknowledgmentRequestMessage = z.object({
  type: z.literal("acknowledgment_request"),
  message: z.string().max(VALIDATION.MAX_STANDARD_LENGTH).optional(),
});
export type AcknowledgmentRequestMessage = z.infer<typeof AcknowledgmentRequestMessage>;
