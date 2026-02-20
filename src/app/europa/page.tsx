'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { dbInsert, dbUpdate, dbDelete } from '@/lib/dbWrite';
import { normalizeText } from '@/lib/utils';
import { Globe, MapPin, Users, Building2, Search, Filter, Edit2, X, Save } from 'lucide-react';
import { PresidenteModal } from '@/components/PresidenteModal';
import { RecintoModal } from '@/components/RecintoModal';
import { useAuth } from '@/context/AuthContext';

type Recinto = {
    id: string;
    seccional: string;
    numero_recinto: string;
    nombre_recinto: string;
    pais: string | null;
    zona_ciudad: string;
    direccion: string;
    total_electores: number;
    total_colegios: number;
    colegios: string;
    colegios_numeros: string | null;
};

type PresidenteDM = {
    id: string;
    nombre_completo: string; // Maintain for backward compatibility with view
    nombre?: string;
    apellidos?: string;
    cedula: string | null;
    celular: string | null;
    pais: string;
    condado_provincia: string | null;
    total_afiliados: number;
    status: string | null;
    email?: string;
    fechaNacimiento?: string;
    seccional?: string;
};

export default function EuropaPage() {
    const [recintos, setRecintos] = useState<Recinto[]>([]);
    const [presidentes, setPresidentes] = useState<PresidenteDM[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeccional, setSelectedSeccional] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'recintos' | 'presidentes'>('recintos');
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingRecinto, setEditingRecinto] = useState<Recinto | null>(null);
    const [editingPresidente, setEditingPresidente] = useState<PresidenteDM | null>(null);
    // const [editForm, setEditForm] = useState<Partial<Recinto>>({}); // Removed for modal state
    // const [presidentForm, setPresidentForm] = useState<Partial<PresidenteDM>>({}); // Removed in favor of modal state

    const seccionales = ['Todos', 'Madrid', 'Barcelona', 'Milano', 'Holanda', 'Valencia', 'Zurich'];

    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !user) {
            window.location.href = "/login";
            return;
        }

        const role = user.role;
        const normalizedRole = role?.toLowerCase().trim();
        setIsAdmin(normalizedRole === 'administrador');

        loadData();
    }, [selectedSeccional, user, isAuthenticated, isLoading]);

    async function loadData() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedSeccional !== 'Todos') {
                params.append('seccional', selectedSeccional);
            }

            const response = await fetch(`/api/europa?${params.toString()}`);

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                throw new Error('Error al cargar datos de Europa');
            }

            const { recintos, presidentes } = await response.json();

            setRecintos(recintos || []);
            setPresidentes(presidentes || []);

        } catch (error) {
            console.error('Error:', error);
            // Optional: meaningful user feedback here
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveRecinto(formData: any) {
        if (!editingRecinto) return;

        try {
            let error;
            if (editingRecinto.id === 'new') {
                // Crear nuevo
                const result = await dbInsert('europa_recintos_electorales', {
                    ...formData,
                    seccional: formData.seccional,
                    numero_recinto: formData.numero_recinto
                });

                if (!result.success) {
                    error = result.error;
                } else if (!result.data || result.data.length === 0) {
                    throw new Error('No se pudo crear el registro. Verifique sus permisos.');
                }
            } else {
                // Actualizar existente
                const result = await dbUpdate('europa_recintos_electorales', formData, { id: editingRecinto.id });

                if (!result.success) {
                    error = result.error;
                } else if (!result.data || result.data.length === 0) {
                    throw new Error('No se pudo actualizar. El registro no existe o no tiene permisos.');
                }
            }

            if (error) {
                console.error('Error guardando recinto:', error);
                alert('Error al guardar: ' + error);
            } else {
                alert('✅ Guardado exitosamente');
                setEditingRecinto(null);
                loadData();
            }
        } catch (error: any) {
            console.error('Error:', error);
            alert('Error: ' + (error.message || 'Error desconocido al procesar la solicitud'));
        }
    }

    async function handleSavePresidente(formData: any) {
        if (!formData.nombre || !formData.apellidos || !formData.cedula || !formData.email || !formData.fechaNacimiento || !formData.seccional || !formData.celular) {
            alert('Por favor complete todos los campos obligatorios (*)');
            throw new Error('Campos obligatorios faltantes');
        }

        try {
            // 1. Check for duplicates in 'afiliados' (Email/Phone)
            const { data: existingAffiliate } = await supabase
                .from('afiliados')
                .select('id')
                .or(`email.eq.${formData.email},cedula.eq.${formData.cedula}`)
                .maybeSingle();

            // If editing, exclude self from duplicate check? 
            // The logic here is a bit simplistic for updates. For now, strict check keeps data clean.
            if (existingAffiliate && editingPresidente?.id === 'new') {
                alert('Ya existe un afiliado registrado con ese Email o Cédula.');
                throw new Error('Duplicado detectado');
            }

            const nombreCompleto = `${formData.nombre} ${formData.apellidos}`;

            // 2. Insert into 'afiliados'
            // We only insert if it's new. Updates to 'PresidenteDM' don't automatically update 'afiliados' 
            // fully in this legacy View logic, but let's try to keep them in sync if possible.
            if (editingPresidente?.id === 'new') {
                const affiliateResult = await dbInsert('afiliados', {
                    nombre: formData.nombre,
                    apellidos: formData.apellidos,
                    cedula: formData.cedula,
                    email: formData.email,
                    fecha_nacimiento: formData.fechaNacimiento,
                    seccional: formData.seccional,
                    telefono: formData.celular,
                    role: 'Presidente DM',
                    validado: true,
                    cargo_organizacional: 'Presidente DM'
                });
                if (!affiliateResult.success) throw new Error(affiliateResult.error);
            }

            // 3. Insert/Update 'europa_presidentes_dm'
            if (editingPresidente?.id === 'new') {
                const dmResult = await dbInsert('europa_presidentes_dm', {
                    nombre_completo: nombreCompleto,
                    cedula: formData.cedula,
                    celular: formData.celular,
                    pais: formData.pais || 'España',
                    condado_provincia: formData.condado_provincia,
                    status: formData.status || 'Incompleto'
                });

                if (!dmResult.success) throw new Error(dmResult.error);
            } else if (editingPresidente?.id) {
                const updateResult = await dbUpdate('europa_presidentes_dm', {
                    nombre_completo: nombreCompleto,
                    cedula: formData.cedula,
                    celular: formData.celular,
                    pais: formData.pais || 'España',
                    condado_provincia: formData.condado_provincia,
                    status: formData.status
                }, { id: editingPresidente.id });

                if (!updateResult.success) throw new Error(updateResult.error);
            }

            setEditingPresidente(null);
            loadData();
            alert('Presidente DM guardado exitosamente.');

        } catch (error: any) {
            console.error('Error saving presidente:', error);
            alert('Error al guardar: ' + error.message);
            throw error; // Re-throw to stop modal spinner
        }
    };

    function openEditModal(recinto: Recinto) {
        setEditingRecinto(recinto);
        // Form state managed by modal
    }

    function openEditPresidenteModal(presidente: PresidenteDM) {
        setEditingPresidente(presidente);
        // Form state is now handled by the modal
    }

    const filteredRecintos = recintos.filter(r => {
        const term = normalizeText(searchTerm);
        return normalizeText(r.nombre_recinto).includes(term) ||
            normalizeText(r.zona_ciudad).includes(term) ||
            normalizeText(r.numero_recinto).includes(term);
    });

    const filteredPresidentes = presidentes.filter(p => {
        const term = normalizeText(searchTerm);
        return normalizeText(p.nombre_completo).includes(term) ||
            (p.condado_provincia && normalizeText(p.condado_provincia).includes(term));
    });

    // Estadísticas
    const stats = {
        totalRecintos: filteredRecintos.length,
        totalElectores: filteredRecintos.reduce((sum, r) => sum + r.total_electores, 0),
        totalColegios: filteredRecintos.reduce((sum, r) => sum + r.total_colegios, 0),
        totalPresidentes: presidentes.length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando datos de Europa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <img src="/logo-fp.png" alt="FP" className="h-10 w-10 object-contain rounded-md p-1" style={{ backgroundColor: '#e5e0e0' }} />
                    <h1 className="text-3xl font-bold text-gray-900">Europa Electoral</h1>
                </div>
                <p className="text-gray-600">
                    Gestión de recintos electorales y direcciones medias en Europa
                </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Recintos</p>
                            <p className="text-2xl font-bold text-green-900">{stats.totalRecintos}</p>
                        </div>
                        <Building2 className="h-8 w-8 text-green-600 opacity-50" />
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Electores</p>
                            <p className="text-2xl font-bold text-green-900">{stats.totalElectores.toLocaleString()}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-600 opacity-50" />
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Colegios</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.totalColegios}</p>
                        </div>
                        <MapPin className="h-8 w-8 text-purple-600 opacity-50" />
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-600 font-medium">Presidentes DM</p>
                            <p className="text-2xl font-bold text-orange-900">{stats.totalPresidentes}</p>
                        </div>
                        <Users className="h-8 w-8 text-orange-600 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, zona o número..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtro Seccional */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-400" />
                        <select
                            value={selectedSeccional}
                            onChange={(e) => setSelectedSeccional(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {seccionales.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-4">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex gap-8">
                        <button
                            onClick={() => setActiveTab('recintos')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recintos'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Recintos Electorales ({filteredRecintos.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('presidentes')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'presidentes'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Presidentes DM Europa ({filteredPresidentes.length})
                        </button>
                    </nav>
                </div>
            </div>

            {/* Contenido */}
            {activeTab === 'recintos' ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-end">
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setEditingRecinto(null);
                                    setEditingRecinto({ id: 'new' } as Recinto); // Use 'new' as flag
                                }}
                                className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Building2 className="h-4 w-4" />
                                Nuevo Recinto
                            </button>
                        )}
                    </div>

                    {filteredRecintos.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No se encontraron recintos</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Verifica que los datos estén importados en Supabase
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Seccional
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Número
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Recinto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Zona/Ciudad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Electores
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Colegios
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Colegios N°
                                        </th>
                                        {isAdmin && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRecintos.map((recinto) => (
                                        <tr key={recinto.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {recinto.seccional}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {recinto.numero_recinto}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {recinto.nombre_recinto}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {recinto.zona_ciudad}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {recinto.total_electores.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {recinto.total_colegios}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {recinto.colegios_numeros || '-'}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(recinto)}
                                                            className="text-white bg-green-600 hover:bg-green-700 p-1.5 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('¿Estás seguro de eliminar este recinto? Esta acción no se puede deshacer.')) {
                                                                    const result = await dbDelete('europa_recintos_electorales', { id: recinto.id });

                                                                    if (!result.success) {
                                                                        alert('Error al eliminar: ' + result.error);
                                                                    } else {
                                                                        loadData();
                                                                    }
                                                                }
                                                            }}
                                                            className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {filteredPresidentes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="flex justify-end px-4 mb-4">
                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            setEditingPresidente(null);
                                            setEditingPresidente({ id: 'new' } as PresidenteDM);
                                        }}
                                        className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        Nueva DM
                                    </button>
                                )}
                            </div>
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No se encontraron presidentes DM</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Verifica que los datos estén importados en Supabase
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="p-4 border-b border-gray-200 flex justify-end">
                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            setEditingPresidente(null);
                                            setEditingPresidente({ id: 'new' } as PresidenteDM);
                                        }}
                                        className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        Nueva DM
                                    </button>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nombre
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Provincia
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cédula
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Celular
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Afiliados
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            {isAdmin && (
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredPresidentes.map((presidente) => (
                                            <tr key={presidente.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {presidente.nombre_completo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {presidente.condado_provincia || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {presidente.cedula || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {presidente.celular || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {presidente.total_afiliados}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {presidente.status && (
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${presidente.status === 'Completo' ? 'bg-green-100 text-green-800' :
                                                            presidente.status === 'Suficiente' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {presidente.status}
                                                        </span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        <button
                                                            onClick={() => openEditPresidenteModal(presidente)}
                                                            className="text-white bg-green-600 hover:bg-green-700 p-1.5 rounded transition-colors inline-flex items-center mr-2"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('¿Estás seguro de eliminar este registro?')) {
                                                                    const result = await dbDelete('europa_presidentes_dm', { id: presidente.id });

                                                                    if (!result.success) {
                                                                        alert('Error al eliminar: ' + result.error);
                                                                    } else {
                                                                        loadData();
                                                                    }
                                                                }
                                                            }}
                                                            className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded transition-colors inline-flex items-center"
                                                            title="Eliminar"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Edición/Creación Recintos (Solo Admin) */}
            <RecintoModal
                isOpen={!!editingRecinto}
                onClose={() => setEditingRecinto(null)}
                onSave={handleSaveRecinto}
                initialData={editingRecinto}
            />

            {/* Modal de Edición/Creación Presidentes (Solo Admin) */}
            <PresidenteModal
                isOpen={!!editingPresidente}
                onClose={() => setEditingPresidente(null)}
                onSave={handleSavePresidente}
                initialData={editingPresidente}
                seccionales={seccionales}
            />
        </div>
    );
}
