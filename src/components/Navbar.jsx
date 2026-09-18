import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, ShieldAlert, Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar = () => {
  const { user, logout, cartItemCount, setCartOpen } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Quality & Purity', path: '/quality' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 glass-panel shadow-sm border-b border-[#042B1B]/10">
      {/* Top Banner announcement */}
      <div className="bg-[#042B1B] text-white text-xs py-1.5 px-4 text-center font-medium tracking-wider flex items-center justify-center space-x-2 border-b border-[#DFB33F]/30">
        <Sparkles className="w-3.5 h-3.5 text-[#DFB33F] animate-pulse" />
        <span>Fresh Morning Delivery Guarantee: Glass bottles dispatched at 5:30 AM every morning!</span>
        <span className="hidden sm:inline text-[#DFB33F]">• Pure A2 Desi Cow Milk</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Official Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#DFB33F] shadow-md group-hover:scale-105 transition-transform duration-300 bg-[#042B1B] shrink-0">
              <img
                src="/images/logo.png"
                alt="Srivari Milk Farms Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <span className="font-serif-display text-xl sm:text-2xl font-bold tracking-tight text-[#042B1B] leading-none group-hover:text-[#0B422B]">
                  SRIVARI
                </span>
                <span className="text-[9px] font-bold text-[#DFB33F] uppercase tracking-widest bg-[#042B1B] px-1.5 py-0.5 rounded">
                  A2 FARMS
                </span>
              </div>
              <span className="text-[10px] tracking-[0.22em] text-[#DFB33F] font-extrabold uppercase">
                MILK FARMS
              </span>
              <span className="text-[9px] text-[#042B1B]/70 font-semibold truncate hidden lg:block">
                ಶ್ರೀವಾರಿ ಮಿಲ್ಕ್ ಫಾರ್ಮ್ಸ್ • శ్రీ వారి మిల్క్ ఫార్మ్స్
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 relative py-1 ${isActive(link.path)
                    ? 'text-[#042B1B] font-bold'
                    : 'text-stone-700 hover:text-[#042B1B]'
                  }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#DFB33F] rounded-full animate-fade-in" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center space-x-4 sm:space-x-5">

            {/* Quick Cart Icon with Badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full text-[#042B1B] hover:bg-[#042B1B]/5 transition-colors focus:outline-none"
              title="View Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#DFB33F] text-[#042B1B] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Dynamic Auth Status */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-full border border-[#042B1B]/20 bg-[#042B1B]/5 hover:bg-[#042B1B]/10 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${user.role === 'admin' ? 'bg-[#DFB33F] text-[#042B1B]' : 'bg-[#042B1B] text-white'
                    }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#042B1B] leading-tight max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] uppercase font-semibold text-[#DFB33F] tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#042B1B]" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#042B1B]/10 py-2 z-50 animate-fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-[#042B1B]">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>

                    {user.role === 'admin' ? (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm text-[#042B1B] font-medium hover:bg-emerald-50"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#DFB33F]" />
                        <span>Admin Dashboard</span>
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm text-[#042B1B] font-medium hover:bg-emerald-50"
                      >
                        <User className="w-4 h-4 text-[#042B1B]" />
                        <span>My Subscriptions</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#042B1B] text-white hover:bg-[#0B422B] border border-[#DFB33F]/40 shadow-md transition-all hover:scale-105"
              >
                <User className="w-4 h-4 text-[#DFB33F]" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#042B1B] hover:bg-[#042B1B]/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FBF9F3] border-b border-[#042B1B]/10 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-base font-medium ${isActive(link.path)
                  ? 'bg-[#042B1B] text-white font-semibold'
                  : 'text-stone-800 hover:bg-[#042B1B]/5'
                }`}
            >
              {link.name}
            </Link>
          ))}
          {!user ? (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 bg-[#042B1B] text-white rounded-xl font-bold text-sm"
            >
              Customer & Admin Login
            </Link>
          ) : (
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 bg-[#DFB33F] text-[#042B1B] rounded-xl font-bold text-sm"
            >
              Go to Dashboard ({user.role})
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
