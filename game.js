//this class is intented to be used as a way to manage the game.

//creating the object type game.
function game() {
    //each game will need to have it's proper bigtictac
    this.board;

    //variable that holds the current user
    this.currentUser = 0;

    //boolean that controls whether the game is enabled
    this.isPlaying = false;
}

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