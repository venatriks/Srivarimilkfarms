import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactUs = () => {
  const { showToast } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Milk Subscription Inquiry',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast("Message sent to Srivari Farm Care Desk! We will call you back shortly.");
    setFormData({ name: '', email: '', phone: '', subject: 'Milk Subscription Inquiry', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-[#0F3E2E]/10 text-[#0F3E2E] text-xs font-bold uppercase tracking-widest border border-[#0F3E2E]/20">
          Get in Touch
        </span>
        <h1 className="font-serif-display text-4xl font-bold text-[#0F3E2E]">
          Visit Our Organic Farm & Help Desk
        </h1>
        <p className="text-sm text-stone-600">
          Have questions about your morning delivery schedule, glass bottle deposits, or want to schedule a weekend farm tour with your family?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Contact Info Cards */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-3">
            <div className="flex items-center space-x-3 text-[#0F3E2E]">
              <MapPin className="w-6 h-6 text-[#D4AF37]" />
              <h4 className="font-bold text-base">Farm Address</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Srivari Milk Farms ,<br />
              Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk,<br />
              Anantapur Dist, Andhra Pradesh - 515872
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-3">
            <div className="flex items-center space-x-3 text-[#0F3E2E]">
              <Phone className="w-6 h-6 text-[#D4AF37]" />
              <h4 className="font-bold text-base">Customer Helpline</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Phone: +91 7022776637<br />
              WhatsApp: +91 7022776637 (24/7 Delivery Support)
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-3">
            <div className="flex items-center space-x-3 text-[#0F3E2E]">
              <Clock className="w-6 h-6 text-[#D4AF37]" />
              <h4 className="font-bold text-base">Farm Visit Hours</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Sunday: 7:00 AM - 11:00 AM<br />
              (Prior registration required for milking tour)
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#0F3E2E]/10 shadow-xl space-y-6">
          <h3 className="font-serif-display text-2xl font-bold text-[#0F3E2E]">
            Send Us a Message
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-stone-600">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-600">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-stone-600">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-600">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none"
                >
                  <option value="Milk Subscription Inquiry">Milk Subscription Inquiry</option>
                  <option value="Weekend Farm Tour Booking">Weekend Farm Tour Booking</option>
                  <option value="Bulk Bilona Ghee Order">Bulk Bilona Ghee Order</option>
                  <option value="Delivery Address Update">Delivery Address Update</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-stone-600">Your Message</label>
              <textarea
                rows={4}
                required
                placeholder="How can our farm team assist you?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#0F3E2E] text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-[#18523f] shadow-md border border-[#D4AF37]/30 transition-transform active:scale-98 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4 text-[#D4AF37]" />
              <span>Submit Inquiry</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
