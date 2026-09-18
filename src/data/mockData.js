export const initialProducts = [
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
    nutritionalInfo: {
      calories: "68 kcal",
      protein: "3.4 g",
      carbs: "4.8 g",
      fat: "4.6 g",
      calcium: "125 mg"
    }
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
    nutritionalInfo: {
      calories: "898 kcal",
      protein: "0.0 g",
      carbs: "0.0 g",
      fat: "99.8 g",
      calcium: "5 mg"
    }
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
    nutritionalInfo: {
      calories: "265 kcal",
      protein: "18.5 g",
      carbs: "2.1 g",
      fat: "20.8 g",
      calcium: "208 mg"
    }
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
    nutritionalInfo: {
      calories: "62 kcal",
      protein: "3.6 g",
      carbs: "4.2 g",
      fat: "4.5 g",
      calcium: "140 mg"
    }
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
    nutritionalInfo: {
      calories: "740 kcal",
      protein: "0.9 g",
      carbs: "0.6 g",
      fat: "82.0 g",
      calcium: "24 mg"
    }
  }
];

export const initialTestimonials = [
  {
    id: 1,
    name: "Dr. Ananya Vasudevan",
    role: "Pediatrician & Mother",
    location: "Bengaluru",
    rating: 5,
    comment: "Switching to Srivari's A2 milk was the best decision for my toddlers. The milk has a rich, sweet creaminess and zero digestive issues compared to store packets. The 5 AM glass bottle delivery is incredibly punctual!",
    avatar: "https://images.unsplash.com/photo-1594824813566-88855ce78961?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 2,
    name: "Suresh & Meena R.",
    role: "Regular Subscriber (2 Years)",
    location: "Mysuru",
    rating: 5,
    comment: "The Vedic Bilona Ghee smells exactly like the ghee my grandmother made in our ancestral village. The quality testing reports giving exact fat and SNF percentages give us 100% confidence.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 3,
    name: "Kavitha Sharma",
    role: "Nutritionist & Fitness Coach",
    location: "Bengaluru",
    rating: 5,
    comment: "Their farm paneer is unbelievably soft and fresh! 18.5 grams of clean A2 protein per 100g with no synthetic coagulation agents. Highly recommend Srivari Milk Farms.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
  }
];

export const initialDistributionList = [
  {
    id: "dist-101",
    customerName: "Anita Sharma",
    address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
    phone: "+91 98765 43210",
    quantity: "2 Liters",
    product: "Pure A2 Desi Cow Milk",
    deliverySlot: "5:30 AM - 6:30 AM",
    bottleReturnCount: 2,
    status: "Delivered"
  },
  {
    id: "dist-102",
    customerName: "Rajesh Kumar",
    address: "Villa 14, Palm Meadows, Whitefield, Bengaluru",
    phone: "+91 98123 45678",
    quantity: "1 Liter + 1 Matka Curd",
    product: "A2 Milk + Clay Pot Curd",
    deliverySlot: "5:00 AM - 6:00 AM",
    bottleReturnCount: 1,
    status: "In Transit"
  },
  {
    id: "dist-103",
    customerName: "Priya Nair",
    address: "House 88, 5th Main, Indiranagar, Bengaluru",
    phone: "+91 97444 33221",
    quantity: "3 Liters",
    product: "Pure A2 Desi Cow Milk",
    deliverySlot: "6:00 AM - 7:00 AM",
    bottleReturnCount: 3,
    status: "Pending"
  },
  {
    id: "dist-104",
    customerName: "Vikramaditya Hegde",
    address: "Penthouse 12, Sobha Royal Pavilion, Sarjapur",
    phone: "+91 99000 11223",
    quantity: "2 Liters + 1 Jar Ghee",
    product: "A2 Milk + Bilona Ghee",
    deliverySlot: "5:30 AM - 6:30 AM",
    bottleReturnCount: 2,
    status: "Delivered"
  }
];
