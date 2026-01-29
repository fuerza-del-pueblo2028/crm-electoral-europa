import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Estatutos y Normativas",
    description: "Consulta los estatutos oficiales y la base normativa de la Fuerza del Pueblo. Transparencia y democracia.",
    keywords: ["Estatutos Fuerza del Pueblo", "Reglamento Electoral", "Declaración de principios FP"],
};

export default function EstatutosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
