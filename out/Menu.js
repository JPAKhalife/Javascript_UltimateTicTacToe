"use strict";
/**
 * @description A file containing the definition of every screen in the game.
 * @file Menu.ts
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-12-09
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScreens = exports.Screens = void 0;
var GuiManager_1 = require("./GuiManager");
var GameManager_1 = __importDefault(require("./GameManager"));
var GuiManager_2 = __importDefault(require("./GuiManager"));
var GameManager_2 = require("./GameManager");
var TicTac_1 = require("./TicTac");
var TicTacBoard_1 = __importDefault(require("./MenuObjects/TicTacBoard"));
var KeyListener_1 = __importDefault(require("./KeyListener"));
var KeyListener_2 = require("./KeyListener");
var sketch_1 = require("./sketch");
var sketch_2 = require("./sketch");
var Cutscene_1 = __importDefault(require("./Cutscene"));
var Floater_1 = __importDefault(require("./MenuObjects/Floater"));
var ShapeWrapper_1 = require("./ShapeWrapper");
var MenuButton_1 = __importDefault(require("./MenuObjects/MenuButton"));
var ButtonNav_1 = __importDefault(require("./MenuObjects/ButtonNav"));
var sketch_3 = require("./sketch");
exports.Screens = {
    SCREEN_NUM: 8,
    START_SCREEN: 0,
    SETUP_SCREEN: 1,
    LOADING_SCREEN: 2,
    HOW_TO_PLAY_SCREEN: 3,
    CONTROL_SCREEN: 4,
    GAME_SCREEN: 5,
    TEST_SCREEN: 6,
};
//the weight of the stroke around the btton during the confirmed animation
var STROKEWEIGHT = 15;
var SETUP_SCREEN_ANIMATION_TIME = 120;
var createScreens = function (sketch) {
    //This is a temporary test screen.
    var testScreen = new GuiManager_1.Menu(exports.Screens.TEST_SCREEN);
    testScreen.setInit(function () {
        this.game = new GameManager_1.default(GameManager_2.GameType.LOCAL, TicTac_1.DEFAULT_GRID_SIZE, 2);
        this.board = new TicTacBoard_1.default(sketch, this.game, this.game.getBoard(), (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() - 100);
        this.keylistener = new KeyListener_1.default(sketch);
    });
    testScreen.setDraw(function () {
        sketch.background(0);
        this.board.draw();
        //TODO: Work out some way of choosing betwen menu options and entering the tictac toe (might not be neccessary)
        // Detect key presses that get put into the tictacboard
        var keyEvent = this.keylistener.listen();
        if (keyEvent == KeyListener_2.KEY_EVENTS.UP) {
            this.board.cursorUp();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.DOWN) {
            this.board.cursorDown();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.LEFT) {
            this.board.cursorLeft();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.RIGHT) {
            this.board.cursorRight();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.SELECT) {
            this.board.selectTicTac();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.ESCAPE) {
            this.board.backTicTac();
        }
    });
    testScreen.setResize(function () {
        this.board.cachePoints(); //recalculate where every point should be on the tictac
    });
    //This is the creation of the start screen
    var startScreen = new GuiManager_1.Menu(exports.Screens.START_SCREEN);
    //Init method of the start screen
    startScreen.setInit(function () {
        this.keylistener = new KeyListener_1.default(sketch);
        //This is the text for the title
        this.title = new ShapeWrapper_1.Text(sketch_2.HEADER.START_SCREEN_TITLE, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5, this.sketch, (0, sketch_1.getCanvasSize)() * 0.05, sketch_3.fontPointless, this.sketch.color(255, 255, 255));
        this.title.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.title.setAngleMode(this.sketch.RADIANS);
        //This is the text for the author
        this.author = new ShapeWrapper_1.Text(sketch_2.HEADER.START_SCREEN_AUTHOR, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 3, this.sketch, (0, sketch_1.getCanvasSize)() * 0.05, sketch_3.fontAldoApache, this.sketch.color(127, 127, 127));
        this.author.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.author.setAngleMode(this.sketch.RADIANS);
        //This is the text for the start message
        this.startMessage = new ShapeWrapper_1.Text(sketch_2.HEADER.START_SCREEN_MESSAGE, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 2, this.sketch, (0, sketch_1.getCanvasSize)() * 0.05, sketch_3.fontSquareo, this.sketch, this.sketch.color(200, 200, 200));
        this.startMessage.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.startMessage.setAngleMode(this.sketch.RADIANS);
        //This is a variable to keep track of the sin function.
        this.s = 0;
        //Create a new animation for when the user presses the start button
        this.startCutscene = new Cutscene_1.default(this.keylistener, this.title, this.author, this.startMessage, this.s);
        //Set the animation condition
        this.startCutscene.setCondition(function () {
            if ((this.keylistener.listen() == KeyListener_2.KEY_EVENTS.SELECT) && (!Cutscene_1.default.isPlaying)) {
                this.activate();
                this.keylistener.deactivate();
            }
            else if (this.shapes[2].getY() < (0, sketch_1.getCanvasSize)() * -1) {
                this.deactivate();
                GuiManager_2.default.changeScreen(exports.Screens.SETUP_SCREEN);
            }
            else {
                this.shapes[2].setFillAlpha(128 + 128 * this.sketch.sin(this.sketch.millis() / 500));
            }
        });
        //Set the animation
        this.startCutscene.setAnimation(function () {
            //Set the y of all three titles - they all move at the same speed
            this.shapes[0].setY((0, sketch_1.getCanvasSize)() / 5 + (0, sketch_1.getCanvasSize)() * this.sketch.sin((this.shapes[3] + (100 * this.sketch.asin(3 / 4) + 200 * this.sketch.PI)) / 100) - (0, sketch_1.getCanvasSize)() / 4 * 3);
            this.shapes[1].setY((0, sketch_1.getCanvasSize)() / 10 * 3 + (0, sketch_1.getCanvasSize)() * this.sketch.sin((this.shapes[3] + (100 * this.sketch.asin(3 / 4) + 200 * this.sketch.PI)) / 100) - (0, sketch_1.getCanvasSize)() / 4 * 3);
            this.shapes[2].setY((0, sketch_1.getCanvasSize)() / 2 + (0, sketch_1.getCanvasSize)() * this.sketch.sin((this.shapes[3] + (100 * this.sketch.asin(3 / 4) + 200 * this.sketch.PI)) / 100) - (0, sketch_1.getCanvasSize)() / 4 * 3);
            this.shapes[3] += 2;
            //Increase the flashing of the bottom titles
            this.shapes[2].setFillAlpha(128 * this.sketch.sin(this.sketch.millis() / 50));
        });
    });
    //Set the draw function for startScreen
    startScreen.setDraw(function () {
        this.sketch.background(0);
        //Render titles
        this.title.render();
        this.author.render();
        this.startMessage.render();
        //listen for starting animation.
        this.startCutscene.listen();
    });
    //Set the resize function for startScreen
    startScreen.setResize(function () {
    });
    //Initialize setup screen
    var setupScreen = new GuiManager_1.Menu(exports.Screens.SETUP_SCREEN);
    //Set the init function for setupScreen
    setupScreen.setInit(function () {
        this.keylistener = new KeyListener_1.default(this.sketch);
        //Create floaters for the setup screen
        this.floater_array = new Array(4);
        for (var i = 0; i < 4; i++) {
            this.floater_array[i] = new Floater_1.default(this.sketch, sketch_3.whiteTicTac, 50, 50);
            this.floater_array[i].setOpacity(0);
            this.floater_array[i].init();
        }
        //Opacity and border position
        this.opacity = 0;
        this.border_pos = 0;
        // Border rectangle
        this.border = new ShapeWrapper_1.Rectangle((0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 2, this.sketch, (0, sketch_1.getCanvasSize)() + STROKEWEIGHT, (0, sketch_1.getCanvasSize)() + STROKEWEIGHT);
        this.border.unsetFill();
        this.border.setStrokeWeight(STROKEWEIGHT);
        this.border.setRectOrientation(this.sketch.CENTER);
        this.border.setStroke(255, 255, 255, 255);
        //This is the text for the title
        this.title = new ShapeWrapper_1.Text(sketch_2.HEADER.SETUP_SCREEN_TITLE, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5, this.sketch, (0, sketch_1.getCanvasSize)() * 0.05, sketch_3.fontPointless, this.sketch.color(255, 255, 255));
        this.title.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.title.setStroke(255, 255, 255, this.opacity);
        this.title.setFill(255, 255, 255, 0);
        //Here are the buttons for the setup screen
        this.multiplayer_MenuButton_list = new ButtonNav_1.default([new MenuButton_1.default(this.sketch, 0.5, 0.4, "Local", 0.1, 0.1, 50 * 0.25, 0),
            new MenuButton_1.default(this.sketch, 0.80, 0.85, "How to play", 0.05, 0.15, 50 * 0.25, 0),
            new MenuButton_1.default(this.sketch, 0.20, 0.85, "Controls", 0.05, 0.15, 50 * 0.25, 0),
            new MenuButton_1.default(this.sketch, 0.5, 0.6, "Online", 0.1, 0.1, 50 * 0.25, 0)]);
        //This is the animation intended for transitioning into the setup screen
        this.transition_in = new Cutscene_1.default(this.keylistener, this.multiplayer_MenuButton_list, this.floater_array, this.title, this.border, this.border_pos, this.opacity);
        //set the animation condition
        this.transition_in.setCondition(function () {
            if (this.shapes[1][this.shapes[1].length - 1].opacity >= 255) {
                this.deactivate();
                this.keylistener.activate();
            }
        });
        //Set the animation condition
        this.transition_in.setAnimation(function () {
            if (this.shapes[4] >= STROKEWEIGHT * 2) {
                for (var i = 0; i < this.shapes[0].buttonArray.length; i++) {
                    if (this.shapes[0].buttonArray[i].opacity <= 255) {
                        this.shapes[0].buttonArray[i].fadeIn(SETUP_SCREEN_ANIMATION_TIME / 3 * 2);
                    }
                }
                if (this.shapes[5] < 255) {
                    this.shapes[5] += 255 / (SETUP_SCREEN_ANIMATION_TIME / 3 * 2);
                    this.shapes[2].setStroke(255, 255, 255, this.shapes[5]);
                }
                if (this.shapes[5] >= 255) {
                    for (var i = 0; i < this.shapes[1].length; i++) {
                        this.shapes[1][i].fadeIn(SETUP_SCREEN_ANIMATION_TIME / 3);
                    }
                }
            }
            else {
                this.shapes[4] += (STROKEWEIGHT * 2) / (SETUP_SCREEN_ANIMATION_TIME / 3);
                this.shapes[3].setWidth((0, sketch_1.getCanvasSize)() + STROKEWEIGHT - this.shapes[4]);
                this.shapes[3].setHeight((0, sketch_1.getCanvasSize)() + STROKEWEIGHT - this.shapes[4]);
            }
        });
        this.keylistener.deactivate(); //We don't want the user to be capable of inputs during the animation
        this.transition_in.activate(); //activate the transition into the setup screen
        //This is the animation intended for transioning out of the setup screen
        this.transition_out = new Cutscene_1.default(this.keylistener, this.multiplayer_MenuButton_list, this.floater_array, this.title, this.border, STROKEWEIGHT * 2, 255);
        this.transition_out.setCondition(function () {
            if (this.shapes[0].currentlySelected.isConfirmed() && !Cutscene_1.default.isPlaying) {
                this.activate();
                this.keylistener.deactivate();
            }
            else if (this.shapes[0].currentlySelected.isConfirmedAnimationDone()) {
                this.deactivate();
                this.keylistener.activate();
                //In the event that the online or local button is pushed, we want to set up the x and y values for a transition
                if (this.shapes[0].currentlySelected.phrase == 'Online') {
                    GuiManager_2.default.changeScreen(exports.Screens.LOADING_SCREEN);
                }
                else if (this.shapes[0].currentlySelected.phrase == 'Local') {
                    GuiManager_2.default.changeScreen(exports.Screens.GAME_SCREEN);
                }
                else if (this.shapes[0].currentlySelected.phrase == 'Controls') {
                    GuiManager_2.default.changeScreen(exports.Screens.CONTROL_SCREEN);
                }
                else if (this.shapes[0].currentlySelected.phrase == 'How to play') {
                    GuiManager_2.default.changeScreen(exports.Screens.HOW_TO_PLAY_SCREEN);
                }
                else {
                    GuiManager_2.default.changeScreen(exports.Screens.START_SCREEN);
                }
            }
        });
        this.transition_out.setAnimation(function () {
            //Fade buttons
            for (var i = 0; i < this.shapes[0].buttonArray.length; i++) {
                if (this.shapes[0].buttonArray[i] == this.shapes[0].currentlySelected) {
                }
                else {
                    this.shapes[0].buttonArray[i].fade();
                }
            }
            //Fade out floaters
            for (var i = 0; i < this.shapes[1].length; i++) {
                this.shapes[1][i].fadeOut(MenuButton_1.default.CONFIRMED_ANIMATION_TIME / 4);
            }
            //Fade out border
            this.shapes[4] -= (STROKEWEIGHT * 2) / (MenuButton_1.default.CONFIRMED_ANIMATION_TIME / 4);
            this.shapes[3].setWidth((0, sketch_1.getCanvasSize)() + STROKEWEIGHT - this.shapes[4]);
            this.shapes[3].setHeight((0, sketch_1.getCanvasSize)() + STROKEWEIGHT - this.shapes[4]);
            this.shapes[2].setStroke(255, 255, 255, this.shapes[4]); //fade out the title
            this.shapes[5] -= 255 / (MenuButton_1.default.CONFIRMED_ANIMATION_TIME / 4);
        });
    });
    //set the draw function of the setup screen
    setupScreen.setDraw(function () {
        this.sketch.background(0);
        //Draw the border
        //this.border.callFunction('render');
        this.border.render();
        //Render out buttons
        for (var i = 0; i < this.multiplayer_MenuButton_list.buttonArray.length; i++) {
            this.multiplayer_MenuButton_list.drawAll();
        }
        //Render our floaters
        for (var i = 0; i < this.floater_array.length; i++) {
            this.floater_array[i].draw();
        }
        //Render our title
        this.title.render();
        //Detect any keypresses
        var keypress = this.keylistener.listen();
        //Detect for out entry and exit animations
        this.transition_in.listen();
        this.transition_out.listen();
        //w
        if (keypress == KeyListener_2.KEY_EVENTS.UP) {
            this.multiplayer_MenuButton_list.selectClosest(2);
            //d
        }
        else if (keypress == KeyListener_2.KEY_EVENTS.RIGHT) {
            this.multiplayer_MenuButton_list.selectClosest(1);
            //s
        }
        else if (keypress == KeyListener_2.KEY_EVENTS.DOWN) {
            this.multiplayer_MenuButton_list.selectClosest(0);
            //a
        }
        else if (keypress == KeyListener_2.KEY_EVENTS.LEFT) {
            this.multiplayer_MenuButton_list.selectClosest(3);
            //space
        }
        else if (keypress == KeyListener_2.KEY_EVENTS.SELECT) {
            this.opacity = 255;
            this.multiplayer_MenuButton_list.confirm();
        }
    });
    //Constants for the loading screen
    var LOADING_TRANSITION_IN = 180;
    //Adding the online loading screen
    var loadingScreen = new GuiManager_1.Menu(exports.Screens.LOADING_SCREEN);
    //Set the init
    loadingScreen.setInit(function () {
        this.keylistener = new KeyListener_1.default(this.sketch);
        //This is the spinner that sits in the corner
        this.spinner = new ShapeWrapper_1.Img(sketch_3.whiteTicTac, 0, 0, this.sketch, (0, sketch_1.getCanvasSize)() * 0.10, (0, sketch_1.getCanvasSize)() * 0.10);
        this.spinner.setRectOrientation(this.sketch.CENTER);
        this.spinner.setImageOrientation(this.sketch.CENTER);
        this.spinner.setAngleMode(this.sketch.RADIANS);
        this.spinner.trnslate(((0, sketch_1.getCanvasSize)() / 8) * (-1), ((0, sketch_1.getCanvasSize)() / 8) * 7);
        //This is the title
        this.title = new ShapeWrapper_1.Text(sketch_2.HEADER.LOADING_SCREEN_TITLE_MESSAGES[0] + sketch_2.HEADER.DOTS[0], (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5, this.sketch, (0, sketch_1.getCanvasSize)() * 0.07, sketch_3.fontRobot, this.sketch.color(255, 255, 255));
        this.title.setFill(255, 255, 255, 0);
        this.title.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        //This is the loading message
        this.loadingMessage = new ShapeWrapper_1.Text(sketch_2.HEADER.LOADING_SCREEN_MESSAGES[0], (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 2, this.sketch, (0, sketch_1.getCanvasSize)() * 0.03, sketch_3.fontminecraft, this.sketch.color(255, 255, 255));
        this.loadingMessage.setFill(255, 255, 255, 0);
        this.loadingMessage.setRectOrientation(this.sketch.CENTER);
        this.loadingMessage.setTextOrientation(this.sketch.CENTER, this.sketch.CENTER);
        this.loadingMessage.setTextBox((0, sketch_1.getCanvasSize)(), (0, sketch_1.getCanvasSize)());
        //This is the transition in cutscene
        this.transition_in = new Cutscene_1.default(this.keylistener, this.spinner, this.title, this.loadingMessage, ((0, sketch_1.getCanvasSize)() / 2) / 120, 0);
        //Set the animation condition of the transition in cutscene.
        this.transition_in.setCondition(function () {
            //deactivate when title fades in
            if (this.shapes[1].opacity >= 255) {
                this.deactivate();
                this.keylistener.activate();
            }
        });
        //Set the animation of the transition in cutscene
        this.transition_in.setAnimation(function () {
            //Start by moving in the spinner
            if (this.shapes[0].tx >= ((0, sketch_1.getCanvasSize)() / 8 * 7)) {
                //Once the tic tac has reached its position, stop and fade in.
                this.shapes[1].setFill(255, 255, 255, this.shapes[4]);
                this.shapes[2].setFill(255, 255, 255, this.shapes[4]);
                this.shapes[4] += 255 / (LOADING_TRANSITION_IN / 2);
            }
            else {
                this.shapes[0].tx += ((0, sketch_1.getCanvasSize)()) / (LOADING_TRANSITION_IN / 2);
            }
        });
        //Activate the transition in since we want it to be good
        this.keylistener.deactivate();
        this.transition_in.activate();
        //This is the loading cutscene, it will run constantly, regardless of other animations running.
        this.loadCutscene = new Cutscene_1.default(this.keylistener, this.spinner, 0, 0, (0, sketch_1.getRandomInt)(0, sketch_2.HEADER.LOADING_SCREEN_MESSAGES.length - 1), this.loadingMessage, 0, this.title);
        // TODO: When the back end has been created, set the deactivate condition
        this.loadCutscene.setAnimation(function () {
            this.shapes[0].rotateExact(this.shapes[2], this.sketch.DEGREES);
            this.shapes[0].setTint(255 / 2 * this.sketch.cos(this.shapes[1]) + 255 / 2);
            this.shapes[1] += 2;
            this.shapes[2] += 3;
            if ((this.shapes[2] / 3) % 60 == 0) {
                this.shapes[5]++;
                this.shapes[6].setText(sketch_2.HEADER.LOADING_SCREEN_TITLE_MESSAGES[0] + sketch_2.HEADER.DOTS[this.shapes[5] % sketch_2.HEADER.DOTS.length]);
            }
            if ((this.shapes[2] / 3) % 480 == 0) {
                this.shapes[3]++;
                this.shapes[4].setText(sketch_2.HEADER.LOADING_SCREEN_MESSAGES[this.shapes[3] % sketch_2.HEADER.LOADING_SCREEN_MESSAGES.length]);
            }
            //Just so we don't get integer overflow if the loadind screen stays on too long,
            if ((this.shapes[2] / 3) > 2147483645 / 3) {
                this.shapes[2] = 0;
            }
        });
        this.loadCutscene.activate();
        // TODO: Make an exit cutscene when it is neccessary
    });
    //Set the draw method
    loadingScreen.setDraw(function () {
        this.sketchbackground(0);
        this.spinner.render();
        this.title.render();
        this.loadingMessage.render();
        //Listen for our relevant cutscenes
        this.loadCutscene.listen();
        this.transition_in.listen();
    });
    var INFORMATION_SCREEN_TRANSITION_TIME = 60;
    //Set the resize method
    loadingScreen.setResize(function () { });
    //Create a new screen for How to play section
    var howToPlayScreen = new GuiManager_1.Menu(exports.Screens.HOW_TO_PLAY_SCREEN);
    //Set the init function of the howToPlayScreen
    howToPlayScreen.setInit(function () {
        this.keylistener = new KeyListener_1.default(this.sketch);
        //There are multiple screens in one for this screen. We will have a single cutscene that is used to transition between all of them.
        this.screenState = { value: 0, opacity: 0 };
        //This array is used for all of the images on each screen
        this.tutorialImages = [
            new ShapeWrapper_1.Img(sketch_3.tictacboard, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 20 * 9, this.sketch, (0, sketch_1.getCanvasSize)() * 0.4, (0, sketch_1.getCanvasSize)() * 0.4),
            new ShapeWrapper_1.Img(sketch_3.tictacboard_two, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 20 * 9, this.sketch, (0, sketch_1.getCanvasSize)() * 0.4, (0, sketch_1.getCanvasSize)() * 0.4),
            new ShapeWrapper_1.Img(sketch_3.tictacboard_three, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 20 * 9, this.sketch, (0, sketch_1.getCanvasSize)() * 0.4, (0, sketch_1.getCanvasSize)() * 0.4)
        ];
        for (var i = 0; i < this.tutorialImages.length; i++) {
            this.tutorialImages[i].setRectOrientation(this.sketch.CENTER);
            this.tutorialImages[i].setImageOrientation(this.sketch.CENTER);
            this.tutorialImages[i].setTint(0);
        }
        //This array will contain all of the paragraphs for each screen
        this.paragraphs = [
            new ShapeWrapper_1.ShapeGroup(new ShapeWrapper_1.Text("The Bigtictactoe board consists of one large tictactoe grid.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 1, this.sketch), new ShapeWrapper_1.Text("Each slot in the grid contains one smaller tictactoe grid.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 2, this.sketch), new ShapeWrapper_1.Text("The goal of the game is to get three points in a row on the large board.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 7, this.sketch), new ShapeWrapper_1.Text('Press space to continue.', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5 * 4, this.sketch)),
            new ShapeWrapper_1.ShapeGroup(new ShapeWrapper_1.Text("To start, player one can choose anyone of the small grids to play in.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10, this.sketch), new ShapeWrapper_1.Text("They are then able to mark anywhere in that small grid.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 2, this.sketch), new ShapeWrapper_1.Text("The next player will then be sent to the corresponding area on the large grid.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 7, this.sketch), new ShapeWrapper_1.Text('Press space to continue.', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5 * 4, this.sketch)),
            new ShapeWrapper_1.ShapeGroup(new ShapeWrapper_1.Text("The player can then choose any grid to play in if the grid they are sent to is taken.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10, this.sketch), new ShapeWrapper_1.Text("When a small grid is won, it becomes unable to be played in.", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 2, this.sketch), new ShapeWrapper_1.Text("That is everything! Have Fun!", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 10 * 7, this.sketch), new ShapeWrapper_1.Text('Press space to continue.', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5 * 4, this.sketch))
        ];
        for (var i = 0; i < this.paragraphs.length; i++) {
            this.paragraphs[i].callFunction("setFill", 255, 255, 255, 0);
            this.paragraphs[i].callFunction("setTextSize", (0, sketch_1.getCanvasSize)() * 0.02);
            this.paragraphs[i].callFunction("setFont", sketch_3.fontOSDMONO);
            this.paragraphs[i].callFunction("setRectOrientation", this.sketch.CENTER);
            this.paragraphs[i].callFunction("setTextOrientation", this.sketch.CENTER, this.sketch.CENTER);
        }
        //Now we need a transition animation for when the user presses space.
        this.changeScreen = new Cutscene_1.default(this.keylistener, this.tutorialImages, this.paragraphs, this.screenState, true);
        this.changeScreen.setCondition(function () {
            if (this.keylistener.listen() == KeyListener_2.KEY_EVENTS.SELECT && !Cutscene_1.default.isPlaying) {
                this.keylistener.deactivate();
                this.activate();
            }
        });
        this.changeScreen.setAnimation(function () {
            //Check if we are transitioning in
            if (this.shapes[3]) {
                //If we are, fade in
                if (this.shapes[2].opacity < 255) {
                    this.shapes[2].opacity += 255 / INFORMATION_SCREEN_TRANSITION_TIME;
                }
                else {
                    //Once we have completely faded in, set the transition in to false,
                    //And end the animation.
                    this.shapes[3] = false;
                    this.deactivate();
                    this.keylistener.activate();
                }
            }
            else {
                //We are transitioning out
                if (this.shapes[2].opacity > 0) {
                    this.shapes[2].opacity -= 255 / INFORMATION_SCREEN_TRANSITION_TIME;
                }
                else {
                    //Once we have faded out, it is time to fade in.
                    this.shapes[3] = true;
                    if (this.shapes[2].value >= this.shapes[0].length - 1) {
                        //If we are at the end, change the screen
                        this.deactivate();
                        this.keylistener.activate();
                        GuiManager_2.default.changeScreen(exports.Screens.SETUP_SCREEN);
                    }
                    else {
                        this.shapes[2].opacity = 0;
                        this.shapes[0][this.shapes[2].value].setTint(0);
                        this.shapes[1][this.shapes[2].value].callFunction('setFill', 255, 255, 255, 0);
                        this.shapes[2].value++;
                    }
                }
            }
            //While the animation is going, set the tint no matter what
            this.shapes[0][this.shapes[2].value].setTint(this.shapes[2].opacity);
            this.shapes[1][this.shapes[2].value].callFunction('setFill', 255, 255, 255, this.shapes[2].opacity);
        });
        this.changeScreen.activate();
    });
    //Set the draw function for the how to play screen
    howToPlayScreen.setDraw(function () {
        this.sketch.background(0);
        //Render the proper image and text
        this.tutorialImages[this.screenState.value].render();
        this.paragraphs[this.screenState.value].callFunction('render');
        //Listen for the transition animation
        this.changeScreen.listen();
    });
    //Set the resize function for the how to play screen
    howToPlayScreen.setResize(function () {
    });
    //Create the controls screen (works similarily to the how to play screen)
    var controlScreen = new GuiManager_1.Menu(exports.Screens.CONTROL_SCREEN);
    //set the init functino for the control screen
    controlScreen.setInit(function () {
        this.keylistener = new KeyListener_1.default(this.sketch);
        //There are multiple screens in one for this screen. We will have a single cutscene that is used to transition between all of them.
        this.screenState = { value: 0, opacity: 0 };
        //This array is used for all of the images on each screen
        this.tutorialImages = [
            new ShapeWrapper_1.ShapeGroup(new ShapeWrapper_1.Img(sketch_3.arrows, (0, sketch_1.getCanvasSize)() * 0.25, (0, sketch_1.getCanvasSize)() / 2, this.sketch, 150, 100), new ShapeWrapper_1.Img(sketch_3.wasd, (0, sketch_1.getCanvasSize)() / 4 * 3, (0, sketch_1.getCanvasSize)() / 2, this.sketch, 150, 100)),
            new ShapeWrapper_1.ShapeGroup(new ShapeWrapper_1.Img(sketch_3.space, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 2, this.sketch, 150, 100))
            // new ShapeGroup(Img,new Img(tictacboard_three,getCanvasSize()/2,getCanvasSize()/20*9,getCanvasSize()*0.4,getCanvasSize()*0.4))
        ];
        for (var i = 0; i < this.tutorialImages.length; i++) {
            this.tutorialImages[i].callFunction('setRectOrientation', this.sketch.CENTER);
            this.tutorialImages[i].callFunction('setImageOrientation', this.sketch.CENTER);
            this.tutorialImages[i].callFunction('setTint', 0);
        }
        //This array will contain all of the paragraphs for each screen
        this.paragraphs = [
            new ShapeWrapper_1.ShapeGroup(new ShapeWrapper_1.Text('Use the WASD and/or Arrow keys to navigate through menus and the Ultimate Tictactoe grid.', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5 * 2, this.sketch), new ShapeWrapper_1.Text('Press space to continue', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 4 * 2, this.sketch)),
            new ShapeWrapper_1.ShapeGroup(new ShapeWrapper_1.Text('Press space to select in the menus or play a spot on the Ultimate Tictactoe Grid.', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5 * 2, this.sketch), new ShapeWrapper_1.Text('Press space to continue', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 5 * 3, this.sketch)),
        ];
        for (var i = 0; i < this.paragraphs.length; i++) {
            this.paragraphs[i].callFunction("setFill", 255, 255, 255, 0);
            this.paragraphs[i].callFunction("setTextSize", (0, sketch_1.getCanvasSize)() * 0.02);
            this.paragraphs[i].callFunction("setFont", sketch_3.fontOSDMONO);
            this.paragraphs[i].callFunction("setRectOrientation", this.sketch.CENTER);
            this.paragraphs[i].callFunction("setTextOrientation", this.sketch.CENTER, this.sketch.CENTER);
            this.paragraphs[i].callFunction("setTextBox", (0, sketch_1.getCanvasSize)() / 4 * 3, (0, sketch_1.getCanvasSize)() / 4 * 1);
        }
        //Now we need a transition animation for when the user presses space.
        this.changeScreen = new Cutscene_1.default(this.keylistener, this.tutorialImages, this.paragraphs, this.screenState, true);
        this.changeScreen.setCondition(function () {
            if (this.keylistener.listen() == KeyListener_2.KEY_EVENTS.SELECT && !Cutscene_1.default.isPlaying) {
                this.keylistener.deactivate();
                this.activate();
            }
        });
        this.changeScreen.setAnimation(function () {
            //Check if we are transitioning in
            if (this.shapes[3]) {
                //If we are, fade in
                if (this.shapes[2].opacity < 255) {
                    this.shapes[2].opacity += 255 / INFORMATION_SCREEN_TRANSITION_TIME;
                }
                else {
                    //Once we have completely faded in, set the transition in to false,
                    //And end the animation.
                    this.shapes[3] = false;
                    this.deactivate();
                    this.keylistener.activate();
                }
            }
            else {
                //We are transitioning out
                if (this.shapes[2].opacity > 0) {
                    this.shapes[2].opacity -= 255 / INFORMATION_SCREEN_TRANSITION_TIME;
                }
                else {
                    //Once we have faded out, it is time to fade in.
                    this.shapes[3] = true;
                    if (this.shapes[2].value >= this.shapes[0].length - 1) {
                        //If we are at the end, change the screen
                        this.deactivate();
                        this.keylistener.activate();
                        GuiManager_2.default.changeScreen(exports.Screens.SETUP_SCREEN);
                    }
                    else {
                        this.shapes[2].opacity = 0;
                        this.shapes[0][this.shapes[2].value].callFunction('setTint', 0);
                        this.shapes[1][this.shapes[2].value].callFunction('setFill', 255, 255, 255, 0);
                        this.shapes[2].value++;
                    }
                }
            }
            //While the animation is going, set the tint no matter what
            this.shapes[0][this.shapes[2].value].callFunction('setTint', this.shapes[2].opacity);
            this.shapes[1][this.shapes[2].value].callFunction('setFill', 255, 255, 255, this.shapes[2].opacity);
        });
        this.changeScreen.activate();
    });
    controlScreen.setDraw(function () {
        this.sketch.background(0);
        //Render the proper image and text
        this.tutorialImages[this.screenState.value].callFunction('render');
        this.paragraphs[this.screenState.value].callFunction('render');
        //Listen for the transition animation
        this.changeScreen.listen();
    });
    //Set the resize functino of the controlScreen
    controlScreen.setResize(function () {
    });
    //Create a game screen for the local - and or online game
    var gameScreen = new GuiManager_1.Menu(exports.Screens.GAME_SCREEN);
    gameScreen.setInit(function (gameType, gridSize, gridLevels, lobby) {
        if (gameType === void 0) { gameType = GameManager_2.GameType.LOCAL; }
        if (gridSize === void 0) { gridSize = 3; }
        if (gridLevels === void 0) { gridLevels = 2; }
        if (lobby === void 0) { lobby = null; }
        this.keylistener = new KeyListener_1.default(this.sketch);
        //Create a game given the parameters passed to the function.
        this.game = new GameManager_1.default(gameType, gridSize, gridLevels);
        this.board = new TicTacBoard_1.default(this.sketch, this.game, this.game.getBoard(), (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)());
        //Despite that however, I need to display slightly different information depending on whether or not this is an online or offline game.
        //So the tictac will need to have a status attribute which keeps track of whether or not it is online or offline.
        //This display responsible for the offline game.
        //First we want to draw everything else except for the tictac
        this.title = new ShapeWrapper_1.Text("Utimate Tictactoe", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 20 * 1, this.sketch, (0, sketch_1.getCanvasSize)() * 0.04, sketch_1.fontmono);
        this.title.setTextSize();
        this.mode = new ShapeWrapper_1.Text("Local Mode", (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 20 * 2, this.sketch, (0, sketch_1.getCanvasSize)() * 0.04, sketch_1.fontmono);
        this.currentPlayerTitle = new ShapeWrapper_1.Text('Current Player:', (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 20 * 17, this.sketch, (0, sketch_1.getCanvasSize)() * 0.03, sketch_1.fontmono);
        this.currentPlayerTitle.setTextSize();
        this.currentPlayer = new ShapeWrapper_1.Text(sketch_2.HEADER.PLAYER_NAMES[0], (0, sketch_1.getCanvasSize)() / 2, (0, sketch_1.getCanvasSize)() / 20 * 18, this.sketch, (0, sketch_1.getCanvasSize)() * 0.03, sketch_1.fontmono); //TODO: Track the current player
        this.currentPlayer.setTextSize();
        this.info = new ShapeWrapper_1.ShapeGroup(this.title, this.mode, this.currentPlayer, this.currentPlayerTitle);
        this.info.callFunction('setFont', sketch_3.fontOSDMONO);
        this.info.callFunction('setTextOrientation', this.sketch.CENTER, this.sketch.CENTER);
        this.info.callFunction('setFill', 255, 255, 255, 255);
        //This display is responsible for the online game
        //TODO: online gui
        //THings I want to display
        // * The lobby name
        // * The number of spectators
        // * Your opponent (maybe shown in a you vs opponent title)
        // * The current player.
    });
    gameScreen.setDraw(function () {
        this.sketch.background(0);
        //Render the information
        this.info.callFunction('render');
        //Render our board
        this.board.draw();
        //Detect key presses that get put into the tictacboard
        var keyEvent = this.keylistener.listen();
        if (keyEvent == KeyListener_2.KEY_EVENTS.UP) {
            this.board.cursorUp();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.DOWN) {
            this.board.cursorDown();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.LEFT) {
            this.board.cursorLeft();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.RIGHT) {
            this.board.cursorRight();
        }
        else if (keyEvent == KeyListener_2.KEY_EVENTS.SELECT) {
            this.board.playMove();
        }
    });
    //Add all of these methods to the GuiManager in their own objects
    GuiManager_2.default.addScreen(startScreen);
    GuiManager_2.default.addScreen(setupScreen);
    GuiManager_2.default.addScreen(loadingScreen);
    GuiManager_2.default.addScreen(howToPlayScreen);
    GuiManager_2.default.addScreen(controlScreen);
    GuiManager_2.default.addScreen(gameScreen);
    GuiManager_2.default.addScreen(testScreen);
};
exports.createScreens = createScreens;
