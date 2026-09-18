// Srivari Milk Farms - High Performance Database Manager (IndexedDB + LocalStorage Persistence)

const DB_KEYS = {
  USERS: 'srivari_db_users',
  PRODUCTS: 'srivari_db_products',
  SUBSCRIPTIONS: 'srivari_db_subscriptions',
  DELIVERIES: 'srivari_db_deliveries',
  TRANSACTIONS: 'srivari_db_transactions',
  LOGS: 'srivari_db_logs'
};

// Initial Seed Database Records
export const seedUsers = [
  {
    id: "usr-admin-01",
    name: "Rajesh Kumar",
    email: "admin@srivarimilkfarms.com",
    role: "admin",
    phone: "+91 7022776637",
    address: "Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk, Anantapur Dist, AP - 515872",
    walletBalance: 50000,
    subscriptionActive: false,
    status: "Active",
    createdAt: "2026-01-01"
  },
  {
    id: "usr-[#042B1B]-01",
    name: "Anita Sharma",
    email: "anita.sharma@example.com",
    role: "customer",
    phone: "+91 98765 43210",
    address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103",
    walletBalance: 2450,
    subscriptionActive: true,
    status: "Active",
    createdAt: "2026-01-15"
  },
  {
    id: "usr-cust-02",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    role: "customer",
    phone: "+91 97444 33221",
    address: "House 88, 5th Main, Indiranagar, Bengaluru - 560038",
    walletBalance: 1800,
    subscriptionActive: true,
    status: "Active",
    createdAt: "2026-02-10"
  },
  {
    id: "usr-cust-03",
    name: "Vikramaditya Hegde",
    email: "vikram.hegde@example.com",
    role: "customer",
    phone: "+91 99000 11223",
    address: "Penthouse 12, Sobha Royal Pavilion, Sarjapur, Bengaluru - 560035",
    walletBalance: 3200,
    subscriptionActive: true,
    status: "Active",
    createdAt: "2026-03-01"
  }
];

export const seedProducts = [
  {
    id: "p1",
    name: "Pure A2 Desi Cow Milk",
    category: "Raw Milk",
    price: 75,
    unit: "1 Liter Bottle",
    rating: 4.9,
    reviewsCount: 342,
    image: `${import.meta.env.BASE_URL}images/a2_milk.jpg`,
    badge: "Bestseller",
    description: "100% Unprocessed, raw single-origin A2 milk from grass-fed Gir & Sahiwal cows. Delivered in chilled eco glass bottles by 5:30 AM daily.",
    inStock: true,
    stockCount: 450,
    labParameters: {
      fatPercentage: "4.6%",
      snfPercentage: "8.9%",
      somaticCellCount: "110,000 / ml (Ultra Clean)",
      a2CaseinPurity: "100% DNA Certified A2/A2",
      antibiotics: "0.00% (Nil)",
      addedWater: "0.00%",
      preservatives: "0.00%",
      chillingTemperature: "3.8°C"
    },
    subscriptionAvailable: true,
    nutritionalInfo: { calories: "68 kcal", protein: "3.4 g", carbs: "4.8 g", fat: "4.6 g", calcium: "125 mg" }
  },
  {
    id: "p2",
    name: "Traditional Vedic Bilona Ghee",
    category: "Cultured Ghee",
    price: 1400,
    unit: "1 Liter Glass Jar",
    rating: 5.0,
    reviewsCount: 218,
    image: `${import.meta.env.BASE_URL}images/bilona_ghee.jpg`,
    badge: "Vedic Craft",
    description: "Hand-churned from cultured A2 curd using wooden Bilona, slowly heated over natural cow-dung firewood. Rich aromatic golden granules.",
    inStock: true,
    stockCount: 85,
    labParameters: {
      fatPercentage: "99.8%",
      snfPercentage: "0.2%",
      somaticCellCount: "N/A (Pure Fat)",
      a2CaseinPurity: "Made from 100% A2 Curd",
      freeFattyAcids: "0.22%",
      peroxideValue: "< 1.0 meq/kg",
      preservatives: "0.00%",
      chillingTemperature: "Room Temp Storable"
    },
    subscriptionAvailable: true,
    nutritionalInfo: { calories: "898 kcal", protein: "0.0 g", carbs: "0.0 g", fat: "99.8 g", calcium: "5 mg" }
  },
  {
    id: "p3",
    name: "Artisanal Fresh Farm Paneer",
    category: "Fresh Paneer & Curd",
    price: 140,
    unit: "200 Gram Pack",
    rating: 4.8,
    reviewsCount: 154,
    image: `${import.meta.env.BASE_URL}images/paneer.jpg`,
    badge: "Farm Fresh",
    description: "Hand-crafted cottage cheese coagulated with organic citrus juice. Melt-in-mouth soft texture packed with natural protein.",
    inStock: true,
    stockCount: 120,
    labParameters: {
      fatPercentage: "22.5%",
      snfPercentage: "High Solid",
      somaticCellCount: "Pass",
      a2CaseinPurity: "100% A2 Cow Milk Origin",
      antibiotics: "0.00%",
      addedWater: "0.00%",
      preservatives: "0.00%",
      chillingTemperature: "4.0°C"
    },
    subscriptionAvailable: true,
    nutritionalInfo: { calories: "265 kcal", protein: "18.5 g", carbs: "2.1 g", fat: "20.8 g", calcium: "208 mg" }
  },
  {
    id: "p4",
    name: "Earthen Pot Fresh A2 Curd",
    category: "Fresh Paneer & Curd",
    price: 65,
    unit: "500g Clay Matka",
    rating: 4.9,
    reviewsCount: 189,
    image: `${import.meta.env.BASE_URL}images/curd.jpg`,
    badge: "Clay Pot Set",
    description: "Naturally set in authentic unglazed clay pots with active heirloom probiotic cultures. Naturally thick, gut-soothing and digestive.",
    inStock: true,
    stockCount: 200,
    labParameters: {
      fatPercentage: "4.8%",
      snfPercentage: "9.1%",
      somaticCellCount: "Pass",
      a2CaseinPurity: "100% A2 Cow Milk",
      probioticCount: "> 2 Billion CFU/g",
      addedWater: "0.00%",
      preservatives: "0.00%",
      chillingTemperature: "4.2°C"
    },
    subscriptionAvailable: true,
    nutritionalInfo: { calories: "62 kcal", protein: "3.6 g", carbs: "4.2 g", fat: "4.5 g", calcium: "140 mg" }
  },
  {
    id: "p5",
    name: "Handcrafted White Makhan Butter",
    category: "Farm Specials",
    price: 210,
    unit: "250g Glass Tub",
    rating: 4.9,
    reviewsCount: 96,
    image: `${import.meta.env.BASE_URL}images/butter.jpg`,
    badge: "Traditional",
    description: "Pure white unsalted butter slow-churned daily from fresh A2 milk cream. Perfect for parathas, hot rotis, and baking.",
    inStock: true,
    stockCount: 60,
    labParameters: {
      fatPercentage: "82.5%",
      snfPercentage: "2.5%",
      somaticCellCount: "Pass",
      a2CaseinPurity: "100% A2 Milk Cream",
      saltContent: "0.00% (Unsalted)",
      addedWater: "15% Natural Moisture",
      preservatives: "0.00%",
      chillingTemperature: "4.0°C"
    },
    subscriptionAvailable: true,
    nutritionalInfo: { calories: "740 kcal", protein: "0.9 g", carbs: "0.6 g", fat: "82.0 g", calcium: "24 mg" }
  }
];

export const seedDeliveries = [
  {
    id: "dist-101",
    customerId: "usr-[#042B1B]-01",
    customerName: "Anita Sharma",
    address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
    phone: "+91 98765 43210",
    quantity: "2 Liters",
    product: "Pure A2 Desi Cow Milk",
    deliverySlot: "5:30 AM - 6:30 AM",
    bottleReturnCount: 2,
    status: "Delivered",
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: "dist-102",
    customerId: "usr-admin-01",
    customerName: "Rajesh Kumar",
    address: "Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk",
    phone: "+91 7022776637",
    quantity: "1 Liter + 1 Matka Curd",
    product: "A2 Milk + Clay Pot Curd",
    deliverySlot: "5:00 AM - 6:00 AM",
    bottleReturnCount: 1,
    status: "In Transit",
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: "dist-103",
    customerId: "usr-cust-02",
    customerName: "Priya Nair",
    address: "House 88, 5th Main, Indiranagar, Bengaluru",
    phone: "+91 97444 33221",
    quantity: "3 Liters",
    product: "Pure A2 Desi Cow Milk",
    deliverySlot: "6:00 AM - 7:00 AM",
    bottleReturnCount: 3,
    status: "Pending",
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: "dist-104",
    customerId: "usr-cust-03",
    customerName: "Vikramaditya Hegde",
    address: "Penthouse 12, Sobha Royal Pavilion, Sarjapur",
    phone: "+91 99000 11223",
    quantity: "2 Liters + 1 Jar Ghee",
    product: "A2 Milk + Bilona Ghee",
    deliverySlot: "5:30 AM - 6:30 AM",
    bottleReturnCount: 2,
    status: "Delivered",
    date: new Date().toISOString().split('T')[0]
  }
];

export const seedTransactions = [
  {
    id: "tx-9901",
    userId: "usr-[#042B1B]-01",
    type: "Recharge",
    amount: 2000,
    description: "Srivari Wallet Instant Top-Up (UPI)",
    timestamp: "2026-09-15 10:30 AM",
    balanceAfter: 2450
  },
  {
    id: "tx-9902",
    userId: "usr-[#042B1B]-01",
    type: "Cashback",
    amount: 10,
    description: "Glass Bottle Return Reward (2 Bottles @ ₹5)",
    timestamp: "2026-09-16 06:15 AM",
    balanceAfter: 2460
  }
];

// Core Database Utility Class
class SrivariDatabase {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(seedUsers));
    }

    // Initialize products if none exist
    if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(seedProducts));
    } else {
      // Migrate old product image paths to the current GitHub Pages path
      const products = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');

      const imageMap = {
        'Pure A2 Desi Cow Milk': 'a2_milk.jpg',
        'Traditional Vedic Bilona Ghee': 'bilona_ghee.jpg',
        'Artisanal Fresh Farm Paneer': 'paneer.jpg',
        'Earthen Pot Fresh A2 Curd': 'curd.jpg',
        'Handcrafted White Makhan Butter': 'butter.jpg'
      };

      const updatedProducts = products.map(product => {
        if (imageMap[product.name]) {
          return {
            ...product,
            image: `${import.meta.env.BASE_URL}images/${imageMap[product.name]}`
          };
        }

        return product;
      });

      localStorage.setItem(
        DB_KEYS.PRODUCTS,
        JSON.stringify(updatedProducts)
      );
    }

    if (!localStorage.getItem(DB_KEYS.DELIVERIES)) {
      localStorage.setItem(DB_KEYS.DELIVERIES, JSON.stringify(seedDeliveries));
    }

    if (!localStorage.getItem(DB_KEYS.TRANSACTIONS)) {
      localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(seedTransactions));
    }
  }

  // --- USERS CRUD ---
  getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  }

  saveUsers(users) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  }

  addUser(user) {
    const users = this.getUsers();
    const newUser = {
      id: `usr-${Date.now()}`,
      status: "Active",
      walletBalance: 1000,
      createdAt: new Date().toISOString().split('T')[0],
      ...user
    };
    users.unshift(newUser);
    this.saveUsers(users);
    this.logAction("USER_CREATED", `Created ${user.role} user: ${user.name}`);
    return newUser;
  }

  updateUser(id, updates) {
    const users = this.getUsers().map(u => u.id === id ? { ...u, ...updates } : u);
    this.saveUsers(users);
    this.logAction("USER_UPDATED", `Updated user ID: ${id}`);
  }

  deleteUser(id) {
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);
    this.logAction("USER_DELETED", `Deleted user ID: ${id}`);
  }

  // --- PRODUCTS CRUD ---
  getProducts() {
    return JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
  }

  saveProducts(products) {
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProd = {
      id: `p-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
      badge: "New Launch",
      inStock: true,
      stockCount: 100,
      subscriptionAvailable: true,
      labParameters: {
        fatPercentage: "4.8%",
        snfPercentage: "8.9%",
        somaticCellCount: "Pass",
        a2CaseinPurity: "100% DNA Certified A2",
        antibiotics: "0.00%",
        addedWater: "0.00%",
        preservatives: "0.00%",
        chillingTemperature: "3.8°C"
      },
      ...product
    };
    products.unshift(newProd);
    this.saveProducts(products);
    this.logAction("PRODUCT_ADDED", `Added product: ${product.name}`);
    return newProd;
  }

  updateProduct(id, updates) {
    const products = this.getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
    this.saveProducts(products);
  }

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  }

  // --- DELIVERIES CRUD ---
  getDeliveries() {
    return JSON.parse(localStorage.getItem(DB_KEYS.DELIVERIES) || '[]');
  }

  saveDeliveries(deliveries) {
    localStorage.setItem(DB_KEYS.DELIVERIES, JSON.stringify(deliveries));
  }

  updateDeliveryStatus(id, status) {
    const deliveries = this.getDeliveries().map(d => d.id === id ? { ...d, status } : d);
    this.saveDeliveries(deliveries);
    this.logAction("DELIVERY_STATUS_CHANGED", `Updated delivery ${id} status to ${status}`);
  }

  // --- AUDIT LOGS ---
  logAction(action, description) {
    const logs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]');
    logs.unshift({
      id: `log-${Date.now()}`,
      action,
      description,
      timestamp: new Date().toLocaleString()
    });
    localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs.slice(0, 50)));
  }

  getLogs() {
    return JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]');
  }

  // --- SYSTEM DUMP & RESTORE ---
  exportBackupJSON() {
    const backupData = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      users: this.getUsers(),
      products: this.getProducts(),
      deliveries: this.getDeliveries(),
      transactions: JSON.parse(localStorage.getItem(DB_KEYS.TRANSACTIONS) || '[]'),
      logs: this.getLogs()
    };
    return JSON.stringify(backupData, null, 2);
  }

  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(data.users));
      if (data.products) localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.deliveries) localStorage.setItem(DB_KEYS.DELIVERIES, JSON.stringify(data.deliveries));
      if (data.transactions) localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      this.logAction("SYSTEM_RESTORE", "Restored database from JSON backup file");
      return true;
    } catch (e) {
      console.error("Failed to restore DB backup", e);
      return false;
    }
  }

  resetToFactoryDefaults() {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(seedUsers));
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(seedProducts));
    localStorage.setItem(DB_KEYS.DELIVERIES, JSON.stringify(seedDeliveries));
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(seedTransactions));
    localStorage.removeItem(DB_KEYS.LOGS);
    this.logAction("FACTORY_RESET", "Reset database to Srivari Milk Farms initial seeds");
  }
}

export const db = new SrivariDatabase();
