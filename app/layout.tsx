import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MiraTech Manage | Professional Business OS",
  description: "Next-generation POS and Business Management System by MiraTech Industries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-[#00a2ff]/30 selection:text-white`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" expand={false} richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
