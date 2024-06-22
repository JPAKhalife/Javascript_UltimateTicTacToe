//this file is meant to hold a class that will be responsible for the drawing of the different screens in the game.





//declaring the gui object type.
function gui() {
    //This integer is meant to control what screen is being displayed and when.
    this.menuNumber = 0;

    //this integer controls the transparency of the text
    this.alpha = 0;
    this.addingalpha = true;

    //these integers are always zero unless there is a transition
    this.x = 0;
    this.y = 0;

    //these integers are used to input the x value for the sin function
    this.s = 0;
    this.t = 0;

    //this will controll how long between each delay input idk what I just said
    this.inputdelay = 0;

    //This integer counts the spin of the tictac
    this.spin = 0;

    //This is an object for calling buttons

    this.opacity = 0;
    this.opacity_2 = 0;

    //determines whether the quit menu is open
    this.quit_open = false;
    


    this.multiplayer_menu_button_list = new button_nav([new menu_button(0.5,0.4,"Local",0.1,0.1,50*0.25), new menu_button(0.80,0.85, "How to play",0.05,0.15,50*0.25), new menu_button(0.20, 0.85, "Controls",0.05,0.15,50*0.25),new menu_button(0.5, 0.6 , "Online",0.1,0.1,50*0.25)]); 
   
   //this is an array that will hold floaters for the option screen
   this.floater_array = [new Floater(whiteTicTac,50,50),new Floater(whiteTicTac,50,50),new Floater(whiteTicTac,50,50),new Floater(whiteTicTac,50,50)];

   //this array will hld the quitting buttons
   this.quit_buttons = new button_nav([new quit_button(getCanvasSize()/2,getCanvasSize/2,'Confirm'),new quit_button(getCanvasSize()/2,getCanvasSize/2,'Cancel')]);

   for (i  = 0 ; i < this.floater_array.length ; i ++) {
        this.floater_array[i].start();
   }

    //PUTTING THIS HEre to make all sapes have their centers as cooridnate
    rectMode(CENTER);


    //these booleans control transitions
    this.transition_out = false;   
    this.transition_in = false;
    this.transition_timer = 0;
    this.screen = false;

    //This variable is intended to hold the messages displayed in the loading screen 
    this.loadingMessage = ["Check out this cool loading screen lol.", "To win, you have to get good.", "Ultimate Tictactoe is better than TicTacToe", "Don't forget to touch grass every once in a while.", "Fun Fact: This font doesn't have colons.", "Having trouble? Skill issue.","Help, I can't think of loading messages.","I should probably put some actually helpful tips here.","Try to direct your opponent to a square where they can't do anything.", "Sometimes, you can force your opponent to send you to an advantageous square.", "Try to place your pieces such that there are multiple ways you can score a point."]

    //This varuable holds the various messages for the title of the loading screen
    this.titleMessage = ["Seaching for players","Preparing Game"]

    this.dots = ["",".","..","..."]

    //variable that controls the mssage displayed
    this.displayedMessage = getRandomInt(0,this.loadingMessage.length - 1);

    //this variable controls how much time has elapsed
    this.timepassed = round(millis());

    //this is the object that will hold the game
    this.currentgame = new game();

    //this will be a temprorary bigtictac for drawing
    this.bigtic = new bigtictac();

    //these are variables for the setting screen
    this.border_pos = -STROKEWEIGHT;

}

//This method will draw the screen depending on what the menu number is equal to.
gui.prototype.drawScreen = function(keylistener) {
        //drawing the proper screen that the game should be on
        switch(this.menuNumber) {
            case 0:
                this.startScreen(keylistener);
                break;
            case 1:
                this.setupScreen(keylistener);
                break;
            case 2:
                this.onlineLoadingScreen(keylistener);
                break;
            case 3:
                this.offlineGameScreen(keylistener);
                //this.offlineLoadingScreen();
                break;
            case 4:
                this.onlineGameScreen(keylistener);
                break;
            case 5:
                this.offlineGameScreen(keylistener);
                break;
            case 6:
                this.tutorialScreen_one(keylistener);
                break;
            case 7:
                this.tutorialScreen_two(keylistener);
                break;
            case 8:
                this.tutorialScreen_three(keylistener);
                break;
            case 9:
                this.controlScreen_navigate(keylistener);
                break;
            case 10:
                this.controlScreen_select(keylistener);
                break;
            case 11:
                this.winScreen(keylistener);
                break;
            case 12:
                this.loseScreen(keylistener);
                break;
            case 13:
                this.xwins(keylistener);
                break;
            case 14: 
                this.owins(keylistener);
                break;
            case 15:
                this.nowins(keylistener);
            default:
                throw "This screen does not exist";
        }

}

















