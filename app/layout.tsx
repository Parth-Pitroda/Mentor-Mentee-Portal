import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDEU Portal",
  description: "Official Mentor-Mentee Platform for PDEU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The Toaster component enables global popup notifications */}
        <Toaster position="top-right" reverseOrder={false} />
        {children}
      </body>
    </html>
  );
}