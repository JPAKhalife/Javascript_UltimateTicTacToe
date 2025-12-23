# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Ultimate TicTacToe multiplayer game with configurable grid sizes and levels. Built with a TypeScript-based client-server architecture using WebSockets, Redis for state management, and Docker for deployment.

## Build Commands

### Development

```bash
# Build backend only
npx webpack --config webpack-back.config.js --mode development --env LOG_LEVEL=DEBUG

# Build frontend only
npx webpack --config webpack-front.config.js --mode development --env LOG_LEVEL=DEBUG

# Run frontend dev server with hot reload
npx webpack serve --config webpack-front.config.js --mode development --env LOG_LEVEL=DEBUG
# Frontend dev server runs on http://localhost:9000
```

### Production Build & Deploy

```bash
# Full build and deployment (preferred method)
./start.sh

# This script:
# 1. Cleans and recreates dist directory
# 2. Copies HTML, CSS, and assets to dist/FrontEnd
# 3. Builds backend (webpack-back.config.js) → dist/back.bundle.js
# 4. Builds frontend (webpack-front.config.js) → dist/FrontEnd/front.bundle.js
# 5. Stops and prunes Docker containers/volumes/images
# 6. Builds and starts docker-compose services (redis + app server)
```

### Linting

```bash
# Run ESLint
npx eslint .

# Auto-fix ESLint issues
npx eslint . --fix
```

## Architecture

### Shared Code (`src/Shared/`)

**Shared between frontend and backend for type safety and consistency:**

1. **Constants** (`Constants.ts`)
   - `GAME_CONSTANTS` - Game configuration (max players, grid size, level size)
   - `VALIDATION` - Input validation limits (username length, message length, etc.)
   - `GAME_STATES` - Enum for game states (waiting, running, paused)

2. **Contracts** (`Contracts/`)
   - `MessageToServerSchema.ts` - Zod schemas for client→server messages
   - `MessageToClientSchema.ts` - Zod schemas for server→client messages
   - All messages validated using Zod on both frontend and backend

### Backend (`src/BackEnd/`)

**Entry Point:** `server.ts` - Express server with WebSocket support on port 3000

**Key Architectural Components:**

1. **Database Layer** (`Database/`)
   - `DatabaseManager.ts` - Singleton managing two Redis connections:
     - `regularClient` - For standard operations (get/set/etc)
     - `subscriberClient` - For keyspace notifications (session/connection expiry, inter-server events)
   - `RedisObject.ts` - Base class providing CRUD operations for Redis-backed objects
   - `Session.ts` - User session management with token-based authentication
   - `ClientConnections.ts` - Maps connectionIDs to WebSocket objects
   - `ServerConnections.ts` - Manages inter-server communication via Redis pub/sub
   - `Player.ts` - Player data and state
   - `Lobby/Lobby.ts` - Game lobby management

2. **Request Handling** (`Handling/`)
   - `WebsocketRequestHandler.ts` - Routes incoming WebSocket messages to handlers based on message type
   - `GameHandler.ts` - Game logic for moves, win conditions, etc.
   - `InternalHandler.ts` - Handles Redis keyspace events (session/connection expiry)
   - `ServerRedisGameEventHandler.ts` - Handles inter-server game events via Redis
   - `WebsocketEventHandler.ts` - Low-level WebSocket event handling

3. **Backend-Specific Constants** (`Contants.ts`)
   - Re-exports shared constants from `Shared/Constants`
   - `AUTH_CONSTANTS` - Authentication and session settings
   - `REDIS_KEYS` - Redis key pattern generators
   - `ERROR_MESSAGES` / `SUCCESS_MESSAGES` - Standardized response messages
   - `ENV_CONFIG` - Environment-specific configuration

**Message Flow:**

1. Client sends JSON message via WebSocket
2. `WebsocketRequestHandler` validates message against Zod schema
3. Handler retrieves session data from Redis
4. Handler executes business logic (lobby creation, moves, etc.)
5. Response sent back via WebSocket
6. State changes published to Redis for multi-server synchronization

**Redis Usage:**

- Session storage with TTL
- Connection tracking
- Lobby state management
- Inter-server pub/sub channels (format: `lobby:{lobbyID}`)
- Keyspace notifications for automatic cleanup

### Frontend (`src/FrontEnd/`)

**Entry Point:** `sketch.ts` - P5.js-based game client

**Architecture:**

- `GuiManager.ts` - Screen management and transitions
- `Menu.ts` - Screen enumeration and navigation
- `WebManager.ts` - WebSocket communication with backend
- `GameManager.ts` - Game state and logic
- `Screens/` - Individual screen implementations (Start, Setup, Game, Multiplayer, etc.)
- `MenuObjects/` - Reusable UI components (buttons, sliders, fields, etc.)
- `TicTac.ts` - Core game board logic
- `Constants.ts` - Re-exports shared constants and frontend-specific constants (FRAMERATE)

**Environment Variables:**

- `REMOTE_SERVER_ADDRESS` - WebSocket server URL (default: `ws://localhost:3000`)
- `LOG_LEVEL` - Logging verbosity (DEBUG, INFO, etc.)

### TypeScript Configurations

- `tsconfig.back.json` - Backend config (Node.js target, includes BackEnd + Shared)
- `tsconfig.front.json` - Frontend config (Browser target with DOM libs, includes FrontEnd + Shared)
- Both configs share access to `src/Shared/` for type safety across the codebase

### Docker Setup

- `docker-compose.yml` - Defines two services:
  - `db` - Redis Stack (port 6379) with health checks
  - `web` - Node.js app server (port 3000) depends on db
- `dockerfile` - Builds app container from dist/ directory
- Environment variables loaded from `src/BackEnd/.env`

## Important Constants

Located in `src/BackEnd/Contants.ts`:

- `GAME_CONSTANTS` - Max players, grid sizes, level sizes
- `VALIDATION` - String length limits, result limits
- `REDIS_KEYS` - Redis key prefixes for different object types
- `ERROR_MESSAGES` / `SUCCESS_MESSAGES` - Standardized response messages

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. For backend changes: rebuild with webpack-back.config.js
3. For frontend changes: use dev server OR rebuild with webpack-front.config.js
4. For production testing: run `./start.sh` to fully rebuild in Docker
5. Backend changes require Docker restart; frontend changes can use hot reload in dev mode

## Code Style

ESLint configured with:

- TypeScript ESLint recommended rules
- Double quotes, 2-space indentation, semicolons required
- No console.info restrictions (server logging is expected)
- Strict type checking with `@typescript-eslint/no-explicit-any: warn`
- Trailing commas in multiline structures

## Debugging

- Set `LOG_LEVEL=DEBUG` in webpack build commands for verbose logging
- Backend logs visible via `docker-compose logs -f web`
- Redis logs visible via `docker-compose logs -f db`
- Source maps enabled in both webpack configs for debugging bundled code
