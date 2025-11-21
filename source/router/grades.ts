import { Router } from "express";
import {
  createGrade,
  getGrade,
  listGrades,
  updateGrade,
} from "../controller/grades.js";

const router = Router();

// /grades Routes
router.get("/", listGrades);
router.get("/:id", getGrade);
router.post("/", createGrade);
router.put("/:id", updateGrade);

export default router;
