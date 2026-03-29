import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import GeneratePage from './pages/GeneratePage.jsx';
import SessionPage from './pages/SessionPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<GeneratePage />} />
        <Route path="session/:id" element={<SessionPage />} />
        <Route path="history/:studentId" element={<HistoryPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
