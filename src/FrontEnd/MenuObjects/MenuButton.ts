/**
 * @file GameManager.ts
 * @description  This class is intended to create button functionality in ultimate tic tact toe
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import * as p5 from 'p5';
import { getCanvasSize } from '../sketch';
import BaseMenuItem from './BaseMenuItem';

export class MenuButton extends BaseMenuItem {

    private phrase: string;
    private animationTime: number;
    private length: number;
    private width: number;
    private currentLength: number;
    private currentWidth: number;
    private textSize: number;
    private currentTextSize: number;
    private currentButtonFill: number;
    private currentTextFill: number;
    private cw: number;
    private cl: number;
    private confirmedAnimation: boolean;

    //This is the default shade of gray of the button fill (0-255)
    public static readonly DEFAULT_BUTTON_SHADE: number = 0;
    //this is the desired shade of gray of the button when it is seleceted
    public static readonly SELECTED_BUTTON_SHADE: number = 255;
    //percent of the length or width of the convas that the board will take up
    //This is the percentage that the button's size will grow when it is selected
    public static readonly GROWTH_PERCENT: number = 25;
    public static readonly CONFIRMED_GROWTH_PERCENT: number = 100;
    public static readonly SELECTED_ANIMATION_TIME: number = 5;
    public static readonly CONFIRMED_ANIMATION_TIME: number = 60;
    //the outline of the second rect around the utton
    public static readonly OUTLINE_WEIGHT: number = 5;

    constructor(sketch: p5, xPercent: number, yPercent: number, phrase: string, lengthPercent: number, widthPercent: number, textsizePercent: number, opacity: number = 255) {
        super(sketch, xPercent, yPercent, opacity);

        //the word in the button
        this.phrase = phrase;
        //the current animation time of the button
        this.animationTime = 0;

        //length and width of the button as percentages
        this.length = lengthPercent;
        this.width = widthPercent;

        //current length and width of the button as percentages
        this.currentLength = lengthPercent;
        this.currentWidth = widthPercent;

        //this is the text size as percentage
        this.textSize = textsizePercent;
        this.currentTextSize = textsizePercent;

        //this is the current colour of the button
        this.currentButtonFill = MenuButton.DEFAULT_BUTTON_SHADE;

        //this is the current colour of the text in the button
        this.currentTextFill = MenuButton.SELECTED_BUTTON_SHADE;

        //variable that will control the amount the confirmed square grows by
        this.cw = 0;
        this.cl = 0;
        //contains the status of the confirmed animation
        this.confirmedAnimation = false;
    }

    /**
     * @method standardButton
     * @description This method is intended to draw the standard appearance of the button
     * @param currentCanvasSize The current canvas size
     * @returns {void}
     */
    private standardButton(currentCanvasSize: number): void {
        this.getSketch().textFont('Arial');
        //checking if the animation time is finished
        if (this.animationTime == 0) {
            this.getSketch().noFill();
        } else {
            //adding to the length and width
            this.currentWidth -= ((this.width) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentLength -= ((this.length) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;

            //changing the button fill to the desired fill
            this.currentButtonFill -= (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentTextFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;

            this.getSketch().fill(this.currentButtonFill, this.getOpacity());
            this.animationTime--;
        }

        this.getSketch().strokeWeight(1);
        this.getSketch().stroke(255, this.getOpacity());
        this.getSketch().rectMode(this.getSketch().CENTER);
        this.getSketch().rect(this.getX(currentCanvasSize), this.getY(currentCanvasSize), this.currentWidth * currentCanvasSize, this.currentLength * currentCanvasSize);
        this.getSketch().textSize(this.currentTextSize * currentCanvasSize);
        this.getSketch().fill(this.currentTextFill, this.getOpacity());
        this.getSketch().noStroke();
        this.getSketch().textAlign(this.getSketch().CENTER, this.getSketch().CENTER);
        this.getSketch().text(this.phrase, this.getX(currentCanvasSize), this.getY(currentCanvasSize), this.currentWidth * currentCanvasSize, this.currentLength * currentCanvasSize);

    }

    //this method resets all variables so that the buttons can be pressed again.
    /**
     * @method reset
     * @description This method resets all variables so that the buttons can be pressed again
     */
    public reset(): void {
        this.cw = 0;
        this.cl = 0;
        this.setOpacity(255);
        this.setConfirmed(false);
        this.confirmedAnimation = false;
        this.animationTime = 0;
        this.setSelected(false)
        this.currentLength = this.length;
        this.currentWidth = this.width;
        this.currentTextFill = 255;
        this.currentButtonFill = 0;
        this.currentTextSize = this.textSize;
    }


    /**
     * @method selectedButton
     * @description This method draws the button when it has been selected and does the animation for when it is selected
     * @param currentCanvasSize The current canvas size
     */
    selectedButton(currentCanvasSize: number): void {
        this.getSketch().textFont('Arial');
        this.getSketch().rectMode(this.getSketch().CENTER);
        //checking if the animation time is finished
        if (this.animationTime > MenuButton.SELECTED_ANIMATION_TIME) {

        } else {
            //adding to the length and width
            this.currentWidth += ((this.width) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentLength += ((this.length) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;

            //changing the button fill to the desired fill
            this.currentButtonFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentTextFill -= (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.animationTime++;
        }
        this.getSketch().strokeWeight(1);
        this.getSketch().stroke(255, this.getOpacity());
        this.getSketch().fill(this.currentButtonFill, this.getOpacity());

        this.getSketch().rect(this.getX(currentCanvasSize), this.getY(currentCanvasSize), this.currentWidth * currentCanvasSize, this.currentLength * currentCanvasSize);
        this.getSketch().textSize(this.currentTextSize * currentCanvasSize);
        this.getSketch().fill(this.currentTextFill, this.getOpacity());
        this.getSketch().noStroke()
        this.getSketch().textAlign(this.getSketch().CENTER, this.getSketch().CENTER);
        this.getSketch().text(this.phrase, this.getX(currentCanvasSize), this.getY(currentCanvasSize), this.currentWidth * currentCanvasSize, this.currentLength * currentCanvasSize);
    }

    /**
     * @method confirmedButton
     * @description This method draws the button when it has been confirmed and does the animation for when it is confirmed
     * @param currentCanvasSize The current canvas size
     */
    confirmedButton(currentCanvasSize: number): void {
        this.getSketch().push();
            this.getSketch().textFont('Arial');
            this.getSketch().rectMode(this.getSketch().CENTER);
            let first_half: boolean = true
            //checking if the animation time is finished
            if (this.animationTime > MenuButton.CONFIRMED_ANIMATION_TIME) {
                this.setOpacity(0);
                this.confirmedAnimation = true;
            } else {
                this.cl += ((MenuButton.GROWTH_PERCENT / 100) * (this.currentLength * currentCanvasSize) + (this.currentLength * currentCanvasSize)) / MenuButton.CONFIRMED_ANIMATION_TIME;
                this.cw += ((MenuButton.GROWTH_PERCENT / 100) * (this.currentWidth * currentCanvasSize) + (this.currentWidth * currentCanvasSize)) / MenuButton.CONFIRMED_ANIMATION_TIME;
                this.currentTextFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.CONFIRMED_ANIMATION_TIME;
                this.setOpacity(this.getOpacity() - (255 / MenuButton.CONFIRMED_ANIMATION_TIME));
                this.animationTime++;
            }
            this.getSketch().noStroke()
            this.getSketch().fill(255);
            //fill(this.currentButtonFill);
            this.getSketch().rect(this.getX(currentCanvasSize), this.getY(currentCanvasSize), (this.currentWidth * currentCanvasSize) - this.cw, (this.currentLength * currentCanvasSize) - this.cl);
            this.getSketch().textSize(this.currentTextSize * currentCanvasSize);
            this.getSketch().fill(this.currentTextFill);
            this.getSketch().tint(0, 255);
            this.getSketch().textAlign(this.getSketch().CENTER, this.getSketch().CENTER);
            this.getSketch().text(this.phrase, this.getX(currentCanvasSize), this.getY(currentCanvasSize), this.currentWidth * currentCanvasSize, this.currentLength * currentCanvasSize);
            //this is the second rectangle that will be acting as the 
            this.getSketch().stroke(255, this.getOpacity());
            this.getSketch().fill(0);
            this.getSketch().strokeWeight(MenuButton.OUTLINE_WEIGHT);
            this.getSketch().rect(this.getX(currentCanvasSize), this.getY(currentCanvasSize), MenuButton.OUTLINE_WEIGHT + this.cw, this.cl + MenuButton.OUTLINE_WEIGHT);
        this.getSketch().pop();
    }

    /**
     * @method isConfirmedAnimationDone
     * @description This method checks if the confirmed animation is done
     * @returns {boolean}
     */
    public isConfirmedAnimationDone(): boolean {
        return this.confirmedAnimation;
    }


    /**
     * @method draw
     * @description This method is intended to draw the button
     * @param currentCanvasSize The current canvas size
     */
    public draw(currentCanvasSize?: number): void {
        const canvasSize = currentCanvasSize || getCanvasSize();

        this.getSketch().push();
            if (this.isConfirmed() == true) {
                this.confirmedButton(canvasSize);

            } else if (this.isSelected() == false) {
                this.standardButton(canvasSize);
            } else
                if (this.isSelected() == true) {
                    this.selectedButton(canvasSize);
            }
        this.getSketch().pop();
    }

    /**
     * @method fadeIn
     * @description controls the fading in animation of all buttons
     * @param time {number}
     */
    public fadeIn(time: number) {
        this.setOpacity(this.getOpacity() + (255 / (time)));
    }

    /**
     * @method getText
     * @description This method gets the text of the button
     * @returns {string}
     */
    public getText(): string {
        return this.phrase;
    }
}
