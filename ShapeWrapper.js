/**
 * @file ShapeWrapper.js
 * @description A file containing the definition of every screen in the game.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-22
 */

/**
 * @class ShapeWrapper
 * @description A class representing a shape wrapper.
 */
class ShapeWrapper {
    /**
     * @constructor
     * @param {number} x - The x-coordinate of the shape.
     * @param {number} y - The y-coordinate of the shape.
     * @param {string} fill - The fill color of the shape in color format.
     * @param {string} stroke - The stroke color of the shape in color format.
     * @param {number} strokeWeight - The stroke weight of the shape.
     */
    constructor(x, y, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
        this.x = x;
        this.y = y;
        this.dorotate = false;
        this.dotranslate = false;
        this.dotint = false;
        this.dostroke = false;
        this.dofill = false;
        this.angle = 0;
        this.tx = 0;
        this.ty = 0;
        this.fillcolor = fill;
        this.strokecolor = stroke;
        this.strokewidth = strokeWeight;
        this.anglem = DEGREES;
        this.rectOrientation = CORNER;
        this.t = 255;
    }

    /**
     * @function draw
     * @description Abstract method for drawing the shape.
     */
    draw() {
        //This is the place where all the shapes are drawn. The locations of the shapes can be changed. The implementation is different for each shape.
        throw new Error('You have to implement the method draw!');    
    }

    /**
     * @function render
     * @param {function} customOperation - A custom operation to be performed before drawing the shape.
     * @description Renders the shape on the canvas.
     */
    render(customOperation = function() {}) {
        //Check if we are rotating the shape 
        push();
        rectMode(this.rectOrientation);
        angleMode(this.anglem);
        noStroke();
        noTint();
        noFill();
        if (this.dotranslate) {
            translate(this.tx, this.ty);
        }
        if (this.dorotate) {
            rotate(this.angle);
        }
        if (this.dotint) {
            tint(255,this.t);
        }
        if (this.dostroke) {
            stroke(this.strokecolor);
        }
        if (this.dofill) {
            fill(this.fillcolor);
        }
        strokeWeight(this.strokewidth)
        stroke(this.strokecolor);
        fill(this.fillcolor)
        customOperation();
        this.draw();
        pop();
    }

    /**
     * @function setX
     * @param {number} x - The new x-coordinate of the shape.
     * @description Sets the x-coordinate of the shape.
     */
    setX(x) {
        this.x = x;
    }

    /**
     * @function setY
     * @param {number} y - The new y-coordinate of the shape.
     * @description Sets the y-coordinate of the shape.
     */
    setY(y) {
        this.y = y;
    }

    /**
     * @function move
     * @param {number} dx - The amount to move the shape in the x-direction.
     * @param {number} dy - The amount to move the shape in the y-direction.
     * @description Moves the shape by the specified amount.
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    /**
     * @function moveUp
     * @param {number} dy - The amount to move the shape up.
     * @description Moves the shape up by the specified amount.
     */
    moveUp(dy) {
        this.y -= dy;
    }

    /**
     * @function moveDown
     * @param {number} dy - The amount to move the shape down.
     * @description Moves the shape down by the specified amount.
     */
    moveDown(dy) {
        this.y += dy;
    }

    /**
     * @function moveLeft
     * @param {number} dx - The amount to move the shape to the left.
     * @description Moves the shape to the left by the specified amount.
     */
    moveLeft(dx) {
        this.x -= dx;
    }

    /**
     * @function moveRight
     * @param {number} dx - The amount to move the shape to the right.
     * @description Moves the shape to the right by the specified amount.
     */
    moveRight(dx) {
        this.x += dx;
    }

    /**
     * @function roll
     * @param {number} angle - The angle to rotate the shape by.
     * @param {number} angleMode - The angle mode to use (default: DEGREES).
     * @description Rotates the shape by the specified angle.
     */
    roll(angle, angleMode = DEGREES) {
        this.dorotate = true;
        this.angle += angle;
        this.anglem = angleMode;
    }

    /**
     * @function setAngleMode
     * @param {*} anglemMode 
     * @description Sets the angle mode of the shape.
     */
    setAngleMode(angleMode) {
        this.anglem = angleMode;
    }

    /**
     * @function rotateExact
     * @param {number} angle - The exact angle to rotate the shape to.
     * @param {number} angleMode - The angle mode to use (default: DEGREES).
     * @description Rotates the shape to the exact specified angle.
     */
    rotateExact(angle, angleMode = DEGREES) {    
        this.angle = angle;
        this.dorotate = true;
        this.anglem = angleMode;
    }

    /**
     * @function resetRotation
     * @description Resets the rotation of the shape.
     */
    resetRotation() {
        this.angle = 0;
        this.dorotate = false;
    }

    /**
     * @function trnslate
     * @param {number} dx - The amount to translate the shape in the x-direction.
     * @param {number} dy - The amount to translate the shape in the y-direction.
     * @description Translates the shape by the specified amount.
     */
    trnslate(dx, dy) {
        this.tx = dx;
        this.ty = dy;
        this.dotranslate = true;
    }

    /**
     * @function setTrnslate
     * @description Sets the translation of the shape.
     */
    unsetTrnslate() {
        this.dotranslate = false;
    }

    /**
     * @function resetTranslation
     * @description Resets the translation of the shape.
     */
    resetTranslation() {
        this.tx = 0;
        this.ty = 0;
        this.dotranslate = false;
    }

    /**
     * @function setTint
     * @param {number} r - The red component of the tint color.
     * @param {number} g - The green component of the tint color.
     * @param {number} b - The blue component of the tint color.
     * @param {number} a - The alpha component of the tint color.
     * @description Sets the tint color of the shape.
     */
    setTint(t = 0) {
        this.t = t
        this.dotint = true
    }

    /**
     * @function unsetTint
     * @description Unsets the tint color of the shape.
     */
    unsetTint() {      
        this.dotint = false;
    }

    /**
     * @function setStroke
     * @param {number} r - The red component of the stroke color.
     * @param {number} g - The green component of the stroke color.
     * @param {number} b - The blue component of the stroke color.
     * @description Sets the stroke color of the shape.
     */
    setStroke(r, g, b,o = 255) {
        this.dostroke = true;
        this.strokecolor = color(r, g, b,o);
    }

    /**
     * @function unsetStroke
     * @description Unsets the stroke color of the shape.
     */
    unsetStroke() {
        this.dostroke = false;
    }

    /**
     * @function setFill
     * @param {number} r - The red component of the fill color.
     * @param {number} g - The green component of the fill color.
     * @param {number} b - The blue component of the fill color.
     * @description Sets the fill color of the shape.
     */
    setFill(r, g, b, o = 255) {
        this.dofill = true;
        this.fillcolor = color(r, g, b, o);
    }

    /**
     * @function unsetFill
     * @description Unsets the fill color of the shape.
     */
    unsetFill() {
        this.dofill = false;
    }

    /**
     * @function setFillAlpha
     * @description Sets the alpha component of the fill color.
     * @param {*} a 
     */
    setFillAlpha(a) {
        this.fillcolor.setAlpha(a);
    }

    /**
     * @function setStrokeWeight
     * @param {number} weight - The stroke weight of the shape.
     * @description Sets the stroke weight of the shape.
     */
    setStrokeWeight(weight) {
        this.strokewidth = weight;
    }

    /**
     * @function incrementFill
     * @param {number} r - The amount to increment the red component of the fill color.
     * @param {number} g - The amount to increment the green component of the fill color.
     * @param {number} b - The amount to increment the blue component of the fill color.
     * @description Increments the fill color of the shape by the specified amount.
     */
    incrementFill(r, g, b) {
        this.dofill = true;
        this.fillcolor = color(this.fillcolor.r + r, this.fillcolor.g + g, this.fillcolor.b + b);
    }

    /**
     * @function incrementStroke
     * @param {number} r - The amount to increment the red component of the stroke color.
     * @param {number} g - The amount to increment the green component of the stroke color.
     * @param {number} b - The amount to increment the blue component of the stroke color.
     * @description Increments the stroke color of the shape by the specified amount.
     */
    incrementStroke(r, g, b) {
        this.dostroke = true;
        this.strokecolor = color(this.strokecolor.r + r, this.strokecolor.g + g, this.strokecolor.b + b);
    }

    /**
     * @function setRectOrientation
     * @param {string} orientation - The orientation of the rectangle (default: CORNER).
     * @description Sets the orientation of the rectangle.
     */
    setRectOrientation(orientation) {
        this.rectOrientation = orientation;
    }

    /**
     * @function getX
     * @returns {number} The x-coordinate of the shape.
     * @description Gets the x-coordinate of the shape.
     */
    getX() {
        return this.x;
    }

    /**
     * @function getY
     * @returns {number} The y-coordinate of the shape.
     * @description Gets the y-coordinate of the shape.
     */
    getY() {
        return this.y;
    }
}

/**
 * @class A wrapper for the rectangle class of p5.js
 */
class Rectangle extends ShapeWrapper {
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
    constructor(x, y, width, height, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
        super(x, y, fill, stroke, strokeWeight);
        this.width = width;
        this.height = height;
    }

    /**
     * @function draw
     * @description Draws the rectangle on the canvas.
     */
    draw() {
        rect(this.x, this.y, this.width, this.height);
    }

    /**
     * @method setWidth
     * @description Sets the width of the rectangle
     * @param {*} width 
     */
    setWidth(width) {
        this.width = width;
    }

    /**
     * @method setHeight
     * @description Sets the height of the rectangle
     * @param {*} height 
     */
    setHeight(height) {
        this.height = height
    }
}


/**
 * @class A wrapper for the circle class of p5.js
 * @description A class representing a circle shape.
 * @extends ShapeWrapper
 * @constructor
 * @param {number} x - The x-coordinate of the circle.
 * @param {number} y - The y-coordinate of the circle.
 * @param {number} radius - The radius of the circle.
 * @param {string} fill - The fill color of the circle in color format.
 * @param {string} stroke - The stroke color of the circle in color format.
 * @param {number} strokeWeight - The stroke weight of the circle.
 */
class Circle extends ShapeWrapper {
    constructor(x, y, radius, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
        super(x, y, fill, stroke, strokeWeight);
        this.radius = radius;
    }

    /**
     * @function draw
     * @description Draws the circle on the canvas.
     */
    draw() {
        circle(this.x, this.y, this.radius);
    }
}


/**
 * @class Triangle
 * @description A wrapper for the triangle class of p5.js
 * @extends ShapeWrapper
 * @constructor
 * @param {number} x - The x-coordinate of the triangle.
 * @param {number} y - The y-coordinate of the triangle.
 * @param {number} x1 - The x-coordinate of the first vertex of the triangle.
 * @param {number} y1 - The y-coordinate of the first vertex of the triangle.
 * @param {number} x2 - The x-coordinate of the second vertex of the triangle.
 * @param {number} y2 - The y-coordinate of the second vertex of the triangle.
 * @param {string} fill - The fill color of the triangle in color format.
 * @param {string} stroke - The stroke color of the triangle in color format.
 * @param {number} strokeWeight - The stroke weight of the triangle.
 */
class Triangle extends ShapeWrapper {
    constructor(x, y, x1, y1, x2, y2, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
        super(x, y);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.fill = fill;
        this.stroke = stroke;
        this.strokeWeight = strokeWeight;
    }

    /**
     * @function draw
     * @description Draws the triangle on the canvas.
     */
    draw() {
        triangle(this.x, this.y, this.x1, this.y1, this.x2, this.y2);
    }

    /**
     * @function move
     * @param {number} dx - The amount to move the triangle in the x-direction.
     * @param {number} dy - The amount to move the triangle in the y-direction.
     * @description Moves the triangle by the specified amount.
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.x1 += dx;
        this.y1 += dy;
        this.x2 += dx;
        this.y2 += dy;
    }

    /**
     * @function moveUp
     * @param {number} dy - The amount to move the triangle up.
     * @description Moves the triangle up by the specified amount.
     */
    moveUp(dy) {
        this.y -= dy;
        this.y1 -= dy;
        this.y2 -= dy;
    }

    /**
     * @function moveDown
     * @param {number} dy - The amount to move the triangle down.
     * @description Moves the triangle down by the specified amount.
     */
    moveDown(dy) {
        this.y += dy;
        this.y1 += dy;
        this.y2 += dy;
    }

    /**
     * @function moveLeft
     * @param {number} dx - The amount to move the triangle to the left.
     * @description Moves the triangle to the left by the specified amount.
     */
    moveLeft(dx) {
        this.x -= dx;
        this.x1 -= dx;
        this.x2 -= dx;
    }

    /**
     * @function moveRight
     * @param {number} dx - The amount to move the triangle to the right.
     * @description Moves the triangle to the right by the specified amount.
     */
    moveRight(dx) {
        this.x += dx;
        this.x1 += dx;
        this.x2 += dx;
    }

    /**
     * @function moveVertex
     * @param {number} dx - The amount to move the vertex in the x-direction.
     * @param {number} dy - The amount to move the vertex in the y-direction.
     * @param {number} vertex - The vertex to move (1, 2, or 3).
     * @description Moves the specified vertex of the triangle by the specified amount.
     */
    moveVertex(dx, dy, vertex) {
        if (vertex === 1) {
            this.x += dx;
            this.y += dy;
        } else if (vertex === 2) {
            this.x1 += dx;
            this.y1 += dy;
        } else if (vertex === 3) {
            this.x2 += dx;
            this.y2 += dy;
        } else {
            this.move(dx, dy);
        }
    }
}

/**
 * @class A wrapper for the line class of p5.js
 * @description A class representing a line shape.
 * @extends ShapeWrapper
 * @constructor
 * @param {number} x - The x-coordinate of the starting point of the line.
 * @param {number} y - The y-coordinate of the starting point of the line.
 * @param {number} x1 - The x-coordinate of the ending point of the line.
 * @param {number} y1 - The y-coordinate of the ending point of the line.
 * @param {string} fill - The fill color of the line in color format.
 * @param {string} stroke - The stroke color of the line in color format.
 * @param {number} strokeWeight - The stroke weight of the line.
 */
class Line extends ShapeWrapper {
    constructor(x, y, x1, y1, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
        super(x, y, fill, stroke, strokeWeight);
        this.x1 = x1;
        this.y1 = y1;
    }

    /**
     * @function draw
     * @description Draws the line on the canvas.
     */
    draw() {
        line(this.x, this.y, this.x1, this.y1);
    }

    /**
     * @function move
     * @param {number} dx - The amount to move the line in the x-direction.
     * @param {number} dy - The amount to move the line in the y-direction.
     * @description Moves the line by the specified amount.
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.x1 += dx;
        this.y1 += dy;
    }

    /**
     * @function moveUp
     * @param {number} dy - The amount to move the line up.
     * @description Moves the line up by the specified amount.
     */
    moveUp(dy) {
        this.y -= dy;
        this.y1 -= dy;
    }

    /**
     * @function moveDown
     * @param {number} dy - The amount to move the line down.
     * @description Moves the line down by the specified amount.
     */
    moveDown(dy) {
        this.y += dy;
        this.y1 += dy;
    }

    /**
     * @function moveLeft
     * @param {number} dx - The amount to move the line to the left.
     * @description Moves the line to the left by the specified amount.
     */
    moveLeft(dx) {
        this.x -= dx;
        this.x1 -= dx;
    }

    /**
     * @function moveRight
     * @param {number} dx - The amount to move the line to the right.
     * @description Moves the line to the right by the specified amount.
     */
    moveRight(dx) {
        this.x += dx;
        this.x1 += dx;
    }

    /**
     * @function moveVertex
     * @param {number} dx - The amount to move the vertex in the x-direction.
     * @param {number} dy - The amount to move the vertex in the y-direction.
     * @param {number} vertex - The vertex to move (1 or 2).
     * @description Moves the specified vertex of the line by the specified amount.
     */
    moveVertex(dx, dy, vertex) {
        if (vertex === 1) {
            this.x += dx;
            this.y += dy;
        } else if (vertex === 2) {
            this.x1 += dx;
            this.y1 += dy;
        } else {
            this.move(dx, dy);
        }
    }
}

/**
 * @class A wrapper for the point class of p5.js
 * @description A class representing a point shape.
 * @extends ShapeWrapper
 * @constructor
 * @param {number} x - The x-coordinate of the point.
 * @param {number} y - The y-coordinate of the point.
 * @param {string} fill - The fill color of the point in color format.
 * @param {string} stroke - The stroke color of the point in color format.
 * @param {number} strokeWeight - The stroke weight of the point.
 */
class Point extends ShapeWrapper {
    constructor(x, y, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
        super(x, y, fill, stroke, strokeWeight);
    }

    /**
     * @function draw
     * @description Draws the point on the canvas.
     */
    draw() {
        point(this.x, this.y);
    }
}

/**
 * @class Ellipse
 * @description A wrapper for the ellipse class of p5.js
 * @extends ShapeWrapper
 * @constructor
 * @param {number} x - The x-coordinate of the ellipse.
 * @param {number} y - The y-coordinate of the ellipse.
 * @param {number} width - The width of the ellipse.
 * @param {number} height - The height of the ellipse.
 * @param {string} fill - The fill color of the ellipse in color format.
 * @param {string} stroke - The stroke color of the ellipse in color format.
 * @param {number} strokeWeight - The stroke weight of the ellipse.
 */
class Ellipse extends ShapeWrapper {
    constructor(x, y, width, height, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
        super(x, y, fill, stroke, strokeWeight);
        this.width = width;
        this.height = height;
    }

    /**
     * @function draw
     * @description Draws the ellipse on the canvas.
     */
    draw() {
        ellipse(this.x, this.y, this.width, this.height);
    }
}



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
class Img extends ShapeWrapper {
    constructor(img, x, y, width, height, fill = color(0,0,0), stroke = color(0,0,0), strokeWeight = 1) {
       super(x, y, fill, stroke, strokeWeight);
        this.img = img;
        this.width = width;
        this.height = height;
        this.imageOrientation = CORNER;
    }

    /**
     * @function draw
     * @description Draws the image on the canvas.
     */
   draw() {
        imageMode(this.imageOrientation);
        image(this.img, this.x, this.y, this.width, this.height);
    }

    /**
     * @function setImageOrientation
     * @param {string} orientation - The orientation of the image.
     * @description Sets the orientation of the image.
     */
    setImageOrientation(orientation) {
        this.imageOrientation = orientation;
    }
}

/**
 * @class A wrapper for the text class of p5.js
 * @description A class representing a text shape.
 * @extends ShapeWrapper
 * @constructor
 * @param {string} text - The text to display.
 * @param {number} size - The font size of the text.
 * @param {string} font - The font family of the text (default: 'Arial').
 * @param {number} x - The x-coordinate of the text.
 * @param {number} y - The y-coordinate of the text.
 * @param {string} fill - The fill color of the text in color format.
 */
class Text extends ShapeWrapper {
    constructor(text, size, font = 'Arial', x, y, fill = color(0,0,0)) {
        super(x, y,fill);
        this.text = text;
        this.size = size;
        this.font = font;
        this.textOrientation = [LEFT, BOTTOM];
    }
    /**
     * @function draw
     * @description Draws the text on the canvas.
     */
    draw() {
        textFont(this.font);
        textSize(this.size);
        textAlign(this.textOrientation[0],this.textOrientation[1]);
        text(this.text, this.x, this.y);
    }
    /**
     * @function setTextOrientation
     * @param {string} horizontal - The horizontal alignment of the text (default: LEFT).
     * @param {string} vertical - The vertical alignment of the text (default: BOTTOM).
     * @description Sets the orientation of the text.
     */
    setTextOrientation(horizontal = LEFT, vertical = BOTTOM) {
        this.textOrientation[0] = horizontal;
        this.textOrientation[1] = vertical;
    }
    /**
     * @function setFont
     * @param {string} font - The font family of the text.
     * @description Sets the font of the text.
     */
    setFont(font) {
        this.font = font;
    }
}

/**
 * @class ShapeGroup
 * @description This is a class that is intended to hold groups of shapes and call functions on them at the same time.
 */
class ShapeGroup {
    /**
     * @constructor
     * @param {*} type 
     */
    constructor(type,...args) {
        this.shapes = [];
        for (let i = 0; i < args.length; i++) {
            if (!(args[i] instanceof type)) {
                throw new Error('All arguments must be of the same type');
            }
            this.shapes.push(args[i]);
        }
    }

    /**
     * @method callFunction
     * @description Calls a function on all the shapes in the group.
     * @param {*} functname 
     */
    callFunction(functname,...args) {
        for (let i = 0; i < this.shapes.length; i++) {
            if (typeof this.shapes[i][functname] === 'function') {
                this.shapes[i][functname](...args);
            }
        }
    }


}