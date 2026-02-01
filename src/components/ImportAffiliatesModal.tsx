"use client";

import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import * as XLSX from 'xlsx';
import { supabase } from "@/lib/supabase";
import { registrarCambio } from "@/lib/historial";

type ImportResult = {
    success: boolean;
    row: number;
    data?: any;
    error?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export function ImportAffiliatesModal({ isOpen, onClose, onSuccess }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validar tipo de archivo
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
                'text/csv'
            ];

            if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) {
                setFile(selectedFile);
                setResults([]);
                setShowResults(false);
            } else {
                alert('⚠️ Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV');
            }
        }
    };

    const validateRow = (row: any, rowNumber: number): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Campos requeridos
        if (!row.nombre || row.nombre.trim() === '') errors.push('Nombre es obligatorio');
        if (!row.apellidos || row.apellidos.trim() === '') errors.push('Apellidos es obligatorio');
        if (!row.cedula || row.cedula.trim() === '') errors.push('Cédula es obligatoria');
        if (!row.seccional || row.seccional.trim() === '') errors.push('Seccional es obligatoria');

        // Validar formato de email si existe
        if (row.email && row.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email)) {
                errors.push('Email tiene formato inválido');
            }
        }

        return { valid: errors.length === 0, errors };
    };

    const processImport = async () => {
        if (!file) {
            alert('Por favor selecciona un archivo');
            return;
        }

        setImporting(true);
        setProgress(0);
        const importResults: ImportResult[] = [];

        try {
            // Leer archivo
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert('⚠️ El archivo está vacío');
                setImporting(false);
                return;
            }

            console.log(`📊 Procesando ${jsonData.length} filas...`);

            // Procesar cada fila
            for (let i = 0; i < jsonData.length; i++) {
                const row: any = jsonData[i];
                const rowNumber = i + 2; // +2 porque Excel empieza en 1 y tiene header

                // Validar datos
                const validation = validateRow(row, rowNumber);
                if (!validation.valid) {
                    importResults.push({
                        success: false,
                        row: rowNumber,
                        error: validation.errors.join(', ')
                    });
                    setProgress(((i + 1) / jsonData.length) * 100);
                    continue;
                }

                // Preparar datos
                const affiliateData = {
                    nombre: row.nombre.trim(),
                    apellidos: row.apellidos.trim(),
                    cedula: row.cedula.toString().trim(),
                    seccional: row.seccional.trim(),
                    validado: row.validado === true || row.validado === 'true' || row.validado === 'sí' || row.validado === 'si' || row.validado === 1,
                    role: row.role || 'Miembro',
                    email: row.email?.trim() || null,
                    telefono: row.telefono?.toString().trim() || null,
                    fecha_nacimiento: row.fecha_nacimiento || null,
                    cargo_organizacional: row.cargo_organizacional?.trim() || null
                };

                // Intentar insertar
                try {
                    const { data: inserted, error } = await supabase
                        .from('afiliados')
                        .insert(affiliateData)
                        .select()
                        .single();

                    if (error) {
                        let errorMsg = error.message;

                        // Errores comunes más legibles
                        if (error.code === '23505') {
                            if (error.message.includes('cedula')) errorMsg = 'Cédula ya existe';
                            else if (error.message.includes('email')) errorMsg = 'Email ya registrado';
                            else if (error.message.includes('telefono')) errorMsg = 'Teléfono ya registrado';
                            else errorMsg = 'Registro duplicado';
                        }

                        importResults.push({
                            success: false,
                            row: rowNumber,
                            data: affiliateData,
                            error: errorMsg
                        });
                    } else {
                        // Registrar en historial
                        await registrarCambio({
                            afiliado_id: inserted.id,
                            accion: 'creado',
                            detalles: {
                                origen: 'importacion_masiva',
                                nombre_completo: `${affiliateData.nombre} ${affiliateData.apellidos}`
                            }
                        });

                        importResults.push({
                            success: true,
                            row: rowNumber,
                            data: inserted
                        });
                    }
                } catch (err: any) {
                    importResults.push({
                        success: false,
                        row: rowNumber,
                        data: affiliateData,
                        error: err.message || 'Error desconocido'
                    });
                }

                setProgress(((i + 1) / jsonData.length) * 100);
            }

            setResults(importResults);
            setShowResults(true);

            const successCount = importResults.filter(r => r.success).length;
            const errorCount = importResults.filter(r => !r.success).length;

            console.log(`✅ Importación completada: ${successCount} éxitos, ${errorCount} errores`);

            if (successCount > 0) {
                onSuccess(); // Refrescar lista
            }

        } catch (error: any) {
            console.error('Error procesando archivo:', error);
            alert('❌ Error al procesar el archivo: ' + error.message);
        } finally {
            setImporting(false);
        }
    };

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Upload size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Importación Masiva</h2>
                            <p className="text-emerald-100 text-sm">Sube un archivo Excel o CSV con afiliados</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {!showResults ? (
                        <>
                            {/* Instrucciones */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                                    <FileSpreadsheet size={18} />
                                    Formato del Archivo
                                </h3>
                                <p className="text-sm text-emerald-700 mb-3">
                                    El archivo debe tener las siguientes columnas (respeta mayúsculas/minúsculas):
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded border border-emerald-200">
                                    <div><span className="text-red-600">*</span> nombre</div>
                                    <div><span className="text-red-600">*</span> apellidos</div>
                                    <div><span className="text-red-600">*</span> cedula</div>
                                    <div><span className="text-red-600">*</span> seccional</div>
                                    <div>email</div>
                                    <div>telefono</div>
                                    <div>fecha_nacimiento</div>
                                    <div>cargo_organizacional</div>
                                    <div>validado</div>
                                    <div>role</div>
                                </div>
                                <p className="text-xs text-emerald-600 mt-2">
                                    <span className="text-red-600">*</span> = Campos obligatorios
                                </p>
                            </div>

                            {/* Upload Area */}
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {file ? (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                            <FileSpreadsheet size={32} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                                        >
                                            Cambiar archivo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                            <Upload size={32} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700">Click para seleccionar archivo</p>
                                            <p className="text-sm text-gray-500">o arrastra y suelta aquí</p>
                                            <p className="text-xs text-gray-400 mt-2">Excel (.xlsx, .xls) o CSV</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {importing && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Procesando...</span>
                                        <span className="text-sm font-bold text-emerald-600">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-300 rounded-full"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 justify-end mt-8">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                    disabled={importing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={processImport}
                                    disabled={!file || importing}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Importando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Iniciar Importación
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Results */
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={32} className="text-green-600" />
                                        <div>
                                            <p className="text-3xl font-black text-green-900">{successCount}</p>
                                            <p className="text-sm text-green-700 font-medium">Importados exitosamente</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={32} className="text-red-600" />
                                        <div>
                                            <p className="text-3xl font-black text-red-900">{errorCount}</p>
                                            <p className="text-sm text-red-700 font-medium">Errores</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Error Details */}
                            {errorCount > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-3">Detalles de Errores</h3>
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                        {results.filter(r => !r.success).map((result, idx) => (
                                            <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                                                <p className="font-bold text-red-900">Fila {result.row}</p>
                                                <p className="text-red-700">{result.error}</p>
                                                {result.data && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {result.data.nombre} {result.data.apellidos} - {result.data.cedula}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowResults(false);
                                        setFile(null);
                                        setResults([]);
                                        setProgress(0);
                                    }}
                                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Importar Otro Archivo
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
