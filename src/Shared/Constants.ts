/**
 * @file Constants.ts
 * @description Shared constants between frontend and backend
 * @author John Khalife
 * @created 2025-12-23
 */

// ============================================================================
// GAME CONSTANTS
// ============================================================================
export const DEFAULT_PLAYER_NUMBER = 2;

export const GAME_CONSTANTS = {
  MAX_PLAYER_CAP: 10,
  MAX_SPECTATOR_CAP: 10,
  MAX_GRIDSIZE_CAP: 10,
  MAX_LEVELSIZE_CAP: 10,
};

export enum GAME_STATES {
  WAITING = "waiting",
  RUNNING = "running",
  PAUSED = "paused",
  CANCELLED = "cancelled",
  FINISHED = "finished",
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================
export const VALIDATION = {
  // String length limits
  MAX_USERNAME_LENGTH: 36,
  MIN_USERNAME_LENGTH: 1,
  MAX_STANDARD_LENGTH: 50,
  MIN_STANDARD_LENGTH: 1,

  // Max query results
  MAX_RESULTS: 30,
  MAX_SEARCH_LIMIT: 50,

  MAX_MESSAGE_LENGTH: 1000,

  // Token format validation
  TOKEN_PARTS_COUNT: 3,
  UUID_LENGTH: 36,

  // Connection limits
  MAX_CONNECTIONS_PER_DEVICE: 1,
} as const;
