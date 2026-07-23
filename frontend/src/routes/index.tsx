import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Protected routes will go here */}
        <Route index element={<div>Dashboard</div>} />
        <Route path="documents" element={<div>Documents List</div>} />
      </Route>
    </Routes>
  );
};
