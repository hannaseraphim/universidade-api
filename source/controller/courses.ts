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
    return res.status(400).json({ message: "Missing fields" });
  }

  const validFields = await courses.validateFields(req.body);
  if (!validFields) {
    return res.status(400).json({ message: "Fields not valid" });
  }

  const exists = await courses.getSpecificByCondition({ name: name });

  if (exists) {
    return res.status(409).json({ message: "Course already exists" });
  }

  try {
    const row = await courses.create(req.body);
    return res.status(200).json({ message: "Course created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all created courses
export async function listCourses(req: express.Request, res: express.Response) {
  try {
    const [rows] = await courses.getAll();
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Updates a course by id
export async function updateCourse(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  const exists = await courses.getSpecificByCondition({ id });
  if (!exists) {
    return res.status(404).json({ message: "Course not found" });
  }

  const validFields = await courses.validateFields(req.body);
  if (!validFields) {
    return res.status(400).json({ message: "Fields not valid" });
  }

  const result = await courses.update(id!, req.body, "id");
  return res
    .status(result ? 200 : 400)
    .json(
      result
        ? { message: "Course updated successfully" }
        : { message: "Course could not be updated" }
    );
}

// Deletes a course by id
export async function deleteCourse(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  const exists = await courses.getSpecificByCondition({ id: id });

  if (!exists) {
    return res.status(404).json({ message: "Course not found" });
  }

  const result = await courses.delete(id!, "id");
  return res
    .status(result ? 200 : 400)
    .json(
      result
        ? { message: "Course deleted successfully" }
        : { message: "Course could not be deleted" }
    );
}

// Fetchs a course by id
export async function getCourse(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const result = await courses.getSpecificByCondition({ id: id });

  if (!result) {
    return res.status(404).json({ message: "Course not found" });
  }

  return res.status(200).send(result);
}
