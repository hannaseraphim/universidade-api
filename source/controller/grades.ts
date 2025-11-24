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
    return res.status(400).json({ message: "Missing fields" });
  }

  const submission = await submissions.getOneByCondition({
    id_student: id_student,
    id_activity: id_activity,
  });
  if (!submission)
    return res.status(400).json({ message: "Submission not found" });

  const validGrade = await grades.validGrade(id_activity, grade);
  if (!validGrade) return res.status(400).json({ message: "Grade not valid" });

  try {
    const row = await grades.create(req.body);
    const deleteSubmission = await submissions.deleteByCondition({
      id_student: id_student,
      id_activity: id_activity,
    });
    return res.status(200).json({ message: "Grade created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all created grades
export async function listGrades(req: express.Request, res: express.Response) {
  try {
    const [rows] = await grades.getAll();
    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Updates a grade by id
export async function updateGrade(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const { grade, id_activity } = req.body;

  const validGrade = await grades.validGrade(id_activity, grade);
  if (!validGrade) return res.status(400).json({ message: "Grade not valid" });

  const exists = await grades.getSpecificByCondition({ id_student: id });
  if (!exists) {
    return res.status(404).json({ message: "Grade not found" });
  }

  const validFields = await grades.validateFields(req.body);
  if (!validFields)
    return res.status(400).json({ message: "Fields not valid" });

  const studentExists = await users.isStudent(Number(id));
  if (!studentExists)
    return res.status(400).json({ message: "Student not found" });

  const activityExists = await activities.getSpecificByCondition({
    id: id_activity,
  });
  if (!activityExists)
    return res.status(400).json({ message: "Activity not found" });

  const result = await grades.update(id!, req.body, "id_student");
  return res
    .status(result ? 200 : 400)
    .json(
      result
        ? { message: "Grade updated successfully" }
        : { message: "Grade could not be updated" }
    );
}

export async function getGrade(req: express.Request, res: express.Response) {
  const { id } = req.params;

  // Verifica se existe body E se contém id_activity
  if (req.body && typeof req.body === "object" && "id_activity" in req.body) {
    const { id_activity } = req.body;

    const grade = await grades.findGrade(Number(id), Number(id_activity));
    if (!grade) return res.status(400).json({ message: "Grade not found" });

    return res.status(200).json(grade);
  }

  // Sem id_activity → retornar todas as grades do usuário
  const gradesList = await grades.findGrades(Number(id));
  return res.status(200).json(gradesList);
}
