"use strict";
/**
 * @file TicTacBoard.ts
 * @description  This class draws the tictac board and the cursor on the tictac board
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
Object.defineProperty(exports, "__esModule", { value: true });
//creating the object type smallltictac.
var TicTacBoard = /** @class */ (function () {
    /**
     * A constructor for the TicTacBoard
     * @param {*} gameManager
     * @param {*} tictac
     * @param {*} x
     * @param {*} y
     * @param {*} gridSize
     */
    function TicTacBoard(sketch, gameManager, tictac, x, y, gridSize) {
        //Size and location
        this.gridSize = gridSize * TicTacBoard.BOARD_SHRINK_CONSTANT;
        this.x = x - this.gridSize / 2;
        this.y = y - this.gridSize / 2;
        this.GRID_SIZE = tictac.GRID_SIZE;
        //These variables help with the line sizing.
        this.lineNum = this.GRID_SIZE - 1;
        // What section is selected by the player 
        // Coordinates of the cursor on the tictac
        this.cursorRow = 0;
        this.cursorCol = 0;
        //This represents what levelsize the selected tictac is
        this.selectedLevelSize = 1;
        //This represents the index of the selected tictac
        this.selectedTicTacIndex = 0;
        this.cursorOn = true; //Whether or not the cursor should be rendered.
        //we take the tictac as a pointer to the tictac this tictac is responsible for displaying
        this.game = gameManager;
        this.tictac = tictac;
        //This is the levelSize
        this.maxLevelSize = this.tictac.getLevelSize();
        //This is the cache that holds all of the points in the tictac
        this.cache = Array.from({ length: (this.maxLevelSize + 1) }, function () { return []; });
        ;
        //Now we need to cache the points
        this.cachePoints();
        this.sketch = sketch;
    }
    /**
     * This method is intended to cache every single point of the tictac.
     */
    TicTacBoard.prototype.cachePoints = function () {
        for (var i = 0; i <= this.maxLevelSize; i++) {
            var space = (Math.pow((this.GRID_SIZE * this.GRID_SIZE), (this.maxLevelSize - i)));
            for (var j = 0; j < this.tictac.getArraySize() / space; j++) {
                //Set initial coordinates to watchamacallit
                var x = this.x;
                var y = this.y;
                //Iterate through all current levelsizes to get x and y coordinates
                for (var z = 0; z < i; z++) {
                    var col = this.getCol(z, j * space); //Get the relative column
                    var row = this.getRow(z, j * space); //Get the relative row
                    x += col * this.calculateSize(z + 1) + col * this.calculateMarginSize(z + 1) + this.calculateMarginSize(z + 1) / 2;
                    y += row * this.calculateSize(z + 1) + row * this.calculateMarginSize(z + 1) + this.calculateMarginSize(z + 1) / 2;
                }
                this.cache[i].push([x, y]);
            }
        }
    };
    /**
     * This method is responsible for rendering the tictac + the cursor on the tictac
     */
    TicTacBoard.prototype.draw = function () {
        //*The plan: one loop to draw tictacs and larger symbols
        //*Another loop to draw the smallest symbols
        //*This avoids a number of if checks
        //*The reason is for this is that only larger symbols use negative numbers to signal they should be drawn
        this.sketch.stroke(255);
        //Iterate for larger structures - larger that the smallest unit in the array
        for (var i = 0; i < this.maxLevelSize; i++) {
            var space = (Math.pow((this.GRID_SIZE * this.GRID_SIZE), (this.maxLevelSize - i))); //represents the number of slots to skip per iteration
            for (var j = 0; j < this.tictac.getArraySize() / space; j++) {
                var relevantSlot = this.tictac.getSlot(j * space);
                if (relevantSlot * -1 == (this.maxLevelSize - i)) {
                    this.drawIcon(i, j * space + 1, j); //Draw Icon if negative and iterating at equivalent levelsize
                }
                else if (relevantSlot * -1 > (this.maxLevelSize - i)) {
                    i += Math.pow((this.GRID_SIZE * this.GRID_SIZE), (-1 * relevantSlot)) - 1; //Skip to the next open spot
                }
                else {
                    //Otherwise draw tictac
                    this.drawTicTac(i, j);
                }
            }
        }
        //Iterate for smaller structures - the smallest unit in the array
        for (var i = 0; i < this.tictac.getArraySize(); i++) {
            var relevantSlot = this.tictac.getSlot(i);
            //Check to see if the tictac has been finished
            if (relevantSlot < 0) {
                //Skip to the next open spot
                i += Math.pow((this.GRID_SIZE * this.GRID_SIZE), (-1 * relevantSlot)) - 1;
            }
            else {
                this.drawIcon(this.maxLevelSize, i, i); //Otherwise try an Icon
            }
        }
        //Drawing the cursor
        if (this.cursorOn) {
            this.renderCursor();
        }
    };
    /**
     * Draws a tictac of any size
     * @param {*} levelSize - How deep in the Big TicTac we are
     * @param {*} cacheIndex - the index of the coordinates to draw the tictac
     */
    TicTacBoard.prototype.drawTicTac = function (levelSize, cacheIndex) {
        var size = this.calculateSize(levelSize);
        var x = this.cache[levelSize][cacheIndex][0];
        var y = this.cache[levelSize][cacheIndex][1];
        this.sketch.strokeWeight(1);
        for (var i = 0; i < this.lineNum; i++) {
            this.sketch.line(x + (size / this.GRID_SIZE) * (i + 1), y, x + (size / this.GRID_SIZE) * (i + 1), y + size);
            this.sketch.line(x, y + (size / this.GRID_SIZE) * (i + 1), x + size, y + (size / this.GRID_SIZE) * (i + 1));
        }
    };
    TicTacBoard.prototype.drawIcon = function (levelSize, tictacIndex, cacheIndex) {
        //Get the size
        var size = this.calculateSize(levelSize);
        //Get the coordinates from the cache
        var x = this.cache[levelSize][cacheIndex][0];
        var y = this.cache[levelSize][cacheIndex][1];
        this.sketch.strokeWeight(1);
        var slot = this.tictac.getSlot(tictacIndex);
        switch (slot) {
            case 0:
                //Do nothing.
                break;
            case 1:
                //Draw an X
                this.sketch.stroke(255);
                this.sketch.line(x, y, x + size, y + size);
                this.sketch.line(x + size, y, x, y + size);
                break;
            case 2:
                //Draw an O
                this.sketch.stroke(255);
                this.sketch.ellipseMode(this.sketch.CENTER);
                this.sketch.ellipse(x + size / 2, y + size / 2, size * (TicTacBoard.SMALLEST_BOARD_PERCENT / 100), size * (TicTacBoard.SMALLEST_BOARD_PERCENT / 100));
                break;
            default:
                //Draw the number in the grid instead. (used in case of >2 players)
                this.sketch.textSize(size);
                this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
                this.sketch.text(slot, x + size / 2, y + size / 2);
                break;
        }
    };
    /**
     * Given a levelSize, return the size of a tictac grid inside the big tictac
     * @param {*} levelSize
     * @returns a float containing the size
     */
    TicTacBoard.prototype.calculateSize = function (levelSize) {
        return this.gridSize * (Math.pow((TicTacBoard.BOARD_SHRINK_CONSTANT / (this.GRID_SIZE)), (levelSize)));
    };
    /**
     * Calculates the margin size between the edge of the an item grid and the tictac it is inside of.
     * @param {*} levelSize
     * @returns margin size (float)
     */
    TicTacBoard.prototype.calculateMarginSize = function (levelSize) {
        return ((this.calculateSize(levelSize) / TicTacBoard.BOARD_SHRINK_CONSTANT) * (1 - TicTacBoard.BOARD_SHRINK_CONSTANT));
    };
    /**
     * This method is intended to return the column of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    TicTacBoard.prototype.getCol = function (levelSize, index) {
        return this.getRelativeIndex(levelSize, index) % this.GRID_SIZE;
    };
    /**
     * This method is intended to return the row of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    TicTacBoard.prototype.getRow = function (levelSize, index) {
        //The index needs to be reduced to a number out of nine.
        return Math.floor(this.getRelativeIndex(levelSize, index) / this.GRID_SIZE);
    };
    /**
     * This method returns the spot in the tictac we are looking for.
     * @param {*} levelSize
     * @param {*} index
     * @returns  returns a number between 0 - GRIDSIZE*GRIDSZE - 1
     */
    TicTacBoard.prototype.getRelativeIndex = function (levelSize, index) {
        //So the first thing to do is check the levelsize.
        //We do this to get the number of spots a single tictac of levelSize is supposed to envelop
        //Legend: Levelsize of 0 would represent the largest tictac, levelsize of say 1 would be smallest tictacs on a standard board
        //That means the total number of slots envoloped by one tictac of that size would be 
        var size = Math.pow((this.GRID_SIZE * this.GRID_SIZE), (this.maxLevelSize - levelSize));
        //Now we need to find a multiple of size that is the closest value to index - where it must be below index by a max of size.
        var factor = Math.floor(index / size);
        //Now to get the tictac, it would be
        var range = index - factor * size;
        //Then we need to divide range by this.GRIDSIZE*this.GRIDSIZE, so that we can split it into that many and return a number from 
        var divisions = Math.floor((size) / (this.GRID_SIZE * this.GRID_SIZE));
        //Then we find how many times divisions fits into range
        return Math.floor(range / divisions);
    };
    /**
     * This method moves the cursor up
     */
    TicTacBoard.prototype.cursorUp = function () {
        if (this.cursorRow <= 0) {
            this.cursorRow = this.GRID_SIZE - 1;
        }
        else {
            this.cursorRow -= 1;
        }
    };
    /**
     * This method moves the cursor down
     */
    TicTacBoard.prototype.cursorDown = function () {
        if (this.cursorRow >= this.GRID_SIZE - 1) {
            this.cursorRow = 0;
        }
        else {
            this.cursorRow += 1;
        }
    };
    /**
     * This method moves the cursor left
     */
    TicTacBoard.prototype.cursorLeft = function () {
        if (this.cursorCol <= 0) {
            this.cursorCol = this.GRID_SIZE - 1;
        }
        else {
            this.cursorCol -= 1;
        }
    };
    /**
     * This method moves the cursor right
     */
    TicTacBoard.prototype.cursorRight = function () {
        if (this.cursorCol >= this.GRID_SIZE - 1) {
            this.cursorCol = 0;
        }
        else {
            this.cursorCol += 1;
        }
    };
    /**
     * This method requests a change to be made to the board
     */
    TicTacBoard.prototype.playMove = function () {
        //modify the tictac. at the spot that is currently selected 
        //*This method must be called assuming that the player is on the right tile
        this.tictac.setSlot(this.selectedTicTacIndex, this.game.getTurn());
        this.game.changeTurn(); //Now we change the turn.
        //Next we need to set the cursor to the proper tictac.
        if (this.selectedLevelSize != 0) {
            //In order to calculate the next spot to send the cursor to, we need to find the equivalent spot in the previous levelsize
            this.selectedTicTacIndex = Math.floor((this.selectedTicTacIndex + this.cursorRow * this.GRID_SIZE + this.cursorCol) / (this.GRID_SIZE * this.GRID_SIZE));
            this.selectedLevelSize -= 1; //decrement the levesize
            //Get the proper index that the cursor should be at
            this.cursorCol = 0;
            this.cursorRow = 0;
        }
        else {
        }
    };
    /**
     * This method renders the cursor on the tictac
     */
    TicTacBoard.prototype.renderCursor = function () {
        this.sketch.rectMode(this.sketch.CORNER);
        this.sketch.noFill();
        this.sketch.strokeWeight(5);
        this.sketch.rect(this.cache[this.selectedLevelSize][this.selectedTicTacIndex + this.cursorRow * this.GRID_SIZE + this.cursorCol][0], this.cache[this.selectedLevelSize][this.selectedTicTacIndex + this.cursorRow * this.GRID_SIZE + this.cursorCol][1], this.calculateSize(this.selectedLevelSize), this.calculateSize(this.selectedLevelSize));
    };
    /**
     * This method is responsible for selecting the tictac.
     */
    TicTacBoard.prototype.selectTicTac = function () {
        if (this.selectedLevelSize == this.maxLevelSize) {
            this.playMove();
        }
        else {
            this.selectedLevelSize++;
        }
        this.cursorCol = 0;
        this.cursorRow = 0;
    };
    /**
     * This method is responsible for deleselecting the tictac
     */
    TicTacBoard.prototype.deselectTicTac = function () {
        this.selectedLevelSize--;
        // if (this.selectedLevelSize == 0) {
        // }
        this.cursorCol = 0;
        this.cursorRow = 0;
    };
    TicTacBoard.BOARD_SHRINK_CONSTANT = 0.8;
    TicTacBoard.ICON_SHRINK_CONSTANT = 0.6;
    TicTacBoard.SMALLEST_BOARD_PERCENT = 75;
    return TicTacBoard;
}());
exports.default = TicTacBoard;
