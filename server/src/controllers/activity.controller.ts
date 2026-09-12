import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const getActivities = async (
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

        let where = {};

        if (req.user.role === "PROJECT_MANAGER") {
            where = {
                project: {
                    managerId: req.user.userId,
                },
            };
        }

        if (req.user.role === "DEVELOPER") {
            where = {
                task: {
                    assignedToId: req.user.userId,
                },
            };
        }

        const activities = await prisma.activity.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        return res.json({
            success: true,
            activities,
        });
    } catch (error) {
        console.error("Get activities error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};