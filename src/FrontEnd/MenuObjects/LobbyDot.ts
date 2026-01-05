/**
 * @file LobbyDot.ts
 * @description This file is responsible for defining the object that allows lobbies to be displayed
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import { getCanvasSize, getRandomInt } from "../sketch";
import { FRAMERATE } from "../Constants";
import BaseMenuItem from "./BaseMenuItem";
import MenuNav from "./MenuNav";

//These are constants for this class
//THe value that framerate is being multiplied by is the number of seconds.
const DOT_ENTER_ANIMATION_TIME = FRAMERATE * 3;
const PULSE_ANIMATION_TIME = FRAMERATE * 2;
const SELECTION_TRANSITION_TIME = FRAMERATE * 3; // 3 seconds for selection transition
const ERROR_ANIMATION_TIME = FRAMERATE * 1; // 1 second for error animation

/**
 * This is an object that will contain all the neccessary information that should be displayed
 * When a user is looking at a lobby.
 */
export class LobbyInfo {
  public lobbyID: string;
  public lobbyName: string;
  public state: string;
  public playerNum: number;
  public joinedPlayers: number;
  public gridsize: number;
  public levelsize: number;
  public allowSpectators: boolean;

  constructor(
    lobbyID: string,
    lobbyName: string,
    state: string,
    playerNum: number,
    gridsize: number,
    levelsize: number,
    joinedPlayers: number,
    allowSpectators: boolean,
  ) {
    this.lobbyID = lobbyID;
    this.lobbyName = lobbyName;
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
  private doSelectionTransition: boolean = false;
  private doErrorAnimation: boolean = false;
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
  //Selection transition variables
  private selectionTransitionRadius: number = 0;
  private selectionTransitionStrokeWeight: number = 0;
  private selectionTransitionTime: number = SELECTION_TRANSITION_TIME;
  private selectionTransitionComplete: boolean = false;
  private onTransitionComplete: (() => void) | null = null;
  //Error animation variables
  private errorAnimationTime: number = ERROR_ANIMATION_TIME;
  private errorShakeOffset: number = 0;
  private errorShakeDirection: number = 1;
  private errorFlashOpacity: number = 0;

  //TODO: Make a specific object for lobby info
  constructor(
    sketch: p5,
    xPercent: number,
    yPercent: number,
    sizePercent: number,
    lifetime: number,
    info: LobbyInfo,
    menuNav: MenuNav,
    boxXPercent: number,
    boxYPercent: number,
  ) {
    super(sketch, xPercent, yPercent, 0);
    this.boxX = boxXPercent;
    this.boxY = boxYPercent;
    this.size = sizePercent;
    this.info = info;
    this.doTransitionIn = true;
    this.lifeTime = lifetime;
    this.navMenu = menuNav;
  }

  public draw(currentCanvasSize?: number): void {
    const canvasSize = currentCanvasSize || getCanvasSize();

    // If selection transition is active, handle it
    if (this.doSelectionTransition) {
      this.selectionTransition(canvasSize);
      return; // Skip other drawing when in selection transition
    }

    // Calculate position with shake offset for error animation
    const xPos = this.doErrorAnimation
      ? this.getX(canvasSize) + this.errorShakeOffset
      : this.getX(canvasSize);
    const yPos = this.getY(canvasSize);

    //Draw the point on the x or y
    this.getSketch().push();
    this.getSketch().stroke(255, this.getOpacity());
    this.getSketch().strokeWeight(this.size * canvasSize);
    this.getSketch().point(xPos, yPos);
    this.getSketch().pop();

    // Draw error flash circle if error animation is active
    if (this.doErrorAnimation && this.errorFlashOpacity > 0) {
      this.getSketch().push();
      this.getSketch().stroke(255, this.errorFlashOpacity);
      this.getSketch().strokeWeight(4);
      this.getSketch().noFill();
      this.getSketch().circle(xPos, yPos, canvasSize * 0.03);
      this.getSketch().pop();
    }

    if (this.doErrorAnimation) {
      this.animateError();
    } else if (this.doTransitionIn) {
      this.transitionIn();
    } else if (this.doTransitionOut && !this.isSelected()) {
      this.transitionOut();
    } else {
      this.pulse(canvasSize);
    }

    //This is the part that draws the info displayer on the menu.
    if (this.isSelected() && !this.doSelectionTransition && !this.doErrorAnimation) {
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
  private pulse(currentCanvasSize: number): void {
    if (this.pulseInterval > 0) {
      this.pulseInterval -= 1;
    } else {
      this.getSketch().push();
      this.getSketch().stroke(255, this.pulseOpacity);
      this.getSketch().noFill();
      this.getSketch().circle(
        this.getX(currentCanvasSize),
        this.getY(currentCanvasSize),
        this.radius,
      );
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
        this.pulseInterval = getRandomInt(2 * FRAMERATE, 6 * FRAMERATE);
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
    this.getSketch().line(
      this.getX(currentCanvasSize),
      this.getY(currentCanvasSize),
      this.boxX * currentCanvasSize,
      this.boxY * currentCanvasSize,
    );
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
   * @description Used by the multiplayerLobby class to easily access a lobby's info.
   * @returns A LobbyInfo Object
   */
  public getLobbyInfo(): LobbyInfo {
    return this.info;
  }

  /**
   * @method setLobbyInfo
   * @description Used by the multiplayerLobby class to update a lobbydot's info.
   * @param lobbyInfo - A LobbyInfo object that the lobbyDot will take on.
   */
  public setLobbyInfo(lobbyInfo: LobbyInfo): void {
    this.info = lobbyInfo;
  }

  /**
   * @method startSelectionTransition
   * @description Starts the selection transition animation
   * @param callback - Optional callback function to be called when the transition is complete
   */
  public startSelectionTransition(callback?: () => void): void {
    this.doSelectionTransition = true;
    this.selectionTransitionRadius = 0;
    this.selectionTransitionStrokeWeight = 2;
    this.selectionTransitionTime = SELECTION_TRANSITION_TIME;
    this.selectionTransitionComplete = false;
    this.onTransitionComplete = callback || null;
  }

  /**
   * @method selectionTransition
   * @description Animates the selection transition - a circle with thick white stroke expanding from the center
   * @param currentCanvasSize The current canvas size
   */
  private selectionTransition(currentCanvasSize: number): void {
    const sketch = this.getSketch();
    const x = this.getX(currentCanvasSize);
    const y = this.getY(currentCanvasSize);

    // Draw the expanding circle with white stroke and black fill on top of everything
    sketch.push();
    sketch.stroke(255);
    sketch.strokeWeight(this.selectionTransitionStrokeWeight);
    sketch.fill(0);
    sketch.circle(x, y, this.selectionTransitionRadius);
    sketch.pop();

    // Increase the radius and stroke weight (slower rate)
    this.selectionTransitionRadius +=
      currentCanvasSize / (SELECTION_TRANSITION_TIME / 2);
    this.selectionTransitionStrokeWeight += 0.25;
    this.selectionTransitionTime--;

    // Check if transition is complete
    if (
      this.selectionTransitionTime <= 0 ||
      this.selectionTransitionRadius >= currentCanvasSize * 2
    ) {
      this.doSelectionTransition = false;
      this.selectionTransitionComplete = true;

      // Call the callback if provided
      if (this.onTransitionComplete) {
        this.onTransitionComplete();
      }
    }
  }

  /**
   * @method isSelectionTransitionComplete
   * @description Checks if the selection transition is complete
   * @returns True if the selection transition is complete, false otherwise
   */
  public isSelectionTransitionComplete(): boolean {
    return this.selectionTransitionComplete;
  }

  /**
   * @method isSelectionTransitionActive
   * @description Checks if the selection transition is currently active
   * @returns True if the selection transition is active, false otherwise
   */
  public isSelectionTransitionActive(): boolean {
    return this.doSelectionTransition;
  }

  /**
   * @method startErrorAnimation
   * @description Starts the error animation (shake + red flash) and removes the dot after completion
   */
  public startErrorAnimation(): void {
    this.doErrorAnimation = true;
    this.errorAnimationTime = ERROR_ANIMATION_TIME;
    this.errorShakeOffset = 0;
    this.errorShakeDirection = 1;
    this.errorFlashOpacity = 255;
  }

  /**
   * @method animateError
   * @description Animates the error state - shakes the dot horizontally and shows a red flash circle
   */
  private animateError(): void {
    // Shake animation - oscillate horizontally
    const shakeAmplitude = 10; // pixels
    const shakeSpeed = 0.3; // how fast it shakes

    this.errorShakeOffset = Math.sin(this.errorAnimationTime * shakeSpeed) * shakeAmplitude;

    // Fade out the red flash
    this.errorFlashOpacity -= 255 / ERROR_ANIMATION_TIME;
    if (this.errorFlashOpacity < 0) {
      this.errorFlashOpacity = 0;
    }

    // Decrement timer
    this.errorAnimationTime--;

    // When animation is complete, trigger fade out to remove the dot
    if (this.errorAnimationTime <= 0) {
      this.doErrorAnimation = false;
      this.errorShakeOffset = 0;
      this.doTransitionOut = true;
    }
  }
}
