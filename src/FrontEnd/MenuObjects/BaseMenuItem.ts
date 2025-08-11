/**
 * @file Button.ts
 * @description This file defines a Button interface for any buttons to be drawn in the GUI
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize } from "../sketch";

export default abstract class BaseMenuItem {


    //typical members
    private selected: boolean;
    private confirmed: boolean;
    private xPercent: number;
    private yPercent: number;
    private opacity: number;
    private sketch: p5

    constructor(sketch: p5, xPercent: number, yPercent: number, opacity: number) {
        this.sketch = sketch;
        this.xPercent = xPercent;
        this.yPercent = yPercent;
        this.opacity = opacity
        this.selected = false;
        this.confirmed = false;
    }

    /**
     * @method isSelected
     * @description Returns whether or not the BaseMenuItem is selected
     * @returns A boolean representing whether or not the field has been selected by the user.
     */
    public isSelected(): boolean {
        return this.selected;
    }

    /**
     * @method setSelected
     * @description Sets the selected boolean
     * @param selected what the selected value should be set to
     */
    public setSelected(selected: boolean): void {
        this.selected = selected;
    }

    /**
    * @method setX
    * @description Sets the x-coordinate percentage of the BaseMenuItem
    * @param xPercent {number} - The new x-coordinate percentage (0-1)
    */
    public setX(xPercent: number): void {
        this.xPercent = xPercent;
    }
    
    /**
    * @method setY
    * @description Sets the y-coordinate percentage of the BaseMenuItem
    * @param yPercent {number} - The new y-coordinate percentage (0-1)
    */
    public setY(yPercent: number): void {
        this.yPercent = yPercent;
    }

    /**
     * @method getX
     * @description Gets the x coordinate of the BaseMenuItem in pixels
     * @param currentCanvasSize {number} - Optional current canvas size, defaults to getCanvasSize()
     * @returns a number that is the x coordinate in pixels
     */
    public getX(currentCanvasSize?: number): number {
        const canvasSize = currentCanvasSize || getCanvasSize();
        return this.xPercent * canvasSize;
    }

    /**
     * @method getY
     * @description Gets the y coordinate of the BaseMenuItem in pixels
     * @param currentCanvasSize {number} - Optional current canvas size, defaults to getCanvasSize()
     * @returns a number that is the y coordinate in pixels
     */
    public getY(currentCanvasSize?: number): number {
        const canvasSize = currentCanvasSize || getCanvasSize();
        return this.yPercent * canvasSize;
    }
    
    /**
     * @method getXPercent
     * @description Gets the x coordinate percentage of the BaseMenuItem
     * @returns a number that is the x coordinate percentage (0-1)
     */
    public getXPercent(): number {
        return this.xPercent;
    }

    /**
     * @method getYPercent
     * @description Gets the y coordinate percentage of the BaseMenuItem
     * @returns a number that is the y coordinate percentage (0-1)
     */
    public getYPercent(): number {
        return this.yPercent;
    }

    /**
     * @method setConfirmed
     * @description sets the confirmed status of the BaseMenuItem
     * @param confirmed 
     */
    public setConfirmed(confirmed: boolean): void {
        this.confirmed = confirmed;
    }

    /**
     * @method isConfirmed
     * @description This method checks if the button is confirmed
     * @returns {boolean}
     */
    public isConfirmed(): boolean 
    {
        return this.confirmed;
    }


    /**
     * @method setOpacity
     * @description sets the opacity of the BaseMenuItem
     * @param opacity
     */
    public setOpacity(opacity: number): void {
        this.opacity = opacity;
    }

    /**
     * @method getOpacity
     * @description get the BaseMenuItem's opacity
     * @returns a number representing the opacity
     */
    public getOpacity(): number {
        return this.opacity;
    }

    /**
    * @method fade
    * @description Reduces the opacity of the BaseMenuItem by the specified amount
    * @param amount {number} - The amount to reduce opacity by
    */
    public fade(amount: number): void {
        this.opacity -= amount;
        if (this.opacity < 0) this.opacity = 0;
    }

    /**
     * @method getSketch
     * @descriptions gets the sketch object
     * @returns the p5 sketch object
     */
    protected getSketch(): p5 {
        return this.sketch
    }

    public abstract reset(): void;
    public abstract draw(currentCanvasSize?: number, ...args: any[]): void;
}
