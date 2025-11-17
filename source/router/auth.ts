import { Router } from "express";
import { login, logout } from "../middleware/authentication.js";

const router = Router();

// /users/ routes
router.post("/login", login);
router.post("/logout", logout);

export default router;
