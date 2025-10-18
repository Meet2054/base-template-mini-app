import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { APP_NAME } from "~/lib/constants";

export const metadata: Metadata = {
  title: "Satoshi - Your AI Crypto Guardian",
  description: "Intelligent crypto portfolio monitoring with personalized Telegram insights",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
