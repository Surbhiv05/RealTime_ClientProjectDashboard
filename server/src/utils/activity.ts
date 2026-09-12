import prisma from "../lib/prisma";
import { ActivityType } from "@prisma/client";
import { socketIO } from "../socket";

interface CreateActivityData {
    type: ActivityType;
    message: string;
    projectId: string;
    taskId?: string;
    userId: string;
}

export const createActivity = async (
    data: CreateActivityData
) => {
    const activity = await prisma.activity.create({
        data: {
            type: data.type,
            message: data.message,
            projectId: data.projectId,
            taskId: data.taskId,
            userId: data.userId,
        },
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
    });

    if (socketIO) {
        socketIO.to("role:admin").emit("activity:new", activity);

        const project = await prisma.project.findUnique({
            where: {
                id: data.projectId,
            },
            select: {
                managerId: true,
            },
        });

        if (project) {
            socketIO
                .to(`role:manager:${project.managerId}`)
                .emit("activity:new", activity);
        }

        if (data.taskId) {
            const task = await prisma.task.findUnique({
                where: {
                    id: data.taskId,
                },
                select: {
                    assignedToId: true,
                },
            });

            if (task?.assignedToId) {
                socketIO
                    .to(`role:developer:${task.assignedToId}`)
                    .emit("activity:new", activity);
            }
        }
    }

    return activity;
};