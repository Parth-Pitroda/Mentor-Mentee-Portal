"use client";

import React from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/components/NotificationProvider";

export default function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, profileId, role } = useNotifications();
  const hasUnread = notifications.some((notification) => !notification.isRead);

  const getNotificationLink = (type: string) => {
    if (role === "mentor") {
      switch (type) {
        case "meeting_request_pending":
          return "/mentor-dashboard/approvals?tab=requests";
        case "academic_submission":
          return "/mentor-dashboard/approvals?tab=academics";
        case "achievement_submission":
          return "/mentor-dashboard/approvals?tab=achievements";
        case "meeting_log_submission":
          return "/mentor-dashboard/approvals?tab=meetings";
        default:
          return "/mentor-dashboard/approvals";
      }
    }

    const targetProfileId = profileId;
    if (!targetProfileId) return "/dashboard";

    switch (type) {
      case "meeting_status":
      case "meeting_request":
        return `/dashboard/${targetProfileId}/meetings`;
      case "academic_status":
        return `/dashboard/${targetProfileId}/academics`;
      case "achievement_status":
        return `/dashboard/${targetProfileId}/achievements`;
      default:
        return `/dashboard/${targetProfileId}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meeting_status":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0l-2-2m2 2l2-2" />
          </svg>
        );
      case "meeting_request":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-8-8c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        );
      case "academic_status":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.447 9.246 5 7.5 5C4.42 5 2 7.42 2 10.443V18.5a2 2 0 002 2h12a2 2 0 002-2V10.443C22 7.42 19.58 5 16.5 5c-1.746 0-3.332.447-4.5.447z" />
          </svg>
        );
      case "achievement_status":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.83 15.4c-2.1 0-3.5-1.4-3.5-3.5S5.73 8.4 7.83 8.4 11.33 9.9 11.33 12.4s-3.5 3.5-3.5 3.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.2 15.4c-2.1 0-3.5-1.4-3.5-3.5S14.2 8.4 16.2 8.4 19.7 9.9 19.7 12.4s-3.5 3.5-3.5 3.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v2m-3-2h6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };


  return (
    <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-xl border border-slate-200 bg-white p-0 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200 z-50">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
        <div className="flex gap-2">
          {hasUnread && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n) => (
              <div
                key={n.$id}
                className={`group flex gap-3 p-4 transition-colors cursor-pointer border-b border-slate-50 last:border-0 relative ${
                  n.isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/30 hover:bg-blue-50"
                }`}
              >
                <Link
                  to={getNotificationLink(n.type)}
                  onClick={async () => {
                    await markAsRead(n.$id);
                    onClose();
                  }}
                  className="flex gap-3 flex-1"
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    n.isRead ? "bg-slate-100 text-slate-400" : "bg-blue-100 text-blue-600"
                  }`}>
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className={`text-sm ${n.isRead ? "text-slate-600" : "text-slate-900 font-medium"}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                {!n.isVirtual && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteNotification(n.$id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                    title="Delete notification"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <Link
              to={role === "mentor" ? "/mentor-dashboard/approvals" : profileId ? `/dashboard/${profileId}/notifications` : "/dashboard"}
              onClick={onClose}
              className="p-3 text-center text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100"
            >
              {role === "mentor" ? "View Pending Approvals" : "View All Notifications"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
