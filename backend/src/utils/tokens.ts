import { randomUUID, createHash } from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config";

export const getRefreshExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
};

export const signAccessToken = (userId: string) =>
  jwt.sign({ type: "access" }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });

export const signRefreshToken = (userId: string) =>
  jwt.sign({ type: "refresh", jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
