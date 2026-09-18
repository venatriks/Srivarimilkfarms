import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short transition-all duration-300">
      <div className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md border ${
        isSuccess 
          ? 'bg-[#0F3E2E]/95 border-[#D4AF37]/40 text-white' 
          : isInfo 
            ? 'bg-amber-900/95 border-amber-400/40 text-white' 
            : 'bg-red-900/95 border-red-400/40 text-white'
      }`}>
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />}
        {isInfo && <Info className="w-5 h-5 text-amber-300 shrink-0" />}
        {!isSuccess && !isInfo && <AlertCircle className="w-5 h-5 text-red-300 shrink-0" />}
        <span className="text-sm font-medium tracking-wide">{toast.message}</span>
      </div>
    </div>
  );
};
