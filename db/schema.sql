CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL ,
    phone_number TEXT UNIQUE,
    password_hash TEXT ,
    user_role TEXT NOT NULL CHECK(user_role IN ('Client','Admin')),
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    fcm_token TEXT
);

CREATE TABLE IF NOT EXISTS clients (
    user_id INTEGER PRIMARY KEY,
    address TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK(activity_type IN('Wedding hall','Cafe','Club','Restaurant')),
    activity_name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS baskets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK (content_type IN ('Plastic','Canz')),
    content_weight REAL NOT NULL,
    order_id INTEGER,
    client_id INTEGER NOT NULL,
    is_full BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    screenshot_path TEXT,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABlE IF NOT EXISTS orders (
id INTEGER PRIMARY KEY AUTOINCREMENT,
client_id INTEGER NOT NULL,
status TEXT NOT NULL CHECK(status IN ('Pending', 'Completed', 'Cancelled')),
created_at DATETIME DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS wallets (
    user_id INTEGER PRIMARY KEY,
    balance REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sold (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK (content_type IN ('Plastic','Canz')),
    content_weight REAL NOT NULL,
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
);