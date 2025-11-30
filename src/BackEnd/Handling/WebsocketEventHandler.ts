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

// This file will implement a singleton class, due to the websocket object needing to be persisted.

export class WebsocketHandler {
  private static instance: WebsocketHandler;

  private constructor() {}

  public static getInstance(): WebsocketHandler {
    if (!WebsocketHandler.instance) {
      WebsocketHandler.instance = new WebsocketHandler();
    }
    return WebsocketHandler.instance;
  }
}
