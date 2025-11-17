import { Router } from "express";
import { showLogged, editLogged } from "../controller/me.js";

const router = Router();

router.get("/", showLogged);
router.put("/", editLogged);

export default router;
