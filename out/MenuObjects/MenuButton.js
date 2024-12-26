"use strict";
/**
 * @file GameManager.ts
 * @description  This class is intended to create button functionality in ultimate tic tact toe
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
Object.defineProperty(exports, "__esModule", { value: true });
var sketch_1 = require("../sketch");
var MenuButton = /** @class */ (function () {
    function MenuButton(sketch, x, y, phrase, length, width, textsize, opacity) {
        if (opacity === void 0) { opacity = 255; }
        //whether or not the button is selected
        this.selected = false;
        //whether or not the button is confirmed
        this.confirmed = false;
        //the coordinates on the canvas of the button
        this.x = x;
        this.y = y;
        //the word in the button
        this.phrase = phrase;
        //the current animation time of the button
        this.animationTime = 0;
        //length and width of the button
        this.length = length;
        this.width = width;
        //current length and width of the button
        this.currentLength = length;
        this.currentWidth = width;
        //this is the text size 
        this.textSize = textsize;
        this.currentTextSize = textsize;
        //this is the current colour of the button
        this.currentButtonFill = MenuButton.DEFAULT_BUTTON_SHADE;
        //this is the current colour of the text in the button
        this.currentTextFill = MenuButton.SELECTED_BUTTON_SHADE;
        //variable that will control the amount the confirmed square grows by
        this.cw = 0;
        this.cl = 0;
        //this will control the opacity of the ring that occurs when a selection is confirmed
        this.opacity = opacity;
        //contains the status of the confirmed animation
        this.confirmedAnimation = false;
        this.sketch = sketch;
    }
    /**
     * @method standardButton
     * @description This method is intended to draw the standard appearance of the button
     * @returns {void}
     */
    MenuButton.prototype.standardButton = function () {
        this.sketch.textFont('Arial');
        //checking if the animation time is finished
        if (this.animationTime == 0) {
            this.sketch.noFill();
        }
        else {
            //adding to the length and width
            this.currentWidth -= ((this.width) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentLength -= ((this.length) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;
            //changing the button fill to the desired fill
            this.currentButtonFill -= (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentTextFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.sketch.fill(this.currentButtonFill, this.opacity);
            this.animationTime--;
        }
        this.sketch.strokeWeight(1);
        this.sketch.stroke(255, this.opacity);
        this.sketch.rectMode(this.sketch.CENTER);
        this.sketch.rect(this.x * (0, sketch_1.getCanvasSize)(), this.y * (0, sketch_1.getCanvasSize)(), this.currentWidth * (0, sketch_1.getCanvasSize)(), this.currentLength * (0, sketch_1.getCanvasSize)());
        this.sketch.textSize(this.currentTextSize);
        this.sketch.fill(this.currentTextFill, this.opacity);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text(this.phrase, this.x * (0, sketch_1.getCanvasSize)(), this.y * (0, sketch_1.getCanvasSize)(), this.currentWidth * (0, sketch_1.getCanvasSize)(), this.currentLength * (0, sketch_1.getCanvasSize)());
    };
    //this method resets all variables so that the buttons can be pressed again.
    /**
     * @method reset
     * @description This method resets all variables so that the buttons can be pressed again
     */
    MenuButton.prototype.reset = function () {
        this.cw = 0;
        this.cl = 0;
        this.opacity = 255;
        this.confirmed = false;
        this.confirmedAnimation = false;
        this.animationTime = 0;
        this.selected = false;
        this.currentLength = this.length;
        this.currentWidth = this.width;
        this.currentTextFill = 255;
        this.currentButtonFill = 0;
        this.currentTextSize = this.textSize;
    };
    /**
     * @method isSelected
     * @description This method checks if the button is selected
     * @returns {boolean}
     */
    MenuButton.prototype.isSelected = function () {
        if (this.selected == true) {
            return true;
        }
        else {
            return false;
        }
    };
    /**
     * @method setStatus
     * @description This method sets the selected status of the button
     * @param status
     */
    MenuButton.prototype.setStatus = function (status) {
        this.selected = status;
    };
    /**
     * @method selectedButton
     * @description This method draws the button when it has been selected and does the animation for when it is selected
     */
    MenuButton.prototype.selectedButton = function () {
        this.sketch.textFont('Arial');
        //checking if the animation time is finished
        if (this.animationTime > MenuButton.SELECTED_ANIMATION_TIME) {
        }
        else {
            //adding to the length and width
            this.currentWidth += ((this.width) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentLength += ((this.length) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;
            //changing the button fill to the desired fill
            this.currentButtonFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentTextFill -= (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.animationTime++;
        }
        this.sketch.strokeWeight(1);
        this.sketch.stroke(255, this.opacity);
        this.sketch.fill(this.currentButtonFill, this.opacity);
        this.sketch.rect(this.x * (0, sketch_1.getCanvasSize)(), this.y * (0, sketch_1.getCanvasSize)(), this.currentWidth * (0, sketch_1.getCanvasSize)(), this.currentLength * (0, sketch_1.getCanvasSize)());
        this.sketch.textSize(this.currentTextSize);
        this.sketch.fill(this.currentTextFill, this.opacity);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text(this.phrase, this.x * (0, sketch_1.getCanvasSize)(), this.y * (0, sketch_1.getCanvasSize)(), this.currentWidth * (0, sketch_1.getCanvasSize)(), this.currentLength * (0, sketch_1.getCanvasSize)());
    };
    /**
     * @method confirmedButton
     * @description This method draws the button when it has been confirmed and does the animation for when it is confirmed
     */
    MenuButton.prototype.confirmedButton = function () {
        this.sketch.textFont('Arial');
        var first_half = true;
        //checking if the animation time is finished
        if (this.animationTime > MenuButton.CONFIRMED_ANIMATION_TIME) {
            this.opacity = 0;
            this.confirmedAnimation = true;
        }
        else {
            this.cl += ((MenuButton.GROWTH_PERCENT / 100) * (this.currentLength * (0, sketch_1.getCanvasSize)()) + (this.currentLength * (0, sketch_1.getCanvasSize)())) / MenuButton.CONFIRMED_ANIMATION_TIME;
            this.cw += ((MenuButton.GROWTH_PERCENT / 100) * (this.currentWidth * (0, sketch_1.getCanvasSize)()) + (this.currentWidth * (0, sketch_1.getCanvasSize)())) / MenuButton.CONFIRMED_ANIMATION_TIME;
            this.currentTextFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.CONFIRMED_ANIMATION_TIME;
            this.opacity -= (255 / MenuButton.CONFIRMED_ANIMATION_TIME);
            this.animationTime++;
        }
        this.sketch.noStroke();
        this.sketch.fill(255);
        //fill(this.currentButtonFill);
        this.sketch.rect(this.x * (0, sketch_1.getCanvasSize)(), this.y * (0, sketch_1.getCanvasSize)(), (this.currentWidth * (0, sketch_1.getCanvasSize)()) - this.cw, (this.currentLength * (0, sketch_1.getCanvasSize)()) - this.cl);
        this.sketch.textSize(this.currentTextSize);
        this.sketch.fill(this.currentTextFill);
        this.sketch.tint(0, 255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text(this.phrase, this.x * (0, sketch_1.getCanvasSize)(), this.y * (0, sketch_1.getCanvasSize)(), this.currentWidth * (0, sketch_1.getCanvasSize)(), this.currentLength * (0, sketch_1.getCanvasSize)());
        //this is the second rectangle that will be acting as the 
        this.sketch.stroke(255, this.opacity);
        this.sketch.fill(0);
        this.sketch.strokeWeight(MenuButton.OUTLINE_WEIGHT);
        this.sketch.rect(this.x * (0, sketch_1.getCanvasSize)(), this.y * (0, sketch_1.getCanvasSize)(), MenuButton.OUTLINE_WEIGHT + this.cw, this.cl + MenuButton.OUTLINE_WEIGHT);
    };
    /**
     * @method fade
     * @description This method fades the button
     */
    MenuButton.prototype.fade = function () {
        this.opacity -= (255 / (MenuButton.CONFIRMED_ANIMATION_TIME / 4));
    };
    /**
     * @method isConfirmed
     * @description This method checks if the button is confirmed
     * @returns {boolean}
     */
    MenuButton.prototype.isConfirmed = function () {
        return this.confirmed;
    };
    /**
     * @method isConfirmedAnimationDone
     * @description This method checks if the confirmed animation is done
     * @returns {boolean}
     */
    MenuButton.prototype.isConfirmedAnimationDone = function () {
        return this.confirmedAnimation;
    };
    /**
     * @method confirm
     * @description This method confirms the button
     */
    MenuButton.prototype.confirm = function () {
        this.confirmed = true;
    };
    /**
     * @method draw
     * @description This method is intended to draw the button
     */
    MenuButton.prototype.draw = function () {
        if (this.confirmed == true) {
            this.confirmedButton();
        }
        else if (this.isSelected() == false) {
            this.standardButton();
        }
        else if (this.isSelected() == true) {
            this.selectedButton();
        }
    };
    /**
     * @method relevantValue
     * @description this function will return the relevant coordinate based on the direction it is given
     * @param direction {number}
     * @returns the relevant coordinate
     */
    MenuButton.prototype.relevantValue = function (direction) {
        if (direction == 0 || direction == 2) {
            return this.y;
        }
        else {
            return this.x;
        }
    };
    /**
     * @method oppositeRelevantValue
     * @description This method returns the opposite relevant value based on the direction it is given
     * @param direction
     * @returns the opposite relevant value
     */
    MenuButton.prototype.oppositeRelevantValue = function (direction) {
        if (direction == 0 || direction == 2) {
            return this.x;
        }
        else {
            return this.y;
        }
    };
    /**
     * @method fadeIn
     * @description controls the fading in animation of all buttons
     * @param time {number}
     */
    MenuButton.prototype.fadeIn = function (time) {
        this.opacity += (255 / (time));
    };
    /**
     * @method setOpacity
     * @description This is a setter that sets the opacity of the button
     * @param opacity {number}
     */
    MenuButton.prototype.setOpacity = function (opacity) {
        this.opacity = opacity;
    };
    //This is the default shade of gray of the button fill (0-255)
    MenuButton.DEFAULT_BUTTON_SHADE = 0;
    //this is the desired shade of gray of the button when it is seleceted
    MenuButton.SELECTED_BUTTON_SHADE = 255;
    //percent of the length or width of the convas that the board will take up
    //This is the percentage that the button's size will grow when it is selected
    MenuButton.GROWTH_PERCENT = 25;
    MenuButton.CONFIRMED_GROWTH_PERCENT = 100;
    MenuButton.SELECTED_ANIMATION_TIME = 5;
    MenuButton.CONFIRMED_ANIMATION_TIME = 60;
    //the outline of the second rect around the utton
    MenuButton.OUTLINE_WEIGHT = 5;
    return MenuButton;
}());
exports.default = MenuButton;
