"use client";

import { useEffect } from "react";
import Script from "next/script";
import Navbar from "../components/navigation/navbar";
import useAuthStore from "../zustand/authStore";

// Web FCM
import { getToken, onMessage } from "firebase/messaging";
// @ts-ignore
import { messaging } from "../lib/firebase";

// Capacitor
import { Device } from "@capacitor/device";
import { PushNotifications } from "@capacitor/push-notifications";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { fetchSession, user, admin } = useAuthStore();

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);

    const user_id = user?.user_id ?? admin?.id;

    useEffect(() => {
        if (!user_id) return;

        async function setupPush() {
            const info = await Device.getInfo();
            const platform = info.platform; // "web" | "ios" | "android"

            console.log("📱 Running on:", platform);

            if (platform === "web") {
                // -------------------
                // 🔔 Web Push (Firebase)
                // -------------------
                Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                        // @ts-ignore
                        getToken(messaging, {
                            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                        })
                            .then((currentToken) => {
                                if (currentToken) {
                                    fetch("/api/auth/save-fcm-token", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            token: currentToken,
                                            userId: user_id,
                                            platform: "web",
                                        }),
                                    });
                                }
                            })
                            .catch((err) => console.log("Error getting token:", err));
                    }
                });

                // Foreground message listener
                // @ts-ignore
                onMessage(messaging, (payload) => {
                    console.log("📩 Web push received:", payload);
                });
            } else {
                // -------------------
                // 📲 Native Push (Capacitor)
                // -------------------
                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive !== "granted") {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive === "granted") {
                    await PushNotifications.register();
                }

                PushNotifications.addListener("registration", async (token) => {
                    console.log("📲 Push token:", token.value);

                    await fetch("/api/auth/save-fcm-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            token: token.value,
                            userId: user_id,
                            platform,
                        }),
                    });
                });

                PushNotifications.addListener("registrationError", (err) => {
                    console.error("❌ Registration error:", err.error);
                });

                PushNotifications.addListener("pushNotificationReceived", (notification) => {
                    console.log("📩 Push received:", notification);
                });

                PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
                    console.log("👉 Push action performed:", notification.notification);
                });
            }
        }

        setupPush();
    }, [user_id]);

    // Google Maps injection
    useEffect(() => {
        const existingScript = document.getElementById("google-maps");
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`;
            script.id = "google-maps";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
    }, []);

    // -------------------
    // 📌 Facebook SDK injection (Step 1)
    // -------------------
    useEffect(() => {
        if (document.getElementById("facebook-jssdk")) return;

        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            // @ts-ignore
            window.FB?.init({
                appId: process.env.NEXT_PUBLIC_FB_APP_ID, // 👈 Your FB App ID
                autoLogAppEvents: true,
                xfbml: true,
                version: "v19.0",
            });
            console.log("✅ Facebook SDK initialized");
        };
    }, []);

    return (
        <>
            {/* Google Analytics */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
                }}
            />
            <div id="fb-root"></div> {/* Needed for Facebook SDK */}
            <Navbar />
            {children}
        </>
    );
}
