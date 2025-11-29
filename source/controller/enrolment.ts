import connection from "../config/database.js";
import express from "express";
import { io } from "../index.js";

// Creates a new enrolment
export async function createEnrolment(
  req: express.Request,
  res: express.Response
) {
  const { id_student, id_class, enrolled_at, active } = req.body;

  if (!id_student || !id_class || !enrolled_at || active === undefined) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // 1. Verifica se o usuário é aluno
    const [studentRows] = await connection.execute(
      `SELECT u.id 
       FROM users u
       INNER JOIN associated a ON u.id = a.id_user
       INNER JOIN user_profiles p ON a.id_profile = p.id
       WHERE u.id = ? AND p.name = 'Aluno'`,
      [id_student]
    );
    if ((studentRows as any[]).length === 0) {
      return res.status(400).json({ message: "Student not found" });
    }

    // 2. Verifica se a turma existe
    const [classRows] = await connection.execute(
      "SELECT * FROM classes WHERE id = ?",
      [id_class]
    );
    if ((classRows as any[]).length === 0) {
      return res.status(400).json({ message: "Class not found" });
    }
    const classData = (classRows as any[])[0];

    // 3. Verifica se o aluno não é o professor da turma
    if (classData.id_teacher === id_student) {
      return res.status(400).json({ message: "Cannot enrol on own class" });
    }

    // 4. Verifica quantidade de alunos já matriculados
    const [countRows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM enrolment WHERE id_class = ? AND active = 1",
      [id_class]
    );
    const total = (countRows as any[])[0].total;
    if (total >= (classData.max_students ?? classData.max_students)) {
      const roomName = `teacher-${classData.id_teacher}`;
      io.to(roomName).emit("class:full", {
        id_class: classData.id,
        teacherId: classData.id_teacher,
        id_student,
        message:
          "A matrícula de um aluno foi recusada por falta de vagas. Avalie aumentar o limite da turma.",
        timestamp: new Date().toISOString(),
      });
      return res
        .status(400)
        .json({ message: "Max students reached. Teacher notified" });
    }

    // 5. Verifica se já existe matrícula ativa ou aprovada
    const [existsRows] = await connection.execute(
      `SELECT * 
   FROM enrolment 
   WHERE id_student = ? 
     AND id_class = ? 
     AND status != 'failed'`,
      [id_student, id_class]
    );

    if ((existsRows as any[]).length > 0) {
      return res
        .status(409)
        .json({ message: "Enrolment already exists and not failed" });
    }
 
    // 🔎 5.1 Verifica se o aluno já foi reprovado nesse curso
    const [priorityRows] = await connection.execute(
      `SELECT e.id_student
       FROM enrolment e
       INNER JOIN classes c ON e.id_class = c.id
       WHERE e.id_student = ? 
         AND c.id_course = (SELECT id_course FROM classes WHERE id = ?)
         AND e.status = 'failed'`,
      [id_student, id_class]
    );
    const priority = (priorityRows as any[]).length > 0;

    // 🔁 5.2 Deleta a matrícula
    if (priority) {
      const [deleteRows] = await connection.execute(
        "DELETE FROM enrolment WHERE id_student = ? AND id_class = ? AND status = 'failed'",
        [id_student, id_class]
      );
    }

    // 6. Cria matrícula
    await connection.execute(
      `INSERT INTO enrolment (id_student, id_class, enrolled_at, active) 
       VALUES (?, ?, ?, ?)`,
      [id_student, id_class, enrolled_at, active]
    );

    // Retorna prioridade
    return res.status(200).json({
      message: "Enrolment created successfully",
      priority: priority,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all enrolments by class id (with student info)
export async function listEnrolmentsByClassId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      `SELECT 
         e.id_student,
         e.id_class,
         e.enrolled_at,
         e.active,
         u.name AS student_name,
         u.email AS student_email
       FROM enrolment e
       INNER JOIN users u ON e.id_student = u.id
       WHERE e.id_class = ? AND e.active = 1`,
      [id]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "No enrolments found" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all enrolments by student id (with class info)
export async function listEnrolmentsByStudentId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      `SELECT 
         e.id_student,
         e.id_class,
         e.enrolled_at,
         e.active,
         c.name AS class_name,
         c.starts_on,
         c.ends_on,
         c.period,
         co.name AS course_name
       FROM enrolment e
       INNER JOIN classes c ON e.id_class = c.id
       INNER JOIN courses co ON c.id_course = co.id
       WHERE e.id_student = ?`,
      [id]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "No enrolments found" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Updates enrolment by student id and class id
export async function updateEnrolmentByStudentAndClassId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params; // id_student
  const { id_class, active, status } = req.body;

  if (!id_class || active === undefined || status === undefined) {
    return res.sendStatus(400);
  }

  try {
    // Verifica se existe matrícula
    const [rows] = await connection.execute(
      "SELECT * FROM enrolment WHERE id_student = ? AND id_class = ?",
      [id, id_class]
    );
    if ((rows as any[]).length === 0) {
      return res.sendStatus(404);
    }

    // Atualiza matrícula
    const [result] = await connection.execute(
      "UPDATE enrolment SET active = ? WHERE id_student = ? AND id_class = ? AND status = ?",
      [active, id, id_class, status]
    );

    const updateResult = result as any;
    return res
      .status(updateResult.affectedRows > 0 ? 200 : 400)
      .json(
        updateResult.affectedRows > 0
          ? { message: "Enrolment updated successfully" }
          : { message: "Enrolment could not be updated" }
      );
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
}

// Delete an enrolment by student and class id
export async function deleteEnrolmentByStudentAndClassId(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params; // id_student
  const { id_class } = req.body;

  if (!id_class) {
    return res.sendStatus(400);
  }

  try {
    // Verifica se existe matrícula
    const [rows] = await connection.execute(
      "SELECT * FROM enrolment WHERE id_student = ? AND id_class = ?",
      [id, id_class]
    );
    if ((rows as any[]).length === 0) {
      return res.sendStatus(404);
    }

    // Deleta matrícula
    const [result] = await connection.execute(
      "DELETE FROM enrolment WHERE id_student = ? AND id_class = ?",
      [id, id_class]
    );

    const deleteResult = result as any;
    return res
      .status(deleteResult.affectedRows > 0 ? 200 : 400)
      .json(
        deleteResult.affectedRows > 0
          ? { message: "Enrolment deleted successfully" }
          : { message: "Enrolment could not be deleted" }
      );
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
}
