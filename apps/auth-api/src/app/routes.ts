import { healthRouter } from "../routes/health.routes.js";
// import { organizationServiceRouter } from "../modules/organization/organization.service.routes.js";
import { userServiceRouter } from "../modules/users/user.service.routes.js";
import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { organizationRouter } from "../modules/organization/organization.routes.js";
import { userRouter } from "../modules/users/users.routes.js";

const appRouter = Router();

appRouter.use("/v1/auth", authRouter);
appRouter.use("/v1/users", userRouter);
appRouter.use("/v1/organizations", organizationRouter);

export default appRouter;

// Service-to-service internal routes
// appRouter.use("/v1/service/organizations", organizationServiceRouter);
appRouter.use("/v1/service/users", userServiceRouter);

// Health checks
appRouter.use("/health", healthRouter);
