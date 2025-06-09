/**
 * @file Floater.ts
 * @description This file is responsible for creating the sliders
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import MenuItem from "./MenuItem";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize } from "../sketch";

export default class Slider implements MenuItem {

    private sketch:p5
    private selected: boolean;
    private x: number;
    private y: number;
    private width: number;
    private strokeWidth: number;
    private maxValue: number;
    private minValue: number;
    private increment: number;
    private currentValue: number;
    private keylistener: KeyListener;
    private text: string
    
    constructor(sketch: p5, keylistener: KeyListener, x: number, y: number, width: number, strokeWidth: number, minValue: number, maxValue: number, increment: number, defaultValue?: number, text?: string) {
        this.sketch = sketch;
        this.selected = false;
        this.x = x;
        this.y = y;
        this.width = width;
        this.strokeWidth = strokeWidth;
        this.maxValue = maxValue;
        this.increment = increment;
        this.currentValue = defaultValue || 0;
        this.keylistener = keylistener
        this.minValue = minValue;
        this.text = text || "";

    }

    // MENUITEM METHODS

    public isSelected(): boolean {
        return this.selected;
    }

    public setSelected(status: boolean): void 
    {
        this.selected = status;
    }

    public reset() {
        this.selected = false;
    }

    public confirm() {

    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public draw(keyEvent: KEY_EVENTS): void {
        if (this.selected) {
            this.keylistener.enableKey([KEY_EVENTS.LEFT, KEY_EVENTS.RIGHT]);
        } 

        this.sketch.push();
            //The slider should have a line drawn accross the screen of any thickness and any width
            this.sketch.stroke(255);
            this.sketch.strokeWeight(this.strokeWidth);
            this.sketch.line(this.x - this.width/2, this.y, this.x + this.width/2, this.y);
            //Draw the notches at the end of the line
            this.sketch.fill(255);
            this.sketch.rectMode(this.sketch.CENTER);
            this.sketch.rect(this.x - this.width/2, this.y, this.strokeWidth, this.strokeWidth*5);
            this.sketch.rect(this.x + this.width/2, this.y, this.strokeWidth, this.strokeWidth*5);
            //Player selection notch
            this.sketch.rect(this.x - this.width/2 + (this.currentValue - this.minValue)*(this.width/(this.maxValue-this.minValue)) , this.y, this.strokeWidth/2, this.strokeWidth*5);
            //TODO: Draw a number beside the slider that shows the current value of the slider.
            //This is where the marker will be drawn for if the slider is being hovered over by the user or not.
            if (this.selected) {
                this.sketch.noFill();
                this.sketch.stroke(255, 255, 255); // Yellow color for the rectangle
                this.sketch.strokeWeight(2);
                this.sketch.rectMode(this.sketch.CORNER);
                this.sketch.rect(this.x - this.width/2 - this.strokeWidth - 10, this.y - this.strokeWidth * 3 - 10, this.width + this.strokeWidth * 2 + 20, this.strokeWidth * 6 + 20);
            }
            
            //Center text on top of the slider
            this.sketch.fill(255);
            this.sketch.strokeWeight(1);
            this.sketch.textSize(getCanvasSize()*0.025);
            this.sketch.text(this.text,this.x,this.y - 50);
            //Center text underneath the slider
            this.sketch.strokeWeight(1);
            this.sketch.text(this.currentValue,this.x, this.y + 50)

        this.sketch.pop();

        if (this.selected) {
            if (keyEvent === KEY_EVENTS.LEFT) {
                this.incrementSlider(-1);
            } else if (keyEvent === KEY_EVENTS.RIGHT) {
                this.incrementSlider(1);
            }
        }
        

        if (this.selected) {
            this.keylistener.disableKey([KEY_EVENTS.LEFT, KEY_EVENTS.RIGHT]);
        }
    }

    // END OF MENUITEM METHODS

    /**
     * @method valueToDistance
     * @description This method converts the value of the slider to a pixel distance of the notch along the slider
     * @param value {number} - The value of the slider
     * @returns {number} - The distance of the notch along the slider
     */
    private valueToDistance(value: number) {
        return (value / this.maxValue) * this.width;
    }

    /**
     * @method incrementSlider
     * @description This method increments thes slider by the increment value (in number of positions)
     * @param increment {number} - The number of positions to increment the slider by
     */ 
    private incrementSlider(direction: number) {
        this.currentValue += this.increment*direction;
        if (this.currentValue > this.maxValue) {
            this.currentValue = this.maxValue;
        } else if (this.currentValue < this.minValue) {
            this.currentValue = this.minValue;
        }
        //TODO: Add an animation for the slider to move between points - initiate that animation here.
    }

    

}