import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LabReportModal } from './components/LabReportModal';
import { Toast } from './components/Toast';

// Load page components only when their routes are visited
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Products = lazy(() => import('./pages/Products').then(module => ({ default: module.Products })));
const Quality = lazy(() => import('./pages/Quality').then(module => ({ default: module.Quality })));
const Auth = lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard').then(module => ({ default: module.CustomerDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AboutUs = lazy(() => import('./pages/AboutUs').then(module => ({ default: module.AboutUs })));
const ContactUs = lazy(() => import('./pages/ContactUs').then(module => ({ default: module.ContactUs })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));

// Scroll to top on route change helper
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export function App() {
  return (
    <Router>
      <AppProvider>
        <ScrollToTop />

        <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1C2B23] font-sans antialiased selection:bg-[#D4AF37] selection:text-[#0F3E2E] w-full overflow-x-hidden">

          <Navbar />

          <main className="flex-grow w-full overflow-x-hidden">
            <Suspense
              fallback={
                <div className="min-h-[60vh] flex items-center justify-center text-[#0F3E2E]">
                  Loading...
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/quality" element={<Quality />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<ContactUs />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />

          {/* Overlay Modals & Drawers */}
          <CartDrawer />
          <CheckoutModal />
          <LabReportModal />
          <Toast />

        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
