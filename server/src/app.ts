import cors from "cors";
import express from "express";
import { z } from "zod";
import { cookieParser } from "@/middleware/cookieParser.ts";
import { errorHandler } from "@/middleware/errorHandler.ts";
import authRoutes from "@/routes/auth.route.ts";
import courseRoutes from "@/routes/courses.route.ts";
import userRoutes from "@/routes/users.route.ts";
import {
  RESPONSE_STATUS,
  UPLOAD_DIR,
  UPLOAD_DIR_PATH,
} from "@/utils/constants.ts";

/**
 * Build and configure the Express application (middleware, routes, static
 * uploads, 404 catch-all, and error handler). Kept separate from `main.ts` so
 * tests can mount the app without connecting to MongoDB or calling `listen()`.
 *
 * @returns {import("express").Express} The configured Express app.
 */
const createApp = () => {
  const app = express();

  z.config({
    customError: (issue) => {
      if (issue.code === "invalid_type" && issue.input === undefined) {
        return "Field is Required";
      }
      return undefined; // fall back to Zod's default for other errors
    },
  });

  // Disable response caching in development so code changes show immediately.
  if (process.env.NODE_ENV === "development") {
    app.use((_req, res, next) => {
      res.header("Cache-Control", "no-store");
      next();
    });
  }

  app.use(
    cors({
      origin: true, // reflect ANY origin — public API
      credentials: true, // required for the refresh-token cookie
      methods: "GET,POST,PATCH,DELETE,OPTIONS",
      allowedHeaders: "Content-Type, Authorization",
    }),
  );
  app.use(express.json()); // Parses JSON bodies
  app.use(cookieParser);
  // Serve uploads only under the /uploads URL prefix.
  app.use(`/${UPLOAD_DIR}`, express.static(UPLOAD_DIR_PATH));

  app.use("/api/course", courseRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);

  // catch all route for undefined routes
  app.all("*path", (_, res) => {
    res.status(404).json({
      status: RESPONSE_STATUS.FAIL,
      data: { message: "Resource Not Found" },
    });
  });

  app.use(errorHandler);

  return app;
};

export { createApp };
