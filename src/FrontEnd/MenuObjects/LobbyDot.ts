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
import BaseMenuItem from "./BaseMenuItem";
import MenuNav from "./MenuNav";

//These are constants for this class
//THe value that framerate is being multiplied by is the number of seconds.
const DOT_ENTER_ANIMATION_TIME = FRAMERATE * 3;
const PULSE_ANIMATION_TIME = FRAMERATE * 2;

/**
 * This is an object that will contain all the neccessary information that should be displayed
 * When a user is looking at a lobby.
 */
export class LobbyInfo {
    public lobbyID: string;
    public state: string;
    public playerNum: number;
    public joinedPlayers: number;
    public gridsize: number;
    public levelsize: number;
    public allowSpectators: boolean;

    constructor(
        lobbyID: string,
        state: string, 
        playerNum: number,
        gridsize: number,
        levelsize: number,
        joinedPlayers: number,
        allowSpectators: boolean) {
        this.lobbyID = lobbyID;
        this.state = state;
        this.playerNum = playerNum;
        this.gridsize = gridsize;
        this.levelsize = levelsize;
        this.joinedPlayers = joinedPlayers;
        this.allowSpectators = allowSpectators;
    }
}

//Within a square area, draw a dot at a random location, with a fading circle expanding from it.
//When the dot is hovered over, a small menu will open up with details of the lobby that the dot represents
//This is intended to replicate the lobby of crime.net on Payday 2
export default class LobbyDot extends BaseMenuItem {
    
    private size: number;
    //Information about the object
    private info: LobbyInfo;
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
    constructor(sketch: p5, xPercent: number, yPercent: number, sizePercent: number, lifetime: number, info: LobbyInfo, menuNav: MenuNav, boxXPercent: number, boxYPercent: number) {
        super(sketch, xPercent, yPercent, 0)
        this.boxX = boxXPercent;
        this.boxY = boxYPercent;
        this.size = sizePercent;
        this.info = info;
        this.doTransitionIn = true;
        this.lifeTime = lifetime;
        this.navMenu = menuNav;
    }

    public draw(currentCanvasSize?: number): void 
    {
        const canvasSize = currentCanvasSize || getCanvasSize();
        
        //Draw the point on the x or y
        this.getSketch().push();
            this.getSketch().stroke(255,this.getOpacity());
            this.getSketch().strokeWeight(this.size * canvasSize);
            this.getSketch().point(this.getX(canvasSize), this.getY(canvasSize));
        this.getSketch().pop();

        if (this.doTransitionIn) {
            this.transitionIn();   
        } else if (this.doTransitionOut && !this.isSelected()) { 
            this.transitionOut();
        } else {
            this.pulse(canvasSize);
        }

        //This is the part that draws the info displayer on the menu.
        if (this.isSelected()) {
            this.drawSelected(canvasSize);
        }

        if (this.lifeTime <= 0) {
            this.doTransitionOut = true;
        }

        if (!this.isSelected()) {
            this.lifeTime--;
        }
    }

    /**
     * @method reset
     * @description Resets the dot to it's default state
     */
    public reset(): void {
        this.setSelected(false);
    }


    /**
     * @method transitionIn
     * @description This method transitions the dot in by increasing its opacity
     */
    private transitionIn(): void {
        // Increase the opacity
        this.setOpacity(this.getOpacity() + 255 / DOT_ENTER_ANIMATION_TIME);
        if (this.getOpacity() >= 255) {
            this.setOpacity(255);
            this.doTransitionIn = false;
        }
    }

    /**
     * @method transitionOut
     * @description This method transitions the dot in by decreasing its opacity
     */
    private transitionOut(): void {
        // Increase the opacity
        this.setOpacity(this.getOpacity() - 255 / DOT_ENTER_ANIMATION_TIME);
        if (this.getOpacity() <= 0) {
            this.setOpacity(0);
            this.doTransitionOut = false;
            //Remove itself from the lobbyNav
            this.navMenu.removeItem(this);
        }
    }

    /**
     * @method pulse
     * @description This method creates a pulse around the dot - a circle that expands and fades out
     * @param currentCanvasSize The current canvas size
     */
    private pulse(currentCanvasSize: number): void{
        
        if (this.pulseInterval > 0) {
            this.pulseInterval -= 1;
        } else {
            this.getSketch().push();
                this.getSketch().stroke(255,this.pulseOpacity);
                this.getSketch().noFill();
                this.getSketch().circle(this.getX(currentCanvasSize), this.getY(currentCanvasSize), this.radius);
            this.getSketch().pop();
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
     * @description This method is activated when the dot is selected
     * @param currentCanvasSize The current canvas size
     */
    private drawSelected(currentCanvasSize: number) {
        //Draw a line from the dot to the center of the screen
        this.getSketch().push();
            this.getSketch().strokeWeight(3);
            this.getSketch().stroke(255);
            this.getSketch().line(this.getX(currentCanvasSize), this.getY(currentCanvasSize), this.boxX * currentCanvasSize, this.boxY * currentCanvasSize);
            this.getSketch().fill(0);
            this.getSketch().strokeWeight(2);
        this.getSketch().pop();
    }
    

    /**
     * @method activateFade
     * @description begins the fade out animation and removes itself from the menuNav
     */
    public activateFade(): void {
        this.doTransitionOut = true;
    }

    /**
     * @method getLobbyInfo
     * @description Used by the multiplayerLobby class to easiliy access a lobby's info.
     * @returns A LobbyInfo Object
     */
    public getLobbyInfo() {
        return this.info;
    }

    /**
     * @method selectedLobbyInfo
     * @description Used by the multiplayerLobby class to update a lobbydot's info.
     * @param lobbyInfo - A LobbyInfo object that the lobbyDot will take on.
     */
    public setLobbyInfo(lobbyInfo: LobbyInfo) {
        this.info = lobbyInfo;
    }
}
