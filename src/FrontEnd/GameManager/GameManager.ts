/**
 * @file GameManager.ts
 * @description This file illustrates the key functions of a GameManager and exports the GameType enum.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import TicTac, { TictacStateObject } from "../../Shared/Game/TicTac";

//This is a constant that holds the types of games that can exist
export enum GameType {
    LOCAL,
    ONLINE,
}

export interface GameManager {
    /**
     * @method cleanup
     * @description Clean up resources when the game ends
     */
    cleanup(): void

    /**
     * @method handleMove
     * @description responsible for handling what to do with moves
     * @returns A tictac state object
     */
    handleMove(
        cursorCol: number,
        cursorRow: number,
        player?: number,
    ): Promise<TictacStateObject>

    /**
     * @method playMove
     * @description This method is used whenever the player makes a move on the grid.
     * @returns A boolean representing whether or not a move was played
     */
    playMove(
        cursorCol: number,
        cursorRow: number,
    ): Promise<TictacStateObject>

    /**
     * @method getBoard
     * @description This method returns the board owned by the game manager
     * @returns {TicTac}
     */
    getBoard(): TicTac

    /**
     * @method getTurn
     * @description This method returns the turn of the game
     * @returns {number}
     */
    getTurn(): number

    /**
     * @method getTurnName
     * @description This method returns the playerName
     * @returns {string}
     */
    getTurnName(): string

    /**
     * @method changeTurn
     * @description This method moves the turn to the next player
     */
    changeTurn(): void;

    /**
     * @method isSpectator
     * @description Returns true if the current client is only watching and should not control the cursor
     */
    isSpectator(): boolean;

    /**
     * @method isMyTurn
     * @description Returns true if it is currently this client's turn to move
     */
    isMyTurn(): boolean;
}
