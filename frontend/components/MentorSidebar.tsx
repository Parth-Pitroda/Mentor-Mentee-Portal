import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

type MentorSidebarProps = {
  activeItem: "dashboard" | "roster" | "meetings" | "directory" | "approvals" | "notices";
  pendingApprovalCount?: number;
  userName?: string;
  showUserDetails?: boolean;
};

const navItems = [
  { key: "dashboard", label: "Dashboard", href: "/mentor-dashboard?tab=dashboard" },
  { key: "roster", label: "My Mentees", href: "/mentor-dashboard?tab=roster" },
  { key: "meetings", label: "Meetings", href: "/mentor-dashboard?tab=meetings" },
  { key: "directory", label: "Student Directory", href: "/mentor-dashboard?tab=directory" },
  { key: "approvals", label: "Pending Approvals", href: "/mentor-dashboard/approvals" },
  { key: "notices", label: "Global Notices", href: "/mentor-dashboard?tab=notices" },
] as const;

function ActiveCurves() {
  return (
    <>
      <div className="absolute right-0 -top-4 h-4 w-4 bg-[#F8FAFC] pointer-events-none">
        <div className="h-full w-full rounded-br-full bg-[#1A1A24]" />
      </div>
      <div className="absolute right-0 -bottom-4 h-4 w-4 bg-[#F8FAFC] pointer-events-none">
        <div className="h-full w-full rounded-tr-full bg-[#1A1A24]" />
      </div>
    </>
  );
}

export default function MentorSidebar({
  activeItem,
  pendingApprovalCount = 0,
  userName,
  showUserDetails = true,
}: MentorSidebarProps) {
  return (
    <aside className="fixed top-0 left-0 z-20 hidden h-screen w-64 flex-col bg-[#1A1A24] text-white md:flex animate-in fade-in duration-300">
      <div className="flex h-24 shrink-0 items-center justify-center border-b border-white/5 px-6">
        <img src="/pdeu_logo.png" alt="PDEU Logo" className="h-14 w-auto object-contain" />
      </div>

      <nav className="flex-1 overflow-y-auto py-6 pl-4 pr-0 space-y-1.5">
        {navItems.map((item) => {
          const isActive = activeItem === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`group flex items-center justify-between py-3 transition-all duration-200 text-lg ${
                isActive
                  ? "font-bold bg-[#F8FAFC] text-slate-900 rounded-l-full rounded-r-none pl-6 pr-6 relative z-10 mr-0"
                  : "font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
              }`}
            >
              <span>{item.label}</span>
              {item.key === "approvals" && pendingApprovalCount > 0 && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm mr-2 ${
                    isActive ? "bg-slate-900 text-white" : "bg-amber-500 text-white animate-pulse"
                  }`}
                >
                  {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                </span>
              )}
              {isActive && <ActiveCurves />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-transparent">
        {showUserDetails && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white shadow-sm">
              {userName ? userName.charAt(0).toUpperCase() : "M"}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-white">{userName || "Faculty Member"}</span>
              <span className="truncate text-xs text-slate-400 font-medium">Mentor Account</span>
            </div>
          </div>
        )}
        <div className="px-1">
          <LogoutButton variant="sidebar-dark" />
        </div>
      </div>
    </aside>
  );
}
