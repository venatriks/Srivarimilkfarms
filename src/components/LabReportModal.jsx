import React from 'react';
import { X, ShieldCheck, Download, Award, FileText, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LabReportModal = () => {
  const { selectedLabProduct, setSelectedLabProduct, showToast } = useApp();

  if (!selectedLabProduct) return null;

  const lab = selectedLabProduct.labParameters || {};

  const handleDownload = () => {
    showToast(`Downloading NABL Lab Test Certificate for ${selectedLabProduct.name}...`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#FDFBF7] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#D4AF37]/40 relative flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto">
        
        {/* Header with Emerald background */}
        <div className="bg-[#0F3E2E] text-white p-4 sm:p-6 relative border-b border-[#D4AF37]/30 shrink-0">
          <button
            onClick={() => setSelectedLabProduct(null)}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-emerald-200 hover:text-white p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 mb-2 pr-8">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
              <Award className="w-3.5 h-3.5" />
              <span>NABL Certified Lab Report</span>
            </span>
            <span className="text-[11px] text-emerald-200 font-mono">
              Batch #SRI-{new Date().getFullYear()}-09
            </span>
          </div>

          <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-white pr-8">
            {selectedLabProduct.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-emerald-100/80 mt-1">
            Purity & Nutritional Composition Parameters Tested by Independent Accredited Laboratory
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          
          {/* Key Parameters Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#0F3E2E]/10 shadow-sm flex flex-col justify-between">
              <span className="text-xs text-stone-500 font-medium">Fat Content</span>
              <span className="text-xl sm:text-2xl font-bold text-[#0F3E2E] mt-1">{lab.fatPercentage || '4.6%'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1">Natural Fat Layer</span>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#0F3E2E]/10 shadow-sm flex flex-col justify-between">
              <span className="text-xs text-stone-500 font-medium">SNF (Solids Not Fat)</span>
              <span className="text-xl sm:text-2xl font-bold text-[#0F3E2E] mt-1">{lab.snfPercentage || '8.9%'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1">Rich Solids</span>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#0F3E2E]/10 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-xs text-stone-500 font-medium">Somatic Cell Count</span>
              <span className="text-base sm:text-lg font-bold text-[#0F3E2E] mt-1">{lab.somaticCellCount || '< 150k'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1">Ultra Hygienic</span>
            </div>
          </div>

          {/* Nutritional Highlights Bar */}
          <div className="bg-[#FDFBF7] p-3 sm:p-4 rounded-2xl border border-amber-200/80 shadow-sm grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div>
              <span className="text-stone-500 font-medium block text-[9px] sm:text-[10px] uppercase">Protein</span>
              <span className="font-bold text-[#0F3E2E] text-xs sm:text-sm">{selectedLabProduct.nutritionalInfo?.protein || '3.4 g'}</span>
            </div>
            <div>
              <span className="text-stone-500 font-medium block text-[9px] sm:text-[10px] uppercase">Calcium</span>
              <span className="font-bold text-[#0F3E2E] text-xs sm:text-sm">{selectedLabProduct.nutritionalInfo?.calcium || '125 mg'}</span>
            </div>
            <div>
              <span className="text-stone-500 font-medium block text-[9px] sm:text-[10px] uppercase">Energy</span>
              <span className="font-bold text-[#0F3E2E] text-xs sm:text-sm">{selectedLabProduct.nutritionalInfo?.calories || selectedLabProduct.nutritionalInfo?.energy || '68 kcal'}</span>
            </div>
          </div>

          {/* Full Test Spectrum Table */}
          <div className="bg-white rounded-2xl border border-[#0F3E2E]/10 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-3 bg-[#0F3E2E]/5 border-b border-[#0F3E2E]/10 flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0F3E2E] uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <span>Standard Testing Spectrum</span>
              </h4>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
                100% Passed
              </span>
            </div>

            <div className="divide-y divide-gray-100 text-xs sm:text-sm">
              <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <span className="text-stone-600 font-medium">A2 Beta-Casein DNA Breed Test</span>
                <span className="font-bold text-[#0F3E2E] flex items-center space-x-1 shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{lab.a2CaseinPurity || '100% Certified'}</span>
                </span>
              </div>
              <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <span className="text-stone-600 font-medium">Oxytocin & Growth Hormones</span>
                <span className="font-bold text-[#0F3E2E] flex items-center space-x-1 shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{lab.antibiotics || '0.00% (Not Detected)'}</span>
                </span>
              </div>
              <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <span className="text-stone-600 font-medium">Synthetic Detergents & Urea</span>
                <span className="font-bold text-[#0F3E2E] flex items-center space-x-1 shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Nil (Zero Adulteration)</span>
                </span>
              </div>
              <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <span className="text-stone-600 font-medium">Cold Chain Maintenance</span>
                <span className="font-bold text-[#0F3E2E] shrink-0">
                  {lab.chillingTemperature || '3.8°C at Dispatch'}
                </span>
              </div>
            </div>
          </div>

          {/* Official Stamp & Download action */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-[#D4AF37]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#0F3E2E]">Certified by Apex NABL Accredited Food Testing Labs</p>
                <p className="text-[11px] text-stone-600">Sample tested daily from morning batch before bottling.</p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#0F3E2E] text-white text-xs font-bold rounded-xl hover:bg-[#18523f] flex items-center justify-center space-x-2 shadow-md transition-transform active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Download Official PDF</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
