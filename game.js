    //this class is intented to be used as a way to manage the game.


//this is a constant that holds all of the events associated with the game
const GAMESTATE = {
    INACTIVE: 'INACTIVE',
    STARTING: 'STARTING',
    ACTVE: 'ACTIVE',
    TURNONE: 'TURNONE',
    TURNTWO: 'TURNTWO'

}

//creating the object type game.
function game() {
    //each game will need to have it's proper bigtictac
    this.board;

    //variable that holds the current user
    this.currentUser = 0;

    //boolean that controls whether the game is enabled
    this.isPlaying = false;

    //varuable hat holds the current gamestate
    gameState = GAMESTATE.INACTIVE;
}


//this runners the event
game.prototype.runState = function() {

    if (gameState == GAMESTATE.INACTIVE) {
        this.onInactive();
    } else if (gameState == GAMESTATE.STARTING) {
        this.onStarting();
    } else if (gameState == GAMESTATE.ACTVE) {
        this.onActive();
    } else if (gameState == GAMESTATE.TURNONE) {
        this.onTurnOne();
    } else if (gameState == GAMESTATE.TURNTWO) {
        this.onTurnTwo();
    }

}

//this is the function that runs when the game is inactive
game.prototype.onInactive = function() {

}

//this is the function that runs when the game is active
game.prototype.onActive = function() {

}

//this is the function that runs when the game is starting
game.prototype.onStarting = function () {

}

//this is the function that runs when the ame is on turn one
game.prototype.onTurnOne = function() {

}

//this is the function that runs when the game is on turn two
game.prototype.onTurnTwo = function() {}

//This method is meant to start a new game.
game.prototype.start = function() {
    //setting the board
    this.board = new bigtictac();
    this.isPlaying = true;
}

//this method is meant to play the game
game.prototype.play = function() {

    while(this.isPlaying) {


        



    }
}

//This method moves the turn to the next player
game.prototype.nextPlayer = function() {
    if (this.currentUser == PLAYER_NUMBER) {
        this.currentUser = 1;
    } else {
        this.currentUser++;
    }
}