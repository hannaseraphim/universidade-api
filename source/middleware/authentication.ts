import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import connection from "../config/database.js";
import { env } from "../config/env.js";

export const authenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionToken = req.cookies["SESSION_TOKEN"];
  if (!sessionToken) {
    return res.status(401).json({ message: "Missing session token" });
  }

  try {
    const decoded = jwt.verify(sessionToken, env.jwtSecret) as {
      id: number;
      email: string;
      profiles: { id: number; name: string }[];
    };

    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

type Profile = {
  id: number;
  name: string;
};

export const restricted = (...allowedProfiles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = req.user as
      | (JwtPayload & {
          id: number;
          email?: string;
          profiles: Profile[];
        })
      | undefined;

    if (!payload) {
      return res.status(401).json({ message: "Missing session token" });
    }

    const profs = payload.profiles.map((p) => p.name);
    const hasAccess = profs.some((prof) => allowedProfiles.includes(prof));

    if (!hasAccess) {
      return res.status(403).json({ message: "Missing permissions" });
    }

    next();
  };
};

export const login = async (req: Request, res: Response) => {
  const isSigned = req.cookies["SESSION_TOKEN"];
  if (isSigned) {
    return res.status(409).json({ message: "Already logged in" });
  }

  const { email, password } = req.body;

  try {
    // 1. Busca usuário pelo email
    const [userRows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if ((userRows as any[]).length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = (userRows as any[])[0];

    // 2. Valida senha
    const validatePassword = bcrypt.compareSync(password, user.password);
    if (!validatePassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 3. Busca perfis associados
    const [profileRows] = await connection.execute(
      `SELECT p.id, p.name 
       FROM associated a
       INNER JOIN user_profiles p ON a.id_profile = p.id
       WHERE a.id_user = ?`,
      [user.id]
    );

    const profiles = profileRows as Profile[];

    // 4. Gera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, profiles },
      env.jwtSecret
    );

    res.cookie("SESSION_TOKEN", token, { httpOnly: true, secure: false });
    return res.status(200).json({ user, profiles, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const session = req.cookies["SESSION_TOKEN"];

  if (!session) {
    return res.status(404).json({ message: "Not logged in" });
  }

  try {
    res.clearCookie("SESSION_TOKEN");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
