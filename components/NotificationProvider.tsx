"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  deleteCurrentUserNotification,
  getCurrentUserNotificationState,
  markAllCurrentUserNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/actions/student.actions";

interface Notification {
  $id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string;
  timestamp: string;
  isVirtual?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  hasUnread: boolean;
  userId: string | null;
  profileId: string | null;
  role: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const VIRTUAL_NOTIFICATION_READ_KEY = "pdeu-read-activity-notifications";

function getVirtualReadIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    return new Set(JSON.parse(window.localStorage.getItem(VIRTUAL_NOTIFICATION_READ_KEY) || "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

function saveVirtualReadIds(ids: Set<string>) {
  window.localStorage.setItem(VIRTUAL_NOTIFICATION_READ_KEY, JSON.stringify(Array.from(ids)));
}

function markVirtualNotificationsRead(ids: string[]) {
  if (ids.length === 0 || typeof window === "undefined") return;

  const readIds = getVirtualReadIds();
  ids.forEach((id) => readIds.add(id));
  saveVirtualReadIds(readIds);
}

function applyVirtualReadState(notifications: Notification[]) {
  const readIds = getVirtualReadIds();

  return notifications.map((notification) =>
    notification.isVirtual && readIds.has(notification.$id)
      ? { ...notification, isRead: true }
      : notification
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const state = await getCurrentUserNotificationState();
      const notificationsWithLocalReads = applyVirtualReadState(state.notifications);
      const nextUnreadCount = notificationsWithLocalReads.filter((notification) => !notification.isRead).length;

      setNotifications(notificationsWithLocalReads);
      setUnreadCount(nextUnreadCount);
      setHasUnread(nextUnreadCount > 0);
      setUserId(state.userId);
      setProfileId(state.profileId);
      setRole(state.role);
    } catch (error: unknown) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const notification = notifications.find((item) => item.$id === id);

      if (notification?.isVirtual) {
        markVirtualNotificationsRead([id]);
      } else {
        await markNotificationAsRead(id);
      }

      setNotifications(prev => prev.map(n => n.$id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setHasUnread(notifications.some((item) => item.$id !== id && !item.isRead));

      if (!notification?.isVirtual) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const virtualUnreadIds = notifications
        .filter((notification) => notification.isVirtual && !notification.isRead)
        .map((notification) => notification.$id);

      markVirtualNotificationsRead(virtualUnreadIds);
      await markAllCurrentUserNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setHasUnread(false);
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteCurrentUserNotification(id);
      setNotifications(prev => prev.filter(n => n.$id !== id));
      if (notifications.find(n => n.$id === id)?.isRead === false) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      await fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchNotifications();
    }, 0);

    const interval = window.setInterval(fetchNotifications, 30000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        userId,
        profileId,
        role,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
}
