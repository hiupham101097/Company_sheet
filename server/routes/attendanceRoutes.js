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
        if (record.check_out) {
          return res.status(400).json({
            success: false,
            message: `Nhân viên đã hoàn tất ca hôm nay (đã Check-out lúc ${record.check_out}). Vui lòng chờ đến ngày mai để bắt đầu ca mới!`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Nhân viên đã điểm danh vào ca hôm nay lúc ${record.check_in}. Một ngày chỉ được điểm danh vào ca 1 lần!`
        });
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
        return res.status(400).json({
          success: false,
          message: 'Chưa có bản ghi điểm danh vào hôm nay nên chưa thể tan ca.'
        });
      }
      if (record.check_out) {
        return res.status(400).json({
          success: false,
          message: `Nhân viên đã điểm danh tan ca hôm nay lúc ${record.check_out} rồi!`
        });
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

// Cập nhật bản ghi chấm công (bổ sung giờ ra, duyệt tăng ca, chốt ca quên checkout)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, total_hours, notes, status } = req.body;
    const attendances = await db.getCollection('attendance');
    const existing = attendances.find((a) => a.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi chấm công' });
    }

    const finalCheckIn = check_in !== undefined ? check_in : existing.check_in;
    const finalCheckOut = check_out !== undefined ? check_out : existing.check_out;

    let finalHours = total_hours;
    if ((finalHours === undefined || finalHours === null) && finalCheckIn && finalCheckOut) {
      const [inH, inM] = finalCheckIn.includes(':') ? finalCheckIn.split(':').map(Number) : [8, 30];
      const [outH, outM] = finalCheckOut.includes(':') ? finalCheckOut.split(':').map(Number) : [17, 30];
      const totalMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
      finalHours = Number((totalMinutes / 60).toFixed(1));
    } else if (finalHours === undefined || finalHours === null) {
      finalHours = existing.total_hours || 0;
    } else {
      finalHours = Number(finalHours);
    }

    const updated = await db.update('attendance', id, {
      check_in: finalCheckIn,
      check_out: finalCheckOut,
      total_hours: finalHours,
      notes: notes !== undefined ? notes : existing.notes,
      status: status !== undefined ? status : existing.status
    });

    res.json({ success: true, message: 'Cập nhật chấm công thành công', data: updated });
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
