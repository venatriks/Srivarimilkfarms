import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  ShieldAlert,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle,
  X,
  UserPlus,
  Phone,
  MapPin
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const Auth = () => {
  const { login, signUpCustomer, showToast } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  const returnDestination = location.state?.from
    ? (
      location.state.from.pathname +
      (location.state.from.search || '')
    )
    : (redirectParam || '/dashboard');

  const [role, setRole] = useState('customer');
  const [authMode, setAuthMode] = useState('signin');

  // ============================================================
  // SIGN IN
  // ============================================================

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // ============================================================
  // CUSTOMER SIGN UP
  // ============================================================

  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // ============================================================
  // ROLE SWITCH
  // ============================================================

  const handleCustomerRole = () => {
    setRole('customer');
    setPassword('');
    setAuthMode('signin');
  };

  const handleAdminRole = () => {
    setRole('admin');
    setPassword('');
    setAuthMode('signin');
  };

  // ============================================================
  // SIGN IN
  // ============================================================

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (signingIn) return;

    const loginEmail = email.trim();

    if (!loginEmail || !password) {
      showToast(
        'Please enter your email and password.',
        'error'
      );
      return;
    }

    setSigningIn(true);

    try {
      const success = await login(
        loginEmail,
        password,
        role
      );

      if (success) {
        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate(returnDestination, { replace: true });
        }
      }
    } finally {
      setSigningIn(false);
    }
  };

  // ============================================================
  // CUSTOMER SIGN UP
  // ============================================================

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    if (signingUp) return;

    const name = signUpName.trim();
    const signupEmail = signUpEmail.trim().toLowerCase();
    const phone = signUpPhone.trim();
    const address = signUpAddress.trim();

    if (!name || !signupEmail || !phone || !signUpPassword) {
      showToast(
        'Please fill in all required fields.',
        'error'
      );
      return;
    }

    if (signUpPassword.length < 6) {
      showToast(
        'Password must be at least 6 characters long.',
        'error'
      );
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      showToast(
        'Passwords do not match. Please re-enter.',
        'error'
      );
      return;
    }

    setSigningUp(true);

    try {
      const success = await signUpCustomer({
        name,
        email: signupEmail,
        phone,
        address,
        password: signUpPassword
      });

      if (success) {
        navigate(returnDestination, { replace: true });
      }
    } finally {
      setSigningUp(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    if (forgotLoading) return;

    const resetEmail = forgotEmail.trim().toLowerCase();

    if (!resetEmail) {
      showToast(
        'Please enter your registered email address.',
        'error'
      );
      return;
    }

    setForgotLoading(true);

    try {
      /*
       * Supabase password recovery.
       *
       * The recovery email will contain a link that returns
       * the user to the application's password-reset page.
       */
      const baseUrl = import.meta.env.BASE_URL || '/';

      const redirectTo =
        `${window.location.origin}${baseUrl}reset-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          resetEmail,
          {
            redirectTo
          }
        );

      if (error) {
        console.error(
          'Password reset error:',
          error
        );

        showToast(
          error.message ||
          'Unable to send password reset instructions.',
          'error'
        );

        return;
      }

      setForgotSubmitted(true);

      showToast(
        'Password reset instructions have been sent to your email.',
        'success'
      );
    } catch (error) {
      console.error(
        'Password reset error:',
        error
      );

      showToast(
        'Unable to send password reset instructions. Please try again.',
        'error'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // ============================================================
  // RESET FORGOT MODAL
  // ============================================================

  const closeForgotModal = () => {
    setForgotModalOpen(false);
    setForgotSubmitted(false);
    setForgotLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 relative">

      {/* ====================================================== */}
      {/* CARD */}
      {/* ====================================================== */}

      <div className="bg-white rounded-3xl border border-[#0F3E2E]/10 shadow-2xl overflow-hidden">

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

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

        {/* ==================================================== */}
        {/* ROLE SWITCH */}
        {/* ==================================================== */}

        <div className="p-4 bg-[#FDFBF7] border-b border-stone-200">

          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/60 rounded-2xl">

            <button
              type="button"
              onClick={handleCustomerRole}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${role === 'customer'
                  ? 'bg-white text-[#0F3E2E] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              <User className="w-4 h-4 text-[#D4AF37]" />
              <span>Customer Portal</span>
            </button>

            <button
              type="button"
              onClick={handleAdminRole}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${role === 'admin'
                  ? 'bg-[#0F3E2E] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
              <span>Admin Management</span>
            </button>

          </div>

        </div>

        {/* ==================================================== */}
        {/* FORM BODY */}
        {/* ==================================================== */}

        <div className="p-8 space-y-6">

          {/* ================================================== */}
          {/* CUSTOMER SIGN IN / SIGN UP TABS */}
          {/* ================================================== */}

          {role === 'customer' && (
            <div className="flex border-b border-stone-200 mb-2">

              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all ${authMode === 'signin'
                    ? 'border-[#0F3E2E] text-[#0F3E2E]'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all ${authMode === 'signup'
                    ? 'border-[#0F3E2E] text-[#0F3E2E]'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
              >
                Create Account
              </button>

            </div>
          )}

          {/* ================================================== */}
          {/* SIGN IN */}
          {/* ================================================== */}

          {(authMode === 'signin' || role === 'admin') && (
            <form
              onSubmit={handleLoginSubmit}
              className="space-y-4"
            >

              {/* Email */}

              <div className="space-y-1">

                <label className="text-xs font-medium text-stone-600">
                  {role === 'admin'
                    ? 'Admin Email'
                    : 'Email Address'}
                </label>

                <div className="relative">

                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={
                      role === 'admin'
                        ? 'admin@srivarimilkfarms.com'
                        : 'name@example.com'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />

                </div>

              </div>

              {/* Password */}

              <div className="space-y-1">

                <div className="flex justify-between items-center">

                  <label className="text-xs font-medium text-stone-600">
                    Password
                  </label>

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
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                  </button>

                </div>

              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={signingIn}
                className="w-full py-3.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >

                <span>
                  {signingIn
                    ? 'Signing In...'
                    : `Sign In as ${role === 'admin'
                      ? 'Farm Admin'
                      : 'Customer'
                    }`}
                </span>

                {!signingIn && (
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                )}

              </button>

            </form>
          )}

          {/* ================================================== */}
          {/* SIGN UP */}
          {/* ================================================== */}

          {role === 'customer' &&
            authMode === 'signup' && (

              <form
                onSubmit={handleSignUpSubmit}
                className="space-y-4"
              >

                {/* Full Name */}

                <div className="space-y-1">

                  <label className="text-xs font-medium text-stone-600">
                    Full Name *
                  </label>

                  <div className="relative">

                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="e.g. Ramesh Kumar"
                      value={signUpName}
                      onChange={(e) =>
                        setSignUpName(e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />

                  </div>

                </div>

                {/* Email */}

                <div className="space-y-1">

                  <label className="text-xs font-medium text-stone-600">
                    Email Address *
                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="ramesh.kumar@example.com"
                      value={signUpEmail}
                      onChange={(e) =>
                        setSignUpEmail(e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />

                  </div>

                </div>

                {/* Phone */}

                <div className="space-y-1">

                  <label className="text-xs font-medium text-stone-600">
                    Mobile Phone Number *
                  </label>

                  <div className="relative">

                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={signUpPhone}
                      onChange={(e) =>
                        setSignUpPhone(e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />

                  </div>

                </div>

                {/* Address */}

                <div className="space-y-1">

                  <label className="text-xs font-medium text-stone-600">
                    Delivery Address
                  </label>

                  <div className="relative">

                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input
                      type="text"
                      autoComplete="street-address"
                      placeholder="Flat / House No, Apartment, Area, City"
                      value={signUpAddress}
                      onChange={(e) =>
                        setSignUpAddress(e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />

                  </div>

                </div>

                {/* Password */}

                <div className="space-y-1">

                  <label className="text-xs font-medium text-stone-600">
                    Password * (Min 6 chars)
                  </label>

                  <div className="relative">

                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input
                      type={
                        showSignUpPassword
                          ? 'text'
                          : 'password'
                      }
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Create password"
                      value={signUpPassword}
                      onChange={(e) =>
                        setSignUpPassword(e.target.value)
                      }
                      className="w-full pl-10 pr-10 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowSignUpPassword(
                          !showSignUpPassword
                        )
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none"
                    >
                      {showSignUpPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />}
                    </button>

                  </div>

                </div>

                {/* Confirm Password */}

                <div className="space-y-1">

                  <label className="text-xs font-medium text-stone-600">
                    Confirm Password *
                  </label>

                  <div className="relative">

                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input
                      type={
                        showSignUpPassword
                          ? 'text'
                          : 'password'
                      }
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={signUpConfirmPassword}
                      onChange={(e) =>
                        setSignUpConfirmPassword(
                          e.target.value
                        )
                      }
                      className="w-full pl-10 pr-10 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />

                  </div>

                </div>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={signingUp}
                  className="w-full py-3.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >

                  {signingUp ? (
                    <span>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                      <span>
                        Create Customer Account
                      </span>
                    </>
                  )}

                </button>

              </form>
            )}

        </div>

      </div>

      {/* ====================================================== */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ====================================================== */}

      {forgotModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">

          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#D4AF37]/30 space-y-4 relative">

            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-stone-100 pb-3">

              <div className="w-10 h-10 rounded-2xl bg-[#0F3E2E] text-[#D4AF37] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>

              <div>

                <h3 className="font-serif-display font-bold text-lg text-[#0F3E2E]">
                  Reset Password
                </h3>

                <p className="text-[11px] text-stone-500">
                  Customer Password Recovery
                </p>

              </div>

            </div>

            {!forgotSubmitted ? (

              <form
                onSubmit={handleForgotSubmit}
                className="space-y-4 pt-1"
              >

                <p className="text-xs text-stone-600 leading-relaxed">
                  Enter your registered email address.
                  Supabase will send a secure password
                  recovery link to your email.
                </p>

                <div className="space-y-1">

                  <label className="text-xs font-medium text-stone-600">
                    Registered Email
                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) =>
                        setForgotEmail(e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                    />

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >

                  <span>
                    {forgotLoading
                      ? 'Sending...'
                      : 'Send Reset Instructions'}
                  </span>

                  {!forgotLoading && (
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  )}

                </button>

              </form>

            ) : (

              <div className="text-center py-4 space-y-3">

                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />

                <h4 className="font-serif-display font-bold text-base text-[#0F3E2E]">
                  Reset Link Sent
                </h4>

                <p className="text-xs text-stone-600">
                  If an account exists for{' '}
                  <strong>{forgotEmail}</strong>,
                  Supabase has sent password recovery
                  instructions to that email address.
                </p>

                <button
                  type="button"
                  onClick={closeForgotModal}
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