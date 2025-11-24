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
    return res.status(400).json({ message: "Missing fields" });

  // Verifies if the providen id is a student
  const isStudent = await users.isStudent(id_student);
  if (!isStudent) return res.status(400).json({ message: "Student not found" });

  // Verifies if the fields are valid
  const validFields = await enrolment.validateFields(req.body);
  if (!validFields) res.status(400).json({ message: "Fields not valid" });

  // Verifies if the student is his own teacher
  const row = await classes.getOneByCondition({ id: id_class });
  if (row.id_teacher == id_student)
    return res.status(400).json({ message: "Cannot enrol on own class" });

  // Verifies class max_students
  const studentQuantity = await enrolment.countByCondition({
    id_class: id_class,
  });
  if (studentQuantity.total > row.max_students) {
    const roomName = `teacher-${row.id_teacher}`;
    io.to(roomName).emit("class:full", {
      id_class: row.id,
      teacherId: row.id_teacher,
      id_student: id_student,
      message:
        "A matrícula de um aluno foi recusada por falta de vagas. Avalie aumentar o limite da turma.",
      timestamp: new Date().toISOString(),
    });
    return res
      .status(400)
      .json({ message: "Max students reached. Teacher notified" });
  }

  // Verifies if the enrolment already exists before creating
  const exists = await enrolment.getOneByCondition({
    id_student: id_student,
    id_class: id_class,
  });
  if (exists)
    return res.status(409).json({ message: "Enrolment already exists" });

  try {
    await enrolment.create(req.body);
    return res.status(200).json({ message: "Enrolment created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
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
  if (!exists) return res.status(404).json({ message: "Enrolments not found" });

  try {
    const rows = await enrolment.getSpecificByCondition({
      id_class: id,
      active: 1,
    });
    console.log(rows);

    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
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
  if (!exists) return res.status(404).json({ message: "Enrolments not found" });

  try {
    const [rows] = await enrolment.getSpecificByCondition({
      id_student: Number(id),
    });
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
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
  return res
    .status(result ? 200 : 400)
    .json(
      result
        ? { message: "Enrolment updated successfully" }
        : { message: "Enrolment could not be updated" }
    );
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
  return res
    .status(result ? 200 : 400)
    .json(
      result
        ? { message: "Enrolment deleted successfully" }
        : { message: "Enrolment could not be deleted" }
    );
}
