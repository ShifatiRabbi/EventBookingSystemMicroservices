import dbPool from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface User extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

const createUser = async (name: string, email: string): Promise<User> => {
  await dbPool.execute<ResultSetHeader>(
    "INSERT INTO users (id, name, email) VALUES (UUID(), ?, ?)",
    [name, email]
  );

  const [rows] = await dbPool.execute<User[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  return rows[0];
};

const getAllUsers = async (): Promise<User[]> => {
  const [rows] = await dbPool.execute<User[]>(
    "SELECT * FROM users ORDER BY created_at DESC"
  );

  return rows;
};

const getUserById = async (id: string): Promise<User | null> => {
  const [rows] = await dbPool.execute<User[]>(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );

  return rows.length ? rows[0] : null;
};

export default {
  createUser,
  getAllUsers,
  getUserById,
};
