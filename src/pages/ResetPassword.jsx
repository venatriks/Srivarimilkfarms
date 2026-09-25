import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ResetPassword = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        showToast(
          'Password recovery session verified. Enter your new password.',
          'info'
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [showToast]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!password) {
      showToast('Please enter a new password.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please re-enter.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          password
        });

        if (error) {
          console.error('Supabase password reset error:', error);

          showToast(
            error.message ||
            'Failed to update password. Please try requesting a new reset link.',
            'error'
          );

          return;
        }

        // End the password recovery session after the password is changed.
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
          console.warn(
            'Password updated, but sign-out failed:',
            signOutError
          );
        }
      }

      setSuccess(true);

      showToast(
        'Password updated successfully! You can now log in.',
        'success'
      );
    } catch (err) {
      console.error('Password reset exception:', err);

      showToast(
        'An unexpected error occurred. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 relative">
      <div className="bg-white rounded-3xl border border-[#0F3E2E]/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F3E2E] text-white p-8 text-center relative border-b border-[#D4AF37]/30">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-[#D4AF37] overflow-hidden mx-auto mb-3 shadow-md flex items-center justify-center">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="Srivari Milk Farms Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="font-serif-display text-2xl font-bold">Set New Password</h2>
          <p className="text-xs text-emerald-200 mt-1">
            Customer Account Security Portal
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {success ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif-display text-2xl font-bold text-[#0F3E2E]">
                  Password Reset Successful!
                </h3>
                <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                  Your customer account password has been updated securely. You can now log in using your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2 border border-[#D4AF37]/40"
              >
                <span>Proceed to Customer Login</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div className="space-y-1 text-center pb-2">
                <span className="text-xs font-semibold text-[#0F3E2E] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Choose a Strong Password</span>
                </span>
                <p className="text-xs text-stone-500 pt-2">
                  Enter your new password below. It must be at least 6 characters long.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Enter new password"
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

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Indicator */}
              <div className="space-y-1.5 pt-1 text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  <span className={password.length >= 6 ? 'text-emerald-700 font-bold' : ''}>At least 6 characters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${password && password === confirmPassword ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  <span className={password && password === confirmPassword ? 'text-emerald-700 font-bold' : ''}>Passwords match</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || password.length < 6 || password !== confirmPassword}
                className="w-full py-3.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2 border border-[#D4AF37]/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Updating Password...' : 'Reset & Save Password'}</span>
                {!loading && <ArrowRight className="w-4 h-4 text-[#D4AF37]" />}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-[#0F3E2E] hover:text-[#D4AF37] transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
