"use client";

import io from "socket.io-client";
import ChatComponent from "../../../../components/chat/chat";
import useAuthStore from "../../../../zustand/authStore";
import { useChatStore } from "../../../../zustand/chatStore";

const socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
);

export default function TenantChatPage() {
    const { user } = useAuthStore();
    const { preselectedChat } = useChatStore();

    const userId = user?.user_id;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-xl font-semibold mb-4">Chat List</h1>
            <ChatComponent userId={userId} preselectedChat={preselectedChat} />
        </div>
    );
}
