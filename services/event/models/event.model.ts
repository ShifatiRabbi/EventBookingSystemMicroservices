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
     VALUES (UUID(), ?, ?, ?, ?, ?)`,
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

export default {
  createEvent,
  getEventById,
  updateEventById,
  getAllEvents
};
