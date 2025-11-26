import connection from "../config/database.js";
import express from "express";

// Creates a new material
export async function createMaterial(
  req: express.Request,
  res: express.Response
) {
  const { id_class, title, description } = req.body;

  if (!id_class || !title || !description) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Verifica se a turma existe
    const [classRows] = await connection.execute(
      "SELECT id FROM classes WHERE id = ?",
      [id_class]
    );
    if ((classRows as any[]).length === 0) {
      return res.status(400).json({ message: "Class not found" });
    }

    // Verifica se já existe material com o mesmo título
    const [existsRows] = await connection.execute(
      "SELECT id FROM materials WHERE title = ? AND id_class = ?",
      [title, id_class]
    );
    if ((existsRows as any[]).length > 0) {
      return res.status(409).json({ message: "Material already exists" });
    }

    // Cria material
    await connection.execute(
      "INSERT INTO materials (id_class, title, description) VALUES (?, ?, ?)",
      [id_class, title, description]
    );

    return res.status(200).json({ message: "Material created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all created materials
export async function listMaterials(
  req: express.Request,
  res: express.Response
) {
  try {
    const [rows] = await connection.execute(
      `SELECT m.id, m.title, m.description, c.name AS class_name, co.name AS course_name
       FROM materials m
       INNER JOIN classes c ON m.id_class = c.id
       INNER JOIN courses co ON c.id_course = co.id`
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Fetch a material by id
export async function getMaterial(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      `SELECT m.id, m.title, m.description, c.name AS class_name, co.name AS course_name
       FROM materials m
       INNER JOIN classes c ON m.id_class = c.id
       INNER JOIN courses co ON c.id_course = co.id
       WHERE m.id = ?`,
      [id]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "Material not found" });
    }

    return res.status(200).json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
