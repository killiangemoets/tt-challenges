import { Route, Routes } from 'react-router-dom';

import { ReadinessPage } from '@/pages/readiness';

export const App = () => (
  <Routes>
    <Route path="*" element={<ReadinessPage />} />
  </Routes>
);
