import connection from "../config/database.js";
import express from "express";

// Creates a new grade
export async function createGrade(req: express.Request, res: express.Response) {
  const { id_student, id_activity, grade } = req.body;

  if (!id_student || !id_activity || grade === undefined) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // 1. Verifica se existe submissão do aluno para a atividade
    const [submissionRows] = await connection.execute(
      "SELECT * FROM submissions WHERE id_student = ? AND id_activity = ?",
      [id_student, id_activity]
    );
    if ((submissionRows as any[]).length === 0) {
      return res.status(400).json({ message: "Submission not found" });
    }

    // 2. Verifica se a nota é válida (<= max_grade da atividade)
    const [activityRows] = await connection.execute(
      "SELECT max_grade FROM activities WHERE id = ?",
      [id_activity]
    );
    if ((activityRows as any[]).length === 0) {
      return res.status(400).json({ message: "Activity not found" });
    }
    const maxGrade = (activityRows as any[])[0].max_grade;
    if (grade < 0 || grade > maxGrade) {
      return res.status(400).json({ message: "Grade not valid" });
    }

    // 3. Cria a nota
    await connection.execute(
      "INSERT INTO grades (id_student, id_activity, grade) VALUES (?, ?, ?)",
      [id_student, id_activity, grade]
    );

    // 4. Remove submissão após atribuir nota
    await connection.execute(
      "DELETE FROM submissions WHERE id_student = ? AND id_activity = ?",
      [id_student, id_activity]
    );

    return res.status(200).json({ message: "Grade created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all created grades
export async function listGrades(req: express.Request, res: express.Response) {
  try {
    const [rows] = await connection.execute(
      `SELECT g.id_student, u.name AS student_name, g.id_activity, a.title AS activity_title, g.grade
       FROM grades g
       INNER JOIN users u ON g.id_student = u.id
       INNER JOIN activities a ON g.id_activity = a.id`
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Updates a grade by id
export async function updateGrade(req: express.Request, res: express.Response) {
  const { id } = req.params; // id_student
  const { grade, id_activity } = req.body;

  if (!id_activity || grade === undefined) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // 1. Verifica se atividade existe
    const [activityRows] = await connection.execute(
      "SELECT max_grade FROM activities WHERE id = ?",
      [id_activity]
    );
    if ((activityRows as any[]).length === 0) {
      return res.status(400).json({ message: "Activity not found" });
    }
    const maxGrade = (activityRows as any[])[0].max_grade;
    if (grade < 0 || grade > maxGrade) {
      return res.status(400).json({ message: "Grade not valid" });
    }

    // 2. Verifica se aluno existe
    const [studentRows] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );
    if ((studentRows as any[]).length === 0) {
      return res.status(400).json({ message: "Student not found" });
    }

    // 3. Verifica se nota existe
    const [gradeRows] = await connection.execute(
      "SELECT * FROM grades WHERE id_student = ? AND id_activity = ?",
      [id, id_activity]
    );
    if ((gradeRows as any[]).length === 0) {
      return res.status(404).json({ message: "Grade not found" });
    }

    // 4. Atualiza nota
    const [result] = await connection.execute(
      "UPDATE grades SET grade = ? WHERE id_student = ? AND id_activity = ?",
      [grade, id, id_activity]
    );

    const updateResult = result as any;
    return res
      .status(updateResult.affectedRows > 0 ? 200 : 400)
      .json(
        updateResult.affectedRows > 0
          ? { message: "Grade updated successfully" }
          : { message: "Grade could not be updated" }
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Fetch grade by student id
export async function getGrade(req: express.Request, res: express.Response) {
  const { id } = req.params; // id_student

  try {
    if (req.body && typeof req.body === "object" && "id_activity" in req.body) {
      const { id_activity } = req.body;

      const [rows] = await connection.execute(
        `SELECT g.id_student, u.name AS student_name, g.id_activity, a.title AS activity_title, g.grade
         FROM grades g
         INNER JOIN users u ON g.id_student = u.id
         INNER JOIN activities a ON g.id_activity = a.id
         WHERE g.id_student = ? AND g.id_activity = ?`,
        [id, id_activity]
      );

      if ((rows as any[]).length === 0) {
        return res.status(404).json({ message: "Grade not found" });
      }

      return res.status(200).json((rows as any[])[0]);
    }

    // Sem id_activity → retornar todas as notas do aluno
    const [rows] = await connection.execute(
      `SELECT g.id_student, u.name AS student_name, g.id_activity, a.title AS activity_title, g.grade
       FROM grades g
       INNER JOIN users u ON g.id_student = u.id
       INNER JOIN activities a ON g.id_activity = a.id
       WHERE g.id_student = ?`,
      [id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
