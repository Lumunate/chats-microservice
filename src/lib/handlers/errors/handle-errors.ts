import { Prisma } from "@prisma/client";
import { Response } from "express";
import { ZodError } from "zod";

import AuthError from "./types/AuthError";
import NotFoundError from "./types/NotFoundError";
import ValidationError from "./types/ValidationError";

export function handleErrors(error: unknown, res: Response): Response {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");

          if (!acc[field]) acc[field] = [];
          acc[field].push(err.message);

          return acc;
        },
        {} as Record<string, string[]>
      ),
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: "Validation Error",
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (error.code) {
      case "P2002":
        return res.status(409).json({
          error: "Conflict",
          message: "A record with this identifier already exists.",
        });

      case "P2025": {
        const entityName = error.meta?.cause || "Record";

        return res.status(404).json({
          error: "Not Found",
          message: `${entityName} not found.`,
        });
      }

      default:
        return res.status(500).json({
          error: "Database Error",
          message: "An error occurred while accessing the database.",
        });
    }
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: "Not found",
      message: error.message,
    });
  }

  if (error instanceof AuthError) {
    return res.status(401).json({
      error: "Unauthorized",
      message: error.message,
    });
  }

  return res.status(500).json({
    error: "Internal server error",
    message: error instanceof Error ? error.message : "Unknown error occurred",
  });
}
