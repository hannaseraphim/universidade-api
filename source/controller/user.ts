import { Users } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";
import { env } from "../config/env.js";
import bcrypt from "bcrypt";
import { Associated } from "../modules/index.js";

const users = new Users(connection);
const associated = new Associated(connection);
// List all users from the table
export async function listUsers(req: express.Request, res: express.Response) {
  try {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        GROUP_CONCAT(p.name) AS profiles
      FROM users u
      INNER JOIN associated a ON u.id = a.id_user
      INNER JOIN user_profiles p ON a.id_profile = p.id
      GROUP BY u.id, u.name, u.email
    `;
    const [rows]: any[] = await connection.execute(query);

    // transformar a string "ADMIN,TEACHER" em array
    return res.status(200).json(
      rows.map((row: any) => ({
        ...row,
        profiles: row.profiles.split(","),
      }))
    );
  } catch (error) {
    console.error("Error finding table items: ", error);
    return [];
  }
}

// Gets a user from the table by id
export async function getUser(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const result = await users.findOne({ id: id });

  if (!result) {
    return res.sendStatus(404);
  }

  const profiles = await associated.findAllAssociated(Number(id));

  return res.status(200).send({ result, profiles });
}

// Creates a user with the associated profiles
export async function createUser(req: express.Request, res: express.Response) {
  const { email, name, password, profiles } = req.body;
  const valid = users.validateUserWithProfile(req.body);

  if (!valid) {
    return res.sendStatus(400);
  }

  const rows = await users.createUserWithAssociation(
    {
      email,
      name,
      password,
    },
    profiles
  );

  return res.sendStatus(rows);
}

// Delete a user by its id (associated also deleted via MySQL "ON DELETE CASCADE")
export async function deleteUser(req: express.Request, res: express.Response) {
  const { id } = req.params;

  const exists = await users.findOne({ id: id });

  if (!exists) {
    return res.sendStatus(404);
  }

  const result = await users.deleteItem(id!, "id");
  if (result) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(400);
  }
}

// Updates a specific user with specified criteria
export async function updateUser(req: express.Request, res: express.Response) {
  const { id } = req.params;

  const exists = await users.findOne({ id });
  if (!exists) {
    return res.sendStatus(404);
  }

  let data = req.body;

  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, env.saltRounds);
    data.password = hashedPassword;
  }

  const validFields = await users.validateFields(data);
  if (!validFields) {
    return res.sendStatus(400);
  }

  const result = await users.updateItem(id!, data, "id");
  return res.sendStatus(result ? 200 : 400);
}
