CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK(user_role IN ('Client','Admin','Delivery')),
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
CREATE TABLE IF NOT EXISTS deliveries (
    user_id INTEGER PRIMARY KEY,
    is_available BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS basket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK (content_type IN ('Plastic','Canz')),
    content_weight TEXT NOT NULL CHECK (content_weight IN ('2kg','5kg','10kg')),
    client_id INTEGER NOT NULL,
    is_full BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
 client_id INTEGER NOT NULL FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
 order_status TEXT NOT NULL CHECK (order_status IN ('Pending','on the way','Complete')),
 cost INTEGER NOT NULL,
 delivery_id INTEGER NOT NULL FOREIGN KEY (delivery_id) REFERENCES deliveries(user_id) ON DELETE CASCADE,
 deliverd_at DATETIME,
 admin_id INTEGER NOT NULL FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
 created_at DATETIME DEFAULT (datetime('now')),
 updated_at DATETIME DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS transaction(
id INTEGER PRIMARY KEY AUTOINCREMENT,
from_user INTEGER NOT NULL FOREIGN KEY(from_user)REFERENCES users(id) ON DELETE CASCADE,
to_user INTEGER NOT NULL FOREIGN KEY(to_user)REFERENCES users(id) ON DELETE CASCADE,
order_id INTEGER NOT NULL FOREIGN KEY(order_id)REFERENCES orders(id) ON DELETE CASCADE,
amount REAL NOT NULL,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now'))
)
CREATE TABLE IF NOT EXISTS wallet(
    user_id INTEGER PRIMARY KEY FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    balance REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))

);