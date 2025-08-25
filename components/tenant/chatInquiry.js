"use client";

import { useState } from "react";
import { io } from "socket.io-client";
import useAuth from "../../hooks/useSession";
import Swal from "sweetalert2";

const ChatInquiry = ({ landlord_id }) => {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [agreementChecked, setAgreementChecked] = useState(false);
    const [socket, setSocket] = useState(() => io("http://localhost:4000", { autoConnect: true }));

    const chat_room = `chat_${[user?.user_id, landlord_id].sort().join("_")}`;
    console.log("Chatroom Generated: ", chat_room);
    const sendMessageToChat = () => {
        if (!user || !landlord_id || message.trim() === "" || !agreementChecked) {
            Swal.fire({
                icon: "warning",
                title: "Incomplete Submission",
                text: "Please enter a message and agree to the terms.",
              });
            return;
        }

        socket.emit("sendMessage", {
            sender_id: user.tenant_id || user.landlord_id,
            sender_type: user.tenant_id ? "tenant" : "landlord",
            receiver_id: landlord_id,
            receiver_type: "landlord",
            message,
            chat_room
        });

        setMessage("");
        Swal.fire({
            icon: "success",
            title: "Message Sent!",
            text: "Your message has been sent to the landlord.",
          });
    };

    return (
        <div className="mt-4">
      <textarea
          className="w-full p-2 border rounded-md"
          placeholder="ex. Is there any discounts?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
      ></textarea>

            <div className="mt-2 flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={agreementChecked}
                    onChange={() => setAgreementChecked(!agreementChecked)}
                />
                <p className="text-xs">
                    I have read and agreed to the{" "}
                    <a href="#" className="text-blue-600">Terms</a>,
                    <a href="#" className="text-blue-600"> Privacy Policy</a>, and
                    <a href="#" className="text-blue-600"> Safety Guidelines</a>.
                </p>
            </div>

            <button
                className={`w-full mt-2 py-2 rounded ${
                    !agreementChecked || message.trim() === "" ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 text-white"
                }`}
                onClick={sendMessageToChat}
                disabled={!agreementChecked || message.trim() === ""}
            >
                Send Message
            </button>
        </div>
    );
};

export default ChatInquiry;
