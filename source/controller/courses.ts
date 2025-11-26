import connection from "../config/database.js";
import express from "express";

// Creates a new course
export async function createCourse(
  req: express.Request,
  res: express.Response
) {
  const { name, description, max_students } = req.body;

  if (!name || !description || !max_students) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Verifica se já existe curso com o mesmo nome
    const [existsRows] = await connection.execute(
      "SELECT id FROM courses WHERE name = ?",
      [name]
    );
    if ((existsRows as any[]).length > 0) {
      return res.status(409).json({ message: "Course already exists" });
    }

    // Cria curso
    const [result] = await connection.execute(
      "INSERT INTO courses (name, description, max_students) VALUES (?, ?, ?)",
      [name, description, max_students]
    );

    const insertResult = result as any;
    return res.status(200).json({
      message: "Course created successfully",
      id: insertResult.insertId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// List courses with classes teachers included
export async function listCourses(req: express.Request, res: express.Response) {
  try {
    const [rows] = await connection.execute(
      `SELECT 
         co.id AS course_id,
         co.name AS course_name,
         co.description,
         co.max_students,
         c.id AS class_id,
         c.name AS class_name,
         c.starts_on,
         c.ends_on,
         c.period,
         c.max_students AS class_max_students,
         c.archived,
         u.id AS teacher_id,
         u.name AS teacher_name,
         u.email AS teacher_email
       FROM courses co
       LEFT JOIN classes c ON co.id = c.id_course
       LEFT JOIN users u ON c.id_teacher = u.id`
    );

    const coursesMap: Record<number, any> = {};
    (rows as any[]).forEach((r) => {
      if (!coursesMap[r.course_id]) {
        coursesMap[r.course_id] = {
          id: r.course_id,
          name: r.course_name,
          description: r.description,
          max_students: r.max_students,
          classes: [],
        };
      }
      if (r.class_id) {
        coursesMap[r.course_id].classes.push({
          id: r.class_id,
          name: r.class_name,
          starts_on: r.starts_on,
          ends_on: r.ends_on,
          period: r.period,
          max_students: r.class_max_students,
          archived: r.archived,
          teacher: r.teacher_id
            ? {
                id: r.teacher_id,
                name: r.teacher_name,
                email: r.teacher_email,
              }
            : null,
        });
      }
    });

    return res.status(200).json(Object.values(coursesMap));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Updates a course by id
export async function updateCourse(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;
  const { name, description, max_students } = req.body;

  if (!name || !description || !max_students) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const [rows] = await connection.execute(
      "SELECT id FROM courses WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const [result] = await connection.execute(
      "UPDATE courses SET name = ?, description = ?, max_students = ? WHERE id = ?",
      [name, description, max_students, id]
    );

    const updateResult = result as any;
    return res
      .status(updateResult.affectedRows > 0 ? 200 : 400)
      .json(
        updateResult.affectedRows > 0
          ? { message: "Course updated successfully" }
          : { message: "Course could not be updated" }
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Deletes a course by id
export async function deleteCourse(
  req: express.Request,
  res: express.Response
) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      "SELECT id FROM courses WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const [result] = await connection.execute(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );
    const deleteResult = result as any;

    return res
      .status(deleteResult.affectedRows > 0 ? 200 : 400)
      .json(
        deleteResult.affectedRows > 0
          ? { message: "Course deleted successfully" }
          : { message: "Course could not be deleted" }
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Fetch a course by id with its classes
export async function getCourse(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      `SELECT 
         co.id AS course_id,
         co.name AS course_name,
         co.description,
         co.max_students,
         c.id AS class_id,
         c.name AS class_name,
         c.starts_on,
         c.ends_on,
         c.period,
         c.max_students AS class_max_students,
         c.archived,
         u.id AS teacher_id,
         u.name AS teacher_name,
         u.email AS teacher_email
       FROM courses co
       LEFT JOIN classes c ON co.id = c.id_course
       LEFT JOIN users u ON c.id_teacher = u.id
       WHERE co.id = ?`,
      [id]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course = {
      id: (rows as any[])[0].course_id,
      name: (rows as any[])[0].course_name,
      description: (rows as any[])[0].description,
      max_students: (rows as any[])[0].max_students,
      classes: (rows as any[])
        .filter((r) => r.class_id)
        .map((r) => ({
          id: r.class_id,
          name: r.class_name,
          starts_on: r.starts_on,
          ends_on: r.ends_on,
          period: r.period,
          max_students: r.class_max_students,
          archived: r.archived,
          teacher: r.teacher_id
            ? {
                id: r.teacher_id,
                name: r.teacher_name,
                email: r.teacher_email,
              }
            : null,
        })),
    };

    return res.status(200).json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
