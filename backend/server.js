require('dotenv').config(); // Load environment variables
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const productsPart1 = require('./products_part1');
const productsPart2 = require('./products_part2');

// MySQL Database Connection Pool
const mysqlPool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shopwave_secret_key_2024_ultra_secure';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ==================== IN-MEMORY DATABASE ====================
const db = {
  users: [
    {
      id: 'admin-001',
      name: 'Admin',
      email: 'admin@shopwave.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      avatar: null,
      addresses: [{ id: 'addr-1', label: 'Office', street: '123 Tech Park', city: 'Bangalore', state: 'Karnataka', zip: '560001', phone: '9876543210', isDefault: true }],
      createdAt: new Date('2024-01-01'),
      blocked: false
    },
    {
      id: 'user-001',
      name: 'John Doe',
      email: 'john@example.com',
      password: bcrypt.hashSync('user123', 10),
      role: 'user',
      avatar: null,
      addresses: [{ id: 'addr-2', label: 'Home', street: '456 MG Road', city: 'Mumbai', state: 'Maharashtra', zip: '400001', phone: '9876543211', isDefault: true }],
      createdAt: new Date('2024-02-15'),
      blocked: false
    }
  ],

  categories: [
    { id: 'cat-1', name: 'Electronics', icon: '💻', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
    { id: 'cat-2', name: 'Fashion', icon: '👗', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
    { id: 'cat-3', name: 'Home & Living', icon: '🏠', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { id: 'cat-4', name: 'Sports', icon: '⚽', image: 'https://images.unsplash.com/photo-1461896836934-bd45ba24e62c?w=400' },
    { id: 'cat-5', name: 'Books', icon: '📚', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
    { id: 'cat-6', name: 'Beauty', icon: '💄', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
    { id: 'cat-7', name: 'Groceries', icon: '🛒', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' },
    { id: 'cat-8', name: 'Toys', icon: '🧸', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400' },
    { id: 'cat-9', name: 'Gaming Zone', icon: '🎮', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
    { id: 'cat-10', name: 'Fitness & Health', icon: '🏋️', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400' },
    { id: 'cat-11', name: 'Accessories', icon: '🎒', image: 'https://images.unsplash.com/photo-1523206489230-c012c64b6b48?w=400' }
  ],

  products: generateProducts(),

  carts: {},
  wishlists: {},
  orders: [],
  reviews: [],
  coupons: [
    { code: 'WELCOME10', discount: 10, type: 'percent', minOrder: 500, maxDiscount: 200, active: true, usageLimit: 100, usedCount: 0 },
    { code: 'FLAT50', discount: 50, type: 'flat', minOrder: 1000, maxDiscount: 50, active: true, usageLimit: 50, usedCount: 0 },
    { code: 'SAVE20', discount: 20, type: 'percent', minOrder: 2000, maxDiscount: 500, active: true, usageLimit: 200, usedCount: 0 },
    { code: 'MEGA100', discount: 100, type: 'flat', minOrder: 3000, maxDiscount: 100, active: true, usageLimit: 30, usedCount: 0 }
  ],
  notifications: [],
  chatHistory: {},
  browsingHistory: {},
  salesData: generateSalesData(),
  returnRequests: []
};

function generateProducts() {
  const products = [
    // Electronics
    { id: 'prod-001', name: 'MacBook Pro 16"', category: 'cat-1', brand: 'Apple', price: 249999, originalPrice: 279999, description: 'Apple M3 Pro chip, 18GB RAM, 512GB SSD. The most advanced MacBook Pro ever with stunning Liquid Retina XDR display.', images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], stock: 25, rating: 4.8, ratingCount: 342, featured: true, tags: ['laptop', 'apple', 'premium'] },
    { id: 'prod-002', name: 'iPhone 15 Pro Max', category: 'cat-1', brand: 'Apple', price: 159999, originalPrice: 169999, description: 'A17 Pro chip, 256GB, Titanium design. Pro camera system with 48MP main camera.', images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'], stock: 50, rating: 4.7, ratingCount: 1205, featured: true, tags: ['smartphone', 'apple', 'premium'] },
    { id: 'prod-003', name: 'Sony WH-1000XM5', category: 'cat-1', brand: 'Sony', price: 29999, originalPrice: 34999, description: 'Industry-leading noise canceling headphones with Auto NC Optimizer and crystal clear hands-free calling.', images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600'], stock: 100, rating: 4.6, ratingCount: 890, featured: true, tags: ['headphones', 'sony', 'audio'] },
    { id: 'prod-004', name: 'Samsung Galaxy S24 Ultra', category: 'cat-1', brand: 'Samsung', price: 134999, originalPrice: 144999, description: 'Galaxy AI built-in, 200MP camera, S Pen, Titanium frame. The ultimate Galaxy experience.', images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'], stock: 40, rating: 4.5, ratingCount: 567, featured: false, tags: ['smartphone', 'samsung', 'android'] },
    { id: 'prod-005', name: 'iPad Air M2', category: 'cat-1', brand: 'Apple', price: 74999, originalPrice: 79999, description: 'Supercharged by M2 chip, 11-inch Liquid Retina display, supports Apple Pencil Pro.', images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'], stock: 60, rating: 4.7, ratingCount: 234, featured: false, tags: ['tablet', 'apple', 'ipad'] },
    { id: 'prod-006', name: 'Dell XPS 15', category: 'cat-1', brand: 'Dell', price: 189999, originalPrice: 209999, description: 'Intel Core i9, 32GB RAM, 1TB SSD, NVIDIA RTX 4060. InfinityEdge 3.5K OLED display.', images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600'], stock: 15, rating: 4.4, ratingCount: 178, featured: false, tags: ['laptop', 'dell', 'windows'] },
    { id: 'prod-007', name: 'AirPods Pro 2', category: 'cat-1', brand: 'Apple', price: 24999, originalPrice: 26999, description: 'Active Noise Cancellation, Adaptive Transparency, Personalized Spatial Audio with dynamic head tracking.', images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'], stock: 200, rating: 4.6, ratingCount: 2100, featured: true, tags: ['earbuds', 'apple', 'audio'] },
    { id: 'prod-008', name: 'PlayStation 5', category: 'cat-1', brand: 'Sony', price: 49999, originalPrice: 54999, description: 'Lightning-fast loading, stunning 4K graphics, haptic feedback, adaptive triggers. The future of gaming.', images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'], stock: 30, rating: 4.8, ratingCount: 3400, featured: true, tags: ['gaming', 'console', 'sony'] },

    // Fashion
    { id: 'prod-009', name: 'Premium Leather Jacket', category: 'cat-2', brand: 'Zara', price: 12999, originalPrice: 17999, description: 'Genuine leather biker jacket with quilted lining. Classic style meets modern comfort.', images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'], stock: 35, rating: 4.3, ratingCount: 89, featured: true, tags: ['jacket', 'leather', 'men'] },
    { id: 'prod-010', name: 'Designer Sneakers', category: 'cat-2', brand: 'Nike', price: 14999, originalPrice: 18999, description: 'Nike Air Max 270 React. Incredibly soft, amazingly comfortable. Bold design meets all-day comfort.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'], stock: 80, rating: 4.5, ratingCount: 456, featured: true, tags: ['shoes', 'sneakers', 'nike'] },
    { id: 'prod-011', name: 'Silk Evening Dress', category: 'cat-2', brand: 'H&M', price: 8999, originalPrice: 12999, description: 'Elegant silk evening dress with v-neckline. Perfect for special occasions and formal events.', images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'], stock: 20, rating: 4.4, ratingCount: 67, featured: false, tags: ['dress', 'women', 'formal'] },
    { id: 'prod-012', name: 'Classic Chronograph Watch', category: 'cat-2', brand: 'Fossil', price: 15999, originalPrice: 19999, description: 'Stainless steel chronograph with genuine leather strap. Water resistant to 50m.', images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'], stock: 45, rating: 4.6, ratingCount: 234, featured: true, tags: ['watch', 'accessories', 'men'] },
    { id: 'prod-013', name: 'Ray-Ban Aviator Sunglasses', category: 'cat-2', brand: 'Ray-Ban', price: 8499, originalPrice: 12999, description: 'Classic aviator sunglasses with polarized lenses. UV400 protection. Timeless style.', images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'], stock: 120, rating: 4.7, ratingCount: 890, featured: false, tags: ['sunglasses', 'accessories', 'unisex'] },

    // Home & Living
    { id: 'prod-014', name: 'Smart Home Speaker', category: 'cat-3', brand: 'Google', price: 9999, originalPrice: 12999, description: 'Google Nest Hub Max. Smart display with Google Assistant, video calling, and smart home control.', images: ['https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=600'], stock: 70, rating: 4.3, ratingCount: 345, featured: false, tags: ['smart-home', 'speaker', 'google'] },
    { id: 'prod-015', name: 'Luxury Bed Set', category: 'cat-3', brand: 'HomeTown', price: 6999, originalPrice: 9999, description: '100% Egyptian cotton, 400 thread count. King size bedsheet set with 2 pillow covers.', images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'], stock: 50, rating: 4.5, ratingCount: 123, featured: false, tags: ['bedding', 'home', 'luxury'] },
    { id: 'prod-016', name: 'Robot Vacuum Cleaner', category: 'cat-3', brand: 'iRobot', price: 34999, originalPrice: 44999, description: 'Roomba j7+ with automatic dirt disposal. Smart mapping, obstacle avoidance, and app control.', images: ['https://images.unsplash.com/photo-1589923158776-cb4485d99fd6?w=600'], stock: 25, rating: 4.4, ratingCount: 278, featured: true, tags: ['vacuum', 'robot', 'smart-home'] },

    // Sports
    { id: 'prod-017', name: 'Pro Yoga Mat', category: 'cat-4', brand: 'Nike', price: 3999, originalPrice: 5999, description: 'Premium 6mm thick yoga mat with anti-slip surface. Eco-friendly TPE material with alignment lines.', images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'], stock: 150, rating: 4.6, ratingCount: 567, featured: false, tags: ['yoga', 'fitness', 'mat'] },
    { id: 'prod-018', name: 'Smart Fitness Band', category: 'cat-4', brand: 'Fitbit', price: 12999, originalPrice: 15999, description: 'Fitbit Charge 6. Advanced health tracking, built-in GPS, stress management, and 7-day battery.', images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600'], stock: 90, rating: 4.3, ratingCount: 1234, featured: true, tags: ['fitness', 'wearable', 'smartwatch'] },
    { id: 'prod-019', name: 'Carbon Fiber Tennis Racket', category: 'cat-4', brand: 'Wilson', price: 18999, originalPrice: 24999, description: 'Wilson Pro Staff RF97. Carbon fiber frame, 97 sq inch head, ideal for advanced players.', images: ['https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600'], stock: 30, rating: 4.7, ratingCount: 89, featured: false, tags: ['tennis', 'racket', 'sports'] },

    // Books
    { id: 'prod-020', name: 'The Art of Programming', category: 'cat-5', brand: 'Penguin', price: 699, originalPrice: 999, description: 'A comprehensive guide to mastering programming concepts. Best-seller with 500+ pages of knowledge.', images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'], stock: 300, rating: 4.8, ratingCount: 2345, featured: true, tags: ['programming', 'tech', 'education'] },
    { id: 'prod-021', name: 'Atomic Habits', category: 'cat-5', brand: 'Random House', price: 499, originalPrice: 799, description: 'By James Clear. An easy & proven way to build good habits & break bad ones. #1 New York Times bestseller.', images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600'], stock: 500, rating: 4.9, ratingCount: 5678, featured: true, tags: ['self-help', 'habits', 'bestseller'] },

    // Beauty
    { id: 'prod-022', name: 'Luxury Skincare Set', category: 'cat-6', brand: 'Lakme', price: 4999, originalPrice: 7999, description: 'Complete skincare routine: cleanser, toner, serum, moisturizer, and sunscreen. Dermatologist recommended.', images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600'], stock: 80, rating: 4.4, ratingCount: 345, featured: false, tags: ['skincare', 'beauty', 'women'] },
    { id: 'prod-023', name: 'Premium Perfume Collection', category: 'cat-6', brand: 'Dior', price: 8999, originalPrice: 12999, description: 'Dior Sauvage Eau de Parfum 100ml. Wild, noble, and magnetic. A fresh and raw scent.', images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'], stock: 60, rating: 4.7, ratingCount: 890, featured: true, tags: ['perfume', 'luxury', 'unisex'] },

    // Groceries
    { id: 'prod-024', name: 'Organic Honey Bundle', category: 'cat-7', brand: 'Nature\'s Best', price: 1299, originalPrice: 1799, description: 'Raw, unprocessed organic honey. Pack of 3 (500g each). Sourced from Himalayan apiaries.', images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600'], stock: 200, rating: 4.5, ratingCount: 456, featured: false, tags: ['organic', 'honey', 'healthy'] },

    // Toys
    { id: 'prod-025', name: 'LEGO Space Station', category: 'cat-8', brand: 'LEGO', price: 7999, originalPrice: 9999, description: 'LEGO Creator Expert International Space Station. 864 pieces. Ages 16+. Build and display.', images: ['https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600'], stock: 40, rating: 4.8, ratingCount: 567, featured: true, tags: ['lego', 'building', 'space'] },

    // More Electronics
    { id: 'prod-026', name: 'LG 55" OLED TV', category: 'cat-1', brand: 'LG', price: 129999, originalPrice: 149999, description: 'LG C3 OLED evo 4K Smart TV. Self-lit pixels, Dolby Vision & Atmos, webOS 23, Gaming features.', images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], stock: 20, rating: 4.7, ratingCount: 456, featured: true, tags: ['tv', 'oled', 'entertainment'] },
    { id: 'prod-027', name: 'Canon EOS R6 II', category: 'cat-1', brand: 'Canon', price: 219999, originalPrice: 249999, description: '24.2MP Full-Frame CMOS, 4K 60p Video, Up to 40fps, Dual Pixel AF II. Professional mirrorless camera.', images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'], stock: 10, rating: 4.8, ratingCount: 123, featured: false, tags: ['camera', 'photography', 'canon'] },
    { id: 'prod-028', name: 'Mechanical Gaming Keyboard', category: 'cat-1', brand: 'Corsair', price: 15999, originalPrice: 19999, description: 'Corsair K95 RGB Platinum XT. Cherry MX Speed switches, per-key RGB, aircraft-grade aluminum frame.', images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600'], stock: 55, rating: 4.5, ratingCount: 789, featured: false, tags: ['keyboard', 'gaming', 'mechanical'] },

    // More Fashion
    { id: 'prod-029', name: 'Premium Denim Jeans', category: 'cat-2', brand: 'Levi\'s', price: 4999, originalPrice: 6999, description: 'Levi\'s 501 Original Fit. Premium selvedge denim, button fly, straight leg. A timeless classic.', images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'], stock: 100, rating: 4.4, ratingCount: 1567, featured: false, tags: ['jeans', 'denim', 'men'] },
    { id: 'prod-030', name: 'Designer Handbag', category: 'cat-2', brand: 'Coach', price: 34999, originalPrice: 44999, description: 'Coach Tabby Shoulder Bag 26. Polished pebble leather, brass hardware, signature interior.', images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'], stock: 15, rating: 4.6, ratingCount: 234, featured: true, tags: ['bag', 'handbag', 'women', 'luxury'] },

    // Fashion additions
    { id: 'prod-100', name: 'Oversized Graphic T-Shirt', category: 'cat-2', brand: 'UrbanCulture', price: 1499, originalPrice: 2499, description: 'Premium cotton oversized t-shirt with modern streetwear graphic.', images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'], stock: 50, rating: 4.5, ratingCount: 120, featured: false, tags: ['fashion', 'tshirt', 'oversized'] },
    { id: 'prod-101', name: 'Streetwear Cargo Pants', category: 'cat-2', brand: 'StreetX', price: 2999, originalPrice: 3999, description: 'Utility streetwear cargo pants with multiple pockets and adjustable cuffs.', images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600'], stock: 40, rating: 4.6, ratingCount: 85, featured: false, tags: ['fashion', 'streetwear', 'pants'] },
    { id: 'prod-102', name: 'Limited Edition Sneakers 👟', category: 'cat-2', brand: 'Nike', price: 24999, originalPrice: 29999, description: 'Exclusive drop limited edition sneakers with premium cushioning.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'], stock: 10, rating: 4.9, ratingCount: 340, featured: true, tags: ['shoes', 'sneakers', 'limited'] },
    { id: 'prod-103', name: 'Smart Heated Jacket', category: 'cat-2', brand: 'TechWear', price: 8999, originalPrice: 12999, description: 'Smart jacket with built-in temperature control and power bank support.', images: ['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600'], stock: 25, rating: 4.7, ratingCount: 56, featured: true, tags: ['jacket', 'smart', 'winter'] },
    { id: 'prod-104', name: 'Pro Gym Outfit Set', category: 'cat-2', brand: 'GymShark', price: 3499, originalPrice: 4999, description: 'Breathable, moisture-wicking fitness wear complete set for intense workouts.', images: ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600'], stock: 60, rating: 4.4, ratingCount: 200, featured: false, tags: ['fitness', 'gym', 'wear'] },
    { id: 'prod-105', name: 'Custom Printed Hoodie', category: 'cat-2', brand: 'PrintCraft', price: 1999, originalPrice: 2999, description: 'High-quality custom printed clothing. Soft fleece inside.', images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'], stock: 100, rating: 4.3, ratingCount: 150, featured: false, tags: ['hoodie', 'custom', 'printed'] },

    // Home & Smart Living
    { id: 'prod-106', name: 'Smart WiFi LED Lights', category: 'cat-3', brand: 'Philips', price: 2999, originalPrice: 3999, description: 'App-controlled smart LED color-changing bulbs. Works with Alexa and Google Home.', images: ['https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600'], stock: 150, rating: 4.5, ratingCount: 420, featured: false, tags: ['smart-home', 'lights', 'led'] },
    { id: 'prod-107', name: 'Robot Vacuum Cleaner 🤖', category: 'cat-3', brand: 'Xiaomi', price: 24999, originalPrice: 30000, description: 'Smart robot vacuum with LiDAR navigation and mopping function.', images: ['https://images.unsplash.com/photo-1589923158776-cb4485d99fd6?w=600'], stock: 35, rating: 4.6, ratingCount: 215, featured: true, tags: ['vacuum', 'robot', 'cleaning'] },
    { id: 'prod-108', name: 'HEPA Air Purifier', category: 'cat-3', brand: 'Dyson', price: 39999, originalPrice: 45000, description: 'Advanced air purifier capturing 99.97% of allergens and pollutants.', images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'], stock: 20, rating: 4.8, ratingCount: 310, featured: true, tags: ['purifier', 'air', 'health'] },
    { id: 'prod-109', name: 'Foldable Space-saving Desk', category: 'cat-3', brand: 'IKEA', price: 4999, originalPrice: 6999, description: 'Minimalist foldable furniture, perfect for small apartments and home offices.', images: ['https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600'], stock: 45, rating: 4.2, ratingCount: 88, featured: false, tags: ['furniture', 'desk', 'foldable'] },
    { id: 'prod-110', name: 'Minimalist Ceramic Vase', category: 'cat-3', brand: 'HomeDecor', price: 999, originalPrice: 1499, description: 'Elegant minimalist decor item to elevate your living space.', images: ['https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600'], stock: 80, rating: 4.4, ratingCount: 120, featured: false, tags: ['decor', 'minimalist', 'vase'] },
    { id: 'prod-111', name: 'Live Monstera Plant 🌱', category: 'cat-3', brand: 'GreenSpace', price: 1299, originalPrice: 1999, description: 'Beautiful indoor plant to purify air and add life to your room.', images: ['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600'], stock: 60, rating: 4.7, ratingCount: 300, featured: false, tags: ['plant', 'indoor', 'green'] },

    // Beauty
    { id: 'prod-112', name: 'Organic Skincare Kit', category: 'cat-6', brand: 'Mamaearth', price: 1999, originalPrice: 2499, description: '100% natural organic skincare kit including face wash, serum, and moisturizer.', images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600'], stock: 90, rating: 4.5, ratingCount: 450, featured: false, tags: ['skincare', 'organic', 'beauty'] },
    { id: 'prod-113', name: 'Hair Growth Serum', category: 'cat-6', brand: 'Minimalist', price: 799, originalPrice: 999, description: 'Clinically proven hair growth serum for thicker, fuller hair.', images: ['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600'], stock: 150, rating: 4.3, ratingCount: 800, featured: false, tags: ['hair', 'serum', 'care'] },
    { id: 'prod-114', name: 'Premium Grooming Kit', category: 'cat-6', brand: 'Bombay Shaving Co', price: 2499, originalPrice: 3499, description: 'Complete grooming kit for men and women with precision tools.', images: ['https://images.unsplash.com/photo-1621607512214-68297480165e?w=600'], stock: 75, rating: 4.6, ratingCount: 220, featured: false, tags: ['grooming', 'kit', 'personal-care'] },
    { id: 'prod-115', name: 'Oud Wood Luxury Perfume', category: 'cat-6', brand: 'Tom Ford', price: 21999, originalPrice: 24999, description: 'Exotic, distinct, and rare luxury brand perfume.', images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'], stock: 30, rating: 4.9, ratingCount: 150, featured: true, tags: ['perfume', 'luxury', 'fragrance'] },
    { id: 'prod-116', name: 'Pro Electric Trimmer', category: 'cat-6', brand: 'Philips', price: 1899, originalPrice: 2499, description: 'Precision electric trimmer with self-sharpening blades and 90 min battery.', images: ['https://images.unsplash.com/photo-1621607512214-68297480165e?w=600'], stock: 120, rating: 4.4, ratingCount: 950, featured: false, tags: ['trimmer', 'grooming', 'electric'] },

    // Gaming Zone
    { id: 'prod-117', name: 'Nintendo Switch OLED', category: 'cat-9', brand: 'Nintendo', price: 34999, originalPrice: 39999, description: 'Versatile gaming console with vibrant 7-inch OLED screen.', images: ['https://images.unsplash.com/photo-1617096200347-cb04ae810b1d?w=600'], stock: 40, rating: 4.8, ratingCount: 1200, featured: true, tags: ['gaming', 'console', 'nintendo'] },
    { id: 'prod-118', name: 'Xbox Wireless Controller', category: 'cat-9', brand: 'Microsoft', price: 5499, originalPrice: 5999, description: 'Ergonomic gaming controller with textured grip and Bluetooth.', images: ['https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600'], stock: 100, rating: 4.7, ratingCount: 2500, featured: false, tags: ['gaming', 'controller', 'xbox'] },
    { id: 'prod-119', name: 'Ergonomic Gaming Chair', category: 'cat-9', brand: 'Secretlab', price: 39999, originalPrice: 45999, description: 'Premium gaming chair with lumbar support and memory foam pillows.', images: ['https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600'], stock: 15, rating: 4.9, ratingCount: 430, featured: true, tags: ['gaming', 'chair', 'furniture'] },
    { id: 'prod-120', name: 'RGB Light Strips', category: 'cat-9', brand: 'Govee', price: 2999, originalPrice: 3999, description: 'Sync your room lighting with your gameplay. Wi-Fi gaming RGB accessories.', images: ['https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=600'], stock: 200, rating: 4.5, ratingCount: 890, featured: false, tags: ['gaming', 'rgb', 'lights'] },
    { id: 'prod-121', name: 'Meta Quest 3 VR Headset', category: 'cat-9', brand: 'Meta', price: 49999, originalPrice: 54999, description: 'Advanced VR headset for immersive mixed reality gaming experiences.', images: ['https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600'], stock: 25, rating: 4.8, ratingCount: 310, featured: true, tags: ['vr', 'gaming', 'headset'] },

    // Fitness & Health
    { id: 'prod-122', name: 'Adjustable Dumbbells Set', category: 'cat-10', brand: 'Bowflex', price: 19999, originalPrice: 24999, description: 'Space-saving dumbbells set with adjustable weights up to 24kg each.', images: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600'], stock: 30, rating: 4.7, ratingCount: 650, featured: true, tags: ['fitness', 'dumbbells', 'workout'] },
    { id: 'prod-123', name: 'Garmin Forerunner Tracker', category: 'cat-10', brand: 'Garmin', price: 29999, originalPrice: 35999, description: 'Advanced smart fitness tracker for running and swimming.', images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'], stock: 45, rating: 4.8, ratingCount: 1100, featured: false, tags: ['fitness', 'tracker', 'smartwatch'] },
    { id: 'prod-124', name: 'Eco-friendly Yoga Mat', category: 'cat-10', brand: 'Lululemon', price: 5999, originalPrice: 7999, description: 'Reversible, extra thick yoga mat with supreme grip.', images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'], stock: 120, rating: 4.6, ratingCount: 520, featured: false, tags: ['yoga', 'mat', 'fitness'] },
    { id: 'prod-125', name: 'Whey Protein Isolate', category: 'cat-10', brand: 'Optimum Nutrition', price: 6499, originalPrice: 7999, description: 'High-quality protein supplements for muscle recovery and growth.', images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600'], stock: 200, rating: 4.8, ratingCount: 3400, featured: true, tags: ['protein', 'supplement', 'fitness'] },
    { id: 'prod-126', name: 'Percussion Muscle Massager', category: 'cat-10', brand: 'Theragun', price: 24999, originalPrice: 29999, description: 'Deep tissue massager for rapid muscle recovery.', images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600'], stock: 40, rating: 4.9, ratingCount: 410, featured: false, tags: ['massager', 'recovery', 'health'] },

    // Accessories & Daily Use
    { id: 'prod-127', name: 'Anti-Theft Backpack 🎒', category: 'cat-11', brand: 'XD Design', price: 4499, originalPrice: 5999, description: 'Secure backpack with hidden zippers, USB charging port, and water-resistant fabric.', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'], stock: 85, rating: 4.5, ratingCount: 780, featured: true, tags: ['backpack', 'anti-theft', 'accessories'] },
    { id: 'prod-128', name: 'Polarized Aviator Sunglasses 😎', category: 'cat-11', brand: 'Oakley', price: 8999, originalPrice: 11999, description: 'Stylish polarized sunglasses offering 100% UV protection.', images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600'], stock: 150, rating: 4.6, ratingCount: 650, featured: false, tags: ['sunglasses', 'accessories', 'eyewear'] },
    { id: 'prod-129', name: 'Minimalist Leather Wallet', category: 'cat-11', brand: 'Bellroy', price: 3499, originalPrice: 4999, description: 'Slim leather wallet with RFID protection and quick-access card slots.', images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=600'], stock: 110, rating: 4.7, ratingCount: 420, featured: false, tags: ['wallet', 'leather', 'accessories'] },
    { id: 'prod-130', name: '20000mAh Fast Charge Power Bank', category: 'cat-11', brand: 'Anker', price: 4999, originalPrice: 5999, description: 'High-capacity power bank with USB-C PD fast charging.', images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600'], stock: 250, rating: 4.8, ratingCount: 1800, featured: true, tags: ['powerbank', 'electronics', 'accessories'] },
    { id: 'prod-131', name: 'MagSafe Silicone Phone Case', category: 'cat-11', brand: 'Spigen', price: 1499, originalPrice: 1999, description: 'Protective phone case with strong magnets for fast wireless charging.', images: ['https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=600'], stock: 300, rating: 4.5, ratingCount: 950, featured: false, tags: ['case', 'phone', 'accessories'] },

    // More Electronics
    { id: 'prod-132', name: 'Sony Bravia 65" 4K HDR TV', category: 'cat-1', brand: 'Sony', price: 119999, originalPrice: 159999, description: 'Premium 4K Ultra HD Smart LED Android TV with stunning colors and sound.', images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], stock: 15, rating: 4.8, ratingCount: 520, featured: true, tags: ['tv', 'television', '4k'] },
    { id: 'prod-133', name: 'Galaxy Buds2 Pro', category: 'cat-1', brand: 'Samsung', price: 14999, originalPrice: 17999, description: 'True wireless Bluetooth earbuds with active noise cancellation.', images: ['https://images.unsplash.com/photo-1606220838315-056192d5e927?w=600'], stock: 85, rating: 4.6, ratingCount: 890, featured: false, tags: ['audio', 'earbuds', 'wireless'] },
    { id: 'prod-134', name: 'Apple Watch Series 9', category: 'cat-1', brand: 'Apple', price: 41900, originalPrice: 44900, description: 'Advanced health, fitness, and safety features. Blood oxygen and ECG apps.', images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600'], stock: 50, rating: 4.9, ratingCount: 1500, featured: true, tags: ['watch', 'smartwatch', 'wearable'] },
    { id: 'prod-135', name: 'Nikon D850 DSLR', category: 'cat-1', brand: 'Nikon', price: 239999, originalPrice: 269999, description: '45.7 megapixels of extreme resolution, outstanding dynamic range, and fast continuous shooting.', images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'], stock: 12, rating: 4.8, ratingCount: 310, featured: false, tags: ['camera', 'dslr', 'photography'] },
    { id: 'prod-136', name: 'GoPro HERO12 Black', category: 'cat-1', brand: 'GoPro', price: 34990, originalPrice: 40990, description: 'Incredible 5.3K video, HyperSmooth 6.0 video stabilization, and rugged waterproof design.', images: ['https://images.unsplash.com/photo-1487537708890-23a1f0bf9cd2?w=600'], stock: 65, rating: 4.7, ratingCount: 1120, featured: false, tags: ['camera', 'action', 'video'] },
    { id: 'prod-137', name: 'JBL Charge 5', category: 'cat-1', brand: 'JBL', price: 13999, originalPrice: 15999, description: 'Portable Bluetooth speaker with deep bass, IP67 waterproof and built-in powerbank.', images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'], stock: 120, rating: 4.6, ratingCount: 3400, featured: true, tags: ['speaker', 'audio', 'bluetooth'] },
    { id: 'prod-138', name: 'Kindle Paperwhite', category: 'cat-1', brand: 'Amazon', price: 13999, originalPrice: 14999, description: 'Now with a 6.8" display, adjustable warm light, and up to 10 weeks of battery life.', images: ['https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600'], stock: 200, rating: 4.9, ratingCount: 5600, featured: false, tags: ['kindle', 'ereader', 'reading'] },
    { id: 'prod-139', name: 'ASUS ROG Swift 27" 1440p', category: 'cat-1', brand: 'ASUS', price: 45999, originalPrice: 52999, description: '27-inch WQHD IPS gaming monitor with super-fast 165Hz refresh rate.', images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'], stock: 30, rating: 4.7, ratingCount: 450, featured: false, tags: ['monitor', 'gaming', 'display'] },
    { id: 'prod-140', name: 'SanDisk 1TB Extreme Portable SSD', category: 'cat-1', brand: 'SanDisk', price: 8999, originalPrice: 14999, description: 'High-speed NVMe solid state performance with read speeds up to 1050MB/s.', images: ['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600'], stock: 100, rating: 4.8, ratingCount: 2200, featured: true, tags: ['ssd', 'storage', 'portable'] },
    { id: 'prod-141', name: 'NVIDIA GeForce RTX 4090', category: 'cat-1', brand: 'NVIDIA', price: 179999, originalPrice: 199999, description: 'The ultimate GeForce GPU for gaming, delivering massive leaps in performance and DLSS 3.', images: ['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600'], stock: 5, rating: 4.9, ratingCount: 156, featured: true, tags: ['gpu', 'graphics', 'gaming'] },
    { id: 'prod-142', name: 'Galaxy Tab S9', category: 'cat-1', brand: 'Samsung', price: 72999, originalPrice: 75999, description: 'Dynamic AMOLED 2X display, water and dust resistant, included S Pen.', images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'], stock: 40, rating: 4.8, ratingCount: 890, featured: false, tags: ['tablet', 'samsung', 'android'] },
    { id: 'prod-143', name: 'Amazon Echo Show 10', category: 'cat-1', brand: 'Amazon', price: 24999, originalPrice: 28999, description: 'HD smart display with premium sound and motion—moves with you so you never miss a thing.', images: ['https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=600'], stock: 65, rating: 4.5, ratingCount: 1200, featured: false, tags: ['smart-home', 'echo', 'alexa'] },
    { id: 'prod-144', name: 'Logitech MX Master 3S', category: 'cat-1', brand: 'Logitech', price: 9999, originalPrice: 11999, description: 'Wireless performance mouse with ultra-fast scrolling and quiet clicks.', images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'], stock: 110, rating: 4.9, ratingCount: 3100, featured: true, tags: ['mouse', 'wireless', 'accessories'] },
    { id: 'prod-145', name: 'DJI Mini 3 Pro Drone', category: 'cat-1', brand: 'DJI', price: 74999, originalPrice: 82999, description: 'Lightweight and foldable camera drone with 4K HDR video and tri-directional obstacle sensing.', images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600'], stock: 25, rating: 4.8, ratingCount: 650, featured: true, tags: ['drone', 'camera', 'dji'] },
    { id: 'prod-146', name: 'Bose Smart Soundbar 900', category: 'cat-1', brand: 'Bose', price: 89900, originalPrice: 104900, description: 'Premium soundbar with Dolby Atmos and built-in voice assistants.', images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600'], stock: 18, rating: 4.7, ratingCount: 420, featured: false, tags: ['audio', 'soundbar', 'home-theater'] },
    { id: 'prod-147', name: 'Razer BlackWidow V4', category: 'cat-1', brand: 'Razer', price: 15499, originalPrice: 17999, description: 'Mechanical gaming keyboard with Razer Chroma RGB and dedicated macro keys.', images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=600'], stock: 55, rating: 4.6, ratingCount: 880, featured: false, tags: ['keyboard', 'gaming', 'mechanical'] },
    { id: 'prod-148', name: 'Blue Yeti USB Microphone', category: 'cat-1', brand: 'Logitech', price: 10999, originalPrice: 12999, description: 'Professional multi-pattern USB mic for recording, streaming, and podcasting.', images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'], stock: 80, rating: 4.7, ratingCount: 4500, featured: false, tags: ['microphone', 'audio', 'streaming'] },
    { id: 'prod-149', name: 'WD 4TB My Passport HDD', category: 'cat-1', brand: 'Western Digital', price: 9499, originalPrice: 11999, description: 'Portable external hard drive with hardware encryption and backup software.', images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600'], stock: 150, rating: 4.5, ratingCount: 3200, featured: false, tags: ['hdd', 'storage', 'harddrive'] },
    { id: 'prod-150', name: 'TP-Link AX5400 WiFi 6 Router', category: 'cat-1', brand: 'TP-Link', price: 12999, originalPrice: 15999, description: 'Dual-band Gigabit wireless internet router for ultra-fast, smooth connections.', images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600'], stock: 75, rating: 4.6, ratingCount: 890, featured: false, tags: ['router', 'wifi', 'networking'] },
    { id: 'prod-151', name: 'Apple TV 4K (3rd Gen)', category: 'cat-1', brand: 'Apple', price: 14900, originalPrice: 16900, description: 'Cinematic experience with Dolby Vision, HDR10+, and Dolby Atmos sound.', images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], stock: 90, rating: 4.8, ratingCount: 2100, featured: false, tags: ['appletv', 'streaming', '4k'] }
  ];

  const allNewlyAdded = [...productsPart1, ...productsPart2];
  let newIdCounter = 200;
  
  const mappedNew = allNewlyAdded.map(p => ({
    id: 'prod-' + (newIdCounter++),
    name: p.name,
    category: p.category,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice || Math.round(p.price * 1.3),
    description: p.description,
    images: p.images,
    stock: p.stock || Math.floor(Math.random() * 100) + 20,
    rating: p.rating || (Math.round((Math.random() * 1 + 4) * 10) / 10),
    ratingCount: p.ratingCount || Math.floor(Math.random() * 500) + 50,
    featured: p.featured || (Math.random() > 0.8),
    tags: p.tags || []
  }));

  const finalProductsList = [...products, ...mappedNew];

  return finalProductsList.map(p => ({ ...p, createdAt: new Date(), soldCount: Math.floor(Math.random() * 500) }));
}

function generateSalesData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    revenue: Math.floor(Math.random() * 500000) + 100000,
    orders: Math.floor(Math.random() * 500) + 100,
    users: Math.floor(Math.random() * 200) + 50
  }));
}

// ==================== AUTH MIDDLEWARE ====================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.blocked) return res.status(403).json({ error: 'Account blocked' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ==================== IMAGE UPLOAD ROUTE ====================
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// ==================== AUTH ROUTES ====================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: 'user-' + uuidv4().slice(0, 8),
      name, email, password: hashedPassword, role: 'user', avatar: null,
      addresses: [], createdAt: new Date(), blocked: false
    };
    db.users.push(user);

    // Also persist to MySQL so admin panel can see new users
    try {
      await mysqlPool.query(
        'INSERT INTO users (id, name, email, password, role, avatar, addresses, createdAt, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.password, user.role, user.avatar, JSON.stringify(user.addresses), user.createdAt, user.blocked ? 1 : 0]
      );
    } catch (dbErr) {
      console.warn('⚠️ Could not persist user to MySQL (admin panel may not show this user):', dbErr.message);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    addNotification(user.id, 'Welcome to ShopWave! 🎉', 'Start exploring amazing products.');
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.blocked) return res.status(403).json({ error: 'Account blocked. Contact support.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { name, avatar } = req.body;
  if (name) req.user.name = name;
  if (avatar) req.user.avatar = avatar;
  res.json({ user: sanitizeUser(req.user) });
});

// ==================== ADDRESS ROUTES ====================
app.get('/api/addresses', authMiddleware, (req, res) => {
  res.json({ addresses: req.user.addresses });
});

app.post('/api/addresses', authMiddleware, (req, res) => {
  const { label, street, city, state, zip, phone, isDefault } = req.body;
  const address = { id: 'addr-' + uuidv4().slice(0, 8), label, street, city, state, zip, phone, isDefault: isDefault || false };
  if (isDefault) req.user.addresses.forEach(a => a.isDefault = false);
  req.user.addresses.push(address);
  res.json({ address });
});

app.delete('/api/addresses/:id', authMiddleware, (req, res) => {
  req.user.addresses = req.user.addresses.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

// ==================== PRODUCT ROUTES ====================
app.get('/api/products', (req, res) => {
  let { category, search, minPrice, maxPrice, brand, rating, sort, page = 1, limit = 100, featured } = req.query;
  let products = [...db.products];

  if (category) products = products.filter(p => p.category === category);
  if (brand) products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  if (featured === 'true') products = products.filter(p => p.featured);
  if (minPrice) products = products.filter(p => p.price >= Number(minPrice));
  if (maxPrice) products = products.filter(p => p.price <= Number(maxPrice));
  if (rating) products = products.filter(p => p.rating >= Number(rating));
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sorting
  switch (sort) {
    case 'price_asc': products.sort((a, b) => a.price - b.price); break;
    case 'price_desc': products.sort((a, b) => b.price - a.price); break;
    case 'rating': products.sort((a, b) => b.rating - a.rating); break;
    case 'newest': products.sort((a, b) => b.createdAt - a.createdAt); break;
    case 'popular': products.sort((a, b) => b.soldCount - a.soldCount); break;
    default: products.sort((a, b) => b.featured - a.featured);
  }

  const total = products.length;
  const totalPages = Math.ceil(total / limit);
  products = products.slice((page - 1) * limit, page * limit);

  res.json({ products, total, page: Number(page), totalPages });
});

app.get('/api/products/search-suggestions', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ suggestions: [] });
  const query = q.toLowerCase();
  const suggestions = db.products
    .filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
    .slice(0, 8)
    .map(p => ({ id: p.id, name: p.name, brand: p.brand, price: p.price, image: p.images[0] }));
  res.json({ suggestions });
});

app.get('/api/products/brands', (req, res) => {
  const brands = [...new Set(db.products.map(p => p.brand))].sort();
  res.json({ brands });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const reviews = db.reviews.filter(r => r.productId === req.params.id);
  const related = db.products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  res.json({ product, reviews, related });
});

app.post('/api/products', authMiddleware, adminMiddleware, (req, res) => {
  const { name, category, brand, price, originalPrice, description, images, stock, tags, featured } = req.body;
  const product = {
    id: 'prod-' + uuidv4().slice(0, 8),
    name, category, brand, price, originalPrice, description,
    images: images || [], stock, tags: tags || [], featured: featured || false,
    rating: 0, ratingCount: 0, soldCount: 0, createdAt: new Date()
  };
  db.products.push(product);
  res.json({ product });
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  Object.assign(product, req.body);
  res.json({ product });
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.products = db.products.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});

// ==================== CATEGORY ROUTES ====================
app.get('/api/categories', (req, res) => {
  const categories = db.categories.map(c => ({
    ...c,
    productCount: db.products.filter(p => p.category === c.id).length
  }));
  res.json({ categories });
});

// ==================== CART ROUTES ====================
app.get('/api/cart', authMiddleware, (req, res) => {
  const cart = db.carts[req.user.id] || [];
  const items = cart.map(item => {
    const product = db.products.find(p => p.id === item.productId);
    return product ? { ...item, product } : null;
  }).filter(Boolean);
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const savings = items.reduce((sum, item) => sum + ((item.product.originalPrice - item.product.price) * item.quantity), 0);
  res.json({ items, total, savings, count: items.length });
});

app.post('/api/cart', authMiddleware, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  if (!db.carts[req.user.id]) db.carts[req.user.id] = [];
  const existing = db.carts[req.user.id].find(i => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    db.carts[req.user.id].push({ productId, quantity, addedAt: new Date(), savedForLater: false });
  }
  res.json({ success: true, message: 'Added to cart' });
});

app.put('/api/cart/:productId', authMiddleware, (req, res) => {
  const { quantity, savedForLater } = req.body;
  const cart = db.carts[req.user.id] || [];
  const item = cart.find(i => i.productId === req.params.productId);
  if (!item) return res.status(404).json({ error: 'Item not in cart' });
  if (quantity !== undefined) item.quantity = quantity;
  if (savedForLater !== undefined) item.savedForLater = savedForLater;
  res.json({ success: true });
});

app.delete('/api/cart/:productId', authMiddleware, (req, res) => {
  if (!db.carts[req.user.id]) return res.json({ success: true });
  db.carts[req.user.id] = db.carts[req.user.id].filter(i => i.productId !== req.params.productId);
  res.json({ success: true });
});

app.delete('/api/cart', authMiddleware, (req, res) => {
  db.carts[req.user.id] = [];
  res.json({ success: true });
});

// ==================== WISHLIST ROUTES ====================
app.get('/api/wishlist', authMiddleware, (req, res) => {
  const wishlist = db.wishlists[req.user.id] || [];
  const items = wishlist.map(productId => db.products.find(p => p.id === productId)).filter(Boolean);
  res.json({ items });
});

app.post('/api/wishlist', authMiddleware, (req, res) => {
  const { productId } = req.body;
  if (!db.wishlists[req.user.id]) db.wishlists[req.user.id] = [];
  if (!db.wishlists[req.user.id].includes(productId)) {
    db.wishlists[req.user.id].push(productId);
  }
  res.json({ success: true, message: 'Added to wishlist' });
});

app.delete('/api/wishlist/:productId', authMiddleware, (req, res) => {
  if (!db.wishlists[req.user.id]) return res.json({ success: true });
  db.wishlists[req.user.id] = db.wishlists[req.user.id].filter(id => id !== req.params.productId);
  res.json({ success: true });
});

// ==================== ORDER ROUTES ====================
app.post('/api/orders', authMiddleware, (req, res) => {
  const { addressId, paymentMethod, couponCode } = req.body;
  const cart = (db.carts[req.user.id] || []).filter(i => !i.savedForLater);
  if (cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  const address = req.user.addresses.find(a => a.id === addressId);
  if (!address) return res.status(400).json({ error: 'Invalid address' });

  let items = [];
  let subtotal = 0;
  for (const cartItem of cart) {
    const product = db.products.find(p => p.id === cartItem.productId);
    if (!product) continue;
    if (product.stock < cartItem.quantity) return res.status(400).json({ error: `${product.name} is out of stock` });
    items.push({ productId: product.id, name: product.name, price: product.price, quantity: cartItem.quantity, image: product.images[0] });
    subtotal += product.price * cartItem.quantity;
    product.stock -= cartItem.quantity;
    product.soldCount += cartItem.quantity;
  }

  let discount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code === couponCode && c.active);
    if (coupon && subtotal >= coupon.minOrder && coupon.usedCount < coupon.usageLimit) {
      discount = coupon.type === 'percent' ? Math.min(subtotal * coupon.discount / 100, coupon.maxDiscount) : coupon.discount;
      coupon.usedCount++;
    }
  }

  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal - discount + shipping + tax;

  const order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + uuidv4().slice(0, 4).toUpperCase(),
    userId: req.user.id,
    items, address, paymentMethod,
    subtotal, discount, shipping, tax, total,
    status: 'confirmed',
    statusHistory: [
      { status: 'confirmed', timestamp: new Date(), message: 'Order confirmed successfully' }
    ],
    createdAt: new Date(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  };

  db.orders.push(order);
  db.carts[req.user.id] = (db.carts[req.user.id] || []).filter(i => i.savedForLater);
  addNotification(req.user.id, 'Order Placed! 📦', `Order ${order.id} confirmed. Estimated delivery: ${order.estimatedDelivery.toLocaleDateString()}`);

  // Simulate order progress — track timer IDs so admin override can cancel them
  const t1 = setTimeout(() => updateOrderStatus(order.id, 'processing', 'Order is being processed'), 5000);
  const t2 = setTimeout(() => updateOrderStatus(order.id, 'shipped', 'Order has been shipped'), 15000);
  const t3 = setTimeout(() => updateOrderStatus(order.id, 'out_for_delivery', 'Order is out for delivery'), 30000);
  const t4 = setTimeout(() => updateOrderStatus(order.id, 'delivered', 'Order delivered successfully! 🎉'), 60000);
  db.orderTimers = db.orderTimers || {};
  db.orderTimers[order.id] = [t1, t2, t3, t4];

  res.json({ order });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  let orders = db.orders.filter(o => o.userId === req.user.id);
  orders.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ orders });
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && (o.userId === req.user.id || req.user.role === 'admin'));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

app.put('/api/orders/:id/cancel', authMiddleware, (req, res) => {
  const { reason, notes } = req.body;
  const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (['delivered', 'cancelled'].includes(order.status)) return res.status(400).json({ error: 'Cannot cancel this order' });
  order.status = 'cancelled';
  order.cancelReason = reason;
  order.cancelNotes = notes;
  
  order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), message: `Order cancelled by customer (Reason: ${reason})` });
  
  // Restore stock
  order.items.forEach(item => {
    const product = db.products.find(p => p.id === item.productId);
    if (product) { product.stock += item.quantity; product.soldCount -= item.quantity; }
  });
  
  addNotification(req.user.id, 'Order Cancelled', `Order ${order.id} has been cancelled. Refund will be processed.`);
  res.json({ order });
});

// ==================== RETURN / REFUND ROUTES ====================
app.post('/api/orders/:id/return', authMiddleware, async (req, res) => {
  try {
    const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'delivered') return res.status(400).json({ error: 'Only delivered orders can be returned' });

    // Find delivery timestamp from statusHistory
    const deliveredEntry = [...(order.statusHistory || [])].reverse().find(h => h.status === 'delivered');
    const deliveredAt = deliveredEntry ? new Date(deliveredEntry.timestamp) : new Date(order.createdAt);
    const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) return res.status(400).json({ error: 'Return window expired. Returns are only accepted within 7 days of delivery.' });

    // Check if a return already exists
    const existing = db.returnRequests.find(r => r.orderId === order.id);
    if (existing) return res.status(400).json({ error: 'A return request already exists for this order', returnRequest: existing });

    const { type, reason, description, items } = req.body;
    if (!type || !reason) return res.status(400).json({ error: 'Return type and reason are required' });

    const returnRequest = {
      id: 'RET-' + uuidv4().slice(0, 8).toUpperCase(),
      orderId: order.id,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      type,          // 'return' | 'refund' | 'exchange'
      reason,
      description: description || '',
      items: items || order.items,
      orderTotal: order.total,
      refundAmount: order.total,
      status: 'pending',   // pending | approved | rejected | completed
      statusHistory: [{ status: 'pending', timestamp: new Date(), message: 'Return request submitted by customer' }],
      createdAt: new Date(),
      deliveredAt
    };

    db.returnRequests.push(returnRequest);
    addNotification(req.user.id, 'Return Request Submitted 🔄',
      `Your return request ${returnRequest.id} for order ${order.id} has been submitted. We will process it within 2-3 business days.`);

    res.json({ returnRequest });
  } catch (err) {
    console.error('Return request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's own return requests
app.get('/api/returns', authMiddleware, (req, res) => {
  const returns = db.returnRequests
    .filter(r => r.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ returns });
});

// Admin: get all return requests
app.get('/api/admin/returns', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.query;
  let returns = [...db.returnRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (status) returns = returns.filter(r => r.status === status);
  res.json({ returns });
});

// Admin: approve / reject a return
app.put('/api/admin/returns/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const { status, adminNote } = req.body;
  const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const ret = db.returnRequests.find(r => r.id === req.params.id);
  if (!ret) return res.status(404).json({ error: 'Return request not found' });

  ret.status = status;
  ret.adminNote = adminNote || '';
  ret.statusHistory.push({ status, timestamp: new Date(), message: adminNote || `Return ${status} by admin` });

  const msgMap = {
    approved: `Your return request ${ret.id} has been approved! Refund of ₹${ret.refundAmount.toLocaleString()} will be processed within 5-7 business days.`,
    rejected: `Your return request ${ret.id} has been rejected. ${adminNote || 'Please contact support for more information.'}`,
    completed: `Your refund of ₹${ret.refundAmount.toLocaleString()} for return ${ret.id} has been completed!`
  };
  if (msgMap[status]) addNotification(ret.userId, `Return Request ${status.charAt(0).toUpperCase() + status.slice(1)} 🔄`, msgMap[status]);

  res.json({ returnRequest: ret });
});

// ==================== REVIEW ROUTES ====================
app.post('/api/reviews', authMiddleware, (req, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating) return res.status(400).json({ error: 'Product ID and rating required' });
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const review = {
    id: 'rev-' + uuidv4().slice(0, 8),
    productId, userId: req.user.id, userName: req.user.name,
    rating: Number(rating), comment: comment || '',
    createdAt: new Date(), helpful: 0
  };
  db.reviews.push(review);

  // Update product rating
  const productReviews = db.reviews.filter(r => r.productId === productId);
  product.rating = Math.round((productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length) * 10) / 10;
  product.ratingCount = productReviews.length;

  res.json({ review });
});

app.get('/api/reviews/:productId', (req, res) => {
  const reviews = db.reviews.filter(r => r.productId === req.params.productId);
  reviews.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ reviews });
});

// ==================== COUPON ROUTES ====================
app.post('/api/coupons/validate', authMiddleware, (req, res) => {
  const { code, total } = req.body;
  const coupon = db.coupons.find(c => c.code === code && c.active);
  if (!coupon) return res.status(400).json({ error: 'Invalid coupon code' });
  if (total < coupon.minOrder) return res.status(400).json({ error: `Minimum order amount is ₹${coupon.minOrder}` });
  if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached' });
  const discount = coupon.type === 'percent' ? Math.min(total * coupon.discount / 100, coupon.maxDiscount) : coupon.discount;
  res.json({ valid: true, discount, coupon: { code: coupon.code, discount: coupon.discount, type: coupon.type } });
});

// ==================== NOTIFICATION ROUTES ====================
app.get('/api/notifications', authMiddleware, (req, res) => {
  const notifications = db.notifications.filter(n => n.userId === req.user.id);
  notifications.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ notifications });
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const notification = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (notification) notification.read = true;
  res.json({ success: true });
});

app.put('/api/notifications/read-all', authMiddleware, (req, res) => {
  db.notifications.filter(n => n.userId === req.user.id).forEach(n => n.read = true);
  res.json({ success: true });
});

// ==================== AI RECOMMENDATION ROUTES ====================
app.get('/api/recommendations', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const history = db.browsingHistory[userId] || [];
  const userOrders = db.orders.filter(o => o.userId === userId);
  const purchasedCategories = new Set();
  const purchasedBrands = new Set();

  userOrders.forEach(order => {
    order.items.forEach(item => {
      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        purchasedCategories.add(product.category);
        purchasedBrands.add(product.brand);
      }
    });
  });

  history.forEach(productId => {
    const product = db.products.find(p => p.id === productId);
    if (product) {
      purchasedCategories.add(product.category);
      purchasedBrands.add(product.brand);
    }
  });

  let recommended = db.products.filter(p => {
    const purchasedIds = userOrders.flatMap(o => o.items.map(i => i.productId));
    return !purchasedIds.includes(p.id) && (purchasedCategories.has(p.category) || purchasedBrands.has(p.brand));
  });

  if (recommended.length < 8) {
    const topRated = db.products.filter(p => p.rating >= 4.5 && !recommended.find(r => r.id === p.id));
    recommended = [...recommended, ...topRated];
  }

  recommended.sort((a, b) => b.rating * b.ratingCount - a.rating * a.ratingCount);
  res.json({ recommendations: recommended.slice(0, 12) });
});

app.post('/api/browsing-history', authMiddleware, (req, res) => {
  const { productId } = req.body;
  if (!db.browsingHistory[req.user.id]) db.browsingHistory[req.user.id] = [];
  const history = db.browsingHistory[req.user.id];
  const idx = history.indexOf(productId);
  if (idx > -1) history.splice(idx, 1);
  history.unshift(productId);
  if (history.length > 50) history.pop();
  res.json({ success: true });
});

// ==================== CHATBOT ROUTES ====================
app.post('/api/chatbot', authMiddleware, (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();
  let reply = '';

  if (lowerMsg.includes('track') || lowerMsg.includes('order status') || lowerMsg.includes('where is my order')) {
    const orders = db.orders.filter(o => o.userId === req.user.id && !['delivered', 'cancelled'].includes(o.status));
    if (orders.length > 0) {
      reply = `📦 You have ${orders.length} active order(s):\n` + orders.map(o => `• ${o.id} - Status: ${o.status.replace(/_/g, ' ').toUpperCase()}`).join('\n');
    } else {
      reply = "You don't have any active orders right now. Browse our products and place a new order! 🛍️";
    }
  } else if (lowerMsg.includes('return') || lowerMsg.includes('refund')) {
    reply = "For returns and refunds:\n1. Go to Orders page\n2. Select the order\n3. Click 'Cancel Order' (within 24 hours)\n\nRefunds are processed within 5-7 business days. For more help, email support@shopwave.com 📧";
  } else if (lowerMsg.includes('payment') || lowerMsg.includes('pay')) {
    reply = "We accept multiple payment methods:\n💳 Credit/Debit Cards\n📱 UPI (Google Pay, PhonePe)\n💵 Cash on Delivery\n\nAll payments are secure and encrypted! 🔒";
  } else if (lowerMsg.includes('shipping') || lowerMsg.includes('delivery')) {
    reply = "🚚 Shipping Info:\n• Free shipping on orders above ₹999\n• Standard delivery: 3-5 business days\n• Express delivery: 1-2 business days (₹149 extra)\n• We deliver across India!";
  } else if (lowerMsg.includes('coupon') || lowerMsg.includes('discount') || lowerMsg.includes('offer')) {
    reply = "🎉 Available Coupons:\n• WELCOME10 - 10% off (min ₹500)\n• FLAT50 - ₹50 off (min ₹1000)\n• SAVE20 - 20% off (min ₹2000)\n• MEGA100 - ₹100 off (min ₹3000)\n\nApply at checkout!";
  } else if (lowerMsg.includes('recommend') || lowerMsg.includes('suggest') || lowerMsg.includes('best')) {
    const topProducts = db.products.sort((a, b) => b.rating - a.rating).slice(0, 3);
    reply = "⭐ Top rated products:\n" + topProducts.map(p => `• ${p.name} - ₹${p.price.toLocaleString()} (${p.rating}⭐)`).join('\n');
  } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
    reply = `Hello ${req.user.name}! 👋 Welcome to ShopWave! How can I help you today?\n\nI can help with:\n🔍 Product recommendations\n📦 Order tracking\n💳 Payment info\n🚚 Shipping details\n🎟️ Coupon codes`;
  } else if (lowerMsg.includes('contact') || lowerMsg.includes('support') || lowerMsg.includes('help')) {
    reply = "📞 Contact us:\n• Email: support@shopwave.com\n• Phone: 1800-SHOP-WAVE\n• Live Chat: Available 24/7\n• Social: @shopwave on all platforms\n\nWe're here to help! 😊";
  } else {
    reply = "I'm here to help! You can ask me about:\n🔍 Product recommendations\n📦 Order tracking & returns\n💳 Payment methods\n🚚 Shipping info\n🎟️ Coupon codes\n📞 Contact support\n\nJust type your question! 😊";
  }

  const chatMsg = { user: message, bot: reply, timestamp: new Date() };
  if (!db.chatHistory[req.user.id]) db.chatHistory[req.user.id] = [];
  db.chatHistory[req.user.id].push(chatMsg);

  res.json({ reply });
});

// ==================== ADMIN ROUTES ====================
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const totalUsers = db.users.filter(u => u.role === 'user').length;
  const totalOrders = db.orders.length;
  const totalRevenue = db.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalProducts = db.products.length;
  const pendingOrders = db.orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const lowStockProducts = db.products.filter(p => p.stock < 10);
  const recentOrders = [...db.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  const topProducts = [...db.products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5);
  const salesData = db.salesData;

  const categoryStats = db.categories.map(c => ({
    name: c.name,
    products: db.products.filter(p => p.category === c.id).length,
    revenue: db.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => {
      return s + o.items.filter(i => {
        const prod = db.products.find(p => p.id === i.productId);
        return prod && prod.category === c.id;
      }).reduce((is, i) => is + i.price * i.quantity, 0);
    }, 0)
  }));

  res.json({
    totalUsers, totalOrders, totalRevenue, totalProducts,
    pendingOrders, lowStockProducts, recentOrders, topProducts,
    salesData, categoryStats
  });
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  // Return all users from in-memory db (consistent with rest of app)
  // MySQL is used only for persistence; in-memory is the source of truth at runtime
  const users = db.users.map(u => sanitizeUser(u));
  res.json({ users });
});

app.put('/api/admin/users/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  // Toggle block in in-memory db
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.blocked = !user.blocked;

  // Also sync to MySQL if possible
  try {
    await mysqlPool.query('UPDATE users SET blocked = ? WHERE id = ?', [user.blocked ? 1 : 0, user.id]);
  } catch (dbErr) {
    console.warn('⚠️ Could not sync block status to MySQL:', dbErr.message);
  }

  res.json({ user: sanitizeUser(user) });
});

app.get('/api/admin/orders', authMiddleware, adminMiddleware, (req, res) => {
  let orders = [...db.orders].sort((a, b) => b.createdAt - a.createdAt);
  const { status } = req.query;
  if (status) orders = orders.filter(o => o.status === status);
  orders = orders.map(o => {
    const user = db.users.find(u => u.id === o.userId);
    return { ...o, userName: user ? user.name : 'Unknown', userEmail: user ? user.email : '' };
  });
  res.json({ orders });
});

app.put('/api/admin/orders/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.body;
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Cancel any pending auto-simulation timers for this order so they don't override admin's choice
  if (db.orderTimers && db.orderTimers[order.id]) {
    db.orderTimers[order.id].forEach(t => clearTimeout(t));
    delete db.orderTimers[order.id];
  }

  order.status = status;
  order.statusHistory.push({ status, timestamp: new Date(), message: `Status updated by admin to: ${status.replace(/_/g,' ')}` });
  addNotification(order.userId, 'Order Update 📦', `Your order ${order.id} is now: ${status.replace(/_/g, ' ').toUpperCase()}`);
  res.json({ order });
});

app.get('/api/admin/inventory', authMiddleware, adminMiddleware, (req, res) => {
  const inventory = db.products.map(p => ({
    id: p.id, name: p.name, brand: p.brand, stock: p.stock, price: p.price,
    soldCount: p.soldCount, category: db.categories.find(c => c.id === p.category)?.name || 'Unknown',
    status: p.stock === 0 ? 'out_of_stock' : p.stock < 10 ? 'low_stock' : 'in_stock'
  }));
  res.json({ inventory });
});

app.get('/api/admin/fraud-detection', authMiddleware, adminMiddleware, (req, res) => {
  // Simulated fraud detection
  const suspiciousActivities = [
    { id: 'fraud-1', type: 'multiple_orders', userId: 'user-001', description: 'Multiple high-value orders in short time', risk: 'medium', timestamp: new Date(Date.now() - 86400000) },
    { id: 'fraud-2', type: 'address_mismatch', userId: 'user-002', description: 'Shipping address different from billing', risk: 'low', timestamp: new Date(Date.now() - 43200000) },
  ];
  res.json({ activities: suspiciousActivities });
});

// ==================== IMAGE SEARCH (Simulated) ====================
app.post('/api/search/image', authMiddleware, upload.single('image'), (req, res) => {
  // Simulated image search - returns products based on random matching
  const randomProducts = [...db.products].sort(() => Math.random() - 0.5).slice(0, 6);
  res.json({ products: randomProducts, message: 'Found similar products based on your image' });
});

// ==================== UTILITY FUNCTIONS ====================
function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function addNotification(userId, title, message) {
  db.notifications.push({
    id: 'notif-' + uuidv4().slice(0, 8),
    userId, title, message, read: false, createdAt: new Date()
  });
}

function updateOrderStatus(orderId, status, message) {
  const order = db.orders.find(o => o.id === orderId);
  if (order && order.status !== 'cancelled') {
    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date(), message });
    addNotification(order.userId, 'Order Update 📦', `${order.id}: ${message}`);
  }
}

// ==================== SERVE FRONTEND ====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'admin.html')));

// Catch all for SPA-like routing
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, '..', 'frontend', req.path);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ==================== START SERVER ====================
async function startServer() {
  // --- Sync seed users to MySQL (upsert so no duplicate errors) ---
  for (const seedUser of db.users) {
    try {
      await mysqlPool.query(
        `INSERT INTO users (id, name, email, password, role, avatar, addresses, createdAt, blocked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), blocked = VALUES(blocked)`,
        [
          seedUser.id, seedUser.name, seedUser.email, seedUser.password,
          seedUser.role, seedUser.avatar, JSON.stringify(seedUser.addresses),
          seedUser.createdAt, seedUser.blocked ? 1 : 0
        ]
      );
    } catch (err) {
      // Non-fatal — app works without MySQL persistence
    }
  }

  // --- Load all users from MySQL back into in-memory db ---
  try {
    const [rows] = await mysqlPool.query('SELECT * FROM users');
    for (const row of rows) {
      const exists = db.users.find(u => u.id === row.id);
      if (!exists) {
        db.users.push({
          id: row.id,
          name: row.name,
          email: row.email,
          password: row.password,
          role: row.role || 'user',
          avatar: row.avatar || null,
          addresses: (() => { try { return JSON.parse(row.addresses || '[]'); } catch { return []; } })(),
          createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
          blocked: row.blocked === 1 || row.blocked === true
        });
      }
    }
    console.log(`✅ Loaded ${rows.length} user(s) from MySQL into memory`);
  } catch (err) {
    console.warn('⚠️  Could not load users from MySQL (running with seed users only):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║     🌊 ShopWave E-Commerce Server       ║
  ║     Running on http://localhost:${PORT}      ║
  ║                                          ║
  ║  Admin: admin@shopwave.com / admin123    ║
  ║  User:  john@example.com / user123       ║
  ╚══════════════════════════════════════════╝
    `);
  });
}

startServer();
