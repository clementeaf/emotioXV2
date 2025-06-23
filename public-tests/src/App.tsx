import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ApiTester } from './components/ApiTester';
import './index.css';
import ParticipantFlow from './pages/ParticipantFlow';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const researchId = params.get('researchId');
    if (researchId) {
      navigate(`/link/${researchId}`);
    }
  }, [location, navigate]);

  return <div>Bienvenido a Public Tests. Agrega un researchId en la URL.</div>;
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/api-test" element={<ApiTester />} />
        <Route path="/link/:researchId" element={<ParticipantFlow />} />
      </Routes>
    </Router>
  );
}

export default App;
