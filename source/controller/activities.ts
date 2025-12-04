import type { RowDataPacket } from "mysql2/promise";
import connection from "../config/database.js";
import express from "express";

// Creates a new activity
export async function createActivity(
  req: express.Request,
  res: express.Response
) {
  const { id_class, title, description, type, max_grade, due_date } = req.body;
  const now = new Date();
  const formatted = now.toISOString().split("T")[0];

  if (!id_class || !title || !description || !type || !max_grade || !due_date) {
    return res.status(400).json("Missing fields");
  }

  if (due_date < formatted!) {
    return res.status(400).json("Date not valid");
  }

  try {
    // Verifica se já existe atividade com o mesmo título
    const [exists] = await connection.execute(
      "SELECT id FROM activities WHERE title = ?",
      [title]
    );

    if ((exists as any[]).length > 0) {
      return res.status(409).json({ message: "Activity already exists" });
    }

    // Cria nova atividade
    await connection.execute(
      `INSERT INTO activities 
        (id_class, title, description, type, max_grade, due_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_class, title, description, type, max_grade, due_date]
    );

    return res.status(200).json({ message: "Activity created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all created activities
export async function listActivities(
  req: express.Request,
  res: express.Response
) {
  try {
    let rows;

    if (req.user?.profiles.some((p: any) => p.name === "Administrador")) {
      // 🔎 Admin: todas as atividades
      [rows] = await connection.execute(
        `SELECT a.id, a.title, a.description, a.due_date, 
                c.name AS class_name, co.name AS course_name
         FROM activities a
         INNER JOIN classes c ON a.id_class = c.id
         INNER JOIN courses co ON c.id_course = co.id`
      );
    } else if (req.user?.profiles.some((p: any) => p.name === "Professor")) {
      // 🔎 Professor: atividades das turmas que ele leciona
      [rows] = await connection.execute(
        `SELECT a.id, a.title, a.description, a.due_date, 
                c.name AS class_name, co.name AS course_name
         FROM activities a
         INNER JOIN classes c ON a.id_class = c.id
         INNER JOIN courses co ON c.id_course = co.id
         WHERE c.id_teacher = ?`,
        [req.user.id]
      );
    } else if (req.user?.profiles.some((p: any) => p.name === "Aluno")) {
      // 🔎 Aluno: atividades das turmas em que está matriculado
      [rows] = await connection.execute(
        `SELECT a.id, a.title, a.description, a.due_date, 
                c.name AS class_name, co.name AS course_name
         FROM activities a
         INNER JOIN classes c ON a.id_class = c.id
         INNER JOIN courses co ON c.id_course = co.id
         INNER JOIN enrolment e ON e.id_class = c.id
         WHERE e.id_student = ? AND e.active = 1`,
        [req.user.id]
      );
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Fetches an activity by class id
export async function getActivity(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM activities WHERE id_class = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
