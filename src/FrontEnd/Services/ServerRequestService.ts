/**
 * @file ServerRequestService.ts
 * @description Service layer for all server requests. Provides strongly-typed methods for each request type.
 * @author John Khalife
 * @created 2025-12-23
 */

import WebManager, { GameUpdate } from "../WebManager";
import type {
  RegisterPlayerResponse,
  CreateLobbyResponse,
  LobbyInfo,
} from "../../Shared/Contracts/MessageToClientSchema";

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
        type: "register_player",
        parameters: {
          username: username
        },
      };

      const response = await this.webManager.sendRequest<RegisterPlayerResponse>(
        message,
        "registerPlayer"
      );

      if (response.success && response.sessionID) {
        this.webManager.setSessionId(response.sessionID);
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
        type: "create_lobby",
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
        "create_lobby"
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
        type: "search_lobby",
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
      }>(message, "search_lobby");

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
   * @returns Promise resolving to lobby information if successful, null otherwise
   */
  public async joinLobby(lobbyID: string): Promise<LobbyInfo | null> {
    try {
      const message = {
        type: "join_lobby",
        sessionID: this.webManager.getSessionId(),
        parameters: {
          lobbyID: lobbyID,
        },
      };

      const response = await this.webManager.sendRequest<{
        success: boolean;
        lobby: any;
      }>(message, "join_lobby");

      if (response && response.success && response.lobby) {
        // Register game update callback after successful join
        this.webManager.registerTypeCallback("game_update", (update) =>
          this.handleGameUpdate(update as GameUpdate),
        );

        console.info("[ServerRequestService] Joined lobby successfully:", lobbyID);

        return {
          lobbyID: response.lobby.lobbyID,
          lobbyName: response.lobby.lobbyName,
          playerNum: response.lobby.playerNum,
          levelSize: response.lobby.levelSize,
          gridSize: response.lobby.gridSize,
          playersJoined: response.lobby.playersJoined,
          creator: response.lobby.creator,
          lobbyState: response.lobby.lobbyState,
          allowSpectators: response.lobby.allowSpectators,
        };
      }

      return null;
    } catch (error) {
      console.error("[ServerRequestService] Join lobby error:", error);
      return null;
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
        type: "make_move",
        sessionID: this.webManager.getSessionId(),
        parameters: {
          lobbyID,
          position,
        },
      };

      const response = await this.webManager.sendRequest<{ success: boolean }>(
        message,
        "make_move",
      );

      return response && response.success === true;
    } catch (error) {
      console.error("[ServerRequestService] Make move error:", error);
      return false;
    }
  }

  /**
   * @method addGameUpdateListener
   * @description Add a listener for game updates
   * @param listener Function to be called when a game update is received
   */
  public addGameUpdateListener(listener: (update: GameUpdate) => void): void {
    this.webManager.addGameListener(listener);
  }

  /**
   * @method removeGameUpdateListener
   * @description Remove a specific game update listener
   * @param listener The listener function to remove
   */
  public removeGameUpdateListener(listener: (update: GameUpdate) => void): void {
    this.webManager.removeGameListener(listener);
  }

  /**
   * @method clearGameUpdateListeners
   * @description Remove all game update listeners
   */
  public clearGameUpdateListeners(): void {
    this.webManager.clearGameListeners();
  }

  /**
   * @method handleGameUpdate
   * @description Internal handler for game update messages
   * @param update The game update data received from the server
   * @private
   */
  private handleGameUpdate(update: GameUpdate): void {
    // The WebManager already handles notifying listeners
    // This is just a pass-through to maintain encapsulation
    console.info("[ServerRequestService] Game update received:", update);
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
   * @method clearSession
   * @description Clear the current session
   */
  public clearSession(): void {
    this.webManager.clearSessionId();
  }
}
