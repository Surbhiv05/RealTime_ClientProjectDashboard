import { useEffect, useState } from "react";

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

function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);
    const [hoveredButton, setHoveredButton] = useState("");

    const role = localStorage.getItem("role");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem("accessToken");

                if (!token) {
                    setError("Please login again.");
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    "`${import.meta.env.VITE_API_URL}/api/projects`/api/projects",
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
                        data.message || "Failed to load projects"
                    );
                }

                setProjects(data.projects || []);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load projects"
                );
            } finally {
                setLoading(false);
            }
        };

        void fetchProjects();
    }, []);

    const createProject = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            setError("");

            const token = localStorage.getItem("accessToken");
            const userId = localStorage.getItem("userId");

            if (!token) {
                setError("Please login again.");
                return;
            }

            if (!userId) {
                setError(
                    "User information not found. Please login again."
                );
                return;
            }

            if (!name.trim()) {
                setError("Project name is required.");
                return;
            }

            const response = await fetch(
                "`${import.meta.env.VITE_API_URL}/api/projects`/api/projects",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim(),
                        managerId: userId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create project"
                );
            }

            setName("");
            setDescription("");
            setShowForm(false);

            const projectsResponse = await fetch(
                "`${import.meta.env.VITE_API_URL}/api/projects`/api/projects",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const projectsData = await projectsResponse.json();

            if (projectsResponse.ok) {
                setProjects(projectsData.projects || []);
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to create project"
            );
        }
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    gap: "16px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            color: "#0F4C5C",
                            fontSize: "32px",
                            fontWeight: 800,
                        }}
                    >
                        Projects
                    </h1>

                    <p
                        style={{
                            color: "#666",
                            marginTop: "6px",
                            marginBottom: 0,
                        }}
                    >
                        Manage and monitor your client projects
                    </p>
                </div>

                {(role === "ADMIN" ||
                    role === "PROJECT_MANAGER") && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            onMouseEnter={() =>
                                setHoveredButton("newProject")
                            }
                            onMouseLeave={() =>
                                setHoveredButton("")
                            }
                            style={{
                                ...styles.primaryButton,
                                ...(hoveredButton === "newProject"
                                    ? styles.primaryButtonHover
                                    : {}),
                            }}
                        >
                            + New Project
                        </button>
                    )}
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={createProject}
                    style={styles.form}
                >
                    <h3 style={styles.formTitle}>
                        Create New Project
                    </h3>

                    <input
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        placeholder="Project name"
                        required
                        style={styles.input}
                    />

                    <textarea
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                        placeholder="Project description"
                        rows={4}
                        style={styles.textarea}
                    />

                    <button
                        type="submit"
                        onMouseEnter={() =>
                            setHoveredButton("createProject")
                        }
                        onMouseLeave={() =>
                            setHoveredButton("")
                        }
                        style={{
                            ...styles.createButton,
                            ...(hoveredButton === "createProject"
                                ? styles.createButtonHover
                                : {}),
                        }}
                    >
                        Create Project
                    </button>
                </form>
            )}

            {loading ? (
                <div style={styles.emptyBox}>
                    <p style={{ color: "#666" }}>
                        Loading projects...
                    </p>
                </div>
            ) : projects.length === 0 ? (
                <div style={styles.emptyBox}>
                    <h3 style={{ color: "#0F4C5C" }}>
                        No projects found
                    </h3>

                    <p style={{ color: "#777" }}>
                        Create your first project to get started.
                    </p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            onMouseEnter={() =>
                                setHoveredProject(project.id)
                            }
                            onMouseLeave={() =>
                                setHoveredProject(null)
                            }
                            style={{
                                ...styles.projectCard,
                                ...(hoveredProject === project.id
                                    ? styles.projectCardHover
                                    : {}),
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                }}
                            >
                                <h3 style={styles.projectTitle}>
                                    {project.name}
                                </h3>

                                <span style={styles.taskBadge}>
                                    {project._count?.tasks || 0} Tasks
                                </span>
                            </div>

                            <p style={styles.description}>
                                {project.description ||
                                    "No description available"}
                            </p>

                            <div style={styles.managerBox}>
                                <small style={styles.managerLabel}>
                                    Project Manager
                                </small>

                                <div style={styles.managerName}>
                                    {project.manager?.name ||
                                        "Not assigned"}
                                </div>

                                {project.manager?.email && (
                                    <small style={styles.email}>
                                        {project.manager.email}
                                    </small>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    primaryButton: {
        backgroundColor: "#0F4C5C",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "12px 18px",
        cursor: "pointer",
        fontWeight: 600,
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
    },

    primaryButtonHover: {
        transform: "translateY(-2px)",
        backgroundColor: "#126276",
        boxShadow: "0 8px 18px rgba(15,76,92,0.20)",
    },

    error: {
        backgroundColor: "#ffe5e5",
        color: "#b00020",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "18px",
    },

    form: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "24px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
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
        fontSize: "14px",
    },

    textarea: {
        width: "100%",
        padding: "12px",
        marginBottom: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxSizing: "border-box",
        resize: "vertical",
        fontSize: "14px",
    },

    createButton: {
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

    createButtonHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 7px 16px rgba(66,48,0,0.18)",
    },

    emptyBox: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        textAlign: "center",
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "18px",
    },

    projectCard: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e5e5e5",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    },

    projectCardHover: {
        transform: "translateY(-4px)",
        borderColor: "#84A98C",
        boxShadow:
            "0 12px 25px rgba(15,76,92,0.13)",
    },

    projectTitle: {
        margin: 0,
        color: "#0F4C5C",
        fontSize: "20px",
        fontWeight: 800,
    },

    taskBadge: {
        backgroundColor: "#84A98C",
        color: "white",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "12px",
        whiteSpace: "nowrap",
    },

    description: {
        color: "#666",
        minHeight: "45px",
        lineHeight: 1.5,
    },

    managerBox: {
        borderTop: "1px solid #eee",
        paddingTop: "12px",
    },

    managerLabel: {
        color: "#777",
    },

    managerName: {
        marginTop: "4px",
        fontWeight: 600,
        color: "#2D2A26",
    },

    email: {
        color: "#888",
    },
};

export default Projects;