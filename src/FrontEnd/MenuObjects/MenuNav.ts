/**
 * @file ButtonNav.ts
 * @description This class allows buttons to be grouped together to be navigated bewteen using a controllers
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import MenuItem from './MenuItem'

/**
 * @class ButtonNav
 * @description This class is used to create a button navigation system
 */
export default class MenuNav {
    private itemArray: MenuItem[];
    private currentlySelected: MenuItem;

    /**
     * @constructor
     * @param {MenuItem[]} itemArray 
     */
    constructor(itemArray: MenuItem[]) {
        //this is the array of buttons
        this.itemArray = itemArray;
        //currently selected button
        this.currentlySelected = itemArray[0];
        this.currentlySelected.setSelected(true);
    }

    /**
     * @method getCurrenlySelected
     * @description This method returns the currently selected button
     * @returns {MenuItem}
     */
    public getCurrentlySelected(): MenuItem
    {
        return this.currentlySelected;
    } 
    /**
     * @method drawAll
     * @description This method is intended to draw all of the buttons
     */
    public drawAll(): void {
        for (let i = 0; i < this.itemArray.length; i++) {
            this.itemArray[i].draw();
        }
    }

    /**
     * @method reset
     * @description This method resets all of the buttons
     */
    public reset(): void {
        for (let i = 0; i < this.itemArray.length; i++) {
            this.itemArray[i].reset();
        }
        this.currentlySelected = this.itemArray[0];
        this.currentlySelected.setSelected(true);
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
        let in_range: MenuItem[] = [];

        //finding all of the watchamacallits in a certain direction
        for (let i = 0; i < this.itemArray.length; i++) {
            if (this.relevantValue(this.itemArray[i],direction) > this.relevantValue(this.currentlySelected,direction) && direction_multiplier == 1) {

                in_range.push(this.itemArray[i]);
                foundwithin = true;
            }

            if (this.relevantValue(this.itemArray[i],direction) < this.relevantValue(this.currentlySelected,direction) && direction_multiplier == -1) {
                in_range.push(this.itemArray[i]);
                foundwithin = true;
            }
        }

        //findind the cloest in the other coordinate
        for (let i = 0; i < in_range.length; i++) {
            if (Math.abs(this.oppositeRelevantValue(this.currentlySelected,direction) - this.oppositeRelevantValue(in_range[i],direction)) < Math.abs(this.oppositeRelevantValue(this.currentlySelected,direction) - this.oppositeRelevantValue(in_range[closestButton],direction))) {
                closestButton = i;
            }
        }
        if (foundwithin) {
            return this.itemArray.indexOf(in_range[closestButton]);
        } else {
            return this.itemArray.indexOf(this.currentlySelected);
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
        if (this.itemArray[closest] != this.currentlySelected) {
            this.itemArray[closest].setSelected(true);
            this.currentlySelected.setSelected(false);
            this.currentlySelected = this.itemArray[closest];
        }
    }


    /**
     * @method relevantValue
     * @description this function will return the relevant coordinate based on the direction it is given
     * @param direction {number}
     * @param index {number}
     * @returns the relevant coordinate
     */
    private relevantValue(item: MenuItem,direction: number): number 
    {
        if (direction == 0 || direction == 2) {
            return item.getY();
        } else {
            return item.getX();
        }
    }

    /**
     * @method oppositeRelevantValue
     * @description This method returns the opposite relevant value based on the direction it is given
     * @param direction 
     * @returns the opposite relevant value
     */
    private oppositeRelevantValue(item: MenuItem, direction: number): number 
    {
        if (direction == 0 || direction == 2) {
            return item.getX();
        } else {
            return item.getY();
        }
    }

    /**
     * @method select
     * @description This method selects a button
     * @param {number} index 
     */
    public select(index: number): void 
    {
        this.itemArray[index].setSelected(true);
    }

    /**
     * @method unselect
     * @description This method deselects a button
     * @param {number} index 
     */
    public unselect(index: number): void
    {
        this.itemArray[index].setSelected(false);
    }

    /**
     * @method changeSelected
     * @description This method changes the selected button
     * @param {number} index 
     */
    public changeSelected(index: number): void
    {
        this.unselect(this.itemArray.indexOf(this.currentlySelected));
        this.currentlySelected = this.itemArray[index];
        this.select(index);
    }

    /**
     * @method getLength
     * @description return the number of items in the button nav
     * @return number
     */
    public getLength() {
        return this.itemArray.length;
    }

    /**
     * @method getAtIndex
     * @description return the item at a given index
     * @param {number} index
     */
    public getAtIndex(index: number): MenuItem {
        return this.itemArray[index];
    }

    /**
     * @method addItem
     * @description This method adds an item to the MenuItem arra
     * @param {MenuItem} item
     */
    public addItem(item: MenuItem): void {
        this.itemArray.push(item);
    }

    /**
     * @method removeItem
     * @description This method removes an item from the MenuItem array
     * @param {MenuItem | number} item
     */
    public removeItem(item: MenuItem | number): void {
        if (typeof item === 'number') {
            //If the parameter is a number, remove item at that index
            this.itemArray.splice(item,1);
        } else {
            //If the parameter is a menu item
            const index = this.itemArray.indexOf(item);
            if (index > -1) {
                this.itemArray.splice(index, 1);
            }
        }    
    }
}
