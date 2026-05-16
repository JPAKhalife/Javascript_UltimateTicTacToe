/**
 * @file Board.ts
 * @description This file is responsible for managing the database object that keeps track of the board.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2025-12-23
 */

import { REDIS_KEYS } from "../../Contants";
import { RedisList } from "../RedisBase/RedisList";

/**
 * Board class extending RedisList for managing game board state
 * Stores the board as a list of numbers representing cell states
 *
 * Implements required static factory methods:
 * - static async create(lobbyID, size): Promise<Board>
 * - static async getById(lobbyID): Promise<Board | null>
 */
export class Board extends RedisList<number> {
    private lobbyID: string;

    /**
     * Private constructor - use static factory methods instead
     * @param lobbyID The ID of the lobby this board belongs to
     * @param initialState Initial board state (optional)
     */
    constructor(lobbyID: string, initialState: number[] = []) {
        super(lobbyID, initialState);
        this.lobbyID = lobbyID;
    }

    /**
     * Create a new board for a lobby
     * @param lobbyID The ID of the lobby to create a board for
     * @param size The size of the board (number of cells)
     * @returns A new Board instance
     */
    public static async create(lobbyID: string, size: number): Promise<Board> {
        const initialState = new Array(size).fill(0);
        const board = new Board(lobbyID, initialState);
        await board.save();
        return board;
    }

    /**
     * Get an existing board by lobby ID
     * @param lobbyID The ID of the lobby to get the board for
     * @returns The Board instance or null if not found
     */
    public static async getById(lobbyID: string): Promise<Board | null> {
        try {
            const board = new Board(lobbyID);
            await board.load();
            return board;
        } catch (error) {
            console.warn(`[Board] Failed to load board for lobby ${lobbyID}:`, error);
            return null;
        }
    }

    /**
   * Get the Redis key for this board
   */
    protected getRedisKey(): string {
        return REDIS_KEYS.BOARD(this.lobbyID);
    }

    /**
     * Serialize a number to string for Redis storage
     * @param item The number to serialize
     * @returns The string representation of the number
     */
    protected serializeItem(item: number): string {
        return item.toString();
    }

    /**
     * Deserialize a string from Redis to a number
     * @param value The string value from Redis
     * @returns The parsed number
     */
    protected deserializeItem(value: string): number {
        return parseInt(value, 10);
    }

    /**
     * Get the current board state as an array
     * @returns A copy of the board state
     */
    public getBoardState(): number[] {
        return this.getItems();
    }

    /**
     * Set a cell value at a specific position
     * @param position The position/index of the cell
     * @param value The value to set (typically player number or 0 for empty)
     */
    public async setCellValue(position: number, value: number): Promise<void> {
        await this.setAt(position, value);
    }

    /**
     * Get a cell value at a specific position
     * @param position The position/index of the cell
     * @returns The value at that position or null if out of bounds
     */
    public async getCellValue(position: number): Promise<number | null> {
        return await this.getAt(position);
    }

    /**
     * Reset the entire board to a specific state
     * @param newState The new board state
     */
    public async resetBoard(newState: number[]): Promise<void> {
        this.items = [...newState];
        await this.save();
    }

    /**
     * Initialize the board at a specific size with all zeros
     * @param size The number of cells in the board
     */
    public async initializeBoard(size: number): Promise<void> {
        const initialState = new Array(size).fill(0);
        this.items = initialState;
        await this.save();
    }

    /**
     * Get the size of the board
     * @returns The number of cells in the board
     */
    public getBoardSize(): number {
        return this.size();
    }

    /**
     * Make multiple moves on the board without saving after each one
     * @param moves Array of {position, value} pairs representing moves
     * @example
     * await board.batchSetMoves([
     *   { position: 5, value: 1 },
     *   { position: 10, value: 2 },
     *   { position: 15, value: 1 }
     * ]);
     */
    public async batchSetMoves(
        moves: Array<{ position: number; value: number }>
    ): Promise<void> {
        await this.batchSetAt(
            moves.map(({ position, value }) => ({ index: position, value }))
        );
    }

    /**
     * Perform multiple board operations in a batch
     * @param updater Function that receives the board state array and can modify it
     * @example
     * await board.batchUpdateBoard((boardState) => {
     *   boardState[5] = 1;
     *   boardState[10] = 2;
     *   boardState[15] = 1;
     * });
     */
    public async batchUpdateBoard(updater: (boardState: number[]) => void): Promise<void> {
        await this.batchUpdate(updater);
    }
}