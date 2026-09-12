import { Router } from "express";
import {
    createProject,
    getProjects,
} from "../controllers/project.controller";
import {
    authenticate,
    authorize,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
    getProjects
);

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "PROJECT_MANAGER"),
    createProject
);

export default router;