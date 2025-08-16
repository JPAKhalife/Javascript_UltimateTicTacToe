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
    private animationTime: number = 0; // For tracking animation phase

    constructor(sketch: p5, keylistener: KeyListener, xPercent: number, yPercent: number, widthPercent: number, strokeWidthPercent: number, minValue: number, maxValue: number, increment: number, defaultValue?: number, text?: string) {
        super(sketch, xPercent, yPercent, 255)
        this.width = widthPercent;
        this.strokeWidth = strokeWidthPercent;
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

    public draw(currentCanvasSize?: number, keyEvent?: KEY_EVENTS): void {
        const canvasSize = currentCanvasSize || getCanvasSize();

        if (this.isSelected()) {
            this.keylistener.enableKey([KEY_EVENTS.LEFT, KEY_EVENTS.RIGHT]);
            // Increment animation time for selected state animations
            this.animationTime += 0.05;
        }

        this.getSketch().push();
        //The slider should have a line drawn accross the screen of any thickness and any width
        this.getSketch().stroke(255, this.getOpacity());
        this.getSketch().strokeWeight(this.strokeWidth * canvasSize);
        this.getSketch().line(
            this.getX(canvasSize) - (this.width * canvasSize) / 2,
            this.getY(canvasSize),
            this.getX(canvasSize) + (this.width * canvasSize) / 2,
            this.getY(canvasSize)
        );
        //Draw the notches at the end of the line
        this.getSketch().fill(255, this.getOpacity());
        this.getSketch().rectMode(this.getSketch().CENTER);
        this.getSketch().rect(
            this.getX(canvasSize) - (this.width * canvasSize) / 2,
            this.getY(canvasSize),
            this.strokeWidth * canvasSize,
            this.strokeWidth * 5 * canvasSize
        );
        this.getSketch().rect(
            this.getX(canvasSize) + (this.width * canvasSize) / 2,
            this.getY(canvasSize),
            this.strokeWidth * canvasSize,
            this.strokeWidth * 5 * canvasSize
        );
        // Calculate position of the selection notch
        const notchX = this.getX(canvasSize) - (this.width * canvasSize) / 2 + 
            (this.currentValue - this.minValue) * ((this.width * canvasSize) / (this.maxValue - this.minValue));
        const notchY = this.getY(canvasSize);
        
        // Player selection notch - slightly larger than end markers but still thin
        if (this.isSelected()) {
            // Make the notch pulse in opacity when selected
            const pulseOpacity = Math.sin(this.animationTime) * 127 + 160; // Value between 0 and 255
            
            this.getSketch().push();
                this.getSketch().noFill();
                this.getSketch().stroke(255, pulseOpacity * (this.getOpacity() / 255));
                this.getSketch().rect(
                    notchX,
                    notchY,
                    (this.strokeWidth * canvasSize) / 3, // Thinner width
                    this.strokeWidth * 6 * canvasSize
                );
            this.getSketch().pop();
        } else {
            // Default notch when not selected - matching the selected state's dimensions for consistency
            this.getSketch().push();
                this.getSketch().noFill();
                this.getSketch().stroke(255, this.getOpacity());
                this.getSketch().rect(
                    notchX,
                    notchY,
                    (this.strokeWidth * canvasSize) / 3, // Same width as selected state
                    this.strokeWidth * 6 * canvasSize  // Same height as selected state
                );
            this.getSketch().pop();
        }

        //Center text on top of the slider
        this.getSketch().textAlign(this.getSketch().CENTER);
        this.getSketch().fill(255, this.getOpacity());
        this.getSketch().strokeWeight(1);
        this.getSketch().textSize(0.025 * canvasSize);
        this.getSketch().text(this.text, this.getX(canvasSize), this.getY(canvasSize) - (0.04 * canvasSize));
        //Center text underneath the slider
        this.getSketch().strokeWeight(1);
        this.getSketch().text(this.currentValue, this.getX(canvasSize), this.getY(canvasSize) + (0.040 * canvasSize));

        this.getSketch().pop();

        if (keyEvent) {
            if (this.isSelected()) {
                if (keyEvent === KEY_EVENTS.LEFT) {
                    this.incrementSlider(-1);
                } else if (keyEvent === KEY_EVENTS.RIGHT) {
                    this.incrementSlider(1);
                }
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
        this.currentValue += this.increment * direction;
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
