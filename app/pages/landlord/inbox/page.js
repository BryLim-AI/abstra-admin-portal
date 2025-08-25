"use client";

import { useState, useEffect, useCallback } from "react";
import useAuth from "../../../../hooks/useSession";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Filter,
} from "lucide-react";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";

// Enhanced Notification Item Component for Full Page
const EnhancedNotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";

    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "info":
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (type) => {
    switch (type) {
      case "urgent":
        return "border-l-red-500 bg-red-50";
      case "success":
        return "border-l-green-500 bg-green-50";
      case "info":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-300 bg-gray-50";
    }
  };

  return (
    <div
      className={`group relative border-l-4 rounded-lg p-4 mb-3 transition-all duration-200 hover:shadow-md ${
        !notification.is_read
          ? `${getPriorityColor(notification.type)} shadow-sm`
          : "border-l-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3
                  className={`text-sm font-medium text-gray-900 ${
                    !notification.is_read ? "font-semibold" : ""
                  }`}
                >
                  {notification.title}
                </h3>
                {!notification.is_read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                {notification.body}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(
                      notification.created_at || notification.timestamp
                    )}
                  </span>

                  {notification.type && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        notification.type === "urgent"
                          ? "bg-red-100 text-red-700"
                          : notification.type === "success"
                          ? "bg-green-100 text-green-700"
                          : notification.type === "info"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {notification.type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!notification.is_read && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="p-2 hover:bg-blue-100 rounded-full transition-colors duration-200"
                  title="Mark as read"
                >
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </button>
              )}

              <button
                onClick={() => onDelete(notification.id)}
                className="p-2 hover:bg-red-100 rounded-full transition-colors duration-200"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LandlordNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const { user } = useAuth();

  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      if (!user || !user.user_id) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const userId = encodeURIComponent(user.user_id);
        const response = await fetch(
          `/api/notification/getNotifications?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(
            `Server responded with ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        const notificationsArray = Array.isArray(data) ? data : [];

        // Sort by date (newest first)
        const sortedNotifications = notificationsArray.sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp) -
            new Date(a.created_at || a.timestamp)
        );

        setNotifications(sortedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications: " + err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications based on selected filter
  useEffect(() => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = notifications.filter((n) => !n.is_read);
    } else if (filter === "read") {
      filtered = notifications.filter((n) => n.is_read);
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch("/api/notification/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      const response = await fetch("/api/notification/mark-all-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: unreadNotifications.map((n) => n.id),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`/api/notification/delete/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <LandlordLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your notifications and stay updated
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}

              <button
                onClick={() => fetchNotifications(true)}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                title="Refresh notifications"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Filter and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-100">
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: "all", label: "All", count: notifications.length },
                { key: "unread", label: "Unread", count: unreadCount },
                {
                  key: "read",
                  label: "Read",
                  count: notifications.length - unreadCount,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    filter === tab.key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse border-l-4 border-gray-200 rounded-lg p-4"
                >
                  <div className="flex space-x-4">
                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error loading notifications
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchNotifications(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "unread"
                  ? "No unread notifications"
                  : filter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </h3>
              <p className="text-gray-600">
                {filter === "all" &&
                  "You'll see notifications here when you receive them"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <EnhancedNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
}
