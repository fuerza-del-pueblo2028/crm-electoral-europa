"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Building2, MapPin, Users, Hash } from "lucide-react";

interface RecintoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData: any;
}

export function RecintoModal({ isOpen, onClose, onSave, initialData }: RecintoModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        seccional: "",
        numero_recinto: "",
        nombre_recinto: "",
        zona_ciudad: "",
        direccion: "",
        total_electores: 0,
        total_colegios: 0,
        colegios_numeros: ""
    });

    const seccionales = ['Madrid', 'Barcelona', 'Milano', 'Holanda', 'Valencia', 'Zurich'];

    useEffect(() => {
        if (initialData) {
            setFormData({
                seccional: initialData.seccional || "",
                numero_recinto: initialData.numero_recinto || "",
                nombre_recinto: initialData.nombre_recinto || "",
                zona_ciudad: initialData.zona_ciudad || "",
                direccion: initialData.direccion || "",
                total_electores: initialData.total_electores || 0,
                total_colegios: initialData.total_colegios || 0,
                colegios_numeros: initialData.colegios_numeros || ""
            });
        } else {
            setFormData({
                seccional: "",
                numero_recinto: "",
                nombre_recinto: "",
                zona_ciudad: "",
                direccion: "",
                total_electores: 0,
                total_colegios: 0,
                colegios_numeros: ""
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
                            <Building2 className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">
                                {isNew ? 'Nuevo Recinto' : 'Editar Recinto'}
                            </h2>
                            <p className="text-green-100 text-xs font-medium opacity-90">
                                {isNew ? 'Registrar nuevo recinto electoral' : 'Modificar datos del recinto'}
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

                        {/* Recinto Details Group */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                                <Building2 size={14} /> Detalles del Recinto
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Seccional *</label>
                                    {isNew ? (
                                        <select
                                            required
                                            value={formData.seccional}
                                            onChange={(e) => setFormData({ ...formData, seccional: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {seccionales.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData.seccional}
                                            disabled
                                            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Hash size={14} className="text-gray-400" /> Número Recinto *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: 00151"
                                        value={formData.numero_recinto}
                                        disabled={!isNew}
                                        onChange={(e) => setFormData({ ...formData, numero_recinto: e.target.value })}
                                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all ${!isNew ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'}`}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre del Recinto *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre_recinto}
                                        onChange={(e) => setFormData({ ...formData, nombre_recinto: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location & Capacity Group */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                                <MapPin size={14} /> Ubicación y Capacidad
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Zona / Ciudad *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.zona_ciudad}
                                        onChange={(e) => setFormData({ ...formData, zona_ciudad: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Dirección</label>
                                    <input
                                        type="text"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Users size={14} className="text-gray-400" /> Total Electores *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.total_electores}
                                        onChange={(e) => setFormData({ ...formData, total_electores: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Total Colegios *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.total_colegios}
                                        onChange={(e) => setFormData({ ...formData, total_colegios: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Números de Colegios</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 001, 002, 003"
                                        value={formData.colegios_numeros}
                                        onChange={(e) => setFormData({ ...formData, colegios_numeros: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fp-green focus:border-transparent transition-all"
                                    />
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
