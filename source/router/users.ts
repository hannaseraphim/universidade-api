import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  deleteUser,
  updateUser
} from "../controller/user.js";

import { restricted } from "../middleware/authentication.js";

const router = Router();

// /users/ Routes
router.get("/", restricted("ADMIN"), listUsers);
router.get("/:id", restricted("ADMIN"), getUser);
router.post("/", restricted("ADMIN"), createUser);
router.delete("/:id", restricted("ADMIN"), deleteUser);
router.put("/:id", restricted("ADMIN"), updateUser);

export default router;
