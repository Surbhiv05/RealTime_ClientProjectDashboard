import { Router } from "express";

import {
    getNotifications,
    markNotificationAsRead,
} from "../controllers/notification.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getNotifications);

router.patch(
    "/:notificationId/read",
    authenticate,
    markNotificationAsRead
);

export default router;