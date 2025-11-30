import * as z from "zod";
import { GAME_CONSTANTS, VALIDATION } from "../Contants";

export enum FROM_SERVER_MESSAGE_TYPES {
  GAME_UPDATE = "game_update",
  GAME_STATE_UPDATE = "game_state_update",
}

/** The game update message is responsible for sending game state updates to the client.
 * It is similar to the MakeMove message,
 * where it sends the move that was made so clients can update their game state,
 * but also includes the turn of the current player.
 */
export const GameUpdateMessage = z.object({
  type: z.literal("game_update"),
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
 * The game state update message is responsible for notifying the client of any change in game state. This includes start, end, paused, and cancelled. Sometimes an optional message can be included to provide additional context.
 */
export const GameStateUpdateMessage = z.object({
  type: z.literal("game_state_update"),
  state: z.enum(["started", "ended", "paused", "cancelled"]),
  message: z.string().max(VALIDATION.MAX_STANDARD_LENGTH).optional(),
});
