"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, Mail, UserPlus, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { dbInsert } from "@/lib/dbWrite";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [cedula, setCedula] = useState("");
    const [password, setPassword] = useState("");

    // Estados para Recuperación
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotCedula, setForgotCedula] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    // Estados para Registro
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [regForm, setRegForm] = useState({ cedula: "", nombre: "", email: "" });
    const [regLoading, setRegLoading] = useState(false);

    // Contexto de autenticación
    const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();

    // Redirección si ya está loqueado
    if (!authLoading && isAuthenticated) {
        if (typeof window !== 'undefined') {
            window.location.href = "/";
        }
        return (
            <div className="min-h-screen bg-fp-green flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const cleanCedula = cedula.replace(/-/g, "").trim();
        let formattedCedula = cleanCedula;
        if (cleanCedula.length === 11) {
            formattedCedula = `${cleanCedula.substring(0, 3)}-${cleanCedula.substring(3, 10)}-${cleanCedula.substring(10)}`;
        }

        try {
            // Usar la nueva API de Login segura
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula: cleanCedula, password })
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Cédula o contraseña incorrecta");
                setLoading(false);
                return;
            }

            if (result.requirePasswordChange) {
                // El usuario debe crear su contraseña segura
                sessionStorage.setItem("temp_user_id", result.tempUserId);
                sessionStorage.setItem("temp_user_role", result.tempUserRole);
                router.push("/login/force-change");
                return;
            }

            // Refrescar la sesión en Context
            await refreshSession();

            // Redirigir al dashboard
            window.location.href = "/";
        } catch (err: any) {
            setError("Error de conexión: " + err.message);
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegLoading(true);
        setError("");
        setSuccess("");

        const cleanCedula = regForm.cedula.replace(/-/g, "");
        let formattedCedula = cleanCedula;
        if (cleanCedula.length === 11) {
            formattedCedula = `${cleanCedula.substring(0, 3)}-${cleanCedula.substring(3, 10)}-${cleanCedula.substring(10)}`;
        }

        try {
            // 1. Intentar validar si está en la estructura autorizada (opcional ahora)
            const { data: authUser } = await supabase
                .from('estructura_autorizada')
                .select('*')
                .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
                .single();

            // 2. Verificar si ya tiene cuenta (usando ambos formatos)
            const { data: existingUser } = await supabase
                .from('usuarios')
                .select('id')
                .or(`cedula.eq."${cleanCedula}",cedula.eq."${formattedCedula}"`)
                .maybeSingle();

            if (existingUser) {
                setError("Esta cédula ya tiene una cuenta activa. Intenta recuperar tu clave.");
                setRegLoading(false);
                return;
            }

            // 3. Crear la contraseña (últimos 6 dígitos de la cédula limpia)
            const generatedPassword = cleanCedula.substring(cleanCedula.length - 6);

            // 4. Registrar en la tabla de usuarios
            // Si estaba en la estructura autorizada, usamos sus datos oficiales. 
            // Si no, usamos lo que puso en el formulario.
            const result = await dbInsert('usuarios', {
                cedula: regForm.cedula,
                nombre: authUser?.nombre || regForm.nombre,
                email: regForm.email,
                password: generatedPassword,
                rol: 'operador',
                activo: false,
                seccional: authUser?.seccional || 'Madrid'
            });

            if (!result.success) throw new Error(result.error);

            setSuccess("¡Registro exitoso! Tu clave son los últimos 6 dígitos de tu cédula.");
            setIsRegisterModalOpen(false);
            setRegForm({ cedula: "", nombre: "", email: "" });
        } catch (err: any) {
            setError("Error en el registro: " + err.message);
        } finally {
            setRegLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotLoading(true);
        setError("");
        setSuccess("");

        const cleanCedula = forgotCedula.replace(/-/g, "");
        let formattedCedula = cleanCedula;
        if (cleanCedula.length === 11) {
            formattedCedula = `${cleanCedula.substring(0, 3)}-${cleanCedula.substring(3, 10)}-${cleanCedula.substring(10)}`;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula: cleanCedula }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Cédula no encontrada.");
                setForgotLoading(false);
                return;
            }

            setSuccess("Si la cédula existe y tiene correo, te hemos enviado las instrucciones de recuperación.");
            setTimeout(() => {
                setIsForgotModalOpen(false);
                setForgotCedula("");
            }, 5000);
        } catch (err: any) {
            setError("Error al recuperar clave.");
        } finally {
            setForgotLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-fp-green flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-fp-green flex items-center justify-center p-4 relative overflow-hidden">
            {/* Capa de imagen de fondo */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/login-bg.png"
                    alt="Fondo"
                    className="w-full h-full object-cover opacity-40 transition-opacity duration-1000"
                />
            </div>

            <div className="w-full max-w-md z-10 space-y-8">
                {/* Título fuera del contenedor */}
                <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <h2 className="text-white text-3xl font-black italic tracking-tighter drop-shadow-lg">
                        Secretaría De Asuntos Electorales
                    </h2>
                </div>

                <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300">
                    <div className="p-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-fp-green/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <ShieldCheck size={32} className="text-fp-green" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#005c2b]">Iniciar Sesión</h1>
                        <p className="text-gray-500 text-sm">Acceso al CRM Electoral de Europa</p>
                    </div>

                    <form onSubmit={handleLogin} className="px-8 pb-8 space-y-6">
                        {(error || success) && (
                            <div className={cn(
                                "border px-4 py-3 rounded-lg text-sm transition-all animate-in zoom-in-95",
                                success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                            )}>
                                {error || success}
                            </div>
                        )}

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-fp-green">Cédula</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-fp-green transition-colors" size={18} />
                                <input
                                    required
                                    type="text"
                                    placeholder="001-0000000-0"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-fp-green focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-fp-green">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-fp-green transition-colors" size={18} />
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-fp-green focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#137228] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-fp-green-dark transform hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center overflow-hidden relative group"
                        >
                            <span className="relative z-10">{loading ? "Validando..." : "Entrar al Sistema"}</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>

                        <div className="flex flex-col gap-4 pt-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                <button
                                    onClick={() => setIsForgotModalOpen(true)}
                                    type="button"
                                    className="text-fp-green hover:underline decoration-2 underline-offset-4"
                                >
                                    ¿Olvidaste tu clave?
                                </button>
                                <button
                                    onClick={() => setIsRegisterModalOpen(true)}
                                    type="button"
                                    className="text-blue-600 hover:underline decoration-2 underline-offset-4"
                                >
                                    Registrarme
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-[9px] text-gray-300 mt-6 uppercase tracking-[0.3em] font-black">
                            FP Europa · SAE v2.2
                        </p>
                    </form>
                </div>
            </div>

            {/* Modal de Registro */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6 transform animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <UserPlus size={24} />
                            </div>
                            <h2 className="text-xl font-extrabold text-gray-800">Crea tu cuenta</h2>
                            <p className="text-xs text-gray-500">Solo para estructura autorizada</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Cédula</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="000-0000000-0"
                                    value={regForm.cedula}
                                    onChange={(e) => setRegForm({ ...regForm, cedula: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tu Correo</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="ejemplo@email.com"
                                    value={regForm.email}
                                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRegisterModalOpen(false)}
                                    className="flex-1 px-4 py-3 text-xs font-bold text-gray-400 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={regLoading}
                                    className="flex-[2] px-4 py-3 text-xs font-black uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                                >
                                    {regLoading ? "Validando..." : "Registrar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Recuperación */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6 transform animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-green-50 text-fp-green rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <Mail size={24} />
                            </div>
                            <h2 className="text-xl font-extrabold text-gray-800">Recuperar clave</h2>
                            <p className="text-xs text-gray-500">Enviáremos los datos a tu correo</p>
                        </div>

                        <form onSubmit={handleForgotPassword} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Cédula del usuario</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="000-0000000-0"
                                    value={forgotCedula}
                                    onChange={(e) => setForgotCedula(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-fp-green outline-none transition-all"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotModalOpen(false)}
                                    className="flex-1 px-4 py-3 text-xs font-bold text-gray-400 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="flex-[2] px-4 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#137228] rounded-2xl hover:bg-fp-green-dark shadow-lg shadow-green-200 transition-all disabled:opacity-50"
                                >
                                    {forgotLoading ? "Buscando..." : "Enviar Datos"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
