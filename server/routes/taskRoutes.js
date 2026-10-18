import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Lấy danh sách toàn bộ công việc kèm trạng thái phân loại
router.get('/', async (req, res) => {
  try {
    const tasks = await db.getCollection('tasks');
    const users = await db.getCollection('users');

    const todayStr = new Date().toISOString().split('T')[0];

    const enriched = tasks.map((task) => {
      const user = users.find((u) => u.id === task.assigned_to_user_id);
      
      // Tự động phân loại trạng thái thời hạn nếu chưa hoàn thành
      let urgency = 'NORMAL';
      if (task.status !== 'COMPLETED') {
        if (task.due_date < todayStr) {
          urgency = 'OVERDUE'; // Quá hạn
        } else if (task.due_date === todayStr) {
          urgency = 'TODAY'; // Đến hạn hôm nay
        } else {
          // Tính số ngày còn lại
          const diffDays = Math.ceil((new Date(task.due_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
          if (diffDays <= 3) {
            urgency = 'UPCOMING'; // Sắp tới hạn (trong 3 ngày)
          }
        }
      }

      return {
        ...task,
        assigned_user_name: user ? user.name : 'Chưa giao ai',
        assigned_user_avatar: user ? user.avatar : '',
        urgency
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thêm công việc mới & phân công
router.post('/', async (req, res) => {
  try {
    const { title, description, assigned_to_user_id, due_date, priority } = req.body;
    if (!title || !due_date) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và thời hạn là bắt buộc' });
    }

    const newTask = await db.insert('tasks', {
      title,
      description: description || '',
      assigned_to_user_id: assigned_to_user_id || null,
      due_date,
      priority: priority || 'MEDIUM', // LOW, MEDIUM, HIGH, URGENT
      status: 'PENDING' // PENDING, IN_PROGRESS, COMPLETED
    });

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật trạng thái / tiến độ công việc
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.update('tasks', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa công việc
router.delete('/:id', async (req, res) => {
  try {
    const ok = await db.remove('tasks', req.params.id);
    res.json({ success: ok, message: ok ? 'Đã xóa công việc' : 'Không tìm thấy công việc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
