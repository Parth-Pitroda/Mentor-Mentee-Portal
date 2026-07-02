"use client";

import { useRouter } from "@/lib/router-compat";
import { logoutUser } from "@/lib/actions/auth.actions";
import { useState } from "react";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";

export default function LogoutButton({ variant = "default" }: { variant?: "default" | "sidebar-dark" | "sidebar-light" }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const toastId = toast.loading("Signing out...");

    try {
      await logoutUser(); 
      toast.success("Successfully signed out!", { id: toastId });
      router.push("/sign-in"); 
    } catch (error) {
      toast.error("Failed to sign out. Please try again.", { id: toastId });
      setIsLoggingOut(false);
    }
  };

  if (variant === "sidebar-dark") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
      >
        <LogOut className="w-5 h-5 text-slate-400 group-hover:text-white" />
        <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
      </button>
    );
  }

  if (variant === "sidebar-light") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium text-slate-650 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50"
      >
        <LogOut className="w-5 h-5 text-slate-455 group-hover:text-slate-900" />
        <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
    >
      {isLoggingOut ? "Signing out..." : "Sign Out"}
    </button>
  );
}