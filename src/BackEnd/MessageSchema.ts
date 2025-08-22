/**
 * @file MessageSchema.ts
 * @description Uses zod to validate all incoming messages.
 * 
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import * as z from "zod";
import { GAME_CONSTANTS, VALIDATION } from "./Contants";

//These are the message types that the player can send.
export enum MESSAGE_TYPES {
    REGISTER_PLAYER = "register_player",
    SEARCH_LOBBY = "search_lobby",
    CREATE_LOBBY = "create_lobby"
}

//This is the base request that contains information all requests should have
export const BaseRequest = z.object({
    messageID: z.string().min(VALIDATION.MIN_STANDARD_LENGTH).max(VALIDATION.MAX_STANDARD_LENGTH), // All messages should have a message ID - at most 50 characters
    type: z.string().min(VALIDATION.MIN_STANDARD_LENGTH).max(VALIDATION.MAX_STANDARD_LENGTH), // All messages should have a type - at most 20 characters
    sessionID: z.string().optional() // Session ID for authenticated requests (optional for registration)
});
export type BaseRequest = z.infer<typeof BaseRequest>;

//This request is used to register a new player.
export const RegisterRequest = BaseRequest.extend({
    parameters: z.object({
        username: z.string().min(VALIDATION.MIN_USERNAME_LENGTH).max(VALIDATION.MAX_USERNAME_LENGTH),
        checkUsername: z.boolean().optional()
    })
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

//This is the authenticated request that contains information all authenticated requests should have
export const AuthenticatedRequest = BaseRequest.extend({
    sessionID: z.string().min(1) // Session ID is required for authenticated requests
});
export type AuthenticatedRequest = z.infer<typeof AuthenticatedRequest>; 

//This request is used when the player wants to search for a lobby
export const LobbySearchRequest = AuthenticatedRequest.extend({
    parameters: z.object({
        playerNum: z.number().int().lte(GAME_CONSTANTS.MAX_PLAYER_CAP).gte(0).optional(),
        levelSize: z.number().int().lte(GAME_CONSTANTS.MAX_LEVELSIZE_CAP).gte(0).optional(),
        gridSize: z.number().int().lte(GAME_CONSTANTS.MAX_GRIDSIZE_CAP).gte(0).optional(),
        joinedPlayers: z.number().int().lte(GAME_CONSTANTS.MAX_PLAYER_CAP + GAME_CONSTANTS.MAX_SPECTATOR_CAP).gte(0).optional(),
        lobbyState: z.string().max(VALIDATION.MAX_STANDARD_LENGTH).optional(),
        creator: z.string().max(VALIDATION.MAX_USERNAME_LENGTH).optional(),
        allowSpectators: z.boolean().optional(),
        maxListLength: z.number().int().lte(VALIDATION.MAX_RESULTS).gte(0).optional(),
        searchListLength: z.number().int().lte(VALIDATION.MAX_SEARCH_LIMIT).gte(0).optional()
    })
});
export type LobbySearchRequest = z.infer<typeof LobbySearchRequest>;

//This request is used by clients to request the creation of a lobby.
export const LobbyCreateRequest = AuthenticatedRequest.extend({
    parameters: z.object({
        lobbyID: z.string().uuid({ version: "v4"}),
        lobbyData: z.object({
            playerNum: z.number().int().lte(GAME_CONSTANTS.MAX_PLAYER_CAP).gte(0),
            levelSize: z.number().int().lte(GAME_CONSTANTS.MAX_LEVELSIZE_CAP).gte(0),
            gridSize: z.number().int().lte(GAME_CONSTANTS.MAX_GRIDSIZE_CAP).gte(0),
            allowSpectators: z.boolean()
        }),
        playerID: z.string().uuid({ version: "v4" }).optional() // Kept for backward compatibility
    })
});
export type LobbyCreateRequest = z.infer<typeof LobbyCreateRequest>;
