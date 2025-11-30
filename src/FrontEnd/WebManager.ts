/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import { time } from "console";
const { v4: uuidv4 } = require("uuid");

/**
 * Interface representing lobby information
 */
export interface LobbyInfo {
  lobbyID: string;
  lobbyName: string;
  playerNum: number;
  levelSize: number;
  gridSize: number;
  playersJoined: number;
  creator: string;
  lobbyState: string;
  allowSpectators: boolean;
}

/**
 * Interface representing a game update from the server
 */
export interface GameUpdate {
  type: "game_update";
  gameState: string; // The current state of the game
  board: number[]; // The current game state array
  turn: number; // Current turn
  lastMove?: {
    // Optional info about the last move
    player: string;
    position: {
      col: number;
      row: number;
    };
  };
}

export default class WebManager {
  private static instance: WebManager | null = null;
  public static isAuthenticated: boolean = false;
  private socket: WebSocket | null = null;
  private exactMessageCallbacks: Map<string, (response: any) => void> =
    new Map();
  private typeMessageCallbacks: Map<string, (response: any) => void> =
    new Map();
  private messageIDCounter: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = -1;
  private reconnectDelay: number = 1000; // Base delay in ms
  private sessionId: string | null = null;

  //Event listener list
  private gameListeners: Array<(data: GameUpdate) => void> = [];

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Private constructor to enforce singleton pattern
    this.sessionId = this.getStoredSessionId();
  }

  /**
   * @method addGameListener
   * @description Add a listener for game updates
   * @param listener Function to be called when a game update is received
   */
  public addGameListener(listener: (update: GameUpdate) => void): void {
    this.gameListeners.push(listener);
    console.log(
      "[WebManager] Added game listener, total listeners:",
      this.gameListeners.length,
    );
  }

  /**
   * @method removeGameListener
   * @description Remove a specific game update listener
   * @param listener The listener function to remove
   */
  public removeGameListener(listener: (update: GameUpdate) => void): void {
    const index = this.gameListeners.indexOf(listener);
    if (index > -1) {
      this.gameListeners.splice(index, 1);
      console.log(
        "[WebManager] Removed game listener, remaining listeners:",
        this.gameListeners.length,
      );
    }
  }

  /**
   * @method clearGameListeners
   * @description Remove all game update listeners
   */
  public clearGameListeners(): void {
    this.gameListeners = [];
    console.log("[WebManager] Cleared all game listeners");
  }

  /**
   * @method getStoredSessionId
   * @description Get the session ID from localStorage if it exists
   * @returns {string|null} The session ID or null if it doesn't exist
   * @private
   */
  private getStoredSessionId(): string | null {
    return localStorage.getItem("session_id");
  }

  /**
   * @method setSessionId
   * @description Store the session ID in localStorage
   * @param {string} sessionId The session ID to store
   */
  public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    localStorage.setItem("session_id", sessionId);
    WebManager.isAuthenticated = true;
  }

  /**
   * @method clearSessionId
   * @description Clear the stored session ID
   */
  public clearSessionId(): void {
    this.sessionId = null;
    localStorage.removeItem("session_id");
  }

  /**
   * @method getSessionId
   * @description Get the current session ID
   * @returns {string|null} The session ID or null if not set
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * @method generateMessageID
   * @description This method is used to automatically generate a message ID
   * This is done with the format action_time_messagenum
   * @param action a string that describes the action being requested by the message
   * @returns a string representing the message ID
   */
  private generateMessageID(action: string): string {
    const now = new Date();
    return action + "_" + now.toISOString() + "_" + this.messageIDCounter++;
  }

  /**
   * @method getInstance
   * @description Get the singleton instance of WebManager
   * @returns {WebManager} The singleton instance
   */
  public static getInstance(): WebManager {
    if (!WebManager.instance) {
      WebManager.instance = new WebManager();
    }
    return WebManager.instance;
  }

  /**
   * @method initiateWebsocketConnection
   * @description This method is used to initiate the websocket connection
   * @returns {Promise<boolean>} A promise that resolves to true if connection was successful
   */
  public async initiateWebsocketConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log("[Connection] Initiating WebSocket connection");

      const serverAddress =
        process.env.REMOTE_SERVER_ADDRESS || "ws://localhost:3000";
      const connectionUrl = serverAddress;

      console.log(`[Connection] Connecting to: ${serverAddress}`);

      this.socket = new WebSocket(connectionUrl);

      this.socket.onopen = async () => {
        console.log(
          "[Connection] WebSocket connection established - clientside",
        );

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;

        // Check if we have a stored session ID for reconnection
        const sessionId = this.getSessionId();
        if (sessionId) {
          console.log(
            `[Connection] Found stored session ID: ${sessionId.substring(0, 8)}...`,
          );

          // Attempt to reconnect with the stored session ID
          console.log(
            "[Connection] Attempting to reconnect with stored session ID",
          );
          const reconnected = await this.attemptReconnect(sessionId);

          if (reconnected) {
            WebManager.isAuthenticated = true;
            console.log(
              "[Connection] Successfully reconnected with existing session",
            );
          } else {
            WebManager.isAuthenticated = false;
            console.log(
              "[Connection] Failed to reconnect with existing session, clearing session ID",
            );
            this.clearSessionId();
          }
        } else {
          console.log("[Connection] No stored session ID found.");
        }

        resolve(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle exact message callbacks
          if (data.messageID) {
            if (this.exactMessageCallbacks.has(data.messageID)) {
              const callback = this.exactMessageCallbacks.get(data.messageID);
              if (callback) {
                callback(data);
                this.exactMessageCallbacks.delete(data.messageID);
              }
            }
            // Handle type-based message callbacks
            if (this.typeMessageCallbacks.has(data.type)) {
              const callback = this.typeMessageCallbacks.get(data.type);
              if (callback) {
                callback(data);
              }
            }
          }
        } catch (error) {
          console.error("[WebSocket] Error processing message:", error);
          return;
        }
      };

      this.socket.onclose = (event) => {
        console.log("[WebSocket] Connection closed", event);
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        resolve(false);
      };

      // Add a timeout for the connection attempt
      setTimeout(() => {
        if (this.socket?.readyState !== WebSocket.OPEN) {
          console.error("[WebSocket] Connection timeout");
          resolve(false);
        }
      }, 5000);
    });
  }

  /**
   * @method isConnected
   * @description Check if the WebSocket is connected
   * @returns {boolean} True if connected, false otherwise
   */
  public isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * @method scheduleReconnect
   * @description Schedule a reconnection attempt with exponential backoff
   * @private
   */
  private scheduleReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts ||
      this.maxReconnectAttempts < 0
    ) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        120000,
      );

      console.log(
        `[WebSocket] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`,
      );

      setTimeout(() => {
        console.log(
          `[WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        );
        this.initiateWebsocketConnection();
      }, delay);
    } else {
      console.error("[WebSocket] Maximum reconnection attempts reached");
    }
  }

  /**
   * @method attemptReconnect
   * @description Attempts to reconnect using a stored session ID
   * @param {string} sessionId The session ID to use for reconnection
   * @returns {Promise<boolean>} A promise that resolves to true if reconnection was successful
   * @private
   */
  private async attemptReconnect(sessionId: string): Promise<boolean> {
    try {
      console.log(
        `[Reconnect] Starting reconnection attempt with session ID: ${sessionId.substring(0, 8)}...`,
      );

      // Create the reconnect message
      const message = {
        type: "reconnect",
        sessionID: sessionId,
      };

      console.log(`[Reconnect] Sending reconnect request.`);

      // Use the standard sendRequest method with a longer timeout for reconnection
      try {
        const response = await this.sendRequest<{
          success: boolean;
          playerID: string;
        }>(message, "reconnect");

        if (response && response.success === true) {
          console.log(`[Reconnect] Reconnection successful`);
          return true;
        } else {
          console.log(
            `[Reconnect] Reconnection failed: Server returned unsuccessful response`,
          );
          return false;
        }
      } catch (error) {
        console.error(`[Reconnect] Reconnection failed:`, error);
        return false;
      }
    } catch (error) {
      console.error("[Reconnect] Error attempting to reconnect:", error);
      return false;
    }
  }

  /**
   * @method createLobby
   * @description Sends a request to the server to create a new lobby
   * @param lobbyID Name of the lobby to create
   * @param playerNum Number of players allowed in the lobby
   * @param levelSize Size of the level
   * @param gridSize Size of the grid
   * @param playerID Unique ID of the player creating the lobby
   * @param allowSpectators whether or not spectators should be allowed
   * @returns Promise that resolves with the result of the lobby creation
   */
  public async createLobby(
    lobbyName: string,
    playerNum: number,
    levelSize: number,
    gridSize: number,
    playerID: string,
    allowSpectators: boolean,
  ): Promise<boolean> {
    try {
      // Create message payload
      const message = {
        type: "create_lobby",
        sessionID: this.getSessionId(),
        parameters: {
          lobbyData: {
            lobbyName: lobbyName,
            playerNum,
            levelSize,
            gridSize,
            allowSpectators,
          },
        },
      };

      // Use the sendRequest method to create the lobby
      const response = await this.sendRequest<{ success: boolean }>(
        message,
        "create_lobby",
      );
      console.log("[WebSocket] Response received: ", response);

      // Return the success status from the response
      return response && response.success === true;
    } catch (error) {
      console.error("[WebSocket] Error creating lobby:", error);
      return false;
    }
  }

  /**
   * @method initiateConnectionIfNotEstablished
   * @description Check if the connection is established, initiate it if it is not
   * @returns {Promise<boolean>} A promise that resolves to true when the connection is established
   */
  public async initiateConnectionIfNotEstablished(): Promise<boolean> {
    // If already connected, return true
    if (this.isConnected()) {
      return true;
    }

    // If connecting, wait for it to complete
    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.isConnected()) {
            resolve(true);
          } else if (
            !this.socket ||
            this.socket.readyState === WebSocket.CLOSED
          ) {
            resolve(this.initiateWebsocketConnection());
          } else {
            setTimeout(checkConnection, 100);
          }
        };

        checkConnection();
      });
    }

    // Otherwise, initiate a new connection
    return this.initiateWebsocketConnection();
  }

  /**
   * @method closeConnection
   * @description Close the WebSocket connection
   */
  public closeConnection(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * @method getLobbyList
   * @description Get a list of lobbies on the server
   * @param playerNum: number of players who can play the game
   * @param levelSize: The number of layers in the tictac
   * @param gridSize: The number of slots in a tictac
   * @param joinedPlayers: The number of players who have joined the lobby (spectators included)
   * @returns Promise<LobbyInfo[]> a promise that resolves to an array of lobbies and their info
   */
  public async getLobbyList(parameters: {
    lobbyID?: string;
    lobbyName?: string;
    playerNum?: number;
    levelSize?: number;
    gridSize?: number;
    joinedPlayers?: number;
    maxListLength?: number;
    lobbyState?: string;
    creator?: string;
  }): Promise<LobbyInfo[]> {
    try {
      let playerID = localStorage.getItem("playerID");
      // Create the message payload
      const message = {
        type: "search_lobby",
        sessionID: this.getSessionId(),
        parameters: {
          lobbyID: parameters.lobbyID,
          lobbyName: parameters.lobbyName,
          playerNum: parameters.playerNum,
          levelSize: parameters.levelSize,
          gridSize: parameters.gridSize,
          creator: parameters.creator,
          lobbyState: parameters.lobbyState,
          joinedPlayers: parameters.joinedPlayers,
          maxListLength: parameters.maxListLength,
        },
      };

      // Use the sendRequest method to get the lobby list
      const response = await this.sendRequest<{
        success: boolean;
        lobbies: any[];
      }>(message, "search_lobby");

      // Parse the response into LobbyInfo objects
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
      console.error("Error getting lobby list:", error);
      return [];
    }
  }

  /**
   * @method sendRequest
   * @description This is the method used by all methods that interact with the server to send requests.
   * @param message the message content being sent
   * @param action the action being taken
   */
  public sendRequest<T = any>(message: any, action: string): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check if WebSocket is connected
      if (!this.isConnected()) {
        console.error(`[${action}] WebSocket connection not established`);
        reject(new Error("WebSocket connection not established"));
        return;
      }

      //Generate a messageID for callbacks
      const messageID = this.generateMessageID(action);

      // Add the messageID to the message if it doesn't have one
      if (!message.messageID) {
        message.messageID = messageID;
      }

      // Add the session ID to the message if available (except for registration)
      if (this.sessionId && action !== "registerPlayer") {
        message.sessionID = this.sessionId;
        console.log(
          `[${action}] Using session ID: ${this.sessionId.substring(0, 8)}...`,
        );
      }

      console.log(
        `[${action}] Registering callback for message ID: ${messageID}`,
      );

      //Register callbacks for the message
      this.exactMessageCallbacks.set(messageID, (response) => {
        // Store the response for future reference
        console.log(
          `[${action}] Received response for message ID ${messageID}:`,
          response,
        );

        if (response.success) {
          console.log(`[${action}] Request successful`);
          // Return the entire response object since it contains all the data we need
          resolve(response as T);
        } else {
          console.error(`[${action}] Failed:`, response.error);
          reject(new Error(response.error || `Failed to ${action}`));
        }
      });

      // Log the message being sent (excluding sensitive data)
      const logMessage = { ...message };
      if (logMessage.sessionID) {
        logMessage.sessionID = `${logMessage.sessionID.substring(0, 8)}...`;
      }
      console.log(`[${action}] Sending message:`, logMessage);

      // Send the message
      this.socket?.send(JSON.stringify(message));

      // Determine timeout based on action type
      const timeout = action === "reconnect" ? 30000 : 10000; // 30 seconds for reconnect, 10 seconds for others
      console.log(
        `[${action}] Message sent, waiting for response (timeout: ${timeout / 1000}s)`,
      );

      // Add a timeout for the response
      setTimeout(() => {
        if (this.exactMessageCallbacks.has(messageID)) {
          console.error(
            `[${action}] Request timed out after ${timeout / 1000} seconds for message ID: ${messageID}`,
          );
          this.exactMessageCallbacks.delete(messageID);
          reject(new Error(`${action} request timed out`));
        }
      }, timeout);
    });
  }

  /**
   * @method checkAndRegisterPlayer
   * @description This method makes a request for a new player to be generated. This allows the
   * client to join game servers when it receives a session id.
   * @param username the username that the player chose
   * @return The sessionID and message.
   */
  public async checkAndRegisterPlayer(
    username: string,
  ): Promise<[string, string]> {
    try {
      const message = {
        type: "register_player",
        parameters: {
          username: username,
          checkUsername: true,
        },
      };

      const response = await this.sendRequest<{
        success: boolean;
        message: string;
        sessionID: string;
      }>(message, "registerPlayer");
      //Store the session ID
      if (response.success && response.sessionID) {
        this.setSessionId(response.sessionID);
        WebManager.isAuthenticated = true;
        console.log("Session ID stored:", response.sessionID);
      }

      // The session ID will be automatically stored by the sendRequest method
      return [response.sessionID ? response.sessionID : "", response.message];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return ["", errorMessage];
    }
  }

  /**
   * @method joinLobby
   * @description This method is used to join a lobby on the server
   * @param lobbyID the ID of the lobby to join
   * @returns Promise<LobbyInfo | null> the lobby info if join was successful, null otherwise
   */
  public async joinLobby(lobbyID: string): Promise<LobbyInfo | null> {
    try {
      const message = {
        type: "join_lobby",
        sessionID: this.getSessionId(),
        parameters: {
          lobbyID: lobbyID,
        },
      };

      const response = await this.sendRequest<{ success: boolean; lobby: any }>(
        message,
        "join_lobby",
      );
      if (response && response.success && response.lobby) {
        //If the response is a success, This means we can begin accepting game updates
        this.registerTypeCallback("game_update", (update) =>
          this.handleGameUpdate(update as GameUpdate),
        );

        // Return the lobby info as a LobbyInfo object
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
      console.error("Error joining lobby:", error);
      return null;
    }
  }

  /**
   * @method makeMove
   * @description Send a move to the server in a game
   * @param lobbyID The ID of the lobby where the game is happening
   * @param position The position of the move (column and row)
   * @returns Promise<boolean> true if the move was successful, false otherwise
   */
  public async makeMove(
    lobbyID: string,
    position: { col: number; row: number },
  ): Promise<boolean> {
    try {
      const message = {
        type: "make_move",
        sessionID: this.getSessionId(),
        parameters: {
          lobbyID,
          position,
        },
      };

      const response = await this.sendRequest<{ success: boolean }>(
        message,
        "make_move",
      );
      return response && response.success === true;
    } catch (error) {
      console.error("[WebSocket] Error making move:", error);
      return false;
    }
  }

  /**
   * @method registerTypeCallback
   * @description Register a callback for messages of a specific type
   * @param type The message type to listen for
   * @param callback The callback function to invoke when a message of the specified type is received
   */
  public registerTypeCallback(
    type: string,
    callback: (response: any) => void,
  ): void {
    this.typeMessageCallbacks.set(type, callback);
  }

  /**
   * @method handleGameUpdate() {
   * @description Handle incoming game update messages and notify listeners
   * @param update The game update data received from the server}
   */
  private handleGameUpdate(update: GameUpdate): void {
    console.log("[Game Update] Received game update:", update);
    // Notify all registered listeners
    console.log(
      "[Game Update] Notifying",
      this.gameListeners.length,
      "listeners",
    );
    this.gameListeners.forEach((listener) => {
      try {
        listener(update);
      } catch (error) {
        console.error("[Game Update] Error in listener:", error);
      }
    });
  }
}
