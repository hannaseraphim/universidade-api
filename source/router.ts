import users from "./router/users.js";
import me from "./router/me.js";
import courses from "./router/courses.js";
import { Router } from "express";
import { restricted } from "./middleware/authentication.js";

const router = Router();

router.use("/users", restricted("ADMIN"), users);
router.use("/courses", restricted("ADMIN"), courses);
router.use("/me", me);

export default router;
