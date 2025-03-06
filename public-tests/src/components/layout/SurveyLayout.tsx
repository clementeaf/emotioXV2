import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const stages = [
  { id: 'screener', label: 'Screener' },
  { id: 'welcome-screen', label: 'Welcome screen' },
  { id: 'implicit-association', label: 'Implicit Association' },
  { id: 'cognitive-task', label: 'Cognitive task' },
  { id: 'eye-tracking', label: 'Eye Tracking' },
  { id: 'thank-you', label: 'Thank you screen' }
];

const SurveyLayout = () => {
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState('welcome-screen');

  const handleStageClick = (stageId: string) => {
    setActiveStage(stageId);
    navigate(`/survey/${stageId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Banner azul */}
      <header className="bg-blue-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="bg-yellow-400 text-black rounded-full w-7 h-7 flex items-center justify-center mr-2">😀</span>
          <span className="font-semibold">EmotioX</span>
        </div>
        <div className="flex-1 text-center">This is a preview. Your response will not be saved.</div>
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center"
        >
          Jump to section <ChevronRight size={16} className="ml-1" />
        </button>
      </header>

      <div className="flex flex-1">
        {/* Main content */}
        <main className="flex-1 bg-gray-100">
          <Outlet />
        </main>
        
        {/* Side menu */}
        <nav className="w-64 bg-white border-l border-gray-200 p-4">
          <ul className="space-y-2">
            {stages.map((stage) => (
              <li key={stage.id}>
                <button
                  className={`w-full text-left px-4 py-2 rounded ${
                    activeStage === stage.id ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleStageClick(stage.id)}
                >
                  {stage.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-6 text-sm text-gray-500 flex justify-between">
        <div>
          This site is protected by reCAPTCHA and the Google <a href="#" className="text-gray-700">Privacy Policy</a>
        </div>
        <div className="flex gap-4">
          <a href="#" className="text-gray-700">Terms and Conditions</a>
          <a href="#" className="text-gray-700">Privacy Policy</a>
          <a href="#" className="text-gray-700">CA Privacy Notice</a>
        </div>
      </footer>
    </div>
  );
};

export default SurveyLayout; 