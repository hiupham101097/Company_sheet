import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Lấy danh sách toàn bộ tài sản / thiết bị
router.get('/', async (req, res) => {
  try {
    const assets = await db.getCollection('assets');
    const users = await db.getCollection('users');

    // Nối thông tin người đang nắm giữ
    const enriched = assets.map((asset) => {
      const user = users.find((u) => u.id === asset.assigned_to_user_id);
      return {
        ...asset,
        assigned_user_name: user ? user.name : 'Chưa bàn giao',
        assigned_user_department: user ? user.department : ''
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy chi tiết 1 tài sản
router.get('/:id', async (req, res) => {
  try {
    const asset = await db.getById('assets', req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản' });
    }
    res.json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thêm mới tài sản
router.post('/', async (req, res) => {
  try {
    const { name, category, serial_number, price, location, assigned_to_user_id, notes } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Tên tài sản và phân loại là bắt buộc' });
    }

    const code = req.body.code || `TS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const newAsset = await db.insert('assets', {
      code,
      name,
      category,
      serial_number: serial_number || '',
      purchase_date: req.body.purchase_date || new Date().toISOString().split('T')[0],
      price: Number(price) || 0,
      status: req.body.status || 'AVAILABLE',
      location: location || 'Kho công ty',
      assigned_to_user_id: assigned_to_user_id || null,
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: newAsset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật tài sản
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.update('assets', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản để cập nhật' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa tài sản
router.delete('/:id', async (req, res) => {
  try {
    const ok = await db.remove('assets', req.params.id);
    res.json({ success: ok, message: ok ? 'Đã xóa tài sản' : 'Không tìm thấy tài sản' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
