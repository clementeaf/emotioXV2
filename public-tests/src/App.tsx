import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainView from './pages/MainView';
import DemoView from './pages/DemoView';
import { ApiTester } from './components/ApiTester';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/demo" element={<DemoView />} />
        <Route path="/api-test" element={<ApiTester />} />
      </Routes>
    </Router>
  );
}

export default App;
