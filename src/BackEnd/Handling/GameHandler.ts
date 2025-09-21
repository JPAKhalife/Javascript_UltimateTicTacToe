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


/**
 * @function handleGameReadyCheck
 * @description This function checks whether or not the game is ready to started (transition from waiting to running)
 * @param lobbyID - The ID of the lobby to check
*/