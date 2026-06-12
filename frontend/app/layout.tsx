import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "@/components/NotificationProvider";

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
      <body>
        <NotificationProvider>
          <Toaster position="top-right" reverseOrder={false} />
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
