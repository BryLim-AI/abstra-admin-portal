"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/announcement/combined?user_id=${user?.user_id}`
        );
        const sortedAnnouncements = response.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setAnnouncements(sortedAnnouncements);
      } catch (err) {
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user?.user_id]);

  const handleSeeMoreClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  const createExcerpt = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatDate = (dateString) => {
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
    <>
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Announcements</h2>
          <span className="text-sm bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full">
            {announcements.length}
          </span>
        </div>
        {announcements.length === 0 ? (
          <p className="text-gray-600">No announcements available.</p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((announcement) => (
              <li
                key={announcement.unique_id}
                className="p-5 border border-gray-200 rounded-xl shadow-sm bg-gray-50 transition"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  {announcement.title}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {formatDate(announcement.created_at)}
                </p>
                <p className="text-gray-700">
                  {createExcerpt(announcement.message)}
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleSeeMoreClick(announcement)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
                  >
                    See more
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedAnnouncement.title}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {formatDate(selectedAnnouncement.created_at)}
            </p>
            <div className="text-gray-700 prose max-w-none">
              {selectedAnnouncement.message}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
