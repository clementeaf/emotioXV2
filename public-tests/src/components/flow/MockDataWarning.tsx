export const MockDataWarning: React.FC<{ message?: string }> = ({ message }) => (
    <div className="fixed top-2 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-md text-xs shadow z-50">
        ⚠️ {message || 'Mostrando datos de prueba'}
    </div>
);