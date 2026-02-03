import kafka from "./kafka.client";
import { v4 as uuidv4 } from "uuid";
export interface BookingConfirmedEventV1 {
  eventType: "booking.confirmed";
  version: 1;
  messageId: string;
  bookingId: string;
  eventId: string;
  userId: string;
  seatCount: number;
  timestamp: string;
}

const producer = kafka.producer();
let isConnected = false;

const getProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
  return producer;
};

export const publishBookingConfirmed = async (booking: any) => {
  const producer = await getProducer();

  const event: BookingConfirmedEventV1 = {
    eventType: "booking.confirmed",
    version: 1,
    messageId: uuidv4(),
    bookingId: booking.booking_id,
    eventId: booking.event_id,
    userId: booking.user_id,
    seatCount: booking.seat_count,
    timestamp: new Date().toISOString(),
  };

  await producer.send({
    topic: "booking.confirmed",
    messages: [
      {
        key: event.bookingId,
        value: JSON.stringify(event),
      },
    ],
  });
};
