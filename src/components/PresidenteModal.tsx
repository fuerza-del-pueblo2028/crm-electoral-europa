"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, User, Mail, Phone, MapPin, Calendar, CreditCard, Activity } from "lucide-react";

interface PresidenteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData: any;
    seccionales: string[];
}

export function PresidenteModal({ isOpen, onClose, onSave, initialData, seccionales }: PresidenteModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        cedula: "",
        fechaNacimiento: "",
        email: "",
        seccional: "",
        celular: "",
        pais: "",
        condado_provincia: "",
        status: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre || "",
                apellidos: initialData.apellidos || "",
                cedula: initialData.cedula || "",
                fechaNacimiento: initialData.fecha_nacimiento || initialData.fechaNacimiento || "",
                email: initialData.email || "",
                seccional: initialData.seccional || "",
                celular: initialData.celular || "",
                pais: initialData.pais || "",
                condado_provincia: initialData.condado_provincia || "",
                status: initialData.status || ""
            });
        } else {
            setFormData({
                nombre: "",
                apellidos: "",
                cedula: "",
                fechaNacimiento: "",
                email: "",
                seccional: "",
                celular: "",
                pais: "",
                condado_provincia: "",
                status: ""
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setLoading(false);
        }
    };

    const isNew = !initialData || initialData.id === 'new';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#004d23] to-[#006e32] px-6 py-5 flex items-center justify-between shadow-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <User className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">
                                {isNew ? 'Nueva DM' : 'Editar Presidente DM'}
                            </h2>
                            <p className="text-green-100 text-xs font-medium opacity-90">
                                {isNew ? 'Registrar nuevo presidente de demarcación' : 'Modificar datos del presidente'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">
                    <div className="space-y-6">

                        {/* Personal Info Group */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                                <User size={14} /> Información Personal
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Apellidos *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.apellidos}
                                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <CreditCard size={14} className="text-gray-400" /> Cédula *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="000-0000000-0"
                                        value={formData.cedula}
                                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Calendar size={14} className="text-gray-400" /> Fecha Nacimiento *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fechaNacimiento}
                                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact & Location Group */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                                <MapPin size={14} /> Contacto y Ubicación
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Mail size={14} className="text-gray-400" /> Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Phone size={14} className="text-gray-400" /> Celular *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.celular}
                                        onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Seccional *</label>
                                    <select
                                        value={formData.seccional}
                                        onChange={(e) => setFormData({ ...formData, seccional: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {seccionales.filter(s => s !== 'Todos').map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">País</label>
                                    <input
                                        type="text"
                                        value={formData.pais}
                                        onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Provincia / Condado</label>
                                    <input
                                        type="text"
                                        value={formData.condado_provincia}
                                        onChange={(e) => setFormData({ ...formData, condado_provincia: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Activity size={14} className="text-gray-400" /> Estatus
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Completo">Completo</option>
                                        <option value="Suficiente">Suficiente</option>
                                        <option value="Incompleto">Incompleto</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="bg-white border-t border-gray-200 p-6 flex justify-end gap-3 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-fp-green text-white rounded-xl font-bold hover:bg-fp-green-dark transition-all shadow-lg hover:shadow-green-500/30 active:scale-95 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
