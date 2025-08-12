/**
 * @file TransitionableScreen.ts
 * @description This file defines a framework for screens with transitions
 * @author Cline (based on John Khalife's original screen implementations)
 * @created 2025-08-12
 */

import p5 from "p5";
import Menu, { Screens } from "../Menu";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import ScreenBorder from "../MenuObjects/ScreenBorder";
import BaseMenuItem from "../MenuObjects/BaseMenuItem";
import GuiManager from "../GuiManager";

/**
 * Options for configuring screen transitions
 */
export interface TransitionOptions {
    /** Duration of content animations in frames */
    animationTime?: number;
    /** Width of the border as a percentage of canvas size */
    borderWidth?: number;
    /** Duration of border animations in frames */
    borderAnimationTime?: number;
    /** Whether to use a border animation */
    useBorder?: boolean;
    /** Whether to automatically fade content */
    fadeContent?: boolean;
}

/**
 * Abstract class for screens with standardized transitions
 * Implements the Menu interface and handles common transition patterns
 */
export default abstract class TransitionableScreen implements Menu {
    // Core dependencies
    protected sketch: p5;
    protected keylistener: KeyListener;

    // Transition state management
    protected transitionInActive: boolean;
    protected transitionOutActive: boolean;
    protected opacity: number;

    // UI and animation configuration
    protected border: ScreenBorder | null;
    protected options: TransitionOptions;
    protected uiElements: BaseMenuItem[];
    protected nextScreen: Screens | null;

    /**
     * Creates a new TransitionableScreen
     * @param sketch The p5 sketch instance
     * @param options Configuration options for transitions
     */
    constructor(sketch: p5, options: TransitionOptions = {}) {
        this.sketch = sketch;
        this.keylistener = new KeyListener(sketch);

        // Apply default options with overrides
        const defaultOptions: TransitionOptions = {
            animationTime: 60,
            borderWidth: 0.017,
            borderAnimationTime: 30,
            useBorder: true,
            fadeContent: true
        };

        this.options = { ...defaultOptions, ...options };

        // Initialize state
        this.opacity = 0;
        this.uiElements = [];
        this.transitionInActive = true;
        this.transitionOutActive = false;
        this.nextScreen = null;

        // Create border if enabled
        if (this.options.useBorder) {
            this.border = new ScreenBorder(
                sketch,
                this.options.borderWidth!,
                this.options.borderAnimationTime!
            );
            this.border.setTransitionIn(true);
        } else {
            this.border = null;
        }

        // Deactivate keylistener during initial transition
        this.keylistener.deactivate();
    }

    /**
     * Registers UI elements for automatic transition handling
     * @param elements Array of UI elements to manage
     */
    protected registerUIElements(elements: BaseMenuItem[]): void {
        this.uiElements = elements;

        // Set initial opacity if fading content
        if (this.options.fadeContent) {
            this.uiElements.forEach(element => element.setOpacity(0));
        }
    }

    /**
     * Starts the transition in animation
     */
    protected startTransitionIn(): void {
        this.transitionInActive = true;
        if (this.options.useBorder && this.border) {
            this.border.setTransitionIn(true);
        }
        this.keylistener.deactivate();
    }

    /**
     * Handles the transition in animation
     */
    protected transitionIn(): void {
        // If using border, wait for border animation to complete
        if (this.options.useBorder && this.border && this.border.isTransitioning()) {
            return;
        }

        // Fade in content
        if (this.opacity < 255) {
            this.opacity = Math.min(
                this.opacity + 255 / (this.options.animationTime! / 2),
                255
            );

            // Update UI elements opacity
            if (this.options.fadeContent) {
                this.uiElements.forEach(element => element.setOpacity(this.opacity));
            }
        }

        // Check if transition is complete
        if (this.opacity >= 255) {
            this.transitionInActive = false;
            this.keylistener.activate();
            this.onTransitionInComplete();
        }
    }

    /**
     * Public method to initiate a transition to another screen
     * This can be called from outside the class (e.g., from GuiManager)
     * @param nextScreen The screen to transition to
     */
    public transitionToScreen(nextScreen: Screens): void {
        this.startTransitionOut(nextScreen);
    }

    /**
     * Starts the transition out animation
     * @param nextScreen The screen to transition to
     */
    protected startTransitionOut(nextScreen: Screens): void {
        this.nextScreen = nextScreen;
        this.transitionOutActive = true;
        if (this.options.useBorder && this.border) {
            this.border.setTransitionOut(true);
        }
        this.keylistener.deactivate();
    }

    /**
     * Handles the transition out animation
     */
    protected transitionOut(): void {
        // Fade out UI elements except selected one
        if (this.options.fadeContent) {
            this.uiElements.forEach(element => {
                if (element !== this.getSelectedElement()) {
                    element.fade(255 / (this.options.animationTime! / 2));
                }
            });
        }

        // Fade out content
        this.opacity -= 255 / (this.options.animationTime! / 2);

        // Check if border transition is complete
        if (!this.options.useBorder || !this.border || !this.border.isTransitioning()) {
            this.transitionOutActive = false;
            this.onTransitionOutComplete();
        }
    }

    /**
     * Called when transition in is complete
     * Override in subclasses for custom behavior
     */
    protected onTransitionInComplete(): void {
        // Default implementation is empty
    }

    /**
     * Called when transition out is complete
     * Override in subclasses for custom behavior
     */
    protected onTransitionOutComplete(): void {
        // Navigate to next screen if one is set
        if (this.nextScreen !== null) {
            GuiManager.handleTransitionComplete(this.nextScreen);
        }
    }

    /**
     * Gets the currently selected UI element (if any)
     * Override in subclasses that have selectable elements
     * @returns The selected element or null if none
     */
    protected getSelectedElement(): BaseMenuItem | null {
        // Default implementation returns null
        return null;
    }

    /**
     * Checks if the screen is currently transitioning
     * @returns True if the screen is transitioning in or out
     */
    public isTransitioning(): boolean {
        return this.transitionInActive || this.transitionOutActive;
    }

    /**
     * Main draw method (implements Menu interface)
     */
    public draw(): void {
        // Clear background
        this.sketch.background(0);

        // Draw border if enabled
        if (this.options.useBorder && this.border) {
            this.border.draw();
        }

        // Draw screen-specific content
        this.drawContent();

        // Handle transitions
        if (this.transitionInActive) {
            this.transitionIn();
        } else if (this.transitionOutActive) {
            this.transitionOut();
        } else {
            // Handle input when not transitioning
            this.handleInput();
        }
    }

    /**
     * Draw screen-specific content
     * Must be implemented by subclasses
     */
    protected abstract drawContent(): void;

    /**
     * Handle user input
     * Must be implemented by subclasses
     */
    protected abstract handleInput(): void;
}
