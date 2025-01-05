/**
 * @file GameManager.ts
 * @description //This file is responsible for keeping track of the game state
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import TicTac from "./TicTac";
import {DEFAULT_GRID_SIZE, DEFAULT_PLAYER_NUMBER} from "./TicTac";
import { TicTacState } from "./TicTac";

//This is a constant that holds the types of games that can exist
export enum GameType {
    LOCAL,
    ONLINE
}

//This class activates as soon as a game is started
export default class GameManager {

    private gameType: GameType;
    private gridSize: number;
    private board: TicTac;
    private turn: number;
    private isWon: boolean;
    private playerNumber: number;


    constructor(gameType: GameType = GameType.LOCAL, gridSize: number = DEFAULT_GRID_SIZE, gridLevels: number = 2) {
        //The game manager should have a variable that keeps track of whether or not it is playing online or offline
        this.gameType = gameType;
        this.gridSize = gridSize;
        //The game manager will own a single tictac - which will hold all of the other tictacs and the lowest level slots
        //This is initialized with recursion
        this.board = new TicTac(gridLevels); //TODO: Create a constant for the number of tictacs inside tictacs u
        //This is used to keep track of the current player's turn
        this.turn = 1;
        this.isWon = false;
        this.playerNumber = DEFAULT_PLAYER_NUMBER;
    }

    /**
     * @method playMove
     * @description This method is used whenever the player makes a move on the grid.
     * @returns A boolean representing whether or not a move was played
     */
    public playMove(cursorCol: number, cursorRow: number): boolean 
    {
        //Step one: Make the move on the tictac
        let state = this.board.updateSlot(this.turn,cursorCol,cursorRow);
        if (state == TicTacState.ONGOING) {
            this.changeTurn(); //change the turn, step two
            //TODO: Step three: I don't know yet
            return true;
        } else if (state != TicTacState.ERROR) {
            return true;
        }
        return false; 
    }
    
    /**
     * @method getBoard
     * @description This method returns the board owned by the game manager
     * @returns {TicTac}
     */
    getBoard(): TicTac 
    {
        return this.board;
    }

    /**
     * @method getTurn
     * @description This method returns the turn of the game
     * @returns {number}
     */
    getTurn(): number
    {
        return this.turn;
    }

    /**
     * @method changeTurn
     * @description This method moves the turn to the next player
     */
    changeTurn(): void
    {
        this.turn = (this.turn % this.playerNumber) + 1;
    }
}