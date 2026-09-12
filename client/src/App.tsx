import { useState } from "react";
import Login from "./components/Login";
import ActivityFeed from "./components/ActivityFeed";
import NotificationBell from "./components/NotificationBell";
import Dashboard from "./components/Dashboard";
import Projects from "./components/Projects";
import Tasks from "./components/Tasks";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

interface TokenPayload {
  userId: string;
  role: UserRole;
}

const getUserRole = (): UserRole | "" => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return "";
  }

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    ) as TokenPayload;

    return payload.role || "";
  } catch {
    return "";
  }
};

function App() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [hoveredMenu, setHoveredMenu] =
    useState<string | null>(null);

  const token =
    localStorage.getItem("accessToken");

  if (!token) {
    return <Login />;
  }

  const userRole = getUserRole();

  const roleInfo = {
    ADMIN: {
      badge: "ADMIN",
      icon: "🛡️",
    },

    PROJECT_MANAGER: {
      badge: "PROJECT MANAGER",
      icon: "📊",
    },

    DEVELOPER: {
      badge: "DEVELOPER",
      icon: "💻",
    },
  };

  const currentRole =
    roleInfo[userRole as UserRole] || {
      badge: "USER",
      icon: "👤",
    };

  const menuItems = [
    {
      name: "Dashboard",
      icon: "📊",
    },
    {
      name: "Projects",
      icon: "📁",
    },
    {
      name: "Tasks",
      icon: "✓",
    },
    {
      name: "Activity",
      icon: "⚡",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F6F1E9",
      }}
    >
      <div
        style={{
          width: "220px",
          backgroundColor: "#0F4C5C",
          padding: "24px 16px",
          color: "white",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              backgroundColor:
                "rgba(255,255,255,0.12)",
              padding: "7px 11px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            <span>
              {currentRole.icon}
            </span>

            <span>
              {currentRole.badge}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {menuItems.map((item) => {
            const isActive =
              activePage === item.name;

            const isHovered =
              hoveredMenu === item.name;

            return (
              <button
                key={item.name}
                onClick={() =>
                  setActivePage(
                    item.name
                  )
                }
                onMouseEnter={() =>
                  setHoveredMenu(
                    item.name
                  )
                }
                onMouseLeave={() =>
                  setHoveredMenu(null)
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: isHovered &&
                    !isActive
                    ? "1px solid rgba(255,255,255,0.25)"
                    : "1px solid transparent",
                  borderRadius: "9px",
                  backgroundColor:
                    isActive
                      ? "#FFFFFF"
                      : isHovered
                        ? "rgba(255,255,255,0.10)"
                        : "transparent",
                  color: isActive
                    ? "#0F4C5C"
                    : "#FFFFFF",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "15px",
                  fontWeight: isActive
                    ? 700
                    : 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transform:
                    isHovered &&
                      !isActive
                      ? "translateX(3px)"
                      : "translateX(0)",
                  transition:
                    "all 0.2s ease",
                }}
              >
                <span>
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "20px",
            borderTop:
              "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Welcome back!
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "12px 24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <NotificationBell />
        </div>

        {activePage === "Dashboard" && (
          <Dashboard />
        )}

        {activePage === "Projects" && (
          <Projects />
        )}

        {activePage === "Tasks" && <Tasks />}

        {activePage === "Activity" && (
          <ActivityFeed />
        )}
      </div>
    </div>
  );
}

export default App;