import { Router } from "express";
import {
  createGrade,
  listGrades,
  updateGrade,
} from "../controller/grades.js";

const router = Router();

// /classes/ Routes
router.get("/", listGrades);
router.post("/", createGrade);
router.put("/:id", updateGrade);

export default router;
