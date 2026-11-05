import React from 'react';
import {
  ShieldCheck, FlaskConical, Snowflake, Truck, Award,
  CheckCircle2, XCircle, Download, FileText, Sparkles, Leaf, Milk, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Quality = () => {
  const { } = useApp();

  const steps = [
    {
      num: "01",
      title: "Organic Grazing & Hydroponic Fodder",
      desc: "Our pure Gir and Sahiwal cows graze freely on organic pastures and feed on green hydroponic barley grass, rich in natural beta-carotene and omega-3s.",
      icon: Leaf,
      highlight: "Zero Pesticides or Synthetic Feed"
    },
    {
      num: "02",
      title: "Clean Automated Milking",
      desc: "Milking takes place in EU-standard vacuum parlors. Untouched by human hands from cow udder to stainless steel transit lines.",
      icon: Milk,
      highlight: "100% Hygienic & Zero Contamination"
    },
    {
      num: "03",
      title: "Immediate 4°C Rapid Chilling",
      desc: "Within 15 minutes of milking, milk is chilled to 3.8°C in bulk milk chillers. Rapid chilling prevents bacterial multiplication while preserving live enzymes.",
      icon: Snowflake,
      highlight: "Cold Chain Temperature Logged"
    },
    {
      num: "04",
      title: "Tamper-Proof Glass Bottle Packaging",
      desc: "Milk is filled into steam-sterilized, eco-friendly glass bottles and sealed with tamper-evident gold foil caps. Zero plastic chemical leaching.",
      icon: ShieldCheck,
      highlight: "100% Lead-Free Glass"
    },
    {
      num: "05",
      title: "5 AM Morning Doorstep Delivery",
      desc: "Dispatched in refrigerated vehicles at 4:30 AM and placed inside insulated doorstep boxes before sunrise for your morning tea.",
      icon: Truck,
      highlight: "Punctual Morning Dispatch"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12 sm:space-y-16">

      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
        <span className="px-3.5 py-1.5 rounded-full bg-[#0F3E2E]/10 text-[#0F3E2E] text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-[#0F3E2E]/20 inline-flex items-center space-x-1.5">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
          <span>Our Quality Practices</span>
        </span>
        <h1 className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F3E2E]">
          From Farm to Bottle: The Pure Dairy Cycle
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Learn about our dairy farm practices, from cattle care and hygienic
          milking to milk chilling, packaging and doorstep delivery.
          Laboratory reports and certifications will be shared when available.
        </p>
      </div>

      {/* Hero Image Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/30">
        <img
          src={`${import.meta.env.BASE_URL}images/quality_lab.jpg`}
          alt="Srivari Dairy Quality Practices"
          className="w-full h-72 sm:h-80 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F3E2E] via-[#0F3E2E]/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="font-serif-display text-xl sm:text-2xl font-bold">
              Laboratory Testing – Coming Soon
            </h3>
            <p className="text-xs text-emerald-100/90 mt-1">
              Genuine laboratory reports will be shared once testing is completed
              and the reports are officially available.
            </p>
          </div>

          <span className="px-4 py-2.5 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider shrink-0">
            Reports Coming Soon
          </span>
        </div>
      </div>

      {/* STEP-BY-STEP DAIRY CYCLE BREAKDOWN */}
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">5-Stage Integrity</span>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#0F3E2E]">
            The 5-Stage Srivari Purity Journey
          </h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {steps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 sm:p-8 rounded-3xl border border-[#0F3E2E]/10 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start space-x-4 sm:space-x-6 min-w-0">
                  <span className="font-serif-display text-2xl sm:text-4xl font-bold text-[#D4AF37] opacity-80 shrink-0">
                    {step.num}
                  </span>

                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center space-x-2.5 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-[#0F3E2E]/10 text-[#0F3E2E] shrink-0">
                        <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <h3 className="font-serif-display text-base sm:text-xl font-bold text-[#0F3E2E]">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="self-start md:self-auto shrink-0 bg-[#FDFBF7] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl border border-emerald-900/10 text-[11px] sm:text-xs font-bold text-[#0F3E2E] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{step.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COMPARISON TABLE: Srivari A2 Milk vs Standard Packet Milk */}
      <div className="bg-white rounded-3xl border border-[#0F3E2E]/10 shadow-xl overflow-hidden">
        <div>
          <h3 className="font-serif-display text-xl sm:text-2xl font-bold">
            Our Dairy Quality Practices
          </h3>
          <p className="text-xs text-emerald-100/90 mt-1">
            We are working towards making genuine laboratory reports available.
          </p>
        </div>

        <span className="px-4 py-2.5 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider shrink-0">
          Reports Coming Soon
        </span>

        <div className="overflow-x-auto touch-pan-x">
          <table className="min-w-[620px] w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[#0F3E2E] uppercase tracking-wider font-bold">
                <th className="py-3.5 sm:py-4 px-4 sm:px-6">Quality Feature</th>
                <th className="py-3.5 sm:py-4 px-4 sm:px-6 bg-[#0F3E2E]/5 text-[#0F3E2E] font-bold">Srivari A2 Desi Cow Milk</th>
                <th className="py-3.5 sm:py-4 px-4 sm:px-6 text-stone-500">Commercial Packet Milk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              <tr>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-stone-800">Beta-Casein Protein Type</td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 bg-[#0F3E2E]/5 text-emerald-800 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Certified A2/A2 Protein</span>
                </td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-stone-500 flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>A1 Protein (Causes bloating/inflammation)</span>
                </td>
              </tr>

              <tr>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-stone-800">Processing Method</td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 bg-[#0F3E2E]/5 text-emerald-800 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Raw & Whole (Unpasteurized option)</span>
                </td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-stone-500 flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>High Heat Ultra-Pasteurized (Kills enzymes)</span>
                </td>
              </tr>

              <tr>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-stone-800">Fat Homogenization</td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 bg-[#0F3E2E]/5 text-emerald-800 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Non-Homogenized (Natural Malai Layer)</span>
                </td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-stone-500 flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Mechanically Homogenized Fat Globules</span>
                </td>
              </tr>

              <tr>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-stone-800">Packaging Medium</td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 bg-[#0F3E2E]/5 text-emerald-800 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sterilized Lead-Free Glass Bottles</span>
                </td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-stone-500 flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Single-Use Plastic Pouches (Microplastics)</span>
                </td>
              </tr>

              <tr>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-stone-800">Antibiotics & Hormones</td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 bg-[#0F3E2E]/5 text-emerald-800 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>0.00% (Strictly Prohibited)</span>
                </td>
                <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-stone-500 flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Traces frequently detected in mixed pool milk</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LAB REPORTS & CERTIFICATIONS - COMING SOON */}
      <div className="bg-gradient-to-br from-[#0F3E2E] to-[#18523f] text-white p-6 sm:p-10 md:p-12 rounded-3xl border border-[#D4AF37]/40 shadow-2xl space-y-6 sm:space-y-8">

        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
            Public Verification
          </span>

          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold">
            Lab Reports & Certifications
          </h2>

          <p className="text-xs text-emerald-100/90">
            We are working towards making genuine laboratory reports and
            applicable certifications available. Documents will be published
            here once officially issued and available for verification.
          </p>

          <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
            Coming Soon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

          <div className="bg-white/10 p-5 sm:p-6 rounded-2xl border border-white/20 backdrop-blur-md space-y-4">
            <FileText className="w-8 h-8 text-[#D4AF37]" />

            <div>
              <h4 className="font-bold text-sm text-white">
                FSSAI License
              </h4>
              <p className="text-[11px] text-emerald-200 mt-2">
                Applicable food safety licensing information will be published
                after the license is officially issued.
              </p>
            </div>

            <span className="inline-block text-xs font-bold text-[#D4AF37]">
              Coming Soon
            </span>
          </div>

          <div className="bg-white/10 p-5 sm:p-6 rounded-2xl border border-white/20 backdrop-blur-md space-y-4">
            <Award className="w-8 h-8 text-[#D4AF37]" />

            <div>
              <h4 className="font-bold text-sm text-white">
                Laboratory Test Reports
              </h4>
              <p className="text-[11px] text-emerald-200 mt-2">
                Genuine laboratory results and tested parameters will be
                displayed when reports become available.
              </p>
            </div>

            <span className="inline-block text-xs font-bold text-[#D4AF37]">
              Coming Soon
            </span>
          </div>

          <div className="bg-white/10 p-5 sm:p-6 rounded-2xl border border-white/20 backdrop-blur-md space-y-4 sm:col-span-2 lg:col-span-1">
            <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />

            <div>
              <h4 className="font-bold text-sm text-white">
                Breed Verification
              </h4>
              <p className="text-[11px] text-emerald-200 mt-2">
                Breed verification documents will be shared if and when
                authentic supporting certificates are available.
              </p>
            </div>

            <span className="inline-block text-xs font-bold text-[#D4AF37]">
              Coming Soon
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
