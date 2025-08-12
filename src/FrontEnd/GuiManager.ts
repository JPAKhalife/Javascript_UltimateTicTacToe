/**
 * @file GuiManager
 * @description This file is intended to house the gui manager class that manages screen transitions
 * @author John Khalife (refactored by Cline)
 * @created 2024-06-9
 * @updated 2025-08-12
 */

import p5 from 'p5';
import Menu, { Screens } from './Menu';
import TransitionableScreen from './Screens/TransitionableScreen';
import LoadingScreen from './Screens/LoadingScreen';

/**
 * @class Represents a GUI Manager that manages screens and transitions in a game.
 */
export default class GuiManager {
    static screens: [(new (...args: any[]) => Menu), Screens][] = [];
    static currentScreen: Menu;
    static isTransitioning: boolean = false;
    static nextScreen: Screens | null = null;
    static nextScreenArgs: any[] = [];

    /**
     * @function addScreen Adds a screen to the GUI manager.
     * @param {Screen} screen - The screen to be added.
     * @param {Screens} id - The enum identifier for the screen.
     */
    public static addScreen(screen: (new (...args: any[]) => Menu), id: Screens) {
        GuiManager.screens.push([screen, id]);
    }

    /**
     * @function drawScreen Draws the current screen.
     */
    public static drawScreen() {
        GuiManager.currentScreen.draw();
    }

    /**
     * @function changeScreen - Function overload for standard screen change
     * @param screen - The enum of the screen to be set as the current screen
     * @param sketch - The p5 sketch instance
     * @param args - Additional arguments to pass to the screen constructor
     */
    public static changeScreen(screen: Screens, sketch: p5, ...args: any[]): void;

    /**
     * @function changeScreen - Function overload for loading screen transition
     * @param loadingScreen - The loading screen to show
     * @param sketch - The p5 sketch instance
     * @param targetScreen - The target screen to transition to after loading
     * @param loadingMessage - The message to display on the loading screen
     * @param action - The action to perform during loading
     * @param condition - The condition to check for completion
     * @param args - Additional arguments to pass to the target screen constructor
     */
    public static changeScreen(
        loadingScreen: Screens,
        sketch: p5,
        targetScreen: Screens,
        loadingMessage: string,
        action: () => void,
        condition: () => boolean,
        ...args: any[]
    ): void;

    /**
     * @function changeScreen - Implementation that handles both overloads
     */
    public static changeScreen(
        screenOrLoadingScreen: Screens,
        sketch: p5,
        targetScreenOrArg?: Screens | any,
        loadingMessageOrArg?: string | any,
        actionOrArg?: (() => void) | any,
        conditionOrArg?: (() => boolean) | any,
        ...restArgs: any[]
    ): void {
        // Determine if this is a loading screen transition or a regular screen change
        const isLoadingScreenTransition = 
            typeof targetScreenOrArg === 'number' && 
            typeof loadingMessageOrArg === 'string' &&
            typeof actionOrArg === 'function' &&
            typeof conditionOrArg === 'function';

        if (isLoadingScreenTransition) {
            // Handle loading screen transition
            const loadingScreen = screenOrLoadingScreen;
            const targetScreen = targetScreenOrArg as Screens;
            const loadingMessage = loadingMessageOrArg as string;
            const action = actionOrArg as () => void;
            const condition = conditionOrArg as () => boolean;
            
            // Find the loading screen class
            for (let i = 0; i < GuiManager.screens.length; i++) {
                if (loadingScreen === GuiManager.screens[i][1]) {
                    // If the loading screen is a LoadingScreen instance
                    if (GuiManager.screens[i][0].prototype instanceof LoadingScreen) {
                        // Create the loading screen with the target screen, action, and condition
                        const loadingScreenInstance = new GuiManager.screens[i][0](
                            sketch,
                            targetScreen,
                            loadingMessage,
                            action,
                            condition,
                            ...restArgs
                        );
                        
                        // If the current screen supports transitions
                        if (GuiManager.currentScreen instanceof TransitionableScreen && 
                            !GuiManager.isTransitioning) {
                            
                            // Start transition out from current screen
                            GuiManager.isTransitioning = true;
                            (GuiManager.currentScreen as TransitionableScreen).transitionToScreen(loadingScreen);
                            
                            // Store the loading screen info for when transition completes
                            GuiManager.nextScreen = loadingScreen;
                            GuiManager.nextScreenArgs = [
                                targetScreen,
                                loadingMessage,
                                action,
                                condition,
                                ...restArgs
                            ];
                        } else {
                            // Directly set the loading screen if no transition
                            GuiManager.currentScreen = loadingScreenInstance;
                        }
                        
                        return;
                    }
                }
            }
            
            console.error(`Loading screen with ID ${loadingScreen} not found!`);
        } else {
            // Handle regular screen change
            const screen = screenOrLoadingScreen;
            const args = [targetScreenOrArg, loadingMessageOrArg, actionOrArg, conditionOrArg, ...restArgs].filter(arg => arg !== undefined);
            
            // Find the screen class from the registered screens
            for (let i = 0; i < GuiManager.screens.length; i++) {
                if (screen === GuiManager.screens[i][1]) {
                    // Create the new screen instance
                    const newScreen = new GuiManager.screens[i][0](sketch, ...args);
                    
                    // If the current screen supports transitions and we're not already transitioning
                    if (GuiManager.currentScreen instanceof TransitionableScreen && 
                        !GuiManager.isTransitioning) {
                        
                        // Start transition out from current screen
                        GuiManager.isTransitioning = true;
                        (GuiManager.currentScreen as TransitionableScreen).transitionToScreen(screen);
                        
                        // Store the next screen info for when transition completes
                        GuiManager.nextScreen = screen;
                        GuiManager.nextScreenArgs = args;
                    } else {
                        // Directly set the new screen if no transition
                        GuiManager.currentScreen = newScreen;
                    }
                    
                    return;
                }
            }
            
            console.error(`Screen with ID ${screen} not found!`);
        }
    }

    /**
     * @function handleTransitionComplete Called when a screen transition is complete.
     * @param {Screens} nextScreen - The next screen to transition to.
     */
    public static handleTransitionComplete(nextScreen: Screens) {
        if (GuiManager.nextScreen === nextScreen && GuiManager.isTransitioning) {
            // Reset transition state
            GuiManager.isTransitioning = false;
            
            // Change to the next screen
            for (let i = 0; i < GuiManager.screens.length; i++) {
                if (nextScreen === GuiManager.screens[i][1]) {
                    // Create the new screen instance with stored args
                    const newScreen = new GuiManager.screens[i][0](
                        (GuiManager.currentScreen as any).sketch,
                        ...GuiManager.nextScreenArgs
                    );
                    
                    // Set the new screen
                    GuiManager.currentScreen = newScreen;
                    
                    // Reset next screen info
                    GuiManager.nextScreen = null;
                    GuiManager.nextScreenArgs = [];
                    
                    return;
                }
            }
        }
    }

    /**
     * @function getCurrentScreen Returns the current screen instance.
     * @return {Menu} The current screen instance.
     */
    public static getCurrentScreen(): Menu {
        return GuiManager.currentScreen;
    }
}
