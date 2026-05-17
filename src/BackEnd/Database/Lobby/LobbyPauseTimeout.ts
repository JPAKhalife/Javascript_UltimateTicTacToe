/**
 * @file LobbyPauseTimeout.ts
 * @description Redis-backed timeout that fires when a disconnected player fails to reconnect.
 * Created when a player disconnects mid-game; cancelled on successful reconnect.
 * On expiry, triggers handlePauseTimeout which cancels the game.
 *
 * @author John Khalife
 * @created 2026-05-17
 */

import { DatabaseManager } from "../DatabaseManager";
import { REDIS_KEYS, RECONNECT_TIMEOUT_SECONDS } from "../../Contants";
import { RedisEventManager, RedisEventType } from "../RedisEventManager";
import { handlePauseTimeout } from "../../Handling/InternalHandler";

export class LobbyPauseTimeout {
  /**
   * Create a reconnect timeout for a lobby.
   * If the key already exists (second disconnect while paused), resets the TTL.
   */
  static async create(lobbyID: string): Promise<void> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();
    const key = REDIS_KEYS.LOBBY_PAUSE_TIMEOUT(lobbyID);

    await redisClient.set(key, "1");
    await redisClient.expire(key, RECONNECT_TIMEOUT_SECONDS);

    await RedisEventManager.subscribe(
      key,
      [RedisEventType.EXPIRED],
      async (expiredKey: string, eventType: RedisEventType) => {
        if (eventType === RedisEventType.EXPIRED) {
          await handlePauseTimeout(expiredKey);
        }
      },
    );

    console.info(
      `[LobbyPauseTimeout] Started ${RECONNECT_TIMEOUT_SECONDS}s reconnect timer for lobby ${lobbyID}`,
    );
  }

  /**
   * Cancel the reconnect timeout (player reconnected in time).
   * Deletes the Redis key so the expiry callback never fires.
   */
  static async cancel(lobbyID: string): Promise<void> {
    const redisClient = DatabaseManager.getInstance().getRegularClient();
    const key = REDIS_KEYS.LOBBY_PAUSE_TIMEOUT(lobbyID);

    const deleted = await redisClient.del(key);
    if (deleted > 0) {
      await RedisEventManager.unsubscribe(key);
      console.info(`[LobbyPauseTimeout] Cancelled reconnect timer for lobby ${lobbyID}`);
    }
  }
}
