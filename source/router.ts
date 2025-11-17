import users from "./router/users.js";
import me from "./router/me.js";
import courses from "./router/courses.js";
import classes from "./router/classes.js";
import materials from "./router/materials.js";
import activities from "./router/activities.js";
import { Router } from "express";
import { restricted } from "./middleware/authentication.js";

const router = Router();

router.use("/users", restricted("ADMIN"), users);
router.use("/courses", restricted("ADMIN"), courses);
router.use("/classes", restricted("ADMIN"), classes);
router.use("/materials", restricted("TEACHER"), materials);
router.use("/activities", restricted("TEACHER"), activities);
router.use("/me", me);

export default router;
