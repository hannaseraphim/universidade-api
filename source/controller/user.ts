import { Associated, UserProfiles, Users } from "../modules/index.js";
import connection from "../config/database.js";
import express from "express";
import { env } from "../config/env.js";
import bcrypt from "bcrypt";

const users = new Users(connection);
const associated = new Associated(connection);
const profiles = new UserProfiles(connection);

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
  const result = await users.getSpecificByCondition({ id: id });

  if (!result) {
    return res.status(404).json({ message: "User not found" });
  }

  const profiles = await associated.getAllAssociated(Number(id));

  return res.status(200).send({ result, profiles });
}

// Creates a user with the associated profiles
export async function createUser(req: express.Request, res: express.Response) {
  const { email, name, password, profiles } = req.body;
  const valid = users.validateUserWithProfile(req.body);

  if (!valid) {
    return res.status(400).json({ message: "Fields not valid" });
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

  const exists = await users.getSpecificByCondition({ id: id });

  if (!exists) {
    return res.status(404).json({ message: "User not found" });
  }

  const result = await users.delete(id!, "id");
  if (result) {
    return res.status(200).json({ message: "User deleted successfully" });
  } else {
    return res.status(400).json({ message: "User could not be deleted" });
  }
}

// Updates a specific user with specified criteria
export async function updateUser(req: express.Request, res: express.Response) {
  const { id } = req.params;

  try {
    // Verifica se o usuário existe
    const exists = await users.getSpecificByCondition({ id });
    if (!exists) return res.status(404).json({ message: "User not found" });

    // Obtém todos os perfis associados
    const profs = await associated.getAllAssociated(Number(id));

    const data = req.body;

    // Deleta todos os perfis antigos
    await Promise.all(
      profs.map((profile) => {
        associated.deleteByCondition({
          id_user: Number(id),
          id_profile: profile.id,
        });
      })
    );

    // // Cria os novos perfis
    if (data.profiles && Array.isArray(data.profiles)) {
      await Promise.all(
        data.profiles.map(
          (newProf: any) => {
            associated.create({ id_user: id, id_profile: newProf });
          }
        )
      );
    }

    // Atualiza a senha se fornecida
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, env.saltRounds);
      data.password = hashedPassword;
    }

    // Valida campos
    const validFields = await users.validateUserWithProfile(data);
    if (!validFields)
      return res.status(400).json({ message: "Fields not valid" });

    // Atualiza usuário
    const result = await users.update(
      Number(id),
      { name: data.name, email: data.email },
      "id"
    );
    return res
      .status(result ? 200 : 400)
      .json(
        result
          ? { message: "User updated successfully" }
          : { message: "User could not be updated" }
      );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
