import dbPool from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface Event extends RowDataPacket {
  id: string;
  title: string;
  total_seats: number;
  available_seats: number;
  date: Date;
  created_at: Date;
  updated_at: Date;
}

const createEvent = async (
  title: string,
  totalSeats: number,
  date: Date
): Promise<Event> => {
  await dbPool.execute<ResultSetHeader>(
    `INSERT INTO events 
     (id, title, total_seats, available_seats, date)
     VALUES (UUID(), ?, ?, ?, ?)`,
    [title, totalSeats, totalSeats, date]
  );

  const [rows] = await dbPool.execute<Event[]>(
    `SELECT * FROM events WHERE title = ? ORDER BY created_at DESC LIMIT 1`,
    [title]
  );

  return rows[0];
};

const getEventById = async (id: string): Promise<Event | null> => {
  const [rows] = await dbPool.execute<Event[]>(
    "SELECT * FROM events WHERE id = ?",
    [id]
  );

  return rows.length ? rows[0] : null;
};

const updateEventById = async (
  id: string,
  updates: Partial<Event>
): Promise<Event | null> => {
  const fields = Object.keys(updates)
    .filter(key => key !== "id")
    .map(key => `${key} = ?`);

  if (!fields.length) return null;

  const values = Object.values(updates);
  values.push(id);

  await dbPool.execute(
    `UPDATE events SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getEventById(id);
};

const getAllEvents = async (): Promise<Event[]> => {
  const [rows] = await dbPool.execute<Event[]>(
    `SELECT *
     FROM events
     ORDER BY date ASC`
  );

  return rows;
};

const reserveSeatsAtomic = async (
  eventId: string,
  seatCount: number
): Promise<Event> => {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows]: any = await connection.execute(
      `SELECT available_seats 
       FROM events 
       WHERE id = ? 
       FOR UPDATE`,
      [eventId]
    );

    if (!rows.length) {
      throw new Error("Event not found");
    }

    if (rows[0].available_seats < seatCount) {
      throw new Error("Not enough seats");
    }

    const [result]: any = await connection.execute(
      `UPDATE events
       SET available_seats = available_seats - ?
       WHERE id = ?`,
      [seatCount, eventId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Seat reservation failed");
    }

    await connection.commit();

    const [updated] = await connection.execute<Event[]>(
      `SELECT * FROM events WHERE id = ?`,
      [eventId]
    );

    return updated[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default {
  createEvent,
  getEventById,
  updateEventById,
  getAllEvents,
  reserveSeatsAtomic
};
