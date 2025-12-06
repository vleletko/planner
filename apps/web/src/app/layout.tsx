import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/app/providers";
import Header from "@/components/header";
import { HydrationMarker } from "@/components/hydration-marker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "planner",
  description: "planner",
};

export function Background({ children }: { children: React.ReactNode }) {
  return (
    // // <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] text-gray-900">
    // //   {/* Diagonal Grid with Electric Orange */}
    // //   <div
    // //     className="pointer-events-none absolute inset-0 z-0"
    // //     style={{
    // //       backgroundImage: `
    // //       repeating-linear-gradient(45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px),
    // //     repeating-linear-gradient(-45deg, rgba(255, 0, 100, 0.1) 0, rgba(255, 0, 100, 0.1) 1px, transparent 1px, transparent 20px)
    // //     `,
    // //       backgroundSize: "40px 40px",
    // //     }}
    // //   />
    <>{children}</>
    // </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex h-full flex-col antialiased`}
      >
        <Providers>
          <HydrationMarker />
          <Header />
          <Background>
            <main className="relative z-10 flex flex-1 flex-col pt-16">
              {children}
            </main>
          </Background>
        </Providers>
      </body>
    </html>
  );
}
