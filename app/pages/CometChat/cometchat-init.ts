"use client";

import { COMETCHAT_CONSTANTS } from "./cometchat.config";

let initialized = false;

export async function initCometChat() {
    if (!initialized && typeof window !== "undefined") {
        const { CometChat } = await import("@cometchat/chat-sdk-javascript");

        try {
            await CometChat.init(
                COMETCHAT_CONSTANTS.APP_ID,
                new CometChat.AppSettingsBuilder()
                    .subscribePresenceForAllUsers()
                    .setRegion(COMETCHAT_CONSTANTS.REGION)
                    .autoEstablishSocketConnection(true)
                    .build()
            );
            initialized = true;
            console.log("✅ CometChat Initialized");
        } catch (err) {
            console.error("❌ CometChat Init Failed:", err);
        }
    }
}
