/**
 * @file ServerRequestService.ts
 * @description Service layer for all server requests. Provides strongly-typed methods for each request type.
 * @author John Khalife
 * @created 2025-12-23
 */

import WebManager, { type GameUpdateMessage, type GameStateUpdateMessage } from "./WebManager";
import {
  type RegisterPlayerResponse,
  type CreateLobbyResponse,
  type LobbyInfo,
  type GameStateInfo,
  FROM_SERVER_MESSAGE_TYPES,
} from "../../Shared/Contracts/MessageToClientSchema";
import { FROM_CLIENT_MESSAGE_TYPES } from "../../Shared/Contracts/MessageToServerSchema";

/**
 * Interface for lobby search parameters
 */
export interface LobbySearchParams {
  lobbyID?: string;
  lobbyName?: string;
  playerNum?: number;
  levelSize?: number;
  gridSize?: number;
  joinedPlayers?: number;
  maxListLength?: number;
  lobbyState?: string;
  creator?: string;
}

/**
 * Interface for move position
 */
export interface MovePosition {
  col: number;
  row: number;
  selectedIndex: number;
}

/**
 * ServerRequestService
 * @description Provides a clean, strongly-typed interface for all server requests.
 * Screens should use this service instead of directly accessing WebManager.
 */
export default class ServerRequestService {
  private static instance: ServerRequestService | null = null;
  private webManager: WebManager;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.webManager = WebManager.getInstance();
  }

  /**
   * @method getInstance
   * @description Get the singleton instance of ServerRequestService
   * @returns {ServerRequestService} The singleton instance
   */
  public static getInstance(): ServerRequestService {
    if (!ServerRequestService.instance) {
      ServerRequestService.instance = new ServerRequestService();
    }
    return ServerRequestService.instance;
  }

  /**
   * @method registerPlayer
   * @description Register a new player with the server
   * @param username The username for the new player
   * @returns Promise resolving to registration response with sessionID and message
   * @throws Error if registration fails
   */
  public async registerPlayer(username: string): Promise<RegisterPlayerResponse> {
    try {
      const message = {
        type: FROM_CLIENT_MESSAGE_TYPES.REGISTER_PLAYER,
        parameters: {
          username: username
        },
      };

      const response = await this.webManager.sendRequest<RegisterPlayerResponse>(
        message,
        FROM_CLIENT_MESSAGE_TYPES.REGISTER_PLAYER
      );

      if (response.success && response.sessionID && response.playerID) {
        this.webManager.setSessionId(response.sessionID);
        this.webManager.setPlayerId(response.playerID);
        console.info("[ServerRequestService] Player registered successfully");
        return response;
      }

      throw new Error(response.message || "Registration failed");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[ServerRequestService] Registration error:", errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * @method createLobby
   * @description Create a new game lobby
   * @param lobbyName Name of the lobby
   * @param playerNum Number of players allowed
   * @param levelSize Size of the level
   * @param gridSize Size of the grid
   * @param allowSpectators Whether spectators are allowed
   * @returns Promise resolving to the created lobby response
   * @throws Error if lobby creation fails
   */
  public async createLobby(
    lobbyName: string,
    playerNum: number,
    levelSize: number,
    gridSize: number,
    allowSpectators: boolean,
  ): Promise<CreateLobbyResponse> {
    try {
      const message = {
        type: FROM_CLIENT_MESSAGE_TYPES.CREATE_LOBBY,
        sessionID: this.webManager.getSessionId(),
        parameters: {
          lobbyData: {
            lobbyName,
            playerNum,
            levelSize,
            gridSize,
            allowSpectators,
          },
        },
      };

      const response = await this.webManager.sendRequest<CreateLobbyResponse>(
        message,
        FROM_CLIENT_MESSAGE_TYPES.CREATE_LOBBY
      );

      if (response.success && response.lobbyID) {
        console.info("[ServerRequestService] Lobby created successfully:", response.lobbyID);
        return response;
      }

      throw new Error(response.error || "Failed to create lobby");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[ServerRequestService] Create lobby error:", errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * @method searchLobbies
   * @description Search for available lobbies with optional filters
   * @param params Search parameters (all optional)
   * @returns Promise resolving to array of lobby information
   */
  public async searchLobbies(params: LobbySearchParams = {}): Promise<LobbyInfo[]> {
    try {
      const message = {
        type: FROM_CLIENT_MESSAGE_TYPES.SEARCH_LOBBY,
        sessionID: this.webManager.getSessionId(),
        parameters: {
          lobbyID: params.lobbyID,
          lobbyName: params.lobbyName,
          playerNum: params.playerNum,
          levelSize: params.levelSize,
          gridSize: params.gridSize,
          creator: params.creator,
          lobbyState: params.lobbyState,
          joinedPlayers: params.joinedPlayers,
          maxListLength: params.maxListLength,
        },
      };

      const response = await this.webManager.sendRequest<{
        success: boolean;
        lobbies: any[];
      }>(message, FROM_CLIENT_MESSAGE_TYPES.SEARCH_LOBBY);

      if (response && response.success && Array.isArray(response.lobbies)) {
        return response.lobbies.map((lobby) => ({
          lobbyID: lobby.lobbyID,
          lobbyName: lobby.lobbyName,
          playerNum: lobby.playerNum,
          levelSize: lobby.levelSize,
          gridSize: lobby.gridSize,
          playersJoined: lobby.playersJoined,
          creator: lobby.creator,
          lobbyState: lobby.lobbyState,
          allowSpectators: lobby.allowSpectators,
        }));
      }

      return [];
    } catch (error) {
      console.error("[ServerRequestService] Search lobbies error:", error);
      return [];
    }
  }

  /**
   * @method joinLobby
   * @description Join an existing lobby
   * @param lobbyID The ID of the lobby to join
   * @returns Promise resolving to game state information if successful, or an object with error property if failed
   */
  public async joinLobby(lobbyID: string): Promise<GameStateInfo | { error: string }> {
    try {
      const message = {
        type: FROM_CLIENT_MESSAGE_TYPES.JOIN_LOBBY,
        sessionID: this.webManager.getSessionId(),
        parameters: {
          lobbyID: lobbyID,
        },
      };

      const response = await this.webManager.sendRequest<{
        success: boolean;
        gameState: any;
        error?: string;
        message?: string;
      }>(message, FROM_CLIENT_MESSAGE_TYPES.JOIN_LOBBY);

      if (response && response.success && response.gameState) {
        console.info("[ServerRequestService] Joined lobby successfully:", lobbyID);

        return {
          type: FROM_SERVER_MESSAGE_TYPES.GAME_INFO,
          lobbyID: response.gameState.lobbyID,
          lobbyName: response.gameState.lobbyName,
          playerNum: response.gameState.playerNum,
          levelSize: response.gameState.levelSize,
          gridSize: response.gameState.gridSize,
          lobbyState: response.gameState.lobbyState,
          allowSpectators: response.gameState.allowSpectators,
          playerList: response.gameState.playerList,
          currentTurn: response.gameState.currentTurn,
          board: response.gameState.board,
        };
      }

      // Return error message from response
      const errorMessage = response?.error || response?.message || "Failed to join lobby";
      return { error: errorMessage };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to join lobby";
      console.error("[ServerRequestService] Join lobby error:", errorMessage);
      return { error: errorMessage };
    }
  }

  /**
   * @method makeMove
   * @description Send a move to the server in a game
   * @param lobbyID The ID of the lobby where the game is happening
   * @param position The position of the move (column and row)
   * @returns Promise resolving to true if move was successful, false otherwise
   */
  public async makeMove(
    lobbyID: string,
    position: MovePosition,
  ): Promise<boolean> {
    try {
      const message = {
        type: FROM_CLIENT_MESSAGE_TYPES.MAKE_MOVE,
        sessionID: this.webManager.getSessionId(),
        parameters: {
          lobbyID,
          position,
        },
      };

      const response = await this.webManager.sendRequest<{ success: boolean }>(
        message,
        FROM_CLIENT_MESSAGE_TYPES.MAKE_MOVE,
      );

      return response && response.success === true;
    } catch (error) {
      console.error("[ServerRequestService] Make move error:", error);
      return false;
    }
  }

  /**
   * @method AcknowledgeReady
   * @description Send acknowledgment to server that LoadingScreen is ready and waiting
   * This helps synchronize all clients before starting the game
   * @param lobbyID The ID of the lobby where the player is waiting
   */
  public AcknowledgeReady(lobbyID: string): void {
    try {
      const message = {
        type: FROM_CLIENT_MESSAGE_TYPES.ACKNOWLEDGE_READY,
        sessionID: this.webManager.getSessionId(),
        parameters: {
          lobbyID,
        },
      };

      // Fire and forget - send request but don't wait for response
      this.webManager.sendRequest(message, FROM_CLIENT_MESSAGE_TYPES.ACKNOWLEDGE_READY)
        .catch((error) => {
          console.error("[ServerRequestService] Acknowledge error:", error);
        });
      console.info("[ServerRequestService] Sent ready acknowledgment for lobby:", lobbyID);
    } catch (error) {
      console.error("[ServerRequestService] Acknowledge ready error:", error);
    }
  }

  /**
   * @method addGameListener
   * @description Add a listener for game updates
   * @param listener Function to be called when a game update is received
   */
  public addGameListener(type: FROM_SERVER_MESSAGE_TYPES, listener: (message: any) => void): void {
    this.webManager.registerTypeCallback(type, listener);
    console.info("[ServerRequestService] Registered listener for: ", type);
  }

  /**
   * @method removeGameListener
   * @description Remove a specific game update listener
   * @param listener The listener function to remove
   */
  public removeGameListener(type: FROM_SERVER_MESSAGE_TYPES): void {
    console.info("[ServerRequestService] Removing game listeners")
    this.webManager.removeTypeCallback(type);
  }

  /**
   * @method removeGameListeners
   * @description remove all game listeners
   */
  public removeGameListeners(): void {
    for (const type of Object.values(FROM_SERVER_MESSAGE_TYPES)) {
      this.webManager.removeTypeCallback(type);
    }
    console.info("[ServerRequestService] Removed all game listeners");
  }

  /**
   * @method ensureConnection
   * @description Ensure WebSocket connection is established
   * @returns Promise resolving to true if connected
   */
  public async ensureConnection(): Promise<boolean> {
    return this.webManager.initiateConnectionIfNotEstablished();
  }

  /**
   * @method isConnected
   * @description Check if WebSocket is currently connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.webManager.isConnected();
  }

  /**
   * @method isAuthenticated
   * @description Check if user is authenticated (has valid session)
   * @returns True if authenticated, false otherwise
   */
  public isAuthenticated(): boolean {
    return WebManager.isAuthenticated;
  }

  /**
   * @method getSessionId
   * @description Get the current session ID
   * @returns The session ID or null if not authenticated
   */
  public getSessionId(): string | null {
    return this.webManager.getSessionId();
  }

  /**
   * @method getPlayerId
   * @description Get the current player ID
   * @returns The player ID or null if not set
   */
  public getPlayerId(): string | null {
    return this.webManager.getPlayerId();
  }

  /**
   * @method clearSession
   * @description Clear the current session and player identity
   */
  public clearSession(): void {
    this.webManager.clearSessionId();
    this.webManager.clearPlayerId();
  }
}
