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
            className={`group flex items-center justify-between py-3 transition-all duration-200 text-lg ${
              isActive
                ? "font-bold bg-[#F8FAFC] text-slate-900 rounded-l-full rounded-r-none pl-4 pr-6 relative z-10 mr-0"
                : "font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
            }`}
          >
            <div className="flex items-center">
              <Icon className={`w-5 h-5 mr-3 transition-colors ${
                isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'
              }`} />
              <span>{item.label}</span>
            </div>
            
            {item.showUnread && unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white shadow-sm mr-2 animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}

            {isActive && (
              <>
                {/* Top curve */}
                <div className="absolute right-0 -top-4 w-4 h-4 bg-[#F8FAFC] pointer-events-none">
                  <div className="w-full h-full rounded-br-full bg-[#1A1A24]" />
                </div>
                {/* Bottom curve */}
                <div className="absolute right-0 -bottom-4 w-4 h-4 bg-[#F8FAFC] pointer-events-none">
                  <div className="w-full h-full rounded-tr-full bg-[#1A1A24]" />
                </div>
              </>
            )}
          </Link>
        );
      })}
    </>
  );
}