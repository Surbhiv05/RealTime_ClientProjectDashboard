interface SidebarProps {
    activePage: string;
    onPageChange: (page: string) => void;
}

const Sidebar = ({
    activePage,
    onPageChange,
}: SidebarProps) => {
    const menuItems = [
        {
            name: "Dashboard",
            icon: "▦",
        },
        {
            name: "Projects",
            icon: "◫",
        },
        {
            name: "Tasks",
            icon: "✓",
        },
        {
            name: "Activity",
            icon: "◷",
        },
    ];

    return (
        <aside
            style={{
                width: "240px",
                minHeight: "100vh",
                backgroundColor: "#0F4C5C",
                color: "#FFFFFF",
                padding: "24px 16px",
                boxSizing: "border-box",
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: "0 12px",
                    marginBottom: "35px",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: "20px",
                    }}
                >
                    ProjectFlow
                </h2>

                <p
                    style={{
                        margin: "5px 0 0",
                        fontSize: "12px",
                        opacity: 0.75,
                    }}
                >
                    Client Project Dashboard
                </p>
            </div>

            {/* Navigation */}
            <nav>
                {menuItems.map((item) => {
                    const isActive =
                        activePage === item.name;

                    return (
                        <button
                            key={item.name}
                            onClick={() =>
                                onPageChange(item.name)
                            }
                            style={{
                                width: "100%",
                                border: "none",
                                borderRadius: "10px",
                                padding: "13px 14px",
                                marginBottom: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                cursor: "pointer",
                                textAlign: "left",
                                fontSize: "14px",
                                backgroundColor:
                                    isActive
                                        ? "#2C7A7B"
                                        : "transparent",
                                color: "#FFFFFF",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "17px",
                                }}
                            >
                                {item.icon}
                            </span>

                            {item.name}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;