/**
 * @file Button.ts
 * @description This file defines a Button interface for any buttons to be drawn in the GUI
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import { KEY_EVENTS } from "../KeyListener";

export default abstract class BaseMenuItem {


    //typical members
    private selected: boolean;
    private confirmed: boolean;
    private x: number;
    private y: number;
    private opacity: number;
    private sketch: p5

    constructor(sketch: p5, x: number, y: number, opacity: number) {
        this.sketch = sketch;
        this.x = x;
        this.y = y;
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
    * @description Sets the x-coordinate of the BaseMenuItem
    * @param x {number} - The new x-coordinate
    */
    public setX(x: number): void {
        this.x = x;
    }
    
    /**
    * @method setY
    * @description Sets the y-coordinate of the BaseMenuItem
    * @param y {number} - The new y-coordinate
    */
    public setY(y: number): void {
        this.y = y;
    }

    /**
     * @method getX
     * @description Gets the x coordinate of the BaseMenuItem
     * @returns a number that is the x coordinate
     */
    public getX(): number {
        return this.x;
    }

    /**
     * @method getY
     * @description Gets the y coordinate of the BaseMenuItem
     * @returns a number that is the y coordinate
     */
    public getY(): number {
        return this.y;
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
    public abstract draw(...args: any[]): void;
}
