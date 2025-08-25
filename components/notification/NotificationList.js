import { Bell, CheckCircle, Clock } from "lucide-react";

export default function NotificationList({ notifications, markAsRead }) {
  if (notifications.length === 0) {
    return (
      <p className="text-center py-4 text-gray-500">No notifications yet</p>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 border rounded-lg flex items-start transition-colors duration-200 hover:bg-gray-50 ${
            notification.is_read
              ? "bg-white border-gray-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="mr-3 mt-1">
            {notification.is_read ? (
              <Bell className="w-5 h-5 text-gray-400" />
            ) : (
              <Bell className="w-5 h-5 text-blue-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                notification.is_read ? "text-gray-800" : "text-blue-800"
              }`}
            >
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 mt-1 mb-2">
              {notification.body}
            </p>
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(notification.created_at).toLocaleString()}
            </div>
          </div>

          {!notification.is_read && (
            <button
              onClick={() => markAsRead(notification.id)}
              className="ml-2 p-1.5 rounded-full hover:bg-blue-100 transition-colors duration-200"
              aria-label="Mark as read"
            >
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
