import React, { useEffect, useState } from "react";
import axios from "axios";
import Popup from "reactjs-popup";

import "reactjs-popup/dist/index.css";

const NotificationComponent = ({ user_id }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user_id) {
      fetchUnreadNotifications();
    }
  }, [user_id]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get(
        `/api/notification/notif-in-app?user_id=${user_id}`
      );
      const unreadNotifications = response.data.notifications;

      if (unreadNotifications.length > 0) {
        setNotifications(unreadNotifications);
        showNextNotification(unreadNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const showNextNotification = (notificationsList) => {
    if (notificationsList.length > 0) {
      setCurrentNotification(notificationsList[0]);
      setOpen(true);
    }
  };

  const handleClose = async () => {
    if (currentNotification) {
      try {
        await axios.post("/api/notification/mark-notifications-read", {
          user_id: user_id,
          notification_id: currentNotification.id,
        });

        const updatedNotifications = notifications.slice(1);
        setNotifications(updatedNotifications);

        if (updatedNotifications.length > 0) {
          showNextNotification(updatedNotifications);
        } else {
          setOpen(false);
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  return (
    <>
      {currentNotification && (
        <Popup open={open} closeOnDocumentClick={false} modal>
          <div className="popup-container">
            <h3>{currentNotification.title}</h3>
            <p>{currentNotification.body}</p>
            <button onClick={handleClose}>OK</button>
          </div>
        </Popup>
      )}
    </>
  );
};

export default NotificationComponent;
