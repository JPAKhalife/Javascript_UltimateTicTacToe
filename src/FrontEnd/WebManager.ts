/**
 * @file WebManager.ts
 * @description This file is responsible for the creation of the WebManager class, for managing the client's websocket connection
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

// Import shared types
import type { LobbyInfo } from "../Shared/Contracts/MessageToClientSchema";

/**
 * Re-export LobbyInfo for backward compatibility
 */
export type { LobbyInfo };

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
    console.info(
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
      console.info(
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
    console.info("[WebManager] Cleared all game listeners");
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
      console.info("[Connection] Initiating WebSocket connection");

      const serverAddress =
        process.env.REMOTE_SERVER_ADDRESS || "ws://localhost:3000";
      const connectionUrl = serverAddress;

      console.info(`[Connection] Connecting to: ${serverAddress}`);

      this.socket = new WebSocket(connectionUrl);

      this.socket.onopen = async () => {
        console.info(
          "[Connection] WebSocket connection established - clientside",
        );

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;

        // Check if we have a stored session ID for reconnection
        const sessionId = this.getSessionId();
        if (sessionId) {
          console.info(
            `[Connection] Found stored session ID: ${sessionId.substring(0, 8)}...`,
          );

          // Attempt to reconnect with the stored session ID
          console.info(
            "[Connection] Attempting to reconnect with stored session ID",
          );
          const reconnected = await this.attemptReconnect(sessionId);

          if (reconnected) {
            WebManager.isAuthenticated = true;
            console.info(
              "[Connection] Successfully reconnected with existing session",
            );
          } else {
            WebManager.isAuthenticated = false;
            console.info(
              "[Connection] Failed to reconnect with existing session, clearing session ID",
            );
            this.clearSessionId();
          }
        } else {
          console.info("[Connection] No stored session ID found.");
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
        console.info("[WebSocket] Connection closed", event);
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

      console.info(
        `[WebSocket] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`,
      );

      setTimeout(() => {
        console.info(
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
      console.info(
        `[Reconnect] Starting reconnection attempt with session ID: ${sessionId.substring(0, 8)}...`,
      );

      // Create the reconnect message
      const message = {
        type: "reconnect",
        sessionID: sessionId,
      };

      console.info(`[Reconnect] Sending reconnect request.`);

      // Use the standard sendRequest method with a longer timeout for reconnection
      try {
        const response = await this.sendRequest<{
          success: boolean;
          playerID: string;
        }>(message, "reconnect");

        if (response && response.success === true) {
          console.info(`[Reconnect] Reconnection successful`);
          return true;
        } else {
          console.info(
            `[Reconnect] Reconnection failed: Server returned unsuccessful response`,
          );
          return false;
        }
      } catch (error) {
        console.warn(`[Reconnect] Reconnection failed:`, error);
        return false;
      }
    } catch (error) {
      console.warn("[Reconnect] Error attempting to reconnect:", error);
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
        console.info(
          `[${action}] Using session ID: ${this.sessionId}...`,
        );
      }

      console.info(
        `[${action}] Registering callback for message ID: ${messageID}`,
      );

      //Register callbacks for the message
      this.exactMessageCallbacks.set(messageID, (response) => {
        // Store the response for future reference
        console.info(
          `[${action}] Received response for message ID ${messageID}:`,
          response,
        );

        if (response.success) {
          console.info(`[${action}] Request successful`);
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
      console.info(`[${action}] Sending message:`, logMessage);

      // Send the message
      this.socket?.send(JSON.stringify(message));

      // Determine timeout based on action type
      const timeout = action === "reconnect" ? 30000 : 10000; // 30 seconds for reconnect, 10 seconds for others
      console.info(
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
   * @method handleGameUpdate
   * @description Handle incoming game update messages and notify listeners
   * @param update The game update data received from the server
   */
  public handleGameUpdate(update: GameUpdate): void {
    console.info("[Game Update] Received game update:", update);
    // Notify all registered listeners
    console.info(
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
