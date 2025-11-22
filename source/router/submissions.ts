import { Router } from "express";
import {
  createSubmission,
  listSubmissionsByTeacher,
} from "../controller/submissions.js";

const router = Router();

// Submission Routes
router.get("/", listSubmissionsByTeacher);
router.post("/", createSubmission);
export default router;
