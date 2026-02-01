import kafka from "./kafka.client";
import NotificationModel from "../models/notification.model";
import logger from "../logs/logger";
import { sendEmail, sendSMS } from "./../adapters";
import { sendToDLQ } from "./dlq.producer";

const consumer = kafka.consumer({
  groupId: "notification-group",
});

export const startBookingConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: "booking.confirmed",
    fromBeginning: false,
  });

  await consumer.subscribe({
    topic: "booking.cancelled",
    fromBeginning: false,
  });


  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const messageId = message.offset;

      try {
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());
        const { data, event: eventType } = event;

        let notificationMessage = "";

        // Idempotency check
        const exists = await NotificationModel.existsByMessageId(messageId);
        if (exists) {
          logger.info("Duplicate message skipped", { messageId });
          return;
        }

        if (eventType === "booking.confirmed") {
          notificationMessage =
            `Booking confirmed for ${data.seatCount} seat(s) at event ${data.eventId}`;
        }

        if (eventType === "booking.cancelled") {
          notificationMessage =
            `Booking cancelled for event ${data.eventId}`;
        }

        await NotificationModel.createNotification({
          messageId,
          bookingId: data.bookingId,
          userId: data.userId,
          eventId: data.eventId,
          message: notificationMessage,
        });

        logger.info("Notification stored", {
          topic,
          partition,
          messageId,
          bookingId: data.bookingId,
        });

        // Just message show on console
        await sendEmail(data.userId, notificationMessage);
        await sendSMS(data.userId, notificationMessage);
      } catch (error: any) {
        logger.error("Message failed, sending to DLQ", {
          topic,
          offset: message.offset,
          error: error.message,
        });

        await sendToDLQ(topic, message.value?.toString(), error.message);
      }
    },
  });
};
