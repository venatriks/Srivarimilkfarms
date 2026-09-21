import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ShieldCheck, Milk, Truck, Award, CheckCircle2,
  ArrowRight, HeartHandshake, FlaskConical, Snowflake, Leaf,
  Star, ChevronRight, Calculator, FileText, Zap, RefreshCw, Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Home = () => {
  const { products, addToCart, setSelectedLabProduct, showToast, user } = useApp();
  const navigate = useNavigate();

  // Interactive Milk Calculator State
  const [familyMembers, setFamilyMembers] = useState(4);
  const [litersPerPerson, setLitersPerPerson] = useState(0.5);

  const calculatedDailyLiters = (familyMembers * litersPerPerson).toFixed(1);
  const calculatedMonthlyPrice = Math.round(calculatedDailyLiters * 30 * 75);

  return (
    <div className="space-y-20 pb-20">

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-8 pb-16 overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero.jpg`}
            alt="Srivari Milk Farms Landscape"
            className="w-full h-full object-cover object-center scale-105 transform filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#072218]/95 via-[#0F3E2E]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent opacity-90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl text-white space-y-6">

            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-widest animate-pulse-glow">
              <Sparkles className="w-4 h-4" />
              <span>Single-Origin Pure Cow A2 Milk</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Pure, Unprocessed A2 Cow Milk Fresh From Our Farm to Your Doorstep.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal">
              Directly dispatched from our free-range  cows within 12 hours of milking. 100% untouched by hand, cold-chain chilled at 3.8°C, and delivered in tamper-proof glass bottles by 5:30 AM every morning.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <Link
                to="/products"
                className="px-8 py-4 bg-[#D4AF37] text-[#0F3E2E] rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-amber-400 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2 border border-amber-300"
              >
                <span>Start Daily Subscription</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/quality"
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all flex items-center justify-center space-x-2"
              >
                <FlaskConical className="w-5 h-5 text-[#D4AF37]" />
                <span>View Lab Test Standards</span>
              </Link>
            </div>

            {/* Social Trust Guarantee */}
            <div className="pt-6 flex items-center space-x-6 text-xs text-emerald-200 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Zero Adulteration Guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Cancel / Pause Anytime</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. QUICK HIGHLIGHTS (4 Pillars) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#0F3E2E]/10 text-[#0F3E2E] flex items-center justify-center mb-4 group-hover:bg-[#0F3E2E] group-hover:text-[#D4AF37] transition-colors">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] mb-2">100% Organic Fodder</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our Gir & Sahiwal cows graze freely on organic green pastures and eat fresh hydroponic grass free from synthetic pesticides.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#0F3E2E]/10 text-[#0F3E2E] flex items-center justify-center mb-4 group-hover:bg-[#0F3E2E] group-hover:text-[#D4AF37] transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] mb-2">Untouched by Hand</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Automated EU-standard milking systems directly transfer raw milk to food-grade stainless steel chillers without human contact.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#0F3E2E]/10 text-[#0F3E2E] flex items-center justify-center mb-4 group-hover:bg-[#0F3E2E] group-hover:text-[#D4AF37] transition-colors">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] mb-2">4-Stage Quality Testing</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every morning batch is tested for Fat %, SNF %, Somatic Cell Count, antibiotics, heavy metals, and A2 casein purity.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#0F3E2E]/10 text-[#0F3E2E] flex items-center justify-center mb-4 group-hover:bg-[#0F3E2E] group-hover:text-[#D4AF37] transition-colors">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] mb-2">5 AM Doorstep Delivery</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Bottled in sterilized eco glass containers and delivered in insulated boxes right before your morning cup of tea or coffee.
            </p>
          </div>

        </div>
      </section>

      {/* 3. FEATURED PRODUCTS GRID / CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Farm Pure Range</span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0F3E2E] mt-1">
              Our Featured Dairy Products
            </h2>
          </div>
          <Link
            to="/products"
            className="mt-4 md:mt-0 inline-flex items-center space-x-2 text-xs font-bold text-[#0F3E2E] uppercase tracking-wider hover:text-[#18523f] group"
          >
            <span>Explore All Farm Products</span>
            <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#0F3E2E]/10 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col group"
            >
              {/* Image & Badge */}
              <div className="relative h-64 overflow-hidden bg-stone-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-[#0F3E2E] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-[#D4AF37]/50 shadow-md">
                  {product.badge}
                </span>

                <button
                  onClick={() => setSelectedLabProduct(product)}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-[#0F3E2E] hover:bg-[#0F3E2E] hover:text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-md border border-[#0F3E2E]/20 transition-all"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Lab Stats</span>
                </button>
              </div>

              {/* Product Info */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E]">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Fat & SNF Quick Stats */}
                  <div className="flex space-x-4 mt-4 py-2 px-3 bg-[#FDFBF7] rounded-xl border border-stone-200/80 text-[11px]">
                    <div>
                      <span className="text-stone-500 font-medium">Fat: </span>
                      <span className="font-bold text-[#0F3E2E]">{product.labParameters?.fatPercentage}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-medium">SNF: </span>
                      <span className="font-bold text-[#0F3E2E]">{product.labParameters?.snfPercentage}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-medium">A2 Purity: </span>
                      <span className="font-bold text-emerald-700">100%</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-500 block">Farm Price</span>
                    <span className="text-xl font-bold text-[#0F3E2E]">₹{product.price}</span>
                    <span className="text-[11px] text-stone-500 font-medium"> / {product.unit}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(product, 1, 'subscription')}
                      className="px-3.5 py-2 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors shadow-sm flex items-center space-x-1"
                      title={!user ? "Login required to subscribe" : "Subscribe for daily/alternate delivery"}
                    >
                      {!user && <Lock className="w-3 h-3 text-[#0F3E2E]" />}
                      <span>Subscribe</span>
                    </button>
                    <button
                      onClick={() => addToCart(product, 1, 'one-time')}
                      className="px-3.5 py-2 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold hover:bg-[#18523f] transition-colors shadow-sm flex items-center space-x-1"
                      title={!user ? "Login required to add to cart" : "One-time purchase"}
                    >
                      {!user && <Lock className="w-3 h-3 text-[#D4AF37]" />}
                      <span>Buy Once</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. INTERACTIVE MILK CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#0F3E2E] to-[#18523f] text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-[#D4AF37]/30 relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-8">

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span>Smart Family Milk Plan Calculator</span>
              </span>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-white">
                Calculate Your Monthly Fresh A2 Milk Requirement
              </h2>
              <p className="text-sm text-emerald-100/90">
                Adjust family size and daily consumption to discover your ideal daily delivery quantity & transparent monthly investment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">

              {/* Controls */}
              <div className="space-y-6">

                {/* Family Members slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-emerald-200">
                    <span>Family Members</span>
                    <span className="text-[#D4AF37] text-sm">{familyMembers} People</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={familyMembers}
                    onChange={(e) => setFamilyMembers(Number(e.target.value))}
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>

                {/* Liters per person selector */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-emerald-200">
                    <span>Per Person Consumption</span>
                    <span className="text-[#D4AF37] text-sm">{litersPerPerson} L / day</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[0.25, 0.5, 0.75].map((val) => (
                      <button
                        key={val}
                        onClick={() => setLitersPerPerson(val)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${litersPerPerson === val
                          ? 'bg-[#D4AF37] text-[#0F3E2E]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                      >
                        {val === 0.25 ? 'Light (250ml)' : val === 0.5 ? 'Regular (500ml)' : 'Heavy (750ml)'}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Result Box */}
              <div className="bg-white text-[#0F3E2E] p-6 rounded-2xl shadow-xl space-y-4 text-center border-2 border-[#D4AF37]">
                <div>
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-wider">Recommended Daily Delivery</span>
                  <div className="text-4xl font-bold font-serif-display text-[#0F3E2E] mt-1">
                    {calculatedDailyLiters} <span className="text-xl font-sans text-[#D4AF37]">Liters / Day</span>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-semibold">Glass Bottle Dispatch at 5:30 AM</span>
                </div>

                <div className="pt-3 border-t border-stone-200">
                  <span className="text-xs text-stone-500 font-medium">Estimated Monthly Investment</span>
                  <div className="text-2xl font-bold text-[#0F3E2E] mt-0.5">
                    ₹{calculatedMonthlyPrice.toLocaleString()} <span className="text-xs text-stone-500 font-normal">/ 30 Days</span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(products[0], Math.ceil(Number(calculatedDailyLiters)), 'subscription')}
                  className="w-full py-3 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  {!user && <Lock className="w-4 h-4 text-[#D4AF37]" />}
                  <span>Start {calculatedDailyLiters}L Daily Subscription</span>
                </button>
                {!user && (
                  <p className="text-[11px] text-amber-900 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-300 font-semibold text-center flex items-center justify-center space-x-1">
                    <span>🔒 Customers must log in to add items to cart</span>
                  </p>
                )}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 5. QUALITY & TESTING STANDARDS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#0F3E2E]/10">
            <img
              src={`${import.meta.env.BASE_URL}images/quality_lab.jpg`}
              alt="NABL Accredited Quality Testing Lab"
              className="w-full h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F3E2E] via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-[#D4AF37]/40 shadow-xl">
              <div className="flex items-center space-x-3 mb-2">
                <Award className="w-6 h-6 text-[#D4AF37]" />
                <h4 className="font-serif-display text-base font-bold text-[#0F3E2E]">NABL Accredited Laboratory Tested</h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Zero tolerance for milk adulteration. Every single batch is verified for Fat %, SNF %, Somatic Cell Count, and 100% DNA Certified A2 Beta-Casein.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Uncompromising Standards</span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0F3E2E]">
              Why Srivari A2 Milk is 100% Pure & Unadulterated
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Unlike commercial packet milk which undergoes severe high-heat processing, homogenization, and synthetic fat adjustments, Srivari milk remains in its raw, natural state.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-[#0F3E2E]/10 shadow-sm">
                <Snowflake className="w-6 h-6 text-[#0F3E2E] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-[#0F3E2E]">Immediate 4°C Cold Chain</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Milk is rapidly chilled to 3.8°C within 15 minutes of automated milking to lock in natural enzymes and prevent bacterial growth.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-[#0F3E2E]/10 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-[#0F3E2E] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-[#0F3E2E]">Zero Antibiotics & Zero Hormones</h4>
                  <p className="text-xs text-stone-600 mt-0.5">We strictly prohibit synthetic hormone injections (Oxytocin) or antibiotic treatments on our Gir cow herd.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-[#0F3E2E]/10 shadow-sm">
                <RefreshCw className="w-6 h-6 text-[#0F3E2E] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-[#0F3E2E]">Eco-Friendly Glass Bottle Packaging</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Bottled in reusable lead-free glass bottles to prevent microplastic leaching into your milk.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/quality"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#18523f] shadow-md transition-all"
              >
                <span>Read Full Quality Protocol</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 6. VERIFIED TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Loved by 10,000+ Families</span>
          <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0F3E2E]">
            What Our Subscribers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Dr. Ananya Vasudevan",
              role: "Pediatrician & Mother",
              location: "Bengaluru",
              comment: "Switching to Srivari's A2 milk was the best decision for my toddlers. The milk has a rich, sweet creaminess and zero digestive issues compared to store packets. The 5 AM glass bottle delivery is incredibly punctual!",
              avatar: "https://images.unsplash.com/photo-1594824813566-88855ce78961?auto=format&fit=crop&w=150&q=80"
            },
            {
              name: "Suresh & Meena R.",
              role: "Regular Subscriber (2 Years)",
              location: "Mysuru",
              comment: "The Vedic Bilona Ghee smells exactly like the ghee my grandmother made in our ancestral village. The quality testing reports giving exact fat and SNF percentages give us 100% confidence.",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
            },
            {
              name: "Kavitha Sharma",
              role: "Nutritionist & Fitness Coach",
              location: "Bengaluru",
              comment: "Their farm paneer is unbelievably soft and fresh! 18.5 grams of clean A2 protein per 100g with no synthetic coagulation agents. Highly recommend Srivari Milk Farms.",
              avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-[#0F3E2E]/10 shadow-md flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex text-amber-400 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed italic">
                  "{item.comment}"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-stone-100">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#D4AF37]"
                />
                <div>
                  <h4 className="font-bold text-xs text-[#0F3E2E]">{item.name}</h4>
                  <p className="text-[11px] text-stone-500">{item.role} • {item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F3E2E] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden border border-[#D4AF37]/40 shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <span className="px-4 py-1.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-widest border border-[#D4AF37]">
              Start Your Healthy Morning Ritual Today
            </span>
            <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-white">
              Try Fresh Farm A2 Milk Tomorrow Morning at 5:30 AM
            </h2>
            <p className="text-sm text-emerald-100/90">
              No long commitments required. Order a 3-day trial pack or start a flexible daily subscription with doorstep bottle delivery.
            </p>
            <div>
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-[#D4AF37] text-[#0F3E2E] rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-amber-400 transition-transform active:scale-95 shadow-xl border border-amber-300"
              >
                <span>View Products & Subscribe</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
