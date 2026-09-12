import prisma from "../lib/prisma";
import { socketIO } from "../socket";

interface CreateNotificationData {
    userId: string;
    message: string;
}

export const createNotification = async (
    data: CreateNotificationData
) => {
    const notification = await prisma.notification.create({
        data: {
            userId: data.userId,
            message: data.message,
        },
    });

    if (socketIO) {
        socketIO
            .to(`user:${data.userId}`)
            .emit("notification:new", notification);
    }

    return notification;
};