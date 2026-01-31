import dotenv from "dotenv";
dotenv.config()

const dev = {
  app: {
    port: Number(process.env.PORT) || 5000,
  },
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
  },
};

export default dev;
