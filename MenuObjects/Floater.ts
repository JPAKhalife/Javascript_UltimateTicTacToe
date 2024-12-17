/**
 * @file Floater.ts
 * @description This file is responsible for creating the floaters in the menu
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import * as p5 from 'p5';
import { Img } from '../ShapeWrapper.ts';
import { getCanvasSize, getRandomInt } from '../sketch.js';


/**
 * @class Floater
 * @Description This class is used to create menu floaters
 * @constructor
 * @param {p5.Image} image
 * @param {number} width
 * @param {number} length
 */
export default class Floater 
{
    //Members of floater
    private floater: Img; 
    private sketch: p5;

    //These are for the current x and y velocity
    private vx: number;
    private vy: number;

    //This controls the spin speed of the bouncer
    private sv: number;

    //These are the dimensions of the floater
    private width: number;
    private length: number;

    constructor(sketch: p5, image : p5.Image, width: number, length: number) {
        this.vx = 0;
        this.vy = 0;
        this.sv = 0;
        this.width = width;
        this.length = length;
        this.sketch = sketch
        this.floater = new Img(image,length,width,sketch,0,0);
    }

    /**
     * @method init
     * @description This method initializes the floater
     */
    init(): void 
    {
        this.vx = this.randomVelocity();
        this.vy = this.randomVelocity();
        this.sv = this.randomVelocity();
        this.floater.setTint(this.sketch.color(255, 255, 255, 255));
        this.floater.translate(this.randomCoord(),this.randomCoord());
    }

    /**
     * @method draw
     * @description This method sets the tint of the floater
     */
    draw(): void
    {
        this.floater.roll(this.sv);
        this.floater.render();
        this.floater.changeTranslation(this.vx,this.vy);
        if (this.doBounce()) {
            this.bounce();
        }
    }

    /**
     * @method doBounce
     * @description This method checks if the floater is bouncing
     * @returns {boolean}
     */
    doBounce(): boolean 
    {
        if (this.floater.getTX() + this.width/2 > getCanvasSize(this.sketch) || this.floater.getTX() - this.floater.getWidth()/2 < 0 || this.floater.getTY() + this.floater.getHeight()/2 > getCanvasSize(this.sketch) || (this.floater.getTY()) - this.floater.getHeight()/2 < 0) {
            return true;
        }
        return false;
    }

    /**
     * @method bounce
     * @description This method bounces the floater
     */
    bounce() {
        if (this.floater.getTX() + this.floater.getWidth()/2 > getCanvasSize(this.sketch) || this.floater.getTX() - this.width/2 < 0) {
            this.vx = this.vx*-1;
        }
        if (this.floater.getTY()  + this.floater.getHeight()/2 > getCanvasSize(this.sketch) || this.floater.getTY() - this.floater.getHeight()/2 < 0) {
            this.vy = this.vy*-1;
        }
        this.sv = this.sv*-1;
    }

    /**
     * @method setOpacity
     * @description This is a setter that sets the opacity of the floater
     * @param {number} opacity 
     */
    setOpacity(opacity: number): void 
    {
        this.floater.setTint(this.sketch.color(255,255,255,opacity));
    }

    /**
     * @method fadeIn
     * @description This method fades in the floater
     * @param {number} time 
     */
    fadeIn(time: number): void 
    {
        this.floater.changeTint(0,0,0,255/time); 
    }

    /**
     * @method randomCoord
     * @description This method returns a random coordinate
     * @return {number}
     */
    randomCoord() 
    {
        return getRandomInt(0 + this.width/2,getCanvasSize(this.sketch) - this.width/2);
    }

    /**
     * @method randomVelocity
     * @description This method returns a random velocity
     * @returns {number}
     */
    randomVelocity(): number 
    {
        return getRandomInt(-3,3);
    }

    /**
     * @method fadeOut
     * @description This method fades out the floater
     * @param {number} time 
     */
    fadeOut(time: number): void 
    {
        this.floater.changeTint(0,0,0,-255/time); 
    }
}