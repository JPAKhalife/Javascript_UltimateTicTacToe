/**
 * @file TicTacBoard.ts
 * @description  This class draws the tictac board and the cursor on the tictac board
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";

import GameManager from "../GameManager";
import TicTac from "../TicTac";

//creating the object type smalltictac.
export default class TicTacBoard {
    private gridSize: number;
    private x: number;
    private y: number;
    private GRID_SIZE: number;
    private lineNum: number;
    private cursorRow: number;
    private cursorCol: number;
    private selectedLevelSize: number;
    private selectedTicTacIndex: number;
    private cursorOn: boolean;
    private game: GameManager;
    private tictac: TicTac;
    private maxLevelSize: number;
    private cache: number[][][];
    private sketch: p5;

    public static readonly BOARD_SHRINK_CONSTANT: number = 0.8;
    public static readonly ICON_SHRINK_CONSTANT: number = 0.6;
    public static readonly SMALLEST_BOARD_PERCENT: number = 75;

    /**
     * A constructor for the TicTacBoard
     * @param {*} gameManager
     * @param {*} tictac 
     * @param {*} x 
     * @param {*} y 
     * @param {*} gridSize 
     */
    constructor(sketch:p5, gameManager: GameManager,tictac: TicTac, x: number,y: number,gridSize: number) {
        //Size and location
        this.gridSize = gridSize*TicTacBoard.BOARD_SHRINK_CONSTANT; 
        this.x = x - this.gridSize/2;
        this.y = y - this.gridSize /2;
        this.GRID_SIZE = tictac.getGridSize();
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
        this.cache = Array.from({ length: this.maxLevelSize + 1 },() => [] as any[]);
        //Now we need to cache the points
        this.cachePoints();
        this.sketch = sketch;
    }

    /**
     * This method is intended to cache every single point of the tictac.
     */
    cachePoints() {
        for (let i = 0 ; i <= this.maxLevelSize ; i++) {
            let space = ((this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - i));
            for (let j = 0 ; j < this.tictac.getArraySize()/space ; j++) {
                //Set initial coordinates to watchamacallit
                let x = this.x;
                let y = this.y;
                //Iterate through all current levelsizes to get x and y coordinates
                for (let z = 0 ; z < i ; z++) {
                    let col =  this.getCol(z,j*space); //Get the relative column
                    let row = this.getRow(z,j*space); //Get the relative row
                    x += col*this.calculateSize(z+1) + col*this.calculateMarginSize(z+1) + this.calculateMarginSize(z+1)/2;
                    y += row*this.calculateSize(z+1) + row*this.calculateMarginSize(z+1) + this.calculateMarginSize(z+1)/2;
                }
                this.cache[i].push([x,y]);
            }
        }
    }

    /**
     * This method is responsible for rendering the tictac + the cursor on the tictac
     */
    draw() {
        //*The plan: one loop to draw tictacs and larger symbols
        //*Another loop to draw the smallest symbols
        //*This avoids a number of if checks
        //*The reason is for this is that only larger symbols use negative numbers to signal they should be drawn
        this.sketch.stroke(255);
        //Iterate for larger structures - larger that the smallest unit in the array
        for (let i = 0 ; i < this.maxLevelSize ; i++) {
            let space = ((this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - i)); //represents the number of slots to skip per iteration
                for (let j = 0 ; j < this.tictac.getArraySize()/space ; j++) {
                    let relevantSlot = this.tictac.getSlot(j*space);
                    if (relevantSlot*-1 == (this.maxLevelSize - i)) {
                        this.drawIcon(i,j*space + 1,j); //Draw Icon if negative and iterating at equivalent levelsize
                    } else if (relevantSlot*-1 > (this.maxLevelSize - i)) {
                        i += (this.GRID_SIZE*this.GRID_SIZE)**(-1*relevantSlot) - 1; //Skip to the next open spot
                    } else {
                        //Otherwise draw tictac
                        this.drawTicTac(i,j);
                    }
                }
        }
        //Iterate for smaller structures - the smallest unit in the array
        for (let i = 0 ; i < this.tictac.getArraySize() ; i++) {
            let relevantSlot = this.tictac.getSlot(i);
            //Check to see if the tictac has been finished
            if (relevantSlot < 0) {
                //Skip to the next open spot
                i += (this.GRID_SIZE*this.GRID_SIZE)**(-1*relevantSlot) - 1;
            } else {
                this.drawIcon(this.maxLevelSize,i,i); //Otherwise try an Icon
            }
        } 
        //Drawing the cursor
        if (this.cursorOn) {
            this.renderCursor();
        }
    }

    /**
     * Draws a tictac of any size
     * @param {*} levelSize - How deep in the Big TicTac we are
     * @param {*} cacheIndex - the index of the coordinates to draw the tictac
     */
    drawTicTac(levelSize: number,cacheIndex: number) {
        let size = this.calculateSize(levelSize);
        let x = this.cache[levelSize][cacheIndex][0];
        let y = this.cache[levelSize][cacheIndex][1];
        this.sketch.strokeWeight(1);
        for (let i = 0 ; i < this.lineNum ; i++) {
            this.sketch.line(x + (size/this.GRID_SIZE)*(i+1),y,x + (size/this.GRID_SIZE)*(i+1),y + size);
            this.sketch.line(x,y+(size/this.GRID_SIZE)*(i+1),x + size,y + (size/this.GRID_SIZE) * (i+1));
        }
    }

    drawIcon(levelSize: number, tictacIndex: number, cacheIndex: number) {
        //Get the size
        let size = this.calculateSize(levelSize);
        //Get the coordinates from the cache
        let x = this.cache[levelSize][cacheIndex][0];
        let y = this.cache[levelSize][cacheIndex][1];
        this.sketch.strokeWeight(1);
        let slot = this.tictac.getSlot(tictacIndex)
        switch (slot) {
            case 0:
                //Do nothing.
            break;
            case 1:
                //Draw an X
                this.sketch.stroke(255);
                this.sketch.line(x,y,x + size,y + size);
                this.sketch.line(x + size,y,x,y + size);
            break;
            case 2:
                //Draw an O
                this.sketch.stroke(255);
                this.sketch.ellipseMode(this.sketch.CENTER)
                this.sketch.ellipse(x + size/2,y + size/2,size*(TicTacBoard.SMALLEST_BOARD_PERCENT/100),size*(TicTacBoard.SMALLEST_BOARD_PERCENT/100));
            break;
            default:
                //Draw the number in the grid instead. (used in case of >2 players)
                this.sketch.textSize(size);
                this.sketch.textAlign(this.sketch.CENTER,this.sketch.CENTER);
                this.sketch.text(slot,x + size/2, y + size/2);
            break;
        }

    }
    
    /**
     * Given a levelSize, return the size of a tictac grid inside the big tictac
     * @param {*} levelSize 
     * @returns a float containing the size
     */
    calculateSize(levelSize: number) {
        return this.gridSize*((TicTacBoard.BOARD_SHRINK_CONSTANT/(this.GRID_SIZE))**(levelSize));
    }

    /**
     * Calculates the margin size between the edge of the an item grid and the tictac it is inside of.
     * @param {*} levelSize 
     * @returns margin size (float)
     */
    calculateMarginSize(levelSize: number) {
        return ((this.calculateSize(levelSize)/TicTacBoard.BOARD_SHRINK_CONSTANT) * (1 - TicTacBoard.BOARD_SHRINK_CONSTANT));
    }

    /**
     * This method is intended to return the column of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index 
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    getCol(levelSize: number,index: number) {
        return this.getRelativeIndex(levelSize,index) % this.GRID_SIZE;
    }

    /**
     * This method is intended to return the row of which tictac that a certain index is in.
     * @param {*} levelSize - the level of Tictac that should be scanned
     * @param {*} index 
     * @returns An integer from 0 - GRIDSIZE - 1
     */
    getRow(levelSize: number,index: number) {
        //The index needs to be reduced to a number out of nine.
        return Math.floor(this.getRelativeIndex(levelSize,index) / this.GRID_SIZE);
    }

    /**
     * This method returns the spot in the tictac we are looking for.
     * @param {*} levelSize 
     * @param {*} index 
     * @returns  returns a number between 0 - GRIDSIZE*GRIDSZE - 1
     */
    getRelativeIndex(levelSize: number,index: number) {
        //So the first thing to do is check the levelsize.
        //We do this to get the number of spots a single tictac of levelSize is supposed to envelop
        //Legend: Levelsize of 0 would represent the largest tictac, levelsize of say 1 would be smallest tictacs on a standard board
        //That means the total number of slots envoloped by one tictac of that size would be 
        let size = (this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - levelSize);
        //Now we need to find a multiple of size that is the closest value to index - where it must be below index by a max of size.
        let factor = Math.floor(index/size);
        //Now to get the tictac, it would be
        let range = index - factor*size;
        //Then we need to divide range by this.GRIDSIZE*this.GRIDSIZE, so that we can split it into that many and return a number from 
        let divisions = Math.floor((size)/(this.GRID_SIZE*this.GRID_SIZE));
        //Then we find how many times divisions fits into range
        return Math.floor(range/divisions);
    }

    /**
     * This method moves the cursor up
     */
    cursorUp() {
        if (this.cursorRow <= 0) {
            this.cursorRow = this.GRID_SIZE - 1;
        } else {
            this.cursorRow -= 1;
        }
    }

    /**
     * This method moves the cursor down
     */
    cursorDown() {
        if (this.cursorRow >= this.GRID_SIZE - 1) {
            this.cursorRow = 0;
        } else {
            this.cursorRow += 1;
        }
    }

    /**
     * This method moves the cursor left
     */
    cursorLeft() {
        if (this.cursorCol <= 0) {
            this.cursorCol = this.GRID_SIZE - 1;
        } else {
            this.cursorCol -= 1;
        }
    }
    
    /**
     * This method moves the cursor right
     */
    cursorRight() {
        if (this.cursorCol >= this.GRID_SIZE - 1) {
            this.cursorCol = 0;
        } else {
            this.cursorCol += 1;
        }
    }

    /**
     * This method requests a change to be made to the board
     */
    playMove() {
        //modify the tictac. at the spot that is currently selected 
        //*This method must be called assuming that the player is on the right tile
        this.tictac.setSlot(this.selectedTicTacIndex,this.game.getTurn());
        this.game.changeTurn(); //Now we change the turn.
        //Next we need to set the cursor to the proper tictac.
        

        if (this.selectedLevelSize != 0) {
            //In order to calculate the next spot to send the cursor to, we need to find the equivalent spot in the previous levelsize
            this.selectedTicTacIndex = Math.floor((this.selectedTicTacIndex + this.cursorRow*this.GRID_SIZE + this.cursorCol)/(this.GRID_SIZE*this.GRID_SIZE));
            this.selectedLevelSize -= 1; //decrement the levesize
            //Get the proper index that the cursor should be at
            this.cursorCol = 0;
            this.cursorRow = 0;
        } else {

        }
        
    }
    
    /**
     * This method renders the cursor on the tictac
     */
    renderCursor() {
            this.sketch.rectMode(this.sketch.CORNER);
            this.sketch.noFill();
            this.sketch.strokeWeight(5);
            this.sketch.rect(this.cache[this.selectedLevelSize][this.selectedTicTacIndex + this.cursorRow*this.GRID_SIZE + this.cursorCol][0],
                this.cache[this.selectedLevelSize][this.selectedTicTacIndex + this.cursorRow*this.GRID_SIZE + this.cursorCol][1],
                this.calculateSize(this.selectedLevelSize),
                this.calculateSize(this.selectedLevelSize));
    }

    /**
     * This method is responsible for selecting the tictac.
     */
    selectTicTac() {
        if (this.selectedLevelSize == this.maxLevelSize) {
            this.playMove();
        } else {
            this.selectedLevelSize++;
        }
        
        this.cursorCol = 0;
        this.cursorRow = 0;
    }

    /**
     * This method is responsible for deleselecting the tictac
     */
    deselectTicTac() {
        this.selectedLevelSize--;
        // if (this.selectedLevelSize == 0) {
            
        // }
        this.cursorCol = 0;
        this.cursorRow = 0;
    }
}


