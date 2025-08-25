"use client";

import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Device } from "@capacitor/device";

export default function PushInit() {
    useEffect(() => {
        async function setupPush() {
            try {
                // Detect platform (android, ios, web)
                const info = await Device.getInfo();
                const platform = info.platform; // "ios" | "android" | "web"

                console.log("📱 Running on:", platform);

                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive !== "granted") {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive === "granted") {
                    await PushNotifications.register();
                }

                // Registration success → get FCM token
                PushNotifications.addListener("registration", async (token) => {
                    console.log("📲 Push token:", token.value);

                    try {
                        await fetch("/api/fcm/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId: 123, // TODO: replace with logged-in user ID
                                token: token.value,
                                platform, // save whether it's android/ios/web
                            }),
                        });
                    } catch (err) {
                        console.error("Error sending token to backend:", err);
                    }
                });

                PushNotifications.addListener("registrationError", (err) => {
                    console.error("Push registration error:", err.error);
                });

                PushNotifications.addListener("pushNotificationReceived", (notification) => {
                    console.log("Push received:", notification);
                });

                PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
                    console.log("Push action performed:", notification.notification);
                });
            } catch (err) {
                console.error("Push setup error", err);
            }
        }

        setupPush();
    }, []);

    return null; // nothing to render
}
