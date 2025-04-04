/**
 * @file Floater.ts
 * @description This file is responsible for creating the floaters in the menu
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import * as p5 from 'p5';
import { Img } from '../ShapeWrapper';
import { getCanvasSize, getRandomInt } from '../sketch';
import { STROKEWEIGHT } from '../Screens/SetupScreen';


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
    private floater: p5.Image; 
    private sketch: p5;

    //These are for the current x and y
    private x: number;
    private y: number;

    //These are for the current x and y velocity
    private vx: number;
    private vy: number;

    //These are for the translation coordinates
    private tx: number;
    private ty: number;

    //This controls the spin speed of the bouncer
    private sv: number;

    //These are the dimensions of the floater
    private width: number;
    private length: number;
    private rotation: number;

    //This is the opacity of the floater
    private opacity: number;

    constructor(sketch: p5, image : p5.Image, width: number, length: number) {
        this.vx = 0;
        this.vy = 0;
        this.sv = 0;
        this.tx = 0;
        this.ty = 0;
        this.x = 0;
        this.y = 0;
        this.opacity = 255;
        this.width = width;
        this.length = length;
        this.sketch = sketch
        this.floater = image;
        this.rotation = 0;
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
        this.tx = this.randomCoord();
        this.ty = this.randomCoord();
    }

    /**
     * @method draw
     * @description This method sets the tint of the floater
     */
    draw(): void
    {
        //Change the roll and position of the floater
        this.tx += this.vx;
        this.ty += this.vy;
        this.rotation += this.sv;

        //Draw the floater
        this.sketch.push();
        this.sketch.imageMode(this.sketch.CENTER);
        this.sketch.tint(255,255,255,this.opacity)
        this.sketch.translate(this.tx,this.ty);
        this.sketch.angleMode(this.sketch.DEGREES);
        this.sketch.rotate(this.rotation);
        this.sketch.image(this.floater,this.x,this.y,this.width,this.length);
        this.sketch.pop();

        //Check for bouncing off of walls
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
        if (this.tx + this.width / 2 > getCanvasSize() - STROKEWEIGHT || this.tx - this.width / 2 < 0 + STROKEWEIGHT || this.ty + this.length / 2 > getCanvasSize() - STROKEWEIGHT || this.ty - this.length / 2 < 0 + STROKEWEIGHT) {
            return true;
        }
        return false;
    }

    /**
     * @method bounce
     * @description This method bounces the floater
     */
    bounce() {
        if (this.tx + this.width / 2 > getCanvasSize() - STROKEWEIGHT || this.tx - this.width / 2 < 0 + STROKEWEIGHT) {
            this.vx = this.vx * -1;
        }
        if (this.ty + this.length / 2 > getCanvasSize() - STROKEWEIGHT || this.ty - this.length / 2 < 0 + STROKEWEIGHT) {
            this.vy = this.vy * -1;
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
        this.opacity = opacity;
    }

    /**
     * @method getOpacity
     * @description This is a getter that gets the opacity of the floater
     * @returns {number}
     */
    getOpacity(): number {
        return this.opacity;
    }

    /**
     * @method fadeIn
     * @description This method fades in the floater
     * @param {number} time 
     */
    fadeIn(time: number): void 
    {
        this.opacity += (255 / time);
    }

    /**
     * @method randomCoord
     * @description This method returns a random coordinate
     * @return {number}
     */
    randomCoord() 
    {
        return getRandomInt(0 + this.width/2,getCanvasSize() - this.width/2);
    }

    /**
     * @method randomVelocity
     * @description This method returns a random velocity
     * @returns {number}
     */
    randomVelocity(): number 
    {   
        let random = 0;
        do {
            random  = getRandomInt(-3,3);
        } while (random == 0);
        return random;
    }

    /**
     * @method fadeOut
     * @description This method fades out the floater
     * @param {number} time 
     */
    fadeOut(time: number): void 
    {
        this.opacity = this.opacity - (255 / time);
    }
}