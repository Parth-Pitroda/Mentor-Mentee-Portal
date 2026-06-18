"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpUser } from "@/lib/actions/auth.actions";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Image from "next/image";

export default function SignUpPage() {
  const router = useRouter();
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clientAction = async (formData: FormData) => {
    setIsLoading(true);
    setError(""); 
    
    const toastId = toast.loading("Creating your account...");

    try {
      const result = (await signUpUser(formData)) as { success?: boolean; userId?: string; role?: string; error?: string };
      
      if (result && !result.success) {
        setError(result.error || "Failed to create account. Please try again.");
        toast.error("Registration failed.", { id: toastId });
        setIsLoading(false);
      } else if (result?.success) {
        toast.success("Account created successfully!", { id: toastId });
        
        setTimeout(() => {
          if (result.role === "admin" || result.role === "coordinator") {
            router.push("/admin-dashboard");
          } else if (result.role === "mentor") {
            router.push("/mentor-dashboard");
          } else {
            router.push(result.userId ? `/dashboard/${result.userId}` : "/onboarding");
          }
        }, 300);
      }
    } catch {
      setError("An unexpected network error occurred.");
      toast.error("Network error.", { id: toastId });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans selection:bg-blue-100 selection:text-blue-900 bg-white">
      
      {/* LEFT PANEL: Campus Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        
        {/* Native Next.js Image Component */}
        <Image 
          src="campus.jpg" 
          alt="PDEU Campus Background" 
          fill 
          priority
          unoptimized={true}
          sizes="(max-width: 1024px) 100vw, 50vw" 
          className="object-cover object-center"
        />
        
        {/* Dark Overlays for Text Readability - Lightened up! */}
          <div className="absolute inset-0 bg-slate-900/30 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10"></div>

        {/* Content Container */}
        <div className="relative z-20 w-full max-w-lg">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Start your journey today
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed font-medium">
            Join the PDEU Mentor-Mentee Handshake platform to connect with peers, seek guidance, and unlock your academic potential.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto overflow-x-hidden">
        
        {/* Slides in from the left (x: -20) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md my-auto"
        >
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PDEU Portal</h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">Create your account</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">Please fill in your details to register.</p>
          </div>

          <form action={clientAction} className="space-y-4">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 break-words flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                Full Legal Name
              </label>
              <input 
                id="name"
                type="text" 
                name="name" 
                required 
                disabled={isLoading}
                placeholder="Rahul Sharma" 
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all duration-200 disabled:opacity-50 text-slate-900 placeholder:text-slate-400 shadow-sm" 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rollNo" className="block text-sm font-semibold text-slate-700">
                Roll Number <span className="text-slate-400 font-normal">(For Students)</span>
              </label>
              <input 
                id="rollNo"
                type="text" 
                name="rollNo" 
                disabled={isLoading}
                placeholder="e.g. 24BCP413D" 
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all duration-200 disabled:opacity-50 text-slate-900 placeholder:text-slate-400 shadow-sm" 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                University Email Address
              </label>
              <input 
                id="email"
                type="email" 
                name="email" 
                required 
                disabled={isLoading}
                placeholder="name@sot.pdpu.ac.in" 
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all duration-200 disabled:opacity-50 text-slate-900 placeholder:text-slate-400 shadow-sm" 
              />
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Student and Faculty roles are assigned automatically based on email.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input 
                id="password"
                type="password" 
                name="password" 
                required 
                minLength={8}
                disabled={isLoading}
                placeholder="••••••••" 
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all duration-200 disabled:opacity-50 text-slate-900 placeholder:text-slate-400 shadow-sm" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-3.5 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 active:scale-[0.98] disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </>
              ) : (
                "Register Account"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already registered?{" "}
              <Link href="/sign-in" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
          
        </motion.div>
      </div>
    </div>
  );
}