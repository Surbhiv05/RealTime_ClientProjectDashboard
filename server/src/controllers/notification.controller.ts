import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const getNotifications = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.user.userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: req.user.userId,
                isRead: false,
            },
        });

        return res.json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const markNotificationAsRead = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const notificationId = String(
            req.params.notificationId
        );

        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        // User can only update their own notification
        if (notification.userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own notifications",
            });
        }

        const updatedNotification =
            await prisma.notification.update({
                where: {
                    id: notificationId,
                },
                data: {
                    isRead: true,
                },
            });

        return res.json({
            success: true,
            message: "Notification marked as read",
            notification: updatedNotification,
        });
    } catch (error) {
        console.error(
            "Mark notification as read error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};