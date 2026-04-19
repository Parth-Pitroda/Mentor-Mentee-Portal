"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ profileId, userName }: { profileId: string, userName: string }) {
  const pathname = usePathname();

  // Helper to check if the link is active
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-blue-900 tracking-tight">PDEU PORTAL</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link 
          href={`/dashboard/${profileId}`} 
          className={`block px-4 py-2 rounded-lg transition-colors font-medium ${
            isActive(`/dashboard/${profileId}`) 
              ? "bg-blue-50 text-blue-700" 
              : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          }`}
        >
          Overview Dashboard
        </Link>
        <Link 
          href={`/dashboard/${profileId}/meetings`} 
          className={`block px-4 py-2 rounded-lg transition-colors font-medium ${
            isActive(`/dashboard/${profileId}/meetings`) 
              ? "bg-blue-50 text-blue-700" 
              : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          }`}
        >
          Meeting Logs
        </Link>
        <Link 
          href={`/dashboard/${profileId}/academics`} 
          className={`block px-4 py-2 rounded-lg transition-colors font-medium ${
            isActive(`/dashboard/${profileId}/academics`) 
              ? "bg-blue-50 text-blue-700" 
              : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          }`}
        >
          Academic Records
        </Link>
        <Link 
          href={`/dashboard/${profileId}/profile`} 
          className={`block px-4 py-2 rounded-lg transition-colors font-medium ${
            isActive(`/dashboard/${profileId}/profile`) 
              ? "bg-blue-50 text-blue-700" 
              : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          }`}
        >
          Mentorship Profile
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-100">
         <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
              {userName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-slate-700 truncate">{userName}</span>
         </div>
      </div>
    </aside>
  );
}