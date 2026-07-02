import HeaderSearchBar from "@/components/HeaderSearchBar";
import NotificationBell from "@/components/NotificationBell";

export default function MentorHeader({ title, initials: userInitials, showSearch }: { title: string; initials: string; showSearch?: boolean }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
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
