import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import LogoutButton from "@/components/LogoutButton";


export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const user = await getLoggedInUser();
  
  // If the manual cookie isn't found, redirect to sign-in
  if (!user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-900 tracking-tight font-sans">PDEU PORTAL</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href={`/dashboard/${profileId}`} className="block px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-700 rounded-lg transition-colors font-medium">
            Overview Dashboard
          </Link>
          <Link href={`/dashboard/${profileId}/meetings`} className="block px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-700 rounded-lg transition-colors font-medium">
            Meeting Logs
          </Link>
          <Link href={`/dashboard/${profileId}/academics`} className="block px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-700 rounded-lg transition-colors font-medium">
            Academic Records
          </Link>
          <Link href={`/dashboard/${profileId}/achievements`} className="block px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-700 rounded-lg transition-colors font-medium">
            Achievements
          </Link>
          <Link href={`/dashboard/${profileId}/profile`} className="block px-4 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-700 rounded-lg transition-colors font-medium">
            Mentorship Profile
          </Link>
        
          <div className="flex items-center justify-between">
          <LogoutButton />
  </div>
        </nav>
        
        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-slate-700 truncate">{user.name}</span>
           </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col md:ml-64">
        <main className="flex-1 bg-slate-50 min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
    
  );
}