import React from 'react';
import { X, FlaskConical, FileText, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LabReportModal = () => {
  const {
    selectedLabProduct,
    setSelectedLabProduct,
  } = useApp();

  if (!selectedLabProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#FDFBF7] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#D4AF37]/40 relative flex flex-col my-auto">

        {/* Header */}
        <div className="bg-[#0F3E2E] text-white p-5 sm:p-6 relative border-b border-[#D4AF37]/30">
          <button
            onClick={() => setSelectedLabProduct(null)}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-3 pr-8">
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-white pr-8">
            {selectedLabProduct.name}
          </h3>

          <p className="text-xs text-emerald-100/80 mt-2">
            Product Laboratory Reports
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="p-6 sm:p-8 text-center">

          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0F3E2E]/10 flex items-center justify-center mb-5">
            <FlaskConical className="w-9 h-9 text-[#0F3E2E]" />
          </div>

          <h4 className="text-xl font-bold text-[#0F3E2E] mb-3">
            Lab Reports Coming Soon
          </h4>

          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            We are working towards making genuine laboratory test reports
            available for our dairy products. Verified report details will
            be published here once testing is completed and the reports
            are available.
          </p>

          <div className="bg-white rounded-2xl border border-[#0F3E2E]/10 p-4 text-left space-y-4">

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#0F3E2E]">
                  Verified Test Reports
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Genuine laboratory reports and tested parameters will
                  be displayed when available.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#0F3E2E]">
                  Report Downloads
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Actual downloadable PDF reports will be provided
                  once they are ready.
                </p>
              </div>
            </div>

          </div>

          <p className="text-[11px] text-stone-400 mt-6">
            Thank you for your interest in our quality and transparency.
          </p>

          <button
            onClick={() => setSelectedLabProduct(null)}
            className="mt-6 w-full sm:w-auto px-8 py-3 bg-[#0F3E2E] text-white text-sm font-bold rounded-xl hover:bg-[#18523f] transition-colors"
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
};
