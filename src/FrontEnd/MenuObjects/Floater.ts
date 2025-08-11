/**
 * @file Floater.ts
 * @description This file is responsible for creating the floaters in the menu
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import * as p5 from 'p5';
import { getCanvasSize, getRandomInt } from '../sketch';
import { STROKEWEIGHT } from '../Screens/SetupScreen';


/**
 * @class Floater
 * @Description This class is used to create menu floaters
 * @constructor
 * @param {p5.Image} image
 * @param {number} width - Width as a percentage of canvas size
 * @param {number} length - Length as a percentage of canvas size
 */
export default class Floater {
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

    //These are the dimensions of the floater as percentages of canvas size
    private widthPercent: number;
    private lengthPercent: number;
    private rotation: number;

    //This is the opacity of the floater
    private opacity: number;
    
    //Reference canvas size for scaling velocities
    private static readonly REFERENCE_SIZE: number = 800;

    constructor(sketch: p5, image: p5.Image, width: number, length: number) {
        this.vx = 0;
        this.vy = 0;
        this.sv = 0;
        this.tx = 0;
        this.ty = 0;
        this.x = 0;
        this.y = 0;
        this.opacity = 255;
        this.widthPercent = width;
        this.lengthPercent = length;
        this.sketch = sketch
        this.floater = image;
        this.rotation = 0;
    }

    /**
     * @method init
     * @description This method initializes the floater
     */
    init(): void {
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
    draw(): void {
        // Check if floater is within bounds after canvas resize
        this.checkBounds();
        
        // Scale velocity based on canvas size to maintain consistent visual speed
        const scaleFactor = getCanvasSize() / Floater.REFERENCE_SIZE;
        const scaledVx = this.vx * scaleFactor;
        const scaledVy = this.vy * scaleFactor;
        const scaledSv = this.sv * scaleFactor;
        
        //Change the roll and position of the floater
        this.tx += scaledVx;
        this.ty += scaledVy;
        this.rotation += scaledSv;

        // Calculate actual dimensions based on canvas size
        const actualWidth = getCanvasSize() * this.widthPercent;
        const actualLength = getCanvasSize() * this.lengthPercent;

        //Draw the floater
        this.sketch.push();
        this.sketch.imageMode(this.sketch.CENTER);
        this.sketch.tint(255, 255, 255, this.opacity)
        this.sketch.translate(this.tx, this.ty);
        this.sketch.angleMode(this.sketch.DEGREES);
        this.sketch.rotate(this.rotation);
        this.sketch.image(this.floater, this.x, this.y, actualWidth, actualLength);
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
    doBounce(): boolean {
        // Calculate actual dimensions based on canvas size
        const actualWidth = getCanvasSize() * this.widthPercent;
        const actualLength = getCanvasSize() * this.lengthPercent;

        if (this.tx + actualWidth / 2 > getCanvasSize() - STROKEWEIGHT ||
            this.tx - actualWidth / 2 < 0 + STROKEWEIGHT ||
            this.ty + actualLength / 2 > getCanvasSize() - STROKEWEIGHT ||
            this.ty - actualLength / 2 < 0 + STROKEWEIGHT) {
            return true;
        }
        return false;
    }

    /**
     * @method bounce
     * @description This method bounces the floater
     */
    bounce() {
        // Calculate actual dimensions based on canvas size
        const actualWidth = getCanvasSize() * this.widthPercent;
        const actualLength = getCanvasSize() * this.lengthPercent;

        if (this.tx + actualWidth / 2 > getCanvasSize() - STROKEWEIGHT ||
            this.tx - actualWidth / 2 < 0 + STROKEWEIGHT) {
            this.vx = this.vx * -1;
        }
        if (this.ty + actualLength / 2 > getCanvasSize() - STROKEWEIGHT ||
            this.ty - actualLength / 2 < 0 + STROKEWEIGHT) {
            this.vy = this.vy * -1;
        }
        this.sv = this.sv * -1;
    }

    /**
     * @method setOpacity
     * @description This is a setter that sets the opacity of the floater
     * @param {number} opacity 
     */
    setOpacity(opacity: number): void {
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
    fadeIn(time: number): void {
        this.opacity += (255 / time);
    }

    /**
     * @method randomCoord
     * @description This method returns a random coordinate
     * @return {number}
     */
    randomCoord() {
        // Calculate actual width based on canvas size
        const actualWidth = getCanvasSize() * this.widthPercent;
        return getRandomInt(0 + actualWidth / 2, getCanvasSize() - actualWidth / 2);
    }

    /**
     * @method randomVelocity
     * @description This method returns a random velocity
     * @returns {number}
     */
    randomVelocity(): number {
        let random = 0;
        do {
            random = getRandomInt(-3, 3);
        } while (random == 0);
        return random;
    }

    /**
     * @method fadeOut
     * @description This method fades out the floater
     * @param {number} time 
     */
    fadeOut(time: number): void {
        this.opacity = this.opacity - (255 / time);
    }

    /**
     * @method checkBounds
     * @description Private method that checks if the floater is within bounds and adjusts if needed
     * @private
     */
    private checkBounds(): void {
        // Calculate actual dimensions based on canvas size
        const actualWidth = getCanvasSize() * this.widthPercent;
        const actualLength = getCanvasSize() * this.lengthPercent;
        
        // Check if the floater is outside the canvas boundaries
        const maxX = getCanvasSize() - STROKEWEIGHT - actualWidth / 2;
        const minX = 0 + STROKEWEIGHT + actualWidth / 2;
        const maxY = getCanvasSize() - STROKEWEIGHT - actualLength / 2;
        const minY = 0 + STROKEWEIGHT + actualLength / 2;
        
        // If outside boundaries, move back inside and reverse direction if needed
        if (this.tx > maxX) {
            this.tx = maxX;
            if (this.vx > 0) this.vx *= -1;
        } else if (this.tx < minX) {
            this.tx = minX;
            if (this.vx < 0) this.vx *= -1;
        }
        
        if (this.ty > maxY) {
            this.ty = maxY;
            if (this.vy > 0) this.vy *= -1;
        } else if (this.ty < minY) {
            this.ty = minY;
            if (this.vy < 0) this.vy *= -1;
        }
    }
}
