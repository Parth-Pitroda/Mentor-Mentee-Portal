"use client";

import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link";

type DashboardHeaderProps = {
  profileId: string;
  user?: {
    name?: string;
    email?: string;
    rollNo?: string;
  };
};

export default function DashboardHeader({ profileId, user }: DashboardHeaderProps) {
  const pathname = usePathname();
  
  const segments = pathname.split("/").filter(Boolean);
  const suffix = segments[2] || "";

  let pageTitle = "Dashboard";
  
  if (suffix === "meetings") {
    pageTitle = "Meetings";
  } else if (suffix === "academics") {
    pageTitle = "Academic Records";
  } else if (suffix === "achievements") {
    pageTitle = "Achievements";
  } else if (suffix === "notifications") {
    pageTitle = "Notifications";
  } else if (suffix === "profile") {
    pageTitle = "Mentorship Profile";
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "S";

  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
          <span>{pageTitle}</span>
        </h1>
      </div>
      
      <div className="mb-2 lg:mb-0 flex items-center gap-4">
        <NotificationBell />
        
        {/* Profile initials picture + Student Name & Roll No Capsule */}
        <Link 
          href={`/dashboard/${profileId}/profile`}
          className="flex items-center gap-2.5 bg-slate-50/60 pl-2 pr-3.5 py-1.5 rounded-xl border border-slate-200/50 hover:bg-slate-100/50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer select-none"
          title="View profile"
        >
          {/* Initials Circle */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white text-[10px] font-black shadow-sm">
            {initials}
          </div>
          
          {/* Name & Roll No Text */}
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {user?.name || "Student"}
            </p>
            {user?.rollNo ? (
              <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5 uppercase tracking-wide">
                {user.rollNo}
              </p>
            ) : null}
          </div>
        </Link>
      </div>
    </div>
  );
}
