/**
 * @file Constants.ts
 * @description Contains constants that will be used for the back-end
 * Enhanced with authentication and security constants
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2025-08-18
 */

// ============================================================================
// GAME CONSTANTS
// ============================================================================
export const DEFAULT_PLAYER_NUMBER = 2; // Defined here instead of importing from FrontEnd

export const GAME_CONSTANTS = {
    MAX_PLAYER_CAP: 10, // The maximum number of players that can be in a game at once
    MAX_SPECTATOR_CAP: 10, // The maximum number of spectators that can be in a game at once
    MAX_GRIDSIZE_CAP: 10, // The maximum number for the levelsize
    MAX_LEVELSIZE_CAP: 10, // The maximum value for the levelsize
}

export enum GAME_STATES {
    WAITING = "waiting",
    RUNNING = "running",
    PAUSED = "paused"
}

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
    LOBBY: (lobbyID: string) => `lobby:${lobbyID}`,
    LOBBY_PLAYERS: (lobbyID: string) => `lobbyplayers:${lobbyID}`,
    USERNAMES: 'usernames',
    GAME_STATES: (lobbyID: string) => `gamestate:${lobbyID}`,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = {
    // Authentication errors
    TOKEN_EXPIRED: 'Session token has expired. Please log in again.',
    TOKEN_INVALID: 'Invalid session token. Please log in again.',
    TOKEN_REVOKED: 'Session token has been revoked. Please log in again.',
    PLAYER_MISMATCH: 'Token player mismatch. Please log in with the correct account.',
    SESSION_LIMIT_EXCEEDED: 'Maximum number of sessions exceeded. Please close other sessions.',
    RATE_LIMIT_EXCEEDED: 'Too many authentication attempts. Please try again later.',
    CONCURRENT_LOGIN: 'Another session is active. Please choose to continue or revoke other sessions.',
    SIGNATURE_INVALID: 'Token signature is invalid. Please log in again.',

    // General errors
    AUTHENTICATION_REQUIRED: 'Authentication required for this operation.',
    INVALID_REQUEST_FORMAT: 'Invalid request format.',
    INTERNAL_ERROR: 'Internal server error. Please try again.',

    // Registration errors
    USERNAME_EXISTS: 'Username already exists. Please choose a different username.',
    INVALID_USERNAME: 'Invalid username format.',
    REGISTRATION_FAILED: 'Registration failed. Please try again.',

    // Connection errors
    CONNECTION_FAILED: 'Connection failed. Please check your network.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================
export const SUCCESS_MESSAGES = {
    // Authentication success
    LOGIN_SUCCESS: 'Login successful.',
    TOKEN_REFRESHED: 'Session token refreshed successfully.',
    LOGOUT_SUCCESS: 'Logout successful.',
    SESSION_REVOKED: 'Session revoked successfully.',
    ALL_SESSIONS_REVOKED: 'All sessions revoked successfully.',

    // Registration success
    REGISTRATION_SUCCESS: 'Player registered successfully.',

    // General success
    OPERATION_SUCCESS: 'Operation completed successfully.',
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================
export const VALIDATION = {
    // String length limits
    MAX_USERNAME_LENGTH: 36,
    MIN_USERNAME_LENGTH: 1,
    MAX_STANDARD_LENGTH: 50,
    MIN_STANDARD_LENGTH: 1,

    //Max query results
    MAX_RESULTS: 30,
    MAX_SEARCH_LIMIT: 50,

    MAX_MESSAGE_LENGTH: 1000,

    // Token format validation
    TOKEN_PARTS_COUNT: 3,
    UUID_LENGTH: 36,

    // Connection limits
    MAX_CONNECTIONS_PER_DEVICE: 1,
} as const;

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================
export const ENV_CONFIG = {
    // Default values for environment variables
    DEFAULT_SECRET_KEY: process.env.AUTH_SECRET_KEY || 'default-secret-key-change-in-production',
    DEFAULT_TOKEN_EXPIRY: parseInt(process.env.TOKEN_EXPIRY_HOURS || '24') * 60 * 60 * 1000,
    DEFAULT_MAX_SESSIONS: parseInt(process.env.MAX_SESSIONS_PER_PLAYER || '5'),

    // Security flags
    ENABLE_TOKEN_REFRESH: process.env.ENABLE_TOKEN_REFRESH !== 'false',
    ENABLE_SESSION_CLEANUP: process.env.ENABLE_SESSION_CLEANUP !== 'false',

    // Development flags
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    ENABLE_DEBUG_LOGGING: process.env.ENABLE_DEBUG_LOGGING === 'true',
} as const;

// ============================================================================
// EXPORTS (maintaining backward compatibility)
// ============================================================================

// New exports for authentication system
export default {
    AUTH_CONSTANTS,
    REDIS_KEYS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    VALIDATION,
    ENV_CONFIG,
};
