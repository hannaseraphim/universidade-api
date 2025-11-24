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
    return res.status(400).json("Missing fields");
  }

  if (due_date < formatted!) {
    return res.status(400).json("Date not valid");
  }

  const validFields = await activity.validateFields(req.body);
  if (!validFields) {
    return res.status(400).json("Fields not valid");
  }

  const exists = await activity.getSpecificByCondition({ title: title });

  if (exists) {
    return res.status(409).json({ message: "Activity already exists" });
  }

  try {
    const row = await activity.create(req.body);
    return res.status(200).json({ message: "Activity created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Fetchs a activity by id
export async function getActivity(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const result = await activity.getSpecificByCondition({ id: id });

  if (!result) {
    return res.status(404).json({ message: "Activity not found" });
  }

  return res.status(200).send(result);
}
