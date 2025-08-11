/**
 * @file ScreenBorder.ts
 * @description This file is is responsible for drawing the screen border that surrounds many screens
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import BaseMenuItem from "./BaseMenuItem";
import { getCanvasSize } from "../sketch";



export default class ScreenBorder extends BaseMenuItem {

    //Dimension members
    private borderWidthPercent: number;
    //Position members
    private borderPos: number

    //Transition members
    private transitionInActive: boolean;
    private transitionOutActive: boolean;
    private animationTime: number;

    constructor(sketch: p5, borderWidthPercent: number, animationTime: number, opacity: number = 255) {
        super(sketch, 0, 0, opacity);
        this.borderWidthPercent = borderWidthPercent;
        this.borderPos = 0;
        this.animationTime = animationTime;
        this.transitionInActive = false;
        this.transitionOutActive = false;
    }

    public draw() {
        this.getSketch().push();
            this.getSketch().rectMode(this.getSketch().CENTER);
            this.getSketch().noFill();
            this.getSketch().stroke(255, 255, 255, this.getOpacity());
            this.getSketch().strokeWeight(this.borderWidthPercent*getCanvasSize());
            this.getSketch().rect(
                getCanvasSize() / 2,
                getCanvasSize() / 2,
                getCanvasSize() + (this.borderWidthPercent * getCanvasSize()) - ((this.borderWidthPercent * getCanvasSize() * 2) * this.borderPos),
                getCanvasSize() + (this.borderWidthPercent * getCanvasSize()) - ((this.borderWidthPercent * getCanvasSize() * 2)  * this.borderPos)
            );
        this.getSketch().pop();

        if (this.transitionInActive) {
            this.animationTransitionIn();
        } else if (this.transitionOutActive) {
            this.animationTransitionOut();
        }
    }

    private animationTransitionIn(): void {
        if (this.borderPos >= 1) {
            this.transitionInActive = false;
        } else {
            // Animate border shrinking in
            this.borderPos += 1 / this.animationTime;
        }
    }

    private animationTransitionOut(): void {
        this.borderPos -= (1 / this.animationTime);
        if (this.borderPos <= 0) {
            this.transitionOutActive = false;
        }
    }

    public reset() {
        
    }

    public isTransitioning(): boolean { return this.transitionInActive || this.transitionOutActive; }
    public setTransitionIn(transition: boolean) { this.transitionInActive = transition; }
    public setTransitionOut(transition: boolean) { this.transitionOutActive = transition; }
}

