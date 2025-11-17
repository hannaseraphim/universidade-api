import { Courses } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";

const courses = new Courses(connection);

// Creates a new course
export async function createCourse(
  req: express.Request,
  res: express.Response
) {
  const { name, description, max_students } = req.body;

  if (!name || !description || !max_students) {
    return res.sendStatus(400);
  }

  const validFields = await courses.validateFields(req.body);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const exists = await courses.findOne({ name: name });

  if (exists) {
    return res.sendStatus(409);
  }

  try {
    const row = await courses.createItem(req.body);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }

  return res.sendStatus(200);
}

// Lists all created courses
export async function listCourses(req: express.Request, res: express.Response) {
  try {
    const [rows] = await courses.findAll();
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
}

// Updates a course by id
export async function updateCourse(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  const exists = await courses.findOne({ id });
  if (!exists) {
    return res.sendStatus(404);
  }

  const validFields = await courses.validateFields(req.body);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const result = await courses.updateItem(id!, req.body, "id");
  return res.sendStatus(result ? 200 : 400);
}

// Deletes a course by id
export async function deleteCourse(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  const exists = await courses.findOne({ id: id });

  if (!exists) {
    return res.sendStatus(404);
  }

  const result = await courses.deleteItem(id!, "id");
  if (result) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(400);
  }
}

// Fetchs a course by id
export async function getCourse(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const result = await courses.findOne({ id: id });

  if (!result) {
    return res.sendStatus(404);
  }

  return res.status(200).send(result);
}
