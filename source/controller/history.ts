import connection from "../config/database.js";
import express from "express";

export const getUserHistory = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;

  try {
    const [rows] = await connection.execute(
      `SELECT 
    co.id AS course_id,
    co.name AS course_name,
    c.id AS class_id,
    c.name AS class_name,
    ROUND(AVG(g.grade), 2) AS final_average,
    CASE 
        WHEN AVG(g.grade) >= 5 THEN 'Aprovado'
        ELSE 'Reprovado'
    END AS status
FROM enrolment e
INNER JOIN classes c ON e.id_class = c.id
INNER JOIN courses co ON c.id_course = co.id
INNER JOIN activities a ON c.id = a.id_class
INNER JOIN grades g ON g.id_activity = a.id AND g.id_student = e.id_student
WHERE e.id_student = ?
GROUP BY co.id, co.name, c.id, c.name;`,
      [id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
