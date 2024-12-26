/**
 * @description A file defining the Menu interface
 * @file Menu.ts
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-12-09
 */

export const Screens = {
    SCREEN_NUM: 8,
    START_SCREEN: 0,
    SETUP_SCREEN: 1,
    LOADING_SCREEN:2,
    HOW_TO_PLAY_SCREEN: 3,
    CONTROL_SCREEN: 4,
    GAME_SCREEN: 5,
    TEST_SCREEN: 6,
};

/**
 * @Interface A class that contains all the attributes a screen should have.
 * */
export default interface Menu {
    //Each Menu will need a draw funciton
    draw(): void;
    //Each Menu will need a resize function
    resize(): void;
}




//the weight of the stroke around the btton during the confirmed animation


export let createScreens = function(sketch: p5) {










    //Add all of these methods to the GuiManager in their own objects
    GuiManager.addScreen(startScreen);
    GuiManager.addScreen(setupScreen);
    GuiManager.addScreen(loadingScreen);
    GuiManager.addScreen(howToPlayScreen);
    GuiManager.addScreen(controlScreen);
    GuiManager.addScreen(gameScreen);
    GuiManager.addScreen(testScreen);
}