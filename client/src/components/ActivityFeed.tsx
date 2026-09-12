import { useEffect, useState } from "react";
import socket from "../lib/socket";

interface Activity {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        role: string;
    };
    project: {
        id: string;
        name: string;
    };
    task?: {
        id: string;
        title: string;
    } | null;
}

const ActivityFeed = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            return;
        }

        const loadActivities = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/activities`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setActivities(data.activities);
                }
            } catch (error) {
                console.error("Failed to load activities:", error);
            } finally {
                setLoading(false);
            }
        };

        const handleNewActivity = (activity: Activity) => {
            setActivities((current) => {
                const exists = current.some(
                    (item) => item.id === activity.id
                );

                if (exists) {
                    return current;
                }

                return [activity, ...current].slice(0, 20);
            });
        };

        loadActivities();

        socket.auth = {
            token,
        };

        socket.connect();

        socket.on("activity:new", handleNewActivity);

        return () => {
            socket.off("activity:new", handleNewActivity);
            socket.disconnect();
        };
    }, []);

    if (loading) {
        return <p>Loading activities...</p>;
    }

    return (
        <div>
            <h2>Live Activity</h2>

            {activities.length === 0 ? (
                <p>No activity yet</p>
            ) : (
                activities.map((activity) => (
                    <div key={activity.id}>
                        <strong>{activity.user.name}</strong>

                        <p>{activity.message}</p>

                        <small>
                            {new Date(activity.createdAt).toLocaleString()}
                        </small>
                    </div>
                ))
            )}
        </div>
    );
};

export default ActivityFeed;