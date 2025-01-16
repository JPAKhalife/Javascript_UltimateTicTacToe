/**
 * @file TicTacBoard.ts
 * @description  This class draws the tictac board and the cursor on the tictac board
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";

import GameManager from "../GameManager";
import TicTac, { TicTacState } from "../TicTac";
import MenuItem from "./MenuItem";

//creating the object type smalltictac.
export default class TicTacBoard implements MenuItem {
    private gridSize: number;
    private x: number;
    private y: number;
    private GRID_SIZE: number;
    private lineNum: number;
    private cursorRow: number;
    private cursorCol: number;
    private cursorOn: boolean;
    private game: GameManager;
    private tictac: TicTac;
    private maxLevelSize: number;
    private cache: number[][][];
    private sketch: p5;
    //MenuItem variables
    private selected: boolean;
    private isConfirmed: boolean;

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
    constructor(sketch:p5, gameManager: GameManager, x: number,y: number,gridSize: number) {
        this.isConfirmed = true;
        this.selected = true;
        //Size and location
        this.gridSize = gridSize*TicTacBoard.BOARD_SHRINK_CONSTANT; 
        this.x = x - this.gridSize/2;
        this.y = y - this.gridSize /2;
        this.GRID_SIZE = gameManager.getBoard().getGridSize();
        //These variables help with the line sizing.
        this.lineNum = this.GRID_SIZE - 1;
        // What section is selected by the player 
        // Coordinates of the cursor on the tictac
        this.cursorRow = 0;
        this.cursorCol = 0;
        this.cursorOn = true; //Whether or not the cursor should be rendered.
        //we take the tictac as a pointer to the tictac this tictac is responsible for displaying
        this.game = gameManager;
        this.tictac = gameManager.getBoard();
        //This is the levelSize
        this.maxLevelSize = this.tictac.getLevelSize();
        //This is the cache that holds all of the points in the tictac
        this.cache = Array.from({ length: this.maxLevelSize + 1 },() => [] as any[]);
        //Now we need to cache the points
        this.cachePoints();
        this.sketch = sketch;

        //These are the relevant variables for MenuItem

    }

    /**
     * This method is intended to cache every single point of the tictac.
     */
    public cachePoints() {
        for (let i = 0 ; i <= this.maxLevelSize ; i++) {
            let space = ((this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - i));
            for (let j = 0 ; j < this.tictac.getArraySize()/space ; j++) {
                //Set initial coordinates to watchamacallit
                let x = this.x;
                let y = this.y;
                //Iterate through all current levelsizes to get x and y coordinates
                for (let z = 0 ; z < i ; z++) {
                    let col =  this.tictac.getCol(z,j*space); //Get the relative column
                    let row = this.tictac.getRow(z,j*space); //Get the relative row
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
    public draw() {
        //*The plan: one loop to draw tictacs and larger symbols
        //*Another loop to draw the smallest symbols
        //*This avoids a number of if checks
        //*The reason is for this is that only larger symbols use negative numbers to signal they should be drawn
        this.sketch.stroke(255);
        this.sketch.strokeWeight(1);
        //Iterate for larger structures - larger that the smallest unit in the array
        for (let i = 0 ; i < this.maxLevelSize ; i++) {
            let space = ((this.GRID_SIZE*this.GRID_SIZE)**(this.maxLevelSize - i)); //represents the number of slots to skip per iteration
                for (let j = 0 ; j < this.tictac.getArraySize()/space ; j++) {
                    let relevantSlot = this.tictac.getSlot(j*space);
                    let isOwned = this.tictac.isSpotOwnedOrFull(j*space, this.maxLevelSize - i + 1);
                    if (relevantSlot*-1 == (this.maxLevelSize - i) && !isOwned) {
                        this.drawIcon(i,j*space + 1,j); //Draw Icon if negative and iterating at equivalent levelsize
                    // } else if (relevantSlot*-1 > (this.maxLevelSize - i)) {
                    //     i += (this.GRID_SIZE*this.GRID_SIZE)**(-1*relevantSlot) - 1; //Skip to the next open spot
                    } else if (isOwned) {
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
    private drawTicTac(levelSize: number,cacheIndex: number) {
        let size = this.calculateSize(levelSize);
        let x = this.cache[levelSize][cacheIndex][0];
        let y = this.cache[levelSize][cacheIndex][1];
        this.sketch.strokeWeight(1);
        for (let i = 0 ; i < this.lineNum ; i++) {
            this.sketch.line(x + (size/this.GRID_SIZE)*(i+1),y,x + (size/this.GRID_SIZE)*(i+1),y + size);
            this.sketch.line(x,y+(size/this.GRID_SIZE)*(i+1),x + size,y + (size/this.GRID_SIZE) * (i+1));
        }
    }

    private drawIcon(levelSize: number, tictacIndex: number, cacheIndex: number) {
        //Get the size
        let size = this.calculateSize(levelSize);
        //Get the coordinates from the cache
        let x = this.cache[levelSize][cacheIndex][0];
        let y = this.cache[levelSize][cacheIndex][1];
        this.sketch.strokeWeight(1);
        let slot = this.tictac.getOwner(tictacIndex)
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
                this.sketch.noFill();
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
    private calculateSize(levelSize: number) {
        return this.gridSize*((TicTacBoard.BOARD_SHRINK_CONSTANT/(this.GRID_SIZE))**(levelSize));
    }

    /**
     * Calculates the margin size between the edge of the an item grid and the tictac it is inside of.
     * @param {*} levelSize 
     * @returns margin size (float)
     */
    private calculateMarginSize(levelSize: number) {
        return ((this.calculateSize(levelSize)/TicTacBoard.BOARD_SHRINK_CONSTANT) * (1 - TicTacBoard.BOARD_SHRINK_CONSTANT));
    }

    /**
     * @method getCacheIndex
     * @description This tictac returns the index (second array dimension) of the cache coordinates for the selected position.
     * This is done because the selectedIndex stored in tictac is absolute.
     */
    private getCacheIndex(): number {
        return Math.floor(this.tictac.getSelectedIndex()/(Math.pow(this.GRID_SIZE*this.GRID_SIZE,this.tictac.getLevelSize() - this.tictac.getSelectedLevel())));
    }

    /**
     * This method moves the cursor up
     */
    public cursorUp() {
        if (this.isSelected()) {
            if (this.cursorRow <= 0) {
                this.cursorRow = this.GRID_SIZE - 1;
            } else {
                this.cursorRow -= 1;
            }
        }
    }

    /**
     * This method moves the cursor down
     */
    public cursorDown() {
        if (this.isSelected()) {
            if (this.cursorRow >= this.GRID_SIZE - 1) {
                this.cursorRow = 0;
            } else {
                this.cursorRow += 1;
            }
        }
    }

    /**
     * This method moves the cursor left
     */
    public cursorLeft() {
        if (this.isSelected()) {
            if (this.cursorCol <= 0) {
                this.cursorCol = this.GRID_SIZE - 1;
            } else {
                this.cursorCol -= 1;
            }
        }
    }
    
    /**
     * This method moves the cursor right
     */
    public cursorRight() {
        if (this.isSelected()) {
            if (this.cursorCol >= this.GRID_SIZE - 1) {
                this.cursorCol = 0;
            } else {
                this.cursorCol += 1;
            }
        }
    }

    /**
     * This method requests a change to be made to the board
     */
    private playMove() {
        //*Modify the tictac. at the spot that is currently selected 
        //*This method must be called assuming that the player is on the right tile
        //TODO: This method must already know the current turn. should take no parameters.
        //* invoke these methods through the game manag
        let state = this.game.playMove(this.cursorCol,this.cursorRow)
        if (state != TicTacState.ERROR) {
            this.cursorCol = 0;
            this.cursorRow = 0;
            if (state == TicTacState.WIN) {
                this.setSelected(false);
            }
            return;
        } 
        //TODO: Make the cursor wobble a little bit.

    }
    
    /**
     * This method renders the cursor on the tictac
     */
    private renderCursor() {
            this.sketch.rectMode(this.sketch.CORNER);
            this.sketch.noFill();
            this.sketch.strokeWeight(5);
            this.sketch.rect(this.cache[this.tictac.getSelectedLevel()][this.getCacheIndex() + this.cursorRow*this.GRID_SIZE + this.cursorCol][0],
                this.cache[this.tictac.getSelectedLevel()][this.getCacheIndex() + this.cursorRow*this.GRID_SIZE + this.cursorCol][1],
                this.calculateSize(this.tictac.getSelectedLevel()),
                this.calculateSize(this.tictac.getSelectedLevel()));
    }

    /**
     * This method is responsible for selecting the tictac.
     */
    public selectTicTac() {
        if (this.tictac.getSelectedLevel() == this.tictac.getLevelSize()) {
            this.playMove();
        } else {
            this.tictac.selectSlot(this.cursorCol,this.cursorRow);
            this.cursorCol = 0;
            this.cursorRow = 0;
        }   
    }

    /**
     * @method deselectTicTac
     * @description This method is responsible for deselecting a TicTac (but is this something you want to do?)
     */
    public deselectTicTac() {
        this.isConfirmed = false;
    }

    /**
     * This method is responsible for deleselecting the tictac
     */
    public reset() {
        this.selected = false;
        this.isConfirmed = false;
    }

    //These are all 

    public confirm() {
        this.isConfirmed = true;
    }

    public setSelected(status: boolean): void {
        this.selected = status;
    }

    public isSelected(): boolean {
        return this.selected;
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }
}


