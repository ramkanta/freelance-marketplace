import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "../providers/QueryProvider";
import AuthProvider from "../providers/AuthProvider";
import ThemeProvider from "../providers/ThemeProvider";
import { TooltipProvider } from "../components/ui/tooltip";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
const SITE_DESCRIPTION = "On-demand service and freelance marketplace with escrow-protected payments";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Servify - Freelance Service Marketplace",
    template: "%s | Servify",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Servify",
    title: "Servify - Freelance Service Marketplace",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Servify - Freelance Service Marketplace",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <TooltipProvider>
                <Navbar />
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
                <Footer />
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{ duration: 4000 }}
                />
              </TooltipProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
