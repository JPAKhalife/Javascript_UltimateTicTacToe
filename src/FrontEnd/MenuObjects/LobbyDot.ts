/**
 * @file LobbyDot.ts
 * @description This file is responsible for defining the object that allows lobbies to be displayed
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import {getCanvasSize, getRandomInt } from "../sketch";
import { FRAMERATE } from "../Constants";
import MenuItem from "./MenuItem";
import MenuNav from "./MenuNav";
import { stringify } from "querystring";

//These are constants for this class
//THe value that framerate is being multiplied by is the number of seconds.
const DOT_ENTER_ANIMATION_TIME = FRAMERATE * 3;
const PULSE_ANIMATION_TIME = FRAMERATE * 2;

/**
 * This is an object that will contain all the neccessary information that should be displayed
 * When a user is looking at a lobby.
 */
export class LobbyInfo {
    public lobbyName: string;
    public state: string;
    public players: number;
    public gridsize: number;
    public levelsize: number;

    constructor(
        lobbyName: string = "defaultLobby",
        state: string = "DNE", 
        players: number = 0,
        gridsize: number = 3,
        levelsize: number = 2) {
        this.lobbyName = lobbyName;
        this.state = state;
        this.players = players;
        this.gridsize = gridsize;
        this.levelsize = levelsize;
    }
}

//Within a square area, draw a dot at a random location, with a fading circle expanding from it.
//When the dot is hovered over, a small menu will open up with details of the lobby that the dot represents
//This is intended to replicate the lobby of crime.net on Payday 2
export default class LobbyDot implements MenuItem {
    
    private sketch: p5;
    //Constants having to do with physical properties
    private x: number;
    private y: number;
    private opacity: number;
    private size: number;
    //Information about the object
    private info: any;
    private selected: boolean = false;
    private confirmed: boolean = false;
    //Transition variables
    private doTransitionIn: boolean = true;
    private doTransitionOut: boolean = false;
    private lifeTime: number;
    private navMenu: MenuNav;
    //Box Coordinates
    private boxX: number;
    private boxY: number;
    //Pulse variables
    private radius: number = 0;
    private pulseOpacity: number = 255;
    private pulseTime: number = PULSE_ANIMATION_TIME;
    private pulseInterval: number = 0;

    //TODO: Make a specific object for lobby info
    constructor(sketch: p5, x: number, y: number, size: number, lifetime: number, info: any, menuNav: MenuNav, boxX: number, boxY: number) {
        this.sketch = sketch;
        this.opacity = 0;
        this.x = x;
        this.y = y;
        this.boxX = boxX;
        this.boxY = boxY;
        this.size = size;
        this.info = 0;
        this.doTransitionIn = true;
        this.lifeTime = lifetime;
        this.navMenu = menuNav;
    }

    public draw(): void 
    {
        //Draw the point on the x or y
        this.sketch.push();
            this.sketch.stroke(255,this.opacity);
            this.sketch.strokeWeight(this.size);
            this.sketch.point(this.x, this.y);
        this.sketch.pop();

        if (this.doTransitionIn) {
            this.transitionIn();   
        } else if (this.doTransitionOut) { 
            this.transitionOut();
        } else {
            this.pulse();
        }

        //This is the part that draws the info displayer on the menu.
        if (this.isSelected()) {
            this.drawSelected();
        }

        if (this.lifeTime <= 0) {
            this.doTransitionOut = true;
        }

        if (!this.isSelected()) {
            this.lifeTime--;
        }
    }

    /**
     * @method isSelected
     * @description Returns whether or not the button is selected
     * @returns {number} - The x position of the dot
     */
    public isSelected(): boolean {
        return this.selected;
    }

    /**
     * @method setSelected
     * @description This method is called to set the selected state of the button
     * @param isSelected {boolean} - The selected state of the button
     */
    public setSelected(isSelected: boolean): void {
        this.selected = isSelected;
    }

    /**
     * @method getX
     * @description Returns the x position of the dot
     * @returns {number} - The x position of the dot
     */
    public getX(): number {
        return this.x;
    }

    /**
     * @method getY
     * @description Returns the y position of the dot
     * @returns {number} - The y position of the dot
     */
    public getY(): number {
        return this.y;
    }

    /**
     * @method reset
     * @description Resets the dot to it's default state
     */
    public reset(): void {
        this.selected = false;
    }

    /**
     * @method confirm
     * @description Confirms the selected dot
     */
    public confirm(): void {
        this.confirmed = true;
    }

    /**
     * @method transitionIn
     * @description This method transitions the dot in by increasing its opacity
     */
    private transitionIn(): void {
        // Increase the opacity
        this.opacity += 255 / DOT_ENTER_ANIMATION_TIME;
        if (this.opacity >= 255) {
            this.opacity = 255;
            this.doTransitionIn = false;
        }
    }

    /**
     * @method transitionOut
     * @description This method transitions the dot in by decreasing its opacity
     */
    private transitionOut(): void {
        // Increase the opacity
        this.opacity -= 255 / DOT_ENTER_ANIMATION_TIME;
        if (this.opacity <= 0) {
            this.opacity = 0;
            this.doTransitionOut = false;
            //Remove itself from the lobbyNav
            this.navMenu.removeItem(this);
        }
    }

    /**
     * @method pulse
     * @description This method creates a pulse around the dot - a circle that expands and fades out
     */
    private pulse(): void{
        
        if (this.pulseInterval > 0) {
            this.pulseInterval -= 1;
        } else {
            this.sketch.push();
                this.sketch.stroke(255,this.pulseOpacity);
                this.sketch.noFill();
                this.sketch.circle(this.x, this.y, this.radius);
            this.sketch.pop();
            //Increase the radius and decrease the opacity
            this.radius += 5;
            this.pulseOpacity -= 255 / PULSE_ANIMATION_TIME;
            this.pulseTime -= 1;
            //TODO: Add a random time period between each pulse
            if (this.pulseTime <= 0) {
                this.radius = 0;
                this.pulseOpacity = 255;
                this.pulseTime = PULSE_ANIMATION_TIME;
                this.pulseInterval = getRandomInt(2*FRAMERATE,6*FRAMERATE);
            }
        }
    }

    /**
     * @method drawSelected
     * @description This method is activated when the a
     * @param
     */
    private drawSelected() {
        //Draw a line from the dot to the center of the screen
        this.sketch.push();
            this.sketch.strokeWeight(3);
            this.sketch.stroke(255);
            this.sketch.line(this.x,this.y, this.boxX, this.boxY);
            this.sketch.fill(0);
            this.sketch.strokeWeight(2);
        this.sketch.pop();
    }
}