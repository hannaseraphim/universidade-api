import { Router } from "express";
import {
  createActivity,
  getActivity,
  listActivities,
} from "../controller/activities.js";

const router = Router();

// /activities Routes
router.post("/", createActivity);
router.get("/", listActivities);
router.get("/:id", getActivity);


export default router;
