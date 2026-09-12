import {
    PrismaClient,
    Role,
    TaskStatus,
    Priority,
    ActivityType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seed...");

    const adminPassword = await bcrypt.hash("Admin@123", 12);
    const managerPassword = await bcrypt.hash("Manager@123", 12);
    const developerPassword = await bcrypt.hash("Developer@123", 12);

    const admin = await prisma.user.upsert({
        where: { email: "admin@dashboard.com" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin@dashboard.com",
            passwordHash: adminPassword,
            role: Role.ADMIN,
        },
    });

    const manager1 = await prisma.user.upsert({
        where: { email: "manager1@dashboard.com" },
        update: {},
        create: {
            name: "Project Manager One",
            email: "manager1@dashboard.com",
            passwordHash: managerPassword,
            role: Role.PROJECT_MANAGER,
        },
    });

    const manager2 = await prisma.user.upsert({
        where: { email: "manager2@dashboard.com" },
        update: {},
        create: {
            name: "Project Manager Two",
            email: "manager2@dashboard.com",
            passwordHash: managerPassword,
            role: Role.PROJECT_MANAGER,
        },
    });

    const developers = [];

    for (let i = 1; i <= 4; i++) {
        const developer = await prisma.user.upsert({
            where: {
                email: `developer${i}@dashboard.com`,
            },
            update: {},
            create: {
                name: `Developer ${i}`,
                email: `developer${i}@dashboard.com`,
                passwordHash: developerPassword,
                role: Role.DEVELOPER,
            },
        });

        developers.push(developer);
    }

    console.log("Users created");

    const project1 = await prisma.project.upsert({
        where: {
            id: "11111111-1111-4111-8111-111111111111",
        },
        update: {},
        create: {
            id: "11111111-1111-4111-8111-111111111111",
            name: "E-Commerce Platform",
            description: "Online shopping platform development",
            managerId: manager1.id,
        },
    });

    const project2 = await prisma.project.upsert({
        where: {
            id: "22222222-2222-4222-8222-222222222222",
        },
        update: {},
        create: {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Healthcare Management System",
            description: "Hospital and patient management platform",
            managerId: manager1.id,
        },
    });

    const project3 = await prisma.project.upsert({
        where: {
            id: "33333333-3333-4333-8333-333333333333",
        },
        update: {},
        create: {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Learning Management System",
            description: "Online learning and course management platform",
            managerId: manager2.id,
        },
    });

    const projects = [project1, project2, project3];

    console.log("Projects created");

    const taskData = [
        {
            title: "Design Homepage",
            status: TaskStatus.TODO,
            priority: Priority.HIGH,
            developerIndex: 0,
        },
        {
            title: "Create Authentication API",
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.CRITICAL,
            developerIndex: 1,
        },
        {
            title: "Build Dashboard UI",
            status: TaskStatus.IN_REVIEW,
            priority: Priority.HIGH,
            developerIndex: 2,
        },
        {
            title: "Database Optimization",
            status: TaskStatus.DONE,
            priority: Priority.MEDIUM,
            developerIndex: 3,
        },
        {
            title: "Testing and Bug Fixes",
            status: TaskStatus.TODO,
            priority: Priority.MEDIUM,
            developerIndex: 0,
        },
        {
            title: "API Documentation",
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.LOW,
            developerIndex: 1,
        },
    ];

    for (let projectIndex = 0; projectIndex < projects.length; projectIndex++) {
        const project = projects[projectIndex];

        for (let taskIndex = 0; taskIndex < taskData.length; taskIndex++) {
            const data = taskData[taskIndex];

            const isOverdue =
                (projectIndex === 0 && taskIndex === 0) ||
                (projectIndex === 1 && taskIndex === 1);

            const dueDate = isOverdue
                ? new Date(Date.now() - 24 * 60 * 60 * 1000)
                : new Date(
                    Date.now() + (taskIndex + 1) * 24 * 60 * 60 * 1000
                );

            const taskId =
                `aaaaaaaa-aaaa-4aaa-8aaa-` +
                `${String(projectIndex + 1).padStart(4, "0")}` +
                `${String(taskIndex + 1).padStart(4, "0")}`;

            const task = await prisma.task.upsert({
                where: {
                    id: taskId,
                },
                update: {
                    isOverdue,
                    dueDate,
                    status: data.status,
                    priority: data.priority,
                    assignedToId: developers[data.developerIndex].id,
                },
                create: {
                    id: taskId,
                    title: `${data.title} - ${project.name}`,
                    description: `Task for ${project.name}`,
                    status: data.status,
                    priority: data.priority,
                    dueDate,
                    isOverdue,
                    projectId: project.id,
                    assignedToId: developers[data.developerIndex].id,
                },
            });

            await prisma.activity.create({
                data: {
                    type: ActivityType.TASK_CREATED,
                    message: `Task "${task.title}" was created`,
                    projectId: project.id,
                    taskId: task.id,
                    userId: admin.id,
                },
            });
        }
    }

    console.log("Tasks created");

    for (const project of projects) {
        await prisma.activity.create({
            data: {
                type: ActivityType.PROJECT_CREATED,
                message: `Project "${project.name}" was created`,
                projectId: project.id,
                userId: project.managerId,
            },
        });
    }

    console.log("Activity logs created");

    await prisma.notification.create({
        data: {
            message: "Welcome to the Real-Time Client Project Dashboard",
            userId: admin.id,
        },
    });

    for (const developer of developers) {
        await prisma.notification.create({
            data: {
                message: "You have been assigned new project tasks",
                userId: developer.id,
            },
        });
    }

    console.log("Notifications created");
    console.log("");
    console.log("DATABASE SEED COMPLETED");
    console.log("");
    console.log("Admin:");
    console.log("admin@dashboard.com / Admin@123");
    console.log("");
    console.log("Project Managers:");
    console.log("manager1@dashboard.com / Manager@123");
    console.log("manager2@dashboard.com / Manager@123");
    console.log("");
    console.log("Developers:");
    console.log("developer1@dashboard.com / Developer@123");
    console.log("developer2@dashboard.com / Developer@123");
    console.log("developer3@dashboard.com / Developer@123");
    console.log("developer4@dashboard.com / Developer@123");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        throw error;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });