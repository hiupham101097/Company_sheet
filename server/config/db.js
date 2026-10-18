import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  initialUsers,
  initialAssets,
  initialFinance,
  initialTasks,
  initialContracts,
  initialHandover,
  initialAttendance
} from './initialData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', '..', 'local_database.json');

const {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_DATABASE_ID,
  CLOUDFLARE_API_TOKEN
} = process.env;

const isCloudflareD1Configured = Boolean(
  CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_DATABASE_ID && CLOUDFLARE_API_TOKEN
);

// Cloudflare D1 HTTP API client
async function executeCloudflareD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Cloudflare D1 query error');
  }
  return data.result?.[0]?.results || [];
}

// Local Persistent Store (Active when offline or CF D1 not configured)
let memoryStore = {
  users: [...initialUsers],
  assets: [...initialAssets],
  finance: [...initialFinance],
  tasks: [...initialTasks],
  contracts: [...initialContracts],
  handover: [...initialHandover],
  attendance: [...initialAttendance]
};

function loadLocalStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryStore = { ...memoryStore, ...parsed };
    } else {
      saveLocalStore();
    }
  } catch (err) {
    console.error('[DB] Error loading local database, using initial data:', err.message);
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving local database:', err.message);
  }
}

loadLocalStore();

export const db = {
  isCloudflare: isCloudflareD1Configured,

  async getCollection(name) {
    if (isCloudflareD1Configured) {
      return executeCloudflareD1(`SELECT * FROM ${name} ORDER BY created_at DESC`);
    }
    return memoryStore[name] || [];
  },

  async getById(name, id) {
    if (isCloudflareD1Configured) {
      const res = await executeCloudflareD1(`SELECT * FROM ${name} WHERE id = ?`, [id]);
      return res[0] || null;
    }
    const items = memoryStore[name] || [];
    return items.find((item) => item.id === id) || null;
  },

  async insert(name, item) {
    const newItem = {
      id: item.id || `${name.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
      ...item
    };

    if (isCloudflareD1Configured) {
      const keys = Object.keys(newItem);
      const placeholders = keys.map(() => '?').join(', ');
      const values = Object.values(newItem);
      await executeCloudflareD1(
        `INSERT INTO ${name} (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
      return newItem;
    }

    if (!memoryStore[name]) memoryStore[name] = [];
    memoryStore[name].unshift(newItem);
    saveLocalStore();
    return newItem;
  },

  async update(name, id, updateFields) {
    if (isCloudflareD1Configured) {
      const keys = Object.keys(updateFields);
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = [...Object.values(updateFields), id];
      await executeCloudflareD1(
        `UPDATE ${name} SET ${setClause} WHERE id = ?`,
        values
      );
      return this.getById(name, id);
    }

    if (!memoryStore[name]) return null;
    const index = memoryStore[name].findIndex((item) => item.id === id);
    if (index === -1) return null;

    memoryStore[name][index] = {
      ...memoryStore[name][index],
      ...updateFields,
      updated_at: new Date().toISOString()
    };
    saveLocalStore();
    return memoryStore[name][index];
  },

  async remove(name, id) {
    if (isCloudflareD1Configured) {
      await executeCloudflareD1(`DELETE FROM ${name} WHERE id = ?`, [id]);
      return true;
    }

    if (!memoryStore[name]) return false;
    const initialLen = memoryStore[name].length;
    memoryStore[name] = memoryStore[name].filter((item) => item.id !== id);
    if (memoryStore[name].length !== initialLen) {
      saveLocalStore();
      return true;
    }
    return false;
  }
};
