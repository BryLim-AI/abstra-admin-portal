"use client";

import { COMETCHAT_CONSTANTS } from "./cometchat.config";

export async function loginToCometChat(uid: string, name: string) {
    if (typeof window === "undefined") return; // Don’t run on server

    const { CometChat } = await import("@cometchat/chat-sdk-javascript");

    try {
        return await CometChat.login(uid, COMETCHAT_CONSTANTS.AUTH_KEY);
    } catch (error: any) {
        if (error.code === "ERR_UID_NOT_FOUND") {
            const user = new CometChat.User(uid);
            user.setName(name);
            await CometChat.createUser(user, COMETCHAT_CONSTANTS.AUTH_KEY);
            return await CometChat.login(uid, COMETCHAT_CONSTANTS.AUTH_KEY);
        }
        throw error;
    }
}
