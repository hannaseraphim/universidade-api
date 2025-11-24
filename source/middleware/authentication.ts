import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Users, Associated } from "../modules/index.js";
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
      email: string;
      profiles: string[];
    };

    (req as any).user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({ message: "Internal server error" });
  }
};

export const restricted = (...allowedProfiles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { profiles: string[] };

    if (!user) {
      return res.status(401).json({ message: "Missing session token" });
    }

    const hasAccess = user.profiles.some((profile) =>
      allowedProfiles.includes(profile)
    );

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
  const users = new Users(connection);
  const associated = new Associated(connection);

  const user = await users.getOneByCondition({ email: email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const validatePassword = bcrypt.compareSync(password, user.password);

  if (!validatePassword) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const profiles = await associated.getAllAssociated(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email, profiles: profiles },
    env.jwtSecret
  );

  res.cookie("SESSION_TOKEN", token, { httpOnly: true, secure: false });
  res.status(200).json({ user, token });
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
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
