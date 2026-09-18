import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldAlert, Milk, ArrowRight, Lock, Mail, Phone, CheckCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Auth = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer'); // 'customer' | 'admin'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    setOtpSent(true);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(email || (role === 'admin' ? 'admin@srivarimilkfarms.com' : 'anita.sharma@example.com'), role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleQuickDemoCustomer = () => {
    login("anita.sharma@example.com", "customer", "Anita Sharma");
    navigate('/dashboard');
  };

  const handleQuickDemoAdmin = () => {
    login("rajesh.kumar@srivarimilkfarms.com", "admin", "Rajesh Kumar (Farm Admin)");
    navigate('/admin');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      
      {/* Card Container */}
      <div className="bg-white rounded-3xl border border-[#0F3E2E]/10 shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-[#0F3E2E] text-white p-8 text-center relative border-b border-[#D4AF37]/30">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#0F3E2E] flex items-center justify-center mx-auto mb-3 shadow-md">
            <Milk className="w-6 h-6" />
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
              onClick={() => setRole('customer')}
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
              onClick={() => setRole('admin')}
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
          
          {/* Quick Demo Pre-fill Notice */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-[#D4AF37]/40 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0F3E2E]">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Instant Demo Account Access</span>
            </div>
            
            {role === 'customer' ? (
              <button
                onClick={handleQuickDemoCustomer}
                className="w-full py-2.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold hover:bg-[#18523f] transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Login as Customer (Anita Sharma)</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            ) : (
              <button
                onClick={handleQuickDemoAdmin}
                className="w-full py-2.5 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Login as Farm Admin (Rajesh Kumar)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Or Login With Credentials</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Mobile Number or Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={role === 'admin' ? "admin@srivarimilkfarms.com" : "+91 98765 43210"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>Send OTP Verification</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Enter 4-Digit OTP (Simulated: Any code)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="7890"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-sm font-bold tracking-widest text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify OTP & Enter {role === 'admin' ? 'Admin Portal' : 'Dashboard'}</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
