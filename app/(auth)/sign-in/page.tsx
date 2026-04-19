"use client";

import { useState } from "react";
import Link from "next/link";
import { signInUser } from "@/lib/actions/auth.actions";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  setErrorMsg("");
  
  const formData = new FormData(e.currentTarget);
  
  try {
    const response = await signInUser(formData);

// Check if the server actually sent the data back
if (response && response.secret) {
  // 1. Manually write the cookie
  document.cookie = `appwrite-session=${response.secret}; path=/; max-age=604800; SameSite=Lax`;
  
  // 2. Force the redirect
  window.location.href = `/dashboard/${response.userId}`;
} else {
  // If response is null, Appwrite actually rejected the email/password
  setErrorMsg("Invalid email or password. Please try again.");
  setIsLoading(false);
}
  } catch (error) {
    setErrorMsg("Invalid email or password. Please try again.");
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">PDEU PORTAL</h1>
          <p className="text-slate-500 mt-2 text-sm">Welcome back, Student</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-center text-sm font-medium border border-red-100">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">University Email</label>
            <input 
              required 
              name="email" 
              type="email" 
              placeholder="student@sot.pdpu.ac.in" 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              required 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying Credentials..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-blue-600 font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}