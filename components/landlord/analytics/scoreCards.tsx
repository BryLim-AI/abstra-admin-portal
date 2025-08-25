"use client";
import React from "react";
// @ts-ignore
const ScoreCard = ({ title, value, borderColor = "green" }) => {
  const borderColorClass = {
    green: "border-green-500",
    blue: "border-blue-500",
    red: "border-red-500",
    yellow: "border-yellow-500",
    purple: "border-purple-500",
    gray: "border-gray-500",
  }[borderColor] || "border-gray-300";

  return (
    <div
      className={`p-5 bg-white rounded-xl shadow-sm border-l-4 ${borderColorClass} transition-all hover:shadow-md`}
    >
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value ?? 0}</p>
    </div>
  );
};

export default ScoreCard;
