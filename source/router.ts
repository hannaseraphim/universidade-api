import users from "./router/users.js";
import me from "./router/me.js";
import courses from "./router/courses.js";
import classes from "./router/classes.js";
import materials from "./router/materials.js";
import activities from "./router/activities.js";
import grades from "./router/grades.js";
import enrolment from "./router/enrolment.js";
import submissions from "./router/submissions.js";
import { Router } from "express";
import { restricted } from "./middleware/authentication.js";

const router = Router();

router.use("/users", restricted("ADMIN"), users);
router.use("/courses", restricted("ADMIN"), courses);
router.use("/classes", restricted("ADMIN"), classes);
router.use("/materials", restricted("TEACHER"), materials);
router.use("/activities", restricted("TEACHER"), activities);
router.use("/grades", restricted("TEACHER"), grades);
router.use("/enrolments", restricted("TEACHER"), enrolment);
router.use("/submissions", restricted("TEACHER"), submissions);
router.use("/me", me);

export default router;
