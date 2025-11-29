import connection from "../config/database.js";
import express from "express";

// Creates a new submission
export const createSubmission = async (
  req: express.Request,
  res: express.Response
) => {
  const { id_class, id_student, id_activity, content } = req.body;
  if (!id_class || !id_student || !id_activity || !content) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // 1. Verifica se a turma existe
    const [classRows] = await connection.execute(
      "SELECT * FROM classes WHERE id = ?",
      [id_class]
    );
    if ((classRows as any[]).length === 0) {
      return res.status(400).json({ message: "Class not found" });
    }

    // 2. Verifica se o aluno está matriculado e ativo
    const [enrolmentRows] = await connection.execute(
      "SELECT * FROM enrolment WHERE id_class = ? AND id_student = ? AND active = 1",
      [id_class, id_student]
    );
    if ((enrolmentRows as any[]).length === 0) {
      return res.status(400).json({ message: "Enrolment not found" });
    }

    // 3. Verifica se já existe submissão
    const [submissionRows] = await connection.execute(
      "SELECT * FROM submissions WHERE id_activity = ? AND id_student = ?",
      [id_activity, id_student]
    );
    if ((submissionRows as any[]).length > 0) {
      return res.status(409).json({ message: "Submission already exists" });
    }

    // 4. Verifica se a atividade existe e pertence à turma
    const [activityRows] = await connection.execute(
      "SELECT * FROM activities WHERE id = ? AND id_class = ?",
      [id_activity, id_class]
    );
    if ((activityRows as any[]).length === 0) {
      return res.status(400).json({ message: "Activity not found" });
    }

    const activity = (activityRows as any[])[0];

    // 🔎 4.1 Verifica prazo da atividade
    if (activity.due_date) {
      const deadline = new Date(activity.due_date);
      const now = new Date();
      if (now > deadline) {
        return res
          .status(400)
          .json({ message: "Due date expired for this activity" });
      }
    }

    // 5. Verifica se já existe nota publicada
    const [gradeRows] = await connection.execute(
      "SELECT * FROM grades WHERE id_student = ? AND id_activity = ?",
      [id_student, id_activity]
    );
    if ((gradeRows as any[]).length > 0) {
      return res.status(400).json({ message: "Grade already published" });
    }

    // 6. Cria submissão
    await connection.execute(
      "INSERT INTO submissions (id_student, id_activity, content) VALUES (?, ?, ?)",
      [id_student, id_activity, content]
    );

    return res.status(200).json({ message: "Submission sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Lists submissions by teacher (all submissions from teacher's classes)
export const listSubmissionsByTeacher = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const user = req.user;

    // 1. Busca todas as turmas do professor
    const [teacherClasses] = await connection.execute(
      "SELECT id FROM classes WHERE id_teacher = ?",
      [user!.id]
    );
    if ((teacherClasses as any[]).length === 0) {
      return res.status(200).json({
        classes: [],
        activities: [],
        submissions: [],
      });
    }

    const classIds = (teacherClasses as any[]).map((c) => c.id);

    // 2. Busca todas as atividades dessas turmas
    const [activitiesRows] = await connection.execute(
      `SELECT * FROM activities WHERE id_class IN (${classIds.join(",")})`
    );
    const activityIds = (activitiesRows as any[]).map((a) => a.id);

    if (activityIds.length === 0) {
      return res.status(200).json([]);
    }

    // 3. Busca todas as submissões dessas atividades
    const [submissionsRows] = await connection.execute(
      `SELECT s.id, s.id_student, u.name AS student_name, s.id_activity, a.title AS activity_title, s.content
       FROM submissions s
       INNER JOIN users u ON s.id_student = u.id
       INNER JOIN activities a ON s.id_activity = a.id
       WHERE s.id_activity IN (${activityIds.join(",")})`
    );

    return res.status(200).json(submissionsRows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
