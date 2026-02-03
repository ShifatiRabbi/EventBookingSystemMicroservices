import kafka from "./kafka.client";
import NotificationModel from "../models/notification.model";
import logger from "../logs/logger";
import { sendEmail, sendSMS } from "../adapters";
import { sendToDLQ } from "./dlq.producer";

interface BookingConfirmedEventV1 {
  eventType: "booking.confirmed";
  version: 1;
  messageId: string;
  bookingId: string;
  eventId: string;
  userId: string;
  seatCount: number;
  timestamp: string;
}

const consumer = kafka.consumer({
  groupId: "notification-group",
});

export const startBookingConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: "booking.confirmed",
    fromBeginning: false,
  });

  logger.info("Notification consumer started", {
    topics: ["booking.confirmed"],
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        if (!message.value) return;

        const raw = message.value.toString();
        const event: BookingConfirmedEventV1 = JSON.parse(raw);

        // Schema validation (minimal but effective)
        if (
          event.version !== 1 ||
          event.eventType !== "booking.confirmed" ||
          !event.messageId
        ) {
          throw new Error("Invalid or unsupported event schema");
        }

        const {
          messageId,
          bookingId,
          eventId,
          userId,
          seatCount,
        } = event;

        // Idempotency check (at-least-once safe)
        const exists = await NotificationModel.existsByMessageId(messageId);
        if (exists) {
          logger.info("Duplicate event skipped", {
            topic,
            messageId,
          });
          return;
        }

        const notificationMessage =
          `Booking confirmed for ${seatCount} seat(s) at event ${eventId}`;

        // Persist notification
        await NotificationModel.createNotification({
          messageId,
          bookingId,
          userId,
          eventId,
          message: notificationMessage,
        });

        logger.info("Notification stored", {
          topic,
          partition,
          messageId,
          bookingId,
          version: event.version,
        });

        // Side effects (best-effort)
        await Promise.all([
          sendEmail(userId, notificationMessage),
          sendSMS(userId, notificationMessage),
        ]);
      } catch (error: any) {
        logger.error("Message processing failed, sending to DLQ", {
          topic,
          partition,
          offset: message.offset,
          error: error.message,
        });

        await sendToDLQ(
          topic,
          message.value?.toString(),
          error.message
        );
      }
    },
  });
};
