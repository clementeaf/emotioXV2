import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import './index.css';

import LoginRedirect from './components/common/LoginRedirect';
import { TestLayout } from './pages';
import NoResearchIdError from './pages/NoResearchIdError';
import PrivacyNoticePage from './pages/PrivacyNoticePage';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<TestLayout />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/error-no-research-id" element={<NoResearchIdError />} />
        <Route path="/privacy" element={<PrivacyNoticePage />} />
        <Route path="*" element={<LoginRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
