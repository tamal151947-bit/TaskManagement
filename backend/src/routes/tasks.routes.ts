import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../types/errors";

const createTaskSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(["PENDING", "COMPLETED"]).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required",
  });

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  search: z.string().optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);

tasksRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, status, search } = listQuerySchema.parse(req.query);
    const userId = req.user!.id;

    const where = {
      userId,
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search } } : {}),
    };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.json({
      items: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.post("/", validate(createTaskSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const task = await prisma.task.create({
      data: {
        ...req.body,
        userId,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
});

tasksRouter.get("/:id", validate(idParamSchema, "params"), async (req, res, next) => {
  try {
    const taskId = String(req.params.id);
    const userId = req.user!.id;
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new AppError(404, "Task not found");
    }

    return res.json(task);
  } catch (error) {
    return next(error);
  }
});

tasksRouter.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateTaskSchema),
  async (req, res, next) => {
    try {
      const taskId = String(req.params.id);
      const userId = req.user!.id;
      const existing = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId,
        },
      });

      if (!existing) {
        throw new AppError(404, "Task not found");
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: req.body,
      });

      return res.json(task);
    } catch (error) {
      return next(error);
    }
  },
);

tasksRouter.delete("/:id", validate(idParamSchema, "params"), async (req, res, next) => {
  try {
    const taskId = String(req.params.id);
    const userId = req.user!.id;
    const existing = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError(404, "Task not found");
    }

    await prisma.task.delete({ where: { id: taskId } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

tasksRouter.patch("/:id/toggle", validate(idParamSchema, "params"), async (req, res, next) => {
  try {
    const taskId = String(req.params.id);
    const userId = req.user!.id;
    const existing = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError(404, "Task not found");
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: existing.status === "COMPLETED" ? "PENDING" : "COMPLETED",
      },
    });

    return res.json(task);
  } catch (error) {
    return next(error);
  }
});
