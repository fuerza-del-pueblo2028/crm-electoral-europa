import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar Sesión",
    description: "Fuerza del Pueblo Europa. Secretaría de Asuntos Electorales. Acceso seguro al CRM Electoral para la gestión de datos y centinelas en la circunscripción de Europa.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
