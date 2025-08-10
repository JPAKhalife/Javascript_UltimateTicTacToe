/**
 * @file Floater.ts
 * @description This file is responsible for creating the sliders
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import BaseMenuItem from "./BaseMenuItem";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize } from "../sketch";

export default class Slider extends BaseMenuItem {

    private width: number;
    private strokeWidth: number;
    private maxValue: number;
    private minValue: number;
    private increment: number;
    private currentValue: number;
    private keylistener: KeyListener;
    private text: string;
    
    constructor(sketch: p5, keylistener: KeyListener, x: number, y: number, width: number, strokeWidth: number, minValue: number, maxValue: number, increment: number, defaultValue?: number, text?: string) {
        super(sketch, x, y, 255)
        this.width = width;
        this.strokeWidth = strokeWidth;
        this.maxValue = maxValue;
        this.increment = increment;
        this.currentValue = defaultValue || 0;
        this.keylistener = keylistener
        this.minValue = minValue;
        this.text = text || "";

    }

    public reset() {
        this.setSelected(false);
    }

    public draw(keyEvent: KEY_EVENTS): void {
        if (this.isSelected()) {
            this.keylistener.enableKey([KEY_EVENTS.LEFT, KEY_EVENTS.RIGHT]);
        } 

        this.getSketch().push();
            //The slider should have a line drawn accross the screen of any thickness and any width
            this.getSketch().stroke(255);
            this.getSketch().strokeWeight(this.strokeWidth);
            this.getSketch().line(this.getX() - this.width/2, this.getY(), this.getX() + this.width/2, this.getY());
            //Draw the notches at the end of the line
            this.getSketch().fill(255);
            this.getSketch().rectMode(this.getSketch().CENTER);
            this.getSketch().rect(this.getX() - this.width/2, this.getY(), this.strokeWidth, this.strokeWidth*5);
            this.getSketch().rect(this.getX() + this.width/2, this.getY(), this.strokeWidth, this.strokeWidth*5);
            //Player selection notch
            this.getSketch().rect(this.getX() - this.width/2 + (this.currentValue - this.minValue)*(this.width/(this.maxValue-this.minValue)) , this.getY(), this.strokeWidth/2, this.strokeWidth*5);
            //TODO: Draw a number beside the slider that shows the current value of the slider.
            //This is where the marker will be drawn for if the slider is being hovered over by the user or not.
            if (this.isSelected()) {
                this.getSketch().noFill();
                this.getSketch().stroke(255, 255, 255); // Yellow color for the rectangle
                this.getSketch().strokeWeight(2);
                this.getSketch().rectMode(this.getSketch().CORNER);
                this.getSketch().rect(this.getX() - this.width/2 - this.strokeWidth - 10, this.getY() - this.strokeWidth * 3 - 10, this.width + this.strokeWidth * 2 + 20, this.strokeWidth * 6 + 20);
            }
            
            //Center text on top of the slider
            this.getSketch().fill(255);
            this.getSketch().strokeWeight(1);
            this.getSketch().textSize(getCanvasSize()*0.025);
            this.getSketch().text(this.text,this.getX(),this.getY() - 40);
            //Center text underneath the slider
            this.getSketch().strokeWeight(1);
            this.getSketch().text(this.currentValue,this.getX(), this.getY() + 35)

        this.getSketch().pop();

        if (this.isSelected()) {
            if (keyEvent === KEY_EVENTS.LEFT) {
                this.incrementSlider(-1);
            } else if (keyEvent === KEY_EVENTS.RIGHT) {
                this.incrementSlider(1);
            }
        }
        

        if (this.isSelected()) {
            this.keylistener.disableKey([KEY_EVENTS.LEFT, KEY_EVENTS.RIGHT]);
        }
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

    /**
     * @method getValue
     * @description This method returns the current value that the slider is set to.
     * @returns number
     */
    public getValue(): number {
        return this.currentValue;
    }
}
