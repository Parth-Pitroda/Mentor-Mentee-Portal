export default function PortalTopNavbar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail?: string;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-black text-white shadow-sm">
            PDEU
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-blue-950">PDEU Portal</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mentor-Mentee System</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-semibold text-slate-800">{userName}</p>
            {userEmail && <p className="truncate text-xs text-slate-500">{userEmail}</p>}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
