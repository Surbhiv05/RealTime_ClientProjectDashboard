import { Router } from "express";
import {
    createTask,
    getProjectTasks,
    updateTask,
} from "../controllers/task.controller";
import {
    authenticate,
    authorize,
} from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "PROJECT_MANAGER"),
    createTask
);

router.get(
    "/project/:projectId",
    authenticate,
    authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
    getProjectTasks
);

router.patch(
    "/:taskId",
    authenticate,
    authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
    updateTask
);

export default router;