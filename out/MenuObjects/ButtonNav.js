"use strict";
/**
 * @file ButtonNav.ts
 * @description This class allows buttons to be grouped together to be navigated bewteen using a controllers
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class ButtonNav
 * @description This class is used to create a button navigation system
 */
var ButtonNav = /** @class */ (function () {
    /**
     * @constructor
     * @param {Button[]} buttonArray
     */
    function ButtonNav(buttonArray) {
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
    ButtonNav.prototype.drawAll = function () {
        for (var i = 0; i < this.buttonArray.length; i++) {
            this.buttonArray[i].draw();
        }
    };
    /**
     * @method reset
     * @description This method resets all of the buttons
     */
    ButtonNav.prototype.reset = function () {
        for (var i = 0; i < this.buttonArray.length; i++) {
            this.buttonArray[i].reset();
        }
        this.currentlySelected = this.buttonArray[0];
        this.currentlySelected.setStatus(true);
    };
    //this function is meant to confriemd a button
    /**
     * @method confirm
     * @description This method confirms a button
     */
    ButtonNav.prototype.confirm = function () {
        this.currentlySelected.confirm();
    };
    //this will find the closest button given a direction
    /**
     * @method findClosest
     * @description This method finds the closest button given a direction
     * @param {*} direction
     * */
    ButtonNav.prototype.findClosest = function (direction) {
        //used to factor in the direction of the 
        var direction_multiplier = 1;
        //initial value for comparison
        var closestButton = 0;
        var foundwithin = false;
        //getting the direction multiplier
        if (direction == 2 || direction == 3) {
            direction_multiplier = -1;
        }
        //first screening
        var in_range = [];
        //finding all of the watchamacallits in a certain direction
        for (var i = 0; i < this.buttonArray.length; i++) {
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
        for (var i = 0; i < in_range.length; i++) {
            if (Math.abs(this.currentlySelected.oppositeRelevantValue(direction) - in_range[i].oppositeRelevantValue(direction)) < Math.abs(this.currentlySelected.oppositeRelevantValue(direction) - in_range[closestButton].oppositeRelevantValue(direction))) {
                closestButton = i;
            }
        }
        if (foundwithin) {
            return this.buttonArray.indexOf(in_range[closestButton]);
        }
        else {
            return this.buttonArray.indexOf(this.currentlySelected);
        }
    };
    //this will select the closest button given a direction
    /**
     * @method selectClosest
     * @description This method selects the closest button given a direction
     * @param {number} direction
     */
    ButtonNav.prototype.selectClosest = function (direction) {
        var closest = this.findClosest(direction);
        if (this.buttonArray[closest] != this.currentlySelected) {
            this.buttonArray[closest].setStatus(true);
            this.currentlySelected.setStatus(false);
            this.currentlySelected = this.buttonArray[closest];
        }
    };
    /**
     * @method select
     * @description This method selects a button
     * @param {number} index
     */
    ButtonNav.prototype.select = function (index) {
        this.buttonArray[index].setStatus(true);
    };
    /**
     * @method unselect
     * @description This method deselects a button
     * @param {number} index
     */
    ButtonNav.prototype.unselect = function (index) {
        this.buttonArray[index].setStatus(false);
    };
    /**
     * @method changeSelected
     * @description This method changes the selected button
     * @param {number} index
     */
    ButtonNav.prototype.changeSelected = function (index) {
        this.unselect(this.buttonArray.indexOf(this.currentlySelected));
        this.currentlySelected = this.buttonArray[index];
        this.select(index);
    };
    return ButtonNav;
}());
exports.default = ButtonNav;
