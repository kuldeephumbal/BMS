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
import Staffs from './pages/Staffs';
import ExpenseBudget from './pages/ExpenseBudget';
import Product from './pages/Product';
import ProductDetail from './pages/ProductDetail';
import Service from './pages/Service';
import Cashbook from './pages/Cashbook';
import Billing from './pages/Billing';
import BillingDetails from './pages/BillingDetails';
import AddEditBill from './pages/AddEditBill';
import BillPreviewPage from './pages/BillPreviewPage';

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
        <Route path="/staffs" element={<Staffs />} />
        <Route path="/expenses-budgets" element={<ExpenseBudget />} />
        <Route path="/products" element={<Product />} />
        <Route path="/products/:id/details" element={<ProductDetail />} />
        <Route path="/services" element={<Service />} />
        <Route path="/cashbook" element={<Cashbook />} />
        <Route path="/billing/:type" element={<Billing />} />
        <Route path="/billing/:type/details/:id" element={<BillingDetails />} />
        <Route path="/billing/:type/add" element={<AddEditBill />} />
        <Route path="/billing/:type/edit/:id" element={<AddEditBill />} />
        <Route path="/billing/:type/preview" element={<BillPreviewPage />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

reportWebVitals();