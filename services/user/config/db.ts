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

const connectWithRetry = async () => {
  try {
    const conn = await connection.getConnection();
    console.log("MySQL connected");
    conn.release();
  } catch (err: any) {
    console.error("MySQL connection failed:", err.code || err.message);
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();


export default connection;
