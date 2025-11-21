import type { Connection, ResultSetHeader } from "mysql2/promise";
import { DefaultModule } from "./default.js";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export interface User {
  name: string;
  email: string;
  password: string;
}

// Activities table
export class Activities extends DefaultModule {
  protected table = "activities";
  protected tableFields = [
    "id_class",
    "title",
    "description",
    "type",
    "max_grade",
    "due_date",
  ];
  protected searchableFields = [...this.tableFields, "id"];

  constructor(protected connection: Connection) {
    super(connection);
  }
}

// Associated table
export class Associated extends DefaultModule {
  protected table = "associated";
  protected tableFields = ["id_user", "id_profile"];
  protected searchableFields = [...this.tableFields];

  constructor(protected connection: Connection) {
    super(connection);
  }

  // Gets all associated roles by user id
  async getAllAssociated(id: number): Promise<any[]> {
    const associatedQuery = "SELECT * FROM associated WHERE id_user = ?";
    const [associatedResult] = await this.connection.execute(associatedQuery, [
      id,
    ]);

    const associated = (associatedResult as any[]).map((a) => a.id_profile);

    const placeholders = associated.map(() => "?").join(", ");
    const rolesQuery = `SELECT * FROM user_profiles WHERE id IN (${placeholders})`;

    const [rolesResult] = await this.connection.execute(rolesQuery, associated);

    const roles = (rolesResult as any[]).map((r) => r.name);

    return roles as any[];
  }
}

// Classes table
export class Classes extends DefaultModule {
  protected table = "classes";
  protected tableFields = [
    "id_course",
    "id_teacher",
    "starts_on",
    "ends_on",
    "period",
    "name",
    "max_students",
    "archived",
  ];
  protected searchableFields = [...this.tableFields, "id"];
  protected users: Users;
  protected associated: Associated;

  constructor(protected connection: Connection) {
    super(connection);
    this.users = new Users(connection);
    this.associated = new Associated(connection);
  }

  // Verifies if the user is a teacher by id
  async isTeacher(id: number): Promise<boolean> {
    const user = await this.users.getOneByCondition({ id: id });
    if (!user) {
      return false;
    }

    const profile = await this.associated.getOneByCondition({
      id_user: id,
      id_profile: 2,
    });

    if (profile) {
      return true;
    } else {
      return false;
    }
  }

  // Gathers all active classes by teacher id
  async findActiveClassesByTeacher(id: number): Promise<any[]> {
    const query = "SELECT * FROM classes WHERE id_teacher = ? AND archived = 0";
    const [rows] = await this.connection.execute(query, [id]);
    return rows as any;
  }

  // Gathers all classes by teacher id, including archived ones
  async getAllClassesByTeacher(id: number): Promise<any[]> {
    const query = "SELECT * FROM classes WHERE id_teacher = ?";
    const [rows] = await this.connection.execute(query, [id]);
    return rows as any;
  }
}

// Courses table
export class Courses extends DefaultModule {
  protected table = "courses";
  protected tableFields = ["name", "description", "max_students"];
  protected searchableFields = [...this.tableFields, "id"];

  constructor(protected connection: Connection) {
    super(connection);
  }
}

// Enrolment table
export class Enrolment extends DefaultModule {
  protected table = "enrolment";
  protected tableFields = ["id_student", "id_class", "enrolled_at", "active"];
  protected searchableFields = [...this.tableFields];

  constructor(protected connection: Connection) {
    super(connection);
  }
}

// Grades table
export class Grades extends DefaultModule {
  protected table = "grades";
  protected tableFields = ["id_student", "id_activity", "grade"];
  protected searchableFields = [...this.tableFields];
  protected users: Users;
  protected associated: Associated;
  protected activities: Activities;

  constructor(protected connection: Connection) {
    super(connection);
    this.users = new Users(connection);
    this.associated = new Associated(connection);
    this.activities = new Activities(connection);
  }

  // Verifies if the grage isn't bigger than the activity max grade
  async validGrade(id: number, grade: number): Promise<boolean> {
    const activity = await this.activities.getOneByCondition({ id: id });
    if (!activity) return false;

    return grade <= parseInt(activity.max_grade) ? true : false;
  }

  // Lists all grades from an user
  async findGrades(id: number): Promise<any[]> {
    const query = "SELECT * FROM grades WHERE id_student = ?";
    const [rows] = await this.connection.execute(query, [id]);
    return rows as any[];
  }

  // Find a specific grade by student and activity id
  async findGrade(student: number, activity: number): Promise<any> {
    const result = this.getOneByCondition({
      id_student: student,
      id_activity: activity,
    });
    return result;
  }
}

// History table
export class History extends DefaultModule {
  protected table = "history";
  protected tableFields = ["id_student", "id_class", "final_grade", "status"];
  protected searchableFields = [...this.tableFields];

  constructor(protected connection: Connection) {
    super(connection);
  }
}

// Materials table
export class Materials extends DefaultModule {
  protected table = "materials";
  protected tableFields = ["id_class", "title", "description", "posted_at"];
  protected searchableFields = [...this.tableFields, "id"];
  constructor(protected connection: Connection) {
    super(connection);
  }
}

// Submissions table
export class Submissions extends DefaultModule {
  protected table = "submissions";
  protected tableFields = [
    "id_student",
    "id_activity",
    "submitted_at",
    "content",
  ];
  protected searchableFields = [...this.tableFields];

  constructor(protected connection: Connection) {
    super(connection);
  }
}

// Profiles table
export class UserProfiles extends DefaultModule {
  protected table = "user_profiles";
  protected tableFields = ["id", "name"];
  protected searchableFields = [...this.tableFields];
  constructor(protected connection: Connection) {
    super(connection);
  }

  // Validates if its a valid profile (1 "ADMIN", 2 "TEACHER", 3 "STUDENT")
  async isValidProfile(profiles: number[]): Promise<boolean> {
    const allowed = [1, 2, 3];
    const allValid = profiles.every((p) => allowed.includes(p));
    const noDuplicates = new Set(profiles).size === profiles.length;

    return allValid && noDuplicates;
  }
}

// Users table
export class Users extends DefaultModule {
  protected table = "users";
  protected tableFields = ["name", "email", "password"];
  protected searchableFields = [...this.tableFields, "id"];
  protected profile: UserProfiles;
  protected associated: Associated;

  constructor(protected connection: Connection) {
    super(connection);
    this.profile = new UserProfiles(connection);
    this.associated = new Associated(connection);
  }

  // Creates an user already with the wanted associations
  async createUserWithAssociation(
    data: User,
    profiles: any[]
  ): Promise<number> {
    const hashedPassword = await bcrypt.hash(data.password, env.saltRounds);

    const validUser = await this.validateFields(data);
    const validProfiles = await this.profile.isValidProfile(profiles);

    if (!validUser || !validProfiles) {
      return 400;
    }

    const exists = await this.getOneByCondition({ email: data.email });
    if (exists) {
      return 409;
    }

    try {
      const userQuery = await this.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      });

      const associatedQuery = await Promise.all(
        profiles.map((pro: number) =>
          this.associated.create({
            id_user: userQuery.insertId,
            id_profile: pro,
          })
        )
      );

      if (userQuery && associatedQuery) {
        return 200;
      } else {
        return 401;
      }
    } catch (error) {
      console.log(error);
      return 500;
    }
  }

  // Verifies if the user is a student by id
  async isStudent(id: number): Promise<boolean> {
    const user = await this.getOneByCondition({ id: id });
    if (!user) {
      return false;
    }

    const profile = await this.associated.getOneByCondition({
      id_user: id,
      id_profile: 3,
    });

    if (profile) {
      return true;
    } else {
      return false;
    }
  }

  // Validates if is a valid user (name, email, password, profiles)
  async validateUserWithProfile(data: Record<string, any>): Promise<boolean> {
    const expectedFields = [...this.tableFields, "profiles"];
    const bodyKeys = Object.keys(data);

    // Verifica se todos os campos esperados estão presentes
    const hasAllFields = expectedFields.every((field) =>
      bodyKeys.includes(field)
    );

    // Verifica se não há campos extras
    const hasOnlyExpectedFields = bodyKeys.every((key) =>
      expectedFields.includes(key)
    );

    return hasAllFields && hasOnlyExpectedFields;
  }
}
