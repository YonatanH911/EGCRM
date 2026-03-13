import type { Metadata } from "next";
import { Inter, Assistant } from "next/font/google";
import "./globals.css";
import { PreferencesProvider } from "@/components/PreferencesProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: 'swap' });
const assistant = Assistant({ subsets: ["hebrew", "latin"], variable: "--font-assistant", display: 'swap' });

export const metadata: Metadata = {
  title: "EGCRM",
  description: "A premium, web-based CRM system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${assistant.variable} font-sans`}>
        <PreferencesProvider>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
