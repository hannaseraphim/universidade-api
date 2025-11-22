import { Grades, Activities, Users, Submissions } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";

const grades = new Grades(connection);
const activities = new Activities(connection);
const users = new Users(connection);
const submissions = new Submissions(connection);

// Creates a new grade
export async function createGrade(req: express.Request, res: express.Response) {
  const { id_student, id_activity, grade } = req.body;

  if (
    id_student === undefined ||
    id_activity === undefined ||
    grade === undefined
  ) {
    return res.sendStatus(400);
  }

  const submission = await submissions.getOneByCondition({
    id_student: id_student,
    id_activity: id_activity,
  });
  if (!submission) return res.sendStatus(400);

  const validGrade = await grades.validGrade(id_activity, grade);
  if(!validGrade) return res.sendStatus(400);

  try {
    const row = await grades.create(req.body);
    const deleteSubmission = await submissions.deleteByCondition({
      id_student: id_student,
      id_activity: id_activity,
    });
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
}

// Lists all created grades
export async function listGrades(req: express.Request, res: express.Response) {
  try {
    const [rows] = await grades.getAll();
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
}

// Updates a grade by id
export async function updateGrade(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const { grade, id_activity } = req.body;

  const validGrade = await grades.validGrade(id_activity, grade);
  if (!validGrade) return res.sendStatus(400);

  const exists = await grades.getSpecificByCondition({ id_student: id });
  if (!exists) {
    return res.sendStatus(404);
  }

  const validFields = await grades.validateFields(req.body);
  if (!validFields) return res.sendStatus(400);

  const studentExists = await users.isStudent(Number(id));
  if (!studentExists) return res.sendStatus(400);

  const activityExists = await activities.getSpecificByCondition({
    id: id_activity,
  });
  if (!activityExists) return res.sendStatus(400);

  const result = await grades.update(id!, req.body, "id_student");
  return res.sendStatus(result ? 200 : 400);
}

export async function getGrade(req: express.Request, res: express.Response) {
  const { id } = req.params;

  // Verifica se existe body E se contém id_activity
  if (req.body && typeof req.body === "object" && "id_activity" in req.body) {
    const { id_activity } = req.body;

    const grade = await grades.findGrade(Number(id), Number(id_activity));
    if (!grade) return res.sendStatus(404);

    return res.status(200).json(grade);
  }

  // Sem id_activity → retornar todas as grades do usuário
  const gradesList = await grades.findGrades(Number(id));
  return res.status(200).json(gradesList);
}
