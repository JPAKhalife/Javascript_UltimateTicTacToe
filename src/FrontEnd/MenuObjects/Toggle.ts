/**
 * @file Toggle.ts
 * @description This file is responsible for a toggle item like on a smartphone
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import BaseMenuItem from "./BaseMenuItem";
import { FRAMERATE, getCanvasSize } from "../sketch";

const HEIGHT_RATIO = 2;
const ANIMATION_DURATION = 15; // Animation duration in frames (at 60fps, this is 0.25 seconds)
const FILL_SPEED = 15;

export default class Toggle extends BaseMenuItem {

    //Dimensions and coordinates
    private percentSize: number;
    private selectorPos: number;

    //Animation properties
    private animating: boolean;
    private animationProgress: number;
    private startPos: number;
    private targetPos: number;
    private currentFill: number;

    //Fill animation properties
    private targetFill: number;

    constructor(sketch: p5, percentX: number, percentY: number, percentSize: number, opacity: number) {
        super(sketch, percentX, percentY, opacity);
        this.percentSize = percentSize;
        this.selectorPos = -0.25;

        // Initialize animation properties
        this.animating = false;
        this.animationProgress = 0;
        this.startPos = this.selectorPos;
        this.targetPos = this.selectorPos;
        this.currentFill = 0;

        // Initialize fill animation properties
        this.targetFill = this.currentFill;
    }


    public draw() {
        // Update animations if active
        if (this.animating) {
            this.animateSlide();
        }
        
        if (this.isSelected()) {
            this.targetFill = 255; // White when selected
        } else {
            this.targetFill = 0;   // Black when not selected
        }
        //This function animates the fill based on selected state
        this.animateFill();

        this.getSketch().push();
        this.getSketch().fill(this.currentFill);
        this.getSketch().rectMode(this.getSketch().CENTER);

        //Draw a rectangle here for the fill
        this.getSketch().rect(this.getX(), this.getY(), this.percentSize * 0.5 * getCanvasSize() + 2)


        this.getSketch().strokeWeight(1);
        this.getSketch().stroke(255);


        //Outside: two lines, two half circles
        //Lines
        this.getSketch().line(this.getX() - ((this.percentSize * getCanvasSize()) * 0.25), this.getY() + ((this.percentSize / HEIGHT_RATIO) * getCanvasSize() / 2), this.getX() + ((this.percentSize * getCanvasSize()) * 0.25), this.getY() + ((this.percentSize / HEIGHT_RATIO) * getCanvasSize() / 2));
        this.getSketch().line(this.getX() - ((this.percentSize * getCanvasSize()) * 0.25), this.getY() - ((this.percentSize / HEIGHT_RATIO) * getCanvasSize() / 2), this.getX() + ((this.percentSize * getCanvasSize()) * 0.25), this.getY() - ((this.percentSize / HEIGHT_RATIO) * getCanvasSize() / 2));
        // Left half-circle
        this.getSketch().arc(
            this.getX() - ((this.percentSize * getCanvasSize()) * 0.25),
            this.getY(),
            (this.percentSize / HEIGHT_RATIO) * getCanvasSize(),
            (this.percentSize / HEIGHT_RATIO) * getCanvasSize(),
            this.getSketch().HALF_PI,
            this.getSketch().PI + this.getSketch().HALF_PI
        );

        // Right half-circle
        this.getSketch().arc(
            this.getX() + ((this.percentSize * getCanvasSize()) * 0.25),
            this.getY(),
            (this.percentSize / HEIGHT_RATIO) * getCanvasSize(),
            (this.percentSize / HEIGHT_RATIO) * getCanvasSize(),
            this.getSketch().PI + this.getSketch().HALF_PI,
            this.getSketch().HALF_PI
        );

        //Inside oval
        this.getSketch().fill(0);
        this.getSketch().ellipse(this.getX() + this.selectorPos * getCanvasSize() * this.percentSize, this.getY(), ((this.percentSize * 0.8) / 2) * getCanvasSize(), ((this.percentSize * 0.8) / 2) * getCanvasSize());

        this.getSketch().pop();
    }

    public reset() {
        this.setConfirmed(false);
        this.selectorPos = -0.25;
        this.animating = false;
        this.animationProgress = 0;
        this.currentFill = 0;
    }

    /**
     * @method animateSlide
     * @description Animates the sliding of the toggle switch
     */
    private animateSlide() {
        if (this.animationProgress < ANIMATION_DURATION) {
            // Calculate the new position using easing for smooth animation
            const t = this.animationProgress / ANIMATION_DURATION;
            const easedT = this.easeInOutQuad(t);
            this.selectorPos = this.startPos + (this.targetPos - this.startPos) * easedT;

            // Increment the animation progress
            this.animationProgress++;
        } else {
            // Animation complete
            this.animating = false;
            this.selectorPos = this.targetPos;
        }
    }

    /**
     * @method easeInOutQuad
     * @description Quadratic easing function for smooth animation
     * @param t Animation progress (0-1)
     * @returns Eased value
     */
    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    /**
     * @method toggle
     * @description Toggles the state of the switch and starts the animation
     */
    public toggle(): void {
        // Set up animation parameters
        this.animating = true;
        this.animationProgress = 0;
        this.startPos = this.selectorPos;

        // Calculate target position based on enabled state
        if (this.isConfirmed()) {
            this.targetPos = 0.25;
        } else {
            this.targetPos = -0.25;
        }
    }

    /**
     * @method setConfirmed
     * @description Override of setConfrimed from BaseMenuItem
     */
    public setConfirmed(confirmed: boolean): void {
        super.setConfirmed(confirmed);
        this.toggle();
    }

    /**
     * @method isAnimating
     * @description Returns whether the toggle is currently animating
     * @returns {boolean} True if animating, false otherwise
     */
    public isAnimating(): boolean {
        return this.animating;
    }

    /**
     * @method animateFill
     * @description Animates the fill color transition
     */
    private animateFill(): void {
        if (this.currentFill < this.targetFill) {
            this.currentFill += FILL_SPEED;
        } else if (this.currentFill > this.targetFill) {
            this.currentFill -= FILL_SPEED;
        }
    }
}
