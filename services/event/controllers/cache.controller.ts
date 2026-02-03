import redisClient from "../cache/redis";
import logger from "../logs/logger";

export const cacheController = (keyPrefix: string, ttl = 60) => {
  return async (req: any, res: any, next: Function) => {
    const key = `${keyPrefix}:${req.params.id}`;

    try {
      const cached = await redisClient.get(key);

      if (cached) {
        logger.info("Cache hit", { key });
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        redisClient
          .setEx(key, ttl, JSON.stringify(data))
          .catch(err =>
            logger.error("Cache set error", { key, error: err.message })
          );
        return originalJson(data);
      };

      next();
    } catch (error: any) {
      logger.error("Cache Controller error", { error: error.message });
      next();
    }
  };
};
