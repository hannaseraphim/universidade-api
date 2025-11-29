import { Router } from "express";
import {
  createCourse,
  listCourses,
  updateCourse,
  deleteCourse,
  getCourse,
  getCourseClassAverages,
} from "../controller/courses.js";

const router = Router();

// /courses Routes
router.post("/", createCourse);
router.get("/", listCourses);
router.get("/averages/:id", getCourseClassAverages);
router.get("/:id", getCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
