import http from "http";
import { Server } from "socket.io";

import app from "./app";
import { setupSocket } from "./socket";
import { startOverdueTaskJob } from "./jobs/overdueTasks.job";

const PORT = Number(process.env.PORT) || 5000;

const CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        credentials: true,
    },
});

setupSocket(io);
startOverdueTaskJob();

httpServer.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});