import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskPilot",
  description: "Task manager with secure JWT auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
