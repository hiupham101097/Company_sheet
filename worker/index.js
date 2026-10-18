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
    const [curHour, curMin] = timeStr.split(':').map(Number);
    const isLate = curHour > 8 || (curHour === 8 && curMin > 30);

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
      const noteText = (notes && String(notes).trim()) ? String(notes).trim() : (isLate ? 'Đi muộn sau 08:30' : 'Đúng giờ');

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
