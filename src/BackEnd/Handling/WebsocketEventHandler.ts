/**
 * @file WebsocketEventHandler.ts
 * @description This file is responsible for sending websocket events to clients.
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import { WebSocket } from "ws";
import { FROM_SERVER_MESSAGE_TYPES } from "../../Shared/Contracts/MessageToClientSchema";
import { getWebsocketObject } from "../Database/ClientConnections";

/**
 * @function sendMessageToClient
 * @description Sends a message to a connected client via WebSocket
 * @param connectionID - The connection ID of the client
 * @param message - The message to send
 */
export function sendMessageToClient(connectionID: string, message: any) {
  try {
    const ws = getWebsocketObject(connectionID);

    if (!ws) {
      console.error(`[WebsocketEventHandler] No WebSocket found for connection ${connectionID}`);
      return;
    }

    // Check WebSocket readyState (1 = OPEN)
    if (ws.readyState !== 1) {
      console.error(`[WebsocketEventHandler] WebSocket not in OPEN state for connection ${connectionID}, readyState: ${ws.readyState}`);
      return;
    }

    const messageStr = JSON.stringify(message);
    console.info(`[WebsocketEventHandler] Sending message to connection ${connectionID}, type: ${message.type || 'unknown'}, size: ${messageStr.length} bytes`);

    ws.send(messageStr);

    console.info(`[WebsocketEventHandler] Message sent successfully to connection ${connectionID}`);
  } catch (error) {
    console.error(`[WebsocketEventHandler] Error sending message to connection ${connectionID}:`, error);
    console.error(`[WebsocketEventHandler] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
  }
}