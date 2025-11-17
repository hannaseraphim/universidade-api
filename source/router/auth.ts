import { Router } from "express";
import { authenticated, login, logout } from "../middleware/authentication.js";

const router = Router();

// /users/ routes
router.post("/login", login);
router.post("/logout", authenticated, logout);

export default router;
