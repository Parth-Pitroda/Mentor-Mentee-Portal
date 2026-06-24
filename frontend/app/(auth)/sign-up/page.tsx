"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpUser } from "@/lib/actions/auth.actions";
import toast from "react-hot-toast";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
} as const;

export default function SignUpPage() {
  const router = useRouter();
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Track cursor position with spring values for Google Labs-style trailing inertia
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 220, mass: 0.6 };
  const spotlightX = useSpring(mouseX, springConfig);
  const spotlightY = useSpring(mouseY, springConfig);

  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Offset by -150 to keep the center of the 300px spotlight aligned with cursor
    mouseX.set(e.clientX - rect.left - 150);
    mouseY.set(e.clientY - rect.top - 150);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); 
    
    const formData = new FormData(e.currentTarget);
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
    } catch (error) {
      setError("An unexpected network error occurred.");
      toast.error("Network error.", { id: toastId });
      setIsLoading(false);
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="pointer-events-auto w-full md:w-1/2 lg:w-[45%] xl:w-[40%] md:ml-auto bg-white flex flex-col justify-between p-8 md:p-12 lg:p-16 relative overflow-y-auto shrink-0 z-10 h-full font-poppins"
    >
      
      {/* Google Labs Spotlight Glow following cursor with Liquid-Spring inertia */}
      <motion.div 
        style={{
          x: spotlightX,
          y: spotlightY,
        }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="absolute w-[300px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[65px] pointer-events-none z-0 hidden md:block left-0 top-0"
      />

      {/* Top Header Branding Row (Fade In Entry) */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex items-center justify-between w-full z-10 select-none mb-8"
      >
        <img 
          src="/pdeu_logo_new.png" 
          alt="PDEU Logo" 
          className="h-12 w-auto object-contain select-none"
        />
        <Link 
          href="/sign-in" 
          className="px-6 py-2 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-sm font-semibold transition-all duration-300"
        >
          Sign In
        </Link>
      </motion.div>

      {/* Central Sign Up Card (Staggered Animation Entry) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[381px] mx-auto my-auto flex flex-col gap-8 z-10 py-4"
      >
        {/* Form Headers */}
        <motion.div variants={itemVariants} className="flex flex-col gap-1 select-none">
          <span className="text-slate-500 text-sm font-medium">Join the portal</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Create account</h1>
        </motion.div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <motion.div 
              variants={itemVariants}
              className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold break-words flex items-start"
            >
              <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </motion.div>
          )}

          {/* Full Legal Name */}
          <motion.div variants={itemVariants} className="flex flex-col gap-1.5 w-full">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700">
              Full Legal Name
            </label>
            <input 
              id="name"
              required 
              name="name" 
              type="text" 
              disabled={isLoading}
              placeholder="Rahul Sharma" 
              className="w-full px-4 py-3 bg-white hover:bg-slate-50/40 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:shadow-[0_0_18px_-3px_rgba(59,130,246,0.12)] rounded-xl outline-none text-slate-800 placeholder:text-slate-400 text-sm font-poppins transition-all duration-300 shadow-sm" 
            />
          </motion.div>

          {/* Roll Number */}
          <motion.div variants={itemVariants} className="flex flex-col gap-1.5 w-full">
            <label htmlFor="rollNo" className="text-sm font-semibold text-slate-700 flex justify-between items-center">
              <span>Roll Number</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional for Students</span>
            </label>
            <input 
              id="rollNo"
              name="rollNo" 
              type="text" 
              disabled={isLoading}
              placeholder="e.g. 24BCP413D" 
              className="w-full px-4 py-3 bg-white hover:bg-slate-50/40 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:shadow-[0_0_18px_-3px_rgba(59,130,246,0.12)] rounded-xl outline-none text-slate-800 placeholder:text-slate-400 text-sm font-poppins transition-all duration-300 shadow-sm" 
            />
          </motion.div>

          {/* University Email Address */}
          <motion.div variants={itemVariants} className="flex flex-col gap-1.5 w-full">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              University Email Address
            </label>
            <input 
              id="email"
              required 
              name="email" 
              type="email" 
              disabled={isLoading}
              placeholder="name@sot.pdpu.ac.in" 
              className="w-full px-4 py-3 bg-white hover:bg-slate-50/40 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:shadow-[0_0_18px_-3px_rgba(59,130,246,0.12)] rounded-xl outline-none text-slate-800 placeholder:text-slate-400 text-sm font-poppins transition-all duration-300 shadow-sm" 
            />
            <span className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">
              Roles are assigned automatically based on email domains.
            </span>
          </motion.div>

          {/* Password Field */}
          <motion.div variants={itemVariants} className="flex flex-col gap-1.5 w-full">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <div className="relative flex items-center w-full">
              <input 
                id="password"
                required 
                name="password" 
                type={showPassword ? "text" : "password"}
                minLength={8}
                disabled={isLoading}
                placeholder="••••••••••••" 
                className="w-full pl-4 pr-12 py-3 bg-white hover:bg-slate-50/40 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 focus:shadow-[0_0_18px_-3px_rgba(59,130,246,0.12)] rounded-xl outline-none text-slate-800 placeholder:text-slate-300 text-sm font-poppins transition-all duration-300 shadow-sm" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {/* Sign Up Button Wrapper with moving border gradient on hover */}
          <motion.div 
            variants={itemVariants}
            className="relative p-[1.5px] rounded-xl overflow-hidden mt-4 group-btn w-full shadow-md"
          >
            {/* Rotating conic gradient for high-tech border glow */}
            <div className="absolute -inset-[300%] bg-[conic-gradient(from_0deg,transparent_30%,#93C5FD_50%,transparent_70%)] animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <motion.button 
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.985 }}
              type="submit" 
              disabled={isLoading} 
              className="relative w-full py-3.5 bg-gradient-to-r from-[#3182CE] to-[#2B6CB0] hover:from-[#2B6CB0] hover:to-[#1A365D] text-white rounded-[11px] font-bold text-sm tracking-wide active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer overflow-hidden"
            >
              {/* Horizontal white sheen sweep on hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full btn-shimmer pointer-events-none" />

              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </>
              ) : (
                "Register Account"
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="text-center mt-6">
          <p className="text-sm text-slate-500 font-medium">
            Already registered?{" "}
            <Link href="/sign-in" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* Small Footer copyright */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.65 }}
        className="text-xs text-slate-400 font-medium select-none z-10 w-full text-center mt-8"
      >
        © {new Date().getFullYear()} PDEU ERP System. All rights reserved.
      </motion.div>
      
    </div>
  );
}