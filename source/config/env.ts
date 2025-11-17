import dotenv from "dotenv";
dotenv.config();

interface EnvConfig {
  port: number | string;
  dbHost: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dbPort: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  saltRounds: number; // should be number, not string
  corsOrigin: string;
  corsMethods: string;
  corsHeaders: string;
}

export const env: EnvConfig = {
  port: process.env.PORT || 8080,
  dbHost: process.env.DB_HOST || "localhost",
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "unidb",
  dbPort: process.env.DB_PORT || "3306",
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  saltRounds: process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  corsMethods: process.env.CORS_METHODS || "GET,POST,PUT,DELETE",
  corsHeaders: process.env.CORS_HEADERS || "Content-Type,Authorization",
};
