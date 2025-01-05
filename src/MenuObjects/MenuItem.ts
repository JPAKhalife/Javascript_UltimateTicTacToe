/**
 * @file Button.ts
 * @description This file defines a Button interface for any buttons to be drawn in the GUI
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

export default interface MenuItem {
    //All buttons need to know if they are selected or not (cursor is on them)
    isSelected(): boolean;
    //All buttons should be set to selected or not selected
    setSelected(status: boolean): void;
    //All buttons need a reset method
    reset(): void;
    //All buttons need a confirm method
    confirm(): void;
    //All buttons must have their coordinates accessible
    getX(): number;
    getY(): number;
    //All menuitems should have a draw method
    draw(): void;
}