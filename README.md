# 🌊 ShopWave — AI-Powered E-Commerce Platform

![ShopWave Banner](https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80)

> A full-stack e-commerce web application built with **Node.js**, **Express**, and **Vanilla JS** — featuring a sleek dark UI, AI-powered recommendations, real-time order tracking, admin dashboard, and more.

🚀 **Live Demo:** [https://shopwaveshopwave.onrender.com](https://shopwaveshopwave.onrender.com)

---

## ✨ Features

### 🛒 Customer Features
- **Product Catalog** — 200+ products across 11 categories (Electronics, Fashion, Home & Living, Sports, Books, Beauty, and more)
- **Smart Search** — Live search with auto-suggestions by name, brand, and tags
- **Category Filtering** — Browse and filter by category, price range, brand, and rating
- **Product Detail View** — High-res images, stock status, customer reviews, and related products
- **Shopping Cart** — Add/remove items, update quantities, save for later
- **Wishlist** — Save favourite products across sessions
- **Coupon System** — Apply discount codes at checkout (WELCOME10, FLAT50, SAVE20, MEGA100)
- **Checkout Flow** — Address selection, payment method, order summary
- **Order Tracking** — Real-time status timeline (Confirmed → Processing → Shipped → Delivered)
- **Order Cancellation** — Cancel with reason before delivery
- **Return & Refund** — Submit return requests within 7 days of delivery
- **AI Recommendations** — Personalised product suggestions based on order and browsing history
- **Notifications** — In-app alerts for order updates, return status, welcome messages
- **Dark / Light Mode** — Theme toggle with persistent preference

### 🔧 Admin Dashboard
- **Overview Dashboard** — Revenue charts, order stats, top products, low-stock alerts
- **Product Management** — Add, edit, delete products with image upload
- **Order Management** — View and update order statuses
- **User Management** — View users, block/unblock accounts
- **Return Management** — Approve or reject return/refund requests
- **Inventory Tracker** — Stock levels across all products
- **Fraud Detection** — Activity log with risk levels
- **Coupon Management** — View all active discount codes

### 🔐 Authentication
- JWT-based login/signup
- Secure password hashing with bcrypt
- Role-based access (admin vs. user)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Database** | MySQL (user persistence) + In-Memory (products, orders, cart) |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **File Upload** | Multer |
| **Deployment** | Render.com (backend + frontend) |
| **Version Control** | Git + GitHub |

---

## 📁 Project Structure

```
Shop-Wave/
├── backend/
│   ├── server.js          # Main Express server & all API routes
│   ├── db.js              # MySQL connection pool
│   ├── products_part1.js  # Extended product catalog (part 1)
│   ├── products_part2.js  # Extended product catalog (part 2)
│   ├── seed-db.js         # Database seeder script
│   └── package.json       # Backend package config
│
├── frontend/
│   ├── index.html         # Main storefront
│   ├── admin.html         # Admin dashboard
│   ├── login.html         # Login / Signup page
│   ├── css/
│   │   └── styles.css     # Global styles (dark/light theme)
│   └── js/
│       └── app.js         # Frontend logic (SPA)
│
├── uploads/               # User-uploaded product images
├── database.sql           # MySQL schema
├── .env                   # Environment variables (not committed)
├── railway.json           # Railway deployment config
├── package.json           # Root package config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://www.mysql.com/) (optional — app works with in-memory data without it)

### 1. Clone the repository
```bash
git clone https://github.com/Kumaresan-31/Shopwave.git
cd Shopwave
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=shopwave
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 4. Set up the database (optional)
```bash
# Run the SQL schema in MySQL
mysql -u root -p < database.sql
```

### 5. Start the server
```bash
cd backend
npm start
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | `admin@shopwave.com` | `admin123` |
| 👤 User | `john@example.com` | `user123` |

---

## 🎟️ Available Coupon Codes

| Code | Discount | Min Order |
|------|----------|-----------|
| `WELCOME10` | 10% off (max ₹200) | ₹500 |
| `FLAT50` | ₹50 off | ₹1,000 |
| `SAVE20` | 20% off (max ₹500) | ₹2,000 |
| `MEGA100` | ₹100 off | ₹3,000 |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (filter, sort, paginate) |
| GET | `/api/products/:id` | Get product details + reviews |
| GET | `/api/products/search-suggestions` | Live search autocomplete |
| POST | `/api/products` | Add product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | Get user's orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/cancel` | Cancel an order |
| POST | `/api/orders/:id/return` | Submit return request |

### Cart & Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/cart` | Get or add to cart |
| PUT/DELETE | `/api/cart/:productId` | Update or remove item |
| GET/POST | `/api/wishlist` | Get or add to wishlist |
| DELETE | `/api/wishlist/:productId` | Remove from wishlist |

---

## 📦 Deployment

This project is deployed on **[Render.com](https://render.com)** (free tier).

### Deploy your own instance
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node backend/server.js`
   - **Environment Variables:** Add your `.env` values
5. Click **Deploy**

---

## 📸 Screenshots

### 🏠 Home Page
![Home](https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=70)

### 🛍️ Product Catalog
![Shop](https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=70)

### 📊 Admin Dashboard
![Admin](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=70)

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Made with ❤️ by [Kumaresan B](https://github.com/Kumaresan-31)

⭐ Star this repo if you found it useful!

</div>
