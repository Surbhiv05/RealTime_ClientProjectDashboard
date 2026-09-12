import { useEffect, useState } from "react";

interface Project {
    id: string;
    name: string;
}

interface Developer {
    id: string;
    name: string;
    email: string;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    isOverdue: boolean;
    assignedToId?: string | null;
    assignedTo?: {
        id: string;
        name: string;
        email: string;
    } | null;
}

function Tasks() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("TODO");
    const [priority, setPriority] = useState("MEDIUM");
    const [dueDate, setDueDate] = useState("");
    const [assignedToId, setAssignedToId] = useState("");

    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editStatus, setEditStatus] = useState("TODO");
    const [editPriority, setEditPriority] = useState("MEDIUM");
    const [editDueDate, setEditDueDate] = useState("");
    const [editAssignedToId, setEditAssignedToId] = useState("");

    const [hoveredTask, setHoveredTask] = useState<string | null>(null);
    const [hoveredButton, setHoveredButton] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    const getUserRole = () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            return "";
        }

        try {
            const payload = JSON.parse(
                atob(token.split(".")[1])
            );

            return payload.role || "";
        } catch {
            return "";
        }
    };

    const userRole = getUserRole();

    const isDeveloper = userRole === "DEVELOPER";

    const canManageTasks =
        userRole === "ADMIN" ||
        userRole === "PROJECT_MANAGER";

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token =
                    localStorage.getItem("accessToken");

                if (!token) {
                    setError("Please login again.");
                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/projects`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to load projects"
                    );
                }

                setProjects(data.projects || []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load projects"
                );
            }
        };

        fetchProjects();
    }, [API_URL]);

    useEffect(() => {
        const fetchDevelopers = async () => {
            if (!canManageTasks) {
                return;
            }

            try {
                const token =
                    localStorage.getItem("accessToken");

                if (!token) {
                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/users/developers`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to load developers"
                    );
                }

                setDevelopers(data.users || []);
            } catch (err) {
                console.error(
                    "Developer loading error:",
                    err
                );
            }
        };

        fetchDevelopers();
    }, [API_URL, canManageTasks]);

    useEffect(() => {
        const fetchTasks = async () => {
            if (!selectedProject) {
                setTasks([]);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem("accessToken");

                if (!token) {
                    setError("Please login again.");
                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/tasks/project/${selectedProject}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to load tasks"
                    );
                }

                setTasks(data.tasks || []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load tasks"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [API_URL, selectedProject]);

    const createTask = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!selectedProject) {
            setError("Please select a project first.");
            return;
        }

        if (!title.trim()) {
            setError("Task title is required.");
            return;
        }

        try {
            setError("");

            const token =
                localStorage.getItem("accessToken");

            if (!token) {
                setError("Please login again.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/tasks`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: title.trim(),
                        description:
                            description.trim() || null,
                        projectId: selectedProject,
                        status,
                        priority,
                        dueDate: dueDate
                            ? new Date(
                                dueDate
                            ).toISOString()
                            : null,
                        assignedToId:
                            assignedToId || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to create task"
                );
            }

            setTitle("");
            setDescription("");
            setStatus("TODO");
            setPriority("MEDIUM");
            setDueDate("");
            setAssignedToId("");
            setShowForm(false);

            await reloadTasks();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create task"
            );
        }
    };

    const reloadTasks = async () => {
        if (!selectedProject) {
            return;
        }

        try {
            const token =
                localStorage.getItem("accessToken");

            if (!token) {
                return;
            }

            const response = await fetch(
                `${API_URL}/api/tasks/project/${selectedProject}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setTasks(data.tasks || []);
            }
        } catch (err) {
            console.error(
                "Reload tasks error:",
                err
            );
        }
    };

    const startEditing = (task: Task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDescription(
            task.description || ""
        );
        setEditStatus(task.status);
        setEditPriority(task.priority);
        setEditDueDate(
            task.dueDate
                ? task.dueDate.substring(0, 10)
                : ""
        );
        setEditAssignedToId(
            task.assignedToId || ""
        );
        setError("");
    };

    const updateTask = async () => {
        if (!editingTask) {
            return;
        }

        if (!editTitle.trim()) {
            setError("Task title is required.");
            return;
        }

        try {
            setError("");

            const token =
                localStorage.getItem("accessToken");

            if (!token) {
                setError("Please login again.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/tasks/${editingTask.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: editTitle.trim(),
                        description:
                            editDescription.trim() ||
                            null,
                        status: editStatus,
                        priority: editPriority,
                        dueDate: editDueDate
                            ? new Date(
                                editDueDate
                            ).toISOString()
                            : null,
                        ...(canManageTasks && {
                            assignedToId:
                                editAssignedToId ||
                                null,
                        }),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update task"
                );
            }

            setEditingTask(null);

            await reloadTasks();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update task"
            );
        }
    };

    return (
        <div>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        Tasks
                    </h1>

                    <p style={styles.subtitle}>
                        Manage tasks for your projects
                    </p>
                </div>

                {canManageTasks &&
                    selectedProject && (
                        <button
                            onClick={() =>
                                setShowForm(
                                    !showForm
                                )
                            }
                            onMouseEnter={() =>
                                setHoveredButton(
                                    "newTask"
                                )
                            }
                            onMouseLeave={() =>
                                setHoveredButton("")
                            }
                            style={{
                                ...styles.primaryButton,
                                ...(hoveredButton ===
                                    "newTask"
                                    ? styles.primaryButtonHover
                                    : {}),
                            }}
                        >
                            + New Task
                        </button>
                    )}
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            <div style={styles.projectBox}>
                <label style={styles.projectLabel}>
                    Select Project
                </label>

                <select
                    value={selectedProject}
                    onChange={(event) => {
                        setSelectedProject(
                            event.target.value
                        );
                        setEditingTask(null);
                    }}
                    style={styles.projectSelect}
                >
                    <option value="">
                        Select a project
                    </option>

                    {projects.map((project) => (
                        <option
                            key={project.id}
                            value={project.id}
                        >
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {canManageTasks &&
                showForm &&
                selectedProject && (
                    <form
                        onSubmit={createTask}
                        style={styles.form}
                    >
                        <h2 style={styles.formTitle}>
                            Create New Task
                        </h2>

                        <input
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            placeholder="Task title"
                            required
                            style={styles.input}
                        />

                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Task description"
                            rows={4}
                            style={styles.textarea}
                        />

                        <div style={styles.formGrid}>
                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.formControl
                                }
                            >
                                <option value="TODO">
                                    To Do
                                </option>
                                <option value="IN_PROGRESS">
                                    In Progress
                                </option>
                                <option value="IN_REVIEW">
                                    In Review
                                </option>
                                <option value="DONE">
                                    Done
                                </option>
                            </select>

                            <select
                                value={priority}
                                onChange={(event) =>
                                    setPriority(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.formControl
                                }
                            >
                                <option value="LOW">
                                    Low
                                </option>
                                <option value="MEDIUM">
                                    Medium
                                </option>
                                <option value="HIGH">
                                    High
                                </option>
                                <option value="CRITICAL">
                                    Critical
                                </option>
                            </select>

                            <input
                                type="date"
                                value={dueDate}
                                onChange={(event) =>
                                    setDueDate(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.formControl
                                }
                            />

                            <select
                                value={assignedToId}
                                onChange={(event) =>
                                    setAssignedToId(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.formControl
                                }
                            >
                                <option value="">
                                    Assign Developer
                                </option>

                                {developers.map(
                                    (developer) => (
                                        <option
                                            key={
                                                developer.id
                                            }
                                            value={
                                                developer.id
                                            }
                                        >
                                            {
                                                developer.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <button
                            type="submit"
                            onMouseEnter={() =>
                                setHoveredButton(
                                    "createTask"
                                )
                            }
                            onMouseLeave={() =>
                                setHoveredButton("")
                            }
                            style={{
                                ...styles.goldButton,
                                ...(hoveredButton ===
                                    "createTask"
                                    ? styles.goldButtonHover
                                    : {}),
                            }}
                        >
                            Create Task
                        </button>
                    </form>
                )}

            {!selectedProject ? (
                <div style={styles.emptyBox}>
                    <h3 style={styles.emptyTitle}>
                        Select a project
                    </h3>

                    <p style={styles.emptyText}>
                        Choose a project above to view
                        its tasks.
                    </p>
                </div>
            ) : loading ? (
                <div style={styles.emptyBox}>
                    <p style={styles.emptyText}>
                        Loading tasks...
                    </p>
                </div>
            ) : tasks.length === 0 ? (
                <div style={styles.emptyBox}>
                    <h3 style={styles.emptyTitle}>
                        No tasks found
                    </h3>

                    <p style={styles.emptyText}>
                        {isDeveloper
                            ? "No tasks are currently assigned to you."
                            : "Create a new task for this project."}
                    </p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            onMouseEnter={() =>
                                setHoveredTask(
                                    task.id
                                )
                            }
                            onMouseLeave={() =>
                                setHoveredTask(null)
                            }
                            style={{
                                ...styles.taskCard,
                                ...(hoveredTask ===
                                    task.id
                                    ? styles.taskCardHover
                                    : {}),
                            }}
                        >
                            <div
                                style={
                                    styles.taskHeader
                                }
                            >
                                <h3
                                    style={
                                        styles.taskTitle
                                    }
                                >
                                    {task.title}
                                </h3>

                                <span
                                    style={{
                                        ...styles.statusBadge,
                                        backgroundColor:
                                            task.isOverdue
                                                ? "#FD7D00"
                                                : "#84A98C",
                                    }}
                                >
                                    {task.isOverdue
                                        ? "Overdue"
                                        : task.status.replace(
                                            "_",
                                            " "
                                        )}
                                </span>
                            </div>

                            <p
                                style={
                                    styles.description
                                }
                            >
                                {task.description ||
                                    "No description available"}
                            </p>

                            <div style={styles.tags}>
                                <span
                                    style={
                                        styles.priorityTag
                                    }
                                >
                                    {task.priority}
                                </span>

                                <span
                                    style={
                                        styles.statusTag
                                    }
                                >
                                    {task.status.replace(
                                        "_",
                                        " "
                                    )}
                                </span>
                            </div>

                            {task.dueDate && (
                                <p
                                    style={
                                        styles.dueDate
                                    }
                                >
                                    <strong>
                                        Due:
                                    </strong>{" "}
                                    {new Date(
                                        task.dueDate
                                    ).toLocaleDateString()}
                                </p>
                            )}

                            <div
                                style={
                                    styles.assignedBox
                                }
                            >
                                <small
                                    style={
                                        styles.assignedLabel
                                    }
                                >
                                    Assigned To
                                </small>

                                <div
                                    style={
                                        styles.assignedName
                                    }
                                >
                                    {task.assignedTo
                                        ?.name ||
                                        "Not assigned"}
                                </div>

                                {editingTask?.id !==
                                    task.id && (
                                        <button
                                            onClick={() =>
                                                startEditing(
                                                    task
                                                )
                                            }
                                            onMouseEnter={() =>
                                                setHoveredButton(
                                                    `edit-${task.id}`
                                                )
                                            }
                                            onMouseLeave={() =>
                                                setHoveredButton(
                                                    ""
                                                )
                                            }
                                            style={{
                                                ...styles.editButton,
                                                ...(hoveredButton ===
                                                    `edit-${task.id}`
                                                    ? styles.editButtonHover
                                                    : {}),
                                            }}
                                        >
                                            Edit Task
                                        </button>
                                    )}
                            </div>

                            {editingTask?.id ===
                                task.id && (
                                    <div
                                        style={
                                            styles.editBox
                                        }
                                    >
                                        <h3
                                            style={
                                                styles.formTitle
                                            }
                                        >
                                            Edit Task
                                        </h3>

                                        <input
                                            type="text"
                                            value={
                                                editTitle
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setEditTitle(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Task title"
                                            style={
                                                styles.input
                                            }
                                        />

                                        <textarea
                                            value={
                                                editDescription
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setEditDescription(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Task description"
                                            rows={3}
                                            style={
                                                styles.textarea
                                            }
                                        />

                                        <select
                                            value={
                                                editStatus
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setEditStatus(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            style={
                                                styles.editControl
                                            }
                                        >
                                            <option value="TODO">
                                                To Do
                                            </option>
                                            <option value="IN_PROGRESS">
                                                In Progress
                                            </option>
                                            <option value="IN_REVIEW">
                                                In Review
                                            </option>
                                            <option value="DONE">
                                                Done
                                            </option>
                                        </select>

                                        <select
                                            value={
                                                editPriority
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setEditPriority(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            style={
                                                styles.editControl
                                            }
                                        >
                                            <option value="LOW">
                                                Low
                                            </option>
                                            <option value="MEDIUM">
                                                Medium
                                            </option>
                                            <option value="HIGH">
                                                High
                                            </option>
                                            <option value="CRITICAL">
                                                Critical
                                            </option>
                                        </select>

                                        <input
                                            type="date"
                                            value={
                                                editDueDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setEditDueDate(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            style={
                                                styles.editControl
                                            }
                                        />

                                        {canManageTasks && (
                                            <select
                                                value={
                                                    editAssignedToId
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setEditAssignedToId(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                style={
                                                    styles.editControl
                                                }
                                            >
                                                <option value="">
                                                    Unassigned
                                                </option>

                                                {developers.map(
                                                    (
                                                        developer
                                                    ) => (
                                                        <option
                                                            key={
                                                                developer.id
                                                            }
                                                            value={
                                                                developer.id
                                                            }
                                                        >
                                                            {
                                                                developer.name
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        )}

                                        <div>
                                            <button
                                                type="button"
                                                onClick={
                                                    updateTask
                                                }
                                                onMouseEnter={() =>
                                                    setHoveredButton(
                                                        "save"
                                                    )
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredButton(
                                                        ""
                                                    )
                                                }
                                                style={{
                                                    ...styles.saveButton,
                                                    ...(hoveredButton ===
                                                        "save"
                                                        ? styles.saveButtonHover
                                                        : {}),
                                                }}
                                            >
                                                Save Changes
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingTask(
                                                        null
                                                    )
                                                }
                                                onMouseEnter={() =>
                                                    setHoveredButton(
                                                        "cancel"
                                                    )
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredButton(
                                                        ""
                                                    )
                                                }
                                                style={{
                                                    ...styles.cancelButton,
                                                    ...(hoveredButton ===
                                                        "cancel"
                                                        ? styles.cancelButtonHover
                                                        : {}),
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles: Record<
    string,
    React.CSSProperties
> = {
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "16px",
        flexWrap: "wrap",
    },

    title: {
        margin: 0,
        color: "#0F4C5C",
        fontSize: "32px",
        fontWeight: 800,
    },

    subtitle: {
        color: "#666",
        marginTop: "6px",
    },

    primaryButton: {
        backgroundColor: "#0F4C5C",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "12px 18px",
        cursor: "pointer",
        fontWeight: 600,
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },

    primaryButtonHover: {
        transform: "translateY(-2px)",
        boxShadow:
            "0 8px 18px rgba(15,76,92,0.20)",
    },

    error: {
        backgroundColor: "#ffe5e5",
        color: "#b00020",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "18px",
    },

    projectBox: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
    },

    projectLabel: {
        display: "block",
        fontWeight: 600,
        color: "#2D2A26",
        marginBottom: "8px",
    },

    projectSelect: {
        width: "100%",
        padding: "12px",
        border: "1px solid #84A98C",
        borderRadius: "8px",
        fontSize: "14px",
        boxSizing: "border-box",
        cursor: "pointer",
    },

    form: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
    },

    formTitle: {
        marginTop: 0,
        color: "#0F4C5C",
    },

    input: {
        width: "100%",
        padding: "12px",
        marginBottom: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxSizing: "border-box",
    },

    textarea: {
        width: "100%",
        padding: "12px",
        marginBottom: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxSizing: "border-box",
        resize: "vertical",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "12px",
    },

    formControl: {
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        cursor: "pointer",
    },

    goldButton: {
        backgroundColor: "#F4C95D",
        color: "#2D2A26",
        border: "none",
        padding: "11px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },

    goldButtonHover: {
        transform: "translateY(-2px)",
        boxShadow:
            "0 7px 16px rgba(66,48,0,0.18)",
    },

    emptyBox: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        textAlign: "center",
    },

    emptyTitle: {
        color: "#0F4C5C",
    },

    emptyText: {
        color: "#777",
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "18px",
    },

    taskCard: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e5e5e5",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    },

    taskCardHover: {
        transform: "translateY(-4px)",
        borderColor: "#84A98C",
        boxShadow:
            "0 12px 25px rgba(15,76,92,0.13)",
    },

    taskHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
    },

    taskTitle: {
        marginTop: 0,
        color: "#0F4C5C",
        fontWeight: 800,
    },

    statusBadge: {
        color: "white",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "12px",
        height: "fit-content",
        whiteSpace: "nowrap",
    },

    description: {
        color: "#666",
        lineHeight: 1.5,
    },

    tags: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginTop: "12px",
    },

    priorityTag: {
        backgroundColor: "#F4C95D",
        color: "#2D2A26",
        padding: "5px 9px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
    },

    statusTag: {
        backgroundColor: "#C4CFC7",
        color: "#2D2A26",
        padding: "5px 9px",
        borderRadius: "6px",
        fontSize: "12px",
    },

    dueDate: {
        color: "#666",
        fontSize: "13px",
    },

    assignedBox: {
        borderTop: "1px solid #eee",
        marginTop: "14px",
        paddingTop: "12px",
    },

    assignedLabel: {
        color: "#777",
    },

    assignedName: {
        marginTop: "4px",
        fontWeight: 600,
        color: "#2D2A26",
    },

    editButton: {
        marginTop: "14px",
        backgroundColor: "#0F4C5C",
        color: "white",
        border: "none",
        padding: "9px 14px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: 600,
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },

    editButtonHover: {
        transform: "translateY(-2px)",
        boxShadow:
            "0 7px 16px rgba(15,76,92,0.20)",
    },

    editBox: {
        marginTop: "15px",
        padding: "18px",
        borderRadius: "10px",
        backgroundColor: "#F6F1E9",
        border: "1px solid #C4CFC7",
    },

    editControl: {
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
        cursor: "pointer",
    },

    saveButton: {
        backgroundColor: "#2C7A7B",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "7px",
        cursor: "pointer",
        marginRight: "8px",
        fontWeight: 600,
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },

    saveButtonHover: {
        transform: "translateY(-2px)",
        boxShadow:
            "0 7px 16px rgba(44,122,123,0.20)",
    },

    cancelButton: {
        backgroundColor: "#C4CFC7",
        color: "#2D2A26",
        border: "none",
        padding: "10px 16px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: 600,
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },

    cancelButtonHover: {
        transform: "translateY(-2px)",
        boxShadow:
            "0 7px 16px rgba(45,42,38,0.15)",
    },
};

export default Tasks;