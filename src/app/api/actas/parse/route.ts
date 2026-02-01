// NOTA: Esta ruta API está deshabilitada temporalmente porque requiere Node.js runtime
// y no es compatible con static export (output: "export" en next.config.ts)
// 
// Para habilitar esta funcionalidad, necesitas:
// 1. Cambiar next.config.ts a modo servidor (quitar output: "export")
// 2. Desplegar en un servidor Node.js en lugar de hosting estático
//
// Por ahora, la función de parseo automático de PDFs no está disponible.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    return NextResponse.json({
        error: "PDF parsing temporarily disabled in static export mode. Please parse manually."
    }, { status: 501 });
}
