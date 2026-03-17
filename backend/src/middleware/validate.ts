import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }

    if (source === "body") {
      req.body = result.data;
    } else if (source === "query") {
      Object.assign(req.query, result.data);
    } else {
      Object.assign(req.params, result.data);
    }

    return next();
  };
