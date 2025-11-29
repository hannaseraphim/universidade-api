import { Router } from "express";
import {
  createClass,
  deleteClass,
  getClass,
  getTopClasses,
  listClasses,
  updateClass,
} from "../controller/classes.js";

const router = Router();

// /classes/ Routes
router.get("/", listClasses);
router.get("/topClasses", getTopClasses);
router.get("/:id", getClass);
router.post("/", createClass);
router.delete("/:id", deleteClass);
router.put("/:id", updateClass);

export default router;
