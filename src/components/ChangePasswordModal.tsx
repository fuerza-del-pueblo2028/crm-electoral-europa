"use client";

import { useState } from "react";
import { X, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { dbUpdate } from "@/lib/dbWrite";
import { cn } from "@/lib/utils";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userCedula: string;
}

export function ChangePasswordModal({ isOpen, onClose, userCedula }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas nuevas no coinciden.");
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            setLoading(false);
            return;
        }

        try {
            // 1. Verificar contraseña actual
            const { data: user, error: fetchError } = await supabase
                .from('usuarios')
                .select('password')
                .eq('cedula', userCedula)
                .single();

            if (fetchError || !user) throw new Error("No se pudo verificar el usuario.");

            if (user.password !== currentPassword) {
                setError("La contraseña actual es incorrecta.");
                setLoading(false);
                return;
            }

            // 2. Actualizar contraseña
            const result = await dbUpdate('usuarios', { password: newPassword }, { cedula: userCedula });

            if (!result.success) throw new Error(result.error);

            setSuccess("¡Contraseña actualizada con éxito!");
            setTimeout(() => {
                onClose();
                // Limpiar campos
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setSuccess("");
            }, 2000);

        } catch (err: any) {
            setError("Error al cambiar la contraseña: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-fp-green p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 text-white/60 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Lock size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Seguridad</h2>
                            <p className="text-green-100 text-xs font-bold uppercase tracking-widest">Cambiar Contraseña</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {(error || success) && (
                        <div className={cn(
                            "p-4 rounded-2xl text-xs font-bold border animate-in slide-in-from-top-2",
                            success ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-600"
                        )}>
                            {error || success}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contraseña Actual</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    required
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-transparent focus:border-fp-green focus:bg-white border-2 rounded-2xl text-sm transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-2" />

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nueva Contraseña</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    required
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-transparent focus:border-fp-green focus:bg-white border-2 rounded-2xl text-sm transition-all outline-none"
                                    placeholder="Nueva clave"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirmar Nueva Contraseña</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    required
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-transparent focus:border-fp-green focus:bg-white border-2 rounded-2xl text-sm transition-all outline-none"
                                    placeholder="Repite la clave"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#137228] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-fp-green-dark transform hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                Actualizando...
                            </>
                        ) : "Guardar Cambios"}
                    </button>
                </form>
            </div>
        </div>
    );
}
