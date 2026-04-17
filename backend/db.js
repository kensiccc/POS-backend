const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbName = process.env.DB_NAME || 'houseblend_pos';
const baseDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
};

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: baseDbConfig.host,
    user: baseDbConfig.user,
    password: baseDbConfig.password,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`);
  await connection.end();
}

const pool = mysql.createPool({
  ...baseDbConfig,
  database: dbName,
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findUserByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function createUser({ name, email, password, role = 'cashier' }) {
  const password_hash = await bcrypt.hash(password, 10);
  const normalizedEmail = String(email).toLowerCase().trim();
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [name, normalizedEmail, password_hash, role]
  );
  return result.insertId;
}

async function createTables() {
  await ensureDatabaseExists();

  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','cashier') NOT NULL DEFAULT 'cashier',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      category_id INT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      threshold INT NOT NULL DEFAULT 10,
      image_url VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(20) NOT NULL,
      user_id INT,
      customer_name VARCHAR(100) NOT NULL DEFAULT 'Guest',
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
      discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
      discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      cash DECIMAL(10,2) NOT NULL DEFAULT 0,
      change_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      promo_code VARCHAR(100) DEFAULT '',
      order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT,
      quantity INT NOT NULL DEFAULT 0,
      unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      attributes JSON DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await seedDefaultCategories();
  await seedDefaultUsers();
  await seedDefaultProducts();
}

async function seedDefaultCategories() {
  const categories = ['coffee', 'tea', 'snacks'];
  for (const name of categories) {
    await query(
      'INSERT IGNORE INTO categories (name) VALUES (?)',
      [name]
    );
  }
}

async function seedDefaultUsers() {
  const admin = await findUserByEmail('admin@houseblend.local');
  if (!admin) {
    await createUser({
      name: 'Admin',
      email: 'admin@houseblend.local',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin'
    });
  }

  const cashier = await findUserByEmail('cashier@houseblend.local');
  if (!cashier) {
    await createUser({
      name: 'Cashier',
      email: 'cashier@houseblend.local',
      password: process.env.CASHIER_PASSWORD || 'Cashier123!',
      role: 'cashier'
    });
  }
}

async function seedDefaultProducts() {
  const rows = await query('SELECT COUNT(*) as count FROM products');
  if (rows[0].count > 0) return;

  const categoryRows = await query('SELECT id, name FROM categories');
  const categoryMap = categoryRows.reduce((map, cat) => {
    map[cat.name] = cat.id;
    return map;
  }, {});

  const seedItems = [
    { name: 'Cappuccino', category: 'coffee', price: 85, stock: 45, threshold: 12, image_url: '/images/matcha-dream.jpg' },
    { name: 'Matcha Latte', category: 'coffee', price: 95, stock: 35, threshold: 15, image_url: '/images/matcha.jpg' },
    { name: 'Okinawa Milk Tea', category: 'tea', price: 105, stock: 28, threshold: 12, image_url: '/images/okinawa.jpg' },
    { name: 'Chocolate Mousse', category: 'snacks', price: 110, stock: 15, threshold: 10, image_url: '/images/chocolate.jpg' },
    { name: 'Blueberry Muffin', category: 'snacks', price: 120, stock: 8, threshold: 10, image_url: '/images/strawberry.jpg' },
    { name: 'Latte', category: 'coffee', price: 90, stock: 42, threshold: 12, image_url: '/images/taro-latte.jpg' },
    { name: 'Iced Tea', category: 'tea', price: 88, stock: 55, threshold: 18, image_url: '/images/dark-chocolate.jpg' },
    { name: 'Cheesecake Slice', category: 'snacks', price: 105, stock: 12, threshold: 10, image_url: '/images/oreo-cheesecake.jpg' },
    { name: 'Green Tea Latte', category: 'tea', price: 100, stock: 38, threshold: 14, image_url: '/images/matcha-dream.jpg' },
    { name: 'Cold Brew', category: 'coffee', price: 75, stock: 60, threshold: 20, image_url: '/images/boba.jpg' },
    { name: 'Espresso Cookie', category: 'snacks', price: 92, stock: 5, threshold: 8, image_url: '/images/cookies-and-cream.jpg' },
    { name: 'Mango Smoothie', category: 'snacks', price: 110, stock: 30, threshold: 12, image_url: '/images/manggo-smoothie.jpg' },
  ];

  for (const item of seedItems) {
    await query(
      `INSERT INTO products (name, description, category_id, price, stock, threshold, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.name, item.description || '', categoryMap[item.category] || null, item.price, item.stock, item.threshold, item.image_url]
    );
  }
}

async function resetDemoData() {
  await query('SET FOREIGN_KEY_CHECKS = 0');
  await query('TRUNCATE TABLE order_items');
  await query('TRUNCATE TABLE orders');
  await query('TRUNCATE TABLE products');
  await query('TRUNCATE TABLE categories');
  await query('TRUNCATE TABLE users');
  await query('SET FOREIGN_KEY_CHECKS = 1');
  await createTables();
}

module.exports = {
  pool,
  query,
  createTables,
  findUserByEmail,
  createUser,
  resetDemoData,
};
