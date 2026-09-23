import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldAlert, ArrowRight, Lock, Mail, Eye, EyeOff, KeyRound, CheckCircle, X, UserPlus, Phone, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Auth = () => {
  const { login, signUpCustomer, showToast } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer'); // 'customer' | 'admin'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Customer Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot password modal state (Customer only)
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please enter your email and password.", "error");
      return;
    }
    const success = await login(email.trim(), password.trim(), role);
    if (success) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  // Handle Customer Sign Up Submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (signUpPassword.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      showToast("Passwords do not match. Please re-enter.", "error");
      return;
    }

    const success = await signUpCustomer({
      name: signUpName.trim(),
      email: signUpEmail.trim(),
      phone: signUpPhone.trim(),
      address: signUpAddress.trim(),
      password: signUpPassword.trim()
    });

    if (success) {
      navigate('/dashboard');
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitted(true);
    showToast(`Password reset instructions sent to ${forgotEmail.trim()}`, "success");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 relative">

      {/* Card Container */}
      <div className="bg-white rounded-3xl border border-[#0F3E2E]/10 shadow-2xl overflow-hidden">

        {/* Header Banner */}
        <div className="bg-[#0F3E2E] text-white p-8 text-center relative border-b border-[#D4AF37]/30">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-[#D4AF37] overflow-hidden mx-auto mb-3 shadow-md">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="Srivari Milk Farms Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="font-serif-display text-2xl font-bold">
            Srivari Milk Farms Portal
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Access your 5 AM milk subscription & delivery management
          </p>
        </div>

        {/* Role Toggle Bar */}
        <div className="p-4 bg-[#FDFBF7] border-b border-stone-200">
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/60 rounded-2xl">
            <button
              onClick={() => { setRole('customer'); setPassword(''); setAuthMode('signin'); }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                role === 'customer'
                  ? 'bg-white text-[#0F3E2E] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4 text-[#D4AF37]" />
              <span>Customer Portal</span>
            </button>

            <button
              onClick={() => { setRole('admin'); setPassword(''); setAuthMode('signin'); }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                role === 'admin'
                  ? 'bg-[#0F3E2E] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
              <span>Admin Management</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">

          {/* Customer Auth Mode Sub-Tabs (Sign In / Sign Up) */}
          {role === 'customer' && (
            <div className="flex border-b border-stone-200 mb-2">
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all ${
                  authMode === 'signin'
                    ? 'border-[#0F3E2E] text-[#0F3E2E]'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all ${
                  authMode === 'signup'
                    ? 'border-[#0F3E2E] text-[#0F3E2E]'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SIGN IN FORM */}
          {/* ------------------------------------------------------------- */}
          {(authMode === 'signin' || role === 'admin') && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">

              {/* Email / Username Input */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">
                  {role === 'admin' ? "Admin Email or Username" : "Email or Mobile Number"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={role === 'admin' ? "admin@srivarimilkfarms.com" : "name@example.com or +91 98765 43210"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-stone-600">Password</label>
                  {/* FORGOT PASSWORD LINK: ONLY FOR CUSTOMER ROLE */}
                  {role === 'customer' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotSubmitted(false);
                        setForgotModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#0F3E2E] hover:text-[#D4AF37] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2 mt-2"
              >
                <span>Sign In as {role === 'admin' ? 'Farm Admin' : 'Customer'}</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CUSTOMER SIGN UP FORM */}
          {/* ------------------------------------------------------------- */}
          {role === 'customer' && authMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="ramesh.kumar@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Mobile Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Delivery Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Flat / House No, Apartment, Area, City"
                    value={signUpAddress}
                    onChange={(e) => setSignUpAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Password * (Min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Create password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Submit Sign Up Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2 mt-2"
              >
                <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                <span>Create Customer Account</span>
              </button>
            </form>
          )}

        </div>

      </div>

      {/* Customer Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#D4AF37]/30 space-y-4 relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F3E2E] text-[#D4AF37] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-display font-bold text-lg text-[#0F3E2E]">Reset Password</h3>
                <p className="text-[11px] text-stone-500">Customer Password Recovery</p>
              </div>
            </div>

            {!forgotSubmitted ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4 pt-1">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Enter your registered email address or mobile number to receive password reset instructions.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-600">Registered Email / Mobile</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="name@example.com or +91 9876543210"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-serif-display font-bold text-base text-[#0F3E2E]">Reset Link Sent!</h4>
                <p className="text-xs text-stone-600">
                  Password recovery instructions have been sent to <strong>{forgotEmail}</strong>. Please check your inbox or SMS.
                </p>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2.5 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all mt-2"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
