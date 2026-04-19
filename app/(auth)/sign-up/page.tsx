"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpUser } from "@/lib/actions/auth.actions";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await signUpUser(formData);
      
      if (res && res.secret) {
        // Manually set cookie to bypass Next.js 15 localhost bugs
        document.cookie = `appwrite-session=${res.secret}; path=/; max-age=604800; SameSite=Lax`;
        
        setTimeout(() => {
          window.location.href = `/dashboard/${res.userId}`;
        }, 300);
      } else {
        setErrorMsg("Registration failed. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      setErrorMsg("Connection error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-blue-900 text-center mb-8">PDEU PORTAL</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-center text-sm">{errorMsg}</div>}
          <input required name="name" placeholder="Full Name" className="w-full p-3 border rounded-lg" />
          <input required name="rollNo" placeholder="Roll Number" className="w-full p-3 border rounded-lg" />
          <input required name="email" type="email" placeholder="Email" className="w-full p-3 border rounded-lg" />
          <input required name="password" type="password" placeholder="Password (Min 8 chars)" className="w-full p-3 border rounded-lg" />
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account? <Link href="/sign-in" className="text-blue-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}