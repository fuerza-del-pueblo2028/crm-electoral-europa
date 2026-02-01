"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { SECCIONALES } from "@/lib/mockData";
import { X, Save, Loader2, Plus } from "lucide-react";
import { registrarCambio } from "@/lib/historial";

interface NewAffiliateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewAffiliateModal({ isOpen, onClose, onSuccess }: NewAffiliateModalProps) {
    const [loading, setLoading] = useState(false);
    const [lastSavedPhone, setLastSavedPhone] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        cedula: "",
        fechaNacimiento: "",
        seccional: SECCIONALES[0],
        email: "",
        telefono: "",
        role: "Miembro" as "Miembro" | "Miembro DC" | "Presidente DM" | "Presidente DB" | "Operador" | "Admin",
        cargoOrganizacional: ""
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    if (!isOpen) return null;

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let uploadedFotoUrl: string | null = null;

            // 1. Subir foto si existe
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${formData.cedula}_${Math.random()}.${fileExt}`;
                const filePath = `perfiles/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('fotos_afiliados')
                    .upload(filePath, photoFile);

                if (uploadError) {
                    console.error("Error upload (continuing without photo):", uploadError);
                    // We continue even if upload fails, setting URL to null implicitly (it stays null)
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('fotos_afiliados')
                        .getPublicUrl(filePath);
                    uploadedFotoUrl = publicUrl;
                }
            }

            const dataToInsert: any = {
                nombre: formData.nombre,
                apellidos: formData.apellidos,
                cedula: formData.cedula,
                fecha_nacimiento: formData.fechaNacimiento,
                seccional: formData.seccional,
                email: formData.email,
                role: formData.role,
                validado: false,
                foto_url: uploadedFotoUrl
            };

            // Only add input if it's not empty, otherwise undefined
            if (formData.telefono && formData.telefono.trim() !== "") {
                dataToInsert.telefono = formData.telefono;
            }

            if (formData.cargoOrganizacional && formData.cargoOrganizacional.trim() !== "") {
                dataToInsert.cargo_organizacional = formData.cargoOrganizacional;
            }

            const { data: insertedData, error } = await supabase
                .from('afiliados')
                .insert([dataToInsert])
                .select();

            if (error) throw error;

            // Registrar en el historial
            if (insertedData && insertedData.length > 0) {
                await registrarCambio({
                    afiliado_id: insertedData[0].id,
                    accion: 'creado',
                    detalles: {
                        nombre_completo: `${formData.nombre} ${formData.apellidos}`,
                        cedula: formData.cedula,
                        seccional: formData.seccional
                    }
                });
            }

            // --- Email de Bienvenida (Next.js API) ---
            if (formData.email) {
                console.log('🔔 Intentando enviar email de bienvenida a:', formData.email);

                fetch('/api/emails/welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        nombre: `${formData.nombre} ${formData.apellidos}`
                    })
                })
                    .then(res => {
                        console.log('📬 Respuesta del servidor de email:', res.status);
                        return res.json();
                    })
                    .then(data => {
                        console.log('📧 Resultado del envío:', data);
                        if (data.success) {
                            console.log('✅ Email enviado exitosamente!');
                        } else {
                            console.warn('⚠️ Email no enviado:', data.error || data.warning);
                        }
                    })
                    .catch(err => {
                        console.error('❌ Error enviando email bienvenida:', err);
                    });
            } else {
                console.log('⚠️ No se envió email - no hay email en el formulario');
            }
            // -----------------------------------------

            onSuccess();
            // Do NOT close immediately if we want to show WhatsApp button
            setLastSavedPhone(formData.telefono);

            // Reset form partly
            setFormData({
                nombre: "",
                apellidos: "",
                cedula: "",
                fechaNacimiento: "",
                seccional: SECCIONALES[0],
                email: "",
                telefono: "",
                role: "Miembro",
                cargoOrganizacional: ""
            });
            // alert("Afiliado registrado correctamente"); // Replaced by UI feedback
        } catch (error: any) {
            // PostgreSQL unique constraint violation code is 23505
            if (error.code === '23505') {
                // Check which field caused the duplicate
                if (error.message.includes('afiliados_email_unique')) {
                    alert('⚠️ Este correo electrónico ya está registrado por otro afiliado. Por favor usa un email diferente.');
                } else if (error.message.includes('afiliados_telefono_unique')) {
                    alert('⚠️ Este número de teléfono ya está registrado por otro afiliado. Por favor usa un teléfono diferente.');
                } else {
                    alert('⚠️ Ya existe un afiliado con estos datos. Por favor verifica la información.');
                }
            } else {
                alert("Error al registrar: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (lastSavedPhone) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 p-6 text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <Save size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#005c2b]">¡Guardado con éxito!</h2>
                        <p className="text-gray-500 mt-2">El afiliado ha sido registrado en la base de datos.</p>
                    </div>

                    <a
                        href={`https://wa.me/${lastSavedPhone.replace(/\D/g, '')}?text=${encodeURIComponent("Hola, bienvenido a la Fuerza del Pueblo (SAE FP-Europa). Tu registro ha sido procesado exitosamente.")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-green-200"
                    >
                        Enviar Bienvenida por WhatsApp
                    </a>

                    <button
                        onClick={() => {
                            setLastSavedPhone(null);
                            onClose();
                        }}
                        className="block w-full text-gray-400 hover:text-gray-600 font-medium text-sm"
                    >
                        Cerrar y continuar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="bg-fp-green px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-xl font-bold">Nuevo Afiliado</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Nombre</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green text-[#005c2b] font-medium"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Apellidos</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green text-gray-900 font-medium"
                            value={formData.apellidos}
                            onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Cédula</label>
                        <input
                            required
                            placeholder="001-0000000-0"
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green text-gray-900 font-medium"
                            value={formData.cedula}
                            onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Fecha de Nacimiento</label>
                        <input
                            required
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green text-gray-900 font-medium"
                            value={formData.fechaNacimiento}
                            onChange={e => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green text-gray-900 font-medium"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Celular (WhatsApp)</label>
                        <input
                            type="tel"
                            placeholder="Ej: 34600123456"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green text-gray-900 font-medium"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                        />
                        <p className="text-xs text-gray-400 mt-1">Incluye el código de país (ej. 34 para España)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Seccional</label>
                        <select
                            className="w-full px-3  py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green bg-white text-[#005c2b] font-medium"
                            value={formData.seccional}
                            onChange={e => setFormData({ ...formData, seccional: e.target.value })}
                        >
                            {SECCIONALES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Role</label>
                        <select
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green bg-white text-gray-700 font-medium"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                        >
                            <option value="Miembro">Miembro (Sin permisos especiales)</option>
                            <option value="Miembro DC">Miembro DC (Dirección Central)</option>
                            <option value="Presidente DM">Presidente DM</option>
                            <option value="Presidente DB">Presidente DB</option>
                            <option value="Operador">Operador (Puede gestionar afiliados)</option>
                            <option value="Admin">Admin (Permisos completos)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#005c2b] mb-1">Cargo Organizacional (Opcional)</label>
                        <input
                            type="text"
                            placeholder="Ej: Secretario General, Vocal, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fp-green text-gray-900 font-medium"
                            value={formData.cargoOrganizacional}
                            onChange={e => setFormData({ ...formData, cargoOrganizacional: e.target.value })}
                        />
                        <p className="text-xs text-gray-400 mt-1">Campo libre para especificar un cargo organizacional</p>
                    </div>

                    <div className="flex flex-col items-center space-y-2 py-4 border-t border-b border-gray-50 bg-gray-50/30 rounded-2xl">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#005c2b]">Fotografía Oficial (Opcional)</label>
                        <div
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden hover:border-fp-green bg-white group transition-all shadow-inner"
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-300 group-hover:text-fp-green transition-colors">
                                    <Plus size={24} />
                                    <span className="text-[8px] font-black uppercase mt-1">Subir Foto</span>
                                </div>
                            )}
                        </div>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-fp-green text-white py-3 rounded-lg font-bold hover:bg-fp-green-dark transition-colors flex justify-center items-center mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Guardar Afiliado</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
