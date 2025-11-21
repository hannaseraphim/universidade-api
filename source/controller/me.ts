import express from "express";
import {
  Users,
  Classes,
  Activities,
  Grades,
  Associated,
} from "../modules/index.js";
import connection from "../config/database.js";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

const userModel = new Users(connection);
const classesModel = new Classes(connection);
const activitiesModel = new Activities(connection);
const gradesModel = new Grades(connection);
const associatedModel = new Associated(connection);

// Fetchs the logged user data
export async function showLogged(req: express.Request, res: express.Response) {
  const id = (req.user as any).id;

  const userQuery = "SELECT u.id, u.name, u.email FROM users u WHERE u.id = ?";
  const [rows]: any[] = await connection.execute(userQuery, [id]);

  const user = rows[0];

  const grades = await gradesModel.findGrades(id);
  const profiles = await associatedModel.getAllAssociated(id);
  const classes = await classesModel.findActiveClassesByTeacher(id);

  const result = {
    ...user,
    grades,
    profiles,
    classes,
  };

  return res.json(result);
}

// Edits personal information
export async function editLogged(req: express.Request, res: express.Response) {
  const id = (req.user as any).id;

  let data = req.body;

  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, env.saltRounds);
    data.password = hashedPassword;
  }

  const validFields = await userModel.validateFields(data);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const result = await userModel.update(id!, data, "id");
  return res.sendStatus(result ? 200 : 400);
}
