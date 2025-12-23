/**
 * @file Constants.ts
 * @description Contains constants that will be used for the back-end
 * Enhanced with authentication and security constants
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2025-12-23
 */

// Re-export shared constants
export { DEFAULT_PLAYER_NUMBER, GAME_CONSTANTS, GAME_STATES, VALIDATION } from "../Shared/Constants";

// ============================================================================
// AUTHENTICATION CONSTANTS
// ============================================================================

// Token expiration and refresh settings
export const AUTH_CONSTANTS = {
  // Token lifetimes (in milliseconds)
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_THRESHOLD: 2 * 60 * 60 * 1000, // 2 hours before expiry
  TOKEN_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour cleanup interval

  // Rate limiting
  MAX_AUTH_ATTEMPTS: 5, // Maximum authentication attempts
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes rate limit window

  //TODO: change this back
  // Connection settings
  CONNECTION_EXPIRE_TIME: Math.floor(3600 / 4), // 15 minutes for connection expiry

  // Session settings
  SESSION_EXPIRE_TIME: Math.floor(3600), // 1 hour for session expiry when disconnected
  SESSION_ID_LENGTH: 21, // Default nanoid length
} as const;

// ============================================================================
// REDIS KEY PATTERNS
// ============================================================================
export const REDIS_KEYS = {
  // Session management
  SESSION: (sessionID: string) => `session:${sessionID}`,
  PLAYER_SESSIONS: (playerID: string) => `player_sessions:${playerID}`,

  // Existing patterns (maintained for compatibility)
  PLAYER: (playerID: string) => `player:${playerID}`,
  CONNECTION: (connectionID: string) => `connection:${connectionID}`,
  PLAYER_CONNECTION: (playerID: string) => `player:${playerID}:connection`,
  LOBBY: (lobbyID: string) => `lobby:${lobbyID}`,
  LOBBY_PLAYERS: (lobbyID: string) => `lobbyplayers:${lobbyID}`,
  LOBBY_SPECTATORS: (lobbyID: string) => `lobbyspectators:${lobbyID}`,
  USERNAMES: "usernames",
  GAME_STATES: (lobbyID: string) => `gamestate:${lobbyID}`,
  LOBBY_NAMES: "lobby_names", // Set of all active lobby names

  // Redis Streams for inter-server communication
  LOBBY_STREAM: (lobbyID: string) => `lobby_stream:${lobbyID}`,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = {
  // Authentication errors
  TOKEN_EXPIRED: "Session token has expired. Please log in again.",
  TOKEN_INVALID: "Invalid session token. Please log in again.",
  TOKEN_REVOKED: "Session token has been revoked. Please log in again.",
  PLAYER_MISMATCH:
    "Token player mismatch. Please log in with the correct account.",
  SESSION_LIMIT_EXCEEDED:
    "Maximum number of sessions exceeded. Please close other sessions.",
  RATE_LIMIT_EXCEEDED:
    "Too many authentication attempts. Please try again later.",
  CONCURRENT_LOGIN:
    "Another session is active. Please choose to continue or revoke other sessions.",
  SIGNATURE_INVALID: "Token signature is invalid. Please log in again.",

  // General errors
  AUTHENTICATION_REQUIRED: "Authentication required for this operation.",
  INVALID_SCHEMA: "This message doesn't match any known schemas.",
  INVALID_REQUEST_FORMAT: "Invalid request format.",
  INTERNAL_ERROR: "Internal server error. Please try again.",

  // Registration errors
  USERNAME_EXISTS:
    "Username already exists. Please choose a different username.",
  INVALID_USERNAME: "Invalid username format.",
  REGISTRATION_FAILED: "Registration failed. Please try again.",

  // Connection errors
  CONNECTION_FAILED: "Connection failed. Please check your network.",

  // Lobby errors
  LOBBY_NOT_FOUND: "Lobby not found.",
  LOBBY_FULL: "Lobby is full. Cannot join.",
  LOBBY_CLOSED: "Lobby is closed. Cannot join.",
  LOBBY_NAME_EXISTS: "A lobby with this name already exists.",
  NOT_IN_LOBBY: "You are not part of this lobby.",
  ALREADY_IN_LOBBY: "You are already in a lobby.",
  LOBBY_CREATION_FAILED: "Failed to create lobby. Please try again.",
  LOBBY_JOIN_FAILED: "Failed to join lobby. Please try again.",
  PLAYER_NOT_FOUND: "Player not found.",
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================
export const SUCCESS_MESSAGES = {
  // Authentication success
  LOGIN_SUCCESS: "Login successful.",
  TOKEN_REFRESHED: "Session token refreshed successfully.",
  LOGOUT_SUCCESS: "Logout successful.",
  SESSION_REVOKED: "Session revoked successfully.",
  ALL_SESSIONS_REVOKED: "All sessions revoked successfully.",

  // Registration success
  REGISTRATION_SUCCESS: "Player registered successfully.",

  // General success
  OPERATION_SUCCESS: "Operation completed successfully.",
} as const;


// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================
export const ENV_CONFIG = {
  // Default values for environment variables
  DEFAULT_SECRET_KEY:
    process.env.AUTH_SECRET_KEY || "default-secret-key-change-in-production",
  DEFAULT_TOKEN_EXPIRY:
    parseInt(process.env.TOKEN_EXPIRY_HOURS || "24") * 60 * 60 * 1000,
  DEFAULT_MAX_SESSIONS: parseInt(process.env.MAX_SESSIONS_PER_PLAYER || "5"),

  // Security flags
  ENABLE_TOKEN_REFRESH: process.env.ENABLE_TOKEN_REFRESH !== "false",
  ENABLE_SESSION_CLEANUP: process.env.ENABLE_SESSION_CLEANUP !== "false",

  // Development flags
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  ENABLE_DEBUG_LOGGING: process.env.ENABLE_DEBUG_LOGGING === "true",
} as const;

// ============================================================================
// EXPORTS (maintaining backward compatibility)
// ============================================================================

import { VALIDATION as SHARED_VALIDATION } from "../Shared/Constants";

// New exports for authentication system
export default {
  AUTH_CONSTANTS,
  REDIS_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION: SHARED_VALIDATION,
  ENV_CONFIG,
};
