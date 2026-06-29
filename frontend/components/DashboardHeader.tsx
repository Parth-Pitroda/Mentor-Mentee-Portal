"use client";

import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link";

type DashboardHeaderProps = {
  user?: {
    name?: string;
    email?: string;
  };
};

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  
  const segments = pathname.split("/").filter(Boolean);
  const profileId = segments[1] || "";
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
        <Link 
          href={`/dashboard/${profileId}/profile`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-800 hover:scale-[1.03] transition-all cursor-pointer select-none"
          title="View profile"
        >
          {initials}
        </Link>
      </div>
    </div>
  );
}
