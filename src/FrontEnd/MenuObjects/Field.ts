/**
 * @file Field.ts
 * @description This file is responsible for creating the field. It allows users to type in text
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import BaseMenuItem from "./BaseMenuItem";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import { getCanvasSize } from "../sketch";

const ENTER_DELAY = 15;

export default class Field extends BaseMenuItem {
    private text: string;
    private maxLength: number;
    private width: number;
    private height: number;
    private keyListener: KeyListener;
    private cursorPosition: number;
    private cursorVisible: boolean;
    private cursorBlinkTimer: number;
    private isEditing: boolean;
    private label: string;
    private fontSize: number;
    private padding: number;
    private backgroundColor: number;
    private textColor: number;
    private borderColor: number;
    private editingBorderColor: number;
    private selectedBorderColor: number;
    private timeSinceEnter: number;
    private errorMessage: string;
    private textSize: number;
    private textX: number;
    private textY: number;

    // Shake animation properties
    private isShaking: boolean;
    private shakeIntensity: number;
    private shakeDuration: number;
    private shakeTimer: number;

    // Track if we just entered edit mode to ignore the first Enter key
    private justEnteredEditMode: boolean = false;
    // Track if Enter key was pressed in edit mode
    private enterKeyPressed: boolean = false;

    constructor(
        sketch: p5,
        xPercent: number,
        yPercent: number,
        widthPercent: number = 0.3,
        heightPercent: number = 0.05,
        keyListener?: KeyListener,
        maxLength: number = 30,
        label: string = "",
        textSizePercent?: number,
        textXPercent?: number,
        textYPercent?: number
    ) {
        super(sketch, xPercent, yPercent, 255);

        this.text = "";
        this.errorMessage = "";
        this.maxLength = maxLength;
        this.width = widthPercent;
        this.height = heightPercent;
        this.keyListener = keyListener || new KeyListener(sketch);
        this.cursorPosition = 0;
        this.cursorVisible = true;
        this.cursorBlinkTimer = 0;
        this.isEditing = false;
        this.label = label;
        this.fontSize = 0.02; // 2% of canvas size
        this.padding = 0.01; // 1% of canvas size
        this.timeSinceEnter = 0;
        this.textX = textXPercent !== undefined ? textXPercent : xPercent;
        this.textY = textYPercent !== undefined ? textYPercent : (yPercent - heightPercent / 2 - 0.005);
        this.textSize = textSizePercent !== undefined ? textSizePercent : this.fontSize * 0.8;

        // Colors (grayscale values 0-255)
        this.backgroundColor = 0;      // Black background
        this.textColor = 255;          // White text
        this.borderColor = 100;        // Gray border
        this.selectedBorderColor = 200; // Light gray when selected
        this.editingBorderColor = 255;  // White when editing

        // Initialize shake animation properties
        this.isShaking = false;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
    }

    /**
     * @method reset
     * @description resets the field.
     */
    public reset(): void {
        this.text = "";
        this.cursorPosition = 0;
        this.isEditing = false;
        this.setSelected(false);
    }

    /**
     * @method draw
     * @description Draws the field and handles key input
     * @param currentCanvasSize The current canvas size
     * @param keyEvent The current key event
     */
    public draw(currentCanvasSize?: number, keyEvent?: KEY_EVENTS): void {
        const canvasSize = currentCanvasSize || getCanvasSize();
        const sketch = this.getSketch();

        // Update cursor blink timer
        this.cursorBlinkTimer = (this.cursorBlinkTimer + 1) % 30; // 30 frames per blink
        if (this.cursorBlinkTimer === 0) {
            this.cursorVisible = !this.cursorVisible;
        }

        // Update shake animation if active
        let shakeOffsetX = 0;
        if (this.isShaking) {
    // Calculate shake offset using sine function for smooth back-and-forth motion
    // Intensity decreases as the animation progresses
    const progress = this.shakeTimer / this.shakeDuration;
    const decayFactor = 1 - progress; // Animation intensity decreases over time
    // Scale the shake intensity by the canvas size to convert from percentage to pixels
    shakeOffsetX = Math.sin(this.shakeTimer * 0.8) * this.shakeIntensity * decayFactor * canvasSize;

            // Update shake timer
            this.shakeTimer++;

            // End shake animation when duration is reached
            if (this.shakeTimer >= this.shakeDuration) {
                this.isShaking = false;
                this.shakeTimer = 0;
            }
        }

        // Draw field
        sketch.push();

        // Draw border with appropriate color based on state
        sketch.strokeWeight(2);
        if (this.isEditing) {
            sketch.stroke(this.editingBorderColor, this.getOpacity());
        } else if (this.isSelected()) {
            sketch.stroke(this.selectedBorderColor, this.getOpacity());
        } else {
            sketch.stroke(this.borderColor, this.getOpacity());
        }

        // Draw background
        sketch.fill(this.backgroundColor, this.getOpacity());
        sketch.rectMode(sketch.CENTER);

        // Apply shake offset if shaking
        if (this.isShaking) {
            sketch.rect(
                this.getX(canvasSize) + shakeOffsetX,
                this.getY(canvasSize),
                this.width * canvasSize,
                this.height * canvasSize
            );
        } else {
            sketch.rect(
                this.getX(canvasSize),
                this.getY(canvasSize),
                this.width * canvasSize,
                this.height * canvasSize
            );
        }

        // Draw label if provided
        if (this.label) {
            sketch.stroke(this.borderColor, this.getOpacity());
            sketch.fill(this.textColor, this.getOpacity());
            sketch.textAlign(sketch.CENTER, sketch.BOTTOM);
            sketch.textSize(this.textSize * canvasSize);

            // Apply shake offset to label if shaking
            if (this.isShaking) {
                sketch.text(this.label, this.textX * canvasSize + shakeOffsetX, this.textY * canvasSize);
            } else {
                sketch.text(this.label, this.getX(canvasSize), this.textY * canvasSize);
            }
        }

        // Draw text
        sketch.fill(this.textColor, this.getOpacity());
        sketch.textAlign(sketch.LEFT, sketch.CENTER);
        sketch.textSize(this.fontSize * canvasSize);
        sketch.stroke(this.borderColor, this.getOpacity());

        // Calculate text position (left-aligned with padding)
        let textX = this.getX(canvasSize) - (this.width * canvasSize) / 2 + (this.padding * canvasSize);
        const textY = this.getY(canvasSize);

        // Apply shake offset to text position if shaking
        if (this.isShaking) {
            textX += shakeOffsetX;
        }

        // Draw text within the field boundaries
        sketch.text(this.text, textX, textY);
        //Error message
        sketch.push();
        sketch.textAlign(sketch.CENTER);
        sketch.text(this.errorMessage, this.getX(canvasSize), this.getY(canvasSize) + (this.height * canvasSize));
        sketch.pop();

        // Draw cursor when editing and cursor is visible
        if (this.isEditing && this.cursorVisible) {
            // Calculate cursor position based on text width up to cursor position
            const textBeforeCursor = this.text.substring(0, this.cursorPosition);
            const cursorX = textX + sketch.textWidth(textBeforeCursor);

            // Ensure cursor stays within field boundaries
            let maxCursorX = this.getX(canvasSize) + (this.width * canvasSize) / 2 - (this.padding * canvasSize);

            // Apply shake offset to cursor boundaries if shaking
            if (this.isShaking) {
                maxCursorX += shakeOffsetX;
            }

            const clampedCursorX = Math.min(cursorX, maxCursorX);

            sketch.stroke(this.textColor, this.getOpacity());
            sketch.strokeWeight(1);
            sketch.line(clampedCursorX, textY - (this.height * canvasSize) / 4, clampedCursorX, textY + (this.height * canvasSize) / 4);
        }

        // Draw editing indicator
        if (this.isEditing) {
            sketch.fill(this.editingBorderColor, this.getOpacity() * 0.5);
            sketch.noStroke();

            // Apply shake offset to editing indicator if shaking
            if (this.isShaking) {
                sketch.circle(
                    this.getX(canvasSize) + (this.width * canvasSize) / 2 - (0.01 * canvasSize) + shakeOffsetX,
                    this.getY(canvasSize) - (this.height * canvasSize) / 2 + (0.01 * canvasSize),
                    0.008 * canvasSize
                );
            } else {
                sketch.circle(
                    this.getX(canvasSize) + (this.width * canvasSize) / 2 - (0.01 * canvasSize),
                    this.getY(canvasSize) - (this.height * canvasSize) / 2 + (0.01 * canvasSize),
                    0.008 * canvasSize
                );
            }
        }

        sketch.pop();

        if (this.timeSinceEnter > 0) {
            this.timeSinceEnter--;
        }

        // Handle key events if provided
        if (keyEvent) {
            // Check for Enter key in edit mode
            if ((keyEvent === KEY_EVENTS.ENTER) && this.isEditing) {
                this.enterKeyPressed = true;
                if (this.timeSinceEnter <= 0) {
                    this.setEditMode(false);
                    return;
                }
            }
            this.handleKeyEvent(keyEvent);
        }
    }

    /**
     * @method handleKeyEvent
     * @description Handles key events for the field
     * @param keyEvent The current key event
     */
    private handleKeyEvent(keyEvent: KEY_EVENTS): void {
        // Toggle editing mode with ENTER when selected
        if ((keyEvent === KEY_EVENTS.ENTER || keyEvent === KEY_EVENTS.SELECT) && this.isSelected() && this.timeSinceEnter <= 0) {
            if (keyEvent === KEY_EVENTS.SELECT && !this.isEditing) {
                this.setEditMode(true);
            } else if (keyEvent === KEY_EVENTS.ENTER) {
                this.setEditMode(!this.isEditing);
            }
            return;
        }

        // Exit editing mode with ESCAPE
        if (keyEvent === KEY_EVENTS.ESCAPE && this.isEditing) {
            this.isEditing = false;
            // Re-enable navigation keys
            this.keyListener.enableKey([
                KEY_EVENTS.UP,
                KEY_EVENTS.DOWN,
                KEY_EVENTS.LEFT,
                KEY_EVENTS.RIGHT,
                KEY_EVENTS.SELECT,
            ]);

            // Disable text input mode
            this.keyListener.disableTextInput();
            return;
        }

        // Only process navigation within text when in editing mode
        if (this.isEditing) {
            // Only handle cursor movement with arrow keys (not WASD)
            // We check the keyCode directly to ensure we're only responding to arrow keys
            const keyCode = this.getSketch().keyCode;

            // Left arrow (37)
            if (keyEvent === KEY_EVENTS.LEFT && this.cursorPosition > 0 && keyCode === 37) {
                this.cursorPosition--;
            }
            // Right arrow (39)
            else if (keyEvent === KEY_EVENTS.RIGHT && this.cursorPosition < this.text.length && keyCode === 39) {
                this.cursorPosition++;
            }
        }
    }

    /**
     * @method handleBackspace
     * @description Handles backspace key press
     */
    private handleBackspace(): void {
        if (this.cursorPosition > 0) {
            this.text = this.text.substring(0, this.cursorPosition - 1) +
                this.text.substring(this.cursorPosition);
            this.cursorPosition--;
        }
    }

    /**
     * @method handleDelete
     * @description Handles delete key press
     */
    private handleDelete(): void {
        if (this.cursorPosition < this.text.length) {
            this.text = this.text.substring(0, this.cursorPosition) +
                this.text.substring(this.cursorPosition + 1);
        }
    }

    /**
     * @method handleTextInput
     * @description Handles text input from keyboard
     * @param key The key that was pressed
     */
    public handleTextInput(key: string): void {
        if (!this.isEditing) {
            return;
        }

        // Handle backspace
        if (key === "Backspace") {
            this.handleBackspace();
            return;
        }

        // Handle delete
        if (key === "Delete") {
            this.handleDelete();
            return;
        }

        // Handle arrow keys for cursor movement (but not WASD)
        if (key === "ArrowLeft" && this.cursorPosition > 0) {
            this.cursorPosition--;
            return;
        }

        if (key === "ArrowRight" && this.cursorPosition < this.text.length) {
            this.cursorPosition++;
            return;
        }

        // Handle escape key to exit edit mode
        if (key === "Escape") {
            this.setEditMode(false);
            return;
        }

        // Handle enter key to confirm and exit edit mode
        // But ignore the first Enter key that put us into edit mode
        if (key === "Enter") {
            // Exit edit mode on Enter key press
            if (this.timeSinceEnter <= 0) {
                this.setEditMode(false);
            }
            return;
        }

        // Ignore other special keys
        if (key.length > 1) {
            return;
        }

        // Add character at cursor position if not at max length
        if (this.text.length < this.maxLength) {
            this.text = this.text.substring(0, this.cursorPosition) +
                key +
                this.text.substring(this.cursorPosition);
            this.cursorPosition++;
        }
    }

    /**
     * @method getText
     * @description Gets the current text value
     * @returns The current text value
     */
    public getText(): string {
        return this.text;
    }

    /**
     * @method setText
     * @description Sets the text value
     * @param text The new text value
     */
    public setText(text: string): void {
        if (text.length <= this.maxLength) {
            this.text = text;
            this.cursorPosition = Math.min(this.cursorPosition, this.text.length);
        } else {
            this.text = text.substring(0, this.maxLength);
            this.cursorPosition = Math.min(this.cursorPosition, this.maxLength);
        }
    }

    /**
     * @method isInEditMode
     * @description Checks if the field is in edit mode
     * @returns True if the field is in edit mode, false otherwise
     */
    public isInEditMode(): boolean {
        return this.isEditing;
    }

    /**
     * @method setEditMode
     * @description Sets the edit mode
     * @param editing Whether the field should be in edit mode
     */
    public setEditMode(editing: boolean): void {
        // Only change if the state is actually changing
        if (this.isEditing === editing) {
            return;
        }

        this.isEditing = editing;

        if (this.isEditing) {
            // When entering edit mode, position cursor at end of text
            this.cursorPosition = this.text.length;

            // Reset Enter key pressed flag
            this.enterKeyPressed = false;

            // Disable ALL navigation keys to prevent menu navigation
            this.keyListener.disableKey([
                KEY_EVENTS.UP,
                KEY_EVENTS.DOWN,
                KEY_EVENTS.LEFT,
                KEY_EVENTS.RIGHT,
                KEY_EVENTS.SELECT,
                KEY_EVENTS.ENTER
            ]);

            // Enable text input mode AFTER disabling keys
            this.keyListener.enableTextInput(this.handleTextInput.bind(this));

        } else {
            // Reset the flag
            this.justEnteredEditMode = false;

            // Disable text input mode BEFORE re-enabling keys
            this.keyListener.disableTextInput();

            // Re-enable navigation keys when exiting edit mode
            this.keyListener.enableKey([
                KEY_EVENTS.UP,
                KEY_EVENTS.DOWN,
                KEY_EVENTS.LEFT,
                KEY_EVENTS.RIGHT,
                KEY_EVENTS.SELECT,
                KEY_EVENTS.ENTER
            ]);

        }
        // Set flag to ignore the first Enter key
        this.timeSinceEnter = ENTER_DELAY;
    }

    /**
     * @method getMaxLength
     * @description Gets the maximum length of the text
     * @returns The maximum length
     */
    public getMaxLength(): number {
        return this.maxLength;
    }

    /**
     * @method setLabel
     * @description Sets the label text
     * @param label The new label text
     */
    public setLabel(label: string): void {
        this.label = label;
    }

    /**
     * @method getLabel
     * @description Gets the label text
     * @returns The label text
     */
    public getLabel(): string {
        return this.label;
    }

    /**
     * @method shake
     * @description Triggers a shaking animation for the field
     * @param intensity The intensity of the shake as a percentage of canvas size (default: 0.005)
     * @param duration The duration of the shake in frames (default: 30)
     */
    public shake(intensity: number = 0.005, duration: number = 30): void {
        this.isShaking = true;
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
    }

    /**
     * @method isShaking
     * @description Checks if the field is currently shaking
     * @returns True if the field is shaking, false otherwise
     */
    public getIsShaking(): boolean {
        return this.isShaking;
    }

    /**
     * @method setError
     * @description Displays the given text below the field.
     * @param error 
     */
    public setError(error: string) {
        this.errorMessage = error;
    }
}
