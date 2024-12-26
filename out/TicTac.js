"use strict";
/**
 * @file TicTacBoard.ts
 * @description  This file is responsible for keeping track of the tictac game state
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PLAYER_NUMBER = exports.DEFAULT_GRID_SIZE = void 0;
//Each tictac owns a grid of 3x3 (or more in the future who knows)
var TicTacState = {
    ONGOING: 0,
    DRAW: 1,
    WIN: 2,
};
exports.DEFAULT_GRID_SIZE = 3;
exports.DEFAULT_PLAYER_NUMBER = 2;
var TicTac = /** @class */ (function () {
    //We will start by initializing the tictac
    //Create the grid - grids can contain a  number or a tictac literally anything
    function TicTac(maxLevelSize) {
        //Non recursive solution
        //All that is required for this tictac is that it is an array of signed integers
        //The length of this array will be equal to (GRID_SIZE^2)^levelSize
        if (maxLevelSize === void 0) { maxLevelSize = 0; }
        this.GRID_SIZE = exports.DEFAULT_GRID_SIZE;
        //Within this array 0 means that nobody owns that particular square
        //Anything greater than zero indicates that the nth player owns that square.
        //Numbers less than zero will indicate a level size - and right after that number will be result of that tictac
        //Grid size constant
        this.maxLevelSize = maxLevelSize;
        //Initialize the board with a grid of zeroes
        this.grid = Array(Math.pow((this.GRID_SIZE * this.GRID_SIZE), this.maxLevelSize)).fill(1);
        //We set the state variable
        this.state = TicTacState.ONGOING;
    }
    /**
     * @method getSlot
     * @description This method returns the slot of the tictac
     * @param index
     * @returns A slot of the tictac
     */
    TicTac.prototype.getSlot = function (index) {
        return this.grid[index];
    };
    /**
     * @method setSlot
     * @description This method sets the slot of the grid
     * @param index {number}
     * @param item {number}
     */
    TicTac.prototype.setSlot = function (index, item) {
        this.grid[index] = item;
    };
    /**
     * @method getArraySize
     * @description This method returns the size of the arrays
     * @returns {number}
     */
    TicTac.prototype.getArraySize = function () {
        return this.grid.length;
    };
    /**
     * @method getWinner
     * @description This method returns the winner of the game
     * @returns {number}
     */
    TicTac.prototype.getWinner = function () {
        //Check if the entire grid has been won
        if (this.grid[0] == this.maxLevelSize) {
            return this.grid[1];
        }
        return 0;
    };
    /**
     * @method getLevelSize
     * @description This method returns the levelsize of the tictac (number of tictacs inside tictacs)
     * @returns {number}
     */
    TicTac.prototype.getLevelSize = function () {
        return this.maxLevelSize;
    };
    return TicTac;
}());
exports.default = TicTac;
