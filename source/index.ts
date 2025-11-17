import express from "express";
import { env } from "./config/env.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import connection from "./config/database.js";
import routes from "./router.js";

// Server configuration
const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: env.corsOrigin,
    methods: env.corsMethods,
    allowedHeaders: env.corsHeaders,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api", routes);

// Server start
app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
});
