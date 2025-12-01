import { Router } from "express";
import {
  createEnrolment,
  deleteEnrolmentByStudentAndClassId,
  listEnrolmentsByStudentId,
  listEnrolmentsByClassId,
  updateEnrolmentByStudentAndClassId,
  listAllAcitveEnrolments,
} from "../controller/enrolment.js";

const router = Router();

// enrolments Routes
router.get("/", listAllAcitveEnrolments);
router.get("/:id", listEnrolmentsByClassId);
router.get("/student/:id", listEnrolmentsByStudentId);
router.post("/", createEnrolment);
router.delete("/student/:id", deleteEnrolmentByStudentAndClassId);
router.put("/student/:id", updateEnrolmentByStudentAndClassId);

export default router;
