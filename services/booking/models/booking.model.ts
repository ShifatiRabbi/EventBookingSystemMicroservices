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

const findAll = async (): Promise<Booking[]> => {
  const [rows] = await dbPool.execute<Booking[]>(
    `SELECT *
     FROM bookings
     ORDER BY created_at DESC`
  );

  return rows;
};

const insertOutboxEvent = async (
  connection: any,
  booking: Booking
) => {
  await connection.execute(
    `INSERT INTO booking_outbox 
     (id, aggregate_id, event_type, payload)
     VALUES (UUID(), ?, ?, ?)`,
    [
      booking.booking_id,
      "booking.confirmed",
      JSON.stringify({
        eventType: "booking.confirmed",
        version: 1,
        messageId: booking.booking_id,
        bookingId: booking.booking_id,
        eventId: booking.event_id,
        userId: booking.user_id,
        seatCount: booking.seat_count,
        timestamp: new Date().toISOString(),
      }),
    ]
  );
};

export default {
  bookSeatsAtomic,
  findByBookingId,
  insertOutboxEvent,
  findAll
};
