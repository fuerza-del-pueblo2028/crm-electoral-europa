"use client";

import { useState } from "react";
import { Send, Mail, User, MessageSquare, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function ContactoPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: "" });
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        asunto: "",
        mensaje: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: null, msg: "" });

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al enviar el mensaje.");

            setStatus({
                type: 'success',
                msg: "¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto."
            });
            setFormData({ nombre: "", email: "", asunto: "", mensaje: "" });

        } catch (error: any) {
            setStatus({ type: 'error', msg: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl w-full space-y-8 bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-100">

                {/* Header Sección */}
                <div className="text-center space-y-4">
                    <div className="bg-[#005c2b]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10 text-[#005c2b]" />
                    </div>
                    <h2 className="text-4xl font-black text-[#005c2b] tracking-tight">
                        Contáctanos
                    </h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        ¿Tienes alguna inquietud o sugerencia? Estamos aquí para escucharte.
                        Completa el formulario y te responderemos a la brevedad.
                    </p>
                </div>

                {/* Status Message */}
                {status.msg && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {status.type === 'success' ? <CheckCircle className="shrink-0" size={24} /> : <AlertCircle className="shrink-0" size={24} />}
                        <span className="font-medium">{status.msg}</span>
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nombre */}
                        <div className="space-y-2">
                            <label htmlFor="nombre" className="block text-xs font-black uppercase tracking-widest text-[#005c2b]/70">
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={18} />
                                </div>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005c2b] focus:bg-white transition-all sm:text-sm font-medium text-gray-900"
                                    placeholder="Tu nombre"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-[#005c2b]/70">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005c2b] focus:bg-white transition-all sm:text-sm font-medium text-gray-900"
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Asunto */}
                    <div className="space-y-2">
                        <label htmlFor="asunto" className="block text-xs font-black uppercase tracking-widest text-[#005c2b]/70">
                            Asunto
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <MessageSquare size={18} />
                            </div>
                            <input
                                id="asunto"
                                name="asunto"
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005c2b] focus:bg-white transition-all sm:text-sm font-medium text-gray-900"
                                placeholder="¿Sobre qué quieres hablarnos?"
                                value={formData.asunto}
                                onChange={e => setFormData({ ...formData, asunto: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Mensaje */}
                    <div className="space-y-2">
                        <label htmlFor="mensaje" className="block text-xs font-black uppercase tracking-widest text-[#005c2b]/70">
                            Mensaje
                        </label>
                        <textarea
                            id="mensaje"
                            name="mensaje"
                            rows={6}
                            required
                            className="block w-full px-4 py-3 border border-gray-200 rounded-xl leading-tight bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005c2b] focus:bg-white transition-all sm:text-sm font-medium text-gray-900 resize-none"
                            placeholder="Escribe tu mensaje aquí..."
                            value={formData.mensaje}
                            onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
                        />
                    </div>

                    {/* Botón Submit */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-green-200 text-sm font-black text-white bg-[#005c2b] hover:bg-[#00421f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005c2b] disabled:opacity-70 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={18} /> Enviando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send size={18} /> Enviar Mensaje
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Info */}
                <div className="text-center mt-8 pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} Fuerza del Pueblo Europa. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
