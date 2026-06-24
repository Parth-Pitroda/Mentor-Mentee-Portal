"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LandingPageClient() {
  const router = useRouter();
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: "/sign-in" | "/sign-up", direction: "left" | "right") => {
    e.preventDefault();
    setExitDirection(direction);
    setTimeout(() => {
      router.push(path);
    }, 350); // delay matching transition duration
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between text-white overflow-hidden font-poppins select-none">
      
      {/* Background Campus Image taking the whole page with a subtle edge vignette (no overall dark tint) */}
      <div className="absolute inset-0 -z-20 h-full w-full">
        <img
          src="/campus.jpg"
          alt="PDEU Campus"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(circle, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.45) 100%)" 
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />
      </div>

      {/* Header containing only the clean PDEU logo on the top left */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={exitDirection ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full px-6 sm:px-12 py-6 z-10"
      >
        <img 
          src="/pdeu_logo_new.png" 
          alt="PDEU Logo" 
          className="h-20 w-auto object-contain select-none"
        />
      </motion.header>

      {/* Main Center Content (Center of the page) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 z-10 select-none">
        
        {/* Animated Title & Button Container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={
            exitDirection === "left"
              ? { opacity: 0, x: -80, y: 0 }
              : exitDirection === "right"
              ? { opacity: 0, x: 80, y: 0 }
              : { opacity: 1, x: 0, y: 0 }
          }
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="flex flex-col items-center gap-8 max-w-3xl w-full"
        >
          {/* Main Title: Mentor-Mentee Portal (No border, no sub-branding, strong text shadow for readability) */}
          <div className="flex flex-col items-center">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white select-none leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
              Mentor-Mentee Portal
            </h1>
          </div>

          {/* Buttons below the title (matching theme colors, solid backings for high visibility on bright background) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-4">
            
            <a 
              href="/sign-in" 
              onClick={(e) => handleNavigation(e, "/sign-in", "left")}
              className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-[#3182CE] to-[#2B6CB0] hover:from-[#2B6CB0] hover:to-[#1A365D] text-white rounded-xl font-bold text-sm tracking-wide shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 select-none text-center flex items-center justify-center gap-2 cursor-pointer border border-[#2B6CB0]"
            >
              Sign In
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </a>
            
            <a 
              href="/sign-up" 
              onClick={(e) => handleNavigation(e, "/sign-up", "right")}
              className="w-full sm:w-auto px-10 py-3.5 border border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white bg-white/95 rounded-xl font-bold text-sm tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all duration-200 select-none text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign Up
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </a>
            
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={exitDirection ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full px-8 py-6 text-center text-[10px] sm:text-xs font-semibold text-slate-400 select-none z-10 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)]"
      >
        © {new Date().getFullYear()} Pandit Deendayal Energy University. All rights reserved.
      </motion.footer>

    </div>
  );
}
