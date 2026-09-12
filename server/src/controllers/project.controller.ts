import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { createActivity } from "../utils/activity";

export const createProject = async (
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

        const { name, description, managerId } = req.body;

        if (!name || !managerId) {
            return res.status(400).json({
                success: false,
                message: "Project name and managerId are required",
            });
        }

        const manager = await prisma.user.findUnique({
            where: { id: managerId },
        });

        if (!manager || manager.role !== "PROJECT_MANAGER") {
            return res.status(400).json({
                success: false,
                message: "Invalid project manager",
            });
        }

        if (
            req.user.role === "PROJECT_MANAGER" &&
            req.user.userId !== managerId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only create projects for yourself",
            });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                managerId,
            },
        });

        await createActivity({
            type: "PROJECT_CREATED",
            message: `Project "${project.name}" was created`,
            projectId: project.id,
            userId: req.user.userId,
        });

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        console.error("Create project error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getProjects = async (
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

        let projects;

        if (req.user.role === "ADMIN") {
            projects = await prisma.project.findMany({
                include: {
                    manager: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        } else if (req.user.role === "PROJECT_MANAGER") {
            projects = await prisma.project.findMany({
                where: {
                    managerId: req.user.userId,
                },
                include: {
                    manager: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        } else {
            projects = await prisma.project.findMany({
                where: {
                    tasks: {
                        some: {
                            assignedToId: req.user.userId,
                        },
                    },
                },
                include: {
                    manager: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        }

        return res.status(200).json({
            success: true,
            projects,
        });
    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};