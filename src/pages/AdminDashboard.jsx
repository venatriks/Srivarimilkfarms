import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Milk, Truck, Package, Plus, Edit, Check, Database,
  DollarSign, Users, AlertCircle, Search, Printer, Sparkles, CheckCircle, X, MapPin, Phone, Calendar,
  Download, Upload, RefreshCw, Trash2, UserPlus, Lock, Key, Activity, LogIn, ArrowLeft, MessageSquare, Briefcase, UserCheck, ShoppingBag, Eye, CreditCard, Tag, Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    user,
    authLoading,
    products, updateProductStockOrPrice, adjustProductInventory, addProduct, deleteProduct,
    distributionList, updateDistributionStatus, updateDeliveryAgent,
    dbUsers, addDbUser, updateDbUser, deleteDbUser,
    orders,
    subscriptions,
    contactQueries, updateContactQueryStatus, deleteContactQuery,
    employees, addEmployee, updateEmployee, deleteEmployee,
    oneTimeOrders, updateOneTimeOrderStatus, updateOneTimePaymentStatus,
    exportDatabaseBackup, importDatabaseBackup, resetDatabaseToDefaults,
    dbLogs, showToast, supabaseActive
  } = useApp();

  const [activeTab, setActiveTab] = useState('distribution'); // 'distribution' | 'users' | 'products' | 'queries' | 'employees' | 'onetime-orders' | 'database' | 'add'
  // Inventory Dashboard state
  const [inventorySummary, setInventorySummary] = useState([]);
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState('');

  // Track the latest inventory request to prevent stale responses.
  const inventoryRequestId = useRef(0);

  // Inventory Dashboard summary calculations
  const inventoryTotals = inventorySummary.reduce(
    (totals, product) => {
      totals.physical += Number(product.physical_stock || 0);
      totals.reserved += Number(product.reserved_stock || 0);
      totals.available += Number(product.available_stock || 0);

      if (product.low_stock) {
        totals.lowStock += 1;
      }

      return totals;
    },
    {
      physical: 0,
      reserved: 0,
      available: 0,
      lowStock: 0
    }
  );

  // Fetch inventory summary and movement history
  const fetchInventoryData = useCallback(async (productId = '') => {
    const requestId = ++inventoryRequestId.current;
    setInventoryLoading(true);
    setInventoryError('');

    try {
      const [summaryResult, movementsResult] = await Promise.all([
        supabase.rpc('admin_get_inventory_summary'),
        supabase.rpc('admin_get_inventory_movements_v2', {
          p_product_id: productId || null
        })
      ]);

      // Ignore responses from outdated inventory requests.
      if (requestId !== inventoryRequestId.current) {
        return;
      }

      if (summaryResult.error) {
        throw summaryResult.error;
      }

      if (movementsResult.error) {
        throw movementsResult.error;
      }

      setInventorySummary(summaryResult.data || []);
      setInventoryMovements(movementsResult.data || []);
    } catch (error) {
      // Ignore errors from outdated inventory requests.
      if (requestId !== inventoryRequestId.current) {
        return;
      }

      console.error('Inventory dashboard fetch failed:', error);

      setInventoryError(
        error.message || 'Unable to load inventory data.');

      setInventorySummary([]);
      setInventoryMovements([]);
    } finally {
      // Only the latest request can reset the loading indicator.
      if (requestId === inventoryRequestId.current) {
        setInventoryLoading(false);
      }
    }

  }, []);

  // Load inventory when the administrator opens the Inventory tab
  useEffect(() => {
    if (activeTab !== 'inventory' || authLoading || !user?.id) {
      return;
    }

    fetchInventoryData(selectedInventoryProduct);
  }, [
    activeTab,
    authLoading,
    user?.id,
    selectedInventoryProduct,
    fetchInventoryData
  ]);

  const [searchDist, setSearchDist] = useState('');
  const [updatingDeliveryAgentId, setUpdatingDeliveryAgentId] = useState(null);
  const [updatingDeliveryStatusId, setUpdatingDeliveryStatusId] = useState(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchQueries, setSearchQueries] = useState('');
  const [searchOneTimeOrders, setSearchOneTimeOrders] = useState('');
  const [oneTimeStatusFilter, setOneTimeStatusFilter] = useState('All');
  const [oneTimePaymentFilter, setOneTimePaymentFilter] = useState('All');
  const [selectedOneTimeOrderDetails, setSelectedOneTimeOrderDetails] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [dispatchDate, setDispatchDate] = useState(() => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()));


  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'customer',
    phone: '+91 ',
    address: '',
    walletBalance: 1500
  });

  // Employees State & Filters
  const [searchEmp, setSearchEmp] = useState('');
  const [empCategoryFilter, setEmpCategoryFilter] = useState('All'); // 'All' | 'Delivery Agent' | 'Internal Staff'
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [updatingEmployeeStatusId, setUpdatingEmployeeStatusId] = useState(null);

  const [newEmp, setNewEmp] = useState({
    name: '',
    phone: '+91 ',
    email: '',
    role: '',
    category: 'Delivery Agent',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    status: 'Active'
  });

  // Editing User State
  const [editingUserId, setEditingUserId] = useState(null);

  // Product quality parameter editing
  const [editingQualityProductId, setEditingQualityProductId] = useState(null);
  const [qualityDraft, setQualityDraft] = useState({});
  const [savingQuality, setSavingQuality] = useState(false);

  // Inventory adjustment state
  const [stockDrafts, setStockDrafts] = useState({});
  const [savingStockProductId, setSavingStockProductId] = useState(null);
  const [editingStockProductId, setEditingStockProductId] = useState(null);

  // Save an audited inventory adjustment
  const saveStockAdjustment = async (prod) => {
    if (savingStockProductId !== null) return;

    const draft = stockDrafts[prod.id];

    if (!draft) {
      showToast('No stock adjustment entered.', 'error');
      return;
    }

    const quantity = Number(draft.quantity);
    const reason = (draft.reason || '').trim();

    if (
      String(draft.quantity).trim() === '' ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0
    ) {
      showToast('Enter a valid non-negative whole number.', 'error');
      return;
    }

    if (!reason) {
      showToast('Enter a reason for the stock adjustment.', 'error');
      return;
    }

    if (quantity === prod.stockCount) {
      showToast('Stock quantity is unchanged.', 'error');
      return;
    }

    setSavingStockProductId(prod.id);

    try {
      const success = await adjustProductInventory(
        prod.id,
        quantity,
        reason
      );

      if (success) {
        setEditingStockProductId(null);
        setStockDrafts(prev => {
          const next = { ...prev };
          delete next[prod.id];
          return next;
        });
      }
    } catch (error) {
      console.error('Stock adjustment failed:', error);
      showToast('Unable to save stock adjustment.', 'error');
    } finally {
      setSavingStockProductId(null);
    }
  };

  // Add Product Form State
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'Raw Milk',
    price: 80,
    initialStock: '0',
    unit: '1 Liter Bottle',
    description: '',
    image: `${import.meta.env.BASE_URL}images/a2_milk.webp`,
    protein: '3.4 g',
    calcium: '125 mg',
    calories: '68 kcal'
  });

  // Authentication & Admin Authorization Check
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#042B1B]">
            Verifying administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-900 rounded-3xl mx-auto flex items-center justify-center border border-amber-300 shadow-xl">
          <Lock className="w-10 h-10 text-[#042B1B]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif-display text-3xl font-bold text-[#042B1B]">Administrator Login Required</h2>
          <p className="text-stone-600 max-w-md mx-auto text-sm font-medium">You must be authenticated as an authorized administrator to access the Srivari Database Control Portal.</p>
        </div>
        <button onClick={() => navigate('/login')} className="px-6 py-3.5 bg-[#042B1B] text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#0B422B] transition-all shadow-md border border-[#DFB33F]/30 inline-flex items-center space-x-2">
          <LogIn className="w-4 h-4 text-[#DFB33F]" /><span>Log In with Admin Credentials</span>
        </button>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-800 rounded-3xl mx-auto flex items-center justify-center border border-red-300 shadow-xl">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif-display text-3xl font-bold text-stone-900">Access Denied: Insufficient Privileges</h2>
          <p className="text-stone-600 max-w-md mx-auto text-sm">Your logged-in account (<strong>{user.email}</strong>) has customer status. Only authorized farm administrators can access database tools and management records.</p>
        </div>
        <button onClick={() => navigate('/')} className="px-6 py-3.5 bg-[#042B1B] text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#0B422B] transition-all shadow-md inline-flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4 text-[#DFB33F]" /><span>Return to Store Front</span>
        </button>
      </div>
    );
  }

  // Start editing a product's quality parameters
  const startQualityEdit = (prod) => {
    setEditingQualityProductId(prod.id);
    setQualityDraft({ ...(prod.labParameters || {}) });
  };

  // Update a field locally without saving to Supabase
  const changeQualityField = (field, value) => {
    setQualityDraft(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cancel unsaved changes
  const cancelQualityEdit = () => {
    setEditingQualityProductId(null);
    setQualityDraft({});
  };

  // Save quality parameters to Supabase
  const saveQualityParameters = async (prod) => {
    if (savingQuality) return;

    setSavingQuality(true);

    try {
      const updatedParameters = {
        ...(prod.labParameters || {}),
        ...qualityDraft
      };

      const success = await updateProductStockOrPrice(
        prod.id,
        { labParameters: updatedParameters }
      );

      if (success) {
        setEditingQualityProductId(null);
        setQualityDraft({});
      }
    } catch (error) {
      console.error("Quality parameter update failed:", error);
      showToast("Unable to save quality parameters.", "error");
    } finally {
      setSavingQuality(false);
    }
  };

  // Image Upload Handler for "Add New Product"
  const handleAddNewProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image file size should be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setNewProd(prev => ({ ...prev, image: dataUrl }));
        showToast("Product image uploaded successfully!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Image Upload Handler for Editing Existing Products in Catalog
  const handleCatalogImageUpload = (productId, e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image file size should be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        updateProductStockOrPrice(productId, { image: dataUrl });
        showToast("Product image updated & saved to database!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.description) {
      showToast("Please fill in all product details", "error");
      return;
    }
    const initialStock = Number(newProd.initialStock);

    if (
      String(newProd.initialStock).trim() === '' ||
      !Number.isSafeInteger(initialStock) ||
      initialStock < 0 ||
      initialStock > 2147483647
    ) {
      showToast(
        'Enter a valid non-negative whole number for initial stock.',
        'error'
      );
      return;
    }

    const productData = {
      initialStock,
      name: newProd.name,
      category: newProd.category,
      price: newProd.price,
      unit: newProd.unit,
      description: newProd.description,
      image: newProd.image,
      nutritionalInfo: {
        protein: newProd.protein || '3.4 g',
        calcium: newProd.calcium || '125 mg',
        calories: newProd.calories || '68 kcal',
        carbs: '4.8 g',
        fat: '4.6 g'
      }
    };
    const success = await addProduct(productData);

    if (!success) {
      return;
    }

    setActiveTab('products');
    setNewProd({
      name: '',
      category: 'Raw Milk',
      price: 80,
      initialStock: '0',
      unit: '1 Liter Bottle',
      description: '',
      image: `${import.meta.env.BASE_URL}images/a2_milk.webp`,
      protein: '3.4 g',
      calcium: '125 mg',
      calories: '68 kcal'
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

  const filteredQueries = (contactQueries || []).filter(q =>
    (q.name || '').toLowerCase().includes(searchQueries.toLowerCase()) ||
    (q.email || '').toLowerCase().includes(searchQueries.toLowerCase()) ||
    (q.subject || '').toLowerCase().includes(searchQueries.toLowerCase()) ||
    (q.message || '').toLowerCase().includes(searchQueries.toLowerCase())
  );

  const filteredEmployees = (employees || []).filter(e => {
    const matchesCategory = empCategoryFilter === 'All' || e.category === empCategoryFilter;
    const matchesSearch =
      (e.name || '').toLowerCase().includes(searchEmp.toLowerCase()) ||
      (e.phone || '').includes(searchEmp) ||
      (e.role || '').toLowerCase().includes(searchEmp.toLowerCase()) ||
      (e.address || '').toLowerCase().includes(searchEmp.toLowerCase()) ||
      (e.email || '').toLowerCase().includes(searchEmp.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredOneTimeOrders = (oneTimeOrders || []).filter(o => {
    const matchesStatus = oneTimeStatusFilter === 'All' || o.status === oneTimeStatusFilter;
    const matchesPayment = oneTimePaymentFilter === 'All' || o.paymentStatus === oneTimePaymentFilter;
    const itemsText = (o.items || []).map(i => i.name).join(' ');
    const matchesSearch =
      (o.id || '').toLowerCase().includes(searchOneTimeOrders.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchOneTimeOrders.toLowerCase()) ||
      (o.customerEmail || '').toLowerCase().includes(searchOneTimeOrders.toLowerCase()) ||
      (o.customerPhone || '').includes(searchOneTimeOrders) ||
      (o.address || '').toLowerCase().includes(searchOneTimeOrders.toLowerCase()) ||
      itemsText.toLowerCase().includes(searchOneTimeOrders.toLowerCase());
    return matchesStatus && matchesPayment && matchesSearch;
  });

  const deliveryAgentsCount = (employees || []).filter(e => e.category === 'Delivery Agent').length;
  const internalStaffCount = (employees || []).filter(e => e.category === 'Internal Staff').length;
  const totalPayroll = (employees || []).reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!newEmp.name.trim()) {
      showToast("Employee name is required", "error");
      return;
    }
    if (!newEmp.role.trim()) {
      showToast("Employee role is required", "error");
      return;
    }
    if (
      newEmp.salary === '' ||
      !Number.isFinite(Number(newEmp.salary)) ||
      Number(newEmp.salary) < 0
    ) {
      showToast("Enter a valid monthly salary", "error");
      return;
    }
    const success = await addEmployee(newEmp);
    if (!success) return;
    setNewEmp({
      name: '',
      phone: '+91 ',
      email: '',
      role: '',
      category: 'Delivery Agent',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: '',
      status: 'Active'
    });
    setShowAddEmpModal(false);
  };

  const handleEditEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmp || !editingEmp.id) return;

    if (
      typeof editingEmp.name !== 'string' ||
      !editingEmp.name.trim()
    ) {
      showToast('Employee name is required', 'error');
      return;
    }

    if (
      typeof editingEmp.role !== 'string' ||
      !editingEmp.role.trim()
    ) {
      showToast('Employee role is required', 'error');
      return;
    }

    if (
      editingEmp.salary === '' ||
      editingEmp.salary === null ||
      editingEmp.salary === undefined ||
      !Number.isFinite(Number(editingEmp.salary)) ||
      Number(editingEmp.salary) < 0
    ) {
      showToast('Enter a valid monthly salary', 'error');
      return;
    }

    const success = await updateEmployee(editingEmp.id, editingEmp);
    if (!success) return;

    setEditingEmp(null);
  };

  const handlePrint = () => {
    showToast("Opening Browser Print Dialog for 5:30 AM Delivery Roster...", "info");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Calculate real-time database stats dynamically
  const tomorrowDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const tomorrowDeliveries = distributionList.filter(item =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || '')) &&
    item.date === tomorrowDate &&
    String(item.status || '').toLowerCase() !== 'cancelled'
  );

  const totalDispatchLiters = tomorrowDeliveries.reduce((sum, item) => {
    const matches = String(item.quantity || '').matchAll(/(\d+(?:\.\d+)?)\s*Liters?\b/gi);
    return sum + Array.from(matches).reduce(
      (liters, match) => liters + Number(match[1]), 0
    );
  }, 0);

  const manifestDeliveries = distributionList.filter(item =>
    String(item.date || '').slice(0, 10) === dispatchDate &&
    String(item.status || '').toLowerCase() !== 'cancelled'
  );

  const manifestMilkLiters = manifestDeliveries.reduce((sum, item) => {
    const matches = String(item.quantity || '').matchAll(/(\d+(?:\.\d+)?)\s*Liters?\b/gi);
    return sum + Array.from(matches).reduce(
      (liters, match) => liters + Number(match[1]), 0
    );
  }, 0);

  const manifestBottlesReturned = manifestDeliveries.reduce(
    (sum, item) => sum + (Number(item.bottleReturnCount) || 0), 0
  );

  const totalPaidOrders = (oneTimeOrders || [])
    .filter(order => order.paymentStatus === 'Paid')
    .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

  const realTimeEmptyBottles = distributionList.reduce((acc, item) => acc + (Number(item.bottleReturnCount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">

      {/* Admin Header */}
      <div className="bg-[#042B1B] text-white p-5 sm:p-8 rounded-3xl border border-[#DFB33F]/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border inline-flex items-center space-x-1.5 ${supabaseActive
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
            : 'bg-[#DFB33F]/20 text-[#DFB33F] border-[#DFB33F]'
            }`}>
            <Database className="w-3.5 h-3.5 text-[#DFB33F]" />
            <span>{supabaseActive ? 'Supabase Live Database Connected' : 'Local Database Control Center'}</span>
          </span>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold">
            Srivari Milk Farms Control Portal
          </h1>
          <p className="text-xs text-emerald-200">
            Persistent Database Management System • Customer Accounts, Admins, Inventory & 5:30 AM Delivery Roster
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
            <div className="text-3xl font-bold font-serif-display text-[#042B1B] mt-1">
              {totalDispatchLiters.toLocaleString()} L
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">{tomorrowDeliveries.length} Scheduled Drops</span>
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
            <span className="text-xs text-stone-500 font-medium">Total Paid Orders</span>
            <div className="text-3xl font-bold font-serif-display text-[#042B1B] mt-1">
              ₹{totalPaidOrders.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Recorded Paid Orders • All Time</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#042B1B]/10 text-[#042B1B] flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#DFB33F]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#042B1B]/10 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Empty Bottles Returned</span>
            <div className="text-3xl font-bold font-serif-display text-[#042B1B] mt-1">
              {realTimeEmptyBottles.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Recorded Bottle Returns • All Time</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#042B1B]/10 text-[#042B1B] flex items-center justify-center">
            <Package className="w-6 h-6 text-[#DFB33F]" />
          </div>
        </div>

      </div>

      {/* Navigation Tabs Container - Responsive Layout with Zero Overflow */}
      <div className="bg-[#FBF9F3] p-2.5 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">

          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'distribution'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">5 AM Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'subscriptions'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Milk className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">Daily Subscriptions ({subscriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'users'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Users className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">Users ({dbUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'products'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Package className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">Products ({products.length})</span>
          </button>

          {/* Inventory Dashboard Tab */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'inventory'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Package className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('onetime-orders')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'onetime-orders'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">One-Time Orders ({oneTimeOrders ? oneTimeOrders.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('queries')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'queries'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">Queries ({contactQueries ? contactQueries.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'employees'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">Employees ({employees ? employees.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'database'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Database className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">DB Tools & Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-center shadow-xs border ${activeTab === 'add'
              ? 'bg-[#042B1B] text-white border-[#042B1B] shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/70'
              }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#DFB33F] shrink-0" />
            <span className="truncate">Add Product</span>
          </button>

        </div>
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

          <div className="overflow-x-auto touch-pan-x">
            <table className="min-w-[750px] w-full text-left text-xs">
              <thead>
                <tr className="bg-[#042B1B]/5 border-b border-stone-200 text-[#042B1B] uppercase font-bold tracking-wider">
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Order Items</th>
                  <th className="py-3.5 px-4">Slot</th>
                  <th className="py-3.5 px-4">Bottle Return</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
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
                      <select
                        value={item.assignedEmployeeId || ''}
                        onChange={async (e) => {
                          if (updatingDeliveryAgentId !== null) return;

                          const selectedId = e.currentTarget.value;

                          setUpdatingDeliveryAgentId(item.id);

                          try {
                            await updateDeliveryAgent(item.id, selectedId);
                          } catch (error) {
                            console.error('Delivery assignment failed:', error);
                            showToast('Unable to update delivery assignment.', 'error');
                          } finally {
                            setUpdatingDeliveryAgentId(null);
                          }
                        }}
                        disabled={updatingDeliveryAgentId !== null}
                        aria-label={`Assigned delivery agent for ${item.customerName}`}
                        className="px-2 py-1 bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-semibold text-[#042B1B] focus:outline-none"
                      >
                        <option value="">Not Assigned</option>
                        {(employees || [])
                          .filter(employee =>
                            employee.category === 'Delivery Agent' &&
                            (employee.status === 'Active' ||
                              employee.id === item.assignedEmployeeId)
                          )
                          .map(employee => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} ({employee.role}){employee.status !== 'Active' ? ` — ${employee.status || 'Status Unknown'}` : ''}
                            </option>
                          ))}
                        {item.assignedEmployeeId &&
                          !(employees || []).some(employee =>
                            employee.id === item.assignedEmployeeId
                          ) && (
                            <option value={item.assignedEmployeeId}>
                              Assigned employee unavailable
                            </option>
                          )}
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Delivered'
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
                        onChange={async (e) => {
                          if (updatingDeliveryStatusId !== null) return;

                          const selectedStatus = e.currentTarget.value;

                          setUpdatingDeliveryStatusId(item.id);

                          try {
                            await updateDistributionStatus(item.id, selectedStatus);
                          } catch (error) {
                            console.error('Delivery status update failed:', error);
                            showToast('Unable to update delivery status.', 'error');
                          } finally {
                            setUpdatingDeliveryStatusId(null);
                          }
                        }}
                        disabled={updatingDeliveryStatusId !== null}
                        aria-label={`Delivery status for ${item.customerName}`}
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

      {/* DAILY MILK SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#042B1B]">Daily Milk Subscriptions</h3>
              <p className="text-xs text-stone-500 mt-1">Live subscriptions loaded from Supabase • customer and product details are joined from their related tables.</p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
              {subscriptions.length} Total Subscription{subscriptions.length === 1 ? '' : 's'}
            </div>
          </div>

          {subscriptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center">
              <Milk className="w-10 h-10 mx-auto text-stone-300 mb-3" />
              <p className="font-semibold text-stone-700">No milk subscriptions found.</p>
              <p className="text-xs text-stone-500 mt-1">New customer subscriptions will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto touch-pan-x rounded-2xl border border-stone-200">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-[#042B1B] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Customer</th>
                    <th className="px-4 py-3 text-left font-bold">Product</th>
                    <th className="px-4 py-3 text-left font-bold">Qty</th>
                    <th className="px-4 py-3 text-left font-bold">Frequency</th>
                    <th className="px-4 py-3 text-left font-bold">Delivery</th>
                    <th className="px-4 py-3 text-left font-bold">Start Date</th>
                    <th className="px-4 py-3 text-left font-bold">₹/Day</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {subscriptions
                    .filter(subscription => {
                      const frequency = String(subscription.frequency || '').toLowerCase();
                      return frequency === 'daily' || frequency === 'daily morning';
                    })
                    .map(subscription => (
                      <tr key={subscription.id} className="hover:bg-stone-50">
                        <td className="px-4 py-4 align-top">
                          <div className="font-bold text-[#042B1B]">{subscription.customerName || 'Customer'}</div>
                          <div className="text-xs text-stone-500">{subscription.customerEmail || '—'}</div>
                          {subscription.customerPhone && <div className="text-xs text-stone-500">{subscription.customerPhone}</div>}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-semibold text-stone-800">{subscription.productName || 'Milk Product'}</div>
                          <div className="text-xs text-stone-500">{subscription.productId}</div>
                        </td>
                        <td className="px-4 py-4 align-top font-semibold">{subscription.quantity} {subscription.unit || 'Liter'}</td>
                        <td className="px-4 py-4 align-top">{subscription.frequencyLabel || (String(subscription.frequency).toLowerCase() === 'daily' ? 'Daily Morning' : subscription.frequency || '—')}</td>
                        <td className="px-4 py-4 align-top">{subscription.deliverySlot || '—'}</td>
                        <td className="px-4 py-4 align-top">{subscription.startDate || '—'}</td>
                        <td className="px-4 py-4 align-top font-bold text-[#042B1B]">₹{Number(subscription.pricePerDay || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${subscription.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {subscription.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
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

              <div className="overflow-x-auto touch-pan-x">
                <table className="min-w-[750px] w-full text-left text-xs">
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
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
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
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete user account "${u.name}" (${u.email}) from the database?`)) {
                                deleteDbUser(u.id);
                              }
                            }}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif-display text-xl font-bold text-[#042B1B]">
                Product Catalog & Inventory Control DB ({products.length} Items)
              </h3>
              <p className="text-xs text-stone-500">Live prices, inventory stock counts, and nutrition metrics synced with Supabase</p>
            </div>
            <button
              onClick={() => setActiveTab('add')}
              className="px-4 py-2 bg-[#042B1B] text-white text-xs font-bold rounded-xl hover:bg-[#0B422B] flex items-center space-x-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#DFB33F]" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-[#FBF9F3] p-6 rounded-2xl border border-stone-200 space-y-4 flex flex-col justify-between"
              >
                <div className="flex space-x-4">
                  <div className="relative group/img overflow-hidden rounded-2xl border border-stone-300 shrink-0 w-24 h-24 bg-stone-100 shadow-sm">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                    />
                    <label
                      htmlFor={`prod-img-upload-${prod.id}`}
                      className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer p-1 text-center backdrop-blur-xs"
                      title="Click to Upload & Update Product Image"
                    >
                      <Upload className="w-5 h-5 text-[#DFB33F] mb-1" />
                      <span className="text-[9px] font-bold uppercase leading-tight text-amber-200">Change Image</span>
                      <input
                        id={`prod-img-upload-${prod.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCatalogImageUpload(prod.id, e)}
                      />
                    </label>
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#DFB33F]">{prod.category}</span>
                      <label
                        htmlFor={`prod-img-upload-${prod.id}`}
                        className="text-[10px] font-bold text-[#042B1B] hover:text-[#0B422B] cursor-pointer flex items-center space-x-1 border border-stone-300 rounded-lg px-2 py-0.5 bg-white shadow-xs"
                      >
                        <Upload className="w-3 h-3 text-[#DFB33F]" />
                        <span>Upload Image</span>
                      </label>
                    </div>
                    <h4 className="font-bold text-base text-[#042B1B]">{prod.name}</h4>
                    <p className="text-xs text-stone-500">{prod.unit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3 pt-3 border-t border-stone-200 text-xs">
                  <div>
                    <label className="text-stone-500 block font-medium">Price (₹)</label>
                    <input
                      type="number"
                      value={prod.price}
                      onChange={(e) => updateProductStockOrPrice(prod.id, { price: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-[#042B1B]"
                    />
                  </div>

                  <div>
                    <label className="text-stone-500 block font-medium">
                      Physical Stock
                    </label>
                    <p className="font-bold text-[#042B1B] py-1.5">
                      {prod.stockCount} units
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStockProductId(prod.id);
                        setStockDrafts(prev => ({
                          ...prev,
                          [prod.id]: {
                            quantity: String(prod.stockCount),
                            reason: ''
                          }
                        }));
                      }}
                      className="text-xs font-bold text-[#0B422B] underline"
                    >
                      Edit Stock
                    </button>
                  </div>

                  {editingStockProductId === prod.id && (
                    <div className="col-span-full space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                      <label className="block text-xs font-bold">
                        New Physical Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={stockDrafts[prod.id]?.quantity ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStockDrafts(prev => ({
                            ...prev,
                            [prod.id]: {
                              ...prev[prod.id],
                              quantity: value
                            }
                          }));
                        }}
                        className="w-full rounded-lg border border-stone-300 p-2"
                      />

                      <label className="block text-xs font-bold">
                        Reason for Adjustment
                      </label>
                      <textarea
                        value={stockDrafts[prod.id]?.reason ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStockDrafts(prev => ({
                            ...prev,
                            [prod.id]: {
                              ...prev[prod.id],
                              reason: value
                            }
                          }));
                        }}
                        placeholder="Example: Physical stock count correction"
                        className="w-full rounded-lg border border-stone-300 p-2"
                        rows={2}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={savingStockProductId !== null}
                          onClick={() => saveStockAdjustment(prod)}
                          className="rounded-lg bg-[#042B1B] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {savingStockProductId === prod.id
                            ? 'Saving...'
                            : 'Save Adjustment'}
                        </button>

                        <button
                          type="button"
                          disabled={savingStockProductId !== null}
                          onClick={() => {
                            setEditingStockProductId(null);
                            setStockDrafts(prev => {
                              const next = { ...prev };
                              delete next[prod.id];
                              return next;
                            });
                          }}
                          className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-stone-500 block font-medium">Protein</label>
                    <input
                      type="text"
                      value={prod.nutritionalInfo?.protein || '3.4 g'}
                      onChange={(e) => updateProductStockOrPrice(prod.id, {
                        nutritionalInfo: {
                          ...prod.nutritionalInfo,
                          protein: e.target.value
                        }
                      })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-[#042B1B]"
                    />
                  </div>

                  <div>
                    <label className="text-stone-500 block font-medium">Calcium</label>
                    <input
                      type="text"
                      value={prod.nutritionalInfo?.calcium || '125 mg'}
                      onChange={(e) => updateProductStockOrPrice(prod.id, {
                        nutritionalInfo: {
                          ...prod.nutritionalInfo,
                          calcium: e.target.value
                        }
                      })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-[#042B1B]"
                    />
                  </div>

                  <div>
                    <label className="text-stone-500 block font-medium">Energy</label>
                    <input
                      type="text"
                      value={prod.nutritionalInfo?.calories || '68 kcal'}
                      onChange={(e) => updateProductStockOrPrice(prod.id, {
                        nutritionalInfo: {
                          ...prod.nutritionalInfo,
                          calories: e.target.value
                        }
                      })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 font-bold text-[#042B1B]"
                    />
                  </div>
                </div>

                {/* Product Quality Parameters Editor */}
                <div className="mt-3 rounded-2xl border border-stone-200 bg-[#FDFBF7] p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h5 className="text-sm font-bold text-[#042B1B]">
                      Product Quality Parameters
                    </h5>
                    {editingQualityProductId !== prod.id && (
                      <button
                        type="button"
                        onClick={() => startQualityEdit(prod)}
                        className="px-3 py-1.5 rounded-lg bg-[#042B1B] text-white text-xs font-bold"
                      >
                        Edit Parameters
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {[
                      ['fatPercentage', 'Fat (%)'],
                      ['snfPercentage', 'SNF (%)'],
                      ['a2CaseinPurity', 'A2 Purity'],
                      ['addedWater', 'Added Water'],
                      ['antibiotics', 'Antibiotics'],
                      ['preservatives', 'Preservatives'],
                      ['somaticCellCount', 'Somatic Cell Count'],
                      ['chillingTemperature', 'Chilling Temperature']
                    ].map(([field, label]) => (
                      <div key={field} className="min-w-0">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={
                            editingQualityProductId === prod.id
                              ? (qualityDraft[field] ?? '')
                              : (prod.labParameters?.[field] ?? '')
                          }
                          disabled={editingQualityProductId !== prod.id || savingQuality}
                          onChange={(e) => changeQualityField(field, e.target.value)}
                          placeholder="Not Available"
                          className="w-full min-w-0 px-2.5 py-2 rounded-lg border border-stone-300 bg-white text-xs text-[#042B1B] disabled:bg-stone-100"
                        />
                      </div>
                    ))}
                  </div>

                  {editingQualityProductId === prod.id && (
                    <div className="flex flex-wrap justify-end gap-2 mt-4">
                      <button
                        type="button"
                        disabled={savingQuality}
                        onClick={cancelQualityEdit}
                        className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-bold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingQuality}
                        onClick={() => saveQualityParameters(prod)}
                        className="px-4 py-2 rounded-lg bg-[#042B1B] text-white text-xs font-bold disabled:opacity-50"
                      >
                        {savingQuality ? 'Saving...' : 'Save Quality Parameters'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    onClick={() => updateProductStockOrPrice(prod.id, { inStock: !prod.inStock })}
                    className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase ${prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {prod.inStock ? 'In Stock' : 'Out of Stock'}
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete product "${prod.name}" from the database?`)) {
                        deleteProduct(prod.id);
                      }
                    }}
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                    title="Delete Product from Database"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVENTORY DASHBOARD */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-4 sm:p-6 space-y-6">

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#042B1B]">
                Inventory Dashboard
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Product prices, physical stock, reservations and availability.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchInventoryData(selectedInventoryProduct)}
              disabled={inventoryLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#042B1B] text-white text-xs font-bold disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {inventoryLoading ? 'Loading...' : 'Refresh Inventory'}
            </button>
          </div>

          {/* Inventory Summary Cards */}
          {!inventoryLoading && !inventoryError && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: 'Physical Stock',
                  value: inventoryTotals.physical,
                  color: 'text-[#042B1B]'
                },
                {
                  label: 'Reserved Stock',
                  value: inventoryTotals.reserved,
                  color: 'text-amber-700'
                },
                {
                  label: 'Available Stock',
                  value: inventoryTotals.available,
                  color: 'text-emerald-700'
                },
                {
                  label: 'Low Stock Products',
                  value: inventoryTotals.lowStock,
                  color: inventoryTotals.lowStock > 0
                    ? 'text-red-600'
                    : 'text-emerald-700'
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#FBF9F3] border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold text-stone-500">
                    {item.label}
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold mt-2 ${item.color}`}>
                    {item.value.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Low Stock Alerts */}
          {!inventoryLoading && !inventoryError && (
            <div className="rounded-2xl border border-stone-200 bg-[#FBF9F3] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="text-base font-bold text-[#042B1B]">
                  Low Stock Alerts
                </h4>
              </div>

              {inventoryTotals.lowStock === 0 ? (
                <p className="text-sm text-emerald-700 font-semibold">
                  No low-stock alerts. All products have at least 10 available units.
                </p>
              ) : (
                <div className="space-y-2">
                  {inventorySummary
                    .filter((product) => product.low_stock)
                    .map((product) => (
                      <div
                        key={product.product_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3"
                      >
                        <span className="text-sm font-semibold text-[#042B1B]">
                          {product.product_name}
                        </span>

                        <span className="text-xs font-bold text-red-700">
                          {product.available_stock} units available
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Detailed Product Inventory Table */}
          {!inventoryLoading && !inventoryError && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-[#042B1B]">
                Product Stock Details
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="bg-[#042B1B] text-white">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Physical</th>
                      <th className="px-4 py-3">Reserved</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventorySummary.map((product) => (
                      <tr
                        key={product.product_id}
                        className="border-t border-stone-200 hover:bg-[#FBF9F3]"
                      >
                        <td className="px-4 py-3 font-semibold text-[#042B1B]">
                          {product.product_name}
                        </td>

                        <td className="px-4 py-3">
                          ₹{Number(product.product_price || 0).toLocaleString('en-IN')}
                          {product.product_unit ? ` / ${product.product_unit}` : ''}
                        </td>

                        <td className="px-4 py-3">
                          {product.physical_stock}
                        </td>

                        <td className="px-4 py-3 text-amber-700">
                          {product.reserved_stock}
                        </td>

                        <td className="px-4 py-3 font-bold text-emerald-700">
                          {product.available_stock}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 font-bold ${!product.is_available
                              ? 'bg-stone-200 text-stone-700'
                              : product.low_stock
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                              }`}
                          >
                            {!product.is_available
                              ? 'Out of Stock'
                              : product.low_stock
                                ? 'Low Stock'
                                : 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {inventorySummary.length === 0 && (
                <p className="text-sm text-stone-500">
                  No inventory products found.
                </p>
              )}
            </div>
          )}

          {/* Inventory Movement History */}
          {!inventoryLoading && !inventoryError && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-[#042B1B]">
                  Inventory Movement History
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Latest 100 recorded stock movements and adjustments.
                </p>
              </div>

              {/* Filter inventory history by product */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label
                  htmlFor="inventory-product-filter"
                  className="text-xs font-bold text-stone-600"
                >
                  Filter by Product
                </label>

                <select
                  id="inventory-product-filter"
                  value={selectedInventoryProduct}
                  onChange={(e) => setSelectedInventoryProduct(e.target.value)}
                  className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-[#042B1B] focus:outline-none focus:ring-2 focus:ring-[#DFB33F]"
                >
                  <option value="">All Products</option>

                  {inventorySummary.map((product) => (
                    <option
                      key={product.product_id}
                      value={product.product_id}
                    >
                      {product.product_name}
                    </option>
                  ))}
                </select>
              </div>

              {inventoryMovements.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-[#FBF9F3] p-6 text-center">
                  <p className="text-sm font-semibold text-stone-600">
                    No inventory movements recorded.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-stone-200">
                  <table className="w-full min-w-[1100px] text-left text-xs">
                    <thead className="bg-[#042B1B] text-white">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Movement</th>
                        <th className="px-4 py-3">Change</th>
                        <th className="px-4 py-3">Before</th>
                        <th className="px-4 py-3">After</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Administrator</th>
                      </tr>
                    </thead>

                    <tbody>
                      {inventoryMovements.map((movement) => (
                        <tr
                          key={movement.movement_id}
                          className="border-t border-stone-200 hover:bg-[#FBF9F3]"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(movement.created_at).toLocaleString('en-IN')}
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            {movement.product_name || movement.product_id}
                          </td>

                          <td className="px-4 py-3">
                            {movement.movement_type}
                          </td>

                          <td className={`px-4 py-3 font-bold ${movement.quantity_change > 0
                            ? 'text-emerald-700'
                            : 'text-red-600'
                            }`}>
                            {movement.quantity_change > 0 ? '+' : ''}
                            {movement.quantity_change}
                          </td>

                          <td className="px-4 py-3">
                            {movement.stock_before}
                          </td>

                          <td className="px-4 py-3">
                            {movement.stock_after}
                          </td>

                          <td className="px-4 py-3">
                            {movement.source_id}
                          </td>

                          <td className="px-4 py-3">
                            {movement.notes || '—'}
                          </td>

                          <td className="px-4 py-3">
                            {movement.actor_name?.trim()
                              || (movement.actor_id
                                ? movement.actor_id
                                : 'Unknown')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {inventoryError && (
            <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {inventoryError}
            </div>
          )}

          {inventoryLoading && (
            <p role="status" className="text-sm text-stone-500">
              Loading inventory information...
            </p>
          )}

        </div>
      )}

      {/* TAB 4: CONTACT QUERIES DATABASE */}
      {activeTab === 'queries' && (
        <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif-display text-xl font-bold text-[#042B1B]">
                Customer Contact Queries DB ({contactQueries.length} Active)
              </h3>
              <p className="text-xs text-stone-500">Live inquiries submitted through the website contact form. Queries marked as "Completed" are automatically removed from the active database.</p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, subject..."
                  value={searchQueries}
                  onChange={(e) => setSearchQueries(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {filteredQueries.length === 0 ? (
            <div className="text-center py-16 bg-[#FBF9F3] rounded-2xl border border-stone-200 space-y-2">
              <MessageSquare className="w-10 h-10 text-[#DFB33F] mx-auto" />
              <h4 className="font-bold text-base text-[#042B1B]">No Active Customer Queries</h4>
              <p className="text-xs text-stone-500">All customer inquiries have been marked as Completed or no search matches found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto touch-pan-x">
              <table className="min-w-[700px] w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#042B1B]/5 border-b border-stone-200 text-[#042B1B] uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-4">Subject & Date</th>
                    <th className="py-3.5 px-4">Message</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredQueries.map((q) => (
                    <tr key={q.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-[#042B1B]">
                        {q.name}
                        <span className="text-[10px] text-stone-500 block font-normal">{q.email}</span>
                        <span className="text-[10px] text-stone-400 block font-normal">{q.phone || 'No phone provided'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#042B1B] block">{q.subject}</span>
                        <span className="text-[10px] text-stone-400">{new Date(q.created_at || Date.now()).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 px-4 text-stone-700 max-w-sm whitespace-pre-line leading-relaxed bg-stone-50/50 rounded-xl p-3 border border-stone-100">
                        {q.message}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={q.status || 'Pending'}
                          onChange={(e) => updateContactQueryStatus(q.id, e.target.value)}
                          className={`px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none shadow-xs ${q.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-stone-100 text-stone-800 border-stone-300'
                            }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed (Auto-Remove)</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete query from "${q.name}"?`)) {
                              deleteContactQuery(q.id);
                            }
                          }}
                          className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                          title="Delete Query Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EMPLOYEES & STAFF MANAGEMENT DATABASE */}
      {activeTab === 'employees' && (
        <div className="space-y-6">

          {/* Header & Add Employee Action */}
          <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif-display text-2xl font-bold text-[#042B1B]">
                    Employees & Staff Management DB
                  </h3>
                  <span className="px-2.5 py-0.5 bg-[#DFB33F]/20 text-[#042B1B] rounded-full text-[10px] font-bold border border-[#DFB33F]/40">
                    Live Database Sync
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Manage delivery runners, logistics agents, quality inspectors, and internal dairy farm staff.
                </p>
              </div>

              <button
                onClick={() => setShowAddEmpModal(true)}
                className="px-5 py-3 bg-[#042B1B] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#0B422B] transition-all flex items-center space-x-2 shadow-lg border border-[#DFB33F]/30 shrink-0"
              >
                <UserPlus className="w-4 h-4 text-[#DFB33F]" />
                <span>Add New Employee</span>
              </button>
            </div>

            {/* Overview KPI Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-stone-100">
              <div className="bg-[#FBF9F3] p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Staff Members</span>
                  <span className="text-xl font-bold font-serif-display text-[#042B1B]">{employees ? employees.length : 0}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#042B1B]/10 text-[#042B1B] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#DFB33F]" />
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-900 font-bold uppercase block">Delivery Agents</span>
                  <span className="text-xl font-bold font-serif-display text-blue-950">{deliveryAgentsCount} Agents</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-900 font-bold uppercase block">Internal Workers</span>
                  <span className="text-xl font-bold font-serif-display text-amber-950">{internalStaffCount} Workers</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-900 font-bold uppercase block">Monthly Payroll</span>
                  <span className="text-xl font-bold font-serif-display text-emerald-950">₹{totalPayroll.toLocaleString()}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Sub-Category Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-1">
                <button
                  onClick={() => setEmpCategoryFilter('All')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${empCategoryFilter === 'All'
                    ? 'bg-[#042B1B] text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                >
                  All Staff ({employees ? employees.length : 0})
                </button>

                <button
                  onClick={() => setEmpCategoryFilter('Delivery Agent')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${empCategoryFilter === 'Delivery Agent'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Delivery Agents ({deliveryAgentsCount})</span>
                </button>

                <button
                  onClick={() => setEmpCategoryFilter('Internal Staff')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${empCategoryFilter === 'Internal Staff'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                    }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Internal Staff ({internalStaffCount})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, role, address..."
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#042B1B] focus:outline-none focus:border-[#042B1B]"
                />
              </div>
            </div>

            {/* Employee Records Table */}
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-16 bg-[#FBF9F3] rounded-2xl border border-stone-200 space-y-2">
                <Users className="w-10 h-10 text-[#DFB33F] mx-auto" />
                <h4 className="font-bold text-base text-[#042B1B]">No Employee Records Found</h4>
                <p className="text-xs text-stone-500">No staff members match the selected category filter or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto touch-pan-x">
                <table className="min-w-[750px] w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#042B1B]/5 border-b border-stone-200 text-[#042B1B] uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-4">Employee Details</th>
                      <th className="py-3.5 px-4">Category & Role</th>
                      <th className="py-3.5 px-4">Contact & Address</th>
                      <th className="py-3.5 px-4">Joining Date</th>
                      <th className="py-3.5 px-4">Salary (₹/mo)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#042B1B]">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center shrink-0 ${emp.category === 'Delivery Agent'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}>
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-[#042B1B]">{emp.name}</span>
                              <span className="text-[10px] text-stone-500 block font-normal">{emp.email || 'No email registered'}</span>
                              <span className="text-[9px] text-stone-400 font-mono">ID: {emp.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide inline-flex items-center space-x-1 border mb-1 ${emp.category === 'Delivery Agent'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}>
                            {emp.category === 'Delivery Agent' ? <Truck className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                            <span>{emp.category}</span>
                          </span>
                          <span className="text-xs font-bold text-[#042B1B] block">{emp.role}</span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-[#042B1B] flex items-center space-x-1 text-xs">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{emp.phone}</span>
                          </span>
                          <span className="text-[10px] text-stone-500 flex items-start space-x-1 mt-0.5 max-w-xs leading-tight">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                            <span>{emp.address || 'Farm HQ'}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 text-stone-700">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>{emp.joiningDate || '2025-01-01'}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 font-bold text-[#042B1B]">
                          ₹{Number(emp.salary || 0).toLocaleString()}
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={emp.status || 'Active'}
                            onChange={async (e) => {
                              if (updatingEmployeeStatusId !== null) return;

                              const newStatus = e.target.value;
                              setUpdatingEmployeeStatusId(emp.id);

                              try {
                                await updateEmployee(emp.id, { status: newStatus });
                              } finally {
                                setUpdatingEmployeeStatusId(null);
                              }
                            }}
                            disabled={updatingEmployeeStatusId !== null}
                            className={`px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none shadow-xs ${emp.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingEmp({ ...emp })}
                              className="p-2 text-stone-400 hover:text-[#042B1B] transition-colors bg-stone-100 hover:bg-stone-200 rounded-xl"
                              title="Edit Employee Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to remove employee "${emp.name}" from the database?`)) {
                                  await deleteEmployee(emp.id);
                                }
                              }}
                              className="p-2 text-stone-400 hover:text-red-600 transition-colors bg-stone-100 hover:bg-red-50 rounded-xl"
                              title="Delete Employee Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DATABASE TOOLS, BACKUP & AUDIT LOGS */}
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
            {/* Product Image Upload Section */}
            <div className="space-y-2 bg-[#FBF9F3] p-4 rounded-2xl border border-stone-200">
              <label className="font-bold text-stone-700 block text-xs">Product Image Upload</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-stone-300 bg-white flex items-center justify-center shrink-0 shadow-sm relative group">
                  {newProd.image ? (
                    <img src={newProd.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-stone-400" />
                  )}
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-4 py-2.5 bg-[#042B1B] text-white font-bold rounded-xl text-xs hover:bg-[#0B422B] transition-all cursor-pointer inline-flex items-center space-x-2 shadow-sm border border-[#DFB33F]/30">
                      <Upload className="w-4 h-4 text-[#DFB33F]" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddNewProductImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-stone-400 font-semibold">OR</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste external image URL (https://...)"
                    value={newProd.image.startsWith('data:') ? '' : newProd.image}
                    onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500">Selected image will be uploaded directly and saved to the database.</p>
                </div>
              </div>
            </div>

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
              <label className="font-medium text-stone-600">
                Initial Physical Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={newProd.initialStock}
                onChange={(e) =>
                  setNewProd({
                    ...newProd,
                    initialStock: e.target.value
                  })
                }
                className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
              />
              <p className="text-[10px] text-stone-500">
                Opening stock will be recorded in the inventory movement ledger.
              </p>
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

            {/* Nutritional Info Fields */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-stone-600">Protein</label>
                <input
                  type="text"
                  placeholder="e.g. 3.4 g"
                  value={newProd.protein}
                  onChange={(e) => setNewProd({ ...newProd, protein: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-600">Calcium</label>
                <input
                  type="text"
                  placeholder="e.g. 125 mg"
                  value={newProd.calcium}
                  onChange={(e) => setNewProd({ ...newProd, calcium: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-600">Energy (Calories)</label>
                <input
                  type="text"
                  placeholder="e.g. 68 kcal"
                  value={newProd.calories}
                  onChange={(e) => setNewProd({ ...newProd, calories: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#FBF9F3] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#DFB33F]/40 my-auto max-h-[94vh] flex flex-col">

            {/* Modal Header */}
            <div className="bg-[#042B1B] text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#DFB33F]/30 print:hidden shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#DFB33F] bg-white shrink-0">
                  <img src={`${import.meta.env.BASE_URL}images/logo_Main.webp`} alt="Srivari Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-bold">5:30 AM Dispatch Manifest Preview</h3>
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

              </div>
            </div>

            {/* PRINTABLE DISPATCH SHEET DOCUMENT */}
            <div id="printable-dispatch-sheet" className="p-8 bg-white text-stone-900 space-y-6">

              <div className="border-b-2 border-[#042B1B] pb-4 flex flex-row items-start justify-between">
                <div className="flex items-center space-x-4">
                  <img src={`${import.meta.env.BASE_URL}images/logo_Main.webp`} alt="Srivari Milk Farms Logo" className="w-16 h-16 object-cover rounded-full border border-amber-500" />
                  <div>
                    <h1 className="text-2xl font-bold text-[#042B1B] tracking-tight font-serif-display">
                      SRIVARI MILK FARMS
                    </h1>
                    <p className="text-xs font-semibold text-amber-800">
                      Fresh A2 Cow Milk & Buffalo Milk
                    </p>
                    <p className="text-[11px] text-stone-600 mt-1">
                      Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk, Anantapur Dist, AP - 515872
                    </p>
                    <p className="text-[11px] text-stone-600">
                      Helpline: +91 7676160673
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="inline-block px-3 py-1 bg-[#042B1B] text-white font-bold rounded uppercase tracking-wider mb-1">
                    5:30 AM Delivery Roster
                  </div>
                  <p className="font-bold text-stone-800">Date: {dispatchDate}</p>
                  <p className="text-stone-600">Agent Assignment: Per Delivery</p>
                  <p className="text-stone-500 font-mono text-[10px]">Manifest #: SRI-MAN-{dispatchDate.replace(/-/g, '')}</p>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-stone-100 rounded-xl border border-stone-300 text-center text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Total Drops</span>
                  <span className="font-bold text-base text-[#042B1B]">{manifestDeliveries.length} Drops</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Total Volume</span>
                  <span className="font-bold text-base text-[#042B1B]">{manifestMilkLiters.toLocaleString()} Liters</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Bottles Already Returned</span>
                  <span className="font-bold text-base text-amber-800">{manifestBottlesReturned.toLocaleString()} Empty Bottles</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Default Delivery Window</span>
                  <span className="font-bold text-base text-[#042B1B]">5:30 AM - 6:30 AM</span>
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto touch-pan-x">
                <table className="min-w-[650px] w-full text-left text-xs border-collapse border border-stone-300">
                  <thead>
                    <tr className="bg-[#042B1B] text-white uppercase text-[10px] font-bold">
                      <th className="p-2 border border-stone-300 w-8 text-center">#</th>
                      <th className="p-2 border border-stone-300">Customer & Phone</th>
                      <th className="p-2 border border-stone-300 w-1/3">Delivery Address</th>
                      <th className="p-2 border border-stone-300">Product & Quantity</th>
                      <th className="p-2 border border-stone-300 text-center">Time Slot</th>
                      <th className="p-2 border border-stone-300">Assigned Agent</th>
                      <th className="p-2 border border-stone-300 text-center w-24">Bottle Return [ ]</th>
                      <th className="p-2 border border-stone-300 text-center w-28">Status / Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-300 font-medium">
                    {manifestDeliveries.map((item, idx) => (
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
                        <td className="p-2 border border-stone-300 text-[10px] text-stone-800">
                          {item.assignedEmployeeId
                            ? employees.find(
                                employee => employee.id === item.assignedEmployeeId
                              )?.name || 'Employee Unavailable'
                            : 'Not Assigned'}
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

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200 space-y-4 sm:space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="font-serif-display text-xl font-bold text-[#042B1B] flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-[#DFB33F]" />
                  <span>Add New Employee</span>
                </h3>
                <p className="text-xs text-stone-500">Add delivery agent or internal worker to database</p>
              </div>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gowda"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none focus:border-[#042B1B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Category *</label>
                  <select
                    value={newEmp.category}
                    onChange={(e) => setNewEmp({ ...newEmp, category: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  >
                    <option value="Delivery Agent">Delivery Agent</option>
                    <option value="Internal Staff">Internal Staff</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delivery Agent (Route #4)"
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="emp@srivarimilkfarms.com"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Joining Date</label>
                  <input
                    type="date"
                    value={newEmp.joiningDate}
                    onChange={(e) => setNewEmp({ ...newEmp, joiningDate: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={newEmp.salary}
                    onChange={(e) => setNewEmp({ ...newEmp, salary: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street, Village / Area, Anantapur Dist"
                  value={newEmp.address}
                  onChange={(e) => setNewEmp({ ...newEmp, address: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#042B1B] text-white font-bold rounded-xl text-xs hover:bg-[#0B422B] shadow-md flex items-center space-x-2"
                >
                  <Check className="w-4 h-4 text-[#DFB33F]" />
                  <span>Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200 space-y-4 sm:space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="font-serif-display text-xl font-bold text-[#042B1B] flex items-center space-x-2">
                  <Edit className="w-5 h-5 text-[#DFB33F]" />
                  <span>Edit Employee Record</span>
                </h3>
                <p className="text-xs text-stone-500">Modify details for ID: {editingEmp.id}</p>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEmployeeSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingEmp.name}
                  onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Category</label>
                  <select
                    value={editingEmp.category}
                    onChange={(e) => setEditingEmp({ ...editingEmp, category: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  >
                    <option value="Delivery Agent">Delivery Agent</option>
                    <option value="Internal Staff">Internal Staff</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.phone}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Role / Designation</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.role}
                    onChange={(e) => setEditingEmp({ ...editingEmp, role: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    value={editingEmp.email || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Joining Date</label>
                  <input
                    type="date"
                    value={editingEmp.joiningDate || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, joiningDate: e.target.value })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={editingEmp.salary ?? ''}
                    onChange={(e) => setEditingEmp({
                      ...editingEmp,
                      salary: e.target.value === '' ? '' : Number(e.target.value)
                    })}
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Residential Address</label>
                <input
                  type="text"
                  value={editingEmp.address || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, address: e.target.value })}
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-300 text-xs text-[#042B1B] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#042B1B] text-white font-bold rounded-xl text-xs hover:bg-[#0B422B] shadow-md flex items-center space-x-2"
                >
                  <Check className="w-4 h-4 text-[#DFB33F]" />
                  <span>Update Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: One-Time Orders Management */}
      {activeTab === 'onetime-orders' && (
        <div className="bg-white rounded-3xl border border-[#042B1B]/10 shadow-md p-6 space-y-6">

          {/* Header & Search / Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#042B1B] flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#DFB33F]" />
                <span>One-Time Orders Database</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                View & manage non-subscription direct product orders, customer info, delivery details, and payment status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Order ID, name, phone, product..."
                  value={searchOneTimeOrders}
                  onChange={(e) => setSearchOneTimeOrders(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#042B1B] focus:outline-none focus:border-[#042B1B]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={oneTimeStatusFilter}
                onChange={(e) => setOneTimeStatusFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-semibold text-[#042B1B] focus:outline-none"
              >
                <option value="All">All Order Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Payment Filter */}
              <select
                value={oneTimePaymentFilter}
                onChange={(e) => setOneTimePaymentFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-semibold text-[#042B1B] focus:outline-none"
              >
                <option value="All">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">Total One-Time Orders</span>
              <p className="font-serif-display text-2xl font-bold text-[#042B1B]">{oneTimeOrders ? oneTimeOrders.length : 0}</p>
            </div>
            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">Total Paid Orders</span>
              <p className="font-serif-display text-2xl font-bold text-emerald-800">
                ₹{totalPaidOrders.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">Pending Delivery</span>
              <p className="font-serif-display text-2xl font-bold text-amber-700">
                {(oneTimeOrders || []).filter(o => o.status === 'Confirmed' || o.status === 'Processing' || o.status === 'In Transit').length} Orders
              </p>
            </div>
            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">Completed / Delivered</span>
              <p className="font-serif-display text-2xl font-bold text-[#042B1B]">
                {(oneTimeOrders || []).filter(o => o.status === 'Delivered').length} Orders
              </p>
            </div>
          </div>

          {/* Orders Data Table */}
          <div className="overflow-x-auto touch-pan-x">
            <table className="min-w-[750px] w-full text-left text-xs">
              <thead>
                <tr className="bg-[#042B1B]/5 border-b border-stone-200 text-[#042B1B] uppercase font-bold tracking-wider">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Ordered Products</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Delivery Details</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredOneTimeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      No one-time orders match your search filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOneTimeOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50 transition-colors">

                      {/* Order ID & Date */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#042B1B] font-mono block">{ord.id}</span>
                        <span className="text-[10px] text-stone-500 block">{ord.orderDate}</span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#042B1B] block">{ord.customerName}</span>
                        <span className="text-[10px] text-stone-500 block">{ord.customerEmail}</span>
                        <span className="text-[10px] text-emerald-800 font-mono block">{ord.customerPhone}</span>
                      </td>

                      {/* Products */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-1">
                          {(ord.items || []).map((item, idx) => (
                            <span key={idx} className="inline-block bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[11px] font-medium mr-1 mb-1 border border-stone-200">
                              {item.name} x{item.quantity} (₹{item.price * item.quantity})
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 font-bold text-[#042B1B] text-sm">
                        ₹{ord.totalAmount}
                      </td>

                      {/* Delivery Details */}
                      <td className="py-4 px-4 max-w-xs text-stone-600">
                        <span className="block font-bold text-[#042B1B] text-[11px]">{ord.deliverySlot}</span>
                        <span className="block truncate text-[11px]">{ord.address}</span>
                        {ord.instructions && (
                          <span className="block text-[10px] text-amber-800 italic truncate">Note: {ord.instructions}</span>
                        )}
                      </td>

                      {/* Payment Status & Toggle */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${ord.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                            {ord.paymentStatus || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-stone-500 block">{ord.paymentMethod}</span>
                          <button
                            onClick={() => updateOneTimePaymentStatus(ord.id, ord.paymentStatus === 'Paid' ? 'Pending' : 'Paid')}
                            className="text-[10px] text-blue-700 hover:underline font-bold block"
                          >
                            Mark as {ord.paymentStatus === 'Paid' ? 'Pending' : 'Paid'}
                          </button>
                        </div>
                      </td>

                      {/* Order Status & Dropdown */}
                      <td className="py-4 px-4">
                        <select
                          value={ord.status || 'Confirmed'}
                          onChange={(e) => updateOneTimeOrderStatus(ord.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold focus:outline-none border cursor-pointer ${ord.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : ord.status === 'In Transit'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : ord.status === 'Processing'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : ord.status === 'Cancelled'
                                  ? 'bg-red-50 text-red-800 border-red-300'
                                  : 'bg-stone-50 text-stone-800 border-stone-300'
                            }`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Action - Modal Details */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedOneTimeOrderDetails(ord)}
                          className="p-2 bg-stone-100 text-[#042B1B] hover:bg-[#042B1B] hover:text-white rounded-xl transition-colors font-bold text-xs inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#DFB33F]" />
                          <span>View</span>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* One-Time Order Detailed Modal */}
      {selectedOneTimeOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#DFB33F]/30 space-y-4 sm:space-y-6 relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOneTimeOrderDetails(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-stone-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#042B1B] text-[#DFB33F] flex items-center justify-center shrink-0 font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-display font-bold text-lg text-[#042B1B]">Order Details: {selectedOneTimeOrderDetails.id}</h3>
                <p className="text-[11px] text-stone-500">Placed on {selectedOneTimeOrderDetails.orderDate}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">

              {/* Customer Info */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <h4 className="font-bold text-[#042B1B] uppercase tracking-wider text-[11px] flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-[#DFB33F]" />
                  <span>Customer Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-stone-700">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Name</span>
                    <span className="font-bold">{selectedOneTimeOrderDetails.customerName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Phone</span>
                    <span className="font-mono font-bold">{selectedOneTimeOrderDetails.customerPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-400 block text-[10px]">Email</span>
                    <span>{selectedOneTimeOrderDetails.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <h4 className="font-bold text-[#042B1B] uppercase tracking-wider text-[11px] flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#DFB33F]" />
                  <span>Delivery Address & Slot</span>
                </h4>
                <p className="font-semibold text-stone-800">{selectedOneTimeOrderDetails.address}</p>
                <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200 text-[11px]">
                  <span>Slot: <strong>{selectedOneTimeOrderDetails.deliverySlot}</strong></span>
                  {selectedOneTimeOrderDetails.instructions && (
                    <span>Note: <em className="text-amber-900">{selectedOneTimeOrderDetails.instructions}</em></span>
                  )}
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-[#042B1B] uppercase tracking-wider text-[11px] flex items-center space-x-1">
                  <Package className="w-3.5 h-3.5 text-[#DFB33F]" />
                  <span>Products Summary</span>
                </h4>
                <div className="divide-y divide-amber-200/50">
                  {(selectedOneTimeOrderDetails.items || []).map((item, i) => (
                    <div key={i} className="py-2 flex justify-between">
                      <span className="font-medium text-stone-800">{item.name} x {item.quantity}</span>
                      <span className="font-bold text-[#042B1B]">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-sm text-[#042B1B] pt-2 border-t border-amber-300">
                  <span>Total Payable</span>
                  <span>₹{selectedOneTimeOrderDetails.totalAmount}</span>
                </div>
              </div>

            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedOneTimeOrderDetails(null)}
                className="px-5 py-2.5 bg-[#042B1B] text-white text-xs font-bold rounded-xl hover:bg-[#0B422B] shadow-md"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
