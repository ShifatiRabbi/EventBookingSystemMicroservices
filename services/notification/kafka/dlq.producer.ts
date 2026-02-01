import kafka from "./kafka.client";

const producer = kafka.producer();

export const sendToDLQ = async (
  topic: string,
  message: any,
  error: string
) => {
  await producer.connect();

  await producer.send({
    topic: `${topic}.dlq`,
    messages: [
      {
        value: JSON.stringify({
          originalMessage: message,
          error,
          failedAt: new Date().toISOString(),
        }),
      },
    ],
  });
};
