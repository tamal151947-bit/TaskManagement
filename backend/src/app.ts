import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes";
import { tasksRouter } from "./routes/tasks.routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { env } from "./config";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    message: "Task API is running",
    endpoints: {
      health: "GET /health",
      auth: [
        "POST /auth/register",
        "POST /auth/login",
        "POST /auth/refresh",
        "POST /auth/logout",
      ],
      tasks: [
        "GET /tasks",
        "POST /tasks",
        "GET /tasks/:id",
        "PATCH /tasks/:id",
        "DELETE /tasks/:id",
        "PATCH /tasks/:id/toggle",
      ],
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/tasks", tasksRouter);

app.use(notFoundHandler);
app.use(errorHandler);
