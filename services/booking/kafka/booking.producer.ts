import kafka from "./kafka.client";

const producer = kafka.producer();
let isConnected = false;

export const getProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
  return producer;
};

export const publishBookingConfirmed = async (booking: any) => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
  
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
