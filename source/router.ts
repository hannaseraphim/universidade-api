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

router.use("/users", restricted("Administrador"), users);
router.use("/courses", restricted("Administrador"), courses);
router.use("/classes", restricted("Administrador"), classes);
router.use("/materials", restricted("Professor"), materials);
router.use("/activities", restricted("Professor"), activities);
router.use("/grades", restricted("Professor"), grades);
router.use("/enrolments", restricted("Professor"), enrolment);
router.use("/submissions", restricted("Professor"), submissions);
router.use("/me", me);

export default router;
