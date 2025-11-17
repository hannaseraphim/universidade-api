import { Router } from "express";
import {
  createCourse,
  listCourses,
  updateCourse,
  deleteCourse,
  getCourse,
} from "../controller/courses.js";

const router = Router();

router.post("/", createCourse);
router.get("/", listCourses);
router.get("/:id", getCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
