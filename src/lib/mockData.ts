export type Affiliate = {
    id: string;
    name: string;
    lastName: string;
    cedula: string;
    seccional: string;
    validated: boolean;
    role: "Miembro" | "Operador" | "Admin";
    email: string;
    foto_url?: string;
    fecha_nacimiento?: string;
    telefono?: string;
};

export const SECCIONALES = [
    "Madrid",
    "Barcelona",
    "Milano",
    "Zurich",
    "Holanda",
    "Valencia"
];

const NAMES = ["Juan", "María", "José", "Ana", "Luis", "Carmen", "Antonio", "Isabel", "Manuel", "Laura", "Pedro", "Marta", "Carlos", "Elena", "Jorge"];
const LASTNAMES = ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martin", "Jiménez", "Ruiz"];

// Simple deterministic random generator
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

function generateRandomCedula(index: number) {
    let cedula = "";
    for (let i = 0; i < 11; i++) {
        cedula += Math.floor(seededRandom(index * 100 + i) * 10).toString();
    }
    // Add hyphens: 000-0000000-0
    return `${cedula.substring(0, 3)}-${cedula.substring(3, 10)}-${cedula.substring(10, 11)}`;
}

export const generateAffiliates = (count: number): Affiliate[] => {
    return Array.from({ length: count }).map((_, i) => {
        const r1 = seededRandom(i * 1);
        const r2 = seededRandom(i * 2);
        const r3 = seededRandom(i * 3);
        const r4 = seededRandom(i * 4);

        return {
            id: `AFF-${i}`,
            name: NAMES[Math.floor(r1 * NAMES.length)],
            lastName: LASTNAMES[Math.floor(r2 * LASTNAMES.length)] + " " + LASTNAMES[Math.floor(r3 * LASTNAMES.length)],
            cedula: generateRandomCedula(i),
            seccional: SECCIONALES[Math.floor(r4 * SECCIONALES.length)],
            validated: r1 > 0.3,
            role: "Miembro",
            email: `usuario${i}@example.com`
        };
    });
};

export const MOCK_AFFILIATES = generateAffiliates(100);

export const MOCK_STATS = {
    totalAffiliates: 10452,
    validatedAffiliates: 8230,
    pendingAffiliates: 2222,
    bySeccional: SECCIONALES.map((city, idx) => ({
        name: city,
        value: Math.floor(seededRandom(idx + 500) * 2000) + 100
    }))
};
