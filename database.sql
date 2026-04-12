-- ============================================================
-- ShopWave E-Commerce Database Schema
-- CHARACTER SET: utf8mb4 (supports emojis and all Unicode)
-- ============================================================

CREATE DATABASE IF NOT EXISTS shopwave
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE shopwave;

-- Ensure database-level charset
ALTER DATABASE shopwave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── Users Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('user', 'admin') DEFAULT 'user',
    avatar      VARCHAR(255) DEFAULT NULL,
    addresses   JSON         DEFAULT NULL,
    createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    blocked     BOOLEAN      DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Categories Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id    VARCHAR(50)  PRIMARY KEY,
    name  VARCHAR(100) NOT NULL,
    icon  VARCHAR(50)  DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Products Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id            VARCHAR(50)    PRIMARY KEY,
    name          VARCHAR(200)   NOT NULL,
    category      VARCHAR(50)    NOT NULL,
    brand         VARCHAR(100)   DEFAULT NULL,
    price         DECIMAL(10,2)  NOT NULL,
    originalPrice DECIMAL(10,2)  DEFAULT NULL,
    description   TEXT,
    images        JSON           DEFAULT NULL,
    stock         INT            DEFAULT 0,
    rating        DECIMAL(3,2)   DEFAULT 0,
    ratingCount   INT            DEFAULT 0,
    featured      BOOLEAN        DEFAULT FALSE,
    tags          JSON           DEFAULT NULL,
    soldCount     INT            DEFAULT 0,
    createdAt     DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Orders Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id              VARCHAR(50)   PRIMARY KEY,
    userId          VARCHAR(50)   NOT NULL,
    items           JSON          NOT NULL,
    total           DECIMAL(10,2) NOT NULL,
    status          ENUM('pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
    shippingAddress JSON          NOT NULL,
    paymentMethod   VARCHAR(50)   NOT NULL,
    statusHistory   JSON          DEFAULT NULL,
    createdAt       DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Reviews Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id        VARCHAR(50) PRIMARY KEY,
    userId    VARCHAR(50) NOT NULL,
    productId VARCHAR(50) NOT NULL,
    rating    INT         NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment   TEXT,
    createdAt DATETIME    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Coupons Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
    code        VARCHAR(50)   PRIMARY KEY,
    discount    DECIMAL(10,2) NOT NULL,
    type        ENUM('percent','flat') NOT NULL,
    minOrder    DECIMAL(10,2) DEFAULT 0,
    maxDiscount DECIMAL(10,2) DEFAULT NULL,
    active      BOOLEAN       DEFAULT TRUE,
    usageLimit  INT           DEFAULT 0,
    usedCount   INT           DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Notifications Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id        VARCHAR(50)  PRIMARY KEY,
    userId    VARCHAR(50)  NOT NULL,
    title     VARCHAR(200) NOT NULL,
    message   TEXT         NOT NULL,
    is_read   BOOLEAN      DEFAULT FALSE,
    createdAt DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Carts Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
    userId    VARCHAR(50) PRIMARY KEY,
    items     JSON        DEFAULT NULL,
    updatedAt DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Wishlists Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
    userId     VARCHAR(50) PRIMARY KEY,
    productIds JSON        DEFAULT NULL,
    updatedAt  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Activities Table (Fraud / Audit Log) ──────────────────────
CREATE TABLE IF NOT EXISTS activities (
    id          VARCHAR(50)  PRIMARY KEY,
    userId      VARCHAR(50)  DEFAULT NULL,
    type        VARCHAR(100) NOT NULL,
    description TEXT,
    risk        ENUM('low','medium','high') DEFAULT 'low',
    timestamp   DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
