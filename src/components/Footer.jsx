import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Phone, Mail, MapPin, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { showToast } = useApp();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    showToast("Thank you for subscribing to farm updates & daily milk tips!");
    setEmail('');
  };

  return (
    <footer className="bg-[#042B1B] text-white border-t border-[#DFB33F]/30 pt-16 pb-12 relative overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFB33F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0B422B]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Quality Badges Header Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12 mb-12 border-b border-[#DFB33F]/20">
          <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-[#DFB33F] shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Zero Chemical</h5>
              <p className="text-[11px] text-emerald-200">No Antibiotics or Hormones</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <Award className="w-8 h-8 text-[#DFB33F] shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">DNA Certified</h5>
              <p className="text-[11px] text-emerald-200">100% Pure A2/A2 Beta Casein</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#DFB33F] shrink-0 bg-white">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Srivari Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Glass Bottle</h5>
              <p className="text-[11px] text-emerald-200">Tamper-Proof Chilled Packaging</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <CheckCircle2 className="w-8 h-8 text-[#DFB33F] shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">5 AM Delivery</h5>
              <p className="text-[11px] text-emerald-200">Fresh morning door dispatch</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#DFB33F] shadow-md bg-[#042B1B] shrink-0">
                <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Srivari Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-serif-display text-2xl font-bold text-white tracking-wide block">
                  SRIVARI MILK FARMS
                </span>
                <span className="text-[10px] text-[#DFB33F] font-semibold tracking-wider uppercase block">
                  Pure from Our Farm • 100% A2 Cow & Buffalo Milk
                </span>
              </div>
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed pr-4">
              Preserving Vedic dairy wisdom with modern NABL-accredited purity standards. Our free-range Cows & Buffalo feast on organic hydroponic fodder to produce rich, creamy, unprocessed A2 milk.
            </p>
            <div className="pt-2 text-xs text-[#DFB33F] font-mono space-y-1">
              <p>FSSAI Lic No: 11224333000189</p>
              <p>NABL Accredited Partner Lab ID: IND-NABL-8942</p>
              <p className="text-emerald-200 font-sans text-[11px]">ಶ್ರೀವಾರಿ ಮಿಲ್ಕ್ ಫಾರ್ಮ್ಸ್ • శ్రీ వారి మిల్క్ ఫార్మ్స్</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif-display text-base font-semibold text-[#DFB33F] mb-4">
              Explore Farm
            </h4>
            <ul className="space-y-2.5 text-sm text-emerald-100/80">
              <li><Link to="/" className="hover:text-[#DFB33F] transition-colors">Home Page</Link></li>
              <li><Link to="/products" className="hover:text-[#DFB33F] transition-colors">A2 Dairy Products</Link></li>
              <li><Link to="/quality" className="hover:text-[#DFB33F] transition-colors">Quality Testing Standards</Link></li>
              <li><Link to="/about" className="hover:text-[#DFB33F] transition-colors">Our Organic Farm</Link></li>
              <li><Link to="/contact" className="hover:text-[#DFB33F] transition-colors">Farm Visit & Contact</Link></li>
            </ul>
          </div>

          {/* Customer Portal */}
          <div>
            <h4 className="font-serif-display text-base font-semibold text-[#DFB33F] mb-4">
              Subscriptions
            </h4>
            <ul className="space-y-2.5 text-sm text-emerald-100/80">
              <li><Link to="/dashboard?tab=subscription" className="hover:text-[#DFB33F] transition-colors">Daily Milk Subscription</Link></li>
              <li><Link to="/dashboard?tab=pause-resume" className="hover:text-[#DFB33F] transition-colors">Pause/Resume Delivery</Link></li>
              <li><Link to="/products" className="hover:text-[#DFB33F] transition-colors">Vedic Bilona Ghee Order</Link></li>
              <li><Link to="/login" className="hover:text-[#DFB33F] transition-colors">Customer & Admin Login</Link></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="font-serif-display text-base font-semibold text-[#DFB33F] mb-4">
              Farm Desk
            </h4>
            <div className="space-y-3 text-xs text-emerald-100/80">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#DFB33F] shrink-0 mt-0.5" />
                <span>Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk, Anantapur Dist, Andhra Pradesh - 515872</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-[#DFB33F] shrink-0" />
                <span>+91 7022776637 / +91 7095663307</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#DFB33F] shrink-0" />
                <span>care@srivarimilkfarms.com</span>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="pt-2">
              <div className="flex items-center rounded-xl bg-white/10 p-1 border border-white/20">
                <input
                  type="email"
                  placeholder="Enter email for daily tips"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-emerald-200/60 px-3 py-1.5 focus:outline-none w-full"
                />
                <button
                  type="submit"
                  className="bg-[#DFB33F] text-[#042B1B] p-2 rounded-lg hover:bg-amber-400 transition-colors font-bold"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/60 space-y-4 sm:space-y-0">
          <p>© 2026 Srivari Milk Farms Private Limited. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-[#DFB33F] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#DFB33F] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#DFB33F] cursor-pointer">Refund Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
