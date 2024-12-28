/**
 * @file GameScreen.ts
 * @description //This file is responsible for drawing the Game screen
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */


import p5 from "p5";
import GameManager, { GameType } from "../GameManager";
import KeyListener, { KEY_EVENTS } from "../KeyListener";
import Menu, { Screens } from "../Menu"
import TicTacBoard from "../MenuObjects/TicTacBoard";
import {Text, ShapeGroup } from "../ShapeWrapper";
import { getCanvasSize, fontmono, HEADER, fontOSDMONO } from "../sketch";


export default class GameScreen implements Menu {

    private keylistener: KeyListener;
    private sketch: p5;
    private game: GameManager;
    private board: TicTacBoard;
    private title: Text;
    private mode: Text;
    private currentPlayerTitle: Text;
    private currentPlayer: Text;
    private info: ShapeGroup;

    constructor(sketch: p5 ,gameType = GameType.LOCAL, gridSize = 3, gridLevels = 2) {
        this.keylistener = new KeyListener(sketch);
        this.sketch = sketch;
        //Create a game given the parameters passed to the function.
        this.game = new GameManager(gameType,gridSize,gridLevels);
        this.board = new TicTacBoard(this.sketch,this.game,this.game.getBoard(),getCanvasSize()/2,getCanvasSize()/2,getCanvasSize());

        //Despite that however, I need to display slightly different information depending on whether or not this is an online or offline game.
        //So the tictac will need to have a status attribute which keeps track of whether or not it is online or offline.

        //This display responsible for the offline game.
        //First we want to draw everything else except for the tictac

        this.title = new Text("Utimate Tictactoe",getCanvasSize()/2,getCanvasSize()/20*1,this.sketch,getCanvasSize()*0.04, fontmono);
        this.mode = new Text("Local Mode", getCanvasSize()/2,getCanvasSize()/20*2,this.sketch, getCanvasSize()*0.04 , fontmono);
        this.currentPlayerTitle = new Text('Current Player:', getCanvasSize()/2,getCanvasSize()/20*17,this.sketch,getCanvasSize()*0.03, fontmono);
        this.currentPlayer = new Text(HEADER.PLAYER_NAMES[0],getCanvasSize()/2,getCanvasSize()/20*18,this.sketch,getCanvasSize()*0.03,fontmono); //TODO: Track the current player
        this.info = new ShapeGroup(this.title, this.mode, this.currentPlayer, this.currentPlayerTitle);
        this.info.callFunctionOnAll('setFont',fontOSDMONO);
        this.info.callFunctionOnAll('setTextOrientation',this.sketch.CENTER,this.sketch.CENTER);
        this.info.callFunctionOnAll('setFill',255,255,255,255);

        //This display is responsible for the online game
        //TODO: online gui
        //THings I want to display
        // * The lobby name
        // * The number of spectators
        // * Your opponent (maybe shown in a you vs opponent title)
        // * The current player.
    }

    public draw(): void {
        this.sketch.background(0);
        //Render the information
        this.info.callFunctionOnAll('render');
        //Render our board
        this.board.draw();
    
        //Detect key presses that get put into the tictacboard
        let keyEvent = this.keylistener.listen();
        if (keyEvent == KEY_EVENTS.UP) {
            this.board.cursorUp();
        } else if (keyEvent == KEY_EVENTS.DOWN) {
            this.board.cursorDown();
        } else if (keyEvent == KEY_EVENTS.LEFT) {
            this.board.cursorLeft();
        } else if (keyEvent == KEY_EVENTS.RIGHT) {
            this.board.cursorRight();
        } else if (keyEvent == KEY_EVENTS.SELECT) {
            this.board.playMove();
        }
    }

    public resize(): void {

    }
}