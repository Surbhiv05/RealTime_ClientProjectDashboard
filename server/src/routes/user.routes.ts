import { Router } from "express";
import { getDevelopers } from "../controllers/user.controller";
import {
    authenticate,
    authorize,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
    "/developers",
    authenticate,
    authorize("ADMIN", "PROJECT_MANAGER"),
    getDevelopers
);

export default router;