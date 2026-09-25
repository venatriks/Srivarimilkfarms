// Srivari Milk Farms - High Performance Database Manager (IndexedDB + LocalStorage Persistence)

const DB_KEYS = {
  USERS: 'srivari_db_users',
  PRODUCTS: 'srivari_db_products',
  SUBSCRIPTIONS: 'srivari_db_subscriptions',
  DELIVERIES: 'srivari_db_deliveries',
  TRANSACTIONS: 'srivari_db_transactions',
  LOGS: 'srivari_db_logs',
  CONTACT_QUERIES: 'srivari_db_contact_queries',
  EMPLOYEES: 'srivari_db_employees',
  ONE_TIME_ORDERS: 'srivari_db_one_time_orders'
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

export const seedOneTimeOrders = [
  {
    id: "OTO-88101",
    customerName: "Kavitha Rao",
    customerEmail: "kavitha.rao@example.com",
    customerPhone: "+91 98450 12345",
    address: "Flat 204, Windmills of Your Mind, EPIP Zone, Whitefield, Bengaluru - 560066",
    deliverySlot: "5:30 AM - 6:30 AM",
    instructions: "Leave at door step inside milk basket",
    items: [
      { name: "Traditional Vedic Bilona Ghee (1L Glass Jar)", quantity: 1, price: 1400 },
      { name: "Artisanal Fresh Farm Paneer (200g Pack)", quantity: 2, price: 140 }
    ],
    totalAmount: 1680,
    paymentMethod: "UPI Instant Pay",
    paymentStatus: "Paid",
    status: "Confirmed",
    orderDate: "2026-09-23",
    created_at: new Date().toISOString()
  },
  {
    id: "OTO-88102",
    customerName: "Suresh Menon",
    customerEmail: "suresh.m@example.com",
    customerPhone: "+91 99012 34567",
    address: "Villa 45, Prestige Ozone, Whitefield, Bengaluru - 560066",
    deliverySlot: "6:30 AM - 7:30 AM",
    instructions: "Call on arrival",
    items: [
      { name: "Earthen Pot Fresh A2 Curd (500g Matka)", quantity: 2, price: 65 },
      { name: "Handcrafted White Makhan Butter (250g Tub)", quantity: 1, price: 210 }
    ],
    totalAmount: 340,
    paymentMethod: "Pay on Morning Delivery",
    paymentStatus: "Pending",
    status: "Processing",
    orderDate: "2026-09-23",
    created_at: new Date().toISOString()
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
        const image = imageMap[product.name]
          ? `${import.meta.env.BASE_URL}images/${imageMap[product.name]}`
          : product.image;

        const nutritionalInfo = {
          protein: product.nutritionalInfo?.protein || '3.4 g',
          calcium: product.nutritionalInfo?.calcium || '125 mg',
          calories: product.nutritionalInfo?.calories || '68 kcal',
          carbs: product.nutritionalInfo?.carbs || '4.8 g',
          fat: product.nutritionalInfo?.fat || '4.6 g',
          ...product.nutritionalInfo
        };

        return {
          ...product,
          image,
          nutritionalInfo
        };
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

    if (!localStorage.getItem(DB_KEYS.ONE_TIME_ORDERS)) {
      localStorage.setItem(DB_KEYS.ONE_TIME_ORDERS, JSON.stringify(seedOneTimeOrders));
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
      nutritionalInfo: {
        calories: "68 kcal",
        protein: "3.4 g",
        carbs: "4.8 g",
        fat: "4.6 g",
        calcium: "125 mg",
        ...(product.nutritionalInfo || {})
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

  // --- CONTACT QUERIES CRUD ---
  getContactQueries() {
    const defaultQueries = [
      {
        id: "query-1001",
        name: "Sunil Varma",
        email: "sunil.v@example.com",
        phone: "+91 98111 22334",
        subject: "Milk Subscription Inquiry",
        message: "Would like to start daily morning 2L A2 milk delivery at Indiranagar from tomorrow.",
        status: "Pending",
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "query-1002",
        name: "Meenakshi Iyer",
        email: "meenakshi@example.com",
        phone: "+91 97222 33445",
        subject: "Weekend Farm Tour Booking",
        message: "Looking to visit Srivari Farm with family this Sunday 8 AM. Please confirm availability.",
        status: "In Progress",
        created_at: new Date(Date.now() - 10800000).toISOString()
      }
    ];

    const saved = localStorage.getItem(DB_KEYS.CONTACT_QUERIES);
    if (!saved) {
      localStorage.setItem(DB_KEYS.CONTACT_QUERIES, JSON.stringify(defaultQueries));
      return defaultQueries;
    }
    return JSON.parse(saved);
  }

  saveContactQueries(queries) {
    localStorage.setItem(DB_KEYS.CONTACT_QUERIES, JSON.stringify(queries));
  }

  saveContactQuery(query) {
    const queries = this.getContactQueries();
    const newQuery = {
      id: query.id || `query-${Date.now()}`,
      status: "Pending",
      created_at: new Date().toISOString(),
      ...query
    };
    queries.unshift(newQuery);
    this.saveContactQueries(queries);
    this.logAction("CONTACT_QUERY_RECEIVED", `New customer query from ${query.name} (${query.email})`);
    return newQuery;
  }

  updateContactQueryStatus(id, status) {
    if (status === 'Completed') {
      this.deleteContactQuery(id);
      this.logAction("CONTACT_QUERY_COMPLETED", `Completed and removed active query ID: ${id}`);
    } else {
      const queries = this.getContactQueries().map(q => q.id === id ? { ...q, status } : q);
      this.saveContactQueries(queries);
      this.logAction("CONTACT_QUERY_UPDATED", `Updated query ID ${id} status to ${status}`);
    }
  }

  // --- EMPLOYEES CRUD ---
  getEmployees() {
    const defaultEmployees = [
      {
        id: "emp-101",
        name: "Ramesh Gowda",
        phone: "+91 98765 11223",
        email: "ramesh.gowda@srivarimilkfarms.com",
        role: "Delivery Agent (Route #4)",
        category: "Delivery Agent",
        address: "D.Hirehal Village, Anantapur Dist, AP",
        joiningDate: "2025-06-15",
        salary: 22000,
        status: "Active"
      },
      {
        id: "emp-102",
        name: "Suresh Patil",
        phone: "+91 97444 88990",
        email: "suresh.p@srivarimilkfarms.com",
        role: "Delivery Agent (Route #1)",
        category: "Delivery Agent",
        address: "Rajeev Nagar, Rayadurg, AP",
        joiningDate: "2025-08-01",
        salary: 20000,
        status: "Active"
      },
      {
        id: "emp-103",
        name: "Dr. Vijay Kumar",
        phone: "+91 99000 44556",
        email: "dr.vijay@srivarimilkfarms.com",
        role: "Quality Inspector & Dairy Specialist",
        category: "Internal Staff",
        address: "Survey 197/A Farm HQ, Rayadurg Taluk",
        joiningDate: "2024-01-10",
        salary: 45000,
        status: "Active"
      },
      {
        id: "emp-104",
        name: "Manjunath B",
        phone: "+91 98450 77112",
        email: "manjunath@srivarimilkfarms.com",
        role: "Farm Operations Manager",
        category: "Internal Staff",
        address: "Anantapur Town, AP",
        joiningDate: "2024-03-15",
        salary: 38000,
        status: "Active"
      }
    ];

    const saved = localStorage.getItem(DB_KEYS.EMPLOYEES);
    if (!saved) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(defaultEmployees));
      return defaultEmployees;
    }
    return JSON.parse(saved);
  }

  saveEmployees(employees) {
    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
  }

  addEmployee(emp) {
    const employees = this.getEmployees();
    const newEmp = {
      id: emp.id || `emp-${Date.now()}`,
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      salary: Number(emp.salary || 20000),
      status: emp.status || "Active",
      ...emp
    };
    employees.unshift(newEmp);
    this.saveEmployees(employees);
    this.logAction("EMPLOYEE_ADDED", `Added employee: ${emp.name} (${emp.category})`);
    return newEmp;
  }

  updateEmployee(id, updates) {
    const employees = this.getEmployees().map(e => e.id === id ? { ...e, ...updates } : e);
    this.saveEmployees(employees);
    this.logAction("EMPLOYEE_UPDATED", `Updated employee ID: ${id}`);
  }

  deleteEmployee(id) {
    const employees = this.getEmployees().filter(e => e.id !== id);
    this.saveEmployees(employees);
    this.logAction("EMPLOYEE_DELETED", `Deleted employee ID: ${id}`);
  }

  // --- ONE-TIME ORDERS CRUD ---
  getOneTimeOrders() {
    const saved = localStorage.getItem(DB_KEYS.ONE_TIME_ORDERS);
    if (!saved) {
      localStorage.setItem(DB_KEYS.ONE_TIME_ORDERS, JSON.stringify(seedOneTimeOrders));
      return seedOneTimeOrders;
    }
    return JSON.parse(saved);
  }

  saveOneTimeOrders(orders) {
    localStorage.setItem(DB_KEYS.ONE_TIME_ORDERS, JSON.stringify(orders));
  }

  addOneTimeOrder(order) {
    const orders = this.getOneTimeOrders();
    const newOrder = {
      id: order.id || `OTO-${Math.floor(10000 + Math.random() * 90000)}`,
      orderDate: order.orderDate || new Date().toISOString().split('T')[0],
      paymentStatus: order.paymentStatus || 'Paid',
      status: order.status || 'Confirmed',
      created_at: new Date().toISOString(),
      ...order
    };
    orders.unshift(newOrder);
    this.saveOneTimeOrders(orders);
    this.logAction("ONE_TIME_ORDER_PLACED", `New one-time order ${newOrder.id} placed for ₹${newOrder.totalAmount}`);
    return newOrder;
  }

  updateOneTimeOrderStatus(id, status) {
    const orders = this.getOneTimeOrders().map(o => o.id === id ? { ...o, status } : o);
    this.saveOneTimeOrders(orders);
    this.logAction("ONE_TIME_ORDER_STATUS_CHANGED", `Updated one-time order ${id} status to ${status}`);
  }

  updateOneTimePaymentStatus(id, paymentStatus) {
    const orders = this.getOneTimeOrders().map(o => o.id === id ? { ...o, paymentStatus } : o);
    this.saveOneTimeOrders(orders);
    this.logAction("ONE_TIME_ORDER_PAYMENT_CHANGED", `Updated one-time order ${id} payment status to ${paymentStatus}`);
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
      queries: this.getContactQueries(),
      employees: this.getEmployees(),
      oneTimeOrders: this.getOneTimeOrders(),
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
      if (data.queries) localStorage.setItem(DB_KEYS.CONTACT_QUERIES, JSON.stringify(data.queries));
      if (data.employees) localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(data.employees));
      if (data.oneTimeOrders) localStorage.setItem(DB_KEYS.ONE_TIME_ORDERS, JSON.stringify(data.oneTimeOrders));
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
    localStorage.setItem(DB_KEYS.ONE_TIME_ORDERS, JSON.stringify(seedOneTimeOrders));
    localStorage.removeItem(DB_KEYS.CONTACT_QUERIES);
    localStorage.removeItem(DB_KEYS.EMPLOYEES);
    localStorage.removeItem(DB_KEYS.LOGS);
    this.logAction("FACTORY_RESET", "Reset database to Srivari Milk Farms initial seeds");
  }
}

export const db = new SrivariDatabase();
