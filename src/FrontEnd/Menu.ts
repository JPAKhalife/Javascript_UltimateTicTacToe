/**
 * @description A file defining the Menu interface
 * @file Menu.ts
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-12-09
 */

export enum Screens {
    SCREEN_NUM,
    START_SCREEN,
    SETUP_SCREEN,
    LOADING_SCREEN,
    TUTORIAL_SCREEN,
    CONTROL_SCREEN,
    GAME_SCREEN,
    MULTIPLAYER_SCREEN,
    CREATE_LOBBY_SCREEN,
    USERNAME_SCREEN, // New screen for entering username
    TEST_SCREEN,
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
