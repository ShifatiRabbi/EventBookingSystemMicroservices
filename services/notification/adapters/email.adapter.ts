export const sendEmail = async (
  userId: string,
  message: string
) => {
  // integrate SendGrid / SES later
  console.log(`Email to ${userId}: ${message}`);
};
