"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaSearch,
  FaPaperclip,
  FaPaperPlane,
} from "react-icons/fa";

const MessageBubble = ({ text, isUser, time }) => {
  return (
    <div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-2`}
    >
      <div
        className={`max-w-[80%]  p-3 rounded-lg ${
          isUser ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        {text}
      </div>
      <span className="text-gray-500 text-xs mt-1">{time}</span>
    </div>
  );
};

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <span className="text-sm">Typing...</span>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce mr-1"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-100"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-200"></div>
    </div>
  );
};

const Messages = () => {
  const [activeTab, setActiveTab] = useState("messages"); // Active tab state

  const messages = [
    {
      text: "Hi Jake! I have enabled you to apply for this unit! I will send you a link shortly.",
      isUser: false,
      time: "5min ago",
    },
    {
      text: "Thank you, We will be reviewing your documents shortly!",
      isUser: false,
      time: "5min ago",
    },
    {
      text: "Hi I'm Jake Lee. I would like to inquire for an Inquiry.",
      isUser: true,
      time: "5min ago",
    },
    {
      text: "Sure! I have now submitted all of the needed.",
      isUser: true,
      time: "5min ago",
    },
    {
      text: "Thanks!",
      isUser: true,
      time: "5min ago",
    },
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="bg-gray-50 w-80 border-r border-gray-200 p-4 flex flex-col">
        {/* Back button */}
        <div className="mb-2">
          <Link href="/">
            <FaArrowLeft className="text-xl cursor-pointer" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => handleTabClick("messages")}
            className={`py-2 px-4 rounded-l-md ${
              activeTab === "messages"
                ? "bg-blue-800 text-white"
                : "text-gray-700"
            }`}
          >
            Messages
          </button>
          <Link href="/pages/tenant/notifications">
            <button
              onClick={() => handleTabClick("notifications")}
              className={`py-2 px-4 rounded-r-md ${
                activeTab === "notifications"
                  ? "bg-blue-800 text-white"
                  : "text-gray-700"
              }`}
            >
              Notification
            </button>
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-white border border-gray-300 rounded p-2 pl-10 text-sm"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="text-gray-500" />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex items-center cursor-pointer hover:bg-gray-100 p-3 rounded-md">
          <div className="relative mr-3">
            <div className="w-10 h-10 rounded-full bg-pink-200"></div>
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-medium text-gray-800">Jun - Ki</span>
              <span className="text-gray-500 text-sm">5min ago</span>
            </div>
            <TypingIndicator />
          </div>
          <div className="relative ml-2">
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full">
              4
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white p-4">
        {/* Header */}
        <div className="flex items-center border-b border-gray-200 p-2 mb-4">
          <div className="relative mr-3">
            <div className="w-10 h-10 rounded-full bg-pink-200"></div>
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Jun - Ki</h2>
            <p className="text-gray-500 text-sm">XYZ Residence . Landlord</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 mb-5">
          <span className="text-center block text-gray-500 text-xs">Today</span>
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              text={message.text}
              isUser={message.isUser}
              time={message.time}
            />
          ))}
        </div>

        {/* Message Input Area */}
        <div className="border-t border-gray-200 p-2 mt-auto">
          <div className="flex items-center">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer">
                <FaPaperclip />
              </div>
              <input
                type="text"
                placeholder="Enter your message"
                className="w-full bg-white border border-gray-300 rounded p-2 pl-10 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="ml-2 text-blue-700 p-2 rounded-full hover:bg-blue-100">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
