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
    return res.status(401).send("Not logged in");
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
    return res.sendStatus(403);
  }
};

export const restricted = (...allowedProfiles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { profiles: string[] };

    if (!user) {
      return res.sendStatus(401);
    }

    const hasAccess = user.profiles.some((profile) =>
      allowedProfiles.includes(profile)
    );

    if (!hasAccess) {
      return res.sendStatus(403);
    }

    next();
  };
};

export const login = async (req: Request, res: Response) => {
  const isSigned = req.cookies["SESSION_TOKEN"];
  if (isSigned) {
    return res.sendStatus(409);
  }

  const { email, password } = req.body;
  const users = new Users(connection);
  const associated = new Associated(connection);

  const user = await users.findOne({ email: email });
  if (!user) {
    return res.sendStatus(404);
  }

  const validatePassword = bcrypt.compareSync(password, user.password);

  if (!validatePassword) {
    return res.sendStatus(401);
  }

  const profiles = await associated.findAllAssociated(user.id);

  const token = jwt.sign(
    { email: user.email, profiles: profiles },
    env.jwtSecret
  );

  res.cookie("SESSION_TOKEN", token, { httpOnly: true, secure: false });

  res.status(200).json({ user, token });
};

export const logout = async (req: Request, res: Response) => {
  const session = req.cookies["SESSION_TOKEN"];

  if (!session) {
    return res.sendStatus(400);
  }

  try {
    res.clearCookie("SESSION_TOKEN");
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
