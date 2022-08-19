//this file is meant to hold a class that will be responsible for the drawing of the different screens in the game.

//declaring the gui object type.
function gui() {
    //This integer is meant to control what screen is being displayed and when.
    this.menuNumber = 0;

}

//This method is for the startscreen.
gui.prototype.startScreen = function() {
    
    //set the background to white.
    background(0);

    //printing a title
    textSize(height*0.1);
    fill(255);
    textFont('Arial');
    textAlign(CENTER,CENTER)
    text("Ultimate TicTacToe",width/2, height/5);

    //printing the author
    fill(127);
    textAlign(CENTER,CENTER)
    textSize(height*0.05);
    text("Made by John Khalife",width/2, height/10*3);

    //creating a button in the middle of the screen that starts the game
    playButton.draw();
    



}