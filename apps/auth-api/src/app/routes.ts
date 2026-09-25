import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { organizationRouter } from "../modules/organization/organization.routes.js";
import { userRouter } from "../modules/users/users.routes.js";

const appRouter = Router();

appRouter.use("/v1/auth", authRouter);
appRouter.use("/v1/users", userRouter);
appRouter.use("/v1/organizations", organizationRouter);

export default appRouter;
