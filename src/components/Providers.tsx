"use client";

import { SidebarProvider } from "@/components/ui/SidebarContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>
    );
}
