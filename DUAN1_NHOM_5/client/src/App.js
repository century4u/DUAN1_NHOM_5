import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import TourManagement from './pages/admin/TourManagement';
import TourDetail from './pages/admin/TourDetail';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/tours" element={<TourManagement />} />
        <Route path="/admin/tours/:id" element={<TourDetail />} />
        <Route path="/" element={<Navigate to="/admin/tours" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
