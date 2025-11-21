import { Enrolment, Users, Classes } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";
import { io } from "../index.js";

const enrolment = new Enrolment(connection);
const classes = new Classes(connection);
const users = new Users(connection);

// Creates a new enrolment
export async function createEnrolment(
  req: express.Request,
  res: express.Response
) {
  const { id_student, id_class, enrolled_at, active } = req.body;

  if (!id_student || !id_class || !enrolled_at || !active)
    return res.sendStatus(400);

  // Verifies if the providen id is a student
  const isStudent = await users.isStudent(id_student);
  if (!isStudent) return res.sendStatus(400);

  // Verifies if the fields are valid
  const validFields = await enrolment.validateFields(req.body);
  if (!validFields) return res.sendStatus(400);

  // Verifies if the student is his own teacher
  const row = await classes.getOneByCondition({ id: id_class });
  if (row.id_teacher == id_student) return res.sendStatus(400);

  // Verifies class max_students
  const studentQuantity = await enrolment.countByCondition({
    id_class: id_class,
  });
  if (studentQuantity > row.max_students) {
    io.to(row.id_teacher).emit("maxStudentsReached");
    return res.sendStatus(400);
  }

  // Verifies if the enrolment already exists before creating
  const exists = await enrolment.getOneByCondition({
    id_student: id_student,
    id_class: id_class,
  });
  if (exists) return res.sendStatus(409);

  try {
    await enrolment.create(req.body);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
}

// Lists all created enrolments by class id
export async function listEnrolmentsByClassId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  // Verifies if the enrolments by the class id exists
  const exists = await enrolment.getSpecificByCondition({
    id_class: id,
  });
  if (!exists) return res.sendStatus(404);

  try {
    const rows = await enrolment.getSpecificByCondition({
      id_class: id,
      active: 1,
    });
    console.log(rows);

    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
}

// Lists all created enrolments by student id
export async function listEnrolmentsByStudentId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  // Verifies if the student exists
  const exists = await enrolment.getOneByCondition({
    id_student: id,
  });
  console.log(exists);
  if (!exists) return res.sendStatus(404);

  try {
    const [rows] = await enrolment.getSpecificByCondition({
      id_student: Number(id),
    });
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
}

// Updates a enrolment by student id and class id
export async function updateEnrolmentByStudentAndClassId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;
  const { id_class, active } = req.body;

  if (!id_class && !active) return res.sendStatus(400);

  const validFields = await enrolment.validateFields(req.body);
  if (!validFields) return res.sendStatus(400);

  const exists = await enrolment.getOneByCondition({
    id_student: id,
    id_class: id_class,
  });
  if (!exists) return res.sendStatus(404);

  const result = await enrolment.update(id!, req.body, "id_student");
  return res.sendStatus(result ? 200 : 400);
}

// Deletes a enrolment by student id and class id
export async function deleteEnrolmentByStudentAndClassId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;
  const { id_class } = req.body;

  if (!id_class) return res.sendStatus(400);

  const validFields = await enrolment.validateFields(req.body);
  if (!validFields) return res.sendStatus(400);

  const exists = await enrolment.getOneByCondition({
    id_student: id,
    id_class: id_class,
  });

  if (!exists) return res.sendStatus(404);

  const result = await enrolment.delete(id!, "id_student");
  if (result) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(400);
  }
}
