import users from "./router/users.js";
import { restricted } from "./middleware/authentication.js";

import { Router } from "express";

const router = Router();

router.use("/users", restricted("STUDENT"), users);

export default router;
