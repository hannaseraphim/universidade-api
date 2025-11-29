import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  deleteUser,
  updateUser,
  getTopTeacher,
  getTopStudent,
} from "../controller/user.js";

const router = Router();

// /users/ Routes
router.get("/", listUsers);
router.get("/topTeacher", getTopTeacher);
router.get("/topStudent", getTopStudent);
router.get("/:id", getUser);
router.post("/", createUser);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);

export default router;
