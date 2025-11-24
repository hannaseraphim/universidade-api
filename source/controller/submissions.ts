import {
  Submissions,
  Activities,
  Classes,
  Grades,
  Enrolment,
} from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";

const submissions = new Submissions(connection);
const activities = new Activities(connection);
const classes = new Classes(connection);
const enrolment = new Enrolment(connection);
const grades = new Grades(connection);

export const createSubmission = async (
  req: express.Request,
  res: express.Response
) => {
  const { id_class, id_student, id_activity, content } = req.body;
  if (!id_class || !id_student || !id_activity || !content)
    return res.status(400).json({ message: "Missing fields" });

  const userClass = await classes.getOneByCondition({ id: id_class });
  if (!userClass) return res.status(400).json({ message: "Class not found" });

  const userEnrolment = await enrolment.getOneByCondition({
    id_class: id_class,
    id_student: id_student,
    active: 1,
  });
  if (!userEnrolment)
    return res.status(400).json({ message: "Enrolment not found" });

  const exists = await submissions.getOneByCondition({
    id_activity: id_activity,
    id_student: id_student,
  });
  if (exists)
    return res.status(409).json({ message: "Submission already exists" });

  const activity = await activities.getOneByCondition({
    id: id_activity,
    id_class: id_class,
  });
  if (!activity) return res.status(400).json({ message: "Activity not found" });

  const hasGrade = await grades.getOneByCondition({
    id_student: id_student,
    id_activity: id_activity,
  });
  if (hasGrade)
    return res.status(400).json({ message: "Grade already published" });

  try {
    const row = submissions.create({ id_student, id_activity, content });
    return res.status(200).json({ message: "Submission sent successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listSubmissionsByTeacher = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const user = req.user;

    const teacherClasses = await classes.getSpecificByCondition({
      id_teacher: user!.id,
    });

    if (!teacherClasses || teacherClasses.length === 0) {
      return res.status(200).json({
        classes: [],
        activities: [],
        submissions: [],
      });
    }

    const activitiesByClassPromises = teacherClasses.map((cls: any) =>
      activities.getSpecificByCondition({ id_class: cls.id })
    );

    const activitiesArrays = await Promise.all(activitiesByClassPromises);
    const postedActivities = activitiesArrays.flat();

    const submissionByClassPromises = postedActivities.map((actv: any) =>
      submissions.getSpecificByCondition({ id_activity: actv.id })
    );

    const submissionsArrays = await Promise.all(submissionByClassPromises);
    const postedSubmissions = submissionsArrays.flat();

    return res.status(200).json(postedSubmissions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
