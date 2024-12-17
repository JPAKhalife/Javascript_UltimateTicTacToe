/**
 * @file Button.ts
 * @description This file defines a Button interface for any buttons to be drawn in the GUI
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

interface Button {
    //All buttons need to know if they are selected or not (cursor is on them)
    isSelected(): boolean;
    //All buttons need a setStatus method
    setStatus(status: boolean): void;
    //All buttons need a drawButton method
    draw(): void;
    //All buttons need a reset method
    reset(): void;
    //All buttons need a confirm method
    confirm(): void;
    //All buttons need a value that returns the relevant value
    relevantValue(direction: number): number;
    oppositeRelevantValue(direction: number): number;
}