import mysql from "mysql2/promise";
import { env } from "./env.js";
import type { Connection } from "mysql2/promise";

const connection: Connection = await mysql.createConnection({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  port: Number(env.dbPort),
});

export default connection;
