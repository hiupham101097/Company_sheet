import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';
import {
  initialUsers,
  initialAssets,
  initialFinance,
  initialTasks,
  initialContracts,
  initialHandover,
  initialAttendance
} from '../config/initialData.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, '..', '..', '.env');
const SCHEMA_PATH = path.join(__dirname, '..', 'config', 'schema.sql');

// Lấy trạng thái cấu hình hiện tại
router.get('/status', (req, res) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID || '';
  const hasToken = Boolean(process.env.CLOUDFLARE_API_TOKEN);

  res.json({
    success: true,
    data: {
      isConfigured: Boolean(accountId && databaseId && hasToken),
      accountId: accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : '',
      databaseId: databaseId ? `${databaseId.slice(0, 6)}...${databaseId.slice(-4)}` : '',
      hasToken,
      databaseMode: db.isCloudflare ? 'Cloudflare D1 Production' : 'Local Persistent Storage'
    }
  });
});

// Kiểm tra kết nối với thông số nhập vào
router.post('/test', async (req, res) => {
  const { accountId, databaseId, apiToken } = req.body;
  if (!accountId || !databaseId || !apiToken) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ 3 thông số' });
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: 'SELECT 1 as ping' })
    });

    const data = await response.json();
    if (!data.success) {
      return res.status(400).json({
        success: false,
        message: data.errors?.[0]?.message || 'Không thể xác thực với Cloudflare D1'
      });
    }

    res.json({ success: true, message: 'Kết nối Cloudflare D1 thành công mỹ mãn!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lưu cấu hình vào file .env
router.post('/save', async (req, res) => {
  const { accountId, databaseId, apiToken } = req.body;
  if (!accountId || !databaseId || !apiToken) {
    return res.status(400).json({ success: false, message: 'Thiếu thông số cấu hình' });
  }

  try {
    process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
    process.env.CLOUDFLARE_DATABASE_ID = databaseId;
    process.env.CLOUDFLARE_API_TOKEN = apiToken;

    const envContent = `PORT=${process.env.PORT || 5000}
NODE_ENV=development
CLOUDFLARE_ACCOUNT_ID=${accountId}
CLOUDFLARE_DATABASE_ID=${databaseId}
CLOUDFLARE_API_TOKEN=${apiToken}
`;
    fs.writeFileSync(ENV_PATH, envContent, 'utf-8');

    // Chuyển cờ sang Cloudflare
    db.isCloudflare = true;

    res.json({
      success: true,
      message: 'Đã lưu cấu hình Cloudflare D1 vào file .env thành công!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Đồng bộ khởi tạo bảng Schema và Nạp dữ liệu lên Cloudflare D1
router.post('/sync-schema', async (req, res) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return res.status(400).json({ success: false, message: 'Chưa cấu hình Cloudflare D1' });
  }

  async function queryD1(sql, params = []) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Lỗi truy vấn D1');
    }
    return data;
  }

  try {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const sql of statements) {
      await queryD1(sql);
    }

    // Nạp dữ liệu mẫu nếu bảng rỗng
    for (const u of initialUsers) {
      await queryD1(
        `INSERT OR REPLACE INTO users (id, name, email, role, department, phone, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, u.role, u.department, u.phone, u.avatar, u.status]
      );
    }

    for (const a of initialAssets) {
      await queryD1(
        `INSERT OR REPLACE INTO assets (id, code, name, category, serial_number, purchase_date, price, status, location, assigned_to_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.code, a.name, a.category, a.serial_number, a.purchase_date, a.price, a.status, a.location, a.assigned_to_user_id, a.notes]
      );
    }

    for (const f of initialFinance) {
      await queryD1(
        `INSERT OR REPLACE INTO finance (id, type, category, amount, date, description, invoice_number) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [f.id, f.type, f.category, f.amount, f.date, f.description, f.invoice_number]
      );
    }

    for (const t of initialTasks) {
      await queryD1(
        `INSERT OR REPLACE INTO tasks (id, title, description, assigned_to_user_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.title, t.description, t.assigned_to_user_id, t.due_date, t.priority, t.status]
      );
    }

    res.json({
      success: true,
      message: 'Khởi tạo cấu trúc bảng & đồng bộ dữ liệu lên Cloudflare D1 thành công!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
