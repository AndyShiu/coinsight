import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FlowingLinesBg } from "@/components/layout/flowing-lines-bg";
import { WatchlistInitializer } from "@/components/providers/watchlist-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "幣析 CoinSight",
  description: "加密貨幣技術分析與市場洞察工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            <WatchlistInitializer />
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <FlowingLinesBg />
                </div>
                <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
                  <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 shrink-0" />
                  <Header />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                  </main>
                </div>
              </div>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
