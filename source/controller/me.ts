import express from "express";
import connection from "../config/database.js";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

interface Enrolment {
  classId: number;
  className: string;
  courseName: string;
}

interface Grade {
  activityId: number;
  activityTitle: string;
  grade: number;
}

interface History {
  classId: number;
  finalGrade: number;
  status: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  profiles: string[];
  enrolments: Enrolment[];
  grades: Grade[];
  history: History[];
}

// Fetchs the logged user data
export async function showLogged(req: express.Request, res: express.Response) {
  try {
    const id = (req.user as any).id;

    const query = `
    SELECT 
      u.id AS user_id,
      u.name AS user_name,
      u.email,
    GROUP_CONCAT(DISTINCT p.name) AS profiles,
      e.id_class,
      c.name AS class_name,
      co.name AS course_name,
      g.id_activity,
      a.title AS activity_title,
      g.grade,
      h.final_grade,
      h.status
    FROM users u
    INNER JOIN 
      associated a1 ON u.id = a1.id_user
    INNER JOIN
      user_profiles p ON a1.id_profile = p.id
    LEFT JOIN 
      enrolment e ON u.id = e.id_student
    LEFT JOIN 
      classes c ON e.id_class = c.id
    LEFT JOIN 
      courses co ON c.id_course = co.id
    LEFT JOIN 
      grades g ON u.id = g.id_student
    LEFT JOIN 
      activities a ON g.id_activity = a.id
    LEFT JOIN 
      history h ON u.id = h.id_student
    WHERE   
      u.id = ?
    GROUP BY 
      u.id, u.name, u.email, e.id_class, c.name, co.name, 
      g.id_activity, a.title, g.grade, h.final_grade, h.status
    `;

    const [rows] = await connection.execute<any[]>(query, [id]);

    if (rows.length === 0) {
      return null;
    }

    const user: UserData = {
      id: rows[0].user_id,
      name: rows[0].user_name,
      email: rows[0].email,
      profiles: rows[0].profiles?.split(",") || [],
      enrolments: [],
      grades: [],
      history: [],
    };

    rows.forEach((r) => {
      if (r.id_class) {
        user.enrolments.push({
          classId: r.id_class,
          className: r.class_name,
          courseName: r.course_name,
        });
      }
      if (r.id_activity) {
        user.grades.push({
          activityId: r.id_activity,
          activityTitle: r.activity_title,
          grade: r.grade,
        });
      }
      if (r.final_grade !== null) {
        user.history.push({
          classId: r.id_class,
          finalGrade: r.final_grade,
          status: r.status,
        });
      }
    });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Edits personal information
export async function editLogged(req: express.Request, res: express.Response) {
  const id = (req.user as any).id;
  let data = req.body;

  // Se tiver senha, gera hash
  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, env.saltRounds);
    data.password = hashedPassword;
  }

  // Validação simples: não permitir campos vazios
  if (!data.name && !data.email && !data.password) {
    return res.status(400).json({ message: "Fields not valid" });
  }

  try {
    // Monta dinamicamente os campos que serão atualizados
    const fields = Object.keys(data);
    const values = Object.values(data);

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Cria query dinâmica: UPDATE users SET field1=?, field2=? WHERE id=?
    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const sql = `UPDATE users SET ${setClause} WHERE id = ?`;

    const [result] = await connection.execute(sql, [...values, id]);

    // mysql2 retorna um objeto com affectedRows
    const updateResult = result as any;

    return res
      .status(updateResult.affectedRows > 0 ? 200 : 400)
      .json(
        updateResult.affectedRows > 0
          ? { message: "User updated successfully" }
          : { message: "User could not be updated" }
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
