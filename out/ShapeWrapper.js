"use strict";
/**
 * @file ShapeWrapper.ts
 * @description A file containing the definition of every shape in the game. It is intended to
 * reduce interaction with p5js shape functions, and create persistence of shapes between frames.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShapeGroup = exports.Text = exports.Img = exports.Rectangle = void 0;
var p5 = __importStar(require("p5"));
var sketch_1 = require("./sketch");
/**
 * @class ShapeWrapper
 * @description A class representing a shape wrapper.
 */
var ShapeWrapper = /** @class */ (function () {
    /**
     * @constructor
     * @param {number} x - The x-coordinate of the shape.
     * @param {number} y - The y-coordinate of the shape.
     * @param {string} fill - The fill color of the shape in color format.
     * @param {string} stroke - The stroke color of the shape in color format.
     * @param {number} strokeWeight - The stroke weight of the shape.
     */
    function ShapeWrapper(sketch, x, y, fill, stroke, strokeWeight) {
        if (fill === void 0) { fill = new p5.Color(); }
        if (stroke === void 0) { stroke = new p5.Color(); }
        if (strokeWeight === void 0) { strokeWeight = 1; }
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
        this.fill = fill;
        this.stroke = stroke;
        this.strokeWeight = strokeWeight;
        this.anglem = sketch.DEGREES;
        this.orientation = sketch.CORNER;
        this.tint = sketch.color(0, 0, 0, 0);
    }
    /**
     * @method render
     * @param {function} customOperation - A custom operation to be performed before drawing the shape.
     * @description Renders the shape on the canvas.
     */
    ShapeWrapper.prototype.render = function (customOperation) {
        if (customOperation === void 0) { customOperation = function () { }; }
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
        this.sketch.strokeWeight(this.strokeWeight);
        this.sketch.stroke(this.stroke);
        this.sketch.fill(this.fill);
        customOperation();
        this.draw();
        this.sketch.pop();
    };
    /**
     * @method setX
     * @param {number} x - The new x-coordinate of the shape.
     * @description Sets the x-coordinate of the shape.
     */
    ShapeWrapper.prototype.setX = function (x) {
        this.x = x;
    };
    /**
     * @method setY
     * @param {number} y - The new y-coordinate of the shape.
     * @description Sets the y-coordinate of the shape.
     */
    ShapeWrapper.prototype.setY = function (y) {
        this.y = y;
    };
    /**
     * @method move
     * @param {number} dx - The amount to move the shape in the x-direction.
     * @param {number} dy - The amount to move the shape in the y-direction.
     * @description Moves the shape by the specified amount.
     */
    ShapeWrapper.prototype.move = function (dx, dy) {
        this.x += dx;
        this.y += dy;
    };
    /**
     * @method roll
     * @param {number} angle - The angle to rotate the shape by.
     * @description Rotates the shape by the specified angle.
     */
    ShapeWrapper.prototype.roll = function (angle) {
        this.doRotate = true;
        this.angle += angle;
    };
    /**
     * @method setAngleMode
     * @param {*} anglemMode
     * @description Sets the angle mode of the shape.
     */
    ShapeWrapper.prototype.setAngleMode = function (angleMode) {
        this.anglem = angleMode;
    };
    /**
     * @method setOrientation
     * @param {number} angle - The exact angle to rotate the shape to.
     * @description Rotates the shape to the exact specified angle.
     */
    ShapeWrapper.prototype.setOrientation = function (angle) {
        this.angle = angle;
        this.doRotate = true;
    };
    /**
     * @method resetRotation
     * @description Resets the rotation of the shape.
     */
    ShapeWrapper.prototype.resetRotation = function () {
        this.angle = 0;
        this.doRotate = false;
    };
    /**
     * @method translate
     * @param {number} dx - The amount to translate the shape in the x-direction.
     * @param {number} dy - The amount to translate the shape in the y-direction.
     * @description Translates the shape by the specified amount.
     */
    ShapeWrapper.prototype.translate = function (dx, dy) {
        this.tx = dx;
        this.ty = dy;
        this.doTranslate = true;
    };
    /**
     * @method
     * @param dx The amount to change the x translation by
     * @param dy The amount to change the y translation by
     */
    ShapeWrapper.prototype.changeTranslation = function (dx, dy) {
        this.tx += dx;
        this.ty += dy;
        this.doTranslate = true;
    };
    /**
     * @method resetTranslation
     * @description Resets the translation of the shape.
     */
    ShapeWrapper.prototype.resetTranslation = function () {
        this.tx = 0;
        this.ty = 0;
        this.doTranslate = false;
    };
    /**
     * @method setTint
     * @param {p5.Color} t - The tint component of the tint color.
     * @description Sets the tint color of the shape.
     */
    ShapeWrapper.prototype.setTint = function (t) {
        this.tint = t;
        this.doTint = true;
    };
    /**
     * @method setTint
     * @param {number} r - The red component of the tint color.
     * @param {number} g - The green component of the tint color.
     * @param {number} b - The blue component of the tint color.
     * @param {number} a - The alpha component of the tint color.
     * @description Sets the tint color of the shape.
     */
    ShapeWrapper.prototype.changeTint = function (r, g, b, a) {
        var colorSettings = this.tint.toString('rgba').split(',');
        this.doTint = true;
        this.tint.setAlpha(parseFloat(colorSettings[3]) + a);
        this.tint.setRed(parseFloat(colorSettings[0]) + r);
        this.tint.setGreen(parseFloat(colorSettings[1]) + g);
        this.tint.setBlue(parseFloat(colorSettings[2]) + b);
    };
    /**
     * @method unsetTint
     * @description Unsets the tint color of the shape.
     */
    ShapeWrapper.prototype.unsetTint = function () {
        this.doTint = false;
    };
    /**
     * @method setStroke
     * @param {p5.Color} color - the color of the stroke
     * @description Sets the stroke color of the shape.
     */
    ShapeWrapper.prototype.setStroke = function (color) {
        this.doStroke = true;
        this.stroke = color;
    };
    /**
     * @method resetStroke
     * @description Unsets the stroke color of the shape.
     */
    ShapeWrapper.prototype.resetStroke = function () {
        this.doStroke = false;
        this.stroke = this.sketch.color(0, 0, 0, 0);
    };
    /**
     * @method setFill
     * @param {p5.Color} color - The fill color of the shape.
     * @description Sets the fill color of the shape.
     */
    ShapeWrapper.prototype.setFill = function (color) {
        this.doFill = true;
        this.fill = color;
    };
    /**
     * @method unsetFill
     * @description Unsets the fill color of the shape.
     */
    ShapeWrapper.prototype.resetFill = function () {
        this.doFill = false;
        this.fill = this.sketch.color(0, 0, 0, 0);
    };
    /**
     * @method setFillAlpha
     * @description Sets the alpha component of the fill color.
     * @param {number} a
     */
    ShapeWrapper.prototype.setFillAlpha = function (a) {
        this.fill.setAlpha(a);
    };
    /**
     * @method setStrokeWeight
     * @param {number} weight - The stroke weight of the shape.
     * @description Sets the stroke weight of the shape.
     */
    ShapeWrapper.prototype.setStrokeWeight = function (weight) {
        this.strokeWeight = weight;
    };
    /**
     * @method incrementFill
     * @param {number} r - The amount to increment the red component of the fill color.
     * @param {number} g - The amount to increment the green component of the fill color.
     * @param {number} b - The amount to increment the blue component of the fill color.
     * @param {number} a - The amount to increment the alpha component of the fill color.
     * @description Increments the fill color of the shape by the specified amount.
     */
    ShapeWrapper.prototype.incrementFill = function (r, g, b, a) {
        var colorSettings = this.fill.toString('rgba').split(',');
        this.doFill = true;
        this.fill.setAlpha(parseFloat(colorSettings[3]) + a);
        this.fill.setRed(parseFloat(colorSettings[0]) + r);
        this.fill.setGreen(parseFloat(colorSettings[1]) + g);
        this.fill.setBlue(parseFloat(colorSettings[2]) + b);
    };
    /**
     * @method incrementStroke
     * @param {number} r - The amount to increment the red component of the stroke color.
     * @param {number} g - The amount to increment the green component of the stroke color.
     * @param {number} b - The amount to increment the blue component of the stroke color.
     * @param {number} a - The amount to increment the alpha component of the stroke color.
     * @description Increments the stroke color of the shape by the specified amount.
     */
    ShapeWrapper.prototype.incrementStroke = function (r, g, b, a) {
        this.doStroke = true;
        var colorSettings = this.stroke.toString('rgba').split(',');
        this.stroke.setAlpha(parseFloat(colorSettings[3]) + a);
        this.stroke.setRed(parseFloat(colorSettings[0]) + r);
        this.stroke.setGreen(parseFloat(colorSettings[1]) + g);
        this.stroke.setBlue(parseFloat(colorSettings[2]) + b);
    };
    /**
     * @method setRectOrientation
     * @param {p5.RECT_MODE} orientation - The orientation of the rectangle (default: CORNER).
     * @description Sets the orientation of the rectangle.
     */
    ShapeWrapper.prototype.setRectOrientation = function (orientation) {
        this.orientation = orientation;
    };
    /**
     * @method getX
     * @returns {number} The x-coordinate of the shape.
     * @description Gets the x-coordinate of the shape.
     */
    ShapeWrapper.prototype.getX = function () {
        return this.x;
    };
    /**
     * @method getY
     * @returns {number} The y-coordinate of the shape.
     * @description Gets the y-coordinate of the shape.
     */
    ShapeWrapper.prototype.getY = function () {
        return this.y;
    };
    /**
     * @method getTX
     * @description Gets the x-translation of the shape.
     * @returns {number} The x-translation of the shape.
     */
    ShapeWrapper.prototype.getTX = function () {
        return this.tx;
    };
    /**
     * @method getTY
     * @description Gets the y-translation of the shape.
     * @returns {number} The y-translation of the shape.
     */
    ShapeWrapper.prototype.getTY = function () {
        return this.ty;
    };
    return ShapeWrapper;
}());
exports.default = ShapeWrapper;
/**
 * @class A wrapper for the rectangle class of p5.js
 */
var Rectangle = /** @class */ (function (_super) {
    __extends(Rectangle, _super);
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
    function Rectangle(height, width, sketch, x, y, fill, stroke, strokeWeight) {
        if (fill === void 0) { fill = new p5.Color(); }
        if (stroke === void 0) { stroke = new p5.Color(); }
        if (strokeWeight === void 0) { strokeWeight = 1; }
        var _this = _super.call(this, sketch, x, y, fill, stroke, strokeWeight) || this;
        _this.width = width;
        _this.height = height;
        return _this;
    }
    /**
     * @method draw
     * @description Draws the rectangle on the canvas.
     */
    Rectangle.prototype.draw = function () {
        this.sketch.rect(this.x, this.y, this.width, this.height);
    };
    /**
     * @method setWidth
     * @description Sets the width of the rectangle
     * @param {*} width
     */
    Rectangle.prototype.setWidth = function (width) {
        this.width = width;
    };
    /**
     * @method setHeight
     * @description Sets the height of the rectangle
     * @param {*} height
     */
    Rectangle.prototype.setHeight = function (height) {
        this.height = height;
    };
    /**
     * @method getWidth
     * @description Gets the width of the rectangle
     * @returns {number} The width of the rectangle.
     */
    Rectangle.prototype.getWidth = function () {
        return this.width;
    };
    /**
     * @method getHeight
     * @description Gets the height of the rectangle
     * @returns {number} The height of the rectangle.
     */
    Rectangle.prototype.getHeight = function () {
        return this.height;
    };
    return Rectangle;
}(ShapeWrapper));
exports.Rectangle = Rectangle;
/**
 * @class Image
 * @description A wrapper for the image class of p5.js
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
var Img = /** @class */ (function (_super) {
    __extends(Img, _super);
    function Img(img, height, width, sketch, x, y, fill, stroke, strokeWeight) {
        if (fill === void 0) { fill = new p5.Color(); }
        if (stroke === void 0) { stroke = new p5.Color(); }
        if (strokeWeight === void 0) { strokeWeight = 1; }
        var _this = _super.call(this, height, width, sketch, x, y, fill, stroke, strokeWeight) || this;
        _this.img = img;
        _this.width = width;
        _this.height = height;
        _this.imageOrientation = sketch.CORNER;
        return _this;
    }
    /**
     * @function draw
     * @description Draws the image on the canvas.
     */
    Img.prototype.draw = function () {
        this.sketch.imageMode(this.imageOrientation);
        this.sketch.image(this.img, this.x, this.y, this.width, this.height);
    };
    /**
     * @function setImageOrientation
     * @param {p5.IMAGE_MODE} orientation - The orientation of the image.
     * @description Sets the orientation of the image.
     */
    Img.prototype.setImageOrientation = function (orientation) {
        this.imageOrientation = orientation;
    };
    return Img;
}(Rectangle));
exports.Img = Img;
/**
 * @class A wrapper for the text class of p5.js
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
var Text = /** @class */ (function (_super) {
    __extends(Text, _super);
    function Text(text, x, y, sketch, size, font, fill, stroke, strokeWeight) {
        if (fill === void 0) { fill = new p5.Color(); }
        if (stroke === void 0) { stroke = new p5.Color(); }
        if (strokeWeight === void 0) { strokeWeight = 1; }
        var _this = _super.call(this, sketch, x, y, fill, stroke, strokeWeight) || this;
        _this.text = text;
        _this.size = size !== null && size !== void 0 ? size : 10;
        _this.font = font !== null && font !== void 0 ? font : sketch_1.fontmono;
        _this.textOrientation = [sketch.LEFT, sketch.BOTTOM];
        _this.textbox = false;
        _this.txtxt = 0;
        _this.tytxt = 0;
        return _this;
    }
    /**
     * @method draw
     * @description Draws the text on the canvas.
     */
    Text.prototype.draw = function () {
        this.sketch.textFont(this.font);
        this.sketch.textSize(this.size);
        this.sketch.textAlign(this.textOrientation[0], this.textOrientation[1]);
        if (this.textbox) {
            this.sketch.text(this.text, this.x, this.y, this.txtxt, this.tytxt);
        }
        else {
            this.sketch.text(this.text, this.x, this.y);
        }
    };
    /**
     * @method setTextOrientation
     * @param {p5.HORIZ_ALIGN} horizontal - The horizontal alignment of the text (default: LEFT).
     * @param {p5.VERT_ALIGN} vertical - The vertical alignment of the text (default: BOTTOM).
     * @description Sets the orientation of the text.
     */
    Text.prototype.setTextOrientation = function (horizontal, vertical) {
        if (horizontal === void 0) { horizontal = this.sketch.LEFT; }
        if (vertical === void 0) { vertical = this.sketch.BOTTOM; }
        this.textOrientation[0] = horizontal;
        this.textOrientation[1] = vertical;
    };
    /**
     * @method setFont
     * @param {p5.Font} font - The font family of the text.
     * @description Sets the font of the text.
     */
    Text.prototype.setFont = function (font) {
        this.font = font;
    };
    /**
     * @method setText
     * @description sets the text of the text object.
     * @param {*} text
     */
    Text.prototype.setText = function (text) {
        this.text = text;
    };
    /**
     * @method setTextBox
     * @description Sets the size of the maximum text height and width
     * @param {number} tx
     * @param {number} ty
     */
    Text.prototype.setTextBox = function (tx, ty) {
        this.textbox = true;
        this.txtxt = tx;
        this.tytxt = ty;
    };
    /**
     * @method setTextSize
     * @description Sets the textsize.
     * @param {number} size
     */
    Text.prototype.setTextSize = function (size) {
        this.size = size;
    };
    return Text;
}(ShapeWrapper));
exports.Text = Text;
/**
 * @class ShapeGroup
 * @description This is a class that is intended to hold groups of shapes and call functions on them at the same time.
 */
var ShapeGroup = /** @class */ (function () {
    /**
     * @constructor
     * @param {...ShapeWrapper} args - The shapes to add to the group.
     */
    function ShapeGroup() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.shapes = [];
        for (var i = 1; i < args.length; i++) {
            if (typeof (args[i]) != typeof (args[i - 1])) {
                throw new Error('All arguments must be of the same type');
            }
            this.shapes.push(args[i]);
        }
    }
    /**
     * @method callFunction
     * @description Calls a function on all the shapes in the group.
     * @param {string} functionName
     */
    ShapeGroup.prototype.callFunction = function (functionName) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var i = 0; i < this.shapes.length; i++) {
            if (typeof this.shapes[i][functionName] === 'function') {
                (_a = this.shapes[i])[functionName].apply(_a, args);
            }
        }
    };
    return ShapeGroup;
}());
exports.ShapeGroup = ShapeGroup;
