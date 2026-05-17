/**
 * @file Popup.ts
 * @description This file is responsible for the popup component
 * It is a square popup that can appear in the center of any screen an indicates useful information
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

import p5 from "p5";
import BaseMenuItem from "./BaseMenuItem";
import { getCanvasSize } from "../sketch";

//This interface contains a number of optional features that the popup box can have
interface PopupOptions {
  title?: string; //The title that the popup box will have
  message?: string; //The message that the popup box will have
}

export default class Popup extends BaseMenuItem {
  //State of the popup box
  private do_transition_in: boolean = false;
  private do_transition_out: boolean = false;
  private transitionY: number;

  //Configuration of the popup box
  private titleText: string = "";
  private messageText: string = "";

  constructor(
    sketch: p5,
    xPercent: number,
    yPercent: number,
    options: PopupOptions = {},
    opacity: number = 0,
  ) {
    super(sketch, xPercent, yPercent, opacity);
    if (options.title) {
      this.titleText = options.title;
    }
    if (options.message) {
      this.messageText = options.message;
    }
    this.transitionY = 1;
  }

  public reset(): void {}

  public draw(): void {
    //The base popup should be a black square lined with a white border. It should be centered on the screen
    // it should also be above all other graphics on the screen
    this.getSketch().push();
    this.getSketch().rectMode(this.getSketch().CENTER);
    this.getSketch().fill(0, this.getOpacity());
    this.getSketch().stroke(255, this.getOpacity());
    this.getSketch().strokeWeight(5);
    this.getSketch().square(
      this.getXPercent() * getCanvasSize(),
      this.getYPercent() * getCanvasSize() + this.transitionY * getCanvasSize(),
      getCanvasSize() / 2,
    );
    //The popup can have a title and or a message (both are optional)
    this.getSketch().noStroke();
    this.getSketch().fill(255, this.getOpacity());
    this.getSketch().textAlign(
      this.getSketch().CENTER,
      this.getSketch().CENTER,
    );
    const canvasSize = getCanvasSize();
    this.getSketch().textSize(canvasSize * 0.055);
    //The text should be constrained to the popup box
    this.getSketch().text(
      this.titleText,
      this.getXPercent() * canvasSize,
      this.getYPercent() * canvasSize -
        canvasSize * 0.13 +
        this.transitionY * canvasSize,
      canvasSize / 2 - 20,
      canvasSize * 0.08,
    );
    this.getSketch().textSize(canvasSize * 0.028);
    this.getSketch().text(
      this.messageText,
      this.getXPercent() * canvasSize,
      this.getYPercent() * canvasSize +
        canvasSize * 0.04 +
        this.transitionY * canvasSize,
      canvasSize / 2 - 40,
      canvasSize / 4,
    );
    this.getSketch().pop();

    if (this.do_transition_in) {
      this.animateTranstionIn();
    }
    if (this.do_transition_out) {
      this.animateTransitionOut();
    }
  }

  /**
   * @method animateTranstionIn
   * @description Animates the transition in
   */
  private animateTranstionIn(): void {
    this.setOpacity(this.getOpacity() + 15);
    this.transitionY <= 0 ? (this.transitionY = 0) : (this.transitionY -= 0.05);
    if (this.getOpacity() >= 255 && this.transitionY <= 0) {
      this.setOpacity(255);
      // this.transitionY = 0;
      this.do_transition_in = false;
      this.setSelected(true);
    }
  }

  /**
   * @method animateTransitionOut
   * @description This method animates the popup box out of the screen by fading it out while moving it downwards
   * and off the screen (quickly)
   */
  private animateTransitionOut(): void {
    this.setOpacity(this.getOpacity() - 15);
    this.transitionY >= 1 ? (this.transitionY = 1) : (this.transitionY += 0.05);
    if (this.getOpacity() <= 0 && this.transitionY >= 1) {
      this.setOpacity(0);
      // this.transitionY = 1;
      this.do_transition_out = false;
      this.setSelected(false);
    }
  }

  /**
   * @method activateTransitionIn
   * @description Activates the transition animation
   */
  public activateTransitionIn(): void {
    this.do_transition_in = true;
  }

  /**
   * @method activateTransitionOut
   * @description Activates the transition animation
   */
  public activateTransitionOut(): void {
    this.do_transition_out = true;
  }
}
