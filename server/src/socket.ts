import { Server } from "socket.io";
import { verifyAccessToken } from "./utils/auth";
import prisma from "./lib/prisma";

export let socketIO: Server;

export const setupSocket = (io: Server) => {
    socketIO = io;
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = verifyAccessToken(token);

            const user = await prisma.user.findUnique({
                where: {
                    id: decoded.userId,
                },
            });

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.data.user = {
                userId: user.id,
                role: user.role,
            };

            next();
        } catch (error) {
            next(new Error("Invalid or expired access token"));
        }
    });

    io.on("connection", (socket) => {
        const user = socket.data.user;

        socket.join(`user:${user.userId}`);

        if (user.role === "ADMIN") {
            socket.join("role:admin");
        }

        if (user.role === "PROJECT_MANAGER") {
            socket.join(`role:manager:${user.userId}`);
        }

        if (user.role === "DEVELOPER") {
            socket.join(`role:developer:${user.userId}`);
        }

        console.log(
            `Socket connected: ${user.userId} (${user.role})`
        );

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${user.userId}`);
        });
    });
};