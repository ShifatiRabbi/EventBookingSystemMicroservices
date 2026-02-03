export const sendSMS = async (
  userId: string,
  message: string
) => {
  // integrate Twilio later
  console.log(`SMS to ${userId}: ${message}`);
};
