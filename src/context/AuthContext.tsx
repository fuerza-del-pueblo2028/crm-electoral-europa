"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: string;
    role: string;
    seccional?: string;
    nombre: string;
    cedula: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchSession = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated && data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch session", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Ignorar rutas públicas o de auth iniciales si es necesario, 
        // aunque es bueno saber la sesión siempre.
        fetchSession();
    }, [pathname]);

    const logout = async () => {
        setUser(null);
        // Borrar tokens del localstorage heredados por precaución
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_cedula");
        localStorage.removeItem("user_seccional");
        localStorage.removeItem("user_active");

        // Llamar endpoint de logout para matar la cookie
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
            // ignorar
        }

        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, logout, refreshSession: fetchSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
