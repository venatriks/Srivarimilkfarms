import React, { useState } from 'react';
import { 
  ShieldAlert, Milk, Truck, Package, Plus, Edit, Check, Database,
  DollarSign, Users, AlertCircle, Search, Printer, Sparkles, CheckCircle, X, MapPin, Phone, Calendar,
  Download, Upload, RefreshCw, Trash2, UserPlus, Lock, Key, Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminDashboard = () => {
  const { 
    products, updateProductStockOrPrice, addProduct, deleteProduct,
    distributionList, updateDistributionStatus, 
    dbUsers, addDbUser, updateDbUser, deleteDbUser,
    exportDatabaseBackup, importDatabaseBackup, resetDatabaseToDefaults,
    dbLogs, showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState('distribution'); // 'distribution' | 'products' | 'users' | 'database' | 'add'
  const [searchDist, setSearchDist] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [runnerName, setRunnerName] = useState('Ramesh Gowda (Route #4)');

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'customer',
    phone: '+91 ',
    address: '',
    walletBalance: 1500
  });

  // Editing User State
  const [editingUserId, setEditingUserId] = useState(null);

  // Add Product Form State
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'Raw Milk',
    price: 80,
    unit: '1 Liter Bottle',
    description: '',
    image: `${import.meta.env.BASE_URL}images/a2_milk.jpg`
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.description) {
      showToast("Please fill in all product details", "error");
      return;
    }
    addProduct(newProd);
    setActiveTab('products');
    setNewProd({
      name: '',
      category: 'Raw Milk',
      price: 80,
      unit: '1 Liter Bottle',
      description: '',
      image: `${import.meta.env.BASE_URL}images/a2_milk.jpg`
    });
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      showToast("Please enter user name and email", "error");
      return;
    }
    addDbUser(newUser);
    setNewUser({ name: '', email: '', role: 'customer', phone: '+91 ', address: '', walletBalance: 1500 });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importDatabaseBackup(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const filteredDist = distributionList.filter(d => 
    d.customerName.toLowerCase().includes(searchDist.toLowerCase()) ||
    d.address.toLowerCase().includes(searchDist.toLowerCase()) ||
    d.product.toLowerCase().includes(searchDist.toLowerCase())
  );

  const filteredUsers = dbUsers.filter(u => 
    u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.phone.includes(searchUsers) ||
    u.role.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const handlePrint = () => {
    showToast("Opening Browser Print Dialog for 5 AM Dispatch Roster...", "info");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Header */}
      <div className="bg-[#042B1B] text-white p-8 rounded-3xl border border-[#DFB33F]/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#DFB33F]/20 text-[#DFB33F] text-xs font-bold uppercase tracking-wider border border-[#DFB33F] inline-flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>Database Control Center</span>
          </span>
          <h1 className="font-serif-display text-3xl font-bold">
            Srivari Milk Farms Control Portal
          </h1>
          <p className="text-xs text-emerald-200">
            Persistent Database Management System • Customer Accounts, Admins, Inventory & 5 AM Dispatch Roster
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportDatabaseBackup}
            className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all flex items-center space-x-1.5 backdrop-blur-md border border-white/20"
          >
            <Download className="w-4 h-4 text-[#DFB33F]" />
            <span>Export DB JSON</span>
          </button>
          
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-5 py-2.5 bg-[#DFB33F] text-[#042B1B] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center space-x-2 shadow-lg border border-amber-300"
          >
            <Printer className="w-4 h-4" />
            <span>Print 5 AM Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Tomorrow's Milk Dispatch</span>
            <div className="text-3xl font-bold font-serif-display text-[#042B1B] mt-1">1,420 L</div>
            <span className="text-[10px] text-emerald-700 font-semibold">Chilled in Tanks at 3.8°C</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#042B1B]/10 text-[#042B1B] flex items-center justify-center">
            <Milk className="w-6 h-6 text-[#DFB33F]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Database User Accounts</span>
            <div className="text-3xl font-bold font-serif-display text-[#042B1B] mt-1">{dbUsers.length} Users</div>
            <span className="text-[10px] text-emerald-700 font-semibold">{dbUsers.filter(u => u.role === 'customer').length} Customers • {dbUsers.filter(u => u.role === 'admin').length} Admins</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#042B1B]/10 text-[#042B1B] flex items-center justify-center">
            <Users className="w-6 h-6 text-[#DFB33F]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Today's Revenue</span>
            <div className="text-3xl font-bold font-serif-display text-[#042B1B] mt-1">₹1,06,500</div>
            <span className="text-[10px] text-emerald-700 font-semibold">Wallet Auto-Deducted</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#042B1B]/10 text-[#042B1B] flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#DFB33F]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Empty Bottles Returned</span>
            <div className="text-3xl font-bold font-serif-display text-[#042B1B] mt-1">680</div>
            <span className="text-[10px] text-emerald-700 font-semibold">Sterilized for Reuse</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#042B1B]/10 text-[#042B1B] flex items-center justify-center">
            <Package className="w-6 h-6 text-[#DFB33F]" />
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto border-b border-stone-200 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('distribution')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'distribution'
              ? 'bg-[#042B1B] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Truck className="w-4 h-4 text-[#DFB33F]" />
          <span>5 AM Distribution List</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#042B1B] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4 text-[#DFB33F]" />
          <span>User Accounts DB ({dbUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'products'
              ? 'bg-[#042B1B] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4 text-[#DFB33F]" />
          <span>Product Catalog DB ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'database'
              ? 'bg-[#042B1B] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Database className="w-4 h-4 text-[#DFB33F]" />
          <span>Database Tools & Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'add'
              ? 'bg-[#042B1B] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Plus className="w-4 h-4 text-[#DFB33F]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* TAB 1: Daily Milk Distribution Manifest */}
      {activeTab === 'distribution' && (
        <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif-display text-xl font-bold text-[#042B1B]">
                Morning Doorstep Delivery Roster
              </h3>
              <p className="text-xs text-stone-500">Live delivery status for 5:00 AM - 7:00 AM dispatch runners</p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer, address..."
                  value={searchDist}
                  onChange={(e) => setSearchDist(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-2 bg-[#042B1B] text-white text-xs font-bold rounded-xl hover:bg-[#0B422B] flex items-center space-x-1.5 shadow-sm shrink-0"
              >
                <Printer className="w-4 h-4 text-[#DFB33F]" />
                <span>Print Roster</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#042B1B]/5 border-b border-stone-200 text-[#042B1B] uppercase font-bold tracking-wider">
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Order Items</th>
                  <th className="py-3.5 px-4">Slot</th>
                  <th className="py-3.5 px-4">Bottle Return</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredDist.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#042B1B]">
                      {item.customerName}
                      <span className="text-[10px] text-stone-400 block">{item.phone}</span>
                    </td>
                    <td className="py-4 px-4 text-stone-600 max-w-xs">{item.address}</td>
                    <td className="py-4 px-4 font-bold text-stone-800">{item.product} ({item.quantity})</td>
                    <td className="py-4 px-4 text-stone-500">{item.deliverySlot}</td>
                    <td className="py-4 px-4 font-bold text-amber-800">{item.bottleReturnCount} Glass Bottles</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'Delivered' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : item.status === 'In Transit' 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-stone-100 text-stone-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => updateDistributionStatus(item.id, e.target.value)}
                        className="px-2 py-1 bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-semibold text-[#042B1B] focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS DATABASE STORE (CUSTOMERS & ADMINS) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create User Form */}
            <div className="bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-md space-y-4">
              <h3 className="font-serif-display text-lg font-bold text-[#042B1B] flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#DFB33F]" />
                <span>Create New User Record</span>
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="text-stone-600 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Reddy"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-300 font-medium text-[#042B1B]"
                  />
                </div>

                <div>
                  <label className="text-stone-600 font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-300 font-medium text-[#042B1B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-600 font-medium">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-300 font-bold text-[#042B1B]"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Farm Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-600 font-medium">Initial Wallet (₹)</label>
                    <input
                      type="number"
                      value={newUser.walletBalance}
                      onChange={(e) => setNewUser({ ...newUser, walletBalance: Number(e.target.value) })}
                      className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-300 font-bold text-[#042B1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-stone-600 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-300 text-[#042B1B]"
                  />
                </div>

                <div>
                  <label className="text-stone-600 font-medium">Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Doorstep address..."
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-300 text-[#042B1B]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#042B1B] text-white font-bold rounded-xl uppercase tracking-wider hover:bg-[#0B422B] transition-all shadow-md border border-[#DFB33F]/30"
                >
                  Save User to Database
                </button>
              </form>
            </div>

            {/* Users Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <h3 className="font-serif-display text-xl font-bold text-[#042B1B]">
                  User Accounts Table ({dbUsers.length})
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, role, email..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#042B1B]/5 border-b border-stone-200 text-[#042B1B] uppercase font-bold tracking-wider">
                      <th className="py-3 px-3">User Details</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Wallet</th>
                      <th className="py-3 px-3">Address</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-[#042B1B] block">{u.name}</strong>
                          <span className="text-[10px] text-stone-500 block">{u.email}</span>
                          <span className="text-[10px] text-stone-400">{u.phone}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={u.walletBalance}
                            onChange={(e) => updateDbUser(u.id, { walletBalance: Number(e.target.value) })}
                            className="w-20 px-2 py-1 bg-stone-100 border border-stone-300 rounded font-bold text-[#042B1B]"
                          />
                        </td>
                        <td className="py-3 px-3 text-stone-600 max-w-xs truncate">{u.address}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => deleteDbUser(u.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                            title="Delete User Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS DATABASE */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-6 space-y-6">
          <h3 className="font-serif-display text-xl font-bold text-[#042B1B]">
            Product Pricing & Inventory Control
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((prod) => (
              <div 
                key={prod.id}
                className="bg-[#FBF9F3] p-6 rounded-2xl border border-stone-200 space-y-4 flex flex-col justify-between"
              >
                <div className="flex space-x-4">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-20 h-20 object-cover rounded-xl border border-stone-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#DFB33F]">{prod.category}</span>
                    <h4 className="font-bold text-base text-[#042B1B]">{prod.name}</h4>
                    <p className="text-xs text-stone-500">{prod.unit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-200 text-xs">
                  <div>
                    <label className="text-stone-500 block font-medium">Price (₹)</label>
                    <input
                      type="number"
                      value={prod.price}
                      onChange={(e) => updateProductStockOrPrice(prod.id, { price: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-[#042B1B]"
                    />
                  </div>

                  <div>
                    <label className="text-stone-500 block font-medium">Stock Units</label>
                    <input
                      type="number"
                      value={prod.stockCount}
                      onChange={(e) => updateProductStockOrPrice(prod.id, { stockCount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-[#042B1B]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    onClick={() => updateProductStockOrPrice(prod.id, { inStock: !prod.inStock })}
                    className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase ${
                      prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {prod.inStock ? 'In Stock' : 'Out of Stock'}
                  </button>

                  <button
                    onClick={() => deleteProduct(prod.id)}
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE TOOLS, BACKUP & AUDIT LOGS */}
      {activeTab === 'database' && (
        <div className="space-y-8">
          
          {/* Backup & Restore Tools */}
          <div className="bg-white p-8 rounded-3xl border border-[#042B1B]/10 shadow-md space-y-6">
            <h3 className="font-serif-display text-2xl font-bold text-[#042B1B] flex items-center space-x-2">
              <Database className="w-6 h-6 text-[#DFB33F]" />
              <span>Database Backup, Restore & Maintenance</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-[#FBF9F3] p-6 rounded-2xl border border-stone-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#042B1B]">Export Complete JSON Backup</h4>
                  <p className="text-xs text-stone-500">Download a full snapshot of all users, catalog items, and delivery rosters.</p>
                </div>
                <button
                  onClick={exportDatabaseBackup}
                  className="w-full py-2.5 bg-[#042B1B] text-white rounded-xl text-xs font-bold hover:bg-[#0B422B] transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4 text-[#DFB33F]" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="bg-[#FBF9F3] p-6 rounded-2xl border border-stone-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#042B1B]">Import / Restore JSON File</h4>
                  <p className="text-xs text-stone-500">Upload a saved `.json` database file to restore records.</p>
                </div>
                <label className="w-full py-2.5 bg-[#DFB33F] text-[#042B1B] rounded-xl text-xs font-bold hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Select JSON File</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="bg-[#FBF9F3] p-6 rounded-2xl border border-stone-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#042B1B]">Reset to Factory Seeds</h4>
                  <p className="text-xs text-stone-500">Revert database to Srivari initial factory records.</p>
                </div>
                <button
                  onClick={resetDatabaseToDefaults}
                  className="w-full py-2.5 bg-red-800 text-white rounded-xl text-xs font-bold hover:bg-red-900 transition-all flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Database</span>
                </button>
              </div>

            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-md space-y-4">
            <h3 className="font-serif-display text-xl font-bold text-[#042B1B] flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#DFB33F]" />
              <span>Database Audit Log Stream</span>
            </h3>

            <div className="bg-stone-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs max-h-60 overflow-y-auto space-y-2">
              {dbLogs.map((log) => (
                <div key={log.id} className="flex space-x-3 border-b border-stone-800 pb-1">
                  <span className="text-stone-500 shrink-0">[{log.timestamp}]</span>
                  <span className="text-amber-400 font-bold shrink-0">{log.action}:</span>
                  <span className="text-stone-200">{log.description}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: Add Product */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-8 max-w-2xl mx-auto space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif-display text-2xl font-bold text-[#042B1B]">
              Add New Farm Product to Catalog
            </h3>
            <p className="text-xs text-stone-500">Fill in pricing and product details for instant customer availability</p>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-stone-600">Product Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Organic A2 Buffalo Milk (Thick Malai)"
                value={newProd.name}
                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none focus:border-[#042B1B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-stone-600">Category</label>
                <select
                  value={newProd.category}
                  onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                >
                  <option value="Raw Milk">Raw Milk</option>
                  <option value="Cultured Ghee">Cultured Ghee</option>
                  <option value="Fresh Paneer & Curd">Fresh Paneer & Curd</option>
                  <option value="Farm Specials">Farm Specials</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-600">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={newProd.price}
                  onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-stone-600">Unit Description</label>
              <input
                type="text"
                required
                placeholder="e.g. 500ml Glass Pouch"
                value={newProd.unit}
                onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-stone-600">Description</label>
              <textarea
                rows={3}
                required
                placeholder="Write pure organic description..."
                value={newProd.description}
                onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#042B1B] text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-[#0B422B] shadow-md border border-[#DFB33F]/30 transition-transform active:scale-98"
            >
              Add Product to Farm Store
            </button>
          </form>
        </div>
      )}

      {/* PRINT DISPATCH MANIFEST MODAL & PREVIEW */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#FBF9F3] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#DFB33F]/40 my-8">
            
            {/* Modal Header */}
            <div className="bg-[#042B1B] text-white p-6 flex items-center justify-between border-b border-[#DFB33F]/30 print:hidden">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#DFB33F] bg-white shrink-0">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Srivari Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-bold">5 AM Dispatch Manifest Preview</h3>
                  <p className="text-xs text-emerald-200">Official Daily Delivery Roster Sheet for Delivery Boys</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#DFB33F] text-[#042B1B] text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center space-x-2 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Roster Now</span>
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Options Controls */}
            <div className="p-4 bg-amber-50/80 border-b border-[#DFB33F]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs print:hidden">
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <div className="space-y-1">
                  <label className="font-bold text-[#042B1B]">Dispatch Date:</label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="block px-3 py-1.5 bg-white rounded-lg border border-stone-300 font-medium text-[#042B1B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#042B1B]">Delivery Runner & Route:</label>
                  <input
                    type="text"
                    value={runnerName}
                    onChange={(e) => setRunnerName(e.target.value)}
                    className="block px-3 py-1.5 bg-white rounded-lg border border-stone-300 font-medium text-[#042B1B]"
                  />
                </div>
              </div>
            </div>

            {/* PRINTABLE DISPATCH SHEET DOCUMENT */}
            <div id="printable-dispatch-sheet" className="p-8 bg-white text-stone-900 space-y-6">
              
              <div className="border-b-2 border-[#042B1B] pb-4 flex flex-row items-start justify-between">
                <div className="flex items-center space-x-4">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Srivari Milk Farms Logo" className="w-16 h-16 object-cover rounded-full border border-amber-500" />
                  <div>
                    <h1 className="text-2xl font-bold text-[#042B1B] tracking-tight font-serif-display">
                      SRIVARI MILK FARMS
                    </h1>
                    <p className="text-xs font-semibold text-amber-800">
                      Pure from Our Farm • 100% A2 Cow & Buffalo Milk
                    </p>
                    <p className="text-[11px] text-stone-600 mt-1">
                      Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk, Anantapur Dist, AP - 515872
                    </p>
                    <p className="text-[11px] text-stone-600">
                      Helpline: +91 7022776637 / +91 7095663307 | FSSAI Lic: 11224333000189
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="inline-block px-3 py-1 bg-[#042B1B] text-white font-bold rounded uppercase tracking-wider mb-1">
                    5 AM Dispatch Roster
                  </div>
                  <p className="font-bold text-stone-800">Date: {dispatchDate}</p>
                  <p className="text-stone-600">Route: {runnerName}</p>
                  <p className="text-stone-500 font-mono text-[10px]">Manifest #: SRI-MAN-{dispatchDate.replace(/-/g,'')}-04</p>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-stone-100 rounded-xl border border-stone-300 text-center text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Total Drops</span>
                  <span className="font-bold text-base text-[#042B1B]">{distributionList.length} Customers</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Total Volume</span>
                  <span className="font-bold text-base text-[#042B1B]">1,420 Liters</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Glass Bottles to Collect</span>
                  <span className="font-bold text-base text-amber-800">8 Empty Bottles</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Dispatch Slot</span>
                  <span className="font-bold text-base text-[#042B1B]">5:00 AM - 6:30 AM</span>
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-stone-300">
                  <thead>
                    <tr className="bg-[#042B1B] text-white uppercase text-[10px] font-bold">
                      <th className="p-2 border border-stone-300 w-8 text-center">#</th>
                      <th className="p-2 border border-stone-300">Customer & Phone</th>
                      <th className="p-2 border border-stone-300 w-1/3">Delivery Address</th>
                      <th className="p-2 border border-stone-300">Product & Quantity</th>
                      <th className="p-2 border border-stone-300 text-center">Time Slot</th>
                      <th className="p-2 border border-stone-300 text-center w-24">Bottle Return [ ]</th>
                      <th className="p-2 border border-stone-300 text-center w-28">Status / Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-300 font-medium">
                    {distributionList.map((item, idx) => (
                      <tr key={item.id} className="odd:bg-white even:bg-stone-50/50">
                        <td className="p-2 border border-stone-300 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border border-stone-300">
                          <strong className="text-stone-900 block">{item.customerName}</strong>
                          <span className="text-[10px] text-stone-600">{item.phone}</span>
                        </td>
                        <td className="p-2 border border-stone-300 text-stone-800 text-[11px] leading-tight">
                          {item.address}
                        </td>
                        <td className="p-2 border border-stone-300 font-bold text-[#042B1B]">
                          {item.product} ({item.quantity})
                        </td>
                        <td className="p-2 border border-stone-300 text-center text-[10px] text-stone-700">
                          {item.deliverySlot}
                        </td>
                        <td className="p-2 border border-stone-300 text-center font-bold">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="w-4 h-4 border border-stone-400 inline-block rounded-sm"></span>
                            <span className="text-[10px]">{item.bottleReturnCount} Btl</span>
                          </div>
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          <span className="text-[10px] font-bold text-stone-500 uppercase border-b border-dotted border-stone-400 px-2 pb-0.5">
                            [ {item.status} ]
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
