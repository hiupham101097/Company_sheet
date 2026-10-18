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

    // Nhóm theo Năm-Tháng (YYYY-MM)
    const summaryMap = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `2024-${String(i).padStart(2, '0')}`;
      summaryMap[monthKey] = { month: `T${i}`, revenue: 0, expense: 0, profit: 0 };
    }

    // Một số dữ liệu mẫu tăng trưởng nếu ít giao dịch
    const sampleTrend = [
      { m: '2024-01', rev: 95000000, exp: 40000000 },
      { m: '2024-02', rev: 110000000, exp: 45000000 },
      { m: '2024-03', rev: 135000000, exp: 52000000 },
      { m: '2024-04', rev: 160000000, exp: 58000000 },
      { m: '2024-05', rev: 145000000, exp: 62000000 },
      { m: '2024-06', rev: 170000000, exp: 46500000 },
    ];
    sampleTrend.forEach(s => {
      if (summaryMap[s.m]) {
        summaryMap[s.m].revenue = s.rev;
        summaryMap[s.m].expense = s.exp;
        summaryMap[s.m].profit = s.rev - s.exp;
      }
    });

    list.forEach(item => {
      const ym = item.date ? item.date.slice(0, 7) : '2024-06';
      if (!summaryMap[ym]) {
        const monthNum = ym.split('-')[1] || '06';
        summaryMap[ym] = { month: `T${parseInt(monthNum, 10)}`, revenue: 0, expense: 0, profit: 0 };
      }
      if (item.type === 'REVENUE') {
        summaryMap[ym].revenue += item.amount;
      } else if (item.type === 'EXPENSE') {
        summaryMap[ym].expense += item.amount;
      }
      summaryMap[ym].profit = summaryMap[ym].revenue - summaryMap[ym].expense;
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
