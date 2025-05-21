/**
 * @file Floater.ts
 * @description This file is responsible for creating the sliders
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import MenuItem from "./MenuItem";

export default class Slider implements MenuItem {

    private sketch:p5
    private selected: boolean;
    private x: number;
    private y: number;

    constructor(sketch: p5) {
        this.sketch = sketch;
        this.selected = false;
    }

    //Inherited methods
    public isSelected(): boolean {
        return this.selected;
    }

    public setSelected(isSelected: boolean): void {
        this.selected = isSelected;
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

    public draw(): void {
        
    }

}