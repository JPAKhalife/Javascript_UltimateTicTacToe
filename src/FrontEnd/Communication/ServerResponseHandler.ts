/**
 * @file ServerResponseHandler.ts
 * @description Handles what to do after receiving responses to client-sent requests
 * @author John Khalife
 * @created 2025-12-23
 */

import GuiManager from "../GuiManager";
import LoadingScreen from "../Screens/LoadingScreen";
import UsernameScreen from "../Screens/UsernameScreen";
import ServerRequestService from "./ServerRequestService";
import WebManager from "./WebManager";

/**
 * Responsible for handling the response from attempting to connect to the server via websocket
 */
export async function handleWebsocketConnectionInitiation() {
    //Initiate the websocket connection
    while (!(await WebManager.getInstance().initiateConnectionIfNotEstablished()));
    //Once this has completed, signal the loading screen to change
    const loadingScreen = GuiManager.getCurrentScreen();
    if (!(loadingScreen instanceof LoadingScreen)) return;
    console.debug("[ServerResponseHandler] Signaling loading screen...");
    loadingScreen.activateTransitionOut();
}

export async function handleRegisterPlayerResponse(username: string) {
    const usernameScreen = GuiManager.getCurrentScreen();
    if (!(usernameScreen instanceof UsernameScreen)) return;
    try {
        const response = await ServerRequestService.getInstance().registerPlayer(
            username,
        );
        // Valid session ID
        if (response.sessionID.length > 0) {
            // Session ID is already stored in ServerRequestService
            usernameScreen.initiateTransitionOut();
        } else {
            usernameScreen.displayUsernameFieldError(response.message);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Registration failed";
        usernameScreen.displayUsernameFieldError(errorMessage);
    }
}