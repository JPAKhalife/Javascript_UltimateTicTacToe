/**
 * @file ServerRedisGameEventHandler.ts
 * @description This file is responsible for handling communication between webservers via Redis Pub/Sub
 * Now uses RedisEventManager for callback-based subscriptions
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-12-27
 */

import { RedisEventManager } from "../Database/RedisEventManager";
import { FROM_SERVER_MESSAGE_TYPES } from "../../Shared/Contracts/MessageToClientSchema";
import { INTERNAL_MESSAGE_TYPES, LobbyStateChangedMessage } from "../../Shared/Contracts/ServerInternalMessageSchema";
import { sendMessageToClient } from "./WebsocketEventHandler";
import { getConnectionID } from "../Database/ClientConnections";
import { Lobby } from "../Database/Lobby/Lobby";
import { GAME_STATES } from "../Contants";

// Track which players are subscribed to which lobbies for this server
const activeSubscriptions: Record<string, string[]> = {};

// Track callback references for cleanup
const lobbyCallbacks: Map<string, (channel: string, message: string) => Promise<void>> = new Map();

/**
 * @function subscribeToLobby
 * @description Subscribes to a specific lobby channel for inter-server communication
 * @param lobbyID - The ID of the lobby to subscribe to
 * @param playerID - The ID of the player subscribing
 * @return void
 */
export async function subscribeToLobby(lobbyID: string, playerID: string) {
    const channel = `lobby:${lobbyID}`;

    // Check if we are already subscribed
    if (activeSubscriptions[lobbyID] && activeSubscriptions[lobbyID].includes(playerID)) {
        console.info(`[ServerRedisGameEventHandler] Player ${playerID} already subscribed to lobby: ${lobbyID}`);
        return;
    }

    // If this is the first subscription to this lobby, register the callback
    if (!activeSubscriptions[lobbyID] || activeSubscriptions[lobbyID].length === 0) {
        // Create the callback for this lobby
        const callback = async (_channel: string, message: string) => {
            await handleReceiveLobbyMessage(lobbyID, JSON.parse(message));
        };

        // Store the callback reference for cleanup
        lobbyCallbacks.set(lobbyID, callback);

        // Subscribe to the Redis channel with the callback
        await RedisEventManager.subscribeToChannel(channel, callback);
        console.info(`[ServerRedisGameEventHandler] Subscribed to lobby channel: ${channel}`);
    }

    // Track the player subscription
    if (!activeSubscriptions[lobbyID]) {
        activeSubscriptions[lobbyID] = [];
    }
    activeSubscriptions[lobbyID].push(playerID);
    console.info(`[ServerRedisGameEventHandler] Player ${playerID} subscribed to lobby: ${lobbyID}`);
}

/**
 * @function unsubscribeFromLobby
 * @description Unsubscribes from a specific lobby channel for inter-server communication
 * @param lobbyID - The ID of the lobby to unsubscribe from
 * @param playerID - The ID of the player unsubscribing
 */
export async function unsubscribeFromLobby(lobbyID: string, playerID: string = "") {
    const channel = `lobby:${lobbyID}`;

    if (!activeSubscriptions[lobbyID]) {
        console.info(`[ServerRedisGameEventHandler] No active subscriptions for lobby: ${lobbyID}`);
        return;
    }

    // Remove the playerID from the activeSubscriptions
    activeSubscriptions[lobbyID] = activeSubscriptions[lobbyID].filter(id => id !== playerID);
    console.info(`[ServerRedisGameEventHandler] Player ${playerID} unsubscribed from lobby: ${lobbyID}`);

    // If no more players are subscribed, unsubscribe from Redis
    if (activeSubscriptions[lobbyID].length === 0) {
        const callback = lobbyCallbacks.get(lobbyID);
        if (callback) {
            await RedisEventManager.unsubscribeFromChannel(channel, callback);
            lobbyCallbacks.delete(lobbyID);
            console.info(`[ServerRedisGameEventHandler] Unsubscribed from lobby channel: ${channel}`);
        }
        delete activeSubscriptions[lobbyID];
    }
}

/**
 * @function publishToLobby
 * @description Publishes a message to a specific lobby channel for inter-server communication
 * @param lobbyID - The ID of the lobby to publish to
 * @param message - The message to publish
 */
export async function publishToLobby(lobbyID: string, message: any) {
    const channel = `lobby:${lobbyID}`;
    try {
        await RedisEventManager.publish(channel, message);
        console.info(`[ServerRedisGameEventHandler] Published message to lobby: ${lobbyID}, type: ${message.type || 'unknown'}`);
    } catch (error) {
        console.error(`[ServerRedisGameEventHandler] Error publishing to lobby ${lobbyID}:`, error);
    }
}

/**
 * @function handleReceiveLobbyMessage
 * @description Call back that handles when receiving an event for a specific lobby
 * Distinguishes between internal server messages and client-forwarded messages
 * @param lobbyID
 * @param message
 */
export async function handleReceiveLobbyMessage(lobbyID: string, message: any) {
    //First check to see if there are actually any players subbed (just in case of lingering subscription)
    if (!activeSubscriptions[lobbyID] || activeSubscriptions[lobbyID].length <= 0) {
        console.info(`[ServerRedisGameEventHandler] No active subscriptions for lobby ${lobbyID}, unsubscribing`);
        unsubscribeFromLobby(lobbyID);
        return;
    }

    // Check if this is an internal server message that should NOT be forwarded to clients
    const isInternalMessage = Object.values(INTERNAL_MESSAGE_TYPES).includes(message.type);
    if (isInternalMessage) {
        // Handle internal server messages (not forwarded to clients)
        console.info(`[ServerRedisGameEventHandler] Received internal message type: ${message.type} for lobby ${lobbyID}`);
        await handleInternalMessage(lobbyID, message);
        return;
    }

    // Message should be forwarded to clients
    console.info(`[ServerRedisGameEventHandler] Forwarding message to ${activeSubscriptions[lobbyID].length} players in lobby ${lobbyID}`);

    //Iterate through every single player that has subscribed to this lobby
    for (const playerID of activeSubscriptions[lobbyID]) {
        const connectionID = await getConnectionID(playerID);
        if (connectionID != null) {
            console.info(`[ServerRedisGameEventHandler] Sending message to player ${playerID} (connection ${connectionID})`);
            sendMessageToClient(connectionID, message);
        } else {
            console.warn(`[ServerRedisGameEventHandler] No connection found for player ${playerID}`);
        }
    }
}

/**
 * @function handleInternalMessage
 * @description Handles internal server-only messages that should not be forwarded to clients
 * @param lobbyID - The ID of the lobby
 * @param message - The internal message to handle
 */
async function handleInternalMessage(lobbyID: string, message: any): Promise<void> {
    switch (message.type) {
        case INTERNAL_MESSAGE_TYPES.LOBBY_STATE_CHANGED:
            handleLobbyStateChanged(lobbyID, message);
            break;
        default:
            console.warn(`[ServerRedisGameEventHandler] Unknown internal message type: ${message.type}`);
    }
}

/**
 * @function handleLobbyStateChanged
 * @description This funcion specifically handles the LOBBY_STATE_CHANGED internal server message
 * @param message
 */
async function handleLobbyStateChanged(lobbyID: string, message: LobbyStateChangedMessage) {
    console.info(`[ServerRedisGameEventHandler] Lobby ${lobbyID} state changed to: ${message.newState}`);
    //Check the state being changed to
    switch (message.newState) {
        case GAME_STATES.CANCELLED:
        case GAME_STATES.FINISHED:
            //If the game is cancelled or finished, the lobby needs to be cleaned up, as well as all objects owned in Redis and subscriptions to this lobby in redis
            //Remove the lobby (this also removes all subscriptions and sub-objects)
            const lobby = await Lobby.getById(lobbyID);
            if (lobby) {
                await lobby.delete();
                console.info(`[ServerRedisGameEventHandler] Lobby ${lobbyID} deleted successfully`);
            }
            break;
        default:
            console.error("[HandleLobbyStateChange] An internal server message was sent for a state that is not handled: ", message.newState);
    }
}