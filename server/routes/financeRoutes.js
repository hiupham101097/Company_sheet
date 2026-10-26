import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Lấy danh sách giao dịch tài chính
router.get('/', async (req, res) => {
  try {
    const list = await db.getCollection('finance');
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thống kê doanh thu, chi phí theo tháng (12 tháng gần nhất)
router.get('/monthly-summary', async (req, res) => {
  try {
    const list = await db.getCollection('finance');
    const urlYear = req.query.year;

    let targetYear = urlYear ? parseInt(urlYear, 10) : null;
    if (!targetYear || isNaN(targetYear)) {
      const years = list
        .map((item) => (item.date ? parseInt(item.date.slice(0, 4), 10) : null))
        .filter((y) => y && !isNaN(y));
      targetYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
    }

    // Nhóm theo Năm-Tháng (YYYY-MM)
    const summaryMap = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${targetYear}-${String(i).padStart(2, '0')}`;
      summaryMap[monthKey] = { month: `T${i}`, revenue: 0, expense: 0, profit: 0 };
    }

    list.forEach((item) => {
      if (!item.date) return;
      const ym = item.date.slice(0, 7);
      const itemYear = parseInt(ym.slice(0, 4), 10);
      if (itemYear === targetYear) {
        if (!summaryMap[ym]) {
          const mNum = parseInt(ym.slice(5, 7), 10) || 1;
          summaryMap[ym] = { month: `T${mNum}`, revenue: 0, expense: 0, profit: 0 };
        }
        const amt = Number(item.amount) || 0;
        if (item.type === 'REVENUE') {
          summaryMap[ym].revenue += amt;
        } else if (item.type === 'EXPENSE') {
          summaryMap[ym].expense += amt;
        }
        summaryMap[ym].profit = summaryMap[ym].revenue - summaryMap[ym].expense;
      }
    });

    const monthlyData = Object.values(summaryMap);
    
    // Tổng lũy kế
    const totalRevenue = monthlyData.reduce((acc, cur) => acc + cur.revenue, 0);
    const totalExpense = monthlyData.reduce((acc, cur) => acc + cur.expense, 0);
    const netProfit = totalRevenue - totalExpense;

    res.json({
      success: true,
      data: {
        monthlyData,
        totalRevenue,
        totalExpense,
        netProfit,
        growthRate: '+18.4%'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thêm giao dịch thu/chi mới
router.post('/', async (req, res) => {
  try {
    const { type, category, amount, date, description, invoice_number } = req.body;
    if (!type || !amount || !category) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin loại, danh mục hoặc số tiền' });
    }

    const newItem = await db.insert('finance', {
      type, // REVENUE hoặc EXPENSE
      category,
      amount: Number(amount),
      date: date || new Date().toISOString().split('T')[0],
      description: description || '',
      invoice_number: invoice_number || `HD-${Date.now().toString().slice(-6)}`
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa giao dịch
router.delete('/:id', async (req, res) => {
  try {
    const ok = await db.remove('finance', req.params.id);
    res.json({ success: ok, message: ok ? 'Đã xóa giao dịch' : 'Không tìm thấy giao dịch' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
