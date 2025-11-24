/**
 * @file GameHandler.ts
 * @description This file is responsible for the handling of the game events that can occur
 * 
 * @author John Khalife
 * @created 2025-08-18
 * @updated 2025-08-20
 */


import Redis from "ioredis";
import { GAME_STATES } from "../Contants";
import { DatabaseManager } from "../Database/DatabaseManager";
import { Lobby } from "../Database/Lobby";


/**
 * @function handleGameReadyCheck
 * @description This function checks whether or not the game is ready to started (transition from waiting to running)
 * @param lobbyID - The ID of the lobby to check
*/
export async function handleGameReadyCheck(lobbyID: string) {
    let redisClient = DatabaseManager.getInstance().getRegularClient();
    //First handle cases where this method is pointless.

    //Get the lobby Object
    const lobby = await Lobby.getById(lobbyID);
    if (!lobby) {throw Error("Lobby not found. This should not happen and indicates an error in the back-end.")}

    //Check if the game is already running
    if (lobby.get("lobbyState") === GAME_STATES.RUNNING) {
        console.log(`[GameHandler] Lobby ${lobbyID} game is already running. No action taken.`);
        return;
    }

    //Check if there are enough players to start the game
    if (lobby.get("playersJoined") < lobby.get("playerNum")) {return;}
    //? There may be other checks that are neccessary in the future

    // If all checks are passed, start the game
    console.log(`[GameHandler] All players have joined in lobby ${lobbyID}. Starting game...`);
}

/**
 * @function handleGameStart
 * @description This function handles the starting of the game (transition from waiting to running)
 * @param lobby the lobby object that the game should be started for
 */
export async function handleGameStart(lobby: Lobby) {

    //Set the lobby state to ready!
    lobby.set("lobbyState", GAME_STATES.RUNNING);
    
    // Initialize the gameState with the proper structure
    

    // Notify all clients that the game has begun
    // Call the handlePlayerChange method to notify the correct player of the turn change.   
}

/**
 * @function handlePlayerChange
 * @description This function handles the changing of the player turn in the game
 * @param lobby the lobby object that the player turn should be changed for
 */
export async function handlePlayerChange(lobby: Lobby) {
    
    //Update the lobby state to reflect the player change

    
    //Notify all clients of the player change.

}

/**
 * @function handleEvaluateGame
 * @description This function handles the evaluation of the game state to determine if there is a winner or if the game should continue
 * @param lobby the lobby object that the game should be evaluated for
 * 
 */
export async function handleEvaluateGame(lobby: Lobby) {

}

/**
 * @function handleGameWon
 * @description This function handles the end of the game when a player has won
 * @param lobby the lobby object that the game has been won in
 */
export async function handleGameWon(lobby: Lobby) {

}