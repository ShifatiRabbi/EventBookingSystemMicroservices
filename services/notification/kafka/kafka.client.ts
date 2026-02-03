import { Kafka } from "kafkajs";
import dotenv from "dotenv";
dotenv.config()

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export default kafka;
