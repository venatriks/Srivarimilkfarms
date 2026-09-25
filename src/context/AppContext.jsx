import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AppContext = createContext();

// Idle Timeout Duration: 30 minutes (in milliseconds)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// Helper UUID generator
const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // Products state synced with DB
  const [products, setProducts] = useState(() => db.getProducts());

  // Supabase Connection Status
  const [supabaseActive, setSupabaseActive] = useState(false);

  // User list state synced with DB
  const [dbUsers, setDbUsers] = useState(() =>
    isSupabaseConfigured() ? [] : db.getUsers()
  );

  // User session state - Defaults to NULL (logged out) on site visit
  const [user, setUser] = useState(null);

  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('srivari_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Unable to restore cart from localStorage:', error);
      localStorage.removeItem('srivari_cart');
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Lab Modal product state
  const [selectedLabProduct, setSelectedLabProduct] = useState(null);

  // Active user subscriptions
  const [subscriptions, setSubscriptions] = useState([
    {
      id: "sub-9901",
      productName: "Pure A2 Desi Cow Milk",
      quantity: 2,
      unit: "Liter",
      frequency: "Daily Morning",
      deliverySlot: "5:30 AM - 6:30 AM",
      status: "Active",
      startDate: "2026-01-15",
      pricePerDay: 150,
      bottlesExchanged: 42
    }
  ]);

  // Orders state
  const [orders, setOrders] = useState([
    {
      id: "ORD-88219",
      date: "2026-09-16",
      items: [
        { name: "Pure A2 Desi Cow Milk (2L)", price: 150 },
        { name: "Traditional Vedic Bilona Ghee (1L)", price: 1400 }
      ],
      totalAmount: 1550,
      status: "Delivered",
      deliverySlot: "5:30 AM - 6:30 AM",
      paymentMethod: "Srivari Wallet"
    }
  ]);

  // Admin Distribution List synced with DB
  const [distributionList, setDistributionList] = useState(() => db.getDeliveries());

  // Contact Queries state synced with DB
  const [contactQueries, setContactQueries] = useState(() => db.getContactQueries());

  // Employees state synced with DB
  const [employees, setEmployees] = useState(() => db.getEmployees());

  // One-Time Orders state synced with DB
  const [oneTimeOrders, setOneTimeOrders] = useState(() => db.getOneTimeOrders());

  // System audit logs
  const [dbLogs, setDbLogs] = useState(() => db.getLogs());

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Log action helper (saves to local DB + Supabase audit_logs)
  const logAction = async (action, description) => {
    const timestamp = new Date().toISOString();

    // Always keep a local copy for the current browser session/database
    const localLog = {
      id: `log-${Date.now()}`,
      action,
      description,
      timestamp: new Date(timestamp).toLocaleString()
    };

    setDbLogs(prev => [localLog, ...prev].slice(0, 100));

    db.addLog({
      action,
      description,
      timestamp
    });

    // Supabase audit logging
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      // Get the currently authenticated user.
      const {
        data: { user: authUser }
      } = await supabase.auth.getUser();

      /*
       * Do not create anonymous audit records.
       *
       * This is important because contact forms and other public
       * actions can run without an authenticated user.
       */
      if (!authUser) {
        return;
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: authUser.id,
          action,
          description,
          timestamp
        });

      if (error) {
        console.error('Supabase audit log error:', error);
      }
    } catch (error) {
      console.error('Audit logging exception:', error);
    }
  };

  // Sync data with Supabase database & enable real-time listeners if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setSupabaseActive(true);

      // 1. Fetch & Sync Products
      const fetchProducts = async () => {
        try {
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: Number(p.price),
              unit: p.unit,
              rating: Number(p.rating || 5.0),
              reviewsCount: p.reviews_count || 0,
              image: (p.image.startsWith('http') || p.image.startsWith('/') || p.image.startsWith('data:')) ? p.image : `${import.meta.env.BASE_URL}${p.image}`,
              badge: p.badge,
              description: p.description,
              inStock: p.in_stock,
              stockCount: p.stock_count,
              subscriptionAvailable: p.subscription_available,
              labParameters: p.lab_parameters,
              nutritionalInfo: p.nutritional_info
            }));
            setProducts(mapped);
          }
        } catch (e) {
          console.error("Error fetching products from Supabase", e);
        }
      };

      // 2. Fetch & Sync Profiles / User Accounts
      const fetchProfiles = async () => {
        if (!isSupabaseConfigured()) {
          return;
        }

        try {
          const {
            data,
            error
          } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching profiles from Supabase:', error);
            return;
          }

          const mapped = (data || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            role: u.role || 'customer',
            address: u.address || '',
            walletBalance: Number(u.wallet_balance || 1000),
            subscriptionActive: u.subscription_active ?? true,
            status: u.status || 'Active',
            createdAt: u.created_at
              ? u.created_at.split('T')[0]
              : new Date().toISOString().split('T')[0]
          }));

          // Supabase is the source of truth.
          // Replace the entire user list, including when Supabase returns zero rows.
          setDbUsers(mapped);
        } catch (e) {
          console.error('Error fetching profiles from Supabase:', e);
        }
      };
      // 3. Fetch & Sync 5 AM Deliveries
      const fetchDeliveries = async () => {
        try {
          const { data, error } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(d => ({
              id: d.id,
              customerId: d.customer_id,
              customerName: d.customer_name,
              address: d.address,
              phone: d.phone,
              quantity: d.quantity,
              product: d.product,
              deliverySlot: d.delivery_slot || '5:30 AM - 6:30 AM',
              bottleReturnCount: d.bottle_return_count || 0,
              status: d.status || 'Pending',
              date: d.delivery_date || d.created_at
            }));
            setDistributionList(mapped);
          }
        } catch (e) {
          console.error("Error fetching deliveries from Supabase", e);
        }
      };

      // 4. Fetch & Sync Audit Logs
      const fetchAuditLogs = async () => {
        try {
          const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
          if (!error && data && data.length > 0) {
            const mapped = data.map(l => ({
              id: l.id,
              action: l.action,
              description: l.description,
              timestamp: new Date(l.timestamp).toLocaleString()
            }));
            setDbLogs(mapped);
          }
        } catch (e) {
          console.error("Error fetching audit logs from Supabase", e);
        }
      };

      // 5. Fetch & Sync Contact Queries (active queries where status != 'Completed')
      const fetchContactQueries = async () => {
        try {
          const { data, error } = await supabase
            .from('contact_queries')
            .select('*')
            .neq('status', 'Completed')
            .order('created_at', { ascending: false });

          if (!error && data) {
            setContactQueries(data);
          }
        } catch (e) {
          console.error("Error fetching contact queries from Supabase", e);
        }
      };

      // 6. Fetch & Sync One-Time Orders (admin only under RLS)
      const fetchOneTimeOrders = async () => {
        try {
          const { data, error } = await supabase
            .from('one_time_orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            // Customers/guests are expected to be denied by RLS.
            console.debug('One-time orders are not available for this session:', error.message);
            return;
          }

          const mapped = (data || []).map(order => ({
            id: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            address: order.address,
            deliverySlot: order.delivery_slot,
            instructions: order.instructions || '',
            items: order.items || [],
            totalAmount: Number(order.total_amount || 0),
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            status: order.status,
            orderDate: order.order_date,
            created_at: order.created_at
          }));

          setOneTimeOrders(mapped);
        } catch (error) {
          console.error('Error fetching one-time orders from Supabase:', error);
        }
      };

      // 7. Fetch & Sync Employees (Delivery Agents and Internal Staff)
      const fetchEmployees = async () => {
        try {
          const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(e => ({
              id: e.id,
              name: e.name,
              phone: e.phone || '',
              email: e.email || '',
              role: e.role || '',
              category: e.category || 'Delivery Agent',
              address: e.address || '',
              joiningDate: e.joining_date || (e.created_at ? e.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
              salary: Number(e.salary || 20000),
              status: e.status || 'Active'
            }));
            setEmployees(mapped);
          }
        } catch (e) {
          console.error("Error fetching employees from Supabase", e);
        }
      };

      fetchProducts();
      fetchProfiles();
      fetchDeliveries();
      fetchAuditLogs();
      fetchContactQueries();
      fetchOneTimeOrders();
      fetchEmployees();

      // Setup Realtime subscriptions
      const productsChannel = supabase.channel('products-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
        .subscribe();

      const profilesChannel = supabase.channel('profiles-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles)
        .subscribe();

      const deliveriesChannel = supabase.channel('deliveries-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, fetchDeliveries)
        .subscribe();

      const auditLogsChannel = supabase.channel('audit-logs-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, fetchAuditLogs)
        .subscribe();

      const contactQueriesChannel = supabase.channel('contact-queries-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_queries' }, fetchContactQueries)
        .subscribe();

      const employeesChannel = supabase.channel('employees-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchEmployees)
        .subscribe();

      const oneTimeOrdersChannel = supabase.channel('one-time-orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'one_time_orders' }, fetchOneTimeOrders)
        .subscribe();

      return () => {
        supabase.removeChannel(productsChannel);
        supabase.removeChannel(profilesChannel);
        supabase.removeChannel(deliveriesChannel);
        supabase.removeChannel(auditLogsChannel);
        supabase.removeChannel(contactQueriesChannel);
        supabase.removeChannel(employeesChannel);
        supabase.removeChannel(oneTimeOrdersChannel);
      };
    }
  }, []);

  // -------------------------------------------------------------
  // SUPABASE AUTH SESSION RESTORE / AUTH STATE SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSupabaseActive(false);
      return undefined;
    }

    let mounted = true;

    const loadAuthenticatedProfile = async (authUser) => {
      if (!authUser || !mounted) {
        if (mounted) setUser(null);
        return;
      }

      try {
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('Unable to load authenticated profile:', error);
          return;
        }

        if (!profile) {
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle();
          profile = result.data;
          error = result.error;
        }

        if (error || !profile || ['Deleted', 'Inactive'].includes(profile.status)) {
          await supabase.auth.signOut();
          if (mounted) setUser(null);
          return;
        }

        if (mounted) {
          setUser({
            id: profile.id || authUser.id,
            name: profile.name || authUser.user_metadata?.name || authUser.email,
            email: profile.email || authUser.email,
            phone: profile.phone || '',
            address: profile.address || '',
            role: profile.role || authUser.user_metadata?.role || 'customer',
            walletBalance: Number(profile.wallet_balance || 1000),
            status: profile.status || 'Active'
          });
        }
      } catch (error) {
        console.error('Auth session restore error:', error);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Unable to restore Supabase session:', error);
        return;
      }
      loadAuthenticatedProfile(data.session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the profile query so it does not run inside Supabase's auth lock.
      setTimeout(() => loadAuthenticatedProfile(session?.user || null), 0);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------
  // 30-MINUTE IDLE TIMEOUT LOGOUT LOGIC
  // -------------------------------------------------------------
  const idleTimerRef = useRef(null);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (user) {
      idleTimerRef.current = setTimeout(async () => {
        if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.signOut();
          if (error) console.error('Supabase automatic logout error:', error);
        }
        setUser(null);
        localStorage.removeItem('srivari_user');
        showToast("Logged out automatically due to 30 minutes of inactivity.", "info");
      }, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'wheel'];

    const handleUserActivity = () => {
      resetIdleTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user]);

  // Product Database Operations with Supabase Sync
  const updateProductStockOrPrice = async (productId, updates) => {
    db.updateProduct(productId, updates);

    if (isSupabaseConfigured()) {
      try {
        const dbUpdates = {};
        if (updates.price !== undefined) dbUpdates.price = Number(updates.price);
        if (updates.stockCount !== undefined) dbUpdates.stock_count = Number(updates.stockCount);
        if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
        if (updates.nutritionalInfo !== undefined) dbUpdates.nutritional_info = updates.nutritionalInfo;
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.category !== undefined) dbUpdates.category = updates.category;

        await supabase.from('products').update(dbUpdates).eq('id', productId);
      } catch (e) {
        console.error("Supabase product update exception:", e);
      }
    }

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
    logAction("PRODUCT_UPDATED", `Updated product ID: ${productId}`);
    showToast("Product database updated successfully!");
  };

  const addProduct = async (newProdData) => {
    const prodId = newProdData.id || `p-${Date.now()}`;
    const formattedProd = {
      id: prodId,
      name: newProdData.name,
      category: newProdData.category,
      price: Number(newProdData.price),
      unit: newProdData.unit,
      rating: 5.0,
      reviews_count: 1,
      image: newProdData.image,
      badge: 'New Launch',
      description: newProdData.description,
      in_stock: true,
      stock_count: 100,
      subscription_available: true,
      nutritional_info: newProdData.nutritionalInfo || {}
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').insert(formattedProd);
        if (error) {
          console.error("Error inserting product into Supabase:", error);
        }
      } catch (e) {
        console.error("Supabase insert product exception:", e);
      }
    }

    db.addProduct({ id: prodId, ...newProdData });
    setProducts(prev => [
      {
        id: prodId,
        name: newProdData.name,
        category: newProdData.category,
        price: Number(newProdData.price),
        unit: newProdData.unit,
        rating: 5.0,
        reviewsCount: 1,
        image: newProdData.image,
        badge: 'New Launch',
        description: newProdData.description,
        inStock: true,
        stockCount: 100,
        subscriptionAvailable: true,
        nutritionalInfo: newProdData.nutritionalInfo || {}
      },
      ...prev.filter(p => p.id !== prodId)
    ]);

    logAction("PRODUCT_ADDED", `Added product: ${newProdData.name}`);
    showToast(`Added ${newProdData.name} to Database!`);
  };

  const deleteProduct = async (productId) => {
    db.deleteProduct(productId);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', productId);
      } catch (e) {
        console.error("Supabase delete product exception:", e);
      }
    }

    setProducts(prev => prev.filter(p => p.id !== productId));
    logAction("PRODUCT_DELETED", `Deleted product ID: ${productId}`);
    showToast("Product deleted from Database", "info");
  };

  // User DB operations with Supabase Sync
  const addDbUser = async (userData) => {
    const targetId = userData.id || generateUuid();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: targetId,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          role: userData.role || 'customer',
          address: userData.address || '',
          wallet_balance: Number(userData.walletBalance || 1000),
          status: 'Active'
        }, { onConflict: 'email' });

        if (error) {
          console.error("Error upserting user to Supabase profiles:", error);
        }
      } catch (e) {
        console.error("Supabase user creation exception:", e);
      }
    }

    const created = db.addUser({ id: targetId, ...userData });
    setDbUsers(prev => [
      {
        id: targetId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role || 'customer',
        address: userData.address || '',
        walletBalance: Number(userData.walletBalance || 1000),
        subscriptionActive: true,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0]
      },
      ...prev.filter(u => u.email.toLowerCase() !== userData.email.toLowerCase())
    ]);

    logAction("USER_CREATED", `Created ${userData.role} user: ${userData.name}`);
    showToast(`Created new ${userData.role} user in Database!`);
    return created;
  };

  const updateDbUser = async (userId, updates) => {
    db.updateUser(userId, updates);

    if (isSupabaseConfigured()) {
      try {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.walletBalance !== undefined) dbUpdates.wallet_balance = Number(updates.walletBalance);
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        await supabase.from('profiles').update(dbUpdates).eq('id', userId);
      } catch (e) {
        console.error("Supabase user update exception:", e);
      }
    }

    setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (user && user.id === userId) {
      setUser(prev => ({ ...prev, ...updates }));
    }
    logAction("USER_UPDATED", `Updated user ID: ${userId}`);
    showToast("User details updated in Database!");
  };

  const deleteDbUser = async (userId) => {
    db.deleteUser(userId);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) {
          await supabase.from('profiles').update({ status: 'Deleted' }).eq('id', userId);
        }
      } catch (e) {
        console.error("Supabase user delete exception:", e);
      }
    }

    setDbUsers(prev => prev.filter(u => u.id !== userId));
    logAction("USER_DELETED", `Deleted user ID: ${userId}`);
    showToast("User account removed from Database", "info");
  };

  // Delivery Distribution DB sync with Supabase
  const updateDistributionStatus = async (distId, newStatus) => {
    db.updateDeliveryStatus(distId, newStatus);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('deliveries').update({ status: newStatus }).eq('id', distId);
      } catch (e) {
        console.error("Supabase delivery status update exception:", e);
      }
    }

    setDistributionList(prev => prev.map(d => d.id === distId ? { ...d, status: newStatus } : d));
    logAction("DELIVERY_STATUS_CHANGED", `Updated delivery ${distId} status to ${newStatus}`);
    showToast(`Delivery status updated to ${newStatus}`);
  };

  // Database Backup / Restore / Reset
  const exportDatabaseBackup = () => {
    const backupObj = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      users: dbUsers,
      products: products,
      deliveries: distributionList,
      logs: dbLogs
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `srivari_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast("Database backup exported successfully!");
  };

  const importDatabaseBackup = async (jsonString) => {
    const success = db.importBackupJSON(jsonString);
    if (success) {
      try {
        const data = JSON.parse(jsonString);
        if (isSupabaseConfigured() && data.products && data.products.length > 0) {
          for (const p of data.products) {
            await supabase.from('products').upsert({
              id: p.id,
              name: p.name,
              category: p.category,
              price: Number(p.price),
              unit: p.unit,
              image: p.image,
              description: p.description,
              in_stock: p.inStock,
              stock_count: p.stockCount,
              nutritional_info: p.nutritionalInfo || {}
            });
          }
        }
      } catch (e) {
        console.error("Error writing backup JSON to Supabase:", e);
      }
      setProducts(db.getProducts());
      setDbUsers(db.getUsers());
      setDistributionList(db.getDeliveries());
      logAction("SYSTEM_RESTORE", "Restored database from JSON backup file");
      showToast("Database restored successfully from backup file!");
    } else {
      showToast("Invalid database backup file", "error");
    }
  };

  const resetDatabaseToDefaults = async () => {
    db.resetToFactoryDefaults();
    setProducts(db.getProducts());
    setDbUsers(db.getUsers());
    setDistributionList(db.getDeliveries());
    logAction("FACTORY_RESET", "Reset database to Srivari Milk Farms initial seeds");
    showToast("Database reset to factory defaults!");
  };

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('srivari_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart operations
  const addToCart = (product, quantity = 1, buyType = "one-time", frequency = "daily") => {
    if (buyType === 'subscription' && !user) {
      showToast("Please log in to your account to start a daily milk subscription.", "info");
      navigate('/login');
      return false;
    }
    setCart(prevCart => {
      const cartItemId = `${product.id}-${buyType}-${frequency}`;
      const existingIndex = prevCart.findIndex(item => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            id: cartItemId,
            productId: product.id,
            product,
            quantity,
            buyType,
            frequency,
            startDate: new Date().toISOString().split('T')[0],
            bottleType: "glass"
          }
        ];
      }
    });
    showToast(`Added ${product.name} (${buyType === 'subscription' ? 'Subscription' : 'One-time'}) to cart!`);
    return true;
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    showToast("Item removed from cart", "info");
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Authentication & Customer Registration
  const signUpCustomer = async ({ name, email, phone, address, password }) => {
    let insertedSuccessfully = false;
    let supabaseUserId = null;

    if (isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
              address,
              role: 'customer'
            }
          }
        });

        const targetUserId = authData?.user?.id;
        if (targetUserId) {
          supabaseUserId = targetUserId;
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: targetUserId,
              name: name,
              email: email,
              phone: phone || '',
              address: address || '',
              role: 'customer',
              wallet_balance: 1000.00,
              status: 'Active'
            }, { onConflict: 'id' });

          if (!profileError) {
            insertedSuccessfully = true;
          }
        }

        if (!insertedSuccessfully) {
          const { data: checkData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (checkData?.id) {
            insertedSuccessfully = true;
            supabaseUserId = checkData.id;
          }
        }
      } catch (e) {
        console.error("Supabase customer sign up exception:", e);
      }
    } else {
      insertedSuccessfully = true;
    }

    if (insertedSuccessfully) {
      const newId = supabaseUserId || generateUuid();
      const newUser = db.addUser({
        id: newId,
        name,
        email,
        phone: phone || "+91 98765 43210",
        address: address || "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
        role: 'customer',
        walletBalance: 1000,
        subscriptionActive: true
      });
      setDbUsers(db.getUsers());
      setUser(newUser);
      logAction("CUSTOMER_SIGNUP", `New customer registered: ${name} (${email})`);
      showToast("Signup successful", "success");
      return true;
    } else {
      showToast("Signup failed. Please try again.", "error");
      return false;
    }
  };

  const login = async (email, password, role = "customer") => {
    if (!email || !password) {
      showToast("Email and password are required.", "error");
      return false;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });

        if (authErr || !authData?.user) {
          showToast(authErr?.message || "Invalid credentials. Please check your email and password.", "error");
          return false;
        }

        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) {
          await supabase.auth.signOut();
          showToast("Unable to load your account profile. Please try again.", "error");
          return false;
        }

        if (!profile) {
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('email', authData.user.email)
            .maybeSingle();
          profile = result.data;
          profileError = result.error;
        }

        if (profileError || !profile || ['Deleted', 'Inactive'].includes(profile.status)) {
          await supabase.auth.signOut();
          showToast("Account not found or inactive. Please contact support.", "error");
          return false;
        }

        const userRole = profile.role || authData.user.user_metadata?.role || 'customer';

        if (role === 'admin' && userRole !== 'admin') {
          await supabase.auth.signOut();
          showToast("Access Denied: This account does not have Admin privileges.", "error");
          return false;
        }

        const loggedInUser = {
          id: profile.id || authData.user.id,
          name: profile.name || authData.user.user_metadata?.name || authData.user.email,
          email: profile.email || authData.user.email,
          phone: profile.phone || '',
          address: profile.address || '',
          role: userRole,
          walletBalance: Number(profile.wallet_balance || (userRole === 'admin' ? 50000 : 1000)),
          status: profile.status || 'Active'
        };

        setUser(loggedInUser);
        localStorage.setItem('srivari_user', JSON.stringify(loggedInUser));
        await logAction("USER_LOGIN", `Logged in user: ${loggedInUser.name} (${loggedInUser.role})`);
        showToast(`Welcome back, ${loggedInUser.name}! Logged in as ${loggedInUser.role.toUpperCase()}`);
        return true;
      } catch (error) {
        console.error("Supabase authentication error:", error);
        showToast("Unable to sign in right now. Please try again.", "error");
        return false;
      }
    }

    // Local database is used only when Supabase is intentionally not configured.
    const existing = dbUsers.find(u =>
      u.email?.toLowerCase() === email.trim().toLowerCase() &&
      u.status !== 'Deleted'
    );

    if (!existing) {
      showToast("Account not found. Please contact support.", "error");
      return false;
    }

    if (role === 'admin' && existing.role !== 'admin') {
      showToast("Access Denied: This account does not have Admin privileges.", "error");
      return false;
    }

    setUser(existing);
    localStorage.setItem('srivari_user', JSON.stringify(existing));
    await logAction("USER_LOGIN", `Logged in user: ${existing.name} (${existing.role})`);
    showToast(`Welcome back, ${existing.name}! Logged in as ${existing.role.toUpperCase()}`);
    return true;
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
        showToast('Unable to log out. Please try again.', 'error');
        return false;
      }
    }

    setUser(null);
    localStorage.removeItem('srivari_user');
    showToast("Logged out successfully", "info");
    return true;
  };

  // Subscription management
  const toggleSubscriptionPause = (subId) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subId) {
        const newStatus = sub.status === 'Active' ? 'Paused' : 'Active';
        showToast(`Subscription ${newStatus === 'Active' ? 'Resumed' : 'Paused'}`);
        return { ...sub, status: newStatus };
      }
      return sub;
    }));
  };

  const updateSubscriptionQty = (subId, newQty) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subId) {
        showToast(`Subscription updated to ${newQty} Liters/day`);
        return { ...sub, quantity: newQty, pricePerDay: newQty * 75 };
      }
      return sub;
    }));
  };

  // Order Placement
  const placeOrder = (paymentDetails) => {
    const newOrder = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      items: cart.map(i => ({ name: `${i.product.name} (${i.quantity}x)`, price: i.product.price * i.quantity })),
      totalAmount: cartTotal,
      status: "Confirmed",
      deliverySlot: "5:30 AM - 6:30 AM Tomorrow",
      paymentMethod: paymentDetails.method || "Srivari Wallet"
    };

    cart.forEach(item => {
      if (item.buyType === 'subscription') {
        setSubscriptions(prev => [
          ...prev,
          {
            id: `sub-${Math.floor(1000 + Math.random() * 9000)}`,
            productName: item.product.name,
            quantity: item.quantity,
            unit: item.product.unit,
            frequency: item.frequency === 'daily' ? 'Daily Morning' : 'Alternate Days',
            deliverySlot: "5:30 AM - 6:30 AM",
            status: "Active",
            startDate: item.startDate || new Date().toISOString().split('T')[0],
            pricePerDay: item.product.price * item.quantity,
            bottlesExchanged: 0
          }
        ]);
      }
    });

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    setCheckoutOpen(false);
    logAction("ORDER_PLACED", `Order ${newOrder.id} placed for ₹${cartTotal}`);
    showToast("🎉 Order Confirmed! Fresh Morning Delivery Scheduled.");
  };

  // One-time orders are created by CheckoutModal through the secure Supabase RPC.
  // There is intentionally no direct client-side insert function here.

  const updateOneTimeOrderStatus = async (orderId, newStatus) => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('one_time_orders')
          .update({ status: newStatus })
          .eq('id', orderId);

        if (error) {
          console.error('Supabase one-time order status update error:', error);
          showToast(error.message || 'Unable to update order status.', 'error');
          return false;
        }
      } catch (error) {
        console.error('Supabase one-time order status update exception:', error);
        showToast('Unable to update order status.', 'error');
        return false;
      }
    }

    db.updateOneTimeOrderStatus(orderId, newStatus);
    setOneTimeOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await logAction("ONE_TIME_ORDER_STATUS_CHANGED", `Updated order ${orderId} status to ${newStatus}`);
    showToast(`Order status updated to ${newStatus}`);
    return true;
  };

  const updateOneTimePaymentStatus = async (orderId, newPaymentStatus) => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('one_time_orders')
          .update({ payment_status: newPaymentStatus })
          .eq('id', orderId);

        if (error) {
          console.error('Supabase one-time order payment update error:', error);
          showToast(error.message || 'Unable to update payment status.', 'error');
          return false;
        }
      } catch (error) {
        console.error('Supabase one-time order payment update exception:', error);
        showToast('Unable to update payment status.', 'error');
        return false;
      }
    }

    db.updateOneTimePaymentStatus(orderId, newPaymentStatus);
    setOneTimeOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
    await logAction("ONE_TIME_ORDER_PAYMENT_CHANGED", `Updated order ${orderId} payment status to ${newPaymentStatus}`);
    showToast(`Payment status updated to ${newPaymentStatus}`);
    return true;
  };

  // Contact Queries operations with Supabase sync
  const submitContactQuery = async ({ name, email, phone, subject, message }) => {
    const queryId = `query-${Date.now()}`;
    const newQueryObj = {
      id: queryId,
      name,
      email,
      phone: phone || '',
      subject: subject || 'Milk Subscription Inquiry',
      message,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('contact_queries').insert({
          id: queryId,
          name,
          email,
          phone: phone || '',
          subject: subject || 'Milk Subscription Inquiry',
          message,
          status: 'Pending'
        });
        if (error) console.error("Supabase insert contact query error:", error);
      } catch (e) {
        console.error("Supabase contact query submission exception:", e);
      }
    }

    db.saveContactQuery(newQueryObj);
    setContactQueries(prev => [newQueryObj, ...prev]);
    logAction("CONTACT_QUERY_SUBMITTED", `Customer query submitted by ${name} (${email})`);
    showToast("Message sent to Srivari Farm Care Desk! We will call you back shortly.", "success");
    return true;
  };

  const updateContactQueryStatus = async (queryId, newStatus) => {
    if (newStatus === 'Completed') {
      // Requirement 5: Automatically remove from active queries list when completed
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('contact_queries').delete().eq('id', queryId);
        } catch (e) {
          console.error("Supabase contact query deletion exception:", e);
        }
      }
      db.deleteContactQuery(queryId);
      setContactQueries(prev => prev.filter(q => q.id !== queryId));
      logAction("CONTACT_QUERY_COMPLETED", `Query ${queryId} completed & removed from active list`);
      showToast("Query marked as Completed and removed from active list!", "info");
    } else {
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('contact_queries').update({ status: newStatus }).eq('id', queryId);
        } catch (e) {
          console.error("Supabase contact query status update exception:", e);
        }
      }
      db.updateContactQueryStatus(queryId, newStatus);
      setContactQueries(prev => prev.map(q => q.id === queryId ? { ...q, status: newStatus } : q));
      logAction("CONTACT_QUERY_UPDATED", `Updated query ${queryId} status to ${newStatus}`);
      showToast(`Query status updated to ${newStatus}`);
    }
  };

  const deleteContactQuery = async (queryId) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('contact_queries').delete().eq('id', queryId);
      } catch (e) {
        console.error("Supabase delete contact query exception:", e);
      }
    }
    db.deleteContactQuery(queryId);
    setContactQueries(prev => prev.filter(q => q.id !== queryId));
    logAction("CONTACT_QUERY_DELETED", `Deleted query ID: ${queryId}`);
    showToast("Contact query removed from database", "info");
  };

  // Employee DB operations with Supabase Sync
  const addEmployee = async (empData) => {
    const empId = empData.id || `emp-${Date.now()}`;
    const formattedEmp = {
      id: empId,
      name: empData.name,
      phone: empData.phone || '',
      email: empData.email || '',
      role: empData.role || 'Delivery Agent',
      category: empData.category || 'Delivery Agent',
      address: empData.address || '',
      joining_date: empData.joiningDate || new Date().toISOString().split('T')[0],
      salary: Number(empData.salary || 20000),
      status: empData.status || 'Active'
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('employees').upsert(formattedEmp, { onConflict: 'id' });
        if (error) {
          console.error("Error inserting employee into Supabase:", error);
        }
      } catch (e) {
        console.error("Supabase insert employee exception:", e);
      }
    }

    db.addEmployee(empData);
    setEmployees(prev => [
      {
        id: empId,
        name: empData.name,
        phone: empData.phone || '',
        email: empData.email || '',
        role: empData.role || 'Delivery Agent',
        category: empData.category || 'Delivery Agent',
        address: empData.address || '',
        joiningDate: empData.joiningDate || new Date().toISOString().split('T')[0],
        salary: Number(empData.salary || 20000),
        status: empData.status || 'Active'
      },
      ...prev.filter(e => e.id !== empId)
    ]);

    logAction("EMPLOYEE_ADDED", `Added ${empData.category}: ${empData.name}`);
    showToast(`Added ${empData.name} to Employees Database!`);
  };

  const updateEmployee = async (empId, updates) => {
    db.updateEmployee(empId, updates);

    if (isSupabaseConfigured()) {
      try {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.joiningDate !== undefined) dbUpdates.joining_date = updates.joiningDate;
        if (updates.salary !== undefined) dbUpdates.salary = Number(updates.salary);
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        await supabase.from('employees').update(dbUpdates).eq('id', empId);
      } catch (e) {
        console.error("Supabase employee update exception:", e);
      }
    }

    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...updates } : e));
    logAction("EMPLOYEE_UPDATED", `Updated employee ID: ${empId}`);
    showToast("Employee details updated in Database!");
  };

  const deleteEmployee = async (empId) => {
    db.deleteEmployee(empId);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('employees').delete().eq('id', empId);
      } catch (e) {
        console.error("Supabase delete employee exception:", e);
      }
    }

    setEmployees(prev => prev.filter(e => e.id !== empId));
    logAction("EMPLOYEE_DELETED", `Deleted employee ID: ${empId}`);
    showToast("Employee record removed from Database", "info");
  };

  return (
    <AppContext.Provider
      value={{
        db,
        products,
        setProducts,
        dbUsers,
        user,
        login,
        logout,
        addDbUser,
        updateDbUser,
        deleteDbUser,
        cart,
        cartOpen,
        setCartOpen,
        checkoutOpen,
        setCheckoutOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        selectedLabProduct,
        setSelectedLabProduct,
        subscriptions,
        toggleSubscriptionPause,
        updateSubscriptionQty,
        orders,
        placeOrder,
        distributionList,
        updateDistributionStatus,
        updateProductStockOrPrice,
        addProduct,
        deleteProduct,
        exportDatabaseBackup,
        importDatabaseBackup,
        resetDatabaseToDefaults,
        dbLogs,
        toast,
        showToast,
        supabaseActive,
        signUpCustomer,
        contactQueries,
        submitContactQuery,
        updateContactQueryStatus,
        deleteContactQuery,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        oneTimeOrders,
        updateOneTimeOrderStatus,
        updateOneTimePaymentStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
