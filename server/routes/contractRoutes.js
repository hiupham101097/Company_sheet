import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Lấy danh sách hợp đồng
router.get('/', async (req, res) => {
  try {
    const contracts = await db.getCollection('contracts');
    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thêm hợp đồng mới
router.post('/', async (req, res) => {
  try {
    const { title, type, partner_name, value, start_date, end_date, notes } = req.body;
    if (!title || !partner_name) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và tên đối tác là bắt buộc' });
    }

    const code = req.body.code || `HĐ-${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`;
    const newContract = await db.insert('contracts', {
      code,
      title,
      type: type || 'PARTNER',
      partner_name,
      value: Number(value) || 0,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || new Date().toISOString().split('T')[0],
      status: req.body.status || 'ACTIVE',
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: newContract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật hợp đồng
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.update('contracts', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa hợp đồng
router.delete('/:id', async (req, res) => {
  try {
    const ok = await db.remove('contracts', req.params.id);
    res.json({ success: ok, message: ok ? 'Đã xóa hợp đồng' : 'Không tìm thấy hợp đồng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------- PHÂN HỆ BIÊN BẢN BÀN GIAO ---------------- //

// Lấy danh sách biên bản bàn giao
router.get('/handover/list', async (req, res) => {
  try {
    const handovers = await db.getCollection('handover');
    const assets = await db.getCollection('assets');
    const users = await db.getCollection('users');

    const enriched = handovers.map((h) => {
      const asset = assets.find((a) => a.id === h.asset_id);
      const user = users.find((u) => u.id === h.user_id);
      return {
        ...h,
        asset_name: asset ? asset.name : 'Thiết bị không xác định',
        asset_code: asset ? asset.code : '',
        user_name: user ? user.name : 'Nhân sự không xác định',
        user_department: user ? user.department : ''
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo biên bản bàn giao mới
router.post('/handover/create', async (req, res) => {
  try {
    const { asset_id, user_id, condition, notes, type, handover_date } = req.body;
    if (!asset_id || !user_id) {
      return res.status(400).json({ success: false, message: 'Thiếu mã tài sản hoặc người tiếp nhận' });
    }

    const code = req.body.code || `BBBG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newHandover = await db.insert('handover', {
      code,
      asset_id,
      user_id,
      type: type || 'HANDOVER', // HANDOVER, RETURN
      handover_date: handover_date || new Date().toISOString().split('T')[0],
      condition: condition || 'Thiết bị hoạt động tốt, đầy đủ phụ kiện',
      status: 'COMPLETED',
      notes: notes || ''
    });

    // Tự động cập nhật tài sản được giao cho người dùng này
    if (type === 'RETURN') {
      await db.update('assets', asset_id, { assigned_to_user_id: null, status: 'AVAILABLE' });
    } else {
      await db.update('assets', asset_id, { assigned_to_user_id: user_id, status: 'IN_USE' });
    }

    res.status(201).json({ success: true, data: newHandover });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
