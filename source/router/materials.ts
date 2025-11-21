import { Router } from "express";
import {
  createMaterial,
  listMaterials,
  getMaterial,
} from "../controller/materials.js";

const router = Router();

// /materials Routes
router.post("/", createMaterial);
router.get("/", listMaterials);
router.get("/:id", getMaterial);

export default router;
