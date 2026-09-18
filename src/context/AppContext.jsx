import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/database';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Products state synced with DB
  const [products, setProducts] = useState(() => db.getProducts());

  // User list state synced with DB
  const [dbUsers, setDbUsers] = useState(() => db.getUsers());

  // User session state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('srivari_user');
    return saved ? JSON.parse(saved) : db.getUsers()[1]; // Anita Sharma default customer
  });

  // Cart state
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('srivari_cart');
    return saved ? JSON.parse(saved) : [
      {
        id: "p1-sub",
        productId: "p1",
        product: products[0] || db.getProducts()[0],
        quantity: 2,
        buyType: "subscription",
        frequency: "daily",
        startDate: new Date().toISOString().split('T')[0],
        bottleType: "glass"
      }
    ];
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

  // Sync products with DB
  const updateProductStockOrPrice = (productId, updates) => {
    db.updateProduct(productId, updates);
    setProducts(db.getProducts());
    showToast("Product database updated successfully!");
  };

  const addProduct = (newProdData) => {
    const created = db.addProduct(newProdData);
    setProducts(db.getProducts());
    showToast(`Added ${created.name} to Database!`);
  };

  const deleteProduct = (productId) => {
    db.deleteProduct(productId);
    setProducts(db.getProducts());
    showToast("Product deleted from Database", "info");
  };

  // User DB operations
  const addDbUser = (userData) => {
    const created = db.addUser(userData);
    setDbUsers(db.getUsers());
    showToast(`Created new ${userData.role} user in Database!`);
    return created;
  };

  const updateDbUser = (userId, updates) => {
    db.updateUser(userId, updates);
    setDbUsers(db.getUsers());
    if (user && user.id === userId) {
      setUser(prev => ({ ...prev, ...updates }));
    }
    showToast("User details updated in Database!");
  };

  const deleteDbUser = (userId) => {
    db.deleteUser(userId);
    setDbUsers(db.getUsers());
    showToast("User account removed from Database", "info");
  };

  // Delivery Distribution DB sync
  const updateDistributionStatus = (distId, newStatus) => {
    db.updateDeliveryStatus(distId, newStatus);
    setDistributionList(db.getDeliveries());
    setDbLogs(db.getLogs());
    showToast(`Delivery status updated to ${newStatus}`);
  };

  // Database Backup / Restore / Reset
  const exportDatabaseBackup = () => {
    const jsonStr = db.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `srivari_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast("Database backup exported successfully!");
  };

  const importDatabaseBackup = (jsonString) => {
    const success = db.importBackupJSON(jsonString);
    if (success) {
      setProducts(db.getProducts());
      setDbUsers(db.getUsers());
      setDistributionList(db.getDeliveries());
      setDbLogs(db.getLogs());
      showToast("Database restored successfully from backup file!");
    } else {
      showToast("Invalid database backup file", "error");
    }
  };

  const resetDatabaseToDefaults = () => {
    db.resetToFactoryDefaults();
    setProducts(db.getProducts());
    setDbUsers(db.getUsers());
    setDistributionList(db.getDeliveries());
    setDbLogs(db.getLogs());
    showToast("Database reset to factory defaults!");
  };

  // Save active user & cart to localStorage
  useEffect(() => {
    localStorage.setItem('srivari_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('srivari_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('srivari_user');
    }
  }, [user]);

  // Cart operations
  const addToCart = (product, quantity = 1, buyType = "one-time", frequency = "daily") => {
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

  // Authentication
  const login = (email, role = "customer", customName = null) => {
    const existing = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setUser(existing);
      showToast(`Welcome back, ${existing.name}! Logged in as ${existing.role.toUpperCase()}`);
    } else {
      const newUser = db.addUser({
        name: customName || (role === 'admin' ? "Rajesh Kumar (Farm Manager)" : "Anita Sharma"),
        email: email,
        role: role,
        phone: "+91 7022776637",
        address: role === 'admin' ? "Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk, Anantapur Dist" : "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
        walletBalance: role === 'admin' ? 50000 : 2450,
        subscriptionActive: true
      });
      setDbUsers(db.getUsers());
      setUser(newUser);
      showToast(`Account created in Database & logged in as ${role.toUpperCase()}`);
    }
  };

  const logout = () => {
    setUser(null);
    showToast("Logged out successfully", "info");
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

    // If order contains subscription, add to subscriptions
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
    db.logAction("ORDER_PLACED", `Order ${newOrder.id} placed for ₹${cartTotal}`);
    setDbLogs(db.getLogs());
    showToast("🎉 Order Confirmed! Fresh Morning Delivery Scheduled.");
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
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
