import { MongoUserRepository } from "@authcore/database";

import { UserService } from "../src/modules/users/users.service.js";
import { UserController } from "../src/modules/users/users.controller.js";

const userRepository = new MongoUserRepository();

const userService = new UserService(userRepository);

const userController = new UserController(userService);

export { userController };
