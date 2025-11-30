/**
 * @file WebsocketEventHandler.ts
 * @description This file is responsible for sending websocket events to clients.
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import { WebSocket } from "ws";
import { FROM_SERVER_MESSAGE_TYPES } from "../Contracts/MessageToClientSchema";
import { getWebsocketObject } from "../Database/ClientConnections";

/**
 * @function sendMessageToClient
 * @description Sends a message to a connected client via WebSocket
 * @param 
 */
export function sendMessageToClient(connectionID: string, message: any) {
  const ws = getWebsocketObject(connectionID);
  ws.send(JSON.stringify(message));
}