"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster 
        position="bottom-right"
        theme="dark"
        className="glass-strong"
      />
    </TooltipProvider>
  );
}