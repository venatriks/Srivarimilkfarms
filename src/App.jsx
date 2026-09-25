import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LabReportModal } from './components/LabReportModal';
import { Toast } from './components/Toast';

import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { Quality } from './pages/Quality';
import { Auth } from './pages/Auth';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { ResetPassword } from './pages/ResetPassword';

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
        <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1C2B23] font-sans antialiased selection:bg-[#D4AF37] selection:text-[#0F3E2E]">

          <Navbar />

          <main className="flex-grow">
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
