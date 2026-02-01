import kafka from "./kafka.client";

const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};

export const publishBookingConfirmed = async (booking: any) => {
  await producer.send({
    topic: "booking.confirmed",
    messages: [
      {
        key: booking.booking_id,
        value: JSON.stringify({
          event: "booking.confirmed",
          version: "1.0",
          timestamp: new Date().toISOString(),
          data: booking,
        }),
      },
    ],
  });
};
