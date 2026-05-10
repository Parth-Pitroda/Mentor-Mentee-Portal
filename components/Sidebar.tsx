"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton"; // 1. Import your new button!

export default function Sidebar({ profileId, userName }: { profileId: string, userName: string }) {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
      </div>
      
      {/* Added overflow-y-auto so the links can scroll if on a small screen */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
          href={`/dashboard/${profileId}/achievements`} 
          className={`block px-4 py-2 rounded-lg transition-colors font-medium ${
            isActive(`/dashboard/${profileId}/achievements`) 
              ? "bg-blue-50 text-blue-700" 
              : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          }`}
        >
          Achievements
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

     <div className="p-4 border-t border-slate-100 bg-slate-50/50">
         {/* 1. Your Avatar and Name */}
         <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-800 truncate">{userName}</span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">Mentee Portal</span>
            </div>
         </div>
         
         {/* 2. THE SIGN OUT BUTTON GOES HERE! */}
         <div className="px-1">
            <LogoutButton />
         </div>
      </div>
    </aside>
  );
}