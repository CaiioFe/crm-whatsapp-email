import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM WhatsApp & Email",
  description: "CRM com disparo de WhatsApp e Email, jornadas de automação e pipeline de leads",
};

import { Suspense } from "react";
import { LoadingBar } from "@/components/layout/LoadingBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <Suspense fallback={null}>
            <LoadingBar />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
