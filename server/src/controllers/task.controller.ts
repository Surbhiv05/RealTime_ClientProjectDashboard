import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { createActivity } from "../utils/activity";
import { createNotification } from "../utils/notification";

export const createTask = async (
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

        const {
            title,
            description,
            priority,
            dueDate,
            projectId,
            assignedToId,
        } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({
                success: false,
                message: "Title and projectId are required",
            });
        }

        const project = await prisma.project.findUnique({
            where: {
                id: String(projectId),
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        if (
            req.user.role === "PROJECT_MANAGER" &&
            project.managerId !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage your own projects",
            });
        }

        if (assignedToId) {
            const developer = await prisma.user.findUnique({
                where: {
                    id: String(assignedToId),
                },
            });

            if (!developer || developer.role !== "DEVELOPER") {
                return res.status(400).json({
                    success: false,
                    message: "Task can only be assigned to a developer",
                });
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: String(projectId),
                assignedToId: assignedToId
                    ? String(assignedToId)
                    : null,
            },
        });

        // Activity: Task created
        await createActivity({
            type: "TASK_CREATED",
            message: `Task "${task.title}" was created`,
            projectId: task.projectId,
            taskId: task.id,
            userId: req.user.userId,
        });

        // Activity + Notification: Task assigned
        if (task.assignedToId) {
            await createActivity({
                type: "TASK_ASSIGNED",
                message: `Task "${task.title}" was assigned to a developer`,
                projectId: task.projectId,
                taskId: task.id,
                userId: req.user.userId,
            });

            await createNotification({
                userId: task.assignedToId,
                message: `You have been assigned task "${task.title}"`,
            });
        }

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        console.error("Create task error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getProjectTasks = async (
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

        const projectId = String(req.params.projectId);

        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Project Manager can only access own projects
        if (
            req.user.role === "PROJECT_MANAGER" &&
            project.managerId !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only access your own projects",
            });
        }

        // Query filters
        const { status, priority, overdue } = req.query;

        const where: any = {
            projectId,
        };

        // Developer can only see assigned tasks
        if (req.user.role === "DEVELOPER") {
            where.assignedToId = req.user.userId;
        }

        // Status filter
        if (status) {
            where.status = String(status);
        }

        // Priority filter
        if (priority) {
            where.priority = String(priority);
        }

        // Overdue filter
        if (overdue === "true") {
            where.isOverdue = true;
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.json({
            success: true,
            filters: {
                status: status || null,
                priority: priority || null,
                overdue: overdue || null,
            },
            tasks,
        });
    } catch (error) {
        console.error("Get tasks error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const updateTask = async (
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

        const taskId = String(req.params.taskId);

        const task = await prisma.task.findUnique({
            where: {
                id: taskId,
            },
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        const project = await prisma.project.findUnique({
            where: {
                id: task.projectId,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Project Manager can only manage own projects
        if (
            req.user.role === "PROJECT_MANAGER" &&
            project.managerId !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage your own projects",
            });
        }

        // Developer can only update assigned tasks
        if (
            req.user.role === "DEVELOPER" &&
            task.assignedToId !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only update tasks assigned to you",
            });
        }

        const {
            title,
            description,
            status,
            priority,
            dueDate,
            assignedToId,
        } = req.body;

        // Validate developer assignment
        if (assignedToId !== undefined && assignedToId !== null) {
            const developer = await prisma.user.findUnique({
                where: {
                    id: String(assignedToId),
                },
            });

            if (!developer || developer.role !== "DEVELOPER") {
                return res.status(400).json({
                    success: false,
                    message: "Task can only be assigned to a developer",
                });
            }
        }

        const updatedTask = await prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                ...(title !== undefined && {
                    title,
                }),
                ...(description !== undefined && {
                    description,
                }),
                ...(status !== undefined && {
                    status,
                }),
                ...(priority !== undefined && {
                    priority,
                }),
                ...(dueDate !== undefined && {
                    dueDate: dueDate
                        ? new Date(dueDate)
                        : null,
                }),
                ...(assignedToId !== undefined && {
                    assignedToId: assignedToId
                        ? String(assignedToId)
                        : null,
                }),
            },
        });

        // Status changed
        if (status !== undefined && status !== task.status) {
            await createActivity({
                type: "TASK_STATUS_CHANGED",
                message: `Task "${updatedTask.title}" status changed from ${task.status} to ${updatedTask.status}`,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                userId: req.user.userId,
            });

            // Task completed activity
            if (updatedTask.status === "DONE") {
                await createActivity({
                    type: "TASK_COMPLETED",
                    message: `Task "${updatedTask.title}" was completed`,
                    projectId: updatedTask.projectId,
                    taskId: updatedTask.id,
                    userId: req.user.userId,
                });
            }

            // Notify Project Manager when task moves to In Review
            if (updatedTask.status === "IN_REVIEW") {
                await createNotification({
                    userId: project.managerId,
                    message: `Task "${updatedTask.title}" has been moved to In Review`,
                });
            }
        } else {
            await createActivity({
                type: "TASK_UPDATED",
                message: `Task "${updatedTask.title}" was updated`,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                userId: req.user.userId,
            });
        }

        // Assignment changed
        if (
            assignedToId !== undefined &&
            String(assignedToId || "") !== String(task.assignedToId || "")
        ) {
            await createActivity({
                type: "TASK_ASSIGNED",
                message: `Task "${updatedTask.title}" assignment was updated`,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                userId: req.user.userId,
            });


            if (updatedTask.assignedToId) {
                await createNotification({
                    userId: updatedTask.assignedToId,
                    message: `You have been assigned task "${updatedTask.title}"`,
                });
            }
        }

        return res.json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask,
        });
    } catch (error) {
        console.error("Update task error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};