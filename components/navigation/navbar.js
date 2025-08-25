"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CiBellOn } from "react-icons/ci";
import useAuthStore from "../../zustand/authStore";
import axios from "axios";
import { useRouter } from "next/navigation";

// Enhanced Notification Hook
const useNotifications = (user, admin) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const lastFetchRef = useRef(0);

  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      if (!user && !admin) return;

      const userId = user?.user_id || admin?.admin_id;
      if (!userId) return;

      // Prevent too frequent calls
      const now = Date.now();
      if (now - lastFetchRef.current < 5000) return; // 5 second cooldown
      lastFetchRef.current = now;

      if (showLoading) setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/notification/getNotifications?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }

        const data = await response.json();

        // Sort notifications by date (newest first)
        const sortedNotifications = data.sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp) -
            new Date(a.created_at || a.timestamp)
        );

        setNotifications(sortedNotifications);

        // Calculate unread count
        const unread = sortedNotifications.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [user, admin]
  );

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchNotifications();

    // Set up periodic refresh (every 30 seconds)
    intervalRef.current = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch("/api/notification/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
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

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [notifications]);

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        const response = await fetch(
          `/api/notification/delete/${notificationId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          const deletedNotification = notifications.find(
            (n) => n.id === notificationId
          );
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );

          if (deletedNotification && !deletedNotification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

// Enhanced Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onDelete, onClick }) => {
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

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      className={`relative group hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
        !notification.is_read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      onClick={handleClick}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  notification.is_read ? "bg-gray-300" : "bg-blue-500"
                }`}
              ></div>
              <p
                className={`text-sm font-medium text-gray-900 truncate ${
                  !notification.is_read ? "font-semibold" : ""
                }`}
              >
                {notification.title}
              </p>
            </div>

            <p className="text-xs text-gray-600 mt-1 line-clamp-2 ml-4">
              {notification.body}
            </p>

            <div className="flex items-center justify-between mt-2 ml-4">
              <p className="text-xs text-gray-400">
                {formatTimeAgo(
                  notification.created_at || notification.timestamp
                )}
              </p>

              {notification.type && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    notification.type === "urgent"
                      ? "bg-red-100 text-red-700"
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

          {/* Action buttons - shown on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1 ml-2">
            {!notification.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="p-1 hover:bg-blue-100 rounded-full transition-colors duration-200"
                title="Mark as read"
              >
                <svg
                  className="w-3 h-3 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
              title="Delete notification"
            >
              <svg
                className="w-3 h-3 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Desktop Notification Dropdown
const NotificationDropdown = ({
  notifications,
  unreadCount,
  loading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
  user,
}) => {
  const [filter, setFilter] = useState("all"); // all, unread, read

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.is_read;
    if (filter === "read") return notification.is_read;
    return true;
  });

  return (
    <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-white text-black rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-gray-800 font-bold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50"
            title="Refresh notifications"
          >
            <svg
              className={`w-4 h-4 text-gray-600 ${
                loading ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200 px-2 py-1 hover:bg-blue-50 rounded"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      {notifications.length > 0 && (
        <div className="flex border-b border-gray-200">
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
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                filter === tab.key
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-4 text-center">
            <div className="text-red-500 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={onRefresh}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : loading && notifications.length === 0 ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-6 text-gray-600 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <CiBellOn className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium mb-1">
              {filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                ? "No read notifications"
                : "No notifications yet"}
            </p>
            <p className="text-xs text-gray-500">
              {filter === "all" &&
                "You'll see notifications here when you receive them"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <Link
            href={`/pages/${user?.userType}/inbox`}
            className="block text-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 py-1 hover:bg-blue-50 rounded"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

// Enhanced Mobile Notification Dropdown
const MobileNotificationDropdown = ({
  notifications,
  unreadCount,
  loading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
  onClose,
  user,
}) => {
  return (
    <div className="md:hidden fixed top-14 sm:top-16 left-0 right-0 bg-white text-black shadow-lg z-40 max-h-96 flex flex-col border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-gray-800 font-bold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <svg
              className={`w-4 h-4 text-gray-600 ${
                loading ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
      </div>

      {/* Quick actions */}
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            Mark all {unreadCount} as read
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : loading && notifications.length === 0 ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-gray-600 text-center">
            <CiBellOn className="w-10 h-10 text-gray-400 mb-2 mx-auto" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <Link
            href={`/pages/${user?.userType}/inbox`}
            className="block text-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 py-2"
            onClick={onClose}
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
};

// Enhanced Notification Section Component
const NotificationSection = ({ user, admin }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user, admin);

  const [notifOpen, setNotifOpen] = useState(false);
  const notificationRef = useRef(null);

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const handleToggleNotifications = () => {
    setNotifOpen(!notifOpen);
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop Notification Button */}
      <div className="hidden md:block relative" ref={notificationRef}>
        <button
          onClick={handleToggleNotifications}
          className="relative focus:outline-none p-2 hover:bg-blue-600 rounded-full transition-all duration-200 group"
          aria-label="Notifications"
        >
          <CiBellOn className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {loading && (
            <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>

        {notifOpen && (
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            error={error}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
            onRefresh={handleRefresh}
            user={user}
          />
        )}
      </div>

      {/* Mobile Notification Button */}
      <div className="md:hidden relative">
        <button
          onClick={handleToggleNotifications}
          className="relative focus:outline-none p-2 hover:bg-blue-600 rounded-full transition-colors duration-200"
          aria-label="Notifications"
        >
          <CiBellOn className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Notification Dropdown */}
      {notifOpen && (
        <MobileNotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          error={error}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onRefresh={handleRefresh}
          onClose={() => setNotifOpen(false)}
          user={user}
        />
      )}
    </>
  );
};

// Main Navbar Component
const Navbar = () => {
  const { user, admin, loading, signOut, signOutAdmin, fetchSession } =
    useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasLease, setHasLease] = useState(null);
  const router = useRouter();

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  // Check tenant if have existing lease
  useEffect(() => {
    if (user?.userType === "tenant" && user?.tenant_id) {
      const fetchLeaseStatus = async () => {
        try {
          const res = await axios.get(
            `/api/leaseAgreement/checkCurrentLease?tenant_id=${user?.tenant_id}`
          );
          setHasLease(res?.data?.hasLease);
        } catch (error) {
          console.error("Error fetching lease status:", error);
          setHasLease(false);
        }
      };
      fetchLeaseStatus();
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.classList.contains("mobile-menu-button") &&
        !event.target.closest(".mobile-menu-button")
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    if (admin) {
      await signOutAdmin();
      router.push("/pages/admin_login");
    } else {
      await signOut();
      router.push("/pages/auth/login");
    }
    setDropdownOpen(false);
  };

  const getNavigationLinks = () => {
    if (admin) {
      return [{ href: "/pages/system_admin/dashboard", label: "Dashboard" }];
    }

    if (!user) {
      return [
        { href: "/pages/about-us", label: "About Us" },
        { href: "/pages/find-rent", label: "Find Rent" },
        { href: "/pages/partner", label: "Partner" },
        { href: "/pages/contact-us", label: "Contact Us" },
      ];
    }

    if (user?.userType === "tenant") {
      return [
        { href: "/pages/tenant/my-unit", label: "My Unit" },
        { href: "/pages/find-rent", label: "Find Rent" },
        { href: "/pages/tenant/visit-history", label: "My Bookings" },
        { href: "/pages/tenant/chat", label: "Chat" },
      ];
    }

    if (user?.userType === "landlord") {
      return [
        { href: "/pages/landlord/inbox", label: "Inbox" },
        { href: "/pages/landlord/dashboard", label: "Dashboard" },
      ];
    }

    return [];
  };

  const navigationLinks = getNavigationLinks();

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - Responsive sizing */}
            <Link
              href={
                user?.userType === "tenant"
                  ? "/"
                  : user?.userType === "landlord"
                  ? "/pages/landlord/dashboard"
                  : "/"
              }
              className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center space-x-1 sm:space-x-2 transition-transform duration-300 hover:scale-105 flex-shrink-0"
            >
              <Image
                src="/Hestia-logo.svg"
                alt="Hestia Logo"
                width={130}
                height={32}
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4 lg:space-x-6 ml-auto mr-4 lg:mr-6">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative py-5 px-2 lg:px-3 font-medium hover:text-white text-blue-50 transition-all duration-200 group text-sm lg:text-base"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center w-10 sm:w-14 h-8">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : !user && !admin ? (
              // Unauthenticated Desktop Actions
              <div className="hidden md:flex space-x-2 lg:space-x-4">
                <Link
                  href="/pages/auth/login"
                  className="px-3 lg:px-4 py-2 bg-white text-blue-600 rounded-md font-medium transition-all duration-300 hover:bg-gray-100 hover:shadow-md text-sm lg:text-base"
                >
                  Login
                </Link>
                <Link
                  href="/pages/auth/selectRole"
                  className="px-3 lg:px-4 py-2 bg-blue-800 rounded-md font-medium transition-all duration-300 hover:bg-blue-900 hover:shadow-md text-sm lg:text-base"
                >
                  Register
                </Link>
              </div>
            ) : (
              // Authenticated Desktop Actions
              <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                {/* Enhanced Notifications */}
                <NotificationSection user={user} admin={admin} />

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-1 lg:space-x-2 focus:outline-none group"
                  >
                    <Image
                      src={
                        user?.profilePicture ||
                        admin?.profile_picture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                      }
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 lg:w-9 lg:h-9 object-cover rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="hidden xl:block">
                      <div className="text-sm font-medium leading-none">
                        {user?.firstName ||
                          admin?.first_name + admin?.last_name}
                      </div>
                      <div className="text-xs text-blue-100">
                        {user?.userType || "Admin"}
                      </div>
                    </div>
                    <svg
                      className={`w-3 h-3 lg:w-4 lg:h-4 ml-1 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white text-black rounded-lg shadow-xl py-2 z-10 transition-all duration-300 transform origin-top-right">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.firstName ||
                            admin?.first_name + " " + admin?.last_name ||
                            "Guest"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || admin?.email || ""}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.user_id}
                        </p>
                      </div>

                      {/* Points Section */}
                      {user && (
                        <div className="px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-yellow-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Reward Points
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-lg font-bold text-yellow-600">
                                {user?.points}
                              </span>
                              <span className="text-yellow-500">⭐</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {user?.userType === "tenant" && !hasLease ? (
                        <div
                          className="flex items-center px-4 py-2 text-gray-400 cursor-not-allowed"
                          title="You need an active lease to access the dashboard"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            ></path>
                          </svg>
                          Dashboard (Restricted)
                        </div>
                      ) : (
                        <Link
                          href={
                            user?.userType === "tenant"
                              ? "/pages/tenant/my-unit"
                              : `/pages/${
                                  user?.userType || "system_admin"
                                }/dashboard`
                          }
                          className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            ></path>
                          </svg>
                          Dashboard
                        </Link>
                      )}

                      {user && (
                        <Link
                          href={`/pages/${user.userType}/profile`}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                          </svg>
                          View Profile
                        </Link>
                      )}

                      {user?.userType === "tenant" && (
                        <Link
                          href={`/pages/tenant/digital-passport`}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 12c2.28 0 4.09-1.8 4.09-4.09 0-2.28-1.8-4.09-4.09-4.09s-4.09 1.8-4.09 4.09C7.91 10.2 9.72 12 12 12zm0 2c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"
                            />
                          </svg>
                          My Digital Passport
                        </Link>
                      )}

                      {admin && (
                        <Link
                          href={`/pages/system_admin/profile/${admin.admin_id}`}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                          </svg>
                          View Profile
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          ></path>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-1 sm:space-x-2">
              {(user || admin) && (
                <NotificationSection user={user} admin={admin} />
              )}

              <button
                onClick={toggleMenu}
                className="mobile-menu-button text-white hover:text-gray-300 focus:outline-none p-1.5 sm:p-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {menuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300">
            <div
              ref={mobileMenuRef}
              className="fixed inset-y-0 right-0 max-w-xs w-full bg-blue-600 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-blue-500">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏠</span>
                  <span className="text-lg font-bold">Hestia</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Content */}
              <div className="px-4 py-3 space-y-1">
                {/* User Info Section */}
                {(user || admin) && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-700 rounded-lg mb-4">
                    <Image
                      src={
                        user?.profilePicture ||
                        admin?.profile_picture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                      }
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-full border-2 border-white"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {user?.firstName || admin?.firstName || "User"}
                      </div>
                      <div className="text-sm text-blue-100 truncate">
                        {user?.email || admin?.email || ""}
                      </div>
                      {user && (
                        <div className="text-xs text-yellow-300 mt-1">
                          ⭐ {user?.points ?? 0} points
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center py-3 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200 text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Auth Actions for Non-authenticated Users */}
                {!user && !admin ? (
                  <div className="flex flex-col space-y-3 pt-4 border-t border-blue-500 mt-4">
                    <Link
                      href="/pages/auth/login"
                      className="flex items-center justify-center py-3 bg-white text-blue-600 rounded-md font-medium transition-colors duration-200 hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/pages/auth/selectRole"
                      className="flex items-center justify-center py-3 bg-blue-800 rounded-md font-medium transition-colors duration-200 hover:bg-blue-900"
                      onClick={() => setMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                ) : (
                  /* User Actions for Authenticated Users */
                  <div className="pt-4 border-t border-blue-500 mt-4 space-y-1">
                    {user?.userType === "tenant" && !hasLease ? (
                      <div className="flex items-center py-3 px-3 text-gray-300 cursor-not-allowed">
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          ></path>
                        </svg>
                        Dashboard (Restricted)
                      </div>
                    ) : (
                      <Link
                        href={
                          user?.userType === "tenant"
                            ? "/pages/tenant/my-unit"
                            : `/pages/${
                                user?.userType || "system_admin"
                              }/dashboard`
                        }
                        className="flex items-center py-3 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          ></path>
                        </svg>
                        Dashboard
                      </Link>
                    )}

                    {user && (
                      <Link
                        href={`/pages/${user.userType}/profile/${user.user_id}`}
                        className="flex items-center py-3 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          ></path>
                        </svg>
                        Profile and Settings
                      </Link>
                    )}

                    {admin && (
                      <Link
                        href={`/pages/system_admin/profile/${admin.admin_id}`}
                        className="flex items-center py-3 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          ></path>
                        </svg>
                        View Profile
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="flex items-center w-full py-3 px-3 rounded-md text-red-200 hover:bg-red-700 hover:text-white transition-colors duration-200 mt-2"
                    >
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        ></path>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
