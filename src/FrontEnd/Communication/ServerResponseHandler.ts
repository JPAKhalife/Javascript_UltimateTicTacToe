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
import { setupGameStartListener } from "./ServerEventHandler";
import { Screens } from "../Menu";
import { GameType } from "../GameManager";
import p5 from "p5";
import type LobbyDot from "../MenuObjects/LobbyDot";

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

/**
 * Handles the response from creating a lobby
 * @param lobbyName - The name of the lobby to create
 * @param playerNum - Number of players
 * @param levelSize - Size of the level
 * @param gridSize - Size of the grid (slot number)
 * @param allowSpectators - Whether spectators are allowed
 * @param onCreateSuccess - Callback to execute when lobby is created successfully
 * @param onCreateFailed - Callback to execute if creation fails
 */
export async function handleCreateLobbyResponse(
    lobbyName: string,
    playerNum: number,
    levelSize: number,
    gridSize: number,
    allowSpectators: boolean,
    onCreateSuccess: () => void,
    onCreateFailed: (error: string) => void
) {
    const requestService = ServerRequestService.getInstance();

    try {
        // Create the lobby
        const response = await requestService.createLobby(
            lobbyName,
            playerNum,
            levelSize,
            gridSize,
            allowSpectators,
        );

        if (response.lobbyID) {
            // Store lobby information
            localStorage.setItem("currentLobby", lobbyName);
            localStorage.setItem("lobbyID", response.lobbyID);

            // Set up game listener to trigger LoadingScreen transition when game starts
            // This must happen BEFORE we transition to LoadingScreen
            setupGameStartListener(requestService, () => {
                // Get the LoadingScreen instance and trigger its transition
                const currentScreen = GuiManager.getCurrentScreen();
                if (currentScreen instanceof LoadingScreen) {
                    currentScreen.activateTransitionOut();
                }
            });

            // Execute success callback (will trigger transition to LoadingScreen)
            onCreateSuccess();
        } else {
            // If lobby creation failed, show error
            onCreateFailed(response.error || "Failed to create lobby.");
        }
    } catch (error) {
        // If an exception occurred, show error
        const errorMessage = error instanceof Error ? error.message : "Failed to create lobby";
        onCreateFailed(errorMessage);
    }
}

/**
 * Handles the response from joining a lobby
 * @param lobbyID - The ID of the lobby to join
 * @param sketch - The p5 sketch instance
 * @param selectedLobbyDot - The lobby dot that was selected
 * @param onJoinFailed - Callback to execute if joining fails
 */
export async function handleJoinLobbyResponse(
    lobbyID: string,
    sketch: p5,
    selectedLobbyDot: LobbyDot,
    onJoinFailed: () => void
) {
    const requestService = ServerRequestService.getInstance();

    // Join the lobby
    const lobbyInfo = await requestService.joinLobby(lobbyID);

    if (lobbyInfo) {
        // Set up game listener to trigger LoadingScreen transition when game starts
        // This must happen BEFORE we transition to LoadingScreen
        setupGameStartListener(requestService, () => {
            // Get the LoadingScreen instance and trigger its transition
            const currentScreen = GuiManager.getCurrentScreen();
            if (currentScreen instanceof LoadingScreen) {
                currentScreen.activateTransitionOut();
            }
        });

        selectedLobbyDot.startSelectionTransition(async () => {
            // Navigate to LoadingScreen - game listener will trigger transition when ready
            GuiManager.changeScreen(
                Screens.LOADING_SCREEN,
                sketch,
                Screens.GAME_SCREEN,
                "Waiting for game to start...",
                () => {}, // Empty function - listener handles transition
                GameType.ONLINE,
                lobbyInfo.gridSize,
                lobbyInfo.levelSize,
                lobbyInfo.lobbyID,
            );
        });
    } else {
        // If joining failed, execute callback
        onJoinFailed();
    }
}