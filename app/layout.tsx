import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./(ui)/components/Navbar";
import Footer from "./(ui)/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HealthFrame",
  description: "Personal health analytics dashboard",
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-slate-50 text-slate-900 font-sans antialiased",
          inter.variable
        )}
      >
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
