"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import useAuthStore from "../../../../zustand/authStore";
import ReceivedMessagesLandlord from "../../../../components/chat/landlordChats";
import ChatComponent from "../../../../components/chat/chat";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";


const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

export default function LandlordChatPage() {
    const { user, admin, fetchSession, loading } = useAuthStore();
    const userId = user?.user_id;
    return (
        <LandlordLayout>
        <div className="h-screen flex flex-col bg-gray-100 p-4">
            <ChatComponent userId={userId}/>
        </div>
        </LandlordLayout>
    );
}
