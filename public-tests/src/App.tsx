import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ApiTester } from './components/ApiTester';
import ParticipantFlow from './pages/ParticipantFlow';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/api-test" element={<ApiTester />} />
        <Route path="/link/:researchId" element={<ParticipantFlow />} />
      </Routes>
    </Router>
  );
}

export default App;
