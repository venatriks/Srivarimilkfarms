import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Star, Milk, ShieldCheck, FlaskConical,
  Plus, Sparkles, Check, ChevronDown, RefreshCw, Lock, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Products = () => {
  const { products, addToCart, setSelectedLabProduct, user } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const categories = ['All', 'Raw Milk', 'Cultured Ghee', 'Fresh Paneer & Curd', 'Farm Specials'];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // featured
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">

      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3.5 py-1 rounded-full bg-[#0F3E2E]/10 text-[#0F3E2E] text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-[#0F3E2E]/20 inline-block">
          Farm-Fresh Dairy Products
        </span>
        <h1 className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F3E2E]">
          Dairy Products | Indigenous Cow & Buffalo Milk | Srivari Milk Farms
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Explore our dairy products, including desi cow milk, buffalo milk,
          traditional Vedic Bilona ghee, fresh paneer and curd.
          We are working towards making genuine laboratory reports available.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-3 sm:space-y-4">

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none touch-pan-x">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${selectedCategory === cat
                  ? 'bg-[#0F3E2E] text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search A2 milk, ghee, curd..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 sm:py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#0F3E2E] font-medium focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>

          </div>

        </div>

      </div>

      {/* Login Required Notice Banner */}
      {!user && (
        <div className="bg-amber-50 rounded-3xl p-4 sm:p-5 border border-[#D4AF37]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0F3E2E] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F3E2E] flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Customer Login Required for Subscriptions & Cart</span>
                <span className="bg-[#0F3E2E]/10 text-[#0F3E2E] text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">Notice</span>
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Customers are required to log in to their account before adding any products to the cart or starting a daily milk subscription.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0F3E2E] text-white text-xs font-bold rounded-xl hover:bg-[#18523f] transition-all whitespace-nowrap shadow-md flex items-center justify-center space-x-2 shrink-0 border border-[#D4AF37]/40"
          >
            <User className="w-4 h-4 text-[#D4AF37]" />
            <span>Log In Now</span>
          </Link>
        </div>
      )}

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-white rounded-3xl border border-[#0F3E2E]/10 p-6 sm:p-8 space-y-3">
          <Milk className="w-12 h-12 text-[#D4AF37] mx-auto" />
          <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E]">No products match your filter</h3>
          <p className="text-xs text-stone-500">Try changing your search query or category filter.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="px-4 py-2 bg-[#0F3E2E] text-white text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#0F3E2E]/10 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Image Container */}
                <div className="relative h-56 sm:h-64 overflow-hidden bg-stone-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-[#0F3E2E] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-[#D4AF37]/50 shadow-md">
                    {product.badge}
                  </span>

                  {/* Lab Test Parameters Button */}
                  <button
                    onClick={() => setSelectedLabProduct(product)}
                    className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-[#0F3E2E] hover:bg-[#0F3E2E] hover:text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-md border border-[#0F3E2E]/20 transition-all"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>View Lab Parameters</span>
                  </button>
                </div>

                {/* Details */}
                <div className="p-5 sm:p-6 space-y-3.5 sm:space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                        {product.category}
                      </span>
                      <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#0F3E2E] mt-0.5">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-800 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                      <span className="text-[10px] text-stone-400">({product.reviewsCount})</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Lab Reports Availability */}
                  <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-stone-200 flex items-center gap-2.5">
                    <FlaskConical className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#0F3E2E]">
                        Laboratory Reports
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Coming Soon
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="p-5 sm:p-6 pt-0 border-t border-stone-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 mt-4">
                <div>
                  <span className="text-xs text-stone-400 block">Price</span>
                  <span className="text-xl sm:text-2xl font-bold text-[#0F3E2E]">₹{product.price}</span>
                  <span className="text-[11px] text-stone-500 font-medium"> / {product.unit}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {product.subscriptionAvailable && (
                    <button
                      onClick={() => addToCart(product, 1, 'subscription')}
                      className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors shadow-sm flex items-center space-x-1 shrink-0"
                      title={!user ? "Login required to subscribe" : "Subscribe for daily/alternate delivery"}
                    >
                      {!user && <Lock className="w-3 h-3 text-[#0F3E2E]" />}
                      <span>Subscribe</span>
                    </button>
                  )}
                  <button
                    onClick={() => addToCart(product, 1, 'one-time')}
                    className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold hover:bg-[#18523f] transition-colors shadow-sm flex items-center space-x-1 shrink-0"
                    title={!user ? "Login required to add to cart" : "One-time purchase"}
                  >
                    {!user ? <Lock className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Buy Once</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Subscription Guarantee Strip */}
      <div className="bg-[#0F3E2E] text-white rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#D4AF37] text-[#0F3E2E] flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="font-serif-display text-base sm:text-lg font-bold">Flexible Daily Subscription Manager</h4>
            <p className="text-xs text-emerald-200">
              Going on vacation? Pause or resume your morning milk delivery instantly via your Customer Account!
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
