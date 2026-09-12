import { useEffect, useRef, useState } from "react";
import socket from "../lib/socket";

interface Notification {
    id: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredNotification, setHoveredNotification] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) return;

        const loadNotifications = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/notifications`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setNotifications(data.notifications);
                    setUnreadCount(data.unreadCount);
                }
            } catch (error) {
                console.error(
                    "Failed to load notifications:",
                    error
                );
            }
        };

        const handleNewNotification = (
            notification: Notification
        ) => {
            setNotifications((current) => {
                const exists = current.some(
                    (item) => item.id === notification.id
                );

                if (exists) return current;

                return [notification, ...current].slice(0, 20);
            });

            setUnreadCount((count) => count + 1);
        };

        loadNotifications();

        socket.on(
            "notification:new",
            handleNewNotification
        );

        return () => {
            socket.off(
                "notification:new",
                handleNewNotification
            );
        };
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener(
                "mousedown",
                handleOutsideClick
            );
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, [isOpen]);

    const markAsRead = async (
        notificationId: string
    ) => {
        const token = localStorage.getItem("accessToken");

        if (!token) return;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setNotifications((current) =>
                    current.map((notification) =>
                        notification.id === notificationId
                            ? {
                                ...notification,
                                isRead: true,
                            }
                            : notification
                    )
                );

                setUnreadCount((count) =>
                    Math.max(0, count - 1)
                );
            }
        } catch (error) {
            console.error(
                "Failed to mark notification as read:",
                error
            );
        }
    };

    return (
        <div
            ref={containerRef}
            style={styles.container}
        >
            <button
                onClick={() =>
                    setIsOpen((open) => !open)
                }
                style={styles.bellButton}
            >
                🔔

                {unreadCount > 0 && (
                    <span style={styles.badge}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.header}>
                        <h3 style={styles.title}>
                            Notifications
                        </h3>

                        {unreadCount > 0 && (
                            <span style={styles.unread}>
                                {unreadCount} unread
                            </span>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div style={styles.empty}>
                            <div style={styles.emptyIcon}>
                                🔔
                            </div>

                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div style={styles.list}>
                            {notifications.map(
                                (notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => {
                                            if (
                                                !notification.isRead
                                            ) {
                                                markAsRead(
                                                    notification.id
                                                );
                                            }
                                        }}
                                        onMouseEnter={() =>
                                            setHoveredNotification(
                                                notification.id
                                            )
                                        }
                                        onMouseLeave={() =>
                                            setHoveredNotification(
                                                null
                                            )
                                        }
                                        style={{
                                            ...styles.notification,
                                            background:
                                                notification.isRead
                                                    ? "#FFFFFF"
                                                    : hoveredNotification ===
                                                        notification.id
                                                        ? "#E4F1EC"
                                                        : "#F0F7F4",
                                            cursor:
                                                notification.isRead
                                                    ? "default"
                                                    : "pointer",
                                            transform:
                                                hoveredNotification ===
                                                    notification.id
                                                    ? "translateX(2px)"
                                                    : "translateX(0)",
                                        }}
                                    >
                                        <div
                                            style={
                                                styles.notificationDot
                                            }
                                        />

                                        <div
                                            style={
                                                styles.notificationContent
                                            }
                                        >
                                            <p
                                                style={
                                                    styles.message
                                                }
                                            >
                                                {
                                                    notification.message
                                                }
                                            </p>

                                            <small
                                                style={
                                                    styles.time
                                                }
                                            >
                                                {new Date(
                                                    notification.createdAt
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </small>

                                            {!notification.isRead && (
                                                <span
                                                    style={
                                                        styles.clickText
                                                    }
                                                >
                                                    Click to mark as
                                                    read
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        position: "relative",
        display: "inline-block",
    },

    bellButton: {
        position: "relative",
        width: "44px",
        height: "44px",
        border: "1px solid #DCE4DE",
        borderRadius: "12px",
        background: "#FFFFFF",
        fontSize: "19px",
        cursor: "pointer",
        boxShadow:
            "0 5px 15px rgba(15, 76, 92, 0.08)",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },

    badge: {
        position: "absolute",
        top: "-6px",
        right: "-6px",
        minWidth: "19px",
        height: "19px",
        padding: "0 5px",
        borderRadius: "20px",
        background: "#F4C95D",
        color: "#423000",
        fontSize: "10px",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #FFFFFF",
    },

    dropdown: {
        position: "absolute",
        top: "52px",
        right: "0",
        width: "360px",
        maxHeight: "430px",
        overflowY: "auto",
        background: "#FFFFFF",
        border: "1px solid #DCE4DE",
        borderRadius: "16px",
        boxShadow:
            "0 15px 40px rgba(15, 76, 92, 0.15)",
        zIndex: 1000,
    },

    header: {
        padding: "17px 18px",
        borderBottom: "1px solid #E8ECE9",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    title: {
        margin: 0,
        color: "#0F4C5C",
        fontSize: "17px",
        fontWeight: 800,
    },

    unread: {
        background: "#E8F0EC",
        color: "#2C7A7B",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: 700,
    },

    list: {
        display: "flex",
        flexDirection: "column",
    },

    notification: {
        display: "flex",
        gap: "11px",
        padding: "15px 17px",
        borderBottom: "1px solid #EEF1EF",
        transition:
            "background 0.2s ease, transform 0.2s ease",
    },

    notificationDot: {
        width: "8px",
        height: "8px",
        minWidth: "8px",
        borderRadius: "50%",
        background: "#2C7A7B",
        marginTop: "5px",
    },

    notificationContent: {
        flex: 1,
    },

    message: {
        margin: 0,
        color: "#2D2A26",
        fontSize: "13px",
        lineHeight: 1.45,
        fontWeight: 600,
    },

    time: {
        display: "block",
        marginTop: "6px",
        color: "#88847E",
        fontSize: "10px",
    },

    clickText: {
        display: "block",
        marginTop: "6px",
        color: "#0F4C5C",
        fontSize: "10px",
        fontWeight: 800,
    },

    empty: {
        textAlign: "center",
        padding: "45px 20px",
        color: "#77736D",
    },

    emptyIcon: {
        fontSize: "28px",
        marginBottom: "8px",
    },
};

export default NotificationBell;