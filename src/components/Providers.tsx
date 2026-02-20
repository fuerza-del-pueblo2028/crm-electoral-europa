"use client";

import { SidebarProvider } from "@/components/ui/SidebarContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SidebarProvider>
                {children}
            </SidebarProvider>
        </AuthProvider>
    );
}
