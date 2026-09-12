# Real-Time Client Project Dashboard

A full-stack real-time project management dashboard built with **React, TypeScript, Node.js, Express, PostgreSQL, Prisma, and Socket.IO**.

The application provides role-based project and task management with real-time activity updates, notifications, overdue task detection, and JWT-based authentication.

---

## 🌐 Live Demo

**Frontend:**
https://real-time-client-project-dashboard-seven.vercel.app/

**Backend:**
https://realtime-client-dashboard-api.onrender.com

**Health Check:**
https://realtime-client-dashboard-api.onrender.com/api/health

---

## ✨ Features

* JWT-based authentication
* Role-based access control
* Admin, Project Manager, and Developer roles
* Project and task management
* Task assignment and status updates
* Task priority and due-date management
* Real-time activity feed using Socket.IO
* Real-time notifications
* Offline activity catch-up
* Automatic overdue task detection using node-cron
* PostgreSQL relational database
* Prisma ORM
* Server-side authorization and validation
* Database indexing for frequently queried fields

---

## 👥 Roles

### Admin

* View all projects and tasks
* View system-wide activities
* Receive notifications and real-time updates

### Project Manager

* Manage assigned projects
* Create and update tasks
* Assign tasks to developers
* View project-related activities

### Developer

* View assigned tasks
* Update permitted task information
* Update task status
* Receive relevant activities and notifications

---

## 🛠️ Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* Socket.IO Client

**Backend**

* Node.js
* Express.js
* TypeScript
* Socket.IO
* JWT
* bcrypt
* node-cron

**Database**

* PostgreSQL
* Prisma

**Deployment**

* Vercel – Frontend
* Render – Backend
* Neon – PostgreSQL
* GitHub – Source Code

---



## ⚡ Real-Time Updates

Socket.IO is used for real-time communication without polling.

Important events include:

```text
activity:new
notification:new
```

Activities are filtered according to the user's role and access permissions.

The latest 20 activities are loaded from the database when the user connects or reconnects.

---

## ⏰ Overdue Tasks

A scheduled **node-cron** background job periodically checks incomplete tasks whose due dates have passed and marks them as overdue.

---

## 🔐 Authentication

* Short-lived JWT access tokens
* Refresh tokens stored in HttpOnly cookies
* Refresh token rotation and revocation
* Password hashing using bcrypt
* Backend-level role authorization

---

## 🧪 Live Demo Credentials

> These credentials are provided for assessment/demo purposes.

| Role            | Email                      | Password        |
| --------------- | -------------------------- | --------------- |
| Admin           | `admin@dashboard.com`      | `Admin@123`     |
| Project Manager | `manager1@dashboard.com`   | `Manager@123`   |
| Developer       | `developer1@dashboard.com` | `Developer@123` |

---

## 📌 Testing

For real-time functionality, open the application in two browser windows:

1. Login as Project Manager.
2. Login as Developer.
3. Create or update a task from the Manager account.
4. Assign it to the Developer.
5. Observe the real-time activity and notification in the Developer account.

---

