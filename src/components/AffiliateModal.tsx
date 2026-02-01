"use client";

import { Affiliate, SECCIONALES } from "@/lib/mockData";
import { X, CheckCircle, XCircle, ShieldCheck, MessageSquare, Mail, Copy, Send, Phone, Trash2, Edit2, Save, Clock, Loader2 } from "lucide-react";
import { CarnetGenerator } from "./CarnetGenerator";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { registrarCambio, obtenerHistorial, formatAccion } from "@/lib/historial";

interface AffiliateModalProps {
    isOpen: boolean;
    onClose: () => void;
    affiliate: Affiliate | null;
    onDelete?: () => void;
}

const TEMPLATES = {
    bienvenida: {
        label: "Bienvenida",
        subject: "Bienvenido a la Fuerza del Pueblo",
        text: "¡Hola! Es un honor darte la bienvenida a la Plataforma Electoral de la Fuerza del Pueblo en Europa \"CRM Electoral\". Tu registro ha sido procesado exitosamente. Estamos a tu disposición."
    },
    info: {
        label: "Información General",
        subject: "Información Importante - FP Europa",
        text: "Hola, te compartimos información relevante sobre las próximas actividades de la seccional. Mantente atento."
    },
    verificacion: {
        label: "Solicitud de Datos",
        subject: "Actualización de Datos - SAE",
        text: "Saludos. Necesitamos confirmar algunos datos de tu perfil para completar tu validación en el padrón. Por favor contáctanos."
    },
    custom: {
        label: "Mensaje Personalizado",
        subject: "",
        text: ""
    }
};

export function AffiliateModal({ isOpen, onClose, affiliate, onDelete }: AffiliateModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCarnet, setShowCarnet] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'contact' | 'historial'>('info');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [historial, setHistorial] = useState<any[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);

    // Messaging State
    const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('bienvenida');
    const [messageText, setMessageText] = useState(TEMPLATES.bienvenida.text);
    const [emailSubject, setEmailSubject] = useState(TEMPLATES.bienvenida.subject);

    useEffect(() => {
        if (selectedTemplate !== 'custom') {
            setMessageText(TEMPLATES[selectedTemplate].text);
            setEmailSubject(TEMPLATES[selectedTemplate].subject);
        }
    }, [selectedTemplate]);

    useEffect(() => {
        const role = localStorage.getItem('user_role');
        setIsAdmin(role === 'administrador');
    }, []);

    // Cargar historial cuando se abre el modal
    useEffect(() => {
        if (isOpen && affiliate) {
            cargarHistorial();
        }
    }, [isOpen, affiliate]);

    const cargarHistorial = async () => {
        if (!affiliate) return;
        setLoadingHistorial(true);
        const data = await obtenerHistorial(affiliate.id);
        setHistorial(data);
        setLoadingHistorial(false);
    };

    if (!isOpen || !affiliate) return null;

    const handleWhatsApp = () => {
        const phone = affiliate.telefono || "34600000000";
        const encodedText = encodeURIComponent(messageText);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleEmail = () => {
        if (!affiliate.email) return;
        const encodedSubject = encodeURIComponent(emailSubject);
        const encodedBody = encodeURIComponent(messageText);
        window.open(`mailto:${affiliate.email}?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-fp-green px-6 pt-4 pb-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-white text-xl font-bold">Ficha del Afiliado</h2>
                        <div className="flex items-center gap-2">
                            {isAdmin && !isEditing && (
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setEditForm({
                                            nombre: affiliate.name,
                                            apellidos: affiliate.lastName,
                                            email: affiliate.email || '',
                                            telefono: affiliate.telefono || '',
                                            seccional: affiliate.seccional,
                                            cargo_organizacional: affiliate.cargo_organizacional || '',
                                            role: affiliate.role
                                        });
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    title="Editar"
                                    disabled={isSubmitting}
                                >
                                    <Edit2 size={20} />
                                </button>
                            )}
                            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex space-x-6 text-sm font-medium text-white/70">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`pb-3 border-b-2 transition-all ${activeTab === 'info' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}
                        >
                            Información
                        </button>
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'contact' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}
                        >
                            <MessageSquare size={16} /> Contacto
                        </button>
                        <button
                            onClick={() => setActiveTab('historial')}
                            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'historial' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}
                        >
                            <Clock size={16} /> Historial
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {activeTab === 'info' ? (
                        <>
                            {isEditing ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-[#005c2b] mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                value={editForm.nombre || ''}
                                                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fp-green"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-[#005c2b] mb-1">Apellidos</label>
                                            <input
                                                type="text"
                                                value={editForm.apellidos || ''}
                                                onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fp-green"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-[#005c2b] mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editForm.email || ''}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fp-green"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-[#005c2b] mb-1">Teléfono</label>
                                            <input
                                                type="tel"
                                                value={editForm.telefono || ''}
                                                onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fp-green"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-[#005c2b] mb-1">
                                                Seccional
                                            </label>
                                            <select
                                                value={editForm.seccional || ''}
                                                onChange={(e) => setEditForm({ ...editForm, seccional: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fp-green"
                                                disabled={isSubmitting}
                                            >
                                                {SECCIONALES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-[#005c2b] mb-1">
                                                Cargo Organizacional (Opcional)
                                            </label>
                                            <select
                                                value={editForm.cargo_organizacional || ''}
                                                onChange={(e) => setEditForm({ ...editForm, cargo_organizacional: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fp-green"
                                                disabled={isSubmitting}
                                            >
                                                <option value="">-- Sin cargo específico --</option>
                                                <option value="Miembro Dirección Central">Miembro Dirección Central</option>
                                                <option value="Presidente DM">Presidente DM</option>
                                                <option value="Presidente DB">Presidente DB</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">Selecciona si tiene un rol especial en la organización</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-red-600 mb-1 flex items-center gap-2">
                                                <ShieldCheck size={16} />
                                                Role del Sistema (Permisos)
                                            </label>
                                            <select
                                                value={editForm.role || 'Miembro'}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-red-50 font-bold text-red-900"
                                                disabled={isSubmitting}
                                            >
                                                <option value="Miembro">Miembro (Sin permisos especiales)</option>
                                                <option value="Miembro DC">Miembro DC (Dirección Central)</option>
                                                <option value="Presidente DM">Presidente DM</option>
                                                <option value="Presidente DB">Presidente DB</option>
                                                <option value="Operador">Operador (Puede gestionar afiliados)</option>
                                                <option value="Admin">Admin (Acceso total al sistema)</option>
                                            </select>
                                            <p className="text-xs text-red-500 mt-1 font-medium">⚠️ Cambiar el role afecta los permisos de acceso al sistema</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-4 border-t">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                // Verificar si el role cambió
                                                const roleChanged = editForm.role !== affiliate.role;

                                                if (roleChanged) {
                                                    const roleNames = {
                                                        'Miembro': 'Miembro (sin permisos)',
                                                        'Operador': 'Operador (puede gestionar afiliados)',
                                                        'Admin': 'Administrador (acceso total)'
                                                    };

                                                    const confirmMsg = `🔐 CAMBIO DE PERMISOS DE SEGURIDAD\n\n` +
                                                        `Estás a punto de cambiar el role de:\n` +
                                                        `➤ ${roleNames[affiliate.role as keyof typeof roleNames] || affiliate.role}\n` +
                                                        `a:\n` +
                                                        `➤ ${roleNames[editForm.role as keyof typeof roleNames] || editForm.role}\n\n` +
                                                        `Esto modificará los permisos de acceso al sistema.\n\n` +
                                                        `¿Estás seguro de continuar?`;

                                                    if (!confirm(confirmMsg)) {
                                                        return;
                                                    }
                                                }

                                                setIsSubmitting(true);
                                                try {
                                                    const { data, error } = await supabase
                                                        .from('afiliados')
                                                        .update({
                                                            nombre: editForm.nombre,
                                                            apellidos: editForm.apellidos,
                                                            email: editForm.email || null,
                                                            telefono: editForm.telefono || null,
                                                            seccional: editForm.seccional,
                                                            cargo_organizacional: editForm.cargo_organizacional || null,
                                                            role: editForm.role
                                                        })
                                                        .eq('id', affiliate.id)
                                                        .select();

                                                    if (error) {
                                                        if (error.code === '23505') {
                                                            if (error.message.includes('email')) {
                                                                alert('⚠️ Este email ya está registrado');
                                                            } else if (error.message.includes('telefono')) {
                                                                alert('⚠️ Este teléfono ya está registrado');
                                                            }
                                                        } else {
                                                            alert('Error: ' + error.message);
                                                        }
                                                    } else if (!data || data.length === 0) {
                                                        // Si no hay error pero no se devolvieron datos, es probable un bloqueo RLS
                                                        alert('⚠️ No se pudieron guardar los cambios.\n\nPosible causa: No tienes permisos para editar este registro o la política de seguridad (RLS) lo está impidiendo.\n\nContacta al administrador del sistema.');
                                                    } else {
                                                        // Registrar cambios en el historial
                                                        const cambios: string[] = [];

                                                        if (editForm.nombre !== affiliate.name) {
                                                            await registrarCambio({
                                                                afiliado_id: affiliate.id,
                                                                accion: 'editado',
                                                                campo_modificado: 'nombre',
                                                                valor_anterior: affiliate.name,
                                                                valor_nuevo: editForm.nombre
                                                            });
                                                            cambios.push('nombre');
                                                        }

                                                        if (editForm.apellidos !== affiliate.lastName) {
                                                            await registrarCambio({
                                                                afiliado_id: affiliate.id,
                                                                accion: 'editado',
                                                                campo_modificado: 'apellidos',
                                                                valor_anterior: affiliate.lastName,
                                                                valor_nuevo: editForm.apellidos
                                                            });
                                                            cambios.push('apellidos');
                                                        }

                                                        if (editForm.email !== (affiliate.email || '')) {
                                                            await registrarCambio({
                                                                afiliado_id: affiliate.id,
                                                                accion: 'editado',
                                                                campo_modificado: 'email',
                                                                valor_anterior: affiliate.email || 'sin email',
                                                                valor_nuevo: editForm.email || 'sin email'
                                                            });
                                                            cambios.push('email');
                                                        }

                                                        if (editForm.telefono !== (affiliate.telefono || '')) {
                                                            await registrarCambio({
                                                                afiliado_id: affiliate.id,
                                                                accion: 'editado',
                                                                campo_modificado: 'telefono',
                                                                valor_anterior: affiliate.telefono || 'sin teléfono',
                                                                valor_nuevo: editForm.telefono || 'sin teléfono'
                                                            });
                                                            cambios.push('teléfono');
                                                        }

                                                        if (editForm.seccional !== affiliate.seccional) {
                                                            await registrarCambio({
                                                                afiliado_id: affiliate.id,
                                                                accion: 'editado',
                                                                campo_modificado: 'seccional',
                                                                valor_anterior: affiliate.seccional,
                                                                valor_nuevo: editForm.seccional
                                                            });
                                                            cambios.push('seccional');
                                                        }

                                                        if (editForm.cargo_organizacional !== (affiliate.cargo_organizacional || '')) {
                                                            await registrarCambio({
                                                                afiliado_id: affiliate.id,
                                                                accion: 'editado',
                                                                campo_modificado: 'cargo_organizacional',
                                                                valor_anterior: affiliate.cargo_organizacional || 'sin cargo',
                                                                valor_nuevo: editForm.cargo_organizacional || 'sin cargo'
                                                            });
                                                            cambios.push('cargo organizacional');
                                                        }

                                                        if (roleChanged) {
                                                            await registrarCambio({
                                                                afiliado_id: affiliate.id,
                                                                accion: 'role_cambiado',
                                                                campo_modificado: 'role',
                                                                valor_anterior: affiliate.role,
                                                                valor_nuevo: editForm.role
                                                            });
                                                        }

                                                        if (roleChanged) {
                                                            alert(`✅ Datos actualizados\n🔐 Role cambiado a: ${editForm.role}`);
                                                        } else {
                                                            alert('✅ Datos actualizados');
                                                        }
                                                        setIsEditing(false);
                                                        onClose();
                                                        if (onDelete) onDelete(); // Refresh
                                                    }
                                                } catch (error: any) {
                                                    alert('Error: ' + error.message);
                                                } finally {
                                                    setIsSubmitting(false);
                                                }
                                            }}
                                            className="px-4 py-2 bg-fp-green text-white rounded-lg hover:bg-fp-green-dark flex items-center gap-2 disabled:opacity-50"
                                            disabled={isSubmitting}
                                        >
                                            <Save size={18} />
                                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Left Column: Photo & Status */}
                                    <div className="flex flex-col items-center space-y-6">
                                        <div className="w-40 h-40 rounded-full border-4 border-[#137228] overflow-hidden shadow-2xl relative group">
                                            <img
                                                src={affiliate.foto_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${affiliate.name}`}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-[#137228]/10 group-hover:bg-transparent transition-colors"></div>
                                        </div>
                                        <div className={`px-6 py-2 rounded-full flex items-center space-x-2 border-2 ${affiliate.validated ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                            {affiliate.validated ? <CheckCircle size={18} className="animate-pulse" /> : <XCircle size={18} />}
                                            <span className="text-sm font-black uppercase tracking-widest">{affiliate.validated ? "Validado" : "Pendiente"}</span>
                                        </div>
                                    </div>

                                    {/* Right Column: Details */}
                                    <div className="flex-1 space-y-8">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nombre Completo</label>
                                                <p className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter leading-none mt-1">{affiliate.name} {affiliate.lastName}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Número de Cédula</label>
                                                <p className="font-mono text-lg font-black text-[#137228] mt-1">{affiliate.cedula}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Delegación/Seccional</label>
                                                <p className="text-gray-800 font-bold uppercase italic mt-1">{affiliate.seccional}</p>
                                            </div>
                                            {affiliate.cargo_organizacional && (
                                                <div>
                                                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Cargo Organizacional</label>
                                                    <p className="text-[#137228] font-bold uppercase italic mt-1">{affiliate.cargo_organizacional}</p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Correo Electrónico</label>
                                                <p className="text-gray-600 font-medium truncate mt-1">{affiliate.email || 'No registrado'}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">WhatsApp</label>
                                                <p className="text-gray-600 font-medium truncate mt-1">{affiliate.telefono || 'No registrado'}</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-100 space-y-3">
                                            {isAdmin && (
                                                <button
                                                    onClick={async () => {
                                                        setIsSubmitting(true);
                                                        try {
                                                            const newStatus = !affiliate.validated;
                                                            const { error } = await supabase
                                                                .from('afiliados')
                                                                .update({ validado: newStatus })
                                                                .eq('id', affiliate.id);

                                                            if (error) {
                                                                alert('Error al actualizar: ' + error.message);
                                                            } else {
                                                                // Registrar en historial
                                                                await registrarCambio({
                                                                    afiliado_id: affiliate.id,
                                                                    accion: newStatus ? 'validado' : 'invalidado',
                                                                    valor_anterior: affiliate.validated ? 'validado' : 'pendiente',
                                                                    valor_nuevo: newStatus ? 'validado' : 'pendiente'
                                                                });

                                                                // alert(`✅ Afiliado ${newStatus ? 'validado' : 'marcado como pendiente'} exitosamente`);
                                                                // Don't close, just refresh if context allowed or parent update
                                                                onClose();
                                                                if (onDelete) onDelete(); // Refresh data
                                                            }
                                                        } catch (error: any) {
                                                            console.error('Error:', error);
                                                            alert('Error: ' + (error.message || 'Error desconocido'));
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }}
                                                    className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-lg ${affiliate.validated
                                                        ? "bg-orange-50 text-orange-600 border-2 border-orange-200 hover:bg-orange-600 hover:text-white"
                                                        : "bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-600 hover:text-white"
                                                        } disabled:opacity-50`}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <span>Procesando...</span>
                                                    ) : affiliate.validated ? (
                                                        <>
                                                            <XCircle size={18} />
                                                            <span>Marcar como Pendiente</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={18} />
                                                            <span>Validar Afiliado</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowCarnet(!showCarnet)}
                                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-xl ${showCarnet
                                                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                    : "bg-gray-900 text-white hover:bg-[#137228] shadow-gray-900/20"
                                                    }`}
                                            >
                                                <ShieldCheck size={18} />
                                                <span>{showCarnet ? "Cerrar Editor de Carnet" : "Gestionar Carnet Digital"}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Expandable Carnet Section */}
                            {showCarnet && (
                                <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 shadow-inner">
                                        <div className="text-center mb-8">
                                            <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter leading-none mb-2">Personalización de Carnet</h3>
                                            <p className="text-xs text-gray-500 font-medium">Sube tu foto oficial para completar el carnet de afiliado.</p>
                                        </div>
                                        <CarnetGenerator affiliate={affiliate} />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : activeTab === 'contact' ? (
                        /* Contact Tab Content */
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Plantilla</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedTemplate(key)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedTemplate === key
                                                ? "bg-fp-green text-white border-fp-green shadow-md"
                                                : "bg-white text-gray-500 border-gray-200 hover:border-fp-green/50"
                                                }`}
                                        >
                                            {TEMPLATES[key].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">Asunto (Solo Email)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fp-green text-sm font-medium"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="Asunto del correo..."
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">Mensaje</label>
                                    <textarea
                                        className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fp-green text-sm text-gray-700 resize-none"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Escribe tu mensaje aquí..."
                                    ></textarea>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(messageText)}
                                        className="absolute right-3 bottom-3 text-gray-400 hover:text-fp-green transition-colors"
                                        title="Copiar texto"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/30 active:scale-95"
                                >
                                    <Phone size={20} />
                                    <span>Enviar WhatsApp</span>
                                </button>
                                <button
                                    onClick={handleEmail}
                                    disabled={!affiliate.email}
                                    className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-gray-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Mail size={20} />
                                    <span>Enviar Email</span>
                                </button>
                            </div>

                            <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                                <ShieldCheck size={12} />
                                Las comunicaciones se enviarán desde tus aplicaciones predeterminadas por seguridad.
                            </p>
                        </div>
                    ) : activeTab === 'historial' ? (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 max-h-96 overflow-y-auto pr-2">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Historial de Cambios</h3>
                                    <p className="text-xs text-gray-500 mt-1">Registro de todas las modificaciones realizadas</p>
                                </div>
                                <button
                                    onClick={cargarHistorial}
                                    disabled={loadingHistorial}
                                    className="text-fp-green hover:text-fp-green-dark transition-colors p-2 hover:bg-green-50 rounded-lg"
                                    title="Actualizar historial"
                                >
                                    <Clock size={18} className={loadingHistorial ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            {loadingHistorial ? (
                                <div className="flex flex-col items-center py-12 space-y-3">
                                    <Loader2 className="animate-spin text-fp-green" size={32} />
                                    <p className="text-xs text-gray-400 font-medium">Cargando historial...</p>
                                </div>
                            ) : historial.length === 0 ? (
                                <div className="text-center py-16 space-y-3">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                        <Clock size={28} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 font-bold text-sm">Sin historial de cambios</p>
                                    <p className="text-gray-400 text-xs">Este afiliado aún no tiene cambios registrados</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                                    <div className="space-y-4">
                                        {historial.map((item, index) => {
                                            const { icon, text, color } = formatAccion(item.accion);
                                            const fecha = new Date(item.created_at);
                                            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });

                                            return (
                                                <div key={item.id} className="relative flex gap-4 items-start">
                                                    {/* Timeline dot */}
                                                    <div className={`w-12 h-12 rounded-full bg-white border-2 ${item.accion === 'eliminado' ? 'border-red-300' :
                                                        item.accion === 'creado' ? 'border-green-300' :
                                                            item.accion === 'validado' ? 'border-green-300' :
                                                                item.accion === 'role_cambiado' ? 'border-purple-300' :
                                                                    'border-blue-300'
                                                        } flex items-center justify-center text-xl z-10 shadow-sm`}>
                                                        {icon}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <p className={`font-bold text-sm ${color} mb-1`}>
                                                                    {text}
                                                                </p>

                                                                {item.campo_modificado && (
                                                                    <div className="space-y-1 mt-2">
                                                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                                                            Campo: {item.campo_modificado}
                                                                        </p>
                                                                        {item.valor_anterior && item.valor_nuevo && (
                                                                            <div className="flex items-center gap-2 text-xs">
                                                                                <span className="text-red-600 line-through font-mono bg-red-50 px-2 py-1 rounded">
                                                                                    {item.valor_anterior}
                                                                                </span>
                                                                                <span className="text-gray-400">→</span>
                                                                                <span className="text-green-600 font-mono bg-green-50 px-2 py-1 rounded font-bold">
                                                                                    {item.valor_nuevo}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {item.detalles && Object.keys(item.detalles).length > 0 && (
                                                                    <div className="mt-2 text-xs text-gray-500">
                                                                        {item.detalles.nombre_completo && (
                                                                            <p>👤 {item.detalles.nombre_completo}</p>
                                                                        )}
                                                                        {item.detalles.cedula && (
                                                                            <p>🆔 {item.detalles.cedula}</p>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                                                                    <span className="font-medium">{item.usuario_nombre || 'Sistema'}</span>
                                                                    <span>•</span>
                                                                    <span>{fechaFormateada}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer con opción de eliminar */}
                <div className="px-8 pb-6">
                    {activeTab === 'info' && !isEditing && (
                        <button
                            onClick={async () => {
                                if (confirm('¿Seguro que desea eliminar este afiliado? Esta acción no se puede deshacer.')) {
                                    setIsSubmitting(true);
                                    try {
                                        // Registrar en historial ANTES de eliminar
                                        await registrarCambio({
                                            afiliado_id: affiliate.id,
                                            accion: 'eliminado',
                                            detalles: {
                                                nombre_completo: `${affiliate.name} ${affiliate.lastName}`,
                                                cedula: affiliate.cedula,
                                                seccional: affiliate.seccional
                                            }
                                        });

                                        const { error } = await supabase
                                            .from('afiliados')
                                            .delete()
                                            .eq('id', affiliate.id);

                                        if (error) {
                                            alert('Error al eliminar: ' + error.message);
                                        } else {
                                            alert('✅ Afiliado eliminado exitosamente');
                                            onClose();
                                            if (onDelete) onDelete();
                                        }
                                    } catch (error: any) {
                                        console.error('Error:', error);
                                        alert('Error: ' + (error.message || 'Error desconocido al eliminar'));
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }
                            }}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            <Trash2 size={18} />
                            <span>{isSubmitting ? 'Eliminando...' : 'Eliminar Afiliado'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
