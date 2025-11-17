import { Grades, Activities } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";

const grades = new Grades(connection);
const activities = new Activities(connection);

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

  const exists = await grades.findOne({id_student: id_student, id_activity: id_activity});
  if(exists) 
    return res.sendStatus(409);

  const validGrade = await grades.validGrade(id_activity, grade);
  if (!validGrade) return res.send("Invalid Grades");

  const validFields = await grades.validateFields(req.body);
  if (!validFields) return res.send("Invalid Fields");

  const studentExists = await grades.isStudent(id_student);
  if (!studentExists) return res.send("Student not found");

  const activityExists = await activities.findOne({ id: id_activity });
  if (!activityExists) return res.send("Activity not found");

  const data = { ...req.body, submission_date: new Date() };

  try {
    const row = await grades.createItem(data);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
}

// Lists all created grades
export async function listGrades(req: express.Request, res: express.Response) {
  try {
    const [rows] = await grades.findAll();
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
  if(!validGrade)
    return res.sendStatus(400);

  const exists = await grades.findOne({ id_student: id });
  if (!exists) {
    return res.sendStatus(404);
  }

  const validFields = await grades.validateFields(req.body);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const studentExists = await grades.isStudent(Number(id));
  if (!studentExists) {
    return res.sendStatus(400);
  }

  const activityExists = await activities.findOne({ id: id_activity });
  if (!activityExists) {
    return res.sendStatus(400);
  }

  const result = await grades.updateItem(id!, req.body, "id_student");
  return res.sendStatus(result ? 200 : 400);
}
