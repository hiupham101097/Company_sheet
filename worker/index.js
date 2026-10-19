import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/api/*', cors({ origin: '*' }));

// ========================
// 1. AUTHENTICATION & LOGIN
// ========================
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, message: 'Vui lòng nhập email và mật khẩu' }, 400);
    }

    const user = await c.env.DB
      .prepare('SELECT id, name, email, role, department, phone, avatar, status FROM users WHERE email = ? AND password = ?')
      .bind(email.trim(), password.trim())
      .first();

    if (!user) {
      return c.json({ success: false, message: 'Email hoặc mật khẩu không chính xác' }, 401);
    }

    return c.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user,
        token: `jwt_${user.id}_${Date.now()}`
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 2. DASHBOARD & REPORTS
// ========================
app.get('/api/reports/dashboard-summary', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Assets count
    const assetsRes = await c.env.DB.prepare('SELECT status, price FROM assets').all();
    const assets = assetsRes.results || [];
    const totalAssets = assets.length;
    const inUseAssets = assets.filter((a) => a.status === 'IN_USE').length;
    const maintenanceAssets = assets.filter((a) => a.status === 'MAINTENANCE').length;
    const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    // Finance count
    const finRes = await c.env.DB.prepare('SELECT type, amount FROM finance').all();
    const finance = finRes.results || [];
    const totalRevenue = finance
      .filter((f) => f.type === 'REVENUE')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const totalExpense = finance
      .filter((f) => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpense;

    // Tasks & Reminders
    const tasksRes = await c.env.DB.prepare('SELECT id, title, due_date, status, priority FROM tasks').all();
    const tasks = tasksRes.results || [];
    const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
    const overdueTasks = pendingTasks.filter((t) => t.due_date < today);
    const upcomingTasks = pendingTasks.filter((t) => {
      const diff = Math.ceil((new Date(t.due_date) - new Date(today)) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 3;
    });

    // Contracts
    const contractsRes = await c.env.DB.prepare('SELECT id, title, end_date, status FROM contracts').all();
    const contracts = contractsRes.results || [];
    const activeContracts = contracts.filter((ct) => ct.status === 'ACTIVE');
    const expiringContracts = activeContracts.filter((ct) => {
      if (!ct.end_date) return false;
      const diff = Math.ceil((new Date(ct.end_date) - new Date(today)) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    });

    // Users
    const usersCount = (await c.env.DB.prepare('SELECT count(*) as count FROM users').first())?.count || 0;

    // Reminders
    const urgentReminders = [
      ...overdueTasks.map((t) => ({
        id: `ovd_${t.id}`,
        title: `Công việc quá hạn: "${t.title}"`,
        date: t.due_date,
        level: 'danger'
      })),
      ...upcomingTasks.map((t) => ({
        id: `upc_${t.id}`,
        title: `Công việc sắp đến hạn: "${t.title}"`,
        date: t.due_date,
        level: 'warning'
      })),
      ...expiringContracts.map((ct) => ({
        id: `ctr_${ct.id}`,
        title: `Hợp đồng "${ct.title}" sắp hết hạn vào ${ct.end_date}`,
        date: ct.end_date,
        level: 'info'
      }))
    ];

    return c.json({
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
          activeContractsCount: activeContracts.length,
          totalUsersCount: usersCount
        },
        urgentReminders,
        isCloudflare: true
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 3. ASSETS (TÀI SẢN & THIẾT BỊ)
// ========================
app.get('/api/assets', async (c) => {
  try {
    const query = `
      SELECT a.*, 
             u.name as assigned_user_name, 
             u.department as assigned_user_department
      FROM assets a
      LEFT JOIN users u ON a.assigned_to_user_id = u.id
      ORDER BY a.created_at DESC
    `;
    const res = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/assets', async (c) => {
  try {
    const body = await c.req.json();
    const id = `ast_${Date.now()}`;
    const code = body.code || `TS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    await c.env.DB.prepare(`
      INSERT INTO assets (id, code, name, category, serial_number, purchase_date, price, status, location, assigned_to_user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      body.name,
      body.category,
      body.serial_number || '',
      body.purchase_date || new Date().toISOString().split('T')[0],
      Number(body.price) || 0,
      body.status || 'AVAILABLE',
      body.location || 'Kho công ty',
      body.assigned_to_user_id || null,
      body.notes || ''
    ).run();

    return c.json({ success: true, data: { id, code, ...body } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/assets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE assets
      SET name = COALESCE(?, name),
          category = COALESCE(?, category),
          serial_number = COALESCE(?, serial_number),
          price = COALESCE(?, price),
          status = COALESCE(?, status),
          location = COALESCE(?, location),
          assigned_to_user_id = COALESCE(?, assigned_to_user_id),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).bind(
      body.name !== undefined ? body.name : null,
      body.category !== undefined ? body.category : null,
      body.serial_number !== undefined ? body.serial_number : null,
      body.price !== undefined ? body.price : null,
      body.status !== undefined ? body.status : null,
      body.location !== undefined ? body.location : null,
      body.assigned_to_user_id !== undefined ? body.assigned_to_user_id : null,
      body.notes !== undefined ? body.notes : null,
      id
    ).run();

    return c.json({ success: true, message: 'Đã cập nhật tài sản' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/assets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Đã xóa tài sản' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 4. FINANCE (DOANH THU & CHI PHÍ)
// ========================
app.get('/api/finance', async (c) => {
  try {
    const res = await c.env.DB.prepare('SELECT * FROM finance ORDER BY date DESC').all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/finance/monthly-summary', async (c) => {
  try {
    const res = await c.env.DB.prepare('SELECT * FROM finance').all();
    const list = res.results || [];

    const summaryMap = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `2024-${String(i).padStart(2, '0')}`;
      summaryMap[monthKey] = { month: `T${i}`, revenue: 0, expense: 0, profit: 0 };
    }

    const sampleTrend = [
      { m: '2024-01', rev: 95000000, exp: 40000000 },
      { m: '2024-02', rev: 110000000, exp: 45000000 },
      { m: '2024-03', rev: 135000000, exp: 52000000 },
      { m: '2024-04', rev: 160000000, exp: 58000000 },
      { m: '2024-05', rev: 145000000, exp: 62000000 },
      { m: '2024-06', rev: 170000000, exp: 46500000 },
    ];
    sampleTrend.forEach((s) => {
      if (summaryMap[s.m]) {
        summaryMap[s.m].revenue = s.rev;
        summaryMap[s.m].expense = s.exp;
        summaryMap[s.m].profit = s.rev - s.exp;
      }
    });

    list.forEach((item) => {
      const ym = item.date ? item.date.slice(0, 7) : '2024-06';
      if (!summaryMap[ym]) {
        const monthNum = ym.split('-')[1] || '06';
        summaryMap[ym] = { month: `T${parseInt(monthNum, 10)}`, revenue: 0, expense: 0, profit: 0 };
      }
      if (item.type === 'REVENUE') summaryMap[ym].revenue += Number(item.amount);
      if (item.type === 'EXPENSE') summaryMap[ym].expense += Number(item.amount);
      summaryMap[ym].profit = summaryMap[ym].revenue - summaryMap[ym].expense;
    });

    const monthlyData = Object.values(summaryMap);
    const totalRevenue = monthlyData.reduce((acc, cur) => acc + cur.revenue, 0);
    const totalExpense = monthlyData.reduce((acc, cur) => acc + cur.expense, 0);

    return c.json({
      success: true,
      data: {
        monthlyData,
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        growthRate: '+18.4%'
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/finance', async (c) => {
  try {
    const body = await c.req.json();
    const id = `fin_${Date.now()}`;
    const invoice = body.invoice_number || `HD-${Date.now().toString().slice(-6)}`;

    await c.env.DB.prepare(`
      INSERT INTO finance (id, type, category, amount, date, description, invoice_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.type,
      body.category,
      Number(body.amount),
      body.date || new Date().toISOString().split('T')[0],
      body.description || '',
      invoice
    ).run();

    return c.json({ success: true, message: 'Đã thêm giao dịch' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/finance/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM finance WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Đã xóa giao dịch' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 5. TASKS (CÔNG VIỆC & NHẮC HẠN)
// ========================
app.get('/api/tasks', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT t.*, u.name as assigned_user_name, u.avatar as assigned_user_avatar
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_user_id = u.id
      ORDER BY t.due_date ASC
    `;
    const res = await c.env.DB.prepare(query).all();
    const list = (res.results || []).map((t) => {
      let urgency = 'NORMAL';
      if (t.status !== 'COMPLETED') {
        if (t.due_date < today) {
          urgency = 'OVERDUE';
        } else if (t.due_date === today) {
          urgency = 'TODAY';
        } else {
          const diff = Math.ceil((new Date(t.due_date) - new Date(today)) / (1000 * 60 * 60 * 24));
          if (diff <= 3) urgency = 'UPCOMING';
        }
      }
      return { ...t, urgency };
    });

    return c.json({ success: true, data: list });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json();
    const id = `tsk_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO tasks (id, title, description, assigned_to_user_id, due_date, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title,
      body.description || '',
      body.assigned_to_user_id || null,
      body.due_date,
      body.priority || 'MEDIUM',
      'PENDING'
    ).run();

    return c.json({ success: true, message: 'Đã tạo công việc' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE tasks
      SET status = COALESCE(?, status),
          title = COALESCE(?, title),
          priority = COALESCE(?, priority)
      WHERE id = ?
    `).bind(
      body.status !== undefined ? body.status : null,
      body.title !== undefined ? body.title : null,
      body.priority !== undefined ? body.priority : null,
      id
    ).run();

    return c.json({ success: true, message: 'Đã cập nhật công việc' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Đã xóa công việc' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 6. CONTRACTS & HANDOVERS
// ========================
app.get('/api/contracts', async (c) => {
  try {
    const res = await c.env.DB.prepare('SELECT * FROM contracts ORDER BY start_date DESC').all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/contracts', async (c) => {
  try {
    const body = await c.req.json();
    const id = `ctr_${Date.now()}`;
    const code = body.code || `HĐ-${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`;
    await c.env.DB.prepare(`
      INSERT INTO contracts (id, code, title, type, partner_name, value, start_date, end_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      body.title,
      body.type || 'PARTNER',
      body.partner_name,
      Number(body.value) || 0,
      body.start_date,
      body.end_date,
      body.status || 'ACTIVE',
      body.notes || ''
    ).run();

    return c.json({ success: true, message: 'Đã thêm hợp đồng' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/contracts/handover/list', async (c) => {
  try {
    const query = `
      SELECT h.*, 
             a.name as asset_name, a.code as asset_code,
             u.name as user_name, u.department as user_department
      FROM handover_protocols h
      LEFT JOIN assets a ON h.asset_id = a.id
      LEFT JOIN users u ON h.user_id = u.id
      ORDER BY h.handover_date DESC
    `;
    const res = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/contracts/handover/create', async (c) => {
  try {
    const body = await c.req.json();
    const id = `bb_${Date.now()}`;
    const code = body.code || `BBBG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    await c.env.DB.prepare(`
      INSERT INTO handover_protocols (id, code, asset_id, user_id, type, handover_date, condition, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      body.asset_id,
      body.user_id,
      body.type || 'HANDOVER',
      body.handover_date || new Date().toISOString().split('T')[0],
      body.condition || 'Hoạt động tốt',
      'COMPLETED',
      body.notes || ''
    ).run();

    // Cập nhật trạng thái và người nắm giữ tài sản
    if (body.type === 'RETURN') {
      await c.env.DB.prepare('UPDATE assets SET assigned_to_user_id = NULL, status = "AVAILABLE" WHERE id = ?').bind(body.asset_id).run();
    } else {
      await c.env.DB.prepare('UPDATE assets SET assigned_to_user_id = ?, status = "IN_USE" WHERE id = ?').bind(body.user_id, body.asset_id).run();
    }

    return c.json({ success: true, message: 'Đã lập biên bản' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 7. ATTENDANCE (CHẤM CÔNG)
// ========================
app.get('/api/attendance', async (c) => {
  try {
    const query = `
      SELECT att.*, u.name as user_name, u.role as user_role, u.department as user_department
      FROM attendance att
      LEFT JOIN users u ON att.user_id = u.id
      ORDER BY att.date DESC, att.check_in DESC
    `;
    const res = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/attendance/check', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { user_id, action, notes } = body;
    if (!user_id) {
      return c.json({ success: false, message: 'Mã nhân viên là bắt buộc' }, 400);
    }

    // Kiểm tra nhân viên có tồn tại trong CSDL không
    const targetUser = await c.env.DB
      .prepare('SELECT id, name FROM users WHERE id = ?')
      .bind(user_id)
      .first();

    if (!targetUser) {
      return c.json({
        success: false,
        message: `Mã nhân sự "${user_id}" không tồn tại trên hệ thống. Vui lòng đăng nhập lại.`
      }, 400);
    }

    // Chuẩn hóa ngày và giờ theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()); // YYYY-MM-DD
    const timeStr = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date()); // HH:mm
    // Lấy cấu hình chấm công động từ bảng system_settings
    let workStart = '08:30';
    let graceMin = 15;
    try {
      const sStart = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'work_start_time'").first();
      if (sStart?.value) workStart = sStart.value;
      const sGrace = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'late_grace_minutes'").first();
      if (sGrace?.value) graceMin = Number(sGrace.value) || 0;
    } catch (_) {}

    const [stdH, stdM] = workStart.includes(':') ? workStart.split(':').map(Number) : [8, 30];
    const allowedTotalMin = stdH * 60 + stdM + graceMin;
    const currentTotalMin = curHour * 60 + curMin;
    const isLate = currentTotalMin > allowedTotalMin;

    const existing = await c.env.DB
      .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
      .bind(user_id, today)
      .first();

    if (action === 'CHECK_IN') {
      if (existing) {
        return c.json({
          success: false,
          message: `Nhân viên ${targetUser.name} đã điểm danh vào lúc ${existing.check_in || 'hôm nay'}${existing.check_out ? ` (Đã tan ca lúc ${existing.check_out})` : ''}`
        }, 400);
      }
      const id = `att_${Date.now()}`;
      const noteText = (notes && String(notes).trim()) ? String(notes).trim() : (isLate ? `Đi muộn (quy định ${workStart} + ${graceMin}p ân hạn)` : 'Đúng giờ');

      await c.env.DB.prepare(`
        INSERT INTO attendance (id, user_id, date, check_in, check_out, total_hours, status, notes)
        VALUES (?, ?, ?, ?, NULL, 0, ?, ?)
      `).bind(
        id,
        user_id,
        today,
        timeStr,
        isLate ? 'LATE' : 'ON_TIME',
        noteText
      ).run();

      return c.json({
        success: true,
        message: `Điểm danh vào (Check-in) thành công lúc ${timeStr}! (${isLate ? 'Đi muộn' : 'Đúng giờ'})`
      });
    }

    if (action === 'CHECK_OUT') {
      if (!existing) {
        return c.json({
          success: false,
          message: `Chưa có bản ghi Check-in ngày ${today} của ${targetUser.name} để tính giờ tan ca`
        }, 400);
      }
      const checkInTime = existing.check_in || '08:30';
      const [inH, inM] = checkInTime.includes(':') ? checkInTime.split(':').map(Number) : [8, 30];
      const totalMinutes = Math.max(0, (curHour * 60 + curMin) - (inH * 60 + inM));
      const hours = Number((totalMinutes / 60).toFixed(1));
      const extraNote = (notes && String(notes).trim()) ? String(notes).trim() : null;
      const checkoutNote = extraNote
        ? `${existing.notes ? existing.notes + ' - ' : ''}${extraNote}`
        : (existing.notes || 'Tan ca bình thường');

      await c.env.DB.prepare(`
        UPDATE attendance
        SET check_out = ?, total_hours = ?, notes = ?
        WHERE id = ?
      `).bind(timeStr, hours, checkoutNote, existing.id).run();

      return c.json({
        success: true,
        message: `Điểm danh ra (Check-out) thành công lúc ${timeStr}! Tổng giờ làm: ${hours}h`
      });
    }

    return c.json({ success: false, message: 'Hành động không hợp lệ' }, 400);
  } catch (err) {
    return c.json({ success: false, message: err.message || 'Lỗi xử lý điểm danh' }, 500);
  }
});

app.get('/api/attendance/summary', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usersCount = (await c.env.DB.prepare('SELECT count(*) as count FROM users').first())?.count || 0;
    const todayRecords = (await c.env.DB.prepare('SELECT * FROM attendance WHERE date = ?').bind(today).all())?.results || [];

    const checkedInCount = todayRecords.length;
    const onTimeCount = todayRecords.filter((a) => a.status === 'ON_TIME').length;
    const lateCount = todayRecords.filter((a) => a.status === 'LATE').length;

    return c.json({
      success: true,
      data: {
        totalStaff: usersCount,
        checkedInCount,
        onTimeCount,
        lateCount,
        absentCount: Math.max(0, usersCount - checkedInCount),
        attendanceRate: usersCount > 0 ? `${Math.round((checkedInCount / usersCount) * 100)}%` : '0%'
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 8. USERS (NHÂN SỰ)
// ========================
app.get('/api/users', async (c) => {
  try {
    const res = await c.env.DB
      .prepare('SELECT id, name, email, role, department, phone, avatar, status, created_at FROM users ORDER BY created_at DESC')
      .all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/users', async (c) => {
  try {
    const role = c.req.header('x-user-role') || 'STAFF';
    if (role !== 'ADMIN') {
      return c.json({ success: false, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền thêm nhân sự' }, 403);
    }

    const body = await c.req.json();
    const id = `usr_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, department, phone, avatar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).bind(
      id,
      body.name,
      body.email,
      body.password || '123456',
      body.role || 'STAFF',
      body.department || 'Phòng Kế Hoạch',
      body.phone || '',
      body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`
    ).run();

    return c.json({ success: true, message: 'Đã thêm nhân sự' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 9. CATEGORIES (QUẢN LÝ DANH MỤC ĐỘNG)
// ========================
async function ensureCategories(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const count = (await db.prepare('SELECT count(*) as count FROM categories').first())?.count || 0;
    if (count === 0) {
      const initialCats = [
        // Loại tài sản
        { id: 'cat_ast_1', type: 'ASSET_CATEGORY', name: 'Máy tính xách tay', code: 'LAPTOP', description: 'Máy tính laptop Dell, MacBook, ThinkPad' },
        { id: 'cat_ast_2', type: 'ASSET_CATEGORY', name: 'Màn hình hiển thị', code: 'MONITOR', description: 'Màn hình văn phòng, đồ họa 4K' },
        { id: 'cat_ast_3', type: 'ASSET_CATEGORY', name: 'Thiết bị văn phòng', code: 'OFFICE_EQUIP', description: 'Máy in, máy scan, máy chiếu' },
        { id: 'cat_ast_4', type: 'ASSET_CATEGORY', name: 'Thiết bị mạng', code: 'NETWORK', description: 'Router, Switch, Wifi access point' },
        { id: 'cat_ast_5', type: 'ASSET_CATEGORY', name: 'Bàn ghế văn phòng', code: 'FURNITURE', description: 'Ghế công thái học, bàn làm việc' },
        { id: 'cat_ast_6', type: 'ASSET_CATEGORY', name: 'Thiết bị ngoại vi', code: 'PERIPHERAL', description: 'Bàn phím, chuột, tai nghe call center' },

        // Loại thu chi
        { id: 'cat_fin_1', type: 'FINANCE_CATEGORY', name: 'Hợp đồng dịch vụ phần mềm', code: 'REV_SOFTWARE', description: 'Nguồn thu từ gia công & bảo trì phần mềm' },
        { id: 'cat_fin_2', type: 'FINANCE_CATEGORY', name: 'Tư vấn kiến trúc Cloud', code: 'REV_CLOUD', description: 'Nguồn thu dịch vụ tư vấn Cloud & DevOps' },
        { id: 'cat_fin_3', type: 'FINANCE_CATEGORY', name: 'Bảo trì & Vận hành hệ thống', code: 'REV_MAINTAIN', description: 'Phí bảo dưỡng hệ thống định kỳ' },
        { id: 'cat_fin_4', type: 'FINANCE_CATEGORY', name: 'Mua sắm thiết bị & Tài sản', code: 'EXP_EQUIP', description: 'Chi phí mua sắm laptop, bàn ghế, thiết bị mới' },
        { id: 'cat_fin_5', type: 'FINANCE_CATEGORY', name: 'Chi phí điện nước & Thuê văn phòng', code: 'EXP_OFFICE', description: 'Tiền thuê sảnh, internet, điện nước' },
        { id: 'cat_fin_6', type: 'FINANCE_CATEGORY', name: 'Chi phí văn phòng phẩm & Tiếp khách', code: 'EXP_OPERATION', description: 'Văn phòng phẩm, cafe, tiếp đối tác' },

        // Phòng ban doanh nghiệp
        { id: 'cat_dep_1', type: 'DEPARTMENT', name: 'Ban Giám Đốc', code: 'BOD', description: 'Lãnh đạo & Điều hành chiến lược' },
        { id: 'cat_dep_2', type: 'DEPARTMENT', name: 'Phòng Kế Toán & Tài Chính', code: 'ACC', description: 'Quản trị dòng tiền, hóa đơn, lương bổng' },
        { id: 'cat_dep_3', type: 'DEPARTMENT', name: 'Phòng Kỹ Thuật & IT', code: 'IT', description: 'Lập trình, hạ tầng Cloud, quản lý thiết bị' },
        { id: 'cat_dep_4', type: 'DEPARTMENT', name: 'Phòng Hành Chính Nhân Sự', code: 'HR', description: 'Tuyển dụng, chấm công, phúc lợi' },
        { id: 'cat_dep_5', type: 'DEPARTMENT', name: 'Phòng Kinh Doanh & Marketing', code: 'SALES', description: 'Phát triển khách hàng, hợp đồng' }
      ];

      for (const item of initialCats) {
        await db.prepare(`
          INSERT INTO categories (id, type, name, code, description)
          VALUES (?, ?, ?, ?, ?)
        `).bind(item.id, item.type, item.name, item.code, item.description).run();
      }
    }
  } catch (err) {
    console.error('ensureCategories error:', err.message);
  }
}

// Lấy danh sách danh mục (có thể lọc theo ?type=...)
app.get('/api/categories', async (c) => {
  try {
    await ensureCategories(c.env.DB);
    const type = c.req.query('type');
    let query = 'SELECT * FROM categories';
    let params = [];
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    query += ' ORDER BY type ASC, created_at ASC';

    const res = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Thêm danh mục mới (Chỉ ADMIN)
app.post('/api/categories', async (c) => {
  try {
    const role = c.req.header('x-user-role') || 'STAFF';
    if (role !== 'ADMIN') {
      return c.json({ success: false, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền quản lý danh mục' }, 403);
    }

    const { type, name, code, description } = await c.req.json();
    if (!type || !name) {
      return c.json({ success: false, message: 'Phân loại và tên danh mục là bắt buộc' }, 400);
    }

    const id = `cat_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO categories (id, type, name, code, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, type, name, code || '', description || '').run();

    return c.json({ success: true, message: 'Đã thêm danh mục thành công', data: { id, type, name, code, description } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Cập nhật danh mục (Chỉ ADMIN)
app.put('/api/categories/:id', async (c) => {
  try {
    const role = c.req.header('x-user-role') || 'STAFF';
    if (role !== 'ADMIN') {
      return c.json({ success: false, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền sửa danh mục' }, 403);
    }

    const id = c.req.param('id');
    const { name, code, description } = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE categories
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          description = COALESCE(?, description)
      WHERE id = ?
    `).bind(
      name !== undefined ? name : null,
      code !== undefined ? code : null,
      description !== undefined ? description : null,
      id
    ).run();

    return c.json({ success: true, message: 'Đã cập nhật danh mục' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Xóa danh mục (Chỉ ADMIN)
app.delete('/api/categories/:id', async (c) => {
  try {
    const role = c.req.header('x-user-role') || 'STAFF';
    if (role !== 'ADMIN') {
      return c.json({ success: false, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền xóa danh mục' }, 403);
    }

    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 10. SYSTEM SETTINGS (CÀI ĐẶT HỆ THỐNG & CHẤM CÔNG)
// ========================
async function initSettingsTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        category TEXT,
        description TEXT,
        updated_at TEXT
      )
    `).run();

    const defaults = [
      // ATTENDANCE
      ['work_start_time', '08:30', 'ATTENDANCE', 'Giờ vào ca buổi sáng', new Date().toISOString()],
      ['work_end_time', '17:30', 'ATTENDANCE', 'Giờ tan ca buổi chiều', new Date().toISOString()],
      ['late_grace_minutes', '15', 'ATTENDANCE', 'Số phút cho phép đi muộn (ân hạn)', new Date().toISOString()],
      ['overtime_start_time', '18:00', 'ATTENDANCE', 'Giờ bắt đầu tính làm thêm giờ (OT)', new Date().toISOString()],
      ['work_days', 'Thứ 2 - Thứ 6', 'ATTENDANCE', 'Các ngày làm việc tiêu chuẩn trong tuần', new Date().toISOString()],
      ['require_late_reason', 'true', 'ATTENDANCE', 'Yêu cầu nhân viên ghi chú lý do khi đi muộn', new Date().toISOString()],
      ['lunch_break_start', '12:00', 'ATTENDANCE', 'Giờ bắt đầu nghỉ trưa', new Date().toISOString()],
      ['lunch_break_end', '13:30', 'ATTENDANCE', 'Giờ kết thúc nghỉ trưa', new Date().toISOString()],
      // GENERAL
      ['company_name', 'OMNI ASSETS & LOGISTICS', 'GENERAL', 'Tên chính thức của doanh nghiệp', new Date().toISOString()],
      ['system_title', 'Hệ Thống Quản Lý Tài Sản & Vận Hành Doanh Nghiệp', 'GENERAL', 'Tiêu đề hiển thị ứng dụng web', new Date().toISOString()],
      ['company_email', 'contact@omniassets.vn', 'GENERAL', 'Email liên hệ nội bộ', new Date().toISOString()],
      ['company_phone', '1900 6868', 'GENERAL', 'Hotline hỗ trợ kỹ thuật và văn phòng', new Date().toISOString()],
      ['company_address', 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, TP. Hồ Chí Minh', 'GENERAL', 'Địa chỉ trụ sở chính', new Date().toISOString()],
      ['tax_id', '0109887766', 'GENERAL', 'Mã số thuế doanh nghiệp', new Date().toISOString()],
      ['currency', 'VND', 'GENERAL', 'Đơn vị tiền tệ chính', new Date().toISOString()],
      ['system_announcement', 'Chào mừng bạn đến với hệ thống quản trị vận hành OMNI ASSETS!', 'GENERAL', 'Thông báo chung trên bảng tin', new Date().toISOString()],
      ['allow_user_registration', 'false', 'GENERAL', 'Cho phép nhân viên tự tạo tài khoản', new Date().toISOString()],
      ['gemini_api_key', '', 'GENERAL', 'Google Gemini AI API Key', new Date().toISOString()]
    ];

    for (const [key, val, cat, desc, upd] of defaults) {
      await db.prepare(`
        INSERT OR IGNORE INTO system_settings (key, value, category, description, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(key, val, cat, desc, upd).run();
    }
  } catch (e) {
    console.error('Error initSettingsTable:', e);
  }
}

app.get('/api/settings', async (c) => {
  try {
    await initSettingsTable(c.env.DB);
    const res = await c.env.DB.prepare('SELECT * FROM system_settings ORDER BY category, key').all();
    const rows = res.results || [];
    const settingsMap = {};
    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    return c.json({
      success: true,
      data: {
        raw: rows,
        settings: settingsMap
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/settings', async (c) => {
  try {
    const role = c.req.header('x-user-role') || 'ADMIN';
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return c.json({ success: false, message: 'Chỉ Quản trị viên (ADMIN) hoặc Quản lý mới có quyền thay đổi cấu hình' }, 403);
    }

    await initSettingsTable(c.env.DB);
    const body = await c.req.json().catch(() => ({}));
    const settingsToUpdate = body.settings || body;
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(settingsToUpdate)) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET value = ?, updated_at = ?
        WHERE key = ?
      `).bind(String(value), now, key).run();
    }

    const res = await c.env.DB.prepare('SELECT * FROM system_settings ORDER BY category, key').all();
    const rows = res.results || [];
    const settingsMap = {};
    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    return c.json({
      success: true,
      message: 'Cập nhật cài đặt hệ thống thành công',
      data: {
        raw: rows,
        settings: settingsMap
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ========================
// 11. AI MASCOT ASSISTANT
// ========================
app.post('/api/ai/chat', async (c) => {
  try {
    const { message, activeTab, userRole, userName } = await c.req.json().catch(() => ({}));
    const q = (message || '').toLowerCase().trim();

    // Query live context from DB
    const [assetsCount, tasksRes, settingsRes] = await Promise.all([
      c.env.DB.prepare('SELECT count(*) as count, sum(CASE WHEN status="MAINTENANCE" THEN 1 ELSE 0 END) as maint_count FROM assets').first().catch(() => null),
      c.env.DB.prepare('SELECT title, due_date, status, priority FROM tasks WHERE status != "COMPLETED" ORDER BY due_date ASC LIMIT 5').all().catch(() => ({ results: [] })),
      c.env.DB.prepare('SELECT key, value FROM system_settings').all().catch(() => ({ results: [] }))
    ]);

    const settingsMap = {};
    (settingsRes?.results || []).forEach((r) => { settingsMap[r.key] = r.value; });
    const workStart = settingsMap.work_start_time || '08:30';
    const workEnd = settingsMap.work_end_time || '17:30';
    const graceMin = settingsMap.late_grace_minutes || '15';
    const workDays = settingsMap.work_days || 'Thứ 2 - Thứ 6';

    const geminiApiKey = c.env.GEMINI_API_KEY || settingsMap.gemini_api_key || '';
    const geminiModel = c.env.GEMINI_MODEL || 'gemini-3.8-flash';

    // System Prompt for Gemini with live corporate context
    const systemPrompt = `Bạn là OMNI-Bot, linh vật trợ lý AI thông minh, nhiệt tình và thân thiện của hệ thống quản lý doanh nghiệp OMNI ASSETS.
Nhiệm vụ của bạn là hỗ trợ, giải đáp mọi thắc mắc và hướng dẫn người dùng thao tác xử lý công việc hiệu quả trên trang web này.

Bối cảnh hệ thống thực tế hiện tại:
- Tên công ty: ${settingsMap.company_name || 'OMNI ASSETS & LOGISTICS'}
- Người đang trò chuyện: ${userName || 'Nhân sự'} (Vai trò hệ thống: ${userRole || 'STAFF'})
- Tab người dùng đang đứng: '${activeTab || 'dashboard'}'
- Quy định giờ làm việc: Vào ca lúc ${workStart}, Tan ca lúc ${workEnd}, Ân hạn đi muộn ${graceMin} phút, Lịch làm việc ${workDays}.
- Tài sản: Đang quản lý ${assetsCount?.count || 0} tài sản (${assetsCount?.maint_count || 0} thiết bị đang bảo trì).
- Công việc: Có ${tasksRes?.results?.length || 0} công việc đang xử lý (gồm các việc gần nhất).
- Danh sách các phân hệ chính trên trang web:
  1. 'dashboard' (Tổng quan): Bảng thống kê toàn diện về tài sản, doanh thu, việc cần làm, nhắc hạn.
  2. 'assets' (Tài sản & Thiết bị): Thêm mới, bàn giao máy móc, bảo trì, sửa chữa, theo dõi serial và tình trạng.
  3. 'finance' (Doanh thu & Chi phí): Ghi nhận thu/chi, phân tích dòng tiền, tính lợi nhuận ròng.
  4. 'tasks' (Công việc & Nhắc hạn): Giao việc cho nhân viên, quản lý deadline, cảnh báo việc quá hạn.
  5. 'contracts' (Hợp đồng & Biên bản): Quản lý hợp đồng đối tác và Lập/In Biên bản bàn giao tài sản chuẩn A4 có chữ ký 2 bên.
  6. 'attendance' (Chấm công): Check-in ca sáng, Check-out ca chiều, tự động tính số giờ làm và ghi nhận đi muộn.
  7. 'users' (Quản lý Nhân sự): Danh sách nhân viên, gán quyền (ADMIN: toàn quyền, MANAGER: quản lý, STAFF: nhân viên).
  8. 'categories' (Quản lý Danh mục): Quản lý động danh mục tài sản, phòng ban, phân loại thu chi.
  9. 'settings' (Cài đặt hệ thống): Chỉnh giờ ca làm việc, ân hạn đi muộn, thông tin công ty, hotline.

Yêu cầu định dạng câu trả lời:
- Luôn xưng hô thân thiện: "Mình / Tôi là OMNI-Bot", gọi người dùng là "${userName || 'bạn'}".
- Dùng tiếng Việt chuẩn mực, rõ ràng, gạch đầu dòng (•), in đậm (**text**) để người dùng dễ đọc.
- Trả lời đúng trọng tâm câu hỏi của người dùng, đưa ra hướng dẫn từng bước cụ thể.
- Nhắc đến tab chức năng cụ thể trên thanh menu để người dùng biết chỗ bấm vào.`;

    let answer = '';
    let suggestions = [];
    let navigateTab = null;

    // Gợi ý tab điều hướng theo ngữ cảnh câu hỏi
    if (q.includes('chấm công') || q.includes('điểm danh') || q.includes('check-in') || q.includes('muộn')) {
      navigateTab = 'attendance';
      suggestions = ['Xem bảng chấm công', 'Cài đặt lại giờ ca làm việc', 'Quy định làm thêm giờ (OT)'];
    } else if (q.includes('tài sản') || q.includes('thiết bị') || q.includes('máy tính') || q.includes('laptop')) {
      navigateTab = 'assets';
      suggestions = ['Mở Quản lý tài sản', 'Hướng dẫn tạo biên bản bàn giao', 'Lập kế hoạch bảo trì'];
    } else if (q.includes('biên bản') || q.includes('bàn giao') || q.includes('in a4') || q.includes('hợp đồng')) {
      navigateTab = 'contracts';
      suggestions = ['Mở Hợp đồng & Biên bản', 'Xem danh sách biên bản', 'Quy định thu hồi tài sản'];
    } else if (q.includes('doanh thu') || q.includes('chi phí') || q.includes('tài chính') || q.includes('tiền')) {
      navigateTab = 'finance';
      suggestions = ['Xem Báo cáo tài chính', 'Thêm khoản thu mới', 'Thêm chi phí phát sinh'];
    } else if (q.includes('công việc') || q.includes('task') || q.includes('quá hạn') || q.includes('deadline')) {
      navigateTab = 'tasks';
      suggestions = ['Xem danh sách công việc', 'Tạo công việc mới', 'Lọc việc cần làm gấp'];
    } else if (q.includes('phân quyền') || q.includes('vai trò') || q.includes('role') || q.includes('nhân sự')) {
      navigateTab = 'users';
      suggestions = ['Mở Quản lý nhân sự', 'Thêm nhân viên mới', 'Cài đặt hệ thống'];
    } else if (q.includes('cài đặt') || q.includes('setting') || q.includes('đổi giờ') || q.includes('công ty')) {
      navigateTab = 'settings';
      suggestions = ['Mở Cài đặt hệ thống', 'Quy định giờ chấm công', 'Đổi thông tin công ty'];
    } else {
      suggestions = ['Quy định giờ chấm công', 'Cách xuất biên bản bàn giao A4', 'Kiểm tra việc quá hạn', 'Hướng dẫn thêm tài sản'];
    }

    // 1. Gọi trực tiếp Google Gemini API bằng Key được cấu hình
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const geminiReq = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nCâu hỏi của người dùng: "${message}"` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1200
            }
          })
        });

        if (geminiReq.ok) {
          const geminiData = await geminiReq.json();
          const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim()) {
            answer = generatedText.trim();
          }
        }
      } catch (geminiError) {
        console.error('Gemini API fetch error:', geminiError);
      }
    }

    // 2. Dự phòng nội bộ nếu Gemini chưa trả lời
    if (!answer) {
      if (q.includes('chấm công') || q.includes('điểm danh') || q.includes('check-in') || q.includes('check in') || q.includes('muộn') || q.includes('giờ làm')) {
      answer = `⏰ **Quy định Chấm công & Giờ làm việc:**\n\n` +
        `• **Giờ vào ca chuẩn:** \`${workStart}\` (Ân hạn đi muộn: **+${graceMin} phút**)\n` +
        `• **Giờ tan ca:** \`${workEnd}\`\n` +
        `• **Lịch làm việc:** ${workDays}\n\n` +
        `💡 **Cách chấm công:**\n` +
        `1. Nhấn nút **Check-in** trên thanh trên cùng (Navbar) khi bắt đầu ca.\n` +
        `2. Nếu vào ca sau \`${workStart}\` (quá ${graceMin} phút ân hạn), hệ thống sẽ tự động ghi nhận **Đi muộn**.\n` +
        `3. Khi hết giờ làm việc, nhấn **Check-out** để hệ thống tổng hợp số giờ làm thực tế.`;
      suggestions = ['Xem bảng chấm công', 'Cài đặt lại giờ ca làm việc', 'Quy định làm thêm giờ (OT)'];
      navigateTab = 'attendance';
    } else if (q.includes('tài sản') || q.includes('thiết bị') || q.includes('máy tính') || q.includes('laptop')) {
      const total = assetsCount?.count || 0;
      const maint = assetsCount?.maint_count || 0;
      answer = `📦 **Quản lý Tài sản & Thiết bị:**\n\n` +
        `Hệ thống đang quản lý **${total} tài sản** (${maint > 0 ? `trong đó có **${maint} thiết bị** đang bảo trì` : 'tất cả hoạt động tốt'}).\n\n` +
        `💡 **Các thao tác chính:**\n` +
        `• **Thêm tài sản mới:** Vào mục **Tài sản & Thiết bị** > Nhấn nút *"Thêm Tài Sản Mới"* > Nhập tên, mã serial, giá trị và gán người sử dụng.\n` +
        `• **Bàn giao thiết bị:** Khi cấp phát máy móc cho nhân sự, hãy lập **Biên bản bàn giao** để lưu vết và xuất file in A4 có chữ ký 2 bên.`;
      suggestions = ['Đi đến Quản lý tài sản', 'Hướng dẫn tạo biên bản bàn giao', 'Lập kế hoạch bảo trì'];
      navigateTab = 'assets';
    } else if (q.includes('biên bản') || q.includes('bàn giao') || q.includes('hợp đồng') || q.includes('in a4')) {
      answer = `📄 **Quy trình Lập & In Biên Bản Bàn Giao:**\n\n` +
        `1. Vào menu **Hợp đồng & Biên bản** > Chọn tab **"Biên Bản Bàn Giao"**.\n` +
        `2. Nhấn nút **"Lập Biên Bản Mới"** > Chọn bên giao, bên nhận và thiết bị bàn giao kèm tình trạng phụ kiện.\n` +
        `3. Sau khi lưu, nhấn biểu tượng **Máy in (Print)** trên thẻ biên bản. Hệ thống sẽ mở giao diện in ấn chuẩn khổ giấy **A4**, đã căn chỉnh lề, quốc hiệu, điều khoản pháp lý và 2 ô chữ ký rõ ràng.`;
      suggestions = ['Mở Hợp đồng & Biên bản', 'Xem danh sách biên bản', 'Quy định thu hồi tài sản'];
      navigateTab = 'contracts';
    } else if (q.includes('doanh thu') || q.includes('chi phí') || q.includes('tài chính') || q.includes('tiền')) {
      answer = `💰 **Quản lý Tài chính & Doanh thu:**\n\n` +
        `• Phân hệ **Doanh thu & Chi phí** cho phép theo dõi dòng tiền thời gian thực, tự động tính **Lợi nhuận ròng = Doanh thu - Chi phí**.\n` +
        `• Hỗ trợ biểu đồ trực quan biến động tài chính theo từng tháng.\n` +
        `• Có thể phân loại thu/chi theo các danh mục như Bán hàng, Dịch vụ, Lương thưởng, Mặt bằng, Thiết bị...`;
      suggestions = ['Xem Báo cáo tài chính', 'Thêm khoản thu mới', 'Thêm chi phí phát sinh'];
      navigateTab = 'finance';
    } else if (q.includes('công việc') || q.includes('task') || q.includes('nhắc hạn') || q.includes('quá hạn') || q.includes('deadline')) {
      const tasks = tasksRes?.results || [];
      const overdueList = tasks.filter((t) => t.due_date < new Date().toISOString().split('T')[0]);
      answer = `📋 **Quản lý Tiến độ Công việc:**\n\n` +
        (overdueList.length > 0 
          ? `⚠️ Hiện có **${overdueList.length} công việc quá hạn** cần xử lý gấp:\n` + overdueList.map((t) => `• *${t.title}* (Hạn: ${t.due_date})`).join('\n') + `\n\n`
          : `✅ Hệ thống không có công việc nào bị quá hạn!\n\n`) +
        `💡 Bạn có thể tạo công việc mới, gán người phụ trách và chọn mức độ ưu tiên (Khẩn cấp, Cao, Bình thường) để nhận cảnh báo tự động trên thanh thông báo.`;
      suggestions = ['Xem danh sách công việc', 'Tạo công việc mới', 'Lọc việc cần làm gấp'];
      navigateTab = 'tasks';
    } else if (q.includes('phân quyền') || q.includes('vai trò') || q.includes('role') || q.includes('admin') || q.includes('nhân sự')) {
      answer = `👥 **Hệ thống phân quyền 3 cấp độ:**\n\n` +
        `1. **Quản Trị Viên (ADMIN):** Toàn quyền truy cập, tiếp nhận nhân sự, phân vai trò, tạo danh mục và chỉnh sửa cài đặt hệ thống.\n` +
        `2. **Quản Lý (MANAGER):** Quản lý tài sản, theo dõi tài chính doanh thu, phân chia công việc và thiết lập ca làm việc.\n` +
        `3. **Nhân Viên (STAFF):** Thực hiện chấm công hằng ngày, xem danh sách tài sản được bàn giao và cập nhật tiến độ công việc được giao.`;
      suggestions = ['Mở Quản lý nhân sự', 'Thêm nhân viên mới', 'Cài đặt hệ thống'];
      navigateTab = 'users';
    } else if (q.includes('cài đặt') || q.includes('setting') || q.includes('đổi giờ') || q.includes('tên công ty')) {
      answer = `⚙️ **Cài Đặt Hệ Thống:**\n\n` +
        `Bạn có thể truy cập mục **Cài đặt hệ thống** (ở chân thanh Sidebar hoặc icon bánh răng trên Navbar) để:\n` +
        `• Thay đổi giờ vào ca, giờ tan ca, số phút ân hạn đi muộn.\n` +
        `• Tùy chỉnh tên công ty, số hotline, email và địa chỉ in trên Biên bản bàn giao.\n` +
        `• Đăng thông báo chung trên bảng tin toàn hệ thống.`;
      suggestions = ['Mở Cài đặt hệ thống', 'Quy định giờ chấm công', 'Đổi thông tin công ty'];
      navigateTab = 'settings';
    } else {
      answer = `👋 Xin chào ${userName || 'bạn'}! Tôi là **OMNI-Bot**, trợ lý AI đồng hành quản trị doanh nghiệp của bạn.\n\n` +
        `Tôi có thể hỗ trợ bạn:\n` +
        `• 📦 **Quản lý Tài sản**: Thêm mới, cấp phát, bảo trì và lập biên bản in A4.\n` +
        `• ⏰ **Chấm công**: Giải đáp quy định giờ vào/ra, ân hạn đi muộn, tính làm thêm giờ.\n` +
        `• 💰 **Tài chính & Doanh thu**: Phân tích dòng tiền, doanh thu và chi phí.\n` +
        `• 📋 **Công việc & Hợp đồng**: Theo dõi nhắc hạn và cảnh báo quá hạn.\n` +
        `• ⚙️ **Cài đặt hệ thống**: Tùy chỉnh quy định và thông tin doanh nghiệp.\n\n` +
        `Bạn muốn tìm hiểu hoặc cần trợ giúp về phần nào?`;
      suggestions = [
        'Quy định giờ chấm công',
        'Cách xuất biên bản bàn giao A4',
        'Kiểm tra công việc sắp đến hạn',
        'Hướng dẫn quản lý tài sản'
      ];
    }
  }

    return c.json({
      success: true,
      data: {
        reply: answer,
        suggestions,
        navigateTab
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Status Cloudflare
app.get('/api/cloudflare/status', (c) => {
  return c.json({
    success: true,
    data: {
      isConfigured: true,
      databaseMode: 'Cloudflare D1 Production (Native Binding)',
      databaseId: 'company_assets_db'
    }
  });
});

export default app;
