export const RenderError: React.FC<{
    stepType: string;
}> = ({ stepType }) => {
    return (
        <div className="flex items-center justify-center h-full w-full p-8 text-center">
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error de Renderizado:</strong>
                <span className="block sm:inline"> Tipo de paso no reconocido: '{stepType}'.</span>
            </div>
        </div>
    )
};