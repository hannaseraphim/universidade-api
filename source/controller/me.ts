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
const gradesModel = new Grades(connection);
const associatedModel = new Associated(connection);

// Fetchs the logged user data
export async function showLogged(req: express.Request, res: express.Response) {
  try {
    const id = (req.user as any).id;

    const [userRows]: any[] = await connection.execute(
      "SELECT id, name, email FROM users WHERE id = ?",
      [id]
    );

    if (!userRows.length) return res.sendStatus(404);

    const user = userRows[0];

    const grades = await gradesModel.findGrades(id);
    const profiles = await associatedModel.getAllAssociated(id);
    const teacherClasses = await classesModel.findActiveClassesByTeacher(id);
    const [enrolments]: any[] = await connection.execute(
      `
      SELECT id_class, enrolled_at, active
      FROM enrolment
      WHERE id_student = ?
      `,
      [id]
    );

    let studentClasses = [];
    let materialsByClass = {};
    let activitiesByClass = {};

    if (enrolments.length > 0) {
      const classIds = enrolments.map((e: any) => e.id_class);
      const placeholders = classIds.map(() => "?").join(",");
      const [classRows]: any[] = await connection.execute(
        `SELECT * FROM classes WHERE id IN (${placeholders})`,
        classIds
      );
      studentClasses = classRows;
      const [materialsRows]: any[] = await connection.execute(
        `SELECT * FROM materials WHERE id_class IN (${placeholders})`,
        classIds
      );
      const [activitiesRows]: any[] = await connection.execute(
        `SELECT * FROM activities WHERE id_class IN (${placeholders})`,
        classIds
      );
      materialsByClass = materialsRows.reduce((acc: any, m: any) => {
        acc[m.id_class] = acc[m.id_class] || [];
        acc[m.id_class].push(m);
        return acc;
      }, {});

      activitiesByClass = activitiesRows.reduce((acc: any, a: any) => {
        acc[a.id_class] = acc[a.id_class] || [];
        acc[a.id_class].push(a);
        return acc;
      }, {});
    }
    return res.json({
      ...user,
      profiles,
      grades,
      teacherClasses,
      student: {
        enrolments,
        classes: studentClasses,
        materialsByClass,
        activitiesByClass,
      },
    });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
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
