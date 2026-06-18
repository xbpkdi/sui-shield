import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SuiShield Gasless Agent",
    template: "%s · SuiShield",
  },
  description:
    "Application-layer gas sponsorship and transaction recovery for Sui dApps. Monitor RPC health, protect sponsor gas, prevent duplicate transactions, and recover gracefully.",
  keywords: ["Sui", "gasless", "sponsorship", "dApp", "blockchain", "agent"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
