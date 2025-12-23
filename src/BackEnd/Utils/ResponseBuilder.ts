/**
 * @file ResponseBuilder.ts
 * @description Utility functions for building type-safe responses using shared schemas
 * @author John Khalife
 * @created 2025-12-23
 */

import type {
  BaseResponse,
  RegisterPlayerResponse,
  CreateLobbyResponse,
  SearchLobbyResponse,
  JoinLobbyResponse,
  MakeMoveResponse,
  ReconnectResponse,
  LobbyInfo,
} from "../../Shared/Contracts/MessageToClientSchema";

/**
 * ResponseBuilder class for creating type-safe server responses
 */
export class ResponseBuilder {
  /**
   * Create a base error response
   */
  static error(error: string, messageID?: string, type?: string): BaseResponse {
    return {
      success: false,
      error,
      messageID,
      type,
    };
  }

  /**
   * Create a player registration response
   */
  static registerPlayer(
    sessionID: string,
    message: string,
    messageID?: string,
  ): RegisterPlayerResponse {
    return {
      success: true,
      sessionID,
      message,
      messageID,
    };
  }

  /**
   * Create a lobby creation response
   */
  static createLobby(
    lobbyID: string,
    messageID?: string,
  ): CreateLobbyResponse {
    return {
      success: true,
      lobbyID,
      messageID,
    };
  }

  /**
   * Create a lobby search response
   */
  static searchLobbies(
    lobbies: LobbyInfo[],
    messageID?: string,
  ): SearchLobbyResponse {
    return {
      success: true,
      lobbies,
      messageID,
    };
  }

  /**
   * Create a join lobby response
   */
  static joinLobby(
    lobby: LobbyInfo,
    message?: string,
    messageID?: string,
  ): JoinLobbyResponse {
    return {
      success: true,
      lobby,
      message,
      messageID,
    };
  }

  /**
   * Create a make move response
   */
  static makeMove(messageID?: string): MakeMoveResponse {
    return {
      success: true,
      messageID,
    };
  }

  /**
   * Create a reconnect response
   */
  static reconnect(
    playerID: string,
    message?: string,
    messageID?: string,
  ): ReconnectResponse {
    return {
      success: true,
      playerID,
      message,
      messageID,
    };
  }

  /**
   * Convert a lobby database object to LobbyInfo schema
   */
  static lobbyToInfo(lobby: any): LobbyInfo {
    return {
      lobbyID: lobby.get("lobbyID"),
      lobbyName: lobby.get("lobbyName"),
      playerNum: lobby.get("playerNum"),
      levelSize: lobby.get("levelSize"),
      gridSize: lobby.get("gridSize"),
      playersJoined: lobby.get("playersJoined"),
      creator: lobby.get("creator"),
      lobbyState: lobby.get("lobbyState"),
      allowSpectators: lobby.get("allowSpectators"),
    };
  }
}
