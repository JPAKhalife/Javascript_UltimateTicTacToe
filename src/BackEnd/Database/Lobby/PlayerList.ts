/**
 * @file PlayerList.ts
 * @description This file is responsible for managing the database object that keeps track of the playerlist.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import { REDIS_KEYS } from "../../Contants";
import { Player } from "../Player";
import { RedisList } from "../RedisBase/RedisList";

/**
 * PlayerList class extending RedisList for managing lobby player lists
 *
 * Implements required static factory methods:
 * - static async create(lobbyID, initialPlayers): Promise<PlayerList>
 * - static async getById(lobbyID): Promise<PlayerList | null>
 */
export class PlayerList extends RedisList<string> {
    private lobbyID: string;

    constructor(lobbyID: string, state: string[] = []) {
        super(lobbyID, state);
        this.lobbyID = lobbyID;
    }

    protected getRedisKey(): string {
        return REDIS_KEYS.LOBBY_PLAYERS(this.lobbyID);
    }

    // PlayerIDs are stored as strings
    protected serializeItem(item: string): string {
        return item;
    }

    protected deserializeItem(value: string): string {
        return value;
    }

    /**
     * Create a new player list for a lobby (not typically used - Lobby.create handles this)
     * @param lobbyID The ID of the lobby to create a player list for
     * @param initialPlayers Optional initial list of player IDs
     * @returns A new PlayerList instance
     */
    public static async create(lobbyID: string, initialPlayers: string[] = []): Promise<PlayerList> {
        const playerList = new PlayerList(lobbyID, initialPlayers);
        await playerList.save();
        return playerList;
    }

    /**
     * Get an existing player list by lobby ID
     * @param id The ID of the lobby to get the player list for
     * @returns The PlayerList instance or null if not found
     */
    public static async getById(id: string): Promise<PlayerList | null> {
        try {
            const playerList = new PlayerList(id);
            await playerList.load();
            return playerList;
        } catch (error) {
            console.warn(`[PlayerList] Failed to load PlayerList for lobby ${id}:`, error);
            return null;
        }
    }
}
