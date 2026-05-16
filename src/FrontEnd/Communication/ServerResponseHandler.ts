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
import { GameType } from "../GameManager/GameManager";
import p5 from "p5";
import type LobbyDot from "../MenuObjects/LobbyDot";
import { GameStateInfo } from "../../Shared/Contracts/MessageToClientSchema";
import MultiplayerScreen from "../Screens/MultiplayerScreen";

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
 * @param sketch - The p5 sketch instance
 * @param lobbyName - The name of the lobby to create
 * @param playerNum - Number of players
 * @param levelSize - Size of the level
 * @param gridSize - Size of the grid (slot number)
 * @param allowSpectators - Whether spectators are allowed
 * @param onCreateSuccess - Callback to execute when lobby is created successfully
 * @param onCreateFailed - Callback to execute if creation fails
 */
export async function handleCreateLobbyResponse(
    sketch: p5,
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
            // Use the lobby parameters that were just used to create the lobby
            setupGameStartListener(
                requestService,
                sketch,
                gridSize,
                levelSize,
                response.lobbyID
            );

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
 * @param onJoinFailed - Callback to execute if joining fails, receives error message as parameter
 */
export async function handleJoinLobbyResponse(
    lobbyID: string,
    sketch: p5,
    selectedLobbyDot: LobbyDot,
    onJoinFailed: (errorMessage?: string) => void
) {
    const requestService = ServerRequestService.getInstance();

    // Join the lobby
    const result = await requestService.joinLobby(lobbyID);

    // Check if result is an error
    if ("error" in result) {
        // Trigger error animation on the lobby dot
        selectedLobbyDot.startErrorAnimation();
        // Execute callback with error message
        onJoinFailed(result.error);
        return;
    }

    // Success - result is GameStateInfo
    const gameState: GameStateInfo = result;

    // Determine if this is a spectator joining a running game
    const isSpectator = gameState.playerList.length > gameState.playerNum;
    const isGameRunning = gameState.lobbyState === "running";

    // Set up game listener to trigger LoadingScreen transition when game starts
    // This must happen BEFORE we transition to LoadingScreen
    // For spectators joining running games, these listeners will receive ongoing game updates
    setupGameStartListener(
        requestService,
        sketch,
        gameState.gridSize,
        gameState.levelSize,
        gameState.lobbyID
    );

    console.debug("[ServerResponseHandler] Initiating selection transition animation");
    selectedLobbyDot.startSelectionTransition(async () => {
        console.debug("[ServerResponseHandler] Selection transition callback invoked, triggering MultiplayerScreen transition out");

        // Store gameState in localStorage for MultiplayerScreen to retrieve
        localStorage.setItem("gameState", JSON.stringify(gameState));

        // Trigger the MultiplayerScreen's transition out animation
        // The screen will handle navigating to LoadingScreen when the transition completes
        const multiplayerScreen = GuiManager.getCurrentScreen() as MultiplayerScreen;
        multiplayerScreen.beginTransitionOut();
    });
}