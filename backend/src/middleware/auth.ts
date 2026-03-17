import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config";
import { AppError } from "../types/errors";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return next(new AppError(401, "Missing access token"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & {
      sub?: string;
      type?: string;
    };

    if (payload.type !== "access" || !payload.sub) {
      return next(new AppError(401, "Invalid access token"));
    }

    req.user = { id: payload.sub };
    return next();
  } catch {
    return next(new AppError(401, "Access token expired or invalid"));
  }
};
