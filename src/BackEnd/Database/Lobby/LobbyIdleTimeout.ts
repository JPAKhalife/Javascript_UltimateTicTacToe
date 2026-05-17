/**
 * @file LobbyIdleTimeout.ts
 * @description Sliding-TTL Redis key that cancels a game after 10 minutes of inactivity.
 * Created when the game starts; TTL reset after every move; deleted when the game ends.
 * On expiry, triggers handleIdleTimeout which cancels the game.
 *
 * @author John Khalife
 * @created 2026-05-17
 */

import { DatabaseManager } from "../DatabaseManager";
import { REDIS_KEYS, IDLE_TIMEOUT_SECONDS } from "../../Contants";
import { RedisEventManager, RedisEventType } from "../RedisEventManager";
import { handleIdleTimeout } from "../../Handling/InternalHandler";

export class LobbyIdleTimeout {
  /**
   * Start the idle timer for a lobby. Should be called once when the game starts.
   */
  static async create(lobbyID: string): Promise<void> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();
    const key = REDIS_KEYS.LOBBY_IDLE_TIMEOUT(lobbyID);

    await redisClient.set(key, "1");
    await redisClient.expire(key, IDLE_TIMEOUT_SECONDS);

    await RedisEventManager.subscribe(
      key,
      [RedisEventType.EXPIRED],
      async (expiredKey: string, eventType: RedisEventType) => {
        if (eventType === RedisEventType.EXPIRED) {
          await handleIdleTimeout(expiredKey);
        }
      },
    );

    console.info(
      `[LobbyIdleTimeout] Started ${IDLE_TIMEOUT_SECONDS}s idle timer for lobby ${lobbyID}`,
    );
  }

  /**
   * Reset the idle timer after a move. Only refreshes the TTL — does not re-register the callback.
   */
  static async reset(lobbyID: string): Promise<void> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();
    await redisClient.expire(REDIS_KEYS.LOBBY_IDLE_TIMEOUT(lobbyID), IDLE_TIMEOUT_SECONDS);
  }

  /**
   * Cancel the idle timer. Called when the game ends or is paused.
   */
  static async cancel(lobbyID: string): Promise<void> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();
    const key = REDIS_KEYS.LOBBY_IDLE_TIMEOUT(lobbyID);

    const deleted = await redisClient.del(key);
    if (deleted > 0) {
      await RedisEventManager.unsubscribe(key);
      console.info(`[LobbyIdleTimeout] Cancelled idle timer for lobby ${lobbyID}`);
    }
  }
}
