-- Cloudflare D1 Schema for Enterprise Management System

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'STAFF', -- ADMIN, MANAGER, STAFF
  department TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Máy tính, Thiết bị mạng, Bàn ghế, Xe cộ, v.v.
  serial_number TEXT,
  purchase_date DATE,
  price REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'IN_USE', -- IN_USE, AVAILABLE, MAINTENANCE, BROKEN, LIQUIDATED
  location TEXT,
  assigned_to_user_id TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS finance (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- REVENUE (Thu), EXPENSE (Chi)
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  invoice_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_user_id TEXT,
  due_date DATETIME NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, OVERDUE
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- PARTNER, SERVICE, ASSET_LEASE, EMPLOYEE
  partner_name TEXT NOT NULL,
  value REAL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, EXPIRED, TERMINATED
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS handover_protocols (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  asset_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'HANDOVER', -- HANDOVER (Bàn giao), RETURN (Thu hồi), AUDIT (Kiểm kê)
  handover_date DATE NOT NULL,
  condition TEXT NOT NULL DEFAULT 'Hoạt động tốt',
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  total_hours REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ON_TIME', -- ON_TIME, LATE, EARLY_LEAVE, ABSENT, LEAVE_PERMITTED
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
