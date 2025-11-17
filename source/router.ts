import users from "./router/users.js";
import me from "./router/me.js";

import { Router } from "express";

const router = Router();

router.use("/users", users);
router.use("/me", me);

export default router;
