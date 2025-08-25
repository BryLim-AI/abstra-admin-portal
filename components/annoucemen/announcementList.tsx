"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";

export default function Announcements({ user_id, agreement_id }: { user_id: number; agreement_id?: number }) {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchAnnouncements = async () => {
    try {
      const queryParams = new URLSearchParams({ user_id: user_id.toString() });
      if (agreement_id) queryParams.append("agreement_id", agreement_id.toString());

      const response = await axios.get(
        `/api/tenant/announcement/allAnnouncements?${queryParams.toString()}`
      );

      const sortedAnnouncements = response.data.sort(
          // @ts-ignore
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setAnnouncements(sortedAnnouncements);
    } catch (err) {
      // @ts-ignore
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  if (user_id) fetchAnnouncements();
}, [user_id, agreement_id]);


  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading)
    return (
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full flex justify-center items-center">
        <div className="animate-pulse text-gray-500">
          Loading announcements...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Announcements</h2>
        <span className="text-sm bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full">
          {announcements.length}
        </span>
      </div>
      {announcements.length === 0 ? (
        <p className="text-gray-600">No announcements available.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <li
                key={announcement?.unique_id}
              className="p-5 border border-gray-200 rounded-xl shadow-sm bg-gray-50 transition"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {announcement?.title}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {formatDate(announcement?.created_at)}
              </p>
              <div className="text-gray-700 prose max-w-none">
                // @ts-ignore
                {announcement?.message}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
