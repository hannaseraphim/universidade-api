import { Materials } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";

const materials = new Materials(connection);

// Creates a new material
export async function createMaterial(
  req: express.Request,
  res: express.Response
) {
  const { id_class, title, description } = req.body;

  if (!id_class || !title || !description) {
    return res.sendStatus(400);
  }

  const validFields = await materials.validateFields(req.body);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const exists = await materials.getSpecificByCondition({ title: title });

  if (exists) {
    return res.sendStatus(409);
  }

  try {
    const row = await materials.create(req.body);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
}

// Lists all created materials
export async function listMaterials(
  req: express.Request,
  res: express.Response
) {
  try {
    const [rows] = await materials.getAll();
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
}

// Fetchs a material by id
export async function getMaterial(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const result = await materials.getSpecificByCondition({ id: id });

  if (!result) {
    return res.sendStatus(404);
  }

  return res.status(200).send(result);
}
