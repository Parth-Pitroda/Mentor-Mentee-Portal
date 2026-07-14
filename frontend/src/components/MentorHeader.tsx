import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import NotificationBell from "@/components/NotificationBell";

export default function MentorHeader({
  title,
  initials: userInitials,
  showSearch,
  backUrl,
}: {
  title: string;
  initials: string;
  showSearch?: boolean;
  backUrl?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-center gap-3">
        {backUrl && (
          <Link
            to={backUrl}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-450 hover:bg-slate-100 hover:text-slate-800 transition-all duration-250 -ml-2"
            title="Go Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      </div>
      <div className="mb-2 flex items-center gap-4 lg:mb-0">
        {showSearch && <HeaderSearchBar />}
        <NotificationBell />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {userInitials}
        </div>
      </div>
    </div>
  );
}
