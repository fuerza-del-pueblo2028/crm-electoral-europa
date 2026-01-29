"use client";

import { LogOut, User, Menu, Key } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSidebar } from "./ui/SidebarContext";
import { usePathname } from "next/navigation";
import { ChangePasswordModal } from "./ChangePasswordModal";

export function Header() {
    const [userRole, setUserRole] = useState("");
    const [userName, setUserName] = useState("");
    const [userCedula, setUserCedula] = useState("");
    const [isActiveUser, setIsActiveUser] = useState(false);
    const [isChangePassOpen, setIsChangePassOpen] = useState(false);
    const pathname = usePathname();

    const { toggleSidebar } = useSidebar();

    useEffect(() => {
        const role = localStorage.getItem("user_role") || "";
        const name = localStorage.getItem("user_name");
        const cedula = localStorage.getItem("user_cedula") || "";
        const active = localStorage.getItem("user_active") === "true";
        setUserRole(role);
        setUserName(name || (role ? "Usuario" : "Invitado"));
        setUserCedula(cedula);
        setIsActiveUser(active);
    }, [pathname]);

    // Solo ocultar si estamos explícitamente en login y NO hay rol definido
    if (pathname?.includes("/login") && !userRole) return null;

    const isAuthenticated = !!userRole;

    return (
        <header className="bg-[#137228] px-3 md:px-8 py-2 md:py-4 shadow-lg border-b-2 border-[#0aa059] flex justify-between items-center sticky top-0 z-40 no-print">
            <div className="flex items-center space-x-3 md:space-x-4 relative overflow-hidden">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden text-white hover:bg-white/10 p-1 rounded-lg transition-colors flex-shrink-0"
                >
                    <Menu size={24} />
                </button>
                <Link href="/" className="flex items-center space-x-3 md:space-x-4">
                    <img src="/logo-fp.png" alt="FP Logo" className="w-10 h-10 md:w-16 md:h-16 object-contain drop-shadow-md flex-shrink-0" />
                    <div className="flex flex-col justify-center overflow-hidden">
                        <h1
                            className="text-white text-sm sm:text-lg md:text-2xl font-bold tracking-tight leading-none truncate block"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            Fuerza del Pueblo Europa
                        </h1>
                        <p
                            className="text-green-200 text-[10px] sm:text-xs md:text-sm font-light tracking-wide leading-none mt-0.5 truncate block"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            Secretaría de Asuntos Electorales
                        </p>
                    </div>
                </Link>

                {!isAuthenticated && (
                    <Link
                        href="/login"
                        className="ml-4 md:ml-8 flex items-center space-x-2 bg-white text-[#137228] hover:bg-[#0aa059] hover:text-white px-4 py-2 md:px-6 md:py-2.5 rounded-xl transition-all shadow-xl font-black uppercase tracking-widest text-xs md:text-sm whitespace-nowrap border-2 border-white/20 active:scale-95"
                    >
                        <User size={18} />
                        <span>Entra</span>
                    </Link>
                )}
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                {userRole === "administrador" && (
                    <Link href="/admin" className="hidden lg:flex items-center space-x-2 bg-[#004d24] px-3 py-1.5 rounded-full border border-green-700/50 hover:bg-[#00843D] transition-colors cursor-pointer text-white">
                        <User size={16} className="text-green-200" />
                        <span className="text-sm font-medium">Administrador</span>
                    </Link>
                )}

                {userRole === "afiliado" && (
                    <div className="hidden lg:flex items-center space-x-2 bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-700/50 text-white">
                        <User size={16} className="text-blue-200" />
                        <span className="text-sm font-medium">Afiliado Registrado</span>
                    </div>
                )}

                {isAuthenticated && (
                    <>
                        <div className="flex flex-col items-end mr-2">
                            <div className="text-white text-sm hidden sm:block font-bold leading-none">
                                {userName}
                            </div>
                            {userRole === "afiliado" ? (
                                <span className="text-[9px] font-black text-blue-200 uppercase tracking-tighter mt-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">Afiliado FP</span>
                            ) : isActiveUser ? (
                                <span className="text-[9px] font-black text-green-200 uppercase tracking-tighter mt-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">Confirmado</span>
                            ) : (
                                <span className="text-[9px] font-black text-yellow-300 uppercase tracking-tighter mt-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/5 animate-pulse">Pendiente</span>
                            )}
                        </div>

                        <button
                            onClick={() => setIsChangePassOpen(true)}
                            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all shadow-md text-white whitespace-nowrap border border-white/10"
                            title="Cambiar Contraseña"
                        >
                            <Key size={18} className="text-green-200" />
                            <span className="text-sm font-medium hidden md:inline">Clave</span>
                        </button>

                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = "/login";
                            }}
                            className="flex items-center space-x-2 bg-red-600/90 hover:bg-red-700 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all shadow-md text-white whitespace-nowrap"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium hidden md:inline">Salir</span>
                        </button>
                    </>
                )}
            </div>

            <ChangePasswordModal
                isOpen={isChangePassOpen}
                onClose={() => setIsChangePassOpen(false)}
                userCedula={userCedula}
            />
        </header>
    );
}
