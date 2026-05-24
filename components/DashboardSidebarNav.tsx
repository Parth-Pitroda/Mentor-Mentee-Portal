"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/components/NotificationProvider";

const navItems = [
  { label: "Overview Dashboard", suffix: "" },
  { label: "Meeting Logs", suffix: "/meetings" },
  { label: "Academic Records", suffix: "/academics" },
  { label: "Achievements", suffix: "/achievements" },
  { label: "Notifications", suffix: "/notifications", showUnread: true },
  { label: "Mentorship Profile", suffix: "/profile" },
];

export default function DashboardSidebarNav({ profileId }: { profileId: string }) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const basePath = `/dashboard/${profileId}`;

  return (
    <>
      {navItems.map((item) => {
        const href = `${basePath}${item.suffix}`;
        const isActive = item.suffix === "" ? pathname === basePath : pathname === href;

        return (
          <Link
            key={item.label}
            href={href}
            className={`relative block px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold ${
              isActive
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            }`}
          >
            {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-600" />}
            <span className="flex items-center justify-between gap-3">
              <span>{item.label}</span>
              {item.showUnread && unreadCount > 0 && (
                <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </>
  );
}
