import express from "express";
import {
  Users,
  Enrolment,
  Submissions,
  Grades,
  Classes,
  History,
} from "../modules/index.js";
import connection from "../config/database.js";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

const userModel = new Users(connection);
const classesModel = new Classes(connection);

// Fetchs the logged user data
export async function showLogged(req: express.Request, res: express.Response) {
  const id = (req.user as any).id;

  let user = await userModel.findOne({ id: id });
  const profiles = req.user?.profiles;

  if (profiles?.includes("TEACHER")) {
    const classes = await classesModel.findClassesByTeacher(id);
    user = { ...user, classes };
  }

  return res.json(user);
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

  const result = await userModel.updateItem(id!, data, "id");
  return res.sendStatus(result ? 200 : 400);
}
