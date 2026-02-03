import { createClient } from "redis";
import logger from "../logs/logger";
import dotenv from "dotenv";
dotenv.config()

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) =>
  logger.error("Redis Client Error", err)
);

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info("Redis connected");
  }
};

export default redisClient;
