import mysql from "mysql2/promise";
import config from "./config";

const connection = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const conn = await connection.getConnection();
    console.log("MySQL connected");
    conn.release();
  } catch (err) {
    if (err instanceof Error) {
      console.error("MySQL connection failed:", err.message);
    } else {
      console.error("MySQL connection failed:", err);
    }
  }
})();

export default connection;
