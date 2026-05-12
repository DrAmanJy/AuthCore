import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/error.middleware.js";
import { AppError } from "./utils/AppError.js";

import userRouter from "./modules/users/user.routes.js";
import sessionRouter from "./modules/sessions/session.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AuthCore API',
      version: '1.0.0',
      description: 'Centralized authentication and session management service',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();
app.set("trust proxy", 1);

app.use(cors({ credentials: "included" }));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/session", sessionRouter);

app.use("/docs", ...swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res, next) =>
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
);

app.use(errorHandler);
export default app;
