/**
 * @file WebsocketRequestHandler.ts
 * @description This is the file that processes websocket requests
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import { Lobby, CreateLobbyData } from "../Database/Lobby/Lobby";
import { Player } from "../Database/Player";
import { DatabaseManager } from "../Database/DatabaseManager";
import {
  newConnection,
  registerPlayerConnection,
  getPlayerID,
  removeConnection,
  getWebsocketObject,
} from "../Database/ClientConnections";
import { URL } from "url";
import {
  LobbyCreateRequest,
  LobbySearchRequest,
  FROM_CLIENT_MESSAGE_TYPES,
  RegisterRequest,
  ReconnectRequest,
  BaseRequest,
  AuthenticatedRequest,
  LobbyJoinRequest,
} from "../../Shared/Contracts/MessageToServerSchema";
import Session from "../Database/Session";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../Contants";
import { FROM_SERVER_MESSAGE_TYPES } from "../../Shared/Contracts/MessageToClientSchema";
const { v4: uuidv4 } = require("uuid");

type ReturnMessage = Record<string, any>;

// Type definition for message handler functions
type MessageHandler = (
  data: any,
  sessionData?: any,
) => Promise<object | ReturnMessage>;

// Type definition for message handlers map
type MessageHandlers = {
  [K in FROM_CLIENT_MESSAGE_TYPES]: MessageHandler;
};

//This map is for connectionID to ws object.

/**
 * @function handleWebsocketRequest
 * @description Handles WebSocket connections and requests
 * @param ws WebSocket object
 * @param req HTTP request object
 * @param redis Redis client for regular operations (non-subscriber)
 */
export async function handleWebsocketRequest(ws: any, req: any) {
  console.log(
    `[WebSocket] Connection established from client, IP: ${req.connection.remoteAddress}`,
  );

  // Assign a unique ID to the websocket connection
  if (!ws.id) {
    ws.id = uuidv4();
    newConnection(ws, ws.id);
    console.log(`[WebSocket] Assigning connection ID: ${ws.id}`);
  }

  // Handle cleanup when the connection is closed
  ws.on("close", () => {
    console.log(`[WebSocket] Connection ${ws.id} closed`);
    removeConnection(ws.id);
  });

  // Message handler map
  const messageHandlers: MessageHandlers = {
    [FROM_CLIENT_MESSAGE_TYPES.RECONNECT]: async (data: any) => {
      const validation = ReconnectRequest.safeParse(data);
      return validation.success
        ? handleReconnect(ws, validation.data, req)
        : createErrorResponse(data.type, ERROR_MESSAGES.INVALID_SCHEMA);
    },
    [FROM_CLIENT_MESSAGE_TYPES.REGISTER_PLAYER]: async (data: any) => {
      const validation = RegisterRequest.safeParse(data);
      return validation.success
        ? handleRegisterPlayer(ws, validation.data, req)
        : createErrorResponse(data.type, ERROR_MESSAGES.INVALID_SCHEMA);
    },
    [FROM_CLIENT_MESSAGE_TYPES.CREATE_LOBBY]: async (
      data: any,
      sessionData: any,
    ) => {
      const validation = LobbyCreateRequest.safeParse(data);
      return validation.success
        ? handleCreateLobby(ws, validation.data, sessionData.get("playerID"))
        : createErrorResponse(data.type, ERROR_MESSAGES.INVALID_SCHEMA);
    },
    [FROM_CLIENT_MESSAGE_TYPES.SEARCH_LOBBY]: async (
      data: any,
      sessionData: any,
    ) => {
      const validation = LobbySearchRequest.safeParse(data);
      return validation.success
        ? handleSearchLobbies(ws, validation.data, sessionData.get("playerID"))
        : createErrorResponse(data.type, ERROR_MESSAGES.INVALID_SCHEMA);
    },
    [FROM_CLIENT_MESSAGE_TYPES.JOIN_LOBBY]: async (
      data: any,
      sessionData: any,
    ) => {
      return handleJoinLobby(ws, data, sessionData.get("playerID"));
    },
    [FROM_CLIENT_MESSAGE_TYPES.LEAVE_LOBBY]: async (
      data: any,
      sessionData: any,
    ) => {
      return createErrorResponse(data.type, ERROR_MESSAGES.INTERNAL_ERROR); // Not implemented yet
    },
    [FROM_CLIENT_MESSAGE_TYPES.MAKE_MOVE]: async (
      data: any,
      sessionData: any,
    ) => {
      return createErrorResponse(data.type, ERROR_MESSAGES.INTERNAL_ERROR); // Not implemented yet
    },
    [FROM_CLIENT_MESSAGE_TYPES.NONE]: async (data: any, sessionData: any) => {
      return createErrorResponse(data.type, ERROR_MESSAGES.INTERNAL_ERROR)
    }
  };

  // Handle incoming messages from the client
  ws.on("message", async (message: any) => {
    let returnMessage: ReturnMessage = {};
    let messageID: string | null = null;

    try {
      const data = JSON.parse(message.toString());
      messageID = data.messageID;

      // Validate base request schema
      if (!BaseRequest.safeParse(data).success) {
        returnMessage = createErrorResponse(data.type, ERROR_MESSAGES.INVALID_SCHEMA);
      } else {
        // Check if the message type is valid
        if (!Object.values(FROM_CLIENT_MESSAGE_TYPES).includes(data.type)) {
          returnMessage = createErrorResponse(data.type, ERROR_MESSAGES.INVALID_SCHEMA);
        } else {
          const handler =
            messageHandlers[data.type as FROM_CLIENT_MESSAGE_TYPES];

          if (!handler) {
            returnMessage = createErrorResponse(data.type, ERROR_MESSAGES.INVALID_SCHEMA);
          } else if (
            data.type !== FROM_CLIENT_MESSAGE_TYPES.REGISTER_PLAYER &&
            data.type !== FROM_CLIENT_MESSAGE_TYPES.RECONNECT
          ) {
            console.debug("[WebsocketRequestHandler]: Authenticated message detected");
            // Handle authenticated requests
            const sessionData = data.sessionID
              ? await Session.validateSession(data.sessionID)
              : null;

            if (!sessionData || sessionData.get("connectionID") !== ws.id) {
              returnMessage = createErrorResponse(data.type, ERROR_MESSAGES.TOKEN_INVALID);
            } else {
              await Session.validateSession(data.sessionID);
              returnMessage = await handler(data, sessionData);
            }
          } else {
            console.debug("[WebsocketRequestHandler]: Non-authenticated message detected");
            // Handle non-authenticated requests
            returnMessage = await handler(data);
          }
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error processing message:", error);
      returnMessage = createErrorResponse(FROM_CLIENT_MESSAGE_TYPES.NONE, ERROR_MESSAGES.INTERNAL_ERROR);
    }

    if (messageID) returnMessage.messageID = messageID;
    sendResponseToClient(ws, returnMessage, messageID);
  });
}

function createErrorResponse(dataType: FROM_CLIENT_MESSAGE_TYPES, error: string): ReturnMessage {
  console.info("[WebSocketRequestHandler]: Sending error message of type + " + dataType + ": " + error);
  return { success: false, error };
}

/**
 * @function sendResponseToClient
 * @description Sends a response back to the client, with fallback mechanisms
 * @param ws WebSocket connection
 * @param returnMessage The message to send
 * @param messageID The message ID for logging
 */
function sendResponseToClient(
  ws: any,
  returnMessage: ReturnMessage,
  messageID: string | null,
) {
  // Log the response being sent back to the client
  console.log(
    `[WebSocket] Preparing to send response for message ID ${messageID}:`,
    returnMessage,
  );

  // Stringify the response
  const responseString = JSON.stringify(returnMessage);
  console.log(`[WebSocket] Response size: ${responseString.length} bytes`);

  try {
    // Check WebSocket state
    console.log(`[WebSocket] Direct WebSocket readyState: ${ws.readyState}`);

    if (ws.readyState === 1) {
      // 1 = OPEN
      ws.send(responseString);
      console.log(
        `[WebSocket] Response sent successfully using direct WebSocket`,
      );
      return;
    } else {
      console.warn(
        `[WebSocket] Direct WebSocket not in OPEN state (state: ${ws.readyState})`,
      );
    }
  } catch (error) {
    console.error(`[WebSocket] Error sending with direct WebSocket:`, error);
  }

  // If we get here, attempt failed
  console.error(`[WebSocket] Failed to send response - all attempts failed`);
}

/**
 * @function handleSearchLobbies
 * @description Handles the searchLobbies message from the client
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Search request data
 * @param playerID Player ID from the validated session
 * @returns Promise resolving to response object
 */
async function handleSearchLobbies(
  ws: any,
  data: LobbySearchRequest,
  playerID: string,
): Promise<object> {
  try {
    const params = data.parameters || {};
    // Get all lobbies and filter them
    // Get all active lobbies
    const lobbyList = await DatabaseManager.getInstance()
      .getRegularClient()
      .lrange("LobbyList", 0, -1);
    const allLobbies = await Promise.all(
      lobbyList.map(async (id) => {
        const lobby = await Lobby.getById(id);
        return lobby;
      }),
    ).then((lobbies) => lobbies.filter((lobby) => lobby !== null));
    const lobbySearchResults = allLobbies
      .filter((lobby) => {
        if (params.playerNum && lobby.get("playerNum") !== params.playerNum)
          return false;
        if (params.levelSize && lobby.get("levelSize") !== params.levelSize)
          return false;
        if (params.gridSize && lobby.get("gridSize") !== params.gridSize)
          return false;
        if (
          params.joinedPlayers &&
          lobby.get("playersJoined") !== params.joinedPlayers
        )
          return false;
        if (params.creator && lobby.get("creator") !== params.creator)
          return false;
        if (params.lobbyState && lobby.get("lobbyState") !== params.lobbyState)
          return false;
        if (
          params.allowSpectators !== undefined &&
          lobby.get("allowSpectators") !== params.allowSpectators
        )
          return false;
        return true;
      })
      .slice(0, params.maxListLength || params.searchListLength || 10);
    console.log(`Found ${lobbySearchResults.length} matching lobbies`);

    // Log the first lobby for debugging if any exist
    if (lobbySearchResults.length > 0) {
      console.log(
        "First lobby sample:",
        JSON.stringify(lobbySearchResults[0]).substring(0, 200) + "...",
      );
    }

    // Convert each lobby to its JSON representation and await all promises
    const lobbies = await Promise.all(
      lobbySearchResults.map((lobby) => lobby.toJSON()),
    );

    // Log the size of the lobbies array
    console.log("Lobbies array size:", JSON.stringify(lobbies).length, "bytes");
    return {
      success: true,
      lobbies: lobbies,
      count: lobbies.length,
    };
  } catch (error) {
    // Provide more detailed error information
    console.error(
      "Error searching lobbies:",
      error instanceof Error ? error.stack : error,
    );

    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * @function handleCreateLobby
 * @description Handles the createLobby message from the client
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Lobby creation request data
 * @param playerID Player ID from the validated session
 * @returns Promise resolving to response object
 */
async function handleCreateLobby(
  ws: any,
  data: LobbyCreateRequest,
  playerID: string,
): Promise<object> {
  try {
    const params = data.parameters || {};
    const lobbyData = params.lobbyData || {};

    // Create a new lobby with the provided data
    const newLobby = await Lobby.create(
      {
        lobbyName: lobbyData.lobbyName,
        playerNum: lobbyData.playerNum,
        levelSize: lobbyData.levelSize,
        gridSize: lobbyData.gridSize,
        allowSpectators: lobbyData.allowSpectators,
      },
      playerID,
    );
    console.log(`Lobby ${params.lobbyData.lobbyName} created successfully`);

    // Send response back to client
    return {
      success: true,
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      lobby: await newLobby.toJSON(),
    };
  } catch (error) {
    console.error("Error creating lobby:", error);
    // Check if this is the lobby name exists error
    if (
      error instanceof Error &&
      error.message === ERROR_MESSAGES.LOBBY_NAME_EXISTS
    ) {
      return {
        success: false,
        error: ERROR_MESSAGES.LOBBY_NAME_EXISTS,
      };
    }
    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * @function handleRegisterPlayer
 * @description Handles the registration of a player
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Player registration request data
 * @param req HTTP request object
 * @returns Promise resolving to response object
 */
async function handleRegisterPlayer(
  ws: any,
  data: RegisterRequest,
  req: any,
): Promise<object> {
  const redis = DatabaseManager.getInstance().getRegularClient();
  const params = data.parameters || {};
  const username = params.username;

  if (!username) {
    return {
      success: false,
      message: ERROR_MESSAGES.INVALID_USERNAME,
    };
  }

  console.debug(`[WebsocketRequestHandler] Checking if player ${username} exists`);

  // Check if the user is already registered.
  const playerID = await getPlayerID(ws.id);
  if (playerID) {
    console.debug(`[WebsocketRequestHandler] player ${username} is already registered`);
    const player = await Player.getById(playerID);
    if (player) {
      console.debug('The player ' + player.get("username") + ' has a session id' + player.get("sessionID") + 'and a playerID ' + player.get('playerID'))

    }
    return {
      success: false,
      message: ERROR_MESSAGES.CONCURRENT_LOGIN,
    };
  }

  try {
    let newPlayer = await Player.create(username);
    if (newPlayer != null && newPlayer != undefined) {
      const playerID = newPlayer.get("playerID");

      // Register the player with the connection
      await registerPlayerConnection(ws.id, playerID);

      // Create a session for the player
      const { token } = await Session.create(playerID, ws.id, req);
      console.debug("[WebsocketRequestHandler] Successfully registered player", username);
      return {
        success: true,
        message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
        sessionID: token,
      };
    }
  } catch (error) {
    console.debug("[WebsocketRequestHandler] There was an error registering the player: ", error);
    return {
      success: false,
      message: ERROR_MESSAGES.REGISTRATION_FAILED,
    };
  }
  return {
    success: true,
    message: ERROR_MESSAGES.USERNAME_EXISTS,
  };
}

/**
 * @function handleReconnect
 * @description Handles the reconnection of a client using an existing session ID
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Reconnect request data
 * @param req HTTP request object
 * @returns Promise resolving to response object
 */
async function handleReconnect(
  ws: any,
  data: ReconnectRequest,
  req: any,
): Promise<object> {
  const redis = DatabaseManager.getInstance().getRegularClient();
  try {
    console.log(
      `[Reconnect] Starting reconnection process for connection ID: ${ws.id}`,
    );
    console.log(
      `[Reconnect] Session ID provided: ${data.sessionID}...`,
    );

    // Validate the session
    console.log(`[Reconnect] Validating session token`);
    const startValidation = Date.now();
    const sessionData = await Session.validateSession(data.sessionID);
    const validationTime = Date.now() - startValidation;
    console.log(`[Reconnect] Session validation took ${validationTime}ms`);

    if (!sessionData) {
      console.log(`[Reconnect] Session validation failed - invalid token`);
      return {
        success: false,
        error: ERROR_MESSAGES.TOKEN_INVALID,
      };
    }

    console.log(
      `[Reconnect] Session validation successful for player ID: ${sessionData.get("playerID")}`,
    );

    // Get the current connection ID associated with the session
    const currentConnectionID = sessionData.get("connectionID");
    console.log(
      `[Reconnect] Current connection ID from session: ${currentConnectionID}`,
    );

    // Check if the current connection is still active
    console.log(`[Reconnect] Checking if current connection is still active`);
    const startConnectionCheck = Date.now();
    const isActive = await Session.isConnectionActive(currentConnectionID);
    const connectionCheckTime = Date.now() - startConnectionCheck;
    console.log(
      `[Reconnect] Connection check took ${connectionCheckTime}ms, result: ${isActive ? "active" : "inactive"}`,
    );

    if (isActive) {
      console.log(
        `[Reconnect] Current connection is still active - concurrent login not allowed`,
      );
      return {
        success: false,
        error: ERROR_MESSAGES.CONCURRENT_LOGIN,
      };
    }

    // Ensure the WebSocket object is properly stored in the activeWebsockets map
    console.log(
      `[Reconnect] Re-registering WebSocket object in activeWebsockets map`,
    );
    newConnection(ws, ws.id);

    // Update the session with the new connection ID
    console.log(
      `[Reconnect] Updating session with new connection ID: ${ws.id}`,
    );
    const startUpdate = Date.now();
    await sessionData.updateConnectionID(ws.id);
    const updateTime = Date.now() - startUpdate;
    console.debug(`[Reconnect] Session updated in ${updateTime}ms`);
    // Register the player with the connection
    console.info(
      `[Reconnect] Registering player ID ${sessionData.get("playerID")} with connection ID ${ws.id}`,
    );
    const startRegistration = Date.now();
    await registerPlayerConnection(ws.id, sessionData.get("playerID"));
    const registrationTime = Date.now() - startRegistration;
    console.debug(`[Reconnect] Player registration took ${registrationTime}ms`);

    // Verify the WebSocket is still valid
    console.debug(`[Reconnect] Verifying WebSocket state: ${ws.readyState}`);
    if (ws.readyState !== 1) {
      // 1 = OPEN
      console.warn(
        `[Reconnect] WebSocket not in OPEN state (state: ${ws.readyState})`,
      );
    }

    // Create a direct response to ensure it's sent immediately
    const directResponse = {
      success: true,
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      playerID: sessionData.get("playerID"),
      messageID: data.messageID,
    };

    // Try to send the response directly
    console.log(`[Reconnect] Attempting to send response directly`);
    try {
      const responseString = JSON.stringify(directResponse);
      ws.send(responseString);
      console.log(`[Reconnect] Direct response sent successfully`);
    } catch (sendError) {
      console.error(`[Reconnect] Error sending direct response:`, sendError);
    }

    // Return success for the normal response flow as well
    console.log(
      `[Reconnect] Reconnection successful for player ID: ${sessionData.get("playerID")}`,
    );
    return {
      success: true,
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      playerID: sessionData.get("playerID"),
    };
  } catch (error) {
    console.error("[Reconnect] Error handling reconnect:", error);
    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * @function handleJoinLobby
 * @description Handles the joinLobby message from the client
 * @param ws WebSocket connection
 * @param redis Redis client for regular operations
 * @param data Join lobby request data
 */
async function handleJoinLobby(
  ws: any,
  data: LobbyJoinRequest,
  playerID: string,
): Promise<object> {
  const redis = DatabaseManager.getInstance().getRegularClient();
  // The join lobby command essentially signals to the server that it is time to start sending update packets and to add the
  // Player as a subscriber to the game.

  /**
   * The following outcomes are possible:
   * 1. Failure. This can happen if:
   * - The lobby does not exist.
   * - The lobby is full.
   * - The player is already in a lobby.
   * 2. Success. The player is added to the lobby and starts receiving game updates.
   *
   */

  try {
    const params = data.parameters || {};
    const lobbyID = params.lobbyID;

    if (!lobbyID) {
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_REQUEST_FORMAT,
      };
    }

    console.log(`Player ${playerID} attempting to join lobby ${lobbyID}`);

    // Fetch the lobby
    const lobby = await Lobby.getById(lobbyID);
    if (!lobby) {
      return {
        success: false,
        error: ERROR_MESSAGES.LOBBY_NOT_FOUND,
      };
    }
    // Add player to lobby
    try {
      await lobby.addPlayer(playerID);
    } catch (error) {
      console.warn("[joinLobby] ", error)
      return {
        success: false,
        error: ERROR_MESSAGES.LOBBY_JOIN_FAILED,
      };
    }

    console.info(`[joinLobby] Player ${playerID} joined lobby ${lobbyID}`);

    //Now, after joining the lobby, we need to kickoff a process that checks whether the game is ready to start.

    // All we need to return the player is whether or not the joining was a success, so they can move on to the loading screen.
    // They will receive another message when the game actually starts.
    return {
      success: true,
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      lobby: await lobby.toJSON(),
    };
  } catch (error) {
    console.error("Error joining lobby:", error);
    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}
