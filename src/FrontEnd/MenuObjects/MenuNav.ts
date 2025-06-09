/**
 * @file ButtonNav.ts
 * @description This class allows buttons to be grouped together to be navigated bewteen using a controllers
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from 'p5';
import KeyListener, { KEY_EVENTS } from '../KeyListener';
import MenuItem from './MenuItem'

/**
 * @class ButtonNav
 * @description This class is used to create a button navigation system
 */
export default class MenuNav {
    private itemArray: MenuItem[];
    private currentlySelected: MenuItem;
    private itemDistances: MenuItem[][];
    private keylistener: KeyListener;
    private currentKeyEvent: KEY_EVENTS;

    /**
     * @constructor
     * @param {MenuItem[]} itemArray 
     */
    constructor(itemArray: MenuItem[], sketch: p5) {
        //this is the array of buttons
        this.itemArray = itemArray;
        //currently selected button
        this.currentlySelected = itemArray[0];
        this.currentlySelected.setSelected(true);
        this.itemDistances = Array.from({ length: itemArray.length }, () => Array(4).fill(0));
        this.keylistener = new KeyListener(sketch);
        this.currentKeyEvent = KEY_EVENTS.NONE;
        this.mapElementLocations();
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
     * @description This method is intended to draw all of the buttons and detect keypresses
     */
    public drawAll(): void {
        this.currentKeyEvent = this.keylistener.listen();
        for (let i = 0; i < this.itemArray.length; i++) {
            this.itemArray[i].draw(this.currentKeyEvent);
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
     * @param {*} direction - a number in degrees
     * */
    private findClosest(direction: number): MenuItem {
        //Find the closest to the currently selected button in a given direction
        if (this.itemArray.length == 0) {
            console.warn("No items in the button navigation array.");
            return this.currentlySelected; // No items to select
        }
        if (this.currentlySelected == null) {
            console.warn("No currently selected item.");
            return this.currentlySelected; // No currently selected item
        }


        direction = direction % 360; // Normalize direction to be within 0-359 degrees

        //Find the index of currentlyselected
        let currentlySelectedIndex = this.itemArray.indexOf(this.currentlySelected);
        // Find the closest direction in the itemDistances array
        if (currentlySelectedIndex === -1) {
            console.warn("Currently selected item not found in the item array.");
            return this.currentlySelected; // Currently selected item not found
        }

        // Check if the itemDistances array is initialized
        if (!this.itemDistances || this.itemDistances.length === 0) {
            console.warn("Item distances not initialized or empty.");
            return this.currentlySelected; // Item distances not initialized
        }

        // Check which direction is closest to the direction value passed to this function
        let closestDirectionIndex = Math.round(direction / 90) % 4; // Normalize direction to one of the four cardinal directions (0, 1, 2, 3)
        return this.itemDistances[currentlySelectedIndex][closestDirectionIndex];
    }

    /**
     * @method mapElementLocations
     * @description This method will save a the closest four elements in each direction to a given element. 
     */
    public mapElementLocations(): void {
        this.itemDistances = Array.from({ length: this.itemArray.length }, () => Array(4).fill(0));
        for (let i = 0 ; i < this.itemArray.length; i++) {
            let allDistancesAndDirections: { distance: number, direction: number, destination: MenuItem }[] = [];

            // Loop through all of the items and find the closest four distances in each direction
            for (let j = 0; j < this.itemArray.length; j++) {
                if (i != j) { // Don't compare the item to itself
                    let distance = Math.sqrt(Math.pow(this.itemArray[i].getY() - this.itemArray[j].getY(), 2) + Math.pow(this.itemArray[i].getX() - this.itemArray[j].getX(), 2));
                    let rawAngle = Math.atan2(
                        this.itemArray[j].getY() - this.itemArray[i].getY(),
                        this.itemArray[j].getX() - this.itemArray[i].getX()
                    ) * (180 / Math.PI);
                    let direction = (rawAngle < 0 ? rawAngle + 360 : rawAngle);
                    allDistancesAndDirections.push({ distance: distance, direction: direction, destination: this.itemArray[j] });
                }
            }
            
            for (let z = 0 ; z < 4; z++) {
                let currentDirection = 90 * z;
                // Get all directions within a 45-degree range of the current direction
                let relevantDistances = allDistancesAndDirections.filter(item => {
                    let angleDiff = Math.abs(item.direction - currentDirection);
                    return angleDiff <= 45 || angleDiff >= 315; // 45 degrees in either direction
                });
                
                // Sort distances array by closest
                relevantDistances.sort((a, b) => a.distance - b.distance);
                
                // Check to make sure there is at least one item in the relevant distances
                if (relevantDistances.length == 0) {
                    this.itemDistances[i][z] = this.itemArray[i]; // Set to current item if no relevant distances found
                    continue;
                }
                
                // Add the shortest distance to the itemDistances array
                this.itemDistances[i][z] = relevantDistances[0].destination;
            }
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
        if (closest != this.currentlySelected) {
            closest.setSelected(true);
            this.currentlySelected.setSelected(false);
            this.currentlySelected = closest;
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
        this.mapElementLocations();
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
        this.mapElementLocations();
    }

    /**
     * @method getKeyEvent
     * @description This method returns the current key event
     * @return {KEY_EVENTS}
     */
    public getKeyEvent(): KEY_EVENTS {
        return this.currentKeyEvent;
    }
}
