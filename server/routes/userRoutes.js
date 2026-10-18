import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await db.getCollection('users');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, role, department, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Tên và email là bắt buộc' });
    }

    const newUser = await db.insert('users', {
      name,
      email,
      role: role || 'STAFF',
      department: department || 'Phòng Kế Hoạch',
      phone: phone || '',
      avatar: req.body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      status: 'ACTIVE'
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await db.update('users', req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await db.remove('users', req.params.id);
    res.json({ success: ok, message: ok ? 'Đã xóa người dùng' : 'Không tìm thấy' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
