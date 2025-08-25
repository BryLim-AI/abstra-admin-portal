import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
);

export default function ReceivedMessagesLandlord() {
  const [receivedMessages, setReceivedMessages] = useState([]);
  const { user } = useAuthStore();

  const landlordId = user?.user_id;

  useEffect(() => {
    if (!landlordId) return;

    const fetchReceivedMessages = async () => {
      try {
        const response = await axios.get(
          `/api/chats/landlord/getMessages?landlordId=${landlordId}`
        );
        setReceivedMessages(response.data);
      } catch (error) {
        console.error("Error fetching received messages:", error);
      }
    };

    fetchReceivedMessages();

    socket.on("receiveMessage", (newMessage) => {
      if (newMessage.receiver_id === landlordId) {
        setReceivedMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [landlordId]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full bg-white p-4 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-4">Received Messages</h1>
        {receivedMessages.length === 0 ? (
          <p className="text-center text-gray-500">No received messages</p>
        ) : (
          <div className="space-y-4">
            {receivedMessages.map((msg, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">From: {msg.senderName}</p>
                <p className="text-md font-semibold">{msg.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
