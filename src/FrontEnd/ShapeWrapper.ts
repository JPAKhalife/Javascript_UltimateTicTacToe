/**
 * @file ShapeWrapper.ts
 * @description A file containing the definition of every shape in the game. It is intended to 
 * reduce interaction with p5js shape functions, and create persistence of shapes between frames.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import * as p5 from 'p5';
import { fontmono } from './sketch';


/**
 * @class ShapeWrapper
 * @description A class representing a shape wrapper.
 */
export default abstract class ShapeWrapper {
    [key: string]: any // We want dynamic methods (for the ShapeGroup)
    protected sketch: p5;
    protected x: number;
    protected y: number;
    protected doRotate: boolean;
    protected doTranslate: boolean;
    protected doTint: boolean;
    protected doStroke: boolean;
    protected doFill: boolean;
    protected angle: number;
    protected tx: number;
    protected ty: number;
    protected fill: p5.Color;
    protected stroke: p5.Color;
    protected strokeWeight: number;
    protected anglem: p5.ANGLE_MODE;
    protected orientation: p5.RECT_MODE;
    protected tint: p5.Color;

    /**
     * @constructor
     * @param {number} x - The x-coordinate of the shape.
     * @param {number} y - The y-coordinate of the shape.
     * @param {string} fill - The fill color of the shape in color format.
     * @param {string} stroke - The stroke color of the shape in color format.
     * @param {number} strokeWeight - The stroke weight of the shape.
     */
    constructor(sketch: p5, x: number, y: number, fill?: p5.Color, stroke?: p5.Color, strokeWeight: number = 1) 
    {
        this.sketch = sketch;
        this.x = x;
        this.y = y;
        this.doRotate = false;
        this.doTranslate = false;
        this.doTint = false;
        this.doStroke = false;
        this.doFill = false;
        this.angle = 0;
        this.tx = 0;
        this.ty = 0;
        this.fill = fill ? fill: sketch.color(0,0,0,0);
        this.stroke = stroke ? stroke: sketch.color(0,0,0,0);
        this.strokeWeight = strokeWeight;
        this.anglem = sketch.DEGREES;
        this.orientation = sketch.CORNER;
        this.tint = sketch.color(0,0,0,0);
    }

    /**
     * @method draw
     * @description Abstract method for drawing the shape.
     */
    abstract draw(): void;

    /**
     * @method render
     * @param {function} customOperation - A custom operation to be performed before drawing the shape.
     * @description Renders the shape on the canvas.
     */
    render(customOperation = function() {}): void 
    {
        //Check if we are rotating the shape 
        this.sketch.push();
        this.sketch.rectMode(this.orientation);
        this.sketch.angleMode(this.anglem);
        this.sketch.noStroke();
        this.sketch.noTint();
        this.sketch.noFill();
        if (this.doTranslate) {
            this.sketch.translate(this.tx, this.ty);
        }
        if (this.doRotate) {
            this.sketch.rotate(this.angle);
        }
        if (this.doTint) {
            this.sketch.tint(this.tint);
        }
        if (this.doStroke) {
            this.sketch.stroke(this.stroke);
        }
        if (this.doFill) {
            this.sketch.fill(this.fill);
        }
        this.sketch.strokeWeight(this.strokeWeight)
        customOperation();
        this.draw();
        this.sketch.pop();
    }

    /**
     * @method setX
     * @param {number} x - The new x-coordinate of the shape.
     * @description Sets the x-coordinate of the shape.
     */
    setX(x: number): void 
    {
        this.x = x;
    }

    /**
     * @method setY
     * @param {number} y - The new y-coordinate of the shape.
     * @description Sets the y-coordinate of the shape.
     */
    setY(y: number): void 
    {
        this.y = y;
    }

    /**
     * @method move
     * @param {number} dx - The amount to move the shape in the x-direction.
     * @param {number} dy - The amount to move the shape in the y-direction.
     * @description Moves the shape by the specified amount.
     */
    move(dx: number, dy: number): void 
    {
        this.x += dx;
        this.y += dy;
    }

    /**
     * @method roll
     * @param {number} angle - The angle to rotate the shape by.
     * @description Rotates the shape by the specified angle.
     */
    roll(angle: number): void {
        this.doRotate = true;
        this.angle += angle;
    }

    /**
     * @method setAngleMode
     * @param {*} anglemMode 
     * @description Sets the angle mode of the shape.
     */
    setAngleMode(angleMode: p5.ANGLE_MODE): void
    {
        this.anglem = angleMode;
    }

    /**
     * @method setOrientation
     * @param {number} angle - The exact angle to rotate the shape to.
     * @description Rotates the shape to the exact specified angle.
     */
    setOrientation(angle: number): void 
    {    
        this.angle = angle;
        this.doRotate = true;
    }

    /**
     * @method resetRotation
     * @description Resets the rotation of the shape.
     */
    resetRotation(): void 
    {    
        this.angle = 0;
        this.doRotate = false;
    }

    /**
     * @method translate
     * @param {number} dx - The amount to translate the shape in the x-direction.
     * @param {number} dy - The amount to translate the shape in the y-direction.
     * @description Translates the shape by the specified amount.
     */
    translate(dx: number, dy: number): void 
    {
        this.tx = dx;
        this.ty = dy;
        this.doTranslate = true;
    }

    /**
     * @method
     * @param dx The amount to change the x translation by
     * @param dy The amount to change the y translation by
     */
    changeTranslation(dx: number, dy: number): void {
        this.tx += dx;
        this.ty += dy;
        this.doTranslate = true;
    }

    /**
     * @method resetTranslation
     * @description Resets the translation of the shape.
     */
    resetTranslation(): void
    {
        this.tx = 0;
        this.ty = 0;
        this.doTranslate = false;
    }

    /**
     * @method setTint
     * @param {p5.Color} t - The tint component of the tint color.
     * @description Sets the tint color of the shape.
     */
    setTint(t: p5.Color): void 
    {
        this.tint = t
        this.doTint = true
    }

    /**
     * @method setTint
     * @param {number} r - The red component of the tint color.
     * @param {number} g - The green component of the tint color.
     * @param {number} b - The blue component of the tint color.
     * @param {number} a - The alpha component of the tint color.
     * @description Sets the tint color of the shape.
     */
    changeTint(r: number, g: number, b: number, a: number): void 
    {
        let colorSettings: string[] = this.tint.toString('rgba').replace(/[^\d,]/g, '').split(',');
        this.doTint = true;
        let currentAlpha = parseFloat(colorSettings[3]);
        let newAlpha = Math.min(currentAlpha + a, 255); // Ensure alpha does not exceed 255
        this.tint.setAlpha(newAlpha);
        this.tint.setRed(parseFloat(colorSettings[0]) + r);
        this.tint.setGreen(parseFloat(colorSettings[1]) + g);
        this.tint.setBlue(parseFloat(colorSettings[2]) + b);
    }

    /**
     * @method unsetTint
     * @description Unsets the tint color of the shape.
     */
    unsetTint(): void 
    {      
        this.doTint = false;
    }

    /**
     * @method getTint
     * @description Gets the tint color of the shape.
     * @returns {p5.Color} The tint color of the shape.
     */
    getTint(): p5.Color 
    {
        return this.tint;
    }

    /**
     * @method getTintAlpha
     * @description Gets the alpha color of the shape.
     * @returns {number} The alpha color of the shape.
     */
    getTintAlpha(): number
    {
       return parseFloat(this.tint.toString().split(",")[3].replace(')', ''));
    }

    /**
     * @method unsetFill
     * @description Unsets the fill color of the shape.
     */
    unsetFill(): void {
        this.doFill = false;
    }

    /**
     * @method setStroke
     * @param {p5.Color} color - the color of the stroke
     * @description Sets the stroke color of the shape.
     */
    setStroke(color: p5.Color): void 
    {
        this.doStroke = true;
        this.stroke = color;
    }

    /**
     * @method getStroke
     * @description Gets the stroke color of the shape.
     * @returns {p5.Color} The stroke color of the shape.
     */
    getStroke(): p5.Color
    {
        return this.stroke;
    }

    /**
     * @method getStrokeAlpha
     * @description Gets the alpha component of the stroke color.
     * @returns {number} The alpha component of the stroke color.
     */
    getStrokeAlpha(): number
    {
        return parseFloat(this.stroke.toString().split(",")[3].replace(')', ''));
    }

    /**
     * @method setStrokeAlpha
     * @description Sets the alpha component of the stroke color.
     * @param {number} a
     */
    setStrokeAlpha(a: number): void
    {
        this.stroke.setAlpha(a);
    }

    /**
     * @method changeStroke
     * @description Sets the alpha component of the stroke color.
     * @param {number} a
     */
    changeStroke(r: number, g: number, b: number, a: number): void 
    {
        let colorSettings: string[] =  this.stroke.toString('rgba').split(',');
        this.doStroke = true;
        this.tint.setAlpha(parseFloat(colorSettings[3]) + a);
        this.tint.setRed(parseFloat(colorSettings[0]) + r);
        this.tint.setGreen(parseFloat(colorSettings[1]) + g);
        this.tint.setBlue(parseFloat(colorSettings[2]) + b);
    }

    /**
     * @method resetStroke
     * @description Unsets the stroke color of the shape.
     */
    resetStroke(): void 
    {
        this.doStroke = false;
        this.stroke = this.sketch.color(0,0,0,0);
    }

    /**
     * @method setFill
     * @param {p5.Color} color - The fill color of the shape.
     * @description Sets the fill color of the shape.
     */
    setFill(color: p5.Color): void 
    {
        this.doFill = true;
        this.fill = color;
    }

    /**
     * @method unsetFill
     * @description Unsets the fill color of the shape.
     */
    resetFill(): void 
    {
        this.doFill = false;
        this.fill = this.sketch.color(0,0,0,0);
    }

    /**
     * @method setFillAlpha
     * @description Sets the alpha component of the fill color.
     * @param {number} a 
     */
    setFillAlpha(a: number): void 
    {
        this.fill.setAlpha(a);
    }

    /**
     * @method setStrokeWeight
     * @param {number} weight - The stroke weight of the shape.
     * @description Sets the stroke weight of the shape.
     */
    setStrokeWeight(weight: number): void
    {
        this.strokeWeight = weight;
    }

    /**
     * @method incrementFill
     * @param {number} r - The amount to increment the red component of the fill color.
     * @param {number} g - The amount to increment the green component of the fill color.
     * @param {number} b - The amount to increment the blue component of the fill color.
     * @param {number} a - The amount to increment the alpha component of the fill color.
     * @description Increments the fill color of the shape by the specified amount.
     */
    incrementFill(r: number, g: number, b: number, a: number): void 
    {
        let colorSettings: string[] =  this.fill.toString('rgba').split(',');
        this.doFill = true;
        this.fill.setAlpha(parseFloat(colorSettings[3]) + a);
        this.fill.setRed(parseFloat(colorSettings[0]) + r);
        this.fill.setGreen(parseFloat(colorSettings[1]) + g);
        this.fill.setBlue(parseFloat(colorSettings[2]) + b);
    }

    /**
     * @method incrementStroke
     * @param {number} r - The amount to increment the red component of the stroke color.
     * @param {number} g - The amount to increment the green component of the stroke color.
     * @param {number} b - The amount to increment the blue component of the stroke color.
     * @param {number} a - The amount to increment the alpha component of the stroke color.
     * @description Increments the stroke color of the shape by the specified amount.
     */
    incrementStroke(r: number, g: number, b: number, a: number): void 
    {
        this.doStroke = true;
        let colorSettings: string[] =  this.stroke.toString('rgba').split(',');
        this.stroke.setAlpha(parseFloat(colorSettings[3]) + a);
        this.stroke.setRed(parseFloat(colorSettings[0]) + r);
        this.stroke.setGreen(parseFloat(colorSettings[1]) + g);
        this.stroke.setBlue(parseFloat(colorSettings[2]) + b);
    }

    /**
     * @method setRectOrientation
     * @param {p5.RECT_MODE} orientation - The orientation of the rectangle (default: CORNER).
     * @description Sets the orientation of the rectangle.
     */
    setRectOrientation(orientation: p5.RECT_MODE): void 
    {
        this.orientation = orientation;
    }

    /**
     * @method getX
     * @returns {number} The x-coordinate of the shape.
     * @description Gets the x-coordinate of the shape.
     */
    getX(): number 
    {
        return this.x;
    }

    /**
     * @method getY
     * @returns {number} The y-coordinate of the shape.
     * @description Gets the y-coordinate of the shape.
     */
    getY(): number 
    {
        return this.y;
    }

    /**
     * @method getTX
     * @description Gets the x-translation of the shape.
     * @returns {number} The x-translation of the shape.
     */
    getTX(): number 
    {
        return this.tx;
    }

    /**
     * @method getTY
     * @description Gets the y-translation of the shape.
     * @returns {number} The y-translation of the shape.
     */
    getTY(): number 
    {
        return this.ty;
    }
}

/**
 * @class A wrapper for the rectangle class of p5
 */
export class Rectangle extends ShapeWrapper {

    protected width: number;
    protected height: number;

    /**
     * @constructor
     * @param {number} x - The x-coordinate of the rectangle.
     * @param {number} y - The y-coordinate of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {string} fill - The fill color of the rectangle in color format.
     * @param {string} stroke - The stroke color of the rectangle in color format.
     * @param {number} strokeWeight - The stroke weight of the rectangle.
     */
    constructor(height: number, width: number, sketch: p5, x: number, y: number, fill?: p5.Color, stroke?: p5.Color, strokeWeight: number = 1) {
        super(sketch, x, y, fill, stroke, strokeWeight);
        this.width = width;
        this.height = height;
    }

    /**
     * @method draw
     * @description Draws the rectangle on the canvas.
     */
    draw(): void 
    {
        this.sketch.rect(this.x, this.y, this.width, this.height);
    }

    /**
     * @method setWidth
     * @description Sets the width of the rectangle
     * @param {*} width 
     */
    setWidth(width: number): void
    {
        this.width = width;
    }

    /**
     * @method setHeight
     * @description Sets the height of the rectangle
     * @param {*} height 
     */
    setHeight(height: number): void
    {
        this.height = height
    }

    /**
     * @method getWidth
     * @description Gets the width of the rectangle
     * @returns {number} The width of the rectangle.
     */
    getWidth(): number {
        return this.width;
    }

    /**
     * @method getHeight
     * @description Gets the height of the rectangle
     * @returns {number} The height of the rectangle.
     */
    getHeight(): number {
        return this.height;
    }
}

/**
 * @class Image
 * @description A wrapper for the image class of p5
 * @extends ShapeWrapper
 * @constructor
 * @param {p5.Image} img - The image to display.
 * @param {number} x - The x-coordinate of the image.
 * @param {number} y - The y-coordinate of the image.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {string} fill - The fill color of the image in color format.
 * @param {string} stroke - The stroke color of the image in color format.
 * @param {number} strokeWeight - The stroke weight of the image.
 */
export class Img extends Rectangle {
    private img: p5.Image;
    private imageOrientation: p5.IMAGE_MODE;

    constructor(img: p5.Image, height: number, width: number, sketch: p5, x: number, y: number, fill?: p5.Color, stroke?: p5.Color, strokeWeight: number = 1) {
        super(height, width, sketch, x, y, fill, stroke, strokeWeight);
        this.img = img;
        this.width = width;
        this.height = height;
        this.imageOrientation = sketch.CORNER;
        this.doFill = false;
        this.doRotate = false;
        this.doTranslate = false;
        this.doStroke = false;
        this.doTint = false;
        this.sketch.colorMode(this.sketch.HSL, 255);
        this.tint = sketch.color(255, 255, 255, 255); // Default tint color
    }

    /**
     * @function draw
     * @description Draws the image on the canvas.
     */
    draw(): void {
        this.sketch.imageMode(this.imageOrientation);
        this.sketch.colorMode(this.sketch.HSB,255);
        console.log(this.tint);
        this.sketch.tint(this.tint);
        this.sketch.image(this.img, this.x, this.y, this.width, this.height);
    }

    /**
     * @function setTint
     * @param {p5.Color} tint - The tint color.
     * @description Sets the tint color of the image.
     */
    setTint(tint: p5.Color): void {
        this.tint = tint;
    }

    /**
     * @function getTint
     * @description Gets the tint color of the image.
     * @returns {p5.Color} The tint color.
     */
    getTint(): p5.Color {
        return this.tint;
    }

    /**
     * @function changeTint
     * @param {number} r - The amount to change the red component of the tint color.
     * @param {number} g - The amount to change the green component of the tint color.
     * @param {number} b - The amount to change the blue component of the tint color.
     * @param {number} a - The amount to change the alpha component of the tint color.
     * @description Changes the tint color of the image by the specified amount.
     */
    changeTint(r: number, g: number, b: number, a: number): void {
        let colorSettings: string[] = this.tint.toString('rgba').replace(/[^\d,]/g, '').split(',');
        let currentAlpha = parseFloat(colorSettings[3]);
        let newAlpha = Math.min(currentAlpha + a, 255); // Ensure alpha does not exceed 255
        this.tint.setAlpha(newAlpha);
        this.tint.setRed(parseFloat(colorSettings[0]) + r);
        this.tint.setGreen(parseFloat(colorSettings[1]) + g);
        this.tint.setBlue(parseFloat(colorSettings[2]) + b);
    }

    /**
     * @function setImageOrientation
     * @param {p5.IMAGE_MODE} orientation - The orientation of the image.
     * @description Sets the orientation of the image.
     */
    setImageOrientation(orientation: p5.IMAGE_MODE): void {
        this.imageOrientation = orientation;
    }
}

/**
 * @class A wrapper for the text class of p5
 * @description A class representing a text shape.
 * @extends ShapeWrapper
 * @constructor
 * @param {string} text - The text to display.
 * @param {number} size - The font size of the text.
 * @param {p5.Font} font - The font family of the text (default: 'Arial').
 * @param {number} x - The x-coordinate of the text.
 * @param {number} y - The y-coordinate of the text.
 * @param {number} width - The width of the text.
 * @param {number} height - The height of the text.
 * @param {string} fill - The fill color of the text in color format.
 * @param {string} stroke - The stroke color of the text in color format.
 * @param {number} strokeWeight - The stroke weight of the text.
 */
export class Text extends ShapeWrapper {
    private text: string;
    private size: number;
    private font: p5.Font;
    private textOrientation: [p5.HORIZ_ALIGN, p5.VERT_ALIGN];
    //These members are used to set the size of the text box
    private textbox: boolean;
    private txtxt: number;
    private tytxt: number;

    constructor(text: string, x: number, y: number, sketch: p5, size?: number, font?: p5.Font, fill?: p5.Color, stroke?: p5.Color, strokeWeight: number = 1) 
    {
        super(sketch, x, y, fill, stroke, strokeWeight);
        this.text = text;
        this.size = size ?? 10;
        this.font = font ?? fontmono;
        this.textOrientation = [sketch.LEFT, sketch.BOTTOM];
        this.textbox = false;
        this.txtxt = 0;
        this.tytxt = 0;
    }

    /**
     * @method draw
     * @description Draws the text on the canvas.
     */
    draw(): void
    {
        this.sketch.textFont(this.font);
        this.sketch.textSize(this.size);
        this.sketch.textAlign(this.textOrientation[0],this.textOrientation[1]);
        if (this.textbox) {
            this.sketch.text(this.text, this.x, this.y,this.txtxt, this.tytxt);
        } else {
            this.sketch.text(this.text, this.x, this.y);
        }  
    }

    /**
     * @method setTextOrientation
     * @param {p5.HORIZ_ALIGN} horizontal - The horizontal alignment of the text (default: LEFT).
     * @param {p5.VERT_ALIGN} vertical - The vertical alignment of the text (default: BOTTOM).
     * @description Sets the orientation of the text.
     */
    setTextOrientation(horizontal: p5.HORIZ_ALIGN = this.sketch.LEFT, vertical: p5.VERT_ALIGN = this.sketch.BOTTOM): void {
        this.textOrientation[0] = horizontal;
        this.textOrientation[1] = vertical;
    }
    /**
     * @method setFont
     * @param {p5.Font} font - The font family of the text.
     * @description Sets the font of the text.
     */
    setFont(font: p5.Font): void
    {
        this.font = font;
    }

    /**
     * @method setText
     * @description sets the text of the text object.
     * @param {*} text 
     */
    setText(text: string): void
    {
        this.text = text;
    }

    /**
     * @method setTextBox
     * @description Sets the size of the maximum text height and width
     * @param {number} tx 
     * @param {number} ty 
     */
    setTextBox(tx: number,ty: number): void
    {
        this.textbox = true;
        this.txtxt = tx;
        this.tytxt = ty;
    }

    /**
     * @method setTextSize
     * @description Sets the textsize.
     * @param {number} size 
     */
    setTextSize(size: number): void
    {
        this.size = size;
    }
}

/**
 * @class ShapeGroup
 * @description This is a class that is intended to hold groups of shapes and call functions on them at the same time.
 */
export class ShapeGroup 
{
    private shapes: ShapeWrapper[];

    /**
     * @constructor
     * @param {...ShapeWrapper} args - The shapes to add to the group.
     */
    constructor(...args: ShapeWrapper[]) {
        this.shapes = [];
        for (let i = 1; i < args.length; i++) {
            if (typeof(args[i]) != typeof(args[i-1])) {
                throw new Error('All arguments must be of the same type');
            }
            this.shapes.push(args[i]);
        }
    }

    /**
     * @method callFunctionOnAll
     * @description Calls a function on all the shapes in the group.
     * @param {function} fn
     * @param ..args 
     */
    callFunctionOnAll(methodName: string, ...args: any[]): void {
        this.shapes.forEach((shape) => {
            if (typeof shape[methodName] === "function") {
                shape[methodName](...args);
            } else {
                console.warn(`Method '${methodName}' does not exist on shape`, shape);
            }
        });
    }
}