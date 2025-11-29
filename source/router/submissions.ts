import { Router } from "express";
import {
  createSubmission,
  listSubmissionsByTeacher,
} from "../controller/submissions.js";
import { restricted } from "../middleware/authentication.js";

const router = Router();

// Submission Routes
router.get("/", restricted("Professor"), listSubmissionsByTeacher);
router.post("/", restricted("Aluno"), createSubmission);
export default router;
