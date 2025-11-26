import connection from "../config/database.js";
import express from "express";

// Creates a new class
export async function createClass(req: express.Request, res: express.Response) {
  const {
    id_course,
    id_teacher,
    starts_on,
    ends_on,
    period,
    name,
    max_students,
    archived,
  } = req.body;

  if (
    id_course === undefined ||
    id_teacher === undefined ||
    starts_on === undefined ||
    ends_on === undefined ||
    period === undefined ||
    name === undefined ||
    max_students === undefined ||
    archived === undefined
  ) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Verifica se o curso existe
    const [courseRows] = await connection.execute(
      "SELECT id FROM courses WHERE id = ?",
      [id_course]
    );
    if ((courseRows as any[]).length === 0) {
      return res.status(400).json({ message: "Course not found" });
    }

    // Verifica se o professor existe
    const [teacherRows] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [id_teacher]
    );
    if ((teacherRows as any[]).length === 0) {
      return res.status(400).json({ message: "No teachers found" });
    }

    // Verifica se já existe turma com esse curso/professor
    const [classRows] = await connection.execute(
      "SELECT id FROM classes WHERE id_course = ? AND id_teacher = ?",
      [id_course, id_teacher]
    );
    if ((classRows as any[]).length > 0) {
      return res.status(409).json({ message: "Class already exists" });
    }

    // Cria a turma
    await connection.execute(
      `INSERT INTO classes 
        (id_course, id_teacher, starts_on, ends_on, period, name, max_students, archived) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_course,
        id_teacher,
        starts_on,
        ends_on,
        period,
        name,
        max_students,
        archived,
      ]
    );

    return res.status(200).json({ message: "Class created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Lists all created classes with enrolled students
export async function listClasses(req: express.Request, res: express.Response) {
  try {
    const [rows] = await connection.execute(
      `SELECT 
         c.id AS class_id,
         c.name AS class_name,
         c.starts_on,
         c.ends_on,
         c.period,
         c.max_students,
         c.archived,
         co.id AS course_id,
         co.name AS course_name,
         u.id AS teacher_id,
         u.name AS teacher_name,
         u.email AS teacher_email,
         s.id AS student_id,
         s.name AS student_name,
         s.email AS student_email,
         AVG(g.grade) AS average_grade
       FROM classes c
       INNER JOIN courses co ON c.id_course = co.id
       INNER JOIN users u ON c.id_teacher = u.id
       LEFT JOIN enrolment e ON c.id = e.id_class AND e.active = 1
       LEFT JOIN users s ON e.id_student = s.id
       LEFT JOIN grades g ON g.id_student = s.id
       LEFT JOIN activities a ON g.id_activity = a.id AND a.id_class = c.id
       GROUP BY c.id, co.id, u.id, s.id`
    );

    // Agrupar por turma
    const classesMap: Record<number, any> = {};
    (rows as any[]).forEach((r) => {
      if (!classesMap[r.class_id]) {
        classesMap[r.class_id] = {
          id: r.class_id,
          name: r.class_name,
          starts_on: r.starts_on,
          ends_on: r.ends_on,
          period: r.period,
          max_students: r.max_students,
          archived: r.archived,
          course: { id: r.course_id, name: r.course_name },
          teacher: {
            id: r.teacher_id,
            name: r.teacher_name,
            email: r.teacher_email,
          },
          students: [],
        };
      }
      if (r.student_id) {
        classesMap[r.class_id].students.push({
          id: r.student_id,
          name: r.student_name,
          email: r.student_email,
          average_grade: r.average_grade
            ? Number(r.average_grade).toFixed(2)
            : null,
          status:
            r.average_grade !== null
              ? r.average_grade >= 5
                ? "Aprovado"
                : "Reprovado"
              : "Sem notas",
        });
      }
    });

    // Adicionar quantidade de alunos
    const result = Object.values(classesMap).map((cls) => ({
      ...cls,
      student_count: cls.students.length,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Updates a class by id
export async function updateClass(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const {
    id_course,
    id_teacher,
    starts_on,
    ends_on,
    period,
    name,
    max_students,
    archived,
  } = req.body;

  try {
    // Verifica se a turma existe
    const [rows] = await connection.execute(
      "SELECT id FROM classes WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      return res.sendStatus(404);
    }

    // Verifica se o curso existe
    const [courseRows] = await connection.execute(
      "SELECT id FROM courses WHERE id = ?",
      [id_course]
    );
    if ((courseRows as any[]).length === 0) {
      return res.sendStatus(400);
    }

    // Verifica se o professor existe
    const [teacherRows] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [id_teacher]
    );
    if ((teacherRows as any[]).length === 0) {
      return res.sendStatus(400);
    }

    // Verifica se já existe turma com esse curso/professor
    const [classRows] = await connection.execute(
      "SELECT id FROM classes WHERE id_course = ? AND id_teacher = ? AND id <> ?",
      [id_course, id_teacher, id]
    );
    if ((classRows as any[]).length > 0) {
      return res.sendStatus(409);
    }

    // Atualiza turma
    await connection.execute(
      `UPDATE classes 
       SET id_course=?, id_teacher=?, starts_on=?, ends_on=?, period=?, name=?, max_students=?, archived=? 
       WHERE id=?`,
      [
        id_course,
        id_teacher,
        starts_on,
        ends_on,
        period,
        name,
        max_students,
        archived,
        id,
      ]
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
}

// Deletes a class by id
export async function deleteClass(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      "SELECT id FROM classes WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }

    const [result] = await connection.execute(
      "DELETE FROM classes WHERE id = ?",
      [id]
    );
    const deleteResult = result as any;

    return res
      .status(deleteResult.affectedRows > 0 ? 200 : 400)
      .json(
        deleteResult.affectedRows > 0
          ? { message: "Class deleted successfully" }
          : { message: "Class could not be deleted" }
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Fetches a class by id with enrolled students
export async function getClass(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      `SELECT 
         c.id AS class_id,
         c.name AS class_name,
         c.starts_on,
         c.ends_on,
         c.period,
         c.max_students,
         c.archived,
         co.id AS course_id,
         co.name AS course_name,
         u.id AS teacher_id,
         u.name AS teacher_name,
         u.email AS teacher_email,
         s.id AS student_id,
         s.name AS student_name,
         s.email AS student_email,
         AVG(g.grade) AS average_grade
       FROM classes c
       INNER JOIN courses co ON c.id_course = co.id
       INNER JOIN users u ON c.id_teacher = u.id
       LEFT JOIN enrolment e ON c.id = e.id_class AND e.active = 1
       LEFT JOIN users s ON e.id_student = s.id
       LEFT JOIN grades g ON g.id_student = s.id
       LEFT JOIN activities a ON g.id_activity = a.id AND a.id_class = c.id
       WHERE c.id = ?
       GROUP BY c.id, co.id, u.id, s.id`,
      [id]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }

    const base = (rows as any[])[0];
    const classObj = {
      id: base.class_id,
      name: base.class_name,
      starts_on: base.starts_on,
      ends_on: base.ends_on,
      period: base.period,
      max_students: base.max_students,
      archived: base.archived,
      course: { id: base.course_id, name: base.course_name },
      teacher: {
        id: base.teacher_id,
        name: base.teacher_name,
        email: base.teacher_email,
      },
      students: (rows as any[])
        .filter((r) => r.student_id)
        .map((r) => ({
          id: r.student_id,
          name: r.student_name,
          email: r.student_email,
          average_grade: r.average_grade
            ? Number(r.average_grade).toFixed(2)
            : null,
          status:
            r.average_grade !== null
              ? r.average_grade >= 5
                ? "Aprovado"
                : "Reprovado"
              : "Sem notas",
        })),
    };

    return res.status(200).json({
      ...classObj,
      student_count: classObj.students.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
