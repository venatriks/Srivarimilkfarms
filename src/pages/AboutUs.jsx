import React from 'react';
import { Milk, ShieldCheck, Heart, Leaf, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutUs = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-4 py-1.5 rounded-full bg-[#0F3E2E]/10 text-[#0F3E2E] text-xs font-bold uppercase tracking-widest border border-[#0F3E2E]/20 inline-flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>Our Vedic Heritage & Vision</span>
        </span>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0F3E2E]">
          Preserving Pure Dairy Wisdom for Generations
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Founded on 450 acres of certified organic pastureland, Srivari Milk Farms was created to revive authentic A2 Desi Cow milk in its unadulterated state.
        </p>
      </div>

      {/* Main Story Image Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/30">
          <img
            src={`${import.meta.env.BASE_URL}images/hero.jpg`}
            alt="Gir cows grazing in organic farm pasture"
            className="w-full h-[400px] object-cover"
          />
        </div>

        <div className="space-y-6">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Ethical Cattle Care</span>
          <h2 className="font-serif-display text-3xl font-bold text-[#0F3E2E]">
            Our Ahimsa & Natural Grazing Philosophy
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            At Srivari, our indigenous Gir and Sahiwal cows are treated as family. They spend their days roaming open green pastures under natural sunlight. Calves receive first right to their mother's milk before any milk is collected for distribution.
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#0F3E2E] pt-2">
            <div className="flex items-center space-x-2 p-3 bg-white rounded-xl border border-stone-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Free-Range Grazing</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-white rounded-xl border border-stone-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hydroponic Green Barley</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-white rounded-xl border border-stone-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero Synthetic Hormones</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-white rounded-xl border border-stone-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ayurvedic Herb Supplements</span>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Values Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F3E2E]/10 text-[#0F3E2E] flex items-center justify-center">
            <Heart className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E]">Vedic Bilona Churning</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Our ghee is crafted exclusively via bi-directional wooden Bilona churning of A2 curd — retaining vital fat-soluble vitamins and rich golden aroma.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F3E2E]/10 text-[#0F3E2E] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E]">Zero Plastic Footprint</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            We operate a 100% glass bottle loop. Over 600,000 plastic pouches are eliminated from landfills every single year through our bottle return program.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F3E2E]/10 text-[#0F3E2E] flex items-center justify-center">
            <Award className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E]">NABL Accredited Purity</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Every batch passes 32 stringent quality checks including Somatic Cell Count, pesticide residues, and 100% DNA A2 protein verification.
          </p>
        </div>
      </div>

    </div>
  );
};
