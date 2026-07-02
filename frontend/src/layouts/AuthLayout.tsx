"use client";

import { usePathname } from "@/lib/router-compat";
import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Check if current route is sign-up
  const isSignUp = pathname === "/sign-up";

  return (
    <div className="w-screen h-screen flex bg-white overflow-hidden font-poppins selection:bg-blue-100 selection:text-blue-900 relative">
      
      {/* Shared Campus Image Panel with Layout Animation */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
        className={`hidden md:block absolute top-0 bottom-0 w-[50%] lg:w-[55%] xl:w-[60%] h-full z-0 overflow-hidden group bg-slate-100 ${
          isSignUp ? "left-0" : "right-0"
        }`}
      >
        <motion.img
          layout="position"
          src="/campus.jpg"
          alt="PDEU Campus"
          className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-[3000ms] ease-out group-hover:scale-105"
        />
      </motion.div>

      {/* Page Content Container (Sign-In or Sign-Up) */}
      {/* pointer-events-none allows hover states to pass through to the image layer underneath */}
      <div className="w-full h-full flex relative z-10 pointer-events-none">
        {children}
      </div>

    </div>
  );
}
