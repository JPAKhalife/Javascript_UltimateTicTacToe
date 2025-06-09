/**
 * @file GameManager.ts
 * @description  This class is intended to create button functionality in ultimate tic tact toe
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import * as p5 from 'p5';
import { getCanvasSize } from '../sketch';
import MenuItem from './MenuItem';

export class MenuButton implements MenuItem
{
    
    private selected: boolean;
    private confirmed: boolean;
    private x: number;
    private y: number;
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
    private opacity: number;
    private confirmedAnimation: boolean;
    private sketch: p5;

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

    constructor (sketch: p5,x: number,y: number,phrase: string,length: number,width: number,textsize: number,opacity: number = 255) {
        //whether or not the button is selected
        this.selected = false;
        //whether or not the button is confirmed
        this.confirmed = false;
        //the coordinates on the canvas of the button - Given in the constructor as a percentage
        this.x = x * getCanvasSize();
        this.y = y * getCanvasSize();
        //the word in the button
        this.phrase = phrase;
        //the current animation time of the button
        this.animationTime = 0;

        //length and width of the button
        this.length = length;
        this.width = width;

        //current length and width of the button
        this.currentLength = length;
        this.currentWidth = width;

        //this is the text size 
        this.textSize = textsize;
        this.currentTextSize = textsize;

        //this is the current colour of the button
        this.currentButtonFill = MenuButton.DEFAULT_BUTTON_SHADE;
        
        //this is the current colour of the text in the button
        this.currentTextFill = MenuButton.SELECTED_BUTTON_SHADE;

        //variable that will control the amount the confirmed square grows by
        this.cw = 0;
        this.cl = 0;

        //this will control the opacity of the ring that occurs when a selection is confirmed
        this.opacity = opacity;

        //contains the status of the confirmed animation
        this.confirmedAnimation = false;
        this.sketch = sketch;
    }

    /**
     * @method standardButton
     * @description This method is intended to draw the standard appearance of the button
     * @returns {void}
     */
    private standardButton(): void 
    {

        this.sketch.textFont('Arial');
        //checking if the animation time is finished
        if (this.animationTime == 0) {
            this.sketch.noFill();
        } else {
            //adding to the length and width
            this.currentWidth -= ((this.width) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentLength -= ((this.length) * (MenuButton.GROWTH_PERCENT / 100)) / MenuButton.SELECTED_ANIMATION_TIME;

            //changing the button fill to the desired fill
            this.currentButtonFill -= (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;
            this.currentTextFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.SELECTED_ANIMATION_TIME;

            this.sketch.fill(this.currentButtonFill,this.opacity);    
            this.animationTime--;
        }

        this.sketch.strokeWeight(1);
        this.sketch.stroke(255,this.opacity);
        this.sketch.rectMode(this.sketch.CENTER);
        this.sketch.rect(this.x, this.y, this.currentWidth * getCanvasSize(), this.currentLength * getCanvasSize());
        this.sketch.textSize(this.currentTextSize);
        this.sketch.fill(this.currentTextFill,this.opacity);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER,this.sketch.CENTER);
        this.sketch.text(this.phrase, this.x, this.y, this.currentWidth * getCanvasSize(), this.currentLength * getCanvasSize());    
        
    }

    //this method resets all variables so that the buttons can be pressed again.
    /**
     * @method reset
     * @description This method resets all variables so that the buttons can be pressed again
     */
    public reset (): void 
    {
        this.cw = 0;
        this.cl = 0;
        this.opacity = 255;
        this.confirmed = false;
        this.confirmedAnimation = false;
        this.animationTime = 0;
        this.selected = false;
        this.currentLength = this.length;
        this.currentWidth = this.width;
        this.currentTextFill = 255;
        this.currentButtonFill = 0;
        this.currentTextSize = this.textSize;
    }

    /**
     * @method isSelected
     * @description This method checks if the button is selected
     * @returns {boolean}
     */
    public isSelected() : boolean
    {
        if (this.selected == true) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @method setStatus
     * @description This method sets the selected status of the button
     * @param status 
     */
    public setSelected(status: boolean): void 
    {
        this.selected = status;
    }

    /**
     * @method selectedButton
     * @description This method draws the button when it has been selected and does the animation for when it is selected
     */
    selectedButton(): void 
    {
        this.sketch.textFont('Arial');
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
        this.sketch.strokeWeight(1);
        this.sketch.stroke(255,this.opacity);
        this.sketch.fill(this.currentButtonFill,this.opacity);

        this.sketch.rect(this.x, this.y, this.currentWidth * getCanvasSize(), this.currentLength * getCanvasSize());
        this.sketch.textSize(this.currentTextSize);
        this.sketch.fill(this.currentTextFill,this.opacity);
        this.sketch.noStroke()
        this.sketch.textAlign(this.sketch.CENTER,this.sketch.CENTER);
        this.sketch.text(this.phrase, this.x, this.y, this.currentWidth * getCanvasSize(), this.currentLength * getCanvasSize());   
    }

    /**
     * @method confirmedButton
     * @description This method draws the button when it has been confirmed and does the animation for when it is confirmed
     */
    confirmedButton(): void 
    {
        this.sketch.textFont('Arial');
        let first_half: boolean = true
        //checking if the animation time is finished
        if (this.animationTime > MenuButton.CONFIRMED_ANIMATION_TIME) {
            this.opacity = 0;
            this.confirmedAnimation = true;
        } else {
            this.cl += ((MenuButton.GROWTH_PERCENT / 100) * (this.currentLength * getCanvasSize()) + (this.currentLength * getCanvasSize())) / MenuButton.CONFIRMED_ANIMATION_TIME;
            this.cw += ((MenuButton.GROWTH_PERCENT / 100) * (this.currentWidth * getCanvasSize()) + (this.currentWidth * getCanvasSize())) / MenuButton.CONFIRMED_ANIMATION_TIME;
            this.currentTextFill += (MenuButton.SELECTED_BUTTON_SHADE - MenuButton.DEFAULT_BUTTON_SHADE) / MenuButton.CONFIRMED_ANIMATION_TIME;
            this.opacity -= (255/MenuButton.CONFIRMED_ANIMATION_TIME)
            this.animationTime++;
        }
        this.sketch.noStroke()
        this.sketch.fill(255);
        //fill(this.currentButtonFill);
        this.sketch.rect(this.x, this.y, (this.currentWidth * getCanvasSize()) - this.cw ,(this.currentLength * getCanvasSize()) - this.cl);
        this.sketch.textSize(this.currentTextSize);
        this.sketch.fill(this.currentTextFill);
        this.sketch.tint(0,255);
        this.sketch.textAlign(this.sketch.CENTER,this.sketch.CENTER);
        this.sketch.text(this.phrase, this.x, this.y, this.currentWidth * getCanvasSize(), this.currentLength * getCanvasSize());  
        //this is the second rectangle that will be acting as the 
        this.sketch.stroke(255,this.opacity);
        this.sketch.fill(0);
        this.sketch.strokeWeight(MenuButton.OUTLINE_WEIGHT);
        this.sketch.rect(this.x, this.y, MenuButton.OUTLINE_WEIGHT + this.cw,this.cl + MenuButton.OUTLINE_WEIGHT);
    }

    /**
     * @method fade
     * @description This method fades the button
     */
    fade(): void
    {
        this.opacity -= (255/(MenuButton.CONFIRMED_ANIMATION_TIME/4));
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
     * @method isConfirmedAnimationDone
     * @description This method checks if the confirmed animation is done
     * @returns {boolean}
     */
    public isConfirmedAnimationDone(): boolean 
    {
        return this.confirmedAnimation;
    }

    /**
     * @method confirm
     * @description This method confirms the button
     */
    public confirm(): void 
    {
        this.confirmed = true;
    }

    /**
     * @method draw
     * @description This method is intended to draw the button
     */
    public draw(): void
    {
        if (this.confirmed == true) {
            this.confirmedButton();
            
        } else if (this.isSelected() == false) {
            this.standardButton();
        } else 
        if (this.isSelected() == true) {
            this.selectedButton();
        }
    }

    /**
     * @method fadeIn
     * @description controls the fading in animation of all buttons
     * @param time {number}
     */
    public fadeIn(time: number) {
        this.opacity += (255/(time));
    }

    /**
     * @method getText
     * @description This method gets the text of the button
     * @returns {string}
     */
    public getText(): string {
        return this.phrase;
    }

    /**
     * @method setOpacity
     * @description This is a setter that sets the opacity of the button
     * @param opacity {number} 
     */
    public setOpacity(opacity: number) {
        this.opacity = opacity;
    }

    /**
     * @method getOpacity
     * @description This is a getter that gets the opacity of the button
     * @returns number
     */
    public getOpacity(): number {
        return this.opacity;
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }
}