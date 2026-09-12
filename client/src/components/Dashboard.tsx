import { useEffect, useState } from "react";

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    isOverdue: boolean;
    assignedTo?: {
        id: string;
        name: string;
        email: string;
    } | null;
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    manager?: {
        id: string;
        name: string;
        email: string;
    };
    _count?: {
        tasks: number;
    };
}

const Dashboard = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hoveredStat, setHoveredStat] = useState<number | null>(null);
    const [hoveredTask, setHoveredTask] = useState<string | null>(null);
    const [hoveredClear, setHoveredClear] = useState(false);

    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/projects`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setProjects(data.projects || []);

                    if (data.projects?.length > 0) {
                        setSelectedProject(data.projects[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to load projects:", error);
            }
        };

        if (token) {
            loadProjects();
        }
    }, [token]);

    useEffect(() => {
        const loadTasks = async () => {
            if (!selectedProject) {
                setTasks([]);
                return;
            }

            setLoading(true);

            try {
                const params = new URLSearchParams();

                if (statusFilter) {
                    params.append("status", statusFilter);
                }

                if (priorityFilter) {
                    params.append("priority", priorityFilter);
                }

                if (overdueOnly) {
                    params.append("overdue", "true");
                }

                const query = params.toString();

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject}${query ? `?${query}` : ""}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setTasks(data.tasks || []);
                }
            } catch (error) {
                console.error("Failed to load tasks:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadTasks();
        }
    }, [
        selectedProject,
        statusFilter,
        priorityFilter,
        overdueOnly,
        token,
    ]);

    const totalTasks = tasks.length;

    const inProgressTasks = tasks.filter(
        (task) => task.status === "IN_PROGRESS"
    ).length;

    const overdueTasks = tasks.filter(
        (task) => task.isOverdue
    ).length;

    const completedTasks = tasks.filter(
        (task) => task.status === "DONE"
    ).length;

    const selectedProjectData = projects.find(
        (project) => project.id === selectedProject
    );

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "TODO":
                return "To Do";
            case "IN_PROGRESS":
                return "In Progress";
            case "IN_REVIEW":
                return "In Review";
            case "DONE":
                return "Done";
            default:
                return status;
        }
    };

    const getPriorityLabel = (priority: string) => {
        return priority.charAt(0) + priority.slice(1).toLowerCase();
    };

    const getPriorityClass = (priority: string) => {
        switch (priority) {
            case "CRITICAL":
                return styles.critical;
            case "HIGH":
                return styles.high;
            case "MEDIUM":
                return styles.medium;
            default:
                return styles.low;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "DONE":
                return styles.done;
            case "IN_PROGRESS":
                return styles.progress;
            case "IN_REVIEW":
                return styles.review;
            default:
                return styles.todo;
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return "No due date";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const clearFilters = () => {
        setStatusFilter("");
        setPriorityFilter("");
        setOverdueOnly(false);
    };

    const getStatStyle = (index: number) => ({
        ...styles.statCard,
        ...(hoveredStat === index
            ? styles.statCardHover
            : {}),
    });

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.hero}>
                    <div>
                        <div style={styles.eyebrow}>
                            PROJECT MANAGEMENT
                        </div>

                        <h1 style={styles.title}>
                            Dashboard
                        </h1>

                        <p style={styles.subtitle}>
                            Track your projects, tasks and team progress in one place.
                        </p>
                    </div>

                    <div style={styles.headerBadge}>
                        <span style={styles.headerDot}></span>
                        Live Dashboard
                    </div>
                </div>

                <div style={styles.statsGrid}>
                    {[
                        {
                            icon: "📁",
                            label: "PROJECTS",
                            number: projects.length,
                            description: "Active projects",
                        },
                        {
                            icon: "✓",
                            label: "TASKS",
                            number: totalTasks,
                            description: "Tasks in selected project",
                        },
                        {
                            icon: "◔",
                            label: "IN PROGRESS",
                            number: inProgressTasks,
                            description: "Currently being worked on",
                        },
                    ].map((stat, index) => (
                        <div
                            key={stat.label}
                            style={getStatStyle(index)}
                            onMouseEnter={() =>
                                setHoveredStat(index)
                            }
                            onMouseLeave={() =>
                                setHoveredStat(null)
                            }
                        >
                            <div style={styles.statTop}>
                                <div style={styles.statIcon}>
                                    {stat.icon}
                                </div>

                                <span style={styles.statLabel}>
                                    {stat.label}
                                </span>
                            </div>

                            <div style={styles.statNumber}>
                                {stat.number}
                            </div>

                            <div style={styles.statDescription}>
                                {stat.description}
                            </div>
                        </div>
                    ))}

                    <div
                        style={{
                            ...styles.statCardGold,
                            ...(hoveredStat === 3
                                ? styles.statCardGoldHover
                                : {}),
                        }}
                        onMouseEnter={() =>
                            setHoveredStat(3)
                        }
                        onMouseLeave={() =>
                            setHoveredStat(null)
                        }
                    >
                        <div style={styles.statTop}>
                            <div style={styles.statIconGold}>
                                !
                            </div>

                            <span style={styles.statLabel}>
                                OVERDUE
                            </span>
                        </div>

                        <div style={styles.statNumber}>
                            {overdueTasks}
                        </div>

                        <div style={styles.statDescription}>
                            Need attention
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>
                                Your Projects
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Select a project to view its current tasks.
                            </p>
                        </div>

                        <div style={styles.projectCount}>
                            {projects.length} Projects
                        </div>
                    </div>

                    <select
                        value={selectedProject}
                        onChange={(e) =>
                            setSelectedProject(e.target.value)
                        }
                        style={styles.selectLarge}
                    >
                        {projects.length === 0 && (
                            <option value="">
                                No projects available
                            </option>
                        )}

                        {projects.map((project) => (
                            <option
                                key={project.id}
                                value={project.id}
                            >
                                {project.name}
                            </option>
                        ))}
                    </select>

                    {selectedProjectData && (
                        <div style={styles.projectInfo}>
                            <div>
                                <div style={styles.projectName}>
                                    {selectedProjectData.name}
                                </div>

                                <div style={styles.projectDescription}>
                                    {selectedProjectData.description ||
                                        "No project description available."}
                                </div>
                            </div>

                            <div style={styles.projectTasks}>
                                <strong>
                                    {selectedProjectData._count?.tasks ??
                                        totalTasks}
                                </strong>

                                <span>Tasks</span>
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.card}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>
                                Task Overview
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Filter tasks by status, priority or deadline.
                            </p>
                        </div>

                        {(statusFilter ||
                            priorityFilter ||
                            overdueOnly) && (
                                <button
                                    onClick={clearFilters}
                                    onMouseEnter={() =>
                                        setHoveredClear(true)
                                    }
                                    onMouseLeave={() =>
                                        setHoveredClear(false)
                                    }
                                    style={{
                                        ...styles.clearButton,
                                        ...(hoveredClear
                                            ? styles.buttonHover
                                            : {}),
                                    }}
                                >
                                    Clear filters
                                </button>
                            )}
                    </div>

                    <div style={styles.filters}>
                        <div style={styles.filterGroup}>
                            <label style={styles.label}>
                                Status
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                style={styles.select}
                            >
                                <option value="">
                                    All Status
                                </option>
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
                        </div>

                        <div style={styles.filterGroup}>
                            <label style={styles.label}>
                                Priority
                            </label>

                            <select
                                value={priorityFilter}
                                onChange={(e) =>
                                    setPriorityFilter(e.target.value)
                                }
                                style={styles.select}
                            >
                                <option value="">
                                    All Priority
                                </option>
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
                        </div>

                        <label style={styles.checkboxBox}>
                            <input
                                type="checkbox"
                                checked={overdueOnly}
                                onChange={(e) =>
                                    setOverdueOnly(
                                        e.target.checked
                                    )
                                }
                            />

                            <span>Overdue only</span>
                        </label>
                    </div>
                </div>

                <div style={styles.card}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <h2 style={styles.sectionTitle}>
                                Tasks
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                {totalTasks} task
                                {totalTasks !== 1 ? "s" : ""} found
                            </p>
                        </div>

                        <div style={styles.completedBadge}>
                            {completedTasks} completed
                        </div>
                    </div>

                    {loading ? (
                        <div style={styles.emptyState}>
                            <div style={styles.loadingIcon}>
                                ↻
                            </div>

                            <h3>Loading tasks...</h3>

                            <p>
                                Please wait while we fetch the latest tasks.
                            </p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>
                                ✓
                            </div>

                            <h3>No tasks found</h3>

                            <p>
                                There are no tasks matching your current filters.
                            </p>
                        </div>
                    ) : (
                        <div style={styles.taskList}>
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    style={{
                                        ...styles.taskRow,
                                        ...(hoveredTask === task.id
                                            ? styles.taskRowHover
                                            : {}),
                                    }}
                                    onMouseEnter={() =>
                                        setHoveredTask(task.id)
                                    }
                                    onMouseLeave={() =>
                                        setHoveredTask(null)
                                    }
                                >
                                    <div style={styles.taskMain}>
                                        <div style={styles.taskTitleRow}>
                                            <h3 style={styles.taskTitle}>
                                                {task.title}
                                            </h3>

                                            {task.isOverdue && (
                                                <span
                                                    style={
                                                        styles.overdueBadge
                                                    }
                                                >
                                                    Overdue
                                                </span>
                                            )}
                                        </div>

                                        <div style={styles.taskMeta}>
                                            <span
                                                style={getStatusClass(
                                                    task.status
                                                )}
                                            >
                                                {getStatusLabel(
                                                    task.status
                                                )}
                                            </span>

                                            <span
                                                style={getPriorityClass(
                                                    task.priority
                                                )}
                                            >
                                                {getPriorityLabel(
                                                    task.priority
                                                )}
                                            </span>

                                            <span style={styles.date}>
                                                Due:{" "}
                                                {formatDate(
                                                    task.dueDate
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={styles.assignee}>
                                        {task.assignedTo ? (
                                            <>
                                                <div style={styles.avatar}>
                                                    {task.assignedTo.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <div
                                                        style={
                                                            styles.assigneeName
                                                        }
                                                    >
                                                        {
                                                            task
                                                                .assignedTo
                                                                .name
                                                        }
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.assigneeEmail
                                                        }
                                                    >
                                                        Developer
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <span
                                                style={
                                                    styles.unassigned
                                                }
                                            >
                                                Unassigned
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#F6F1E9",
        color: "#2D2A26",
        fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        padding: "38px 42px 60px",
    },

    container: {
        maxWidth: "1180px",
        margin: "0 auto",
    },

    hero: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "34px",
        gap: "20px",
    },

    eyebrow: {
        color: "#2C7A7B",
        fontSize: "12px",
        fontWeight: 800,
        letterSpacing: "1.8px",
        marginBottom: "8px",
    },

    title: {
        margin: 0,
        fontSize: "48px",
        lineHeight: 1,
        color: "#0F4C5C",
        fontWeight: 800,
        letterSpacing: "-1.5px",
    },

    subtitle: {
        margin: "10px 0 0",
        fontSize: "16px",
        color: "#6D6A65",
    },

    headerBadge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 15px",
        borderRadius: "30px",
        background: "#FFFFFF",
        border: "1px solid #DCE4DE",
        color: "#2D2A26",
        fontSize: "13px",
        fontWeight: 700,
        boxShadow:
            "0 5px 18px rgba(15, 76, 92, 0.06)",
    },

    headerDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#84A98C",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "18px",
        marginBottom: "24px",
    },

    statCard: {
        background: "#FFFFFF",
        border: "1px solid #DCE4DE",
        borderRadius: "18px",
        padding: "22px",
        boxShadow:
            "0 8px 25px rgba(15, 76, 92, 0.06)",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    },

    statCardHover: {
        transform: "translateY(-4px)",
        boxShadow:
            "0 14px 30px rgba(15, 76, 92, 0.13)",
        borderColor: "#84A98C",
    },

    statCardGold: {
        background: "#F4C95D",
        border: "1px solid #E7B83F",
        borderRadius: "18px",
        padding: "22px",
        boxShadow:
            "0 8px 25px rgba(15, 76, 92, 0.06)",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },

    statCardGoldHover: {
        transform: "translateY(-4px)",
        boxShadow:
            "0 14px 30px rgba(15, 76, 92, 0.16)",
    },

    statTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    statIcon: {
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#E8F0EC",
        color: "#0F4C5C",
        fontSize: "17px",
    },

    statIconGold: {
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.45)",
        color: "#423000",
        fontSize: "18px",
        fontWeight: 800,
    },

    statLabel: {
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "1px",
        color: "#74716C",
    },

    statNumber: {
        fontSize: "34px",
        fontWeight: 800,
        color: "#0F4C5C",
        marginTop: "18px",
    },

    statDescription: {
        fontSize: "12px",
        color: "#77736D",
        marginTop: "3px",
    },

    card: {
        background: "#FFFFFF",
        borderRadius: "20px",
        padding: "26px",
        marginBottom: "22px",
        border: "1px solid #E3E8E4",
        boxShadow:
            "0 8px 28px rgba(15, 76, 92, 0.055)",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px",
    },

    sectionTitle: {
        margin: 0,
        color: "#0F4C5C",
        fontSize: "22px",
        fontWeight: 800,
    },

    sectionSubtitle: {
        margin: "5px 0 0",
        color: "#77736D",
        fontSize: "13px",
    },

    projectCount: {
        background: "#E8F0EC",
        color: "#0F4C5C",
        borderRadius: "20px",
        padding: "8px 13px",
        fontSize: "12px",
        fontWeight: 700,
    },

    selectLarge: {
        width: "100%",
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid #C8D6CD",
        background: "#F8FAF8",
        color: "#2D2A26",
        fontSize: "14px",
        outline: "none",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    },

    projectInfo: {
        marginTop: "16px",
        padding: "17px",
        background: "#F6F9F6",
        borderRadius: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
    },

    projectName: {
        fontWeight: 800,
        color: "#0F4C5C",
        fontSize: "15px",
    },

    projectDescription: {
        color: "#77736D",
        fontSize: "12px",
        marginTop: "4px",
    },

    projectTasks: {
        minWidth: "80px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        color: "#0F4C5C",
    },

    filters: {
        display: "flex",
        alignItems: "flex-end",
        gap: "15px",
        flexWrap: "wrap",
    },

    filterGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
    },

    label: {
        fontSize: "11px",
        fontWeight: 800,
        color: "#77736D",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
    },

    select: {
        minWidth: "170px",
        padding: "11px 13px",
        borderRadius: "10px",
        border: "1px solid #C8D6CD",
        background: "#F8FAF8",
        color: "#2D2A26",
        fontSize: "13px",
        cursor: "pointer",
    },

    checkboxBox: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "11px 14px",
        border: "1px solid #C8D6CD",
        borderRadius: "10px",
        background: "#F8FAF8",
        fontSize: "13px",
        cursor: "pointer",
    },

    clearButton: {
        border: "none",
        background: "#E8F0EC",
        color: "#0F4C5C",
        padding: "9px 13px",
        borderRadius: "9px",
        fontWeight: 700,
        cursor: "pointer",
        fontSize: "12px",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
    },

    buttonHover: {
        transform: "translateY(-2px)",
        boxShadow:
            "0 6px 14px rgba(15, 76, 92, 0.15)",
        background: "#DCEBE3",
    },

    completedBadge: {
        background: "#E8F0EC",
        color: "#2C7A7B",
        padding: "8px 13px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 700,
    },

    taskList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    taskRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "17px",
        border: "1px solid #E5EAE6",
        borderRadius: "14px",
        background: "#FCFDFC",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    },

    taskRowHover: {
        transform: "translateY(-2px)",
        borderColor: "#84A98C",
        boxShadow:
            "0 8px 20px rgba(15, 76, 92, 0.10)",
    },

    taskMain: {
        minWidth: 0,
        flex: 1,
    },

    taskTitleRow: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
    },

    taskTitle: {
        margin: 0,
        color: "#2D2A26",
        fontSize: "14px",
        fontWeight: 750,
    },

    overdueBadge: {
        background: "#FDE7E1",
        color: "#B64A32",
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "10px",
        fontWeight: 800,
    },

    taskMeta: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "9px",
        flexWrap: "wrap",
    },

    todo: {
        background: "#EEF1F0",
        color: "#5E625F",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    progress: {
        background: "#E0F0F0",
        color: "#2C7A7B",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    review: {
        background: "#FFF1D0",
        color: "#9B7111",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    done: {
        background: "#E3F0E6",
        color: "#3F7650",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    low: {
        background: "#EEF1F0",
        color: "#5E625F",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    medium: {
        background: "#FFF1D0",
        color: "#9B7111",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    high: {
        background: "#FDE7E1",
        color: "#B64A32",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    critical: {
        background: "#F4D7D1",
        color: "#8D2D1E",
        padding: "5px 9px",
        borderRadius: "7px",
        fontSize: "10px",
        fontWeight: 800,
    },

    date: {
        color: "#77736D",
        fontSize: "11px",
    },

    assignee: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        minWidth: "155px",
    },

    avatar: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "#84A98C",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 800,
    },

    assigneeName: {
        fontSize: "12px",
        fontWeight: 750,
        color: "#2D2A26",
    },

    assigneeEmail: {
        fontSize: "10px",
        color: "#77736D",
        marginTop: "2px",
    },

    unassigned: {
        color: "#99958F",
        fontSize: "11px",
        fontStyle: "italic",
    },

    emptyState: {
        textAlign: "center",
        padding: "45px 20px",
        color: "#77736D",
    },

    emptyIcon: {
        width: "50px",
        height: "50px",
        margin: "0 auto 12px",
        borderRadius: "50%",
        background: "#E8F0EC",
        color: "#2C7A7B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
    },

    loadingIcon: {
        width: "50px",
        height: "50px",
        margin: "0 auto 12px",
        borderRadius: "50%",
        background: "#E8F0EC",
        color: "#2C7A7B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
    },
};

export default Dashboard;