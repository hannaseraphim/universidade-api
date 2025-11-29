import connection from "../config/database.js";
import express from "express";
import { env } from "../config/env.js";
import bcrypt from "bcrypt";

// List all users from the table
export async function listUsers(req: express.Request, res: express.Response) {
  try {
    const query = `
          SELECT 
      u.id AS user_id,
      u.name AS user_name,
      u.email,
      GROUP_CONCAT(DISTINCT CONCAT(p.id, ':', p.name)) AS profiles,
      GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.name)) AS enrolments
    FROM users u
    INNER JOIN associated a ON u.id = a.id_user
    INNER JOIN user_profiles p ON a.id_profile = p.id
    LEFT JOIN enrolment e ON e.id_student = u.id
    LEFT JOIN classes c ON e.id_class = c.id
    GROUP BY u.id, u.name, u.email;
    `;
    const [rows] = await connection.execute(query);

    const result = (rows as any[]).map((row) => ({
      id: row.user_id,
      name: row.user_name,
      email: row.email,
      profiles: row.profiles
        ? row.profiles.split(",").map((p: string) => {
            const [id, name] = p.split(":");
            return { id: Number(id), name };
          })
        : [],
      enrolments: row.enrolments
        ? row.enrolments.split(",").map((p: string) => {
            const [id, name] = p.split(":");
            return { id_class: Number(id), class_name: name };
          })
        : [],
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error finding users: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get a user by id (with classes, grades, history)
export async function getUser(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      `SELECT 
         u.id AS user_id,
         u.name AS user_name,
         u.email,
         GROUP_CONCAT(DISTINCT CONCAT(p.id, ':', p.name)) AS profiles,
         c.id AS class_id,
         c.name AS class_name,
         co.name AS course_name,
         g.id_activity,
         a.title AS activity_title,
         g.grade,
         h.final_grade,
         h.status
       FROM users u
       INNER JOIN associated a1 ON u.id = a1.id_user
       INNER JOIN user_profiles p ON a1.id_profile = p.id
       LEFT JOIN enrolment e ON u.id = e.id_student
       LEFT JOIN classes c ON e.id_class = c.id
       LEFT JOIN courses co ON c.id_course = co.id
       LEFT JOIN grades g ON u.id = g.id_student
       LEFT JOIN activities a ON g.id_activity = a.id
       LEFT JOIN history h ON u.id = h.id_student
       WHERE u.id = ?
       GROUP BY 
         u.id, u.name, u.email, c.id, c.name, co.name,
         g.id_activity, a.title, g.grade, h.final_grade, h.status`,
      [id]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const base = (rows as any[])[0];
    const user = {
      id: base.user_id,
      name: base.user_name,
      email: base.email,
      profiles: base.profiles
        ? base.profiles.split(",").map((p: string) => {
            const [id, name] = p.split(":");
            return { id: Number(id), name };
          })
        : [],
      classes: (rows as any[])
        .filter((r) => r.class_id)
        .map((r) => ({
          id: r.class_id,
          name: r.class_name,
          course_name: r.course_name,
        })),
      grades: (rows as any[])
        .filter((r) => r.id_activity)
        .map((r) => ({
          activity_id: r.id_activity,
          activity_title: r.activity_title,
          grade: r.grade,
        })),
      history: (rows as any[])
        .filter((r) => r.final_grade !== null)
        .map((r) => ({
          final_grade: r.final_grade,
          status: r.status,
        })),
    };

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Create a user with associated profiles
export async function createUser(req: express.Request, res: express.Response) {
  const { email, name, password, profiles } = req.body;

  if (!email || !name || !password || !profiles || !Array.isArray(profiles)) {
    return res.status(400).json({ message: "Fields not valid" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, env.saltRounds);

    const row = await connection.execute(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    const exists = row as any;

    if (exists[0].length > 0)
      return res.status(409).json({ message: "User already exists" });

    const [result] = await connection.execute(
      "INSERT INTO users (email, name, password) VALUES (?, ?, ?)",
      [email, name, hashedPassword]
    );

    const insertResult = result as any;
    const userId = insertResult.insertId;

    await Promise.all(
      profiles.map((profileId: number) =>
        connection.execute(
          "INSERT INTO associated (id_user, id_profile) VALUES (?, ?)",
          [userId, profileId]
        )
      )
    );

    return res.status(200).json({
      message: "User created successfully",
      id: userId,
      profiles: profiles.map((id: number) => ({ id })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Delete a user by its id (associated also deleted via MySQL "ON DELETE CASCADE")
export async function deleteUser(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [result] = await connection.execute(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    const deleteResult = result as any;

    return res
      .status(deleteResult.affectedRows > 0 ? 200 : 400)
      .json(
        deleteResult.affectedRows > 0
          ? { message: "User deleted successfully" }
          : { message: "User could not be deleted" }
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUser(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const data = req.body;

  try {
    const [rows] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, env.saltRounds);
      data.password = hashedPassword;

      await connection.execute(
        "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
        [data.name, data.email, hashedPassword, id]
      );
    }

    await connection.execute(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [data.name, data.email, id]
    );

    if (data.profiles && Array.isArray(data.profiles)) {
      await connection.execute("DELETE FROM associated WHERE id_user = ?", [
        id,
      ]);

      await Promise.all(
        data.profiles.map((profileId: number) =>
          connection.execute(
            "INSERT INTO associated (id_user, id_profile) VALUES (?, ?)",
            [id, profileId]
          )
        )
      );
    }

    return res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
