"use strict";
/**
 * @file Floater.ts
 * @description This file is responsible for creating the floaters in the menu
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
Object.defineProperty(exports, "__esModule", { value: true });
var ShapeWrapper_1 = require("../ShapeWrapper");
var sketch_1 = require("../sketch");
/**
 * @class Floater
 * @Description This class is used to create menu floaters
 * @constructor
 * @param {p5.Image} image
 * @param {number} width
 * @param {number} length
 */
var Floater = /** @class */ (function () {
    function Floater(sketch, image, width, length) {
        this.vx = 0;
        this.vy = 0;
        this.sv = 0;
        this.width = width;
        this.length = length;
        this.sketch = sketch;
        this.floater = new ShapeWrapper_1.Img(image, length, width, sketch, 0, 0);
    }
    /**
     * @method init
     * @description This method initializes the floater
     */
    Floater.prototype.init = function () {
        this.vx = this.randomVelocity();
        this.vy = this.randomVelocity();
        this.sv = this.randomVelocity();
        this.floater.setTint(this.sketch.color(255, 255, 255, 255));
        this.floater.translate(this.randomCoord(), this.randomCoord());
    };
    /**
     * @method draw
     * @description This method sets the tint of the floater
     */
    Floater.prototype.draw = function () {
        this.floater.roll(this.sv);
        this.floater.render();
        this.floater.changeTranslation(this.vx, this.vy);
        if (this.doBounce()) {
            this.bounce();
        }
    };
    /**
     * @method doBounce
     * @description This method checks if the floater is bouncing
     * @returns {boolean}
     */
    Floater.prototype.doBounce = function () {
        if (this.floater.getTX() + this.width / 2 > (0, sketch_1.getCanvasSize)() || this.floater.getTX() - this.floater.getWidth() / 2 < 0 || this.floater.getTY() + this.floater.getHeight() / 2 > (0, sketch_1.getCanvasSize)() || (this.floater.getTY()) - this.floater.getHeight() / 2 < 0) {
            return true;
        }
        return false;
    };
    /**
     * @method bounce
     * @description This method bounces the floater
     */
    Floater.prototype.bounce = function () {
        if (this.floater.getTX() + this.floater.getWidth() / 2 > (0, sketch_1.getCanvasSize)() || this.floater.getTX() - this.width / 2 < 0) {
            this.vx = this.vx * -1;
        }
        if (this.floater.getTY() + this.floater.getHeight() / 2 > (0, sketch_1.getCanvasSize)() || this.floater.getTY() - this.floater.getHeight() / 2 < 0) {
            this.vy = this.vy * -1;
        }
        this.sv = this.sv * -1;
    };
    /**
     * @method setOpacity
     * @description This is a setter that sets the opacity of the floater
     * @param {number} opacity
     */
    Floater.prototype.setOpacity = function (opacity) {
        this.floater.setTint(this.sketch.color(255, 255, 255, opacity));
    };
    /**
     * @method fadeIn
     * @description This method fades in the floater
     * @param {number} time
     */
    Floater.prototype.fadeIn = function (time) {
        this.floater.changeTint(0, 0, 0, 255 / time);
    };
    /**
     * @method randomCoord
     * @description This method returns a random coordinate
     * @return {number}
     */
    Floater.prototype.randomCoord = function () {
        return (0, sketch_1.getRandomInt)(0 + this.width / 2, (0, sketch_1.getCanvasSize)() - this.width / 2);
    };
    /**
     * @method randomVelocity
     * @description This method returns a random velocity
     * @returns {number}
     */
    Floater.prototype.randomVelocity = function () {
        return (0, sketch_1.getRandomInt)(-3, 3);
    };
    /**
     * @method fadeOut
     * @description This method fades out the floater
     * @param {number} time
     */
    Floater.prototype.fadeOut = function (time) {
        this.floater.changeTint(0, 0, 0, -255 / time);
    };
    return Floater;
}());
exports.default = Floater;
