"use client"; // ✅ 1. Turn this into a Client Component

import Link from "next/link";
import { signUpUser } from "@/lib/actions/auth.actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  
  // ✅ 2. Add state to capture errors and loading status
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 3. Intercept the form submission to read the server response
  const clientAction = async (formData: FormData) => {
    setIsLoading(true);
    setError(""); // Clear any previous errors

    try {
      const result = (await signUpUser(formData)) as { success?: boolean; userId?: string; role?: string; error?: string };
      
      // If the backend returns an error message, display it!
      if (result && !result.success) {
        setError(result.error || "Failed to create account. Please try again.");
        setIsLoading(false);
      } else if (result?.success) {
        if (result.role === "admin" || result.role === "coordinator") {
          router.push("/admin-dashboard");
        } else if (result.role === "mentor") {
          router.push("/mentor-dashboard");
        } else {
          router.push(result.userId ? `/dashboard/${result.userId}` : "/onboarding");
        }
      }
    } catch {
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
          <span className="text-white text-2xl font-bold">P</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl border border-slate-200 sm:px-10">
          
          {/* ✅ 4. Beautiful Inline Error Banner */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500 font-bold">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-red-800">Registration Failed</h3>
                  <div className="mt-1 text-sm text-red-700 font-medium">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ 5. Attach the clientAction to the form */}
          <form action={clientAction} className="space-y-6">
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Legal Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="Rahul Sharma"
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number (For Students)</label>
              <input 
                type="text" 
                name="rollNo" 
                placeholder="e.g. 24BCP413D"
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">University Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="name@sot.pdpu.ac.in"
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Student and Faculty roles are assigned automatically based on email.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                name="password" 
                required 
                placeholder="••••••••"
                minLength={8}
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Registering...
                  </span>
                ) : (
                  "Register Account"
                )}
              </button>
            </div>
            
          </form>

        </div>
      </div>
    </div>
  );
}
