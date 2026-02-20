"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const t = searchParams?.get('token');
        if (t) {
            setToken(t);
        } else {
            setError("Enlace de recuperación inválido o inexistente.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Enlace inválido.");
            return;
        }

        if (newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/verify-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Error al actualizar la contraseña");
                setLoading(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);

        } catch (err: any) {
            setError("Error de conexión al servidor.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-fp-green flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    src="/login-bg.png"
                    alt="Fondo"
                    className="w-full h-full object-cover opacity-40 transition-opacity duration-1000"
                />
            </div>

            <div className="w-full max-w-md z-10 space-y-8">
                <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <h2 className="text-white text-3xl font-black italic tracking-tighter drop-shadow-lg">
                        Secretaría De Asuntos Electorales
                    </h2>
                </div>

                <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Lock size={32} className="text-fp-green" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Crear nueva contraseña</h1>
                        <p className="text-gray-500 text-sm">Ingresa tu nueva contraseña para acceder a la plataforma.</p>
                    </div>

                    <div className="px-8 pb-8">
                        {error && !success && (
                            <div className="border bg-red-50 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm transition-all animate-in zoom-in-95 flex items-center gap-2 mb-6">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {success ? (
                            <div className="text-center space-y-4 animate-in fade-in zoom-in py-6">
                                <CheckCircle2 className="mx-auto text-green-500" size={64} />
                                <h3 className="text-xl font-bold text-gray-900">¡Contraseña restablecida!</h3>
                                <p className="text-gray-500 text-sm">Tu contraseña ha sido cambiada de forma segura.</p>
                                <p className="text-xs font-bold text-fp-green mt-4">Redirigiendo al inicio de sesión...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-fp-green">Nueva Contraseña</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-fp-green transition-colors" size={18} />
                                            <input
                                                required
                                                type="password"
                                                placeholder="Min. 6 caracteres"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-fp-green focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                                disabled={!token}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-fp-green">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-fp-green transition-colors" size={18} />
                                            <input
                                                required
                                                type="password"
                                                placeholder="Repite la nueva contraseña"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-fp-green focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                                disabled={!token}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className="w-full bg-[#137228] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-fp-green-dark transform hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                                >
                                    {loading ? "Guardando..." : "Restablecer Contraseña"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
