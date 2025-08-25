"use client";

import { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
// @ts-ignore
import { messaging } from "@/lib/firebase";
import { Capacitor } from "@capacitor/core";

interface NotificationManagerProps {
    user_id: string;
}

export default function NotificationManager({ user_id }: NotificationManagerProps) {
    const [active, setActive] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [platform, setPlatform] = useState<"web" | "android" | "ios">("web");
    const [loading, setLoading] = useState(true);

    // Detect platform
    useEffect(() => {
        const capPlatform = Capacitor.getPlatform();
        if (capPlatform === "android") setPlatform("android");
        else if (capPlatform === "ios") setPlatform("ios");
        else setPlatform("web");
    }, []);

    // Get existing notification status + token
    useEffect(() => {
        if (!user_id || !platform) return;

        fetch(`/api/auth/save-fcm-token/notification-status?user_id=${user_id}&platform=${platform}`)
            .then((res) => res.json())
            .then((data) => {
                if (typeof data.status === "boolean") setActive(data.status);
                if (data.token) setToken(data.token);
            })
            .catch((err) => console.log("Error fetching FCM status:", err))
            .finally(() => setLoading(false));
    }, [user_id, platform]);

    // Toggle push notifications
    const handleToggle = async () => {
        const newActive = !active;

        if (newActive && !token) {
            // Only generate token when enabling notifications and none exists
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                // @ts-ignore
                const newToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                });
                if (newToken) {
                    setToken(newToken);
                } else {
                    console.error("Failed to get FCM token");
                    return;
                }
            } else {
                console.warn("Notification permission denied");
                return;
            }
        }

        setActive(newActive); // Optimistic UI update

        try {
            await fetch("/api/auth/save-fcm-token/toggle-notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user_id,
                    token,
                    platform,
                    active: newActive,
                }),
            });
        } catch (err) {
            console.error("Error updating notification status:", err);
            setActive(!newActive); // revert if failed
        }
    };

    if (loading) {
        return <p className="text-gray-500">Loading notification settings...</p>;
    }

    return (
        <label className="flex items-center cursor-pointer space-x-3">
            <div className="relative">
                <input
                    type="checkbox"
                    checked={active}
                    onChange={handleToggle}
                    className="sr-only"
                />
                <div
                    className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                        active ? "bg-blue-600" : "bg-gray-300"
                    }`}
                ></div>
                <div
                    className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-300 ${
                        active ? "translate-x-6" : "translate-x-0"
                    }`}
                ></div>
            </div>
            <span className="text-gray-700 font-medium">
                Push Notifications ({platform}) {active ? "ON" : "OFF"}
            </span>
        </label>
    );
}
