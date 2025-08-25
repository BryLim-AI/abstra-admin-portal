"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  { autoConnect: true }
);

export default function ChatComponent({ userId, preselectedChat }) {
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const { user } = useAuthStore();
  //
  // const userId = user?.user_id
console.log('preselectedChat', preselectedChat
);
  useEffect(() => {
    if (preselectedChat) {
      setSelectedChat(preselectedChat);
    }
  }, [preselectedChat]);
console.log('selectedChat', selectedChat);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        console.log("Fetching chats...");
        const response = await axios.get(`/api/chats/getListofChats?userId=${userId}`);
        setChatList(response.data);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    if (userId) fetchChats();
  }, [userId]);


  useEffect(() => {
    if (!selectedChat || !selectedChat.chat_room) {
      console.log("Waiting for user to select a chat...");
      return;
    }

    console.log("Joining chat room:", selectedChat.chat_room);
    socket.emit("joinRoom", { chatRoom: selectedChat.chat_room });

    const handleLoadMessages = (loadedMessages) => {
      console.log("Received messages via WebSocket:", loadedMessages);
      setMessages(loadedMessages);
    };

    const handleReceiveMessage = (newMessage) => {
      console.log("New message received:", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    socket.on("loadMessages", handleLoadMessages);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      console.log("Leaving chat room...");
      socket.emit("leaveRoom", { chatRoom: selectedChat.chat_room });
      socket.off("loadMessages", handleLoadMessages);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [selectedChat]);

  const sendMessage = () => {
    if (!message.trim() || !selectedChat) {
      console.error("No message or chat selected!");
      return;
    }

    if (!user) {
      console.error("Error: User session not available.");
      return;
    }

    const senderType = user.tenant_id ? "tenant" : "landlord";
    const senderId =
      senderType === "tenant" ? user.tenant_id : user.landlord_id;
    const receiverId =
      senderType === "tenant"
        ? selectedChat.landlord_id
        : selectedChat.tenant_id;
    const receiverType = senderType === "tenant" ? "landlord" : "tenant";

    console.log(
      `Sender: ${senderId}, Receiver: ${receiverId}, Room: ${selectedChat.chat_room}`
    );

    const newMessage = {
      sender_id: senderId,
      sender_type: senderType,
      receiver_id: receiverId,
      receiver_type: receiverType,
      message,
      chat_room: selectedChat.chat_room,
    };

    try {
      socket.emit("sendMessage", newMessage, (ack) => {
        console.log("Message sent successfully:", ack);
      });
    } catch (error) {
      console.error("Error sending message via WebSocket:", error);
    }

    setMessage("");
  };

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 h-screen w-full p-0">
      <div className="w-full lg:w-1/3 bg-white p-4 rounded-none lg:rounded-lg shadow-md overflow-y-auto h-[40vh] lg:h-full border-r">
        <h1 className="text-xl font-semibold mb-4">Chats</h1>
        {chatList.length === 0 ? (
          <p className="text-center text-gray-500">No chats available</p>
        ) : (
          <ul className="space-y-1">
            {chatList.map((chat) => (
              <li
                key={chat.chat_room}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${
                  selectedChat?.chat_room === chat.chat_room
                    ? "bg-blue-500 text-white font-semibold"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="truncate">
                  <p className="font-semibold">{chat.name}</p>
                  <p className="text-sm text-gray-500 truncate w-40">
                    {chat.lastMessage || "No messages yet"}
                  </p>
                </div>
                <span className="text-xs text-gray-400">🗨️</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex-1 bg-white p-4 lg:rounded-lg shadow-md flex flex-col h-[60vh] lg:h-full w-full">
        {selectedChat ? (
          <>
            <h2 className="text-lg font-semibold mb-3 border-b pb-2">
              Chat with {selectedChat.name}
            </h2>

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet</p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-end space-x-2 ${
                      msg.sender_id === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender_id !== userId && (
                      <img
                        src={msg.profilePicture}
                        alt="User profile"
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
                      />
                    )}
                    <div
                      className={`px-4 py-2 max-w-[75%] lg:max-w-xs text-white rounded-lg shadow-md relative text-sm ${
                        msg.sender_id === userId ? "bg-blue-500" : "bg-gray-700"
                      }`}
                    >
                      {msg.message}
                      <span className="block text-xs text-gray-300 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2 flex items-center gap-2 border-t mt-2 bg-white sticky bottom-0 w-full">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 flex-1 flex items-center justify-center">
            Select a chat to start messaging
          </p>
        )}
      </div>
    </div>
  );
}
