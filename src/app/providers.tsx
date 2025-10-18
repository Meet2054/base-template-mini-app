"use client";

import dynamic from "next/dynamic";
import { MiniAppProvider } from "@neynar/react";
import { ToastProvider } from "~/components/providers/ToastProvider";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <MiniAppProvider analyticsEnabled={true}>
        <ToastProvider>{children}</ToastProvider>
      </MiniAppProvider>
    </WagmiProvider>
  );
}
