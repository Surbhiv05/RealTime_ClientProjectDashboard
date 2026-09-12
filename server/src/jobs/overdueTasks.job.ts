import cron from "node-cron";
import prisma from "../lib/prisma";

export const startOverdueTaskJob = () => {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const result = await prisma.task.updateMany({
                where: {
                    dueDate: {
                        lt: now,
                    },
                    status: {
                        not: "DONE",
                    },
                    isOverdue: false,
                },
                data: {
                    isOverdue: true,
                },
            });

            if (result.count > 0) {
                console.log(
                    `${result.count} task(s) marked as overdue`
                );
            }
        } catch (error) {
            console.error(
                "Overdue task job error:",
                error
            );
        }
    });

    console.log("Overdue task background job started");
};