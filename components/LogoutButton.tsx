"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/actions/auth.actions";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LogoutButton() {
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