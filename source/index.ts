import express from "express";
import { env } from "./config/env.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authenticated } from "./middleware/authentication.js";
import routes from "./router.js";
import authRoutes from "./router/auth.js";

// Server configuration
const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: env.corsOrigin,
    methods: env.corsMethods,
    allowedHeaders: env.corsHeaders,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api", authenticated, routes);
app.use("/auth", authRoutes);

// Server start
app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
});
