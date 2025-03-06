import fondoFinal from '../../assets/fondo-final.png';

// Componente para la pantalla de agradecimiento final
const ThankYouView = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <div className="flex w-full h-full">
      {/* Lado izquierdo - Mensaje de agradecimiento */}
      <div className="w-1/2 bg-white flex flex-col justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Thank you so much!</h1>
          
          <p className="text-neutral-600 leading-relaxed mb-8">
            You have been invited to participate in a survey to improve the future experience of our customers, 
            so we need your help to make this the best experience possible.
          </p>
          
          <button
            onClick={onContinue}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm"
          >
            Continuar
          </button>
        </div>
        
        {/* Footer izquierdo */}
        <div className="text-xs text-neutral-500">
          This site is protected by reCAPTCHA and the Google <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>
        </div>
      </div>

      {/* Lado derecho - Imagen de fondo */}
      <div className="w-1/2 relative">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img 
            src={fondoFinal} 
            alt="Thank you background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Créditos de la imagen (si son necesarios) */}
        <div className="absolute bottom-0 right-0 p-2 text-[10px] text-white/60">
          Imagen de referencia / Reference image
        </div>
      </div>
    </div>
  );
};

export default ThankYouView; 