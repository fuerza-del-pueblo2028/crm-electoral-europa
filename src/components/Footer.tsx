export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 py-6 px-8 mt-auto no-print hidden md:block">
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                <p>&copy; {new Date().getFullYear()} Fuerza del Pueblo Europa. Todos los derechos reservados.</p>
                <div className="flex space-x-4 mt-2 md:mt-0">
                    <a href="#" className="hover:text-fp-green transition-colors">Política de Privacidad</a>
                    <a href="#" className="hover:text-fp-green transition-colors">Términos de Uso</a>
                    <a href="#" className="hover:text-fp-green transition-colors">Soporte</a>
                </div>
            </div>
        </footer>
    );
}
