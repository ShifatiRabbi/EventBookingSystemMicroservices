import dbPool from "../config/db";
import { RowDataPacket } from "mysql2";

export interface Notification extends RowDataPacket {
  id: string;
  message_id: string;
  booking_id: string;
  user_id: string;
  event_id: string;
  message: string;
  created_at: Date;
}

const existsByMessageId = async (messageId: string): Promise<boolean> => {
  const [rows] = await dbPool.execute<RowDataPacket[]>(
    "SELECT id FROM notifications WHERE message_id = ?",
    [messageId]
  );

  return rows.length > 0;
};

const createNotification = async (data: {
  messageId: string;
  bookingId: string;
  userId: string;
  eventId: string;
  message: string;
}) => {
  await dbPool.execute(
    `INSERT INTO notifications 
     (id, message_id, booking_id, user_id, event_id, message)
     VALUES (UUID(), ?, ?, ?, ?, ?)`,
    [
      data.messageId,
      data.bookingId,
      data.userId,
      data.eventId,
      data.message,
    ]
  );
};

const getLatestNotifications = async (limit = 100) => {
  const [rows] = await dbPool.execute<Notification[]>(
    `SELECT * FROM notifications 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [limit]
  );

  return rows;
};

export default {
  existsByMessageId,
  createNotification,
  getLatestNotifications,
};
