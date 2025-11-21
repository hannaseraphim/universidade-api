import { Classes, Courses } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";

const classes = new Classes(connection);
const courses = new Courses(connection);

// Creates a new class
export async function createClass(req: express.Request, res: express.Response) {
  const {
    id_course,
    id_teacher,
    starts_on,
    ends_on,
    period,
    name,
    max_students,
    archived,
  } = req.body;

  if (
    id_course === undefined ||
    id_teacher === undefined ||
    starts_on === undefined ||
    ends_on === undefined ||
    period === undefined ||
    name === undefined ||
    max_students === undefined ||
    archived === undefined
  ) {
    return res.sendStatus(400);
  }

  const validFields = await classes.validateFields(req.body);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const courseExists = await courses.getSpecificByCondition({ id: id_course });
  if (!courseExists) {
    return res.sendStatus(400);
  }

  const isTeacher = await classes.isTeacher(id_teacher);

  if (!isTeacher) {
    return res.send("No teachers found");
  }

  const classExists = await classes.getSpecificByCondition({
    id_course: id_course,
    id_teacher: id_teacher,
  });

  if (classExists) {
    return res.sendStatus(409);
  }

  try {
    const row = await classes.create(req.body);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
}

// Lists all created classes
export async function listClasses(req: express.Request, res: express.Response) {
  try {
    const [rows] = await classes.getAll();
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
}

// Updates a class by id
export async function updateClass(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const { id_course, id_teacher } = req.body;

  const exists = await classes.getSpecificByCondition({ id });
  if (!exists) {
    return res.sendStatus(404);
  }

  const courseExists = await courses.getSpecificByCondition({ id: id_course });
  if (!courseExists) {
    return res.sendStatus(400);
  }

  const isTeacher = await classes.isTeacher(id_teacher);

  if (!isTeacher) {
    return res.sendStatus(400);
  }

  const classExists = await classes.getSpecificByCondition({
    id_course: id_course,
    id_teacher: id_teacher,
  });

  if (classExists && classExists.id !== Number(id)) {
    return res.sendStatus(409);
  }

  const validFields = await classes.validateFields(req.body);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const result = await classes.update(id!, req.body, "id");
  return res.sendStatus(result ? 200 : 400);
}

// Deletes a class by id
export async function deleteClass(req: express.Request, res: express.Response) {
  const { id } = req.params;

  const exists = await classes.getSpecificByCondition({ id: id });

  if (!exists) {
    return res.sendStatus(404);
  }

  const result = await classes.delete(id!, "id");
  if (result) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(400);
  }
}

// Fetchs a class by id
export async function getClass(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const result = await classes.getSpecificByCondition({ id: id });

  if (!result) {
    return res.sendStatus(404);
  }

  return res.status(200).send(result);
}
