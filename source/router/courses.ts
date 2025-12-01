import { Router } from "express";
import {
  createCourse,
  listCourses,
  updateCourse,
  deleteCourse,
  getCourse,
  getCourseClassAverages,
} from "../controller/courses.js";
import { restricted } from "../middleware/authentication.js";

const router = Router();

// /courses Routes
router.post("/", restricted("Administrador"), createCourse);
router.get("/", restricted("Administrador"), listCourses);
router.get(
  "/averages/:id",
  restricted("Administrador"),
  getCourseClassAverages
);
router.get(
  "/:id",
  restricted("Administrador", "Professor", "Aluno"),
  getCourse
);
router.put("/:id", restricted("Administrador"), updateCourse);
router.delete("/:id", restricted("Administrador"), deleteCourse);

export default router;
