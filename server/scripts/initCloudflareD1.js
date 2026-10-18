import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initialUsers,
  initialAssets,
  initialFinance,
  initialTasks,
  initialContracts,
  initialHandover,
  initialAttendance
} from '../config/initialData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');

const {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_DATABASE_ID,
  CLOUDFLARE_API_TOKEN
} = process.env;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_DATABASE_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('\n❌ THIẾU THÔNG TIN CẤU HÌNH CLOUDFLARE TRONG FILE backend/.env:');
  console.error('- CLOUDFLARE_ACCOUNT_ID');
  console.error('- CLOUDFLARE_DATABASE_ID');
  console.error('- CLOUDFLARE_API_TOKEN');
  console.error('\nVui lòng kiểm tra và điền đầy đủ các giá trị trên vào file backend/.env rồi chạy lại.\n');
  process.exit(1);
}

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message || 'Lỗi kết nối Cloudflare D1');
  }
  return json.result?.[0];
}

async function main() {
  try {
    console.log('🔄 Đang kiểm tra kết nối tới Cloudflare D1...');
    console.log(`- Account ID: ${CLOUDFLARE_ACCOUNT_ID}`);
    console.log(`- Database ID: ${CLOUDFLARE_DATABASE_ID}`);

    // Kiểm tra ping D1
    const ping = await queryD1('SELECT 1 as connected');
    console.log('✅ Kết nối Cloudflare D1 thành công!', ping?.results);

    // Đọc và thực thi schema.sql
    console.log('\n🔄 Đang tạo cấu trúc bảng (Schema) trên Cloudflare D1...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await queryD1(statement);
    }
    console.log('✅ Đã tạo các bảng: users, assets, finance, tasks, contracts, handover_protocols, attendance');

    // Nạp dữ liệu mẫu ban đầu
    console.log('\n🔄 Đang khởi tạo dữ liệu mẫu lên Cloudflare D1...');
    
    // Nạp users
    for (const u of initialUsers) {
      await queryD1(
        `INSERT OR REPLACE INTO users (id, name, email, role, department, phone, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, u.role, u.department, u.phone, u.avatar, u.status]
      );
    }

    // Nạp assets
    for (const a of initialAssets) {
      await queryD1(
        `INSERT OR REPLACE INTO assets (id, code, name, category, serial_number, purchase_date, price, status, location, assigned_to_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.code, a.name, a.category, a.serial_number, a.purchase_date, a.price, a.status, a.location, a.assigned_to_user_id, a.notes]
      );
    }

    // Nạp finance
    for (const f of initialFinance) {
      await queryD1(
        `INSERT OR REPLACE INTO finance (id, type, category, amount, date, description, invoice_number) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [f.id, f.type, f.category, f.amount, f.date, f.description, f.invoice_number]
      );
    }

    // Nạp tasks
    for (const t of initialTasks) {
      await queryD1(
        `INSERT OR REPLACE INTO tasks (id, title, description, assigned_to_user_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.title, t.description, t.assigned_to_user_id, t.due_date, t.priority, t.status]
      );
    }

    // Nạp contracts
    for (const c of initialContracts) {
      await queryD1(
        `INSERT OR REPLACE INTO contracts (id, code, title, type, partner_name, value, start_date, end_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.code, c.title, c.type, c.partner_name, c.value, c.start_date, c.end_date, c.status, c.notes]
      );
    }

    console.log('🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ LÊN CLOUDFLARE D1 THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

main();
