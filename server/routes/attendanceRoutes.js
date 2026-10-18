import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Lấy danh sách chấm công (kèm lọc theo ngày)
router.get('/', async (req, res) => {
  try {
    const list = await db.getCollection('attendance');
    const users = await db.getCollection('users');

    const enriched = list.map((att) => {
      const user = users.find((u) => u.id === att.user_id);
      return {
        ...att,
        user_name: user ? user.name : 'Nhân sự',
        user_role: user ? user.role : 'STAFF',
        user_department: user ? user.department : 'Hành chính'
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Chấm công: Check-in hoặc Check-out nhanh
router.post('/check', async (req, res) => {
  try {
    const { user_id, action, notes } = req.body; // action: 'CHECK_IN' hoặc 'CHECK_OUT'
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Mã nhân viên là bắt buộc' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const attendances = await db.getCollection('attendance');
    let record = attendances.find((a) => a.user_id === user_id && a.date === todayStr);

    if (action === 'CHECK_IN') {
      if (record) {
        return res.status(400).json({ success: false, message: 'Nhân viên đã điểm danh vào sáng nay' });
      }

      // Giờ quy chuẩn vào ca là 08:30
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);
      const newRecord = await db.insert('attendance', {
        user_id,
        date: todayStr,
        check_in: timeStr,
        check_out: null,
        total_hours: 0,
        status: isLate ? 'LATE' : 'ON_TIME',
        notes: notes || (isLate ? 'Đi muộn sau 08:30' : 'Đúng giờ')
      });
      return res.json({ success: true, message: 'Điểm danh vào thành công', data: newRecord });
    }

    if (action === 'CHECK_OUT') {
      if (!record) {
        return res.status(400).json({ success: false, message: 'Chưa có bản ghi điểm danh vào hôm nay' });
      }

      // Tính số giờ làm
      const [inH, inM] = record.check_in.split(':').map(Number);
      const hours = Math.max(0, Number(((now.getHours() * 60 + now.getMinutes() - (inH * 60 + inM)) / 60).toFixed(1)));

      const updated = await db.update('attendance', record.id, {
        check_out: timeStr,
        total_hours: hours,
        notes: notes ? `${record.notes || ''} - ${notes}` : record.notes
      });
      return res.json({ success: true, message: 'Điểm danh ra thành công', data: updated });
    }

    res.status(400).json({ success: false, message: 'Hành động không hợp lệ' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thống kê chấm công tháng
router.get('/summary', async (req, res) => {
  try {
    const list = await db.getCollection('attendance');
    const users = await db.getCollection('users');

    const totalStaff = users.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayList = list.filter((a) => a.date === todayStr);

    const checkedInCount = todayList.length;
    const onTimeCount = todayList.filter((a) => a.status === 'ON_TIME').length;
    const lateCount = todayList.filter((a) => a.status === 'LATE').length;
    const absentCount = Math.max(0, totalStaff - checkedInCount);

    res.json({
      success: true,
      data: {
        totalStaff,
        checkedInCount,
        onTimeCount,
        lateCount,
        absentCount,
        attendanceRate: totalStaff > 0 ? `${Math.round((checkedInCount / totalStaff) * 100)}%` : '0%'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
