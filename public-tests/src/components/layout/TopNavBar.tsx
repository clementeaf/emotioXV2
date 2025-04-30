import React, { useState, useRef, useEffect } from 'react';
// import { ParticipantFlowStep } from '../../pages/ParticipantFlow'; // Ruta anterior
import { ParticipantFlowStep } from '../../types/flow'; // Ruta al nuevo archivo de tipos

interface TopNavBarProps {
    // Función para notificar al padre que se quiere navegar a un paso
    onNavigate: (targetStep: ParticipantFlowStep) => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú si se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNavigationClick = (targetStep: ParticipantFlowStep) => {
        setIsMenuOpen(false); // Cerrar menú después de hacer clic
        onNavigate(targetStep);
    };

    return (
        <nav className="bg-white shadow-md w-full sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Izquierda: Logo/Título */}
                    <div className="flex items-center">
                         <span className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-lg mr-2">
                            😀
                        </span>
                        <span className="font-bold text-xl text-neutral-900">EmotioX Research</span>
                    </div>

                    {/* Derecha: Menú Desplegable */}
                    <div className="flex items-center">
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                                aria-expanded={isMenuOpen}
                                aria-haspopup="true"
                            >
                                <span className="sr-only">Abrir menú de navegación</span>
                                {/* Icono Hamburguesa (simplificado) */}
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>

                            {/* Contenido del Menú Desplegable */}
                            {isMenuOpen && (
                                <div
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="user-menu-button"
                                    tabIndex={-1}
                                >
                                    {/* Elementos del menú */}
                                    <button
                                        onClick={() => handleNavigationClick(ParticipantFlowStep.SMART_VOC)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                        tabIndex={-1}
                                        id="nav-menu-item-0"
                                    >
                                        Feedback (SmartVOC)
                                    </button>
                                    <button
                                        onClick={() => handleNavigationClick(ParticipantFlowStep.COGNITIVE_TASK)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                        tabIndex={-1}
                                        id="nav-menu-item-1"
                                    >
                                        Tarea Cognitiva
                                    </button>
                                    {/* Se podrían añadir más opciones si fuera necesario */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TopNavBar; 