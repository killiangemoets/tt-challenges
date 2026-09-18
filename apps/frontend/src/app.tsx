import { Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/app-shell';
import { ChatPage } from '@/pages/chat';
import { DashboardPage } from '@/pages/dashboard';
import { DocumentsPage } from '@/pages/documents';

export const App = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/documents/:id" element={<DocumentsPage />} />
      <Route path="*" element={<DashboardPage />} />
    </Routes>
  </AppShell>
);
