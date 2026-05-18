import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SearchResultsPage from './pages/SearchResultsPage';
import JobDetailPage from './pages/JobDetailPage';
import AdminPage from './pages/AdminPage'; // Eski sayfa, artık işveren olarak kullanıyoruz
import SystemAdminPage from './pages/SystemAdminPage';
import AiAgentChat from './components/AiAgentChat';
import Header from './components/Header';
import useAuthStore from './store/useAuthStore';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Uygulama yüklendiğinde oturum bilgisini kontrol et ve state'e yaz
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <div className="min-h-screen relative flex flex-col font-sans bg-gray-50">
        
        <Header />

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/job/:id" element={<JobDetailPage />} />
            <Route path="/isveren" element={<AdminPage />} />
            <Route path="/admin" element={<SystemAdminPage />} />
          </Routes>
        </main>

        {/* Global Floating AI Agent Component */}
        <AiAgentChat />

      </div>
    </Router>
  );
}

export default App;
