import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Syne, JetBrains_Mono } from "next/font/google";
import { SuiProvider } from "@/components/providers/SuiProvider";
import { UiEffects } from "@/components/providers/UiEffects";
import "./globals.css";

const forceDarkScript = `(function(){try{var r=document.documentElement;r.classList.add("dark");r.classList.remove("light");localStorage.removeItem("suishield-theme")}catch(e){}})();`;

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SuiShield Gasless Agent",
    template: "%s · SuiShield",
  },
  description:
    "Sui Overflow 2026 — Application-layer gas sponsorship agent for Sui dApps. Live zkLogin + gasless mint on devnet, policy engine, RPC failover, and full agent reasoning trace.",
  keywords: [
    "Sui",
    "Sui Overflow 2026",
    "gasless",
    "zkLogin",
    "gas sponsorship",
    "Move",
    "dApp",
    "agent",
  ],
  openGraph: {
    title: "SuiShield Gasless Agent — Sui Overflow 2026",
    description: "Policy-controlled gas sponsorship with live zkLogin mint on Sui devnet",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="font-mono antialiased">
        <Script id="force-dark" strategy="beforeInteractive">
          {forceDarkScript}
        </Script>
        <SuiProvider>
          <UiEffects />
          {children}
        </SuiProvider>
      </body>
    </html>
  );
}