/**
 * @file LoadingSpinner.ts
 * @description This file is responsible for defining the loading spinner
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import BaseMenuItem from "./BaseMenuItem";
import { whiteTicTac } from "../sketch";


//The most basic settings of this object when initializing result
export default class LoadingSpinner extends BaseMenuItem {
    
    //Configuration members
    private fadeFunction: ((counter: number) => number);
    private rotationFunction: ((counter: number) => number);
    private doRadians: boolean;

    private rotationAngle: number;
    private width: number;
    private image: p5.Image;
    private rotationSpeed: number;
    private counter: number;


    constructor(sketch: p5, x: number, y: number, width: number, image: p5.Image = whiteTicTac, fadeFunction: ((counter: number) => number) | null = null, rotationSpeed: number = 4, initialRotation: number = 0, rotationFunction: ((counter: number) => number) | null = null, opacity: number = 255, doRadians: boolean = false) {
        super(sketch, x, y, opacity);
        this.rotationAngle = 0;
        this.image = image;
        this.width = width;
        this.rotationSpeed = rotationSpeed;
        this.rotationAngle = initialRotation;
        this.doRadians = doRadians;
        this.rotationFunction = rotationFunction || ((counter: number) => { return this.rotationAngle + this.rotationSpeed; });
        this.fadeFunction = fadeFunction || ((counter: number) => { return this.getOpacity() });
        this.counter = 0;
    }

    public draw(...args: any[]): void {
        this.getSketch().push();
            this.getSketch().imageMode(this.getSketch().CENTER);
            this.getSketch().translate(this.getX(), this.getY());
            this.getSketch().rotate(this.rotationAngle);
            this.getSketch().fill(255);
            if (this.doRadians) {
                this.getSketch().angleMode(this.getSketch().RADIANS);
            } else {
                this.getSketch().angleMode(this.getSketch().DEGREES);
            }
            this.getSketch().tint(255, this.fadeFunction(this.counter));
            this.getSketch().image(this.image, 0, 0, this.width, this.width);
        this.getSketch().pop();

        // Increment rotation angle for continuous spinning
        this.rotationAngle = this.rotationFunction(this.counter);
        this.counter = (this.counter + 2) % Number.MAX_SAFE_INTEGER; // Reset after 4.2 million years lol (just in case who knows)
    }

    //There is not really a state reset for this menuItem
    // it keeps spinning in a repeated animation.
    public reset(): void {}

    /**
     * @method getWidth
     * @description returns the width of the loading spinner
     */
    public getWidth() {
        return this.width;
    }
 }