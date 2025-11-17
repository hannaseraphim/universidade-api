import users from "./router/users.js";

import { Router } from "express";

const router = Router();

router.use("/users", users);

export default router;
