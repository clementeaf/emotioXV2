interface InstructionsTaskProps {
  onContinue: () => void;
}

// Componente para mostrar instrucciones iniciales en la tarea cognitiva
const InstructionsTask = ({ onContinue }: InstructionsTaskProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-8">
          Instructions
        </h2>
        
        <p className="text-neutral-600 mb-10 text-center">
          You have been invited to participate in a survey to improve the future experience of our customers, 
          so we need your help to make this the best experience possible.
        </p>
        
        <button
          onClick={onContinue}
          className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-10 rounded w-32 transition-colors shadow-sm"
        >
          Start
        </button>
      </div>
    </div>
  );
};

export default InstructionsTask; 