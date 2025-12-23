/**
 * @file ServerRedisGameEventHandler.ts
 * @description This file is reponsible for handling communication between webservers via Redis Pub/Sub
 *
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */

import { DatabaseManager } from "../Database/DatabaseManager";
import z from "zod"
import { FROM_SERVER_MESSAGE_TYPES } from "../../Shared/Contracts/MessageToClientSchema";
import { Lobby } from "../Database/Lobby/Lobby";
import { sendMessageToClient } from "./WebsocketEventHandler";
import { getConnectionID, getPlayerID } from "../Database/ClientConnections";

const activeSubscriptions: Record<string, string[]> = {};

/**
 * @function subscribeToLobby
 * @description Subscribes to a specific lobby channel for inter-server communication
 * @param lobbyId - The ID of the lobby to subscribe to
 * @param playerId - The ID of the player subscribing
 * @return void
 */
export async function subscribeToLobby(lobbyID: string, playerID: string) {
    const dbManager = DatabaseManager.getInstance();
    const subscriberClient = dbManager.getSubscriberClient();

    //Check if we are already subscribed
    if (activeSubscriptions[lobbyID] && activeSubscriptions[lobbyID].includes(playerID)) {
        console.log("Already subscribed to lobby:", lobbyID);
    } else {
        subscriberClient.subscribe(`lobby:${lobbyID}`);
        if (!activeSubscriptions[lobbyID]) {
            activeSubscriptions[lobbyID] = [];
        }
        activeSubscriptions[lobbyID].push(playerID);
    }
}

/**
 * @function unsubscribeFromLobby
 * @description Unsubscribes from a specific lobby channel for inter-server communication
 * @param lobbyId - The ID of the lobby to unsubscribe from
 */
export function unsubscribeFromLobby(lobbyID: string, playerID: string) {
    const dbManager = DatabaseManager.getInstance();
    const subscriberClient = dbManager.getSubscriberClient();

    if (!activeSubscriptions[lobbyID]) {
        console.log("No active subscriptions for lobby:", lobbyID);
        return;
    }
    //First remove the playerID from the activeSubscriptions
    if (!activeSubscriptions[lobbyID].includes(playerID)) {
        console.log("Player not subscribed to lobby:", lobbyID);
        return;
    }
    activeSubscriptions[lobbyID] = activeSubscriptions[lobbyID].filter(id => id !== playerID);
    if (activeSubscriptions[lobbyID].length === 0) {
        subscriberClient.unsubscribe(`lobby:${lobbyID}`);
    }
    
}

/**
 * @function publishToLobby
 * @description Publishes a message to a specific lobby channel for inter-server communication
 * @param lobbyId - The ID of the lobby to publish to
 * @param message - The message to publish
 */
export function publishToLobby(lobbyID: string, message: any) {
    const dbManager = DatabaseManager.getInstance();
    const publisherClient = dbManager.getRegularClient();

    publisherClient.publish(`lobby:${lobbyID}`, JSON.stringify(message));
}

/**
 * @function handleForwardLobbyMessage
 * @description Handles incoming messages from lobby channels
 * @param message - The incoming message
 */
export async function handleForwardLobbyMessage(lobbyID: string, message: any) {
    console.log("Received lobby message:", message);

    // Check if the message type is within FROM_SERVER_MESSAGE_TYPES
    // This is so we know if we should send this to the client.
    if (Object.values(FROM_SERVER_MESSAGE_TYPES).includes(message.type)) {
        //Next, we need to find all the players it will be neccessary to send this to.
        for ( const playerID of activeSubscriptions[lobbyID] || []) {
            let connectionID = await getConnectionID(playerID);
            if (connectionID != null) {
                sendMessageToClient(connectionID, message);
            } 
        }
    } else {
        console.warn(`Unknown message type: ${message.type}`);
    }
}