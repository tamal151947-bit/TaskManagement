import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { AppError } from "../types/errors";
import { env } from "../config";
import { getRefreshExpiryDate, hashToken, signAccessToken, signRefreshToken } from "../utils/tokens";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(2).max(60).optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  secure: env.NODE_ENV === "production",
};

const setRefreshCookie = (res: any, token: string) => {
  res.cookie("refreshToken", token, {
    ...cookieOptions,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res: any) => {
  res.clearCookie("refreshToken", {
    ...cookieOptions,
  });
};

const issueTokens = async (userId: string, res: any) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: getRefreshExpiryDate(),
    },
  });

  setRefreshCookie(res, refreshToken);
  return accessToken;
};

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, "Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    const accessToken = await issueTokens(user.id, res);

    return res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(401, "Invalid email or password");
    }

    const accessToken = await issueTokens(user.id, res);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken as string | undefined;
    if (!token) {
      throw new AppError(401, "Missing refresh token");
    }

    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & {
      sub?: string;
      type?: string;
    };

    if (payload.type !== "refresh" || !payload.sub) {
      throw new AppError(401, "Invalid refresh token");
    }

    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError(401, "Refresh token expired or revoked");
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = await issueTokens(payload.sub, res);
    return res.json({ accessToken });
  } catch (error) {
    return next(new AppError(401, "Refresh token expired or invalid"));
  }
});

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies.refreshToken as string | undefined;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  clearRefreshCookie(res);
  return res.json({ message: "Logged out" });
});
