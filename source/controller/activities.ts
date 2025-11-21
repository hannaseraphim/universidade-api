import { Activities } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";

const activity = new Activities(connection);

// Creates a new activity
export async function createActivity(
  req: express.Request,
  res: express.Response
) {
  const { id_class, title, description, type, max_grade, due_date } = req.body;
  const now = new Date();
  const formatted = now.toISOString().split("T")[0];

  if (!id_class || !title || !description || !type || !max_grade || !due_date) {
    return res.json("Missing fields.");
  }

  if (due_date < formatted!) {
    return res.json("Invalid date.");
  }

  const validFields = await activity.validateFields(req.body);
  if (!validFields) {
    return res.json("Invalid fields provided.");
  }

  const exists = await activity.getSpecificByCondition({ title: title });

  if (exists) {
    return res.sendStatus(409);
  }

  try {
    const row = await activity.create(req.body);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
}

// Lists all created activity
export async function listActivities(
  req: express.Request,
  res: express.Response
) {
  try {
    const [rows] = await activity.getAll();
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
}

// Fetchs a activity by id
export async function getActivity(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const result = await activity.getSpecificByCondition({ id: id });

  if (!result) {
    return res.sendStatus(404);
  }

  return res.status(200).send(result);
}
