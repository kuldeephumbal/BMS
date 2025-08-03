import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Business from './pages/Business';
import Parties from './pages/Parties';
import PartiesDetails from './pages/PartiesDetails';
import StaffManagement from './pages/StaffManagement';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/business" element={<Business />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parties/:type" element={<Parties />} />
        <Route path="/parties/:id/details" element={<PartiesDetails />} />
        <Route path="/customers" element={<Parties />} />
        <Route path="/suppliers" element={<Parties />} />
        <Route path="/staff-management" element={<StaffManagement />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

reportWebVitals(); 