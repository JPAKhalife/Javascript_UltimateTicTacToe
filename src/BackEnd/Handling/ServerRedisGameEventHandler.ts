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
import { sendMessageToClient } from "./WebsocketEventHandler";
import { getConnectionID } from "../Database/ClientConnections";
import { Lobby } from "../Database/Lobby/Lobby";

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

    console.info(`[ServerRedisGameEventHandler] Sending message to ${activeSubscriptions[lobbyID].length} players in lobby ${lobbyID}`);

    //Iterate through every single player that has subscribed to this lobby
    for (const playerID of activeSubscriptions[lobbyID]) {
        let connectionID = await getConnectionID(playerID);
        if (connectionID != null) {
            console.info(`[ServerRedisGameEventHandler] Sending message to player ${playerID} (connection ${connectionID})`);
            sendMessageToClient(connectionID, message);
        } else {
            console.warn(`[ServerRedisGameEventHandler] No connection found for player ${playerID}`);
        }
    }
}