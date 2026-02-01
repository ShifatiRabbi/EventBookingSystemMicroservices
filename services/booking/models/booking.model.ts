import dbPool from "../config/db";
import { RowDataPacket } from "mysql2";
import { v4 as uuidv4 } from "uuid";

export interface Booking extends RowDataPacket {
  id: string;
  booking_id: string;
  event_id: string;
  user_id: string;
  seat_count: number;
  status: "confirmed" | "cancelled";
  created_at: Date;
  updated_at: Date;
}

const bookSeatsAtomic = async (data: {
  eventId: string;
  userId: string;
  seatCount: number;
  bookingId: string;
}): Promise<Booking> => {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock event row
    const [events]: any = await connection.execute(
      "SELECT available_seats FROM events WHERE id = ? FOR UPDATE",
      [data.eventId]
    );

    if (!events.length) {
      throw new Error("Event not found");
    }

    if (events[0].available_seats < data.seatCount) {
      throw new Error("Not enough seats available");
    }

    const [updateResult]: any = await connection.execute(
      `UPDATE events 
       SET available_seats = available_seats - ?
       WHERE id = ? AND available_seats >= ?`,
      [data.seatCount, data.eventId, data.seatCount]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Concurrent booking conflict");
    }

    await connection.execute(
      `INSERT INTO bookings 
       (id, booking_id, event_id, user_id, seat_count, status)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [
        data.bookingId,
        data.eventId,
        data.userId,
        data.seatCount,
        "confirmed",
      ]
    );

    await connection.commit();

    const [rows] = await connection.execute<Booking[]>(
      "SELECT * FROM bookings WHERE booking_id = ?",
      [data.bookingId]
    );

    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const findByBookingId = async (
  bookingId: string
): Promise<Booking | null> => {
  const [rows] = await dbPool.execute<Booking[]>(
    "SELECT * FROM bookings WHERE booking_id = ?",
    [bookingId]
  );

  return rows.length ? rows[0] : null;
};

export default {
  bookSeatsAtomic,
  findByBookingId,
};
