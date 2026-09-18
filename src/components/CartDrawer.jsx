import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartDrawer = () => {
  const { 
    cart, 
    cartOpen, 
    setCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    cartTotal, 
    setCheckoutOpen 
  } = useApp();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FBF9F3] shadow-2xl border-l border-[#042B1B]/10 flex flex-col">
          
          {/* Header */}
          <div className="p-6 bg-[#042B1B] text-white flex items-center justify-between border-b border-[#DFB33F]/30">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#DFB33F] bg-white shrink-0">
                <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Srivari Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold">Your Farm Basket</h2>
                <p className="text-xs text-emerald-200">Fresh morning delivery at 5:30 AM</p>
              </div>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[#042B1B]/10 text-[#042B1B] rounded-full flex items-center justify-center mx-auto overflow-hidden border border-[#DFB33F] p-2">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Srivari Logo" className="w-full h-full object-cover rounded-full" />
                </div>
                <h3 className="font-serif-display text-lg font-bold text-[#042B1B]">Your basket is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Explore our pure A2 Desi Cow milk, Vedic Bilona Ghee, fresh paneer & clay pot curd!
                </p>
                <button
                  onClick={() => setCartOpen(false)}
                  className="px-6 py-2.5 bg-[#042B1B] text-white text-xs font-bold rounded-full uppercase tracking-wider hover:bg-[#0B422B] transition-all"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-[#042B1B]/10 shadow-sm flex space-x-4 relative group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-xl border border-stone-200 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-[#042B1B] pr-6">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.buyType === 'subscription' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {item.buyType === 'subscription' ? `Subscription (${item.frequency})` : 'One-Time Delivery'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
                      <span className="font-bold text-sm text-[#042B1B]">
                        ₹{item.product.price * item.quantity}
                        <span className="text-[10px] font-normal text-stone-500">
                          {' '}(₹{item.product.price}/{item.product.unit.split(' ')[1] || 'unit'})
                        </span>
                      </span>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="p-1 hover:bg-stone-200 text-stone-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#042B1B]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="p-1 hover:bg-stone-200 text-stone-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}

            {/* Glass Bottle Recycle Reward Notice */}
            {cart.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-[#DFB33F]/30 flex items-start space-x-3">
                <RefreshCw className="w-5 h-5 text-[#DFB33F] shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-[#042B1B]">Eco Glass Bottle Recycling</h5>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Return empty glass bottles to our 5 AM delivery runner to earn ₹5 cashback per bottle in your Srivari Wallet!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-[#042B1B]/10 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>5 AM Morning Door Delivery</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Glass Bottle Deposit</span>
                  <span className="font-semibold text-stone-900">₹0 (Waived)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#042B1B] pt-2 border-t border-stone-100">
                  <span>Total Amount</span>
                  <span className="text-lg text-[#042B1B]">₹{cartTotal}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
                className="w-full py-3.5 bg-[#042B1B] text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-[#0B422B] flex items-center justify-center space-x-2 shadow-xl border border-[#DFB33F]/30 transition-transform active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#DFB33F]" />
              </button>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-stone-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted 256-bit Secure Payment</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
