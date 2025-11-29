import { Router } from "express";
import { getUserHistory } from "../controller/history.js";

const router = Router();

// /history Routes
router.get("/:id", getUserHistory);

export default router;
