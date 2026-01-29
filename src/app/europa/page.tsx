'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Globe, MapPin, Users, Building2, Search, Filter, Edit2, X, Save } from 'lucide-react';

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
    nombre_completo: string;
    cedula: string | null;
    celular: string | null;
    pais: string;
    condado_provincia: string | null;
    total_afiliados: number;
    status: string | null;
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
    const [editForm, setEditForm] = useState<Partial<Recinto>>({});

    const seccionales = ['Todos', 'Madrid', 'Barcelona', 'Milano', 'Holanda', 'Valencia', 'Zurich'];

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
            window.location.href = "/login";
            return;
        }
        loadData();
        const role = localStorage.getItem('user_role');
        setIsAdmin(role === 'administrador');
    }, [selectedSeccional]);

    async function loadData() {
        setLoading(true);
        try {
            // Cargar recintos
            let recintosQuery = supabase
                .from('europa_recintos_electorales')
                .select('*')
                .order('seccional', { ascending: true })
                .order('numero_recinto', { ascending: true });

            if (selectedSeccional !== 'Todos') {
                recintosQuery = recintosQuery.eq('seccional', selectedSeccional);
            }

            const { data: recintosData, error: recintosError } = await recintosQuery;

            if (recintosError) {
                console.error('Error cargando recintos:', recintosError);
            } else {
                setRecintos(recintosData || []);
            }

            // Cargar presidentes DM
            const { data: presidentesData, error: presidentesError } = await supabase
                .from('europa_presidentes_dm')
                .select('*')
                .order('total_afiliados', { ascending: false });

            if (presidentesError) {
                console.error('Error cargando presidentes:', presidentesError);
            } else {
                setPresidentes(presidentesData || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveRecinto() {
        if (!editingRecinto) return;

        try {
            let error;
            if (editingRecinto.id === 'new') {
                // Crear nuevo
                const { data, error: insertError } = await supabase
                    .from('europa_recintos_electorales')
                    .insert([{
                        ...editForm,
                        seccional: editForm.seccional,
                        numero_recinto: editForm.numero_recinto
                    }])
                    .select();

                if (!insertError && (!data || data.length === 0)) {
                    throw new Error('No se pudo crear el registro. Verifique sus permisos.');
                }
                error = insertError;
            } else {
                // Actualizar existente
                const { data, error: updateError } = await supabase
                    .from('europa_recintos_electorales')
                    .update(editForm)
                    .eq('id', editingRecinto.id)
                    .select();

                if (!updateError && (!data || data.length === 0)) {
                    throw new Error('No se pudo actualizar. El registro no existe o no tiene permisos.');
                }
                error = updateError;
            }

            if (error) {
                console.error('Error guardando recinto:', error);
                alert('Error al guardar: ' + error.message);
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

    function openEditModal(recinto: Recinto) {
        setEditingRecinto(recinto);
        setEditForm({
            nombre_recinto: recinto.nombre_recinto,
            zona_ciudad: recinto.zona_ciudad,
            direccion: recinto.direccion,
            total_electores: recinto.total_electores,
            total_colegios: recinto.total_colegios,
            colegios_numeros: recinto.colegios_numeros || ''
        });
    }

    const filteredRecintos = recintos.filter(r =>
        r.nombre_recinto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.zona_ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.numero_recinto.includes(searchTerm)
    );

    const filteredPresidentes = presidentes.filter(p =>
        p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.condado_provincia?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    <Globe className="h-8 w-8 text-green-600" />
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
                            Presidentes DM Italia ({filteredPresidentes.length})
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
                                    setEditForm({});
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
                                                                    const { error } = await supabase
                                                                        .from('europa_recintos_electorales')
                                                                        .delete()
                                                                        .eq('id', recinto.id);

                                                                    if (error) {
                                                                        alert('Error al eliminar: ' + error.message);
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
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No se encontraron presidentes DM</p>
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
                                                        onClick={async () => {
                                                            if (confirm('¿Estás seguro de eliminar este registro?')) {
                                                                const { error } = await supabase
                                                                    .from('europa_presidentes_dm')
                                                                    .delete()
                                                                    .eq('id', presidente.id);

                                                                if (error) {
                                                                    alert('Error al eliminar: ' + error.message);
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
                    )}
                </div>
            )}

            {/* Modal de Edicición/Creación (Solo Admin) */}
            {editingRecinto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingRecinto.id === 'new' ? 'Nuevo Recinto' : 'Editar Recinto'}
                                </h2>
                                <button
                                    onClick={() => setEditingRecinto(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Seccional *
                                    </label>
                                    {editingRecinto.id === 'new' ? (
                                        <select
                                            value={editForm.seccional || ''}
                                            onChange={(e) => setEditForm({ ...editForm, seccional: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {seccionales.filter(s => s !== 'Todos').map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={editingRecinto.seccional}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Número de Recinto *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingRecinto.id === 'new' ? (editForm.numero_recinto || '') : editingRecinto.numero_recinto}
                                        disabled={editingRecinto.id !== 'new'}
                                        onChange={(e) => editingRecinto.id === 'new' && setEditForm({ ...editForm, numero_recinto: e.target.value })}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${editingRecinto.id !== 'new' ? 'bg-gray-50' : 'focus:ring-2 focus:ring-green-500'}`}
                                        placeholder="Ej: 00151"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre del Recinto *
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.nombre_recinto || ''}
                                        onChange={(e) => setEditForm({ ...editForm, nombre_recinto: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Zona/Ciudad *
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.zona_ciudad || ''}
                                        onChange={(e) => setEditForm({ ...editForm, zona_ciudad: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.direccion || ''}
                                        onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Electores *
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.total_electores || 0}
                                            onChange={(e) => setEditForm({ ...editForm, total_electores: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Colegios *
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.total_colegios || 0}
                                            onChange={(e) => setEditForm({ ...editForm, total_colegios: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Números de Colegios
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.colegios_numeros || ''}
                                        onChange={(e) => setEditForm({ ...editForm, colegios_numeros: e.target.value })}
                                        placeholder="Ej: 001, 002, 003"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 justify-end">
                                <button
                                    onClick={() => setEditingRecinto(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleSaveRecinto()}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
