"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/components/NotificationProvider";
import { 
  LayoutDashboard, 
  CalendarDays, 
  GraduationCap, 
  Trophy, 
  Bell, 
  UserCircle 
} from "lucide-react";

const navItems = [
  { label: "Overview Dashboard", suffix: "", icon: LayoutDashboard },
  { label: "Meeting Logs", suffix: "/meetings", icon: CalendarDays },
  { label: "Academic Records", suffix: "/academics", icon: GraduationCap },
  { label: "Achievements", suffix: "/achievements", icon: Trophy },
  { label: "Notifications", suffix: "/notifications", showUnread: true, icon: Bell },
  { label: "Mentorship Profile", suffix: "/profile", icon: UserCircle },
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
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={href}
            className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-base font-medium ${
              isActive
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center">
              <Icon className={`w-5 h-5 mr-4 transition-colors ${
                isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
              }`} />
              <span>{item.label}</span>
            </div>
            
            {item.showUnread && unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}