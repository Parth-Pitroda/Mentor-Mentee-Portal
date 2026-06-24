"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/components/NotificationProvider";

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, profileId } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.isRead
  );

  const getNotificationLink = (type: string) => {
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0l-2-2m2 2l2-2" />
          </svg>
        );
      case "meeting_request":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-8-8c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        );
      case "academic_status":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.447 9.246 5 7.5 5C4.42 5 2 7.42 2 10.443V18.5a2 2 0 002 2h12a2 2 0 002-2V10.443C22 7.42 19.58 5 16.5 5c-1.746 0-3.332.447-4.5.447z" />
          </svg>
        );
      case "achievement_status":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.83 15.4c-2.1 0-3.5-1.4-3.5-3.5S5.73 8.4 7.83 8.4 11.33 9.9 11.33 12.4s-3.5 3.5-3.5 3.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.2 15.4c-2.1 0-3.5-1.4-3.5-3.5S14.2 8.4 16.2 8.4 19.7 9.9 19.7 12.4s-3.5 3.5-3.5 3.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v2m-3-2h6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "unread" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Unread
          </button>
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900">No notifications</h3>
          <p className="text-sm text-slate-500">You are all caught up! Check back later for new updates.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.$id}
              className={`group flex gap-4 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-1 relative ${
                n.isRead ? "bg-white border-slate-200" : "bg-blue-50/50 border-blue-100 ring-1 ring-blue-100"
              }`}
            >
              <Link
                href={getNotificationLink(n.type)}
                onClick={async () => await markAsRead(n.$id)}
                className="flex gap-4 flex-1"
              >
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  n.isRead ? "bg-slate-100 text-slate-400" : "bg-blue-100 text-blue-600"
                }`}>
                  {getNotificationIcon(n.type)}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${n.isRead ? "text-slate-600" : "text-slate-900 font-medium"}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
              {!n.isVirtual && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    deleteNotification(n.$id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                  title="Delete notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
