"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart2, Book, Settings, LogOut, Vote, BarChart3, FileText, X, Globe, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/SidebarContext";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
    { name: "Inicio", icon: Home, href: "/", access: "public" },
    { name: "Afiliados", icon: Users, href: "/afiliados", access: "staff" },
    { name: "Datos Electorales", icon: BarChart2, href: "/datos", access: "staff" },
    { name: "Europa", icon: Globe, href: "/europa", access: "staff" },
    { name: "Repositorio", icon: FileText, href: "/repositorio", access: "public" },
    { name: "Estatutos", icon: Book, href: "/estatutos", access: "public" },
    { name: "Votación Interna", icon: Vote, href: "/elecciones-internas", access: "public" },
    { name: "Contacto", icon: MessageSquare, href: "/contacto", access: "public" },
    { name: "Resultados", icon: BarChart3, href: "/elecciones-internas/resultados", access: "staff" },
    { name: "Administración", icon: Settings, href: "/admin", access: "admin" },
    { name: "Comunicaciones", icon: Mail, href: "/admin/comunicaciones", access: "admin" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const { isMobileOpen, closeSidebar } = useSidebar();

    const userRole = user?.role?.toLowerCase() || null;
    const isActiveUser = true; // Simplified for sidebar

    // Solo ocultar si estamos explícitamente en login y NO hay rol definido
    if (pathname?.includes("/login") && !userRole) return null;

    const filteredMenu = menuItems.filter(item => {
        // Público: Siempre visible
        if (item.access === "public") return true;


        // Staff: Solo para administrador o operador CONFIRMADO
        if (item.access === "staff") {
            const isStaff = userRole === "administrador" || userRole === "operador";

            // Secciones restringidas: Requieren ser staff Y estar activo
            if (item.href === "/datos" || item.href === "/europa") {
                // Admins always see everything, otherwise check active status
                if (userRole === "administrador") return true;
                return isStaff && isActiveUser;
            }

            return isStaff;
        }

        // Admin: Solo para administrador
        if (item.access === "admin") {
            return userRole === "administrador";
        }

        return false;
    });

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => closeSidebar()}
                />
            )}

            <div className={cn(
                "flex flex-col h-full bg-[#137228] text-white shadow-2xl overflow-hidden no-print transition-all duration-300 z-50",
                "fixed md:relative inset-y-0 left-0 w-64",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                {/* Mobile Header in Sidebar */}
                <div className="md:hidden flex justify-between items-center p-4 border-b border-white/10">
                    <span className="font-bold text-lg">Menú</span>
                    <button onClick={() => closeSidebar()} className="p-1 hover:bg-white/10 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 relative z-10 overflow-y-auto custom-scrollbar">
                    {filteredMenu.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => closeSidebar()}
                                className={cn(
                                    "flex items-center px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 group",
                                    isActive
                                        ? "bg-white text-[#137228] shadow-xl shadow-green-900/30"
                                        : "text-green-50 hover:bg-white/10 hover:translate-x-1"
                                )}
                            >
                                <item.icon className={cn("mr-4 h-5 w-5 transition-transform", isActive ? "" : "group-hover:scale-110")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 relative z-10 bg-black/5">
                    {isAuthenticated ? (
                        <button
                            onClick={logout}
                            className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-100 hover:bg-red-500/20 hover:text-white rounded-xl transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Cerrar Sesión
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            onClick={() => closeSidebar()}
                            className="flex items-center w-full px-4 py-3 text-sm font-bold text-green-100 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                        >
                            <Users className="mr-3 h-5 w-5" />
                            Iniciar Sesión
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
