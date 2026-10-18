import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Lấy tổng quan Dashboard (Assets count, revenue, tasks summary, reminders)
router.get('/dashboard-summary', async (req, res) => {
  try {
    const assets = await db.getCollection('assets');
    const tasks = await db.getCollection('tasks');
    const finance = await db.getCollection('finance');
    const contracts = await db.getCollection('contracts');
    const users = await db.getCollection('users');

    const todayStr = new Date().toISOString().split('T')[0];

    // Thống kê tài sản
    const totalAssets = assets.length;
    const inUseAssets = assets.filter((a) => a.status === 'IN_USE').length;
    const maintenanceAssets = assets.filter((a) => a.status === 'MAINTENANCE').length;
    const totalAssetValue = assets.reduce((acc, cur) => acc + (cur.price || 0), 0);

    // Thống kê công việc & Cảnh báo hạn
    const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
    const overdueTasks = pendingTasks.filter((t) => t.due_date < todayStr);
    const upcomingTasks = pendingTasks.filter((t) => {
      const diffDays = Math.ceil((new Date(t.due_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    // Thống kê tài chính
    const totalRevenue = finance
      .filter((f) => f.type === 'REVENUE')
      .reduce((acc, cur) => acc + (cur.amount || 0), 0);
    const totalExpense = finance
      .filter((f) => f.type === 'EXPENSE')
      .reduce((acc, cur) => acc + (cur.amount || 0), 0);
    const netProfit = totalRevenue - totalExpense;

    // Hợp đồng sắp hết hạn trong 30 ngày
    const expiringContracts = contracts.filter((c) => {
      if (!c.end_date) return false;
      const diffDays = Math.ceil((new Date(c.end_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    });

    // Tạo danh sách nhắc hạn quan trọng (Alerts)
    const urgentReminders = [
      ...overdueTasks.map((t) => ({
        id: `rem_ovd_${t.id}`,
        type: 'TASK_OVERDUE',
        title: `Công việc quá hạn: "${t.title}"`,
        date: t.due_date,
        level: 'danger'
      })),
      ...upcomingTasks.map((t) => ({
        id: `rem_upc_${t.id}`,
        type: 'TASK_UPCOMING',
        title: `Công việc sắp tới hạn: "${t.title}"`,
        date: t.due_date,
        level: 'warning'
      })),
      ...expiringContracts.map((c) => ({
        id: `rem_ctr_${c.id}`,
        type: 'CONTRACT_EXPIRING',
        title: `Hợp đồng "${c.title}" sắp hết hạn vào ${c.end_date}`,
        date: c.end_date,
        level: 'info'
      }))
    ];

    res.json({
      success: true,
      data: {
        stats: {
          totalAssets,
          inUseAssets,
          maintenanceAssets,
          totalAssetValue,
          pendingTasksCount: pendingTasks.length,
          overdueTasksCount: overdueTasks.length,
          upcomingTasksCount: upcomingTasks.length,
          totalRevenue,
          totalExpense,
          netProfit,
          activeContractsCount: contracts.filter((c) => c.status === 'ACTIVE').length,
          totalUsersCount: users.length
        },
        urgentReminders,
        isCloudflare: db.isCloudflare
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
