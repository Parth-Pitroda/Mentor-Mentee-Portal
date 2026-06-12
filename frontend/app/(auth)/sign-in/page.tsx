"use client";

import { useState } from "react";
import Link from "next/link";
import { signInUser } from "@/lib/actions/auth.actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    const formData = new FormData(e.currentTarget);
    const toastId = toast.loading("Verifying credentials...");
    
    try {
      const response = await signInUser(formData);
      
      if (response && !response.error) {
        toast.success("Login successful!", { id: toastId });
        
        setTimeout(() => {
          if (response.role === "admin" || response.role === "coordinator") {
            router.push(`/admin-dashboard`);
          } else if (response.role === "mentor") {
            router.push(`/mentor-dashboard`);
          } else {
            router.push(`/dashboard/${response.userId}`);
          }
        }, 300);

      } else if (response && response.error) {
        setErrorMsg(`Appwrite Error: ${response.error}`);
        toast.error("Failed to sign in.", { id: toastId });
        setIsLoading(false);
      } else {
        setErrorMsg(`Server returned: ${JSON.stringify(response)}`);
        toast.dismiss(toastId);
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected client error";
      setErrorMsg(`Client Crash: ${message}`);
      toast.dismiss(toastId);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">PDEU PORTAL</h1>
          <p className="text-slate-500 mt-2 text-sm italic">Mentor-Mentee Handshake</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-center text-sm font-medium border border-red-100 break-words">
              {errorMsg}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">University Email</label>
            <input 
              required 
              name="email" 
              type="email" 
              placeholder="24bcp... @sot.pdpu.ac.in" 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50/50" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <input 
              required 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50/50" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] disabled:bg-slate-400"
          >
            {isLoading ? "Verifying Credentials..." : "Access Dashboard"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Need an account?{" "}
            <Link href="/sign-up" className="text-blue-600 font-bold hover:underline decoration-2 underline-offset-4">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
