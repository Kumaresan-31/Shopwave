const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const productsPart1 = require('./products_part1');
const productsPart2 = require('./products_part2');

// ─── CATEGORIES ──────────────────────────────────────────────
const categories = [
    { id: 'cat-1',  name: 'Electronics',     icon: 'laptop',   image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
    { id: 'cat-2',  name: 'Fashion',          icon: 'shirt',    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
    { id: 'cat-3',  name: 'Home & Living',    icon: 'home',     image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { id: 'cat-4',  name: 'Sports',           icon: 'football', image: 'https://images.unsplash.com/photo-1461896836934-bd45ba24e62c?w=400' },
    { id: 'cat-5',  name: 'Books',            icon: 'book',     image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
    { id: 'cat-6',  name: 'Beauty',           icon: 'sparkles', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
    { id: 'cat-7',  name: 'Groceries',        icon: 'cart',     image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' },
    { id: 'cat-8',  name: 'Toys',             icon: 'toy',      image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400' },
    { id: 'cat-9',  name: 'Gaming Zone',      icon: 'gamepad',  image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
    { id: 'cat-10', name: 'Fitness & Health', icon: 'dumbbell', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400' },
    { id: 'cat-11', name: 'Accessories',      icon: 'bag',      image: 'https://images.unsplash.com/photo-1523206489230-c012c64b6b48?w=400' }
];

// ─── BASE PRODUCTS ────────────────────────────────────────────
const baseProducts = [
    { id: 'prod-001', name: 'MacBook Pro 16"',          category: 'cat-1',  brand: 'Apple',        price: 249999, originalPrice: 279999, stock: 25,  rating: 4.8, ratingCount: 342,  featured: true,  soldCount: 180, tags: ['laptop','apple','premium'],         images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],   description: 'Apple M3 Pro chip, 18GB RAM, 512GB SSD.' },
    { id: 'prod-002', name: 'iPhone 15 Pro Max',         category: 'cat-1',  brand: 'Apple',        price: 159999, originalPrice: 169999, stock: 50,  rating: 4.7, ratingCount: 1205, featured: true,  soldCount: 420, tags: ['smartphone','apple','premium'],      images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'],   description: 'A17 Pro chip, 256GB, Titanium design.' },
    { id: 'prod-003', name: 'Sony WH-1000XM5',           category: 'cat-1',  brand: 'Sony',         price: 29999,  originalPrice: 34999,  stock: 100, rating: 4.6, ratingCount: 890,  featured: true,  soldCount: 310, tags: ['headphones','sony','audio'],         images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600'],   description: 'Industry-leading noise canceling headphones.' },
    { id: 'prod-004', name: 'Samsung Galaxy S24 Ultra',  category: 'cat-1',  brand: 'Samsung',      price: 134999, originalPrice: 144999, stock: 40,  rating: 4.5, ratingCount: 567,  featured: false, soldCount: 220, tags: ['smartphone','samsung','android'],    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],   description: 'Galaxy AI built-in, 200MP camera, S Pen.' },
    { id: 'prod-005', name: 'iPad Air M2',                category: 'cat-1',  brand: 'Apple',        price: 74999,  originalPrice: 79999,  stock: 60,  rating: 4.7, ratingCount: 234,  featured: false, soldCount: 150, tags: ['tablet','apple','ipad'],             images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],   description: 'Supercharged by M2 chip, 11-inch Liquid Retina.' },
    { id: 'prod-006', name: 'Dell XPS 15',                category: 'cat-1',  brand: 'Dell',         price: 189999, originalPrice: 209999, stock: 15,  rating: 4.4, ratingCount: 178,  featured: false, soldCount: 80,  tags: ['laptop','dell','windows'],           images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600'],   description: 'Intel Core i9, 32GB RAM, 1TB SSD, RTX 4060.' },
    { id: 'prod-007', name: 'AirPods Pro 2',              category: 'cat-1',  brand: 'Apple',        price: 24999,  originalPrice: 26999,  stock: 200, rating: 4.6, ratingCount: 2100, featured: true,  soldCount: 900, tags: ['earbuds','apple','audio'],           images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'],   description: 'Active Noise Cancellation, Adaptive Transparency.' },
    { id: 'prod-008', name: 'PlayStation 5',              category: 'cat-1',  brand: 'Sony',         price: 49999,  originalPrice: 54999,  stock: 30,  rating: 4.8, ratingCount: 3400, featured: true,  soldCount: 650, tags: ['gaming','console','sony'],           images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'],   description: 'Lightning-fast loading, stunning 4K graphics.' },
    { id: 'prod-009', name: 'Premium Leather Jacket',     category: 'cat-2',  brand: 'Zara',         price: 12999,  originalPrice: 17999,  stock: 35,  rating: 4.3, ratingCount: 89,   featured: true,  soldCount: 55,  tags: ['jacket','leather','men'],            images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'],   description: 'Genuine leather biker jacket with quilted lining.' },
    { id: 'prod-010', name: 'Designer Sneakers',          category: 'cat-2',  brand: 'Nike',         price: 14999,  originalPrice: 18999,  stock: 80,  rating: 4.5, ratingCount: 456,  featured: true,  soldCount: 280, tags: ['shoes','sneakers','nike'],           images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],   description: 'Nike Air Max 270 React. Bold design meets comfort.' },
    { id: 'prod-011', name: 'Silk Evening Dress',         category: 'cat-2',  brand: 'H&M',          price: 8999,   originalPrice: 12999,  stock: 20,  rating: 4.4, ratingCount: 67,   featured: false, soldCount: 32,  tags: ['dress','women','formal'],            images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],   description: 'Elegant silk evening dress with v-neckline.' },
    { id: 'prod-012', name: 'Classic Chronograph Watch',  category: 'cat-2',  brand: 'Fossil',       price: 15999,  originalPrice: 19999,  stock: 45,  rating: 4.6, ratingCount: 234,  featured: true,  soldCount: 120, tags: ['watch','accessories','men'],         images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'],   description: 'Stainless steel chronograph, water resistant 50m.' },
    { id: 'prod-013', name: 'Ray-Ban Aviator Sunglasses', category: 'cat-2',  brand: 'Ray-Ban',      price: 8499,   originalPrice: 12999,  stock: 120, rating: 4.7, ratingCount: 890,  featured: false, soldCount: 340, tags: ['sunglasses','accessories','unisex'], images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'],   description: 'Classic aviator sunglasses with polarized lenses.' },
    { id: 'prod-014', name: 'Smart Home Speaker',         category: 'cat-3',  brand: 'Google',       price: 9999,   originalPrice: 12999,  stock: 70,  rating: 4.3, ratingCount: 345,  featured: false, soldCount: 160, tags: ['smart-home','speaker','google'],     images: ['https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=600'],   description: 'Google Nest Hub Max with Google Assistant.' },
    { id: 'prod-015', name: 'Luxury Bed Set',             category: 'cat-3',  brand: 'HomeTown',     price: 6999,   originalPrice: 9999,   stock: 50,  rating: 4.5, ratingCount: 123,  featured: false, soldCount: 75,  tags: ['bedding','home','luxury'],           images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'],   description: '100% Egyptian cotton, 400 thread count, King size.' },
    { id: 'prod-016', name: 'Robot Vacuum Cleaner',       category: 'cat-3',  brand: 'iRobot',       price: 34999,  originalPrice: 44999,  stock: 25,  rating: 4.4, ratingCount: 278,  featured: true,  soldCount: 90,  tags: ['vacuum','robot','smart-home'],       images: ['https://images.unsplash.com/photo-1589923158776-cb4485d99fd6?w=600'],   description: 'Roomba j7+, automatic dirt disposal, smart mapping.' },
    { id: 'prod-017', name: 'Pro Yoga Mat',               category: 'cat-4',  brand: 'Nike',         price: 3999,   originalPrice: 5999,   stock: 150, rating: 4.6, ratingCount: 567,  featured: false, soldCount: 230, tags: ['yoga','fitness','mat'],              images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'],   description: 'Premium 6mm yoga mat, anti-slip, eco TPE material.' },
    { id: 'prod-018', name: 'Smart Fitness Band',         category: 'cat-4',  brand: 'Fitbit',       price: 12999,  originalPrice: 15999,  stock: 90,  rating: 4.3, ratingCount: 1234, featured: true,  soldCount: 410, tags: ['fitness','wearable','smartwatch'],   images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600'],   description: 'Fitbit Charge 6. Advanced health tracking, GPS.' },
    { id: 'prod-019', name: 'Carbon Fiber Tennis Racket', category: 'cat-4',  brand: 'Wilson',       price: 18999,  originalPrice: 24999,  stock: 30,  rating: 4.7, ratingCount: 89,   featured: false, soldCount: 40,  tags: ['tennis','racket','sports'],          images: ['https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600'],   description: 'Wilson Pro Staff RF97. Carbon frame, 97 sq inch.' },
    { id: 'prod-020', name: 'The Art of Programming',     category: 'cat-5',  brand: 'Penguin',      price: 699,    originalPrice: 999,    stock: 300, rating: 4.8, ratingCount: 2345, featured: true,  soldCount: 780, tags: ['programming','tech','education'],    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'],   description: 'Comprehensive guide to mastering programming.' },
    { id: 'prod-021', name: 'Atomic Habits',              category: 'cat-5',  brand: 'Random House', price: 499,    originalPrice: 799,    stock: 500, rating: 4.9, ratingCount: 5678, featured: true,  soldCount: 1500,tags: ['self-help','habits','bestseller'],   images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600'],   description: 'James Clear. Build good habits, break bad ones.' },
    { id: 'prod-022', name: 'Luxury Skincare Set',        category: 'cat-6',  brand: 'Lakme',        price: 4999,   originalPrice: 7999,   stock: 80,  rating: 4.4, ratingCount: 345,  featured: false, soldCount: 130, tags: ['skincare','beauty','women'],         images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600'],   description: 'Complete skincare: cleanser, toner, serum, SPF.' },
    { id: 'prod-023', name: 'Premium Perfume Collection', category: 'cat-6',  brand: 'Dior',         price: 8999,   originalPrice: 12999,  stock: 60,  rating: 4.7, ratingCount: 890,  featured: true,  soldCount: 270, tags: ['perfume','luxury','unisex'],         images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'],   description: 'Dior Sauvage 100ml. Wild, noble, and magnetic.' },
    { id: 'prod-024', name: 'Organic Honey Bundle',       category: 'cat-7',  brand: "Nature's Best", price: 1299,  originalPrice: 1799,   stock: 200, rating: 4.5, ratingCount: 456,  featured: false, soldCount: 200, tags: ['organic','honey','healthy'],         images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600'],   description: 'Raw unprocessed honey. 3x500g Himalayan.' },
    { id: 'prod-025', name: 'LEGO Space Station',         category: 'cat-8',  brand: 'LEGO',         price: 7999,   originalPrice: 9999,   stock: 40,  rating: 4.8, ratingCount: 567,  featured: true,  soldCount: 190, tags: ['lego','building','space'],           images: ['https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600'],   description: 'LEGO Creator Expert Space Station. 864 pieces.' },
    { id: 'prod-026', name: 'LG 55" OLED TV',             category: 'cat-1',  brand: 'LG',           price: 129999, originalPrice: 149999, stock: 20,  rating: 4.7, ratingCount: 456,  featured: true,  soldCount: 140, tags: ['tv','oled','entertainment'],         images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],   description: 'LG C3 OLED evo 4K Smart TV. Dolby Vision & Atmos.' },
    { id: 'prod-027', name: 'Canon EOS R6 II',             category: 'cat-1',  brand: 'Canon',        price: 219999, originalPrice: 249999, stock: 10,  rating: 4.8, ratingCount: 123,  featured: false, soldCount: 45,  tags: ['camera','photography','canon'],      images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],   description: '24.2MP Full-Frame CMOS, 4K 60p Video, 40fps.' },
    { id: 'prod-028', name: 'Mechanical Gaming Keyboard',  category: 'cat-1',  brand: 'Corsair',      price: 15999,  originalPrice: 19999,  stock: 55,  rating: 4.5, ratingCount: 789,  featured: false, soldCount: 220, tags: ['keyboard','gaming','mechanical'],    images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600'],   description: 'Corsair K95 RGB. Cherry MX Speed switches.' },
    { id: 'prod-029', name: 'Premium Denim Jeans',         category: 'cat-2',  brand: "Levi's",       price: 4999,   originalPrice: 6999,   stock: 100, rating: 4.4, ratingCount: 1567, featured: false, soldCount: 560, tags: ['jeans','denim','men'],               images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'],   description: "Levi's 501 Original Fit. Premium selvedge denim." },
    { id: 'prod-030', name: 'Designer Handbag',            category: 'cat-2',  brand: 'Coach',        price: 34999,  originalPrice: 44999,  stock: 15,  rating: 4.6, ratingCount: 234,  featured: true,  soldCount: 72,  tags: ['bag','handbag','women','luxury'],    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'],   description: 'Coach Tabby Shoulder Bag 26. Polished pebble leather.' }
];

// ─── MAIN SEED FUNCTION ───────────────────────────────────────
async function seed() {
    console.log('\n🚀 Starting Full Database Seeding...\n');
    console.log('   DB_HOST:', process.env.DB_HOST || '127.0.0.1');
    console.log('   DB_USER:', process.env.DB_USER || 'root');
    console.log('   DB_NAME:', process.env.DB_NAME || 'shopwave');
    console.log('   DB_PORT:', process.env.DB_PORT || 3306);
    console.log('   DB_PASS:', process.env.DB_PASSWORD ? '(set)' : '(EMPTY - check .env!)');
    console.log('');

    let conn;
    let fkDisabled = false;

    try {
        // Use createConnection (not pool) for a clean single-session connection
        conn = await mysql.createConnection({
            host:     process.env.DB_HOST     || '127.0.0.1',
            user:     process.env.DB_USER     || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME     || 'shopwave',
            port:     parseInt(process.env.DB_PORT) || 3306,
            charset:  'utf8mb4'
        });

        // Set charset — correct syntax without quotes around charset name
        await conn.query('SET NAMES utf8mb4');
        console.log('   ✅ Connected to MySQL & charset set.\n');

        // ── STEP 1: CLEAR ALL TABLES ─────────────────────────
        console.log('🧹 Clearing all tables...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        fkDisabled = true;
        const tablesToClear = ['activities','notifications','wishlists','carts','reviews','orders','coupons','products','categories','users'];
        for (const t of tablesToClear) {
            await conn.query(`TRUNCATE TABLE \`${t}\``);
            process.stdout.write('.');
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        fkDisabled = false;
        console.log('\n   ✅ All tables cleared.\n');

        // ── STEP 2: USERS ────────────────────────────────────
        console.log('👤 Seeding users...');
        const hashedAdmin = bcrypt.hashSync('admin123', 10);
        const hashedUser  = bcrypt.hashSync('user123', 10);
        const users = [
            { id:'admin-001', name:'Admin',        email:'admin@shopwave.com', password:hashedAdmin, role:'admin', avatar:null,
              addresses:JSON.stringify([{id:'addr-1',label:'Office',street:'123 Tech Park',city:'Bangalore',state:'Karnataka',zip:'560001',phone:'9876543210',isDefault:true}]),
              createdAt:'2024-01-01 05:30:00', blocked:0 },
            { id:'user-001',  name:'John Doe',     email:'john@example.com',   password:hashedUser,  role:'user',  avatar:null,
              addresses:JSON.stringify([{id:'addr-2',label:'Home',street:'456 MG Road',city:'Mumbai',state:'Maharashtra',zip:'400001',phone:'9876543211',isDefault:true}]),
              createdAt:'2024-02-15 05:30:00', blocked:0 },
            { id:'user-002',  name:'Priya Sharma', email:'priya@example.com',  password:hashedUser,  role:'user',  avatar:null,
              addresses:JSON.stringify([{id:'addr-3',label:'Home',street:'789 Anna Nagar',city:'Chennai',state:'Tamil Nadu',zip:'600040',phone:'9876543212',isDefault:true}]),
              createdAt:'2024-03-10 05:30:00', blocked:0 }
        ];
        for (const u of users) {
            await conn.query(
                'INSERT INTO users (id,name,email,password,role,avatar,addresses,createdAt,blocked) VALUES (?,?,?,?,?,?,?,?,?)',
                [u.id,u.name,u.email,u.password,u.role,u.avatar,u.addresses,u.createdAt,u.blocked]
            );
        }
        console.log(`   ✅ ${users.length} users inserted.\n`);

        // ── STEP 3: CATEGORIES ───────────────────────────────
        console.log('📂 Seeding categories...');
        for (const cat of categories) {
            await conn.query(
                'INSERT INTO categories (id,name,icon,image) VALUES (?,?,?,?)',
                [cat.id, cat.name, cat.icon, cat.image]
            );
        }
        console.log(`   ✅ ${categories.length} categories inserted.\n`);

        // ── STEP 4: PRODUCTS ─────────────────────────────────
        console.log('📦 Seeding products...');
        const allNewlyAdded = [...productsPart1, ...productsPart2];
        let newIdCounter = 200;
        const mappedNew = allNewlyAdded.map(p => ({
            id: 'prod-' + (newIdCounter++),
            name: p.name, category: p.category, brand: p.brand,
            price: p.price, originalPrice: p.originalPrice || Math.round(p.price * 1.3),
            description: p.description,
            images: JSON.stringify(p.images),
            stock: p.stock || Math.floor(Math.random() * 100) + 20,
            rating: p.rating || (Math.round((Math.random() * 1 + 4) * 10) / 10),
            ratingCount: p.ratingCount || Math.floor(Math.random() * 500) + 50,
            featured: p.featured ? 1 : (Math.random() > 0.8 ? 1 : 0),
            tags: JSON.stringify(p.tags || []),
            soldCount: Math.floor(Math.random() * 500)
        }));
        const allProducts = [
            ...baseProducts.map(p => ({
                ...p,
                images: JSON.stringify(p.images),
                tags: JSON.stringify(p.tags),
                featured: p.featured ? 1 : 0
            })),
            ...mappedNew
        ];
        for (const p of allProducts) {
            await conn.query(
                `INSERT INTO products (id,name,category,brand,price,originalPrice,description,images,stock,rating,ratingCount,featured,tags,soldCount)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [p.id,p.name,p.category,p.brand,p.price,p.originalPrice,p.description,p.images,p.stock,p.rating,p.ratingCount,p.featured,p.tags,p.soldCount]
            );
        }
        console.log(`   ✅ ${allProducts.length} products inserted.\n`);

        // ── STEP 5: COUPONS ──────────────────────────────────
        console.log('Seeding coupons...');
        const coupons = [
            { code:'WELCOME10', discount:10,  type:'percent', minOrder:500,  maxDiscount:200, active:1, usageLimit:100, usedCount:12 },
            { code:'FLAT50',    discount:50,  type:'flat',    minOrder:1000, maxDiscount:50,  active:1, usageLimit:50,  usedCount:8  },
            { code:'SAVE20',    discount:20,  type:'percent', minOrder:2000, maxDiscount:500, active:1, usageLimit:200, usedCount:45 },
            { code:'MEGA100',   discount:100, type:'flat',    minOrder:3000, maxDiscount:100, active:1, usageLimit:30,  usedCount:5  },
            { code:'SUMMER25',  discount:25,  type:'percent', minOrder:1500, maxDiscount:750, active:1, usageLimit:150, usedCount:0  },
            { code:'NEWUSER15', discount:15,  type:'percent', minOrder:300,  maxDiscount:300, active:1, usageLimit:500, usedCount:0  }
        ];
        for (const c of coupons) {
            await conn.query(
                'INSERT INTO coupons (code,discount,type,minOrder,maxDiscount,active,usageLimit,usedCount) VALUES (?,?,?,?,?,?,?,?)',
                [c.code,c.discount,c.type,c.minOrder,c.maxDiscount,c.active,c.usageLimit,c.usedCount]
            );
        }
        console.log(`   ✅ ${coupons.length} coupons inserted.\n`);

        // ── STEP 6: ORDERS ───────────────────────────────────
        console.log('Seeding orders...');
        const orders = [
            {
                id:'ORD-DEMO-001', userId:'user-001',
                items: JSON.stringify([
                    { productId:'prod-001', name:'MacBook Pro 16"', price:249999, quantity:1, image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600' },
                    { productId:'prod-007', name:'AirPods Pro 2',   price:24999,  quantity:1, image:'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600' }
                ]),
                total:319796, status:'delivered',
                shippingAddress: JSON.stringify({label:'Home',street:'456 MG Road',city:'Mumbai',state:'Maharashtra',zip:'400001',phone:'9876543211'}),
                paymentMethod:'UPI',
                statusHistory: JSON.stringify([
                    {status:'confirmed',        timestamp:'2024-03-01', message:'Order confirmed'},
                    {status:'processing',       timestamp:'2024-03-02', message:'Being packed'},
                    {status:'shipped',          timestamp:'2024-03-03', message:'Out for shipping'},
                    {status:'out_for_delivery', timestamp:'2024-03-05', message:'Out for delivery'},
                    {status:'delivered',        timestamp:'2024-03-06', message:'Delivered!'}
                ]),
                createdAt:'2024-03-01 05:30:00'
            },
            {
                id:'ORD-DEMO-002', userId:'user-001',
                items: JSON.stringify([
                    {productId:'prod-021', name:'Atomic Habits', price:499, quantity:2, image:'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600'}
                ]),
                total:1276, status:'shipped',
                shippingAddress: JSON.stringify({label:'Home',street:'456 MG Road',city:'Mumbai',state:'Maharashtra',zip:'400001',phone:'9876543211'}),
                paymentMethod:'Credit Card',
                statusHistory: JSON.stringify([
                    {status:'confirmed',  timestamp:'2024-04-01', message:'Order confirmed'},
                    {status:'processing', timestamp:'2024-04-02', message:'Being packed'},
                    {status:'shipped',    timestamp:'2024-04-03', message:'Shipped via BlueDart'}
                ]),
                createdAt:'2024-04-01 05:30:00'
            },
            {
                id:'ORD-DEMO-003', userId:'user-002',
                items: JSON.stringify([
                    {productId:'prod-022', name:'Luxury Skincare Set',        price:4999, quantity:1, image:'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600'},
                    {productId:'prod-023', name:'Premium Perfume Collection', price:8999, quantity:1, image:'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'}
                ]),
                total:16514, status:'confirmed',
                shippingAddress: JSON.stringify({label:'Home',street:'789 Anna Nagar',city:'Chennai',state:'Tamil Nadu',zip:'600040',phone:'9876543212'}),
                paymentMethod:'Cash on Delivery',
                statusHistory: JSON.stringify([
                    {status:'confirmed', timestamp:'2024-04-06', message:'Order confirmed successfully'}
                ]),
                createdAt:'2024-04-06 05:30:00'
            }
        ];
        for (const o of orders) {
            await conn.query(
                'INSERT INTO orders (id,userId,items,total,status,shippingAddress,paymentMethod,statusHistory,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
                [o.id,o.userId,o.items,o.total,o.status,o.shippingAddress,o.paymentMethod,o.statusHistory,o.createdAt]
            );
        }
        console.log(`   ✅ ${orders.length} orders inserted.\n`);

        // ── STEP 7: REVIEWS ──────────────────────────────────
        console.log('Seeding reviews...');
        const reviews = [
            {id:'rev-001', userId:'user-001', productId:'prod-001', rating:5, comment:'Amazing laptop! The M3 Pro chip is blazing fast.',        createdAt:'2024-03-10 10:00:00'},
            {id:'rev-002', userId:'user-001', productId:'prod-007', rating:5, comment:'Best earbuds ever. Noise cancellation is top-notch!',      createdAt:'2024-03-11 10:00:00'},
            {id:'rev-003', userId:'user-002', productId:'prod-022', rating:4, comment:'Great skincare set, my skin feels better after a week.',   createdAt:'2024-03-20 10:00:00'},
            {id:'rev-004', userId:'user-002', productId:'prod-023', rating:5, comment:'Dior Sauvage smells divine! Worth every rupee.',           createdAt:'2024-03-21 10:00:00'},
            {id:'rev-005', userId:'user-001', productId:'prod-021', rating:5, comment:'Atomic Habits changed my life. Highly recommend!',         createdAt:'2024-04-08 10:00:00'}
        ];
        for (const r of reviews) {
            await conn.query(
                'INSERT INTO reviews (id,userId,productId,rating,comment,createdAt) VALUES (?,?,?,?,?,?)',
                [r.id,r.userId,r.productId,r.rating,r.comment,r.createdAt]
            );
        }
        console.log(`   ✅ ${reviews.length} reviews inserted.\n`);

        // ── STEP 8: CARTS ────────────────────────────────────
        console.log('Seeding carts...');
        const carts = [
            {userId:'user-001', items:JSON.stringify([{productId:'prod-008',quantity:1,addedAt:'2024-04-01T10:00:00Z',savedForLater:false},{productId:'prod-003',quantity:1,addedAt:'2024-04-01T10:00:00Z',savedForLater:false}])},
            {userId:'user-002', items:JSON.stringify([{productId:'prod-010',quantity:2,addedAt:'2024-04-01T10:00:00Z',savedForLater:false}])}
        ];
        for (const c of carts) {
            await conn.query('INSERT INTO carts (userId,items) VALUES (?,?)', [c.userId, c.items]);
        }
        console.log(`   ✅ ${carts.length} carts inserted.\n`);

        // ── STEP 9: WISHLISTS ────────────────────────────────
        console.log('Seeding wishlists...');
        const wishlists = [
            {userId:'user-001', productIds:JSON.stringify(['prod-002','prod-004','prod-026','prod-027'])},
            {userId:'user-002', productIds:JSON.stringify(['prod-010','prod-011','prod-030'])}
        ];
        for (const w of wishlists) {
            await conn.query('INSERT INTO wishlists (userId,productIds) VALUES (?,?)', [w.userId, w.productIds]);
        }
        console.log(`   ✅ ${wishlists.length} wishlists inserted.\n`);

        // ── STEP 10: NOTIFICATIONS ───────────────────────────
        console.log('Seeding notifications...');
        const notifications = [
            {id:'notif-001', userId:'user-001',  title:'Welcome to ShopWave!', message:'Start exploring amazing products at great prices!',         is_read:1, createdAt:'2024-02-15 05:30:00'},
            {id:'notif-002', userId:'user-001',  title:'Order Delivered!',     message:'Your order ORD-DEMO-001 has been delivered successfully.',  is_read:1, createdAt:'2024-03-06 05:30:00'},
            {id:'notif-003', userId:'user-001',  title:'Order Shipped',        message:'Your order ORD-DEMO-002 is on its way via BlueDart!',       is_read:0, createdAt:'2024-04-03 05:30:00'},
            {id:'notif-004', userId:'user-001',  title:'New Offer SUMMER25',   message:'Get 25% off on orders above Rs.1500! Use code SUMMER25.',   is_read:0, createdAt:'2024-04-06 05:30:00'},
            {id:'notif-005', userId:'user-002',  title:'Welcome to ShopWave!', message:'Discover amazing products at the best prices.',              is_read:1, createdAt:'2024-03-10 05:30:00'},
            {id:'notif-006', userId:'user-002',  title:'Order Confirmed!',     message:'Your order ORD-DEMO-003 has been placed successfully.',     is_read:0, createdAt:'2024-04-06 05:30:00'},
            {id:'notif-007', userId:'admin-001', title:'Low Stock Alert',      message:'5 products are running low on stock. Please restock!',      is_read:0, createdAt:'2024-04-06 05:30:00'},
            {id:'notif-008', userId:'admin-001', title:'New Order Received',   message:'Order ORD-DEMO-003 received from Priya Sharma (Rs.16514).', is_read:0, createdAt:'2024-04-06 05:30:00'}
        ];
        for (const n of notifications) {
            await conn.query(
                'INSERT INTO notifications (id,userId,title,message,is_read,createdAt) VALUES (?,?,?,?,?,?)',
                [n.id,n.userId,n.title,n.message,n.is_read,n.createdAt]
            );
        }
        console.log(`   ✅ ${notifications.length} notifications inserted.\n`);

        // ── STEP 11: ACTIVITIES ──────────────────────────────
        console.log('Seeding activities...');
        const activities = [
            {id:'act-001', userId:'user-001',  type:'login',           description:'User logged in from Mumbai, Maharashtra',        risk:'low',    timestamp:'2024-03-01 10:00:00'},
            {id:'act-002', userId:'user-001',  type:'purchase',        description:'Purchased MacBook Pro 16 and AirPods Pro 2',     risk:'low',    timestamp:'2024-03-01 10:30:00'},
            {id:'act-003', userId:'user-001',  type:'login',           description:'User logged in from new device (IP changed)',    risk:'medium', timestamp:'2024-03-10 14:00:00'},
            {id:'act-004', userId:'user-002',  type:'login',           description:'User logged in from Chennai, Tamil Nadu',        risk:'low',    timestamp:'2024-03-10 09:00:00'},
            {id:'act-005', userId:'user-002',  type:'purchase',        description:'Purchased Luxury Skincare Set and Dior Perfume', risk:'low',    timestamp:'2024-03-10 09:45:00'},
            {id:'act-006', userId:null,        type:'failed_login',    description:'Multiple failed login attempts on admin account', risk:'high',   timestamp:'2024-03-15 03:22:00'},
            {id:'act-007', userId:'user-001',  type:'cart_add',        description:'Added PlayStation 5 to cart',                   risk:'low',    timestamp:'2024-04-01 11:00:00'},
            {id:'act-008', userId:'user-001',  type:'coupon_applied',  description:'Applied coupon FLAT50 at checkout',              risk:'low',    timestamp:'2024-04-01 12:00:00'},
            {id:'act-009', userId:null,        type:'suspicious_scan', description:'Rapid automated product page scans detected',    risk:'high',   timestamp:'2024-04-06 05:30:00'},
            {id:'act-010', userId:'admin-001', type:'admin_login',     description:'Admin logged into dashboard from Bangalore',     risk:'low',    timestamp:'2024-04-06 05:30:00'}
        ];
        for (const a of activities) {
            await conn.query(
                'INSERT INTO activities (id,userId,type,description,risk,timestamp) VALUES (?,?,?,?,?,?)',
                [a.id,a.userId,a.type,a.description,a.risk,a.timestamp]
            );
        }
        console.log(`   ✅ ${activities.length} activities inserted.\n`);

        // ── FINAL SUMMARY ────────────────────────────────────
        console.log('============================================');
        console.log('  SEEDING COMPLETE!');
        console.log('============================================');
        console.log(`  users         -> ${users.length} rows`);
        console.log(`  categories    -> ${categories.length} rows`);
        console.log(`  products      -> ${allProducts.length} rows`);
        console.log(`  coupons       -> ${coupons.length} rows`);
        console.log(`  orders        -> ${orders.length} rows`);
        console.log(`  reviews       -> ${reviews.length} rows`);
        console.log(`  carts         -> ${carts.length} rows`);
        console.log(`  wishlists     -> ${wishlists.length} rows`);
        console.log(`  notifications -> ${notifications.length} rows`);
        console.log(`  activities    -> ${activities.length} rows`);
        console.log('============================================\n');
        console.log('Login Credentials:');
        console.log('  Admin : admin@shopwave.com / admin123');
        console.log('  User1 : john@example.com   / user123');
        console.log('  User2 : priya@example.com  / user123\n');

    } catch (err) {
        console.error('\n❌ SEEDING FAILED!');
        console.error('   Error:', err.message);
        if (err.sql) console.error('   SQL:', err.sql.substring(0, 150));
        console.error('\nFix the error above and run again: node backend/seed-db.js\n');
        process.exitCode = 1;
    } finally {
        // Always re-enable FK checks, even on failure
        if (fkDisabled && conn) {
            try { await conn.query('SET FOREIGN_KEY_CHECKS = 1'); } catch(_) {}
        }
        if (conn) await conn.end();
    }
}

seed();
