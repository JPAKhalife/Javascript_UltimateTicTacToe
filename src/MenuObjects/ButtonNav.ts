/**
 * @file ButtonNav.ts
 * @description This class allows buttons to be grouped together to be navigated bewteen using a controllers
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import Button from './Button'

/**
 * @class ButtonNav
 * @description This class is used to create a button navigation system
 */
export default class ButtonNav {
    private buttonArray: Button[];
    private currentlySelected: Button;

    /**
     * @constructor
     * @param {Button[]} buttonArray 
     */
    constructor(buttonArray: Button[]) {
        //this is the array of buttons
        this.buttonArray = buttonArray;
        //currently selected button
        this.currentlySelected = buttonArray[0];
        this.currentlySelected.setStatus(true);
    }

    /**
     * @method drawAll
     * @description This method is intended to draw all of the buttons
     */
    public drawAll(): void {
        for (let i = 0; i < this.buttonArray.length; i++) {
            this.buttonArray[i].draw();
        }
    }

    /**
     * @method reset
     * @description This method resets all of the buttons
     */
    public reset(): void {
        for (let i = 0; i < this.buttonArray.length; i++) {
            this.buttonArray[i].reset();
        }
        this.currentlySelected = this.buttonArray[0];
        this.currentlySelected.setStatus(true);
    }

    //this function is meant to confriemd a button
    /**
     * @method confirm
     * @description This method confirms a button
     */
    public confirm(): void {
        this.currentlySelected.confirm();
    }

    //this will find the closest button given a direction
    /**
     * @method findClosest
     * @description This method finds the closest button given a direction
     * @param {*} direction
     * */
    private findClosest(direction: number): number {
        //used to factor in the direction of the 
        let direction_multiplier = 1;

        //initial value for comparison
        let closestButton: number = 0;
        let foundwithin: boolean = false;

        //getting the direction multiplier
        if (direction == 2 || direction == 3) {
            direction_multiplier = -1;
        }
        //first screening
        let in_range: Button[] = [];

        //finding all of the watchamacallits in a certain direction
        for (let i = 0; i < this.buttonArray.length; i++) {
            if (this.buttonArray[i].relevantValue(direction) > this.currentlySelected.relevantValue(direction) && direction_multiplier == 1) {

                in_range.push(this.buttonArray[i]);
                foundwithin = true;
            }

            if (this.buttonArray[i].relevantValue(direction) < this.currentlySelected.relevantValue(direction) && direction_multiplier == -1) {
                in_range.push(this.buttonArray[i]);
                foundwithin = true;
            }
        }

        //findind the cloest in the other coordinate
        for (let i = 0; i < in_range.length; i++) {
            if (Math.abs(this.currentlySelected.oppositeRelevantValue(direction) - in_range[i].oppositeRelevantValue(direction)) < Math.abs(this.currentlySelected.oppositeRelevantValue(direction) - in_range[closestButton].oppositeRelevantValue(direction))) {
                closestButton = i;
            }
        }
        if (foundwithin) {
            return this.buttonArray.indexOf(in_range[closestButton]);
        } else {
            return this.buttonArray.indexOf(this.currentlySelected);
        }
    }

    //this will select the closest button given a direction
    /**
     * @method selectClosest
     * @description This method selects the closest button given a direction
     * @param {number} direction 
     */
    public selectClosest(direction: number): void 
    {
        let closest = this.findClosest(direction)
        if (this.buttonArray[closest] != this.currentlySelected) {
            this.buttonArray[closest].setStatus(true);
            this.currentlySelected.setStatus(false);
            this.currentlySelected = this.buttonArray[closest];
        }
    }

    /**
     * @method select
     * @description This method selects a button
     * @param {number} index 
     */
    public select(index: number): void 
    {
        this.buttonArray[index].setStatus(true);
    }

    /**
     * @method unselect
     * @description This method deselects a button
     * @param {number} index 
     */
    public unselect(index: number): void
    {
        this.buttonArray[index].setStatus(false);
    }

    /**
     * @method changeSelected
     * @description This method changes the selected button
     * @param {number} index 
     */
    public changeSelected(index: number): void
    {
        this.unselect(this.buttonArray.indexOf(this.currentlySelected));
        this.currentlySelected = this.buttonArray[index];
        this.select(index);
    }

    /**
     * @method getLength
     * @description return the number of items in the button nav
     * @return number
     */
    public getLength() {
        return this.buttonArray.length;
    }
}
