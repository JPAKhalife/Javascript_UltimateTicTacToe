/**
 * @file ResponseBuilder.ts
 * @description Utility functions for building type-safe responses using shared schemas
 * @author John Khalife
 * @created 2025-12-23
 */

import {
  type BaseResponse,
  type RegisterPlayerResponse,
  type CreateLobbyResponse,
  type SearchLobbyResponse,
  type JoinLobbyResponse,
  type MakeMoveResponse,
  type ReconnectResponse,
  type LobbyInfo,
  type GameStateInfo,
  type PlayerInfo,
  FROM_SERVER_MESSAGE_TYPES,
} from "../../Shared/Contracts/MessageToClientSchema";
import { Player } from "../Database/Player";

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
    playerID: string,
    message: string,
    messageID?: string,
  ): RegisterPlayerResponse {
    return {
      success: true,
      sessionID,
      playerID,
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
    gameState: GameStateInfo,
    message?: string,
    messageID?: string,
  ): JoinLobbyResponse {
    return {
      success: true,
      gameState,
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

  /**\
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
    const game = lobby.getGame();
    return {
      lobbyID: lobby.get("lobbyID"),
      lobbyName: lobby.get("lobbyName"),
      playerNum: lobby.get("playerNum"),
      levelSize: game.get("levelSize"),
      gridSize: game.get("gridSize"),
      playersJoined: lobby.get("playersJoined"),
      creator: lobby.get("creator"),
      lobbyState: lobby.get("lobbyState"),
      allowSpectators: lobby.get("allowSpectators"),
    };
  }

  /**
   * Convert a lobby database object to GameStateInfo schema
   * Includes complete player list, current turn, and optional board state
   * @param lobby The lobby object
   */
  static async lobbyToGameState(lobby: any): Promise<GameStateInfo> {
    const game = lobby.getGame();
    const board = game.getBoard();
    const boardState = await board.getBoardState();
    // Build complete game state info with player list
    const playerList = lobby.getPlayerList();
    const playerIDs = playerList.getItems();

    // Fetch player details (username) for each player in the lobby
    const playerDetails = await Promise.all(
      playerIDs.map(async (id: string) => {
        const player = await Player.getById(id);
        return {
          playerID: id,
          username: player ? player.get("username") : "Unknown",
        };
      })
    );
    // Check if the board is in the initial state (all zeros)
    const isInitialState = boardState.every((cell: number) => cell === 0);

    return {
      type: FROM_SERVER_MESSAGE_TYPES.GAME_INFO,
      lobbyID: lobby.get("lobbyID"),
      lobbyName: lobby.get("lobbyName"),
      playerNum: lobby.get("playerNum"),
      levelSize: game.get("levelSize"),
      gridSize: game.get("gridSize"),
      lobbyState: lobby.get("lobbyState"),
      allowSpectators: lobby.get("allowSpectators"),
      playerList: playerDetails,
      currentTurn: game.get("currentPlayerIndex"),
      board: isInitialState ? undefined : boardState,
    };
  }
}
