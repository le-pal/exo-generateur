import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import GeneratePage from './pages/GeneratePage.tsx';
import SessionPage from './pages/SessionPage.tsx';
import HistoryPage from './pages/HistoryPage.tsx';
import AdminPage from './pages/AdminPage.tsx';

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
