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

// Đăng ký Doanh nghiệp Mới & Tạo User Quản Trị Viên (Super Admin)
app.post('/api/auth/register-company', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const {
      company_name,
      tax_id,
      industry,
      company_address,
      company_phone,
      company_email,
      admin_name,
      admin_email,
      admin_password,
      admin_phone,
      admin_title
    } = body;

    // Validate required fields
    if (!company_name || !company_name.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập tên doanh nghiệp' }, 400);
    }
    if (!admin_name || !admin_name.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập họ và tên Quản trị viên' }, 400);
    }
    if (!admin_email || !admin_email.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập email quản trị' }, 400);
    }
    if (!admin_password || admin_password.trim().length < 6) {
      return c.json({ success: false, message: 'Mật khẩu phải có tối thiểu 6 ký tự' }, 400);
    }

    const cleanEmail = admin_email.trim().toLowerCase();

    // Check if user email already exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM users WHERE lower(email) = ?')
      .bind(cleanEmail)
      .first();

    if (existing) {
      return c.json({
        success: false,
        message: `Email "${cleanEmail}" đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.`
      }, 400);
    }

    // Create Admin User
    const adminId = `adm_${Date.now()}`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(admin_name.trim())}`;
    const departmentName = admin_title?.trim() || 'Ban Giám Đốc';

    await c.env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, department, phone, avatar, status)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?, 'ACTIVE')
    `).bind(
      adminId,
      admin_name.trim(),
      cleanEmail,
      admin_password.trim(),
      departmentName,
      admin_phone ? admin_phone.trim() : (company_phone ? company_phone.trim() : ''),
      avatar
    ).run();

    // Ensure system_settings table exists & update company profile
    await initSettingsTable(c.env.DB);
    const now = new Date().toISOString();

    const settingsUpdates = [
      ['company_name', company_name.trim()],
      ['system_title', `Hệ Thống Quản Trị & Vận Hành - ${company_name.trim()}`],
      ['company_email', (company_email && company_email.trim()) ? company_email.trim() : cleanEmail],
      ['company_phone', (company_phone && company_phone.trim()) ? company_phone.trim() : (admin_phone ? admin_phone.trim() : '1900 6868')],
      ['company_address', (company_address && company_address.trim()) ? company_address.trim() : ''],
      ['tax_id', (tax_id && tax_id.trim()) ? tax_id.trim() : ''],
      ['system_announcement', `Chào mừng ${company_name.trim()} gia nhập hệ thống quản trị vận hành OMNI ASSETS!`]
    ];

    for (const [k, v] of settingsUpdates) {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (key, value, category, description, updated_at)
        VALUES (?, ?, 'GENERAL', '', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(k, v, now).run();
    }

    const newUser = {
      id: adminId,
      name: admin_name.trim(),
      email: cleanEmail,
      role: 'ADMIN',
      department: departmentName,
      phone: admin_phone || '',
      avatar,
      status: 'ACTIVE'
    };

    return c.json({
      success: true,
      message: `Đăng ký thành công doanh nghiệp ${company_name.trim()} và Quản trị viên ${admin_name.trim()}!`,
      data: {
        user: newUser,
        token: `jwt_${adminId}_${Date.now()}`
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message || 'Lỗi khi đăng ký doanh nghiệp' }, 500);
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
    const license = await getLicenseStatus(c.env.DB);
    if (license.isDemo) {
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM assets').first())?.count || 0;
      if (count >= 5) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: 'Bản Dùng Thử (Demo) giới hạn tối đa 5 tài sản. Vui lòng kích hoạt Bản Quyền Doanh Nghiệp (Enterprise) để thêm tài sản không giới hạn!'
        }, 403);
      }
    }

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
    const license = await getLicenseStatus(c.env.DB);
    if (license.isDemo) {
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM finance').first())?.count || 0;
      if (count >= 5) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: 'Bản Dùng Thử (Demo) giới hạn tối đa 5 giao dịch thu chi. Vui lòng kích hoạt Bản Quyền Doanh Nghiệp để ghi nhận không giới hạn!'
        }, 403);
      }
    }

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
      SELECT t.*, u.name as assigned_user_name, u.avatar as assigned_user_avatar, u.department as assigned_user_department
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
// 5. CONTRACTS & PROTOCOLS (HỢP ĐỒNG & BIÊN BẢN)
// ========================
async function initContractColumns(db) {
  try {
    await db.prepare("ALTER TABLE contracts ADD COLUMN terms TEXT").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE contracts ADD COLUMN appendices TEXT").run();
  } catch (_) {}
}

app.get('/api/contracts', async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const res = await c.env.DB.prepare('SELECT * FROM contracts ORDER BY start_date DESC').all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/contracts', async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const license = await getLicenseStatus(c.env.DB);
    if (license.isDemo) {
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM contracts').first())?.count || 0;
      if (count >= 3) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: 'Bản Dùng Thử (Demo) giới hạn tối đa 3 hợp đồng. Vui lòng kích hoạt Bản Quyền Doanh Nghiệp để lưu trữ không giới hạn!'
        }, 403);
      }
    }

    const body = await c.req.json();
    const id = `ctr_${Date.now()}`;
    const code = body.code || `HĐ-${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`;
    const terms = typeof body.terms === 'string' ? body.terms : (body.terms ? JSON.stringify(body.terms) : '');
    const appendices = typeof body.appendices === 'string' ? body.appendices : (body.appendices ? JSON.stringify(body.appendices) : '[]');

    await c.env.DB.prepare(`
      INSERT INTO contracts (id, code, title, type, partner_name, value, start_date, end_date, status, notes, terms, appendices)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      body.notes || '',
      terms,
      appendices
    ).run();

    return c.json({ success: true, message: 'Đã thêm hợp đồng', data: { id, code } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Cập nhật hợp đồng
app.put('/api/contracts/:id', async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await c.env.DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
    if (!existing) {
      return c.json({ success: false, message: 'Hợp đồng không tồn tại' }, 404);
    }

    const terms = body.terms !== undefined 
      ? (typeof body.terms === 'string' ? body.terms : JSON.stringify(body.terms))
      : existing.terms;

    const appendices = body.appendices !== undefined
      ? (typeof body.appendices === 'string' ? body.appendices : JSON.stringify(body.appendices))
      : existing.appendices;

    await c.env.DB.prepare(`
      UPDATE contracts
      SET title = ?, type = ?, partner_name = ?, value = ?, start_date = ?, end_date = ?, status = ?, notes = ?, terms = ?, appendices = ?
      WHERE id = ?
    `).bind(
      body.title ?? existing.title,
      body.type ?? existing.type,
      body.partner_name ?? existing.partner_name,
      Number(body.value ?? existing.value) || 0,
      body.start_date ?? existing.start_date,
      body.end_date ?? existing.end_date,
      body.status ?? existing.status,
      body.notes ?? existing.notes,
      terms,
      appendices,
      id
    ).run();

    return c.json({ success: true, message: 'Cập nhật hợp đồng thành công' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Thêm phụ lục hợp đồng
app.post('/api/contracts/:id/appendices', async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    const contract = await c.env.DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
    if (!contract) {
      return c.json({ success: false, message: 'Không tìm thấy hợp đồng' }, 404);
    }

    let appendicesList = [];
    try {
      if (contract.appendices) appendicesList = JSON.parse(contract.appendices);
    } catch (_) {}
    if (!Array.isArray(appendicesList)) appendicesList = [];

    const newAppendix = {
      id: `pl_${Date.now()}`,
      code: body.code || `PL-${String(appendicesList.length + 1).padStart(2, '0')}/${contract.code}`,
      title: body.title || `Phụ lục số ${appendicesList.length + 1}`,
      date: body.date || new Date().toISOString().split('T')[0],
      adjustment_value: Number(body.adjustment_value) || 0,
      content: body.content || '',
      created_at: new Date().toISOString()
    };

    appendicesList.push(newAppendix);

    await c.env.DB.prepare('UPDATE contracts SET appendices = ? WHERE id = ?')
      .bind(JSON.stringify(appendicesList), id)
      .run();

    return c.json({
      success: true,
      message: `Đã thêm ${newAppendix.title} thành công!`,
      data: newAppendix
    });
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

// ==========================================
// 6.1. AI CONTRACT TEMPLATE LEARNING & DRAFTING
// ==========================================
async function initAiTemplateTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_contract_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        category_name TEXT,
        summary TEXT,
        structure_schema TEXT,
        sample_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (_) {}
}

// Lấy danh sách mẫu hợp đồng đã học
app.get('/api/contracts/ai/templates', async (c) => {
  try {
    await initAiTemplateTable(c.env.DB);
    let res = await c.env.DB.prepare('SELECT * FROM ai_contract_templates ORDER BY created_at DESC').all();
    let templates = res.results || [];

    // Nếu kho mẫu trống, nạp sẵn 3 mẫu tiêu chuẩn doanh nghiệp
    if (templates.length === 0) {
      const initialSeed = [
        {
          id: 'tpl_service_it',
          title: 'Hợp Đồng Cung Cấp Dịch Vụ Vận Hành IT & Phần Mềm',
          type: 'SERVICE',
          category_name: 'Hợp Đồng Dịch Vụ',
          summary: 'Cung ứng dịch vụ triển khai hệ thống, phần mềm và bảo trì vận hành định kỳ cho đối tác.',
          structure_schema: JSON.stringify({
            requiredFields: ['Bên A (Khách hàng)', 'Bên B (Đơn vị cung cấp)', 'Phạm vi công việc', 'Giá trị hợp đồng', 'Thời hạn thanh toán', 'Tiêu chuẩn nghiệm thu SLA'],
            articles: ['Điều 1: Nội dung và phạm vi dịch vụ', 'Điều 2: Giá trị hợp đồng & Tiến độ thanh toán', 'Điều 3: Cam kết chất lượng & Bảo hành', 'Điều 4: Quyền và nghĩa vụ hai bên', 'Điều 5: Bảo mật thông tin & Giải quyết tranh chấp']
          }),
          sample_content: `ĐIỀU 1: PHẠM VI DỊCH VỤ VÀ NỘI DUNG THỰC HIỆN
1.1. Bên B cung cấp dịch vụ quản trị, vận hành và tối ưu hóa hệ thống máy chủ, phần mềm quản lý cho Bên A.
1.2. Bên B cam kết duy trì hệ thống hoạt động ổn định 99.9%, hỗ trợ kỹ thuật 24/7 khi phát sinh sự cố khẩn cấp.

ĐIỀU 2: GIÁ TRỊ VÀ PHƯƠNG THỨC THANH TOÁN
2.1. Chi phí dịch vụ được quy định chi tiết theo từng giai đoạn nghiệm thu thực tế.
2.2. Hình thức thanh toán: Chuyển khoản ngân hàng trong vòng 07 ngày làm việc kể từ ngày nhận đủ hóa đơn tài chính hợp lệ.

ĐIỀU 3: BẢO HÀNH VÀ BẢO TRÌ ĐỊNH KỲ
3.1. Bên B thực hiện bảo trì, kiểm tra an ninh và sao lưu dữ liệu hệ thống định kỳ hàng tháng.
3.2. Khi phát sinh sự cố, thời gian phản hồi kỹ thuật viên không quá 30 phút và khắc phục trong vòng 04 giờ.

ĐIỀU 4: BẢO MẬT VÀ ĐIỀU KHOẢN CHUNG
4.1. Hai bên cam kết bảo mật tuyệt đối dữ liệu nội bộ và bí mật kinh doanh của nhau.
4.2. Mọi sửa đổi, bổ sung hợp đồng phải được lập thành Phụ lục văn bản có chữ ký của đại diện hai bên.`
        },
        {
          id: 'tpl_rental_hardware',
          title: 'Hợp Đồng Cho Thuê Thiết Bị Tin Học & Máy Móc Văn Phòng',
          type: 'RENTAL',
          category_name: 'Hợp Đồng Thuê Tài Sản',
          summary: 'Hợp đồng cho thuê laptop, máy tính để bàn, máy in kèm điều khoản đổi mới thiết bị khi xảy ra hỏng hóc kỹ thuật.',
          structure_schema: JSON.stringify({
            requiredFields: ['Danh mục máy móc thuê', 'Tiền đặt cọc', 'Đơn giá thuê theo tháng', 'Địa điểm lắp đặt', 'Quy định bảo hành đổi máy trong 4h'],
            articles: ['Điều 1: Đối tượng tài sản cho thuê', 'Điều 2: Thời hạn thuê và phí dịch vụ', 'Điều 3: Tiền đặt cọc và phương thức hoàn cọc', 'Điều 4: Trách nhiệm sử dụng và bảo dưỡng', 'Điều 5: Bàn giao và thu hồi thiết bị']
          }),
          sample_content: `ĐIỀU 1: ĐỐI TƯỢNG VÀ TÌNH TRẠNG THIẾT BỊ CHO THUÊ
1.1. Bên A đồng ý cho Bên B thuê danh mục thiết bị tin học (laptop/máy tính/máy in) theo chi tiết trong Phụ lục đính kèm.
1.2. Toàn bộ thiết bị bàn giao đều nguyên tem niêm phong, hoạt động ổn định và có đầy đủ phụ kiện chính hãng.

ĐIỀU 2: GIÁ THUÊ VÀ TIỀN ĐẶT CỌC
2.1. Đơn giá thuê được tính trọn gói theo tháng, đã bao gồm chi phí bảo dưỡng định kỳ và thay thế linh kiện hao mòn.
2.2. Tiền đặt cọc được Bên A hoàn trả nguyên vẹn cho Bên B trong vòng 03 ngày làm việc sau khi kết thúc hợp đồng và thanh lý tài sản.

ĐIỀU 3: BẢO HÀNH VÀ ĐỔI MÁY THAY THẾ
3.1. Nếu thiết bị gặp lỗi phần cứng do nhà sản xuất, Bên A cam kết cung cấp thiết bị tương đương thay thế trong vòng 04 giờ làm việc.
3.2. Bên B chịu trách nhiệm bảo quản tài sản tại địa chỉ đã đăng ký, không tự ý tháo mở hoặc sửa chữa khi chưa có sự đồng ý của Bên A.`
        },
        {
          id: 'tpl_handover_asset',
          title: 'Biên Bản Bàn Giao Thiết Bị & Phương Tiện Làm Việc Chuẩn A4',
          type: 'HANDOVER',
          category_name: 'Biên Bản Bàn Giao',
          summary: 'Mẫu biên bản bàn giao máy móc, công cụ làm việc cho nhân viên mới có xác nhận phụ kiện và quy định bảo quản.',
          structure_schema: JSON.stringify({
            requiredFields: ['Đại diện Bên giao', 'Nhân viên Bên nhận', 'Mã tài sản & Serial máy', 'Tình trạng ngoại quan & phụ kiện', 'Cam kết hoàn trả khi nghỉ việc'],
            articles: ['Điều 1: Thông tin tài sản bàn giao', 'Điều 2: Tình trạng phụ kiện và phần mềm', 'Điều 3: Trách nhiệm sử dụng và cam kết bồi thường nếu làm mất']
          }),
          sample_content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------------
BIÊN BẢN BÀN GIAO TÀI SẢN & THIẾT BỊ LÀM VIỆC

Hôm nay, ngày bàn giao thực tế tại văn phòng Công ty, chúng tôi gồm có:
- BÊN GIAO (Đại diện Bộ phận Quản trị Thiết bị / IT)
- BÊN NHẬN (Cán bộ nhân viên tiếp nhận sử dụng)

NỘI DUNG BÀN GIAO:
1. Thiết bị được cấp phát theo đúng chức danh công việc, gồm máy chính, sạc nguồn zin, chuột, túi chống sốc và phụ kiện kèm theo.
2. Thiết bị hoạt động ổn định, màn hình sáng rõ, không trầy xước hay móp méo vỏ máy, tem niêm phong còn nguyên vẹn.
3. Bên nhận cam kết sử dụng đúng mục đích công việc, chịu trách nhiệm bảo quản cẩn thận và có nghĩa vụ hoàn trả nguyên trạng cho công ty khi thôi việc hoặc chuyển vị trí.`
        }
      ];

      for (const item of initialSeed) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(item.id, item.title, item.type, item.category_name, item.summary, item.structure_schema, item.sample_content).run();
      }

      res = await c.env.DB.prepare('SELECT * FROM ai_contract_templates ORDER BY created_at DESC').all();
      templates = res.results || [];
    }

    return c.json({ success: true, data: templates });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Lưu mẫu hợp đồng thủ công hoặc từ AI
app.post('/api/contracts/ai/templates', async (c) => {
  try {
    await initAiTemplateTable(c.env.DB);
    const body = await c.req.json();
    const id = body.id || `tpl_${Date.now()}`;
    const schemaStr = typeof body.structure_schema === 'object' ? JSON.stringify(body.structure_schema) : (body.structure_schema || '{}');

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title || 'Mẫu Hợp Đồng Tùy Biến',
      body.type || 'CONTRACT',
      body.category_name || 'Hợp Đồng Thương Mại',
      body.summary || '',
      schemaStr,
      body.sample_content || ''
    ).run();

    return c.json({ success: true, message: 'Đã lưu mẫu hợp đồng thành công', data: { id } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Xóa mẫu hợp đồng đã học
app.delete('/api/contracts/ai/templates/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM ai_contract_templates WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Đã xóa mẫu hợp đồng' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// AI Phân tích & Học mô hình hợp đồng từ tài liệu người dùng import
app.post('/api/contracts/ai/learn', async (c) => {
  try {
    await initAiTemplateTable(c.env.DB);
    const body = await c.req.json();
    const { rawContent, titleHint, categoryHint, typeHint } = body;

    if (!rawContent || !rawContent.trim()) {
      return c.json({ success: false, message: 'Vui lòng cung cấp nội dung văn bản hợp đồng hoặc biên bản để AI phân tích' }, 400);
    }

    // Lấy API Key từ DB hoặc env
    let geminiApiKey = c.env?.GEMINI_API_KEY || '';
    let geminiModel = c.env?.GEMINI_MODEL || 'gemini-3.8-flash';
    try {
      const sKey = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'gemini_api_key'").first();
      if (sKey?.value) geminiApiKey = sKey.value.trim();
    } catch (_) {}

    const prompt = `Bạn là một chuyên gia pháp chế doanh nghiệp và kiến trúc sư tri thức hợp đồng cao cấp.
Nhiệm vụ của bạn là đọc hiểu, phân tích sâu và trích xuất cấu trúc văn bản hợp đồng / biên bản dưới đây để học thành một "MẪU HỢP ĐỒNG / BIÊN BẢN CHUẨN":

--- VĂN BẢN IMPORT ---
${rawContent.slice(0, 12000)}
--- HẾT VĂN BẢN ---

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json ở ngoài), có cấu trúc chính xác như sau:
{
  "title": "Tên chuẩn hóa của mẫu văn bản (Ví dụ: Hợp Đồng Thuê Máy Móc, Hợp Đồng Dịch Vụ...)",
  "type": "Một trong các mã: SERVICE | RENTAL | LABOR | PURCHASE | HANDOVER | APPENDIX | PARTNER",
  "category_name": "Tên phân loại (Ví dụ: Hợp Đồng Dịch Vụ, Hợp Đồng Thuê Tài Sản, Biên Bản Bàn Giao...)",
  "summary": "Tóm tắt ngắn gọn 2-3 câu về mục đích, đối tượng áp dụng và điểm then chốt của văn bản này",
  "structure_schema": {
    "requiredFields": ["Các trường thông tin bắt buộc cần khách hàng cung cấp khi ký kết (Ví dụ: Tên khách hàng, Mã số thuế, Giá trị, Thời hạn, Đại diện...)"],
    "articles": ["Danh sách các điều khoản trọng tâm của mẫu (Ví dụ: Điều 1: Phạm vi..., Điều 2: Giá trị..., Điều 3: Nghiệm thu...)"]
  },
  "sample_content": "Nội dung điều khoản chuẩn hóa (các ĐIỀU 1, ĐIỀU 2, ĐIỀU 3...) với các biến số dạng {{TEN_DOI_TAC}}, {{GIA_TRI_HOP_DONG}}, {{THOI_HAN}} để sau này dễ áp dụng."
}`;

    let learnedData = null;
    let needClientGemini = true;

    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 3072,
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        });

        if (res.ok) {
          const json = await res.json();
          const parts = json?.candidates?.[0]?.content?.parts || [];
          const textParts = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text);
          const rawText = textParts.join('\n\n') || parts.map(p => p.text).filter(Boolean).join('\n\n');
          
          // Trích xuất JSON từ phản hồi
          const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            learnedData = JSON.parse(cleanedText);
            needClientGemini = false;
          } catch (_) {
            console.warn('Cannot parse server Gemini JSON, fallback to client');
          }
        }
      } catch (err) {
        console.error('Server gemini learn error:', err);
      }
    }

    // Nếu server xử lý thành công thì lưu ngay vào DB
    if (learnedData) {
      const id = `tpl_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        learnedData.title || titleHint || 'Mẫu Hợp Đồng Đã Học',
        learnedData.type || typeHint || 'CONTRACT',
        learnedData.category_name || categoryHint || 'Hợp Đồng Doanh Nghiệp',
        learnedData.summary || '',
        JSON.stringify(learnedData.structure_schema || {}),
        learnedData.sample_content || rawContent
      ).run();

      return c.json({
        success: true,
        message: 'AI đã học và mô hình hóa văn bản hợp đồng thành công!',
        data: {
          id,
          ...learnedData,
          needClientGemini: false
        }
      });
    }

    // Nếu server gặp lỗi vùng miền IP Cloudflare, gửi payload cho client tự gọi
    return c.json({
      success: true,
      message: 'Chuẩn bị dữ liệu để AI phân tích tại trình duyệt',
      data: {
        needClientGemini: true,
        prompt,
        geminiApiKey,
        geminiModel,
        rawContent,
        titleHint: titleHint || 'Mẫu Hợp Đồng Đã Học'
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// AI Xây dựng / Soạn thảo hợp đồng mới dựa trên mẫu đã học và yêu cầu khách hàng
app.post('/api/contracts/ai/generate', async (c) => {
  try {
    const body = await c.req.json();
    const {
      templateId,
      contractType = 'SERVICE',
      partner_name = '',
      representative = '',
      value = '0',
      start_date = '',
      end_date = '',
      custom_requirements = ''
    } = body;

    // Lấy thông tin mẫu đã học từ DB
    let template = null;
    if (templateId) {
      template = await c.env.DB.prepare('SELECT * FROM ai_contract_templates WHERE id = ?').bind(templateId).first();
    }
    if (!template) {
      template = await c.env.DB.prepare('SELECT * FROM ai_contract_templates ORDER BY created_at DESC LIMIT 1').first();
    }

    let geminiApiKey = c.env?.GEMINI_API_KEY || '';
    let geminiModel = c.env?.GEMINI_MODEL || 'gemini-3.8-flash';
    try {
      const sKey = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'gemini_api_key'").first();
      if (sKey?.value) geminiApiKey = sKey.value.trim();
    } catch (_) {}

    const prompt = `Bạn là chuyên gia pháp chế và soạn thảo hợp đồng thương mại xuất sắc.
Nhiệm vụ của bạn: Dựa trên MẪU HỢP ĐỒNG ĐÃ HỌC bên dưới, hãy xây dựng một bản hợp đồng HOÀN CHỈNH, CHUYÊN NGHIỆP, CHUẨN MỰC PHÁP LÝ cho khách hàng theo đúng các thông tin thực tế được cung cấp.

--- THÔNG TIN MẪU HỢP ĐỒNG ĐÃ HỌC ---
Tên mẫu: ${template?.title || 'Hợp Đồng Dịch Vụ'}
Phân loại: ${template?.category_name || 'Hợp Đồng Doanh Nghiệp'}
Cấu trúc mẫu:
${template?.sample_content || ''}
--- HẾT THÔNG TIN MẪU ---

--- THÔNG TIN KHÁCH HÀNG & THỎA THUẬN MỚI ---
• Tên đối tác / Khách hàng (Bên B): ${partner_name || 'Đối tác / Khách hàng'}
• Người đại diện pháp luật: ${representative || 'Đại diện theo pháp luật'}
• Tổng giá trị hợp đồng: ${value} VNĐ
• Thời hạn thực hiện: Từ ngày ${start_date || 'ngày ký'} đến ngày ${end_date || 'ngày kết thúc'}
• Các điều khoản / yêu cầu đặc thù của khách hàng: ${custom_requirements || 'Thực hiện theo tiêu chuẩn nghiệp vụ chuẩn mực, bảo hành đầy đủ, hóa đơn tài chính hợp lệ.'}
--- HẾT THÔNG TIN MỚI ---

YÊU CẦU ĐẦU RA:
Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json ở ngoài) với cấu trúc:
{
  "title": "Tiêu đề hợp đồng (Ví dụ: HỢP ĐỒNG CUNG CẤP DỊCH VỤ CÔNG NGHỆ VÀ VẬN HÀNH)",
  "partner_name": "${partner_name}",
  "value": "${value}",
  "start_date": "${start_date}",
  "end_date": "${end_date}",
  "terms": "Toàn bộ các điều khoản chi tiết (ĐIỀU 1: ĐỐI TƯỢNG..., ĐIỀU 2: GIÁ TRỊ VÀ PHƯƠNG THỨC THANH TOÁN..., ĐIỀU 3: TIẾN ĐỘ VÀ NGHIỆM THU..., ĐIỀU 4: BẢO HÀNH VÀ CAM KẾT ĐẶC THÙ..., ĐIỀU 5: BẢO MẬT VÀ PHẠT VI PHẠM..., ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG) đã được tích hợp nhuần nhuyễn yêu cầu đặc thù của khách hàng.",
  "notes": "Ghi chú tóm tắt điểm nổi bật và cam kết quan trọng trong hợp đồng này."
}`;

    let generatedContract = null;
    let needClientGemini = true;

    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 3072,
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        });

        if (res.ok) {
          const json = await res.json();
          const parts = json?.candidates?.[0]?.content?.parts || [];
          const textParts = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text);
          const rawText = textParts.join('\n\n') || parts.map(p => p.text).filter(Boolean).join('\n\n');
          const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            generatedContract = JSON.parse(cleanedText);
            needClientGemini = false;
          } catch (_) {
            console.warn('Cannot parse server Gemini JSON, fallback to client');
          }
        }
      } catch (err) {
        console.error('Server gemini generate error:', err);
      }
    }

    if (generatedContract) {
      return c.json({
        success: true,
        message: 'Đã xây dựng hợp đồng bằng AI thành công!',
        data: {
          ...generatedContract,
          needClientGemini: false
        }
      });
    }

    return c.json({
      success: true,
      message: 'Chuẩn bị dữ liệu soạn thảo hợp đồng bằng AI',
      data: {
        needClientGemini: true,
        prompt,
        geminiApiKey,
        geminiModel,
        partner_name,
        value,
        start_date,
        end_date
      }
    });
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

    const [curHour, curMin] = timeStr.includes(':')
      ? timeStr.split(':').map(Number)
      : [new Date().getHours(), new Date().getMinutes()];

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
        if (existing.check_out) {
          return c.json({
            success: false,
            message: `Nhân viên ${targetUser.name} đã hoàn tất ca hôm nay (đã Check-out lúc ${existing.check_out}). Vui lòng chờ đến ngày mai để bắt đầu ca mới!`
          }, 400);
        }
        return c.json({
          success: false,
          message: `Nhân viên ${targetUser.name} đã điểm danh vào ca hôm nay lúc ${existing.check_in || 'trước đó'}. Một ngày chỉ được điểm danh vào ca 1 lần!`
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
          message: `Nhân viên ${targetUser.name} chưa điểm danh vào ca (Check-in) trong ngày ${today} nên chưa thể tan ca!`
        }, 400);
      }
      if (existing.check_out) {
        return c.json({
          success: false,
          message: `Nhân viên ${targetUser.name} đã điểm danh tan ca hôm nay lúc ${existing.check_out} rồi (Tổng giờ: ${existing.total_hours || 0}h). Không thể Check-out lần nữa!`
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

    const license = await getLicenseStatus(c.env.DB);
    if (license.isDemo) {
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM users').first())?.count || 0;
      if (count >= 4) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: 'Bản Dùng Thử (Demo) giới hạn tối đa 4 tài khoản nhân sự. Vui lòng kích hoạt Bản Quyền Doanh Nghiệp (Enterprise) để tiếp nhận nhân sự không giới hạn!'
        }, 403);
      }
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

app.put('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const role = c.req.header('x-user-role') || 'STAFF';
    if (role !== 'ADMIN') {
      return c.json({ success: false, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền chỉnh sửa nhân sự' }, 403);
    }
    const body = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          role = COALESCE(?, role),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status)
      WHERE id = ?
    `).bind(
      body.name !== undefined ? body.name : null,
      body.email !== undefined ? body.email : null,
      body.department !== undefined ? body.department : null,
      body.role !== undefined ? body.role : null,
      body.phone !== undefined ? body.phone : null,
      body.status !== undefined ? body.status : null,
      id
    ).run();

    return c.json({ success: true, message: 'Đã cập nhật thông tin nhân sự và phòng ban' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const role = c.req.header('x-user-role') || 'STAFF';
    if (role !== 'ADMIN') {
      return c.json({ success: false, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền xóa nhân sự' }, 403);
    }
    if (id === 'usr_admin' || id === 'usr_1') {
      return c.json({ success: false, message: 'Không thể xóa tài khoản Quản trị viên khởi tạo' }, 400);
    }
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Đã xóa nhân sự khỏi hệ thống' });
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
      ['gemini_api_key', '', 'GENERAL', 'Google Gemini AI API Key', new Date().toISOString()],
      // LICENSE & PAYWALL
      ['license_tier', 'DEMO', 'LICENSE', 'Cấp độ bản quyền (DEMO hoặc ENTERPRISE)', new Date().toISOString()],
      ['license_key', '', 'LICENSE', 'Khóa bản quyền đã kích hoạt', new Date().toISOString()],
      ['license_status', 'ACTIVE', 'LICENSE', 'Trạng thái bản quyền', new Date().toISOString()],
      ['license_activated_at', '', 'LICENSE', 'Thời gian kích hoạt bản quyền', new Date().toISOString()]
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

// Helper: Query license status from DB
async function getLicenseStatus(db) {
  try {
    const res = await db.prepare('SELECT key, value FROM system_settings WHERE key IN ("license_tier", "license_key", "license_status", "license_activated_at", "company_name")').all();
    const map = {};
    (res.results || []).forEach((r) => { map[r.key] = r.value; });
    const tier = map.license_tier || 'DEMO';
    const isDemo = tier !== 'ENTERPRISE';
    return {
      tier: isDemo ? 'DEMO' : 'ENTERPRISE',
      isDemo,
      key: map.license_key || '',
      status: map.license_status || 'ACTIVE',
      activatedAt: map.license_activated_at || null,
      organization: map.company_name || 'Doanh Nghiệp'
    };
  } catch {
    return { tier: 'DEMO', isDemo: true, key: '', status: 'ACTIVE', activatedAt: null, organization: 'Doanh Nghiệp' };
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
// 10.5 LICENSE & PAYWALL
// ========================
app.get('/api/license/status', async (c) => {
  try {
    await initSettingsTable(c.env.DB);
    const license = await getLicenseStatus(c.env.DB);
    const [assetsCount, usersCount, contractsCount, financeCount] = await Promise.all([
      c.env.DB.prepare('SELECT count(*) as count FROM assets').first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM users').first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM contracts').first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM finance').first().catch(() => ({ count: 0 })),
    ]);

    return c.json({
      success: true,
      data: {
        ...license,
        limits: {
          assets: { current: assetsCount?.count || 0, max: license.isDemo ? 5 : 'UNLIMITED' },
          users: { current: usersCount?.count || 0, max: license.isDemo ? 4 : 'UNLIMITED' },
          contracts: { current: contractsCount?.count || 0, max: license.isDemo ? 3 : 'UNLIMITED' },
          finance: { current: financeCount?.count || 0, max: license.isDemo ? 5 : 'UNLIMITED' },
          excelExport: !license.isDemo,
          unwatermarkedPrint: !license.isDemo
        }
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/license/activate', async (c) => {
  try {
    const { license_key } = await c.req.json().catch(() => ({}));
    const cleanKey = (license_key || '').trim().toUpperCase();

    if (!cleanKey) {
      return c.json({ success: false, message: 'Vui lòng nhập mã bản quyền (License Key)' }, 400);
    }

    // Supported key formats:
    // 1. Predefined standard keys: OMNI-ENTERPRISE-2026, OMNI-VIP-8888, OMNI-PRO-9999, OMNI-LIFETIME-PRO
    // 2. Pattern: OMNI-XXXX-XXXX-XXXX or prefix OMNI-ENT-
    const validPredefined = [
      'OMNI-ENTERPRISE-2026',
      'OMNI-VIP-8888',
      'OMNI-PRO-9999',
      'OMNI-LIFETIME-PRO',
      'OMNI-VIP-2026',
      'ENTERPRISE-PRO-8888'
    ];

    const pattern = /^OMNI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    const entPrefix = cleanKey.startsWith('OMNI-ENT-');

    if (!validPredefined.includes(cleanKey) && !pattern.test(cleanKey) && !entPrefix) {
      return c.json({
        success: false,
        message: 'Mã bản quyền không hợp lệ. Vui lòng kiểm tra lại hoặc liên hệ Hotline/Zalo để được cấp mã kích hoạt.'
      }, 400);
    }

    const now = new Date().toISOString();
    await initSettingsTable(c.env.DB);

    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = 'ENTERPRISE', updated_at = ?
      WHERE key = 'license_tier'
    `).bind(now).run();

    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = ?, updated_at = ?
      WHERE key = 'license_key'
    `).bind(cleanKey, now).run();

    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = ?, updated_at = ?
      WHERE key = 'license_activated_at'
    `).bind(now, now).run();

    return c.json({
      success: true,
      message: '🎉 Kích hoạt Bản Quyền Doanh Nghiệp (Enterprise) thành công! Mọi chức năng đã được mở khóa toàn diện.',
      data: {
        tier: 'ENTERPRISE',
        isDemo: false,
        key: cleanKey,
        activatedAt: now
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/license/reset-demo', async (c) => {
  try {
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = 'DEMO', updated_at = ?
      WHERE key = 'license_tier'
    `).bind(now).run();

    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = '', updated_at = ?
      WHERE key = 'license_key'
    `).bind(now).run();

    return c.json({
      success: true,
      message: 'Đã chuyển về chế độ Dùng Thử (Demo) để kiểm thử các giới hạn tính năng.',
      data: { tier: 'DEMO', isDemo: true }
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

    const geminiApiKey = (settingsMap.gemini_api_key || c.env?.GEMINI_API_KEY || '').trim();
    const geminiModel = (settingsMap.gemini_model || c.env?.GEMINI_MODEL || 'gemini-3.8-flash').trim();

    // Lấy ngày giờ hiện tại theo giờ Việt Nam
    const nowVN = new Date();
    const currentDateStr = nowVN.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
    const currentTimeStr = nowVN.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

    // System Prompt for Gemini with live corporate context
    const systemPrompt = `Bạn là OMNI-Bot, trợ lý AI thông minh, linh hoạt, thân thiện và am hiểu sâu sắc của hệ thống quản lý doanh nghiệp OMNI ASSETS.
Nhiệm vụ của bạn là tư vấn, giải đáp mọi thắc mắc và hướng dẫn người dùng xử lý công việc hiệu quả trên trang web này.

Bối cảnh thời gian & hệ thống thực tế:
- Thời gian hiện tại: ${currentTimeStr}, ${currentDateStr} (Giờ Việt Nam GMT+7).
- Tên công ty: ${settingsMap.company_name || 'OMNI ASSETS & LOGISTICS'}
- Người đang trò chuyện: ${userName || 'Nhân sự'} (Vai trò hệ thống: ${userRole || 'STAFF'})
- Tab người dùng đang đứng: '${activeTab || 'dashboard'}'
- Quy định giờ làm việc: Vào ca lúc ${workStart}, Tan ca lúc ${workEnd}, Ân hạn đi muộn ${graceMin} phút, Lịch làm việc ${workDays}.
- Tài sản: Đang quản lý ${assetsCount?.count || 0} tài sản (${assetsCount?.maint_count || 0} thiết bị đang bảo trì).
- Công việc: Có ${tasksRes?.results?.length || 0} công việc đang theo dõi trong hệ thống.
- Các phân hệ trên trang web:
  1. 'dashboard' (Tổng quan): Bảng điều khiển tài sản, thu chi, cảnh báo nhắc hạn.
  2. 'assets' (Tài sản & Thiết bị): Quản lý máy móc, cấp phát, bảo trì, serial thiết bị.
  3. 'finance' (Doanh thu & Chi phí): Dòng tiền thu chi, lợi nhuận ròng.
  4. 'tasks' (Công việc & Phân công): Giao việc theo phòng ban, hạn chót, nhắc hạn tự động 06:00 sáng.
  5. 'contracts' (Hợp đồng & Biên bản): Hợp đồng đối tác, Lập & In Biên bản bàn giao chuẩn A4.
  6. 'attendance' (Chấm công): Check-in, Check-out 1 lần/ngày, tính giờ làm, phạt đi muộn.
  7. 'users' (Quản lý Nhân sự & Phòng ban): Danh sách nhân viên, gán phòng ban, phân quyền (ADMIN, MANAGER, STAFF).
  8. 'categories' (Quản lý Danh mục): Quản lý danh mục phòng ban doanh nghiệp, loại tài sản, thu chi.
  9. 'settings' (Cài đặt hệ thống): Giờ làm việc, ân hạn đi muộn, hotline, thông tin doanh nghiệp.

Phong cách phản hồi của AI:
- Bạn là trí tuệ nhân tạo thực sự, tư duy sắc sảo, tự nhiên, hiểu ngữ cảnh và trả lời trực tiếp vào trọng tâm câu hỏi.
- TUYỆT ĐỐI KHÔNG dùng văn mẫu cố định, không lặp lại nguyên si tài liệu hướng dẫn nếu người dùng chỉ hỏi ngắn gọn hoặc hỏi chuyện đời thường, kiến thức, tính toán.
- Trả lời bằng tiếng Việt văn minh, trình bày mạch lạc, sử dụng gạch đầu dòng (•) và in đậm (**từ khóa**) giúp người dùng dễ theo dõi.
- Nếu người dùng cần hướng dẫn thao tác trên web, hãy chỉ rõ tên menu/nút bấm cụ thể.
- Nếu người dùng chào hỏi hoặc hỏi bất cứ điều gì (ngày giờ, quản trị kinh doanh, kỹ thuật, excel, cuộc sống), hãy trả lời thông minh, dí dỏm và hữu ích.`;

    let answer = '';
    let suggestions = [];
    let navigateTab = null;

    // Gợi ý tab điều hướng theo ngữ cảnh câu hỏi
    if (q.includes('chấm công') || q.includes('điểm danh') || q.includes('check-in') || q.includes('checkin') || q.includes('muộn')) {
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
      suggestions = ['Xem danh sách công việc', 'Tạo công việc mới', 'Lọc việc theo phòng ban'];
    } else if (q.includes('phòng ban') || q.includes('bộ phận') || q.includes('department')) {
      navigateTab = 'categories';
      suggestions = ['Xem Danh mục phòng ban', 'Phân công việc theo phòng ban', 'Danh sách nhân sự phòng ban'];
    } else if (q.includes('phân quyền') || q.includes('vai trò') || q.includes('role') || q.includes('nhân sự') || q.includes('nhân viên')) {
      navigateTab = 'users';
      suggestions = ['Mở Quản lý nhân sự', 'Thêm nhân viên mới', 'Gắn nhân viên vào phòng ban'];
    } else if (q.includes('cài đặt') || q.includes('setting') || q.includes('đổi giờ') || q.includes('công ty')) {
      navigateTab = 'settings';
      suggestions = ['Mở Cài đặt hệ thống', 'Quy định giờ chấm công', 'Đổi thông tin công ty'];
    } else {
      suggestions = ['Quy định giờ chấm công', 'Cách xuất biên bản bàn giao A4', 'Giao việc cho phòng ban', 'Hướng dẫn quản lý tài sản'];
    }

    let debugInfo = { keyLen: geminiApiKey.length, model: geminiModel };

    // 1. Gọi trực tiếp Google Gemini API bằng Key được cấu hình
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        debugInfo.url = geminiUrl.replace(geminiApiKey, 'KEY_MASKED');
        const geminiReq = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\n---\nNgười dùng hỏi: "${message}"` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3072,
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        });

        debugInfo.status = geminiReq.status;
        debugInfo.statusText = geminiReq.statusText;

        if (geminiReq.ok) {
          const geminiData = await geminiReq.json();
          const candidate = geminiData.candidates?.[0];
          debugInfo.candidate = candidate;
          const parts = candidate?.content?.parts || [];
          const textParts = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text);
          const fullText = textParts.length > 0 ? textParts.join('\n\n') : parts.map(p => p.text).filter(Boolean).join('\n\n');
          if (fullText && fullText.trim()) {
            answer = fullText.trim();
          }
        } else {
          const errText = await geminiReq.text();
          debugInfo.errText = errText;
          console.error(`Gemini API call failed with status ${geminiReq.status}:`, errText);
        }
      } catch (geminiError) {
        debugInfo.exception = geminiError?.message || String(geminiError);
        console.error('Gemini API fetch error:', geminiError);
      }
    }

    const needClientGemini = !answer;

    // 2. Dự phòng thông minh nếu Gemini tạm thời chưa phản hồi
    if (!answer) {
      answer = `Xin chào ${userName || 'bạn'}! Tôi là **OMNI-Bot** (Trợ lý AI tích hợp Google Gemini). \n\n` +
        `Hiện tại kết nối mạng đến máy chủ AI của Google đang bị gián đoạn hoặc phản hồi chậm. Bạn vui lòng thử đặt lại câu hỏi sau vài giây, hoặc chọn nhanh các chủ đề bên dưới để tôi hỗ trợ nhé!`;
    }

    return c.json({
      success: true,
      debug: debugInfo,
      data: {
        reply: answer,
        needClientGemini,
        geminiApiKey,
        geminiModel,
        systemPrompt,
        message,
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

// ==========================================
// 10. DAILY REMINDERS REFRESH SYSTEM (06:00 AM)
// ==========================================
async function refreshDailyReminders(db) {
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

    // 1. Quét và cập nhật trạng thái hạn mức công việc chưa hoàn thành
    // Nhiệm vụ quá hạn
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'OVERDUE' 
      WHERE due_date < ? AND status != 'COMPLETED'
    `).bind(today).run();

    // Nhiệm vụ đến hạn hôm nay
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'TODAY' 
      WHERE due_date = ? AND status != 'COMPLETED'
    `).bind(today).run();

    // Nhiệm vụ sắp tới hạn (trong vòng 3 ngày tới)
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'UPCOMING' 
      WHERE due_date > ? AND due_date <= ? AND status != 'COMPLETED'
    `).bind(today, in3Days).run();

    // Nhiệm vụ bình thường
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'NORMAL' 
      WHERE due_date > ? AND status != 'COMPLETED'
    `).bind(in3Days).run();

    // 2. Quét hợp đồng quá hạn
    await db.prepare(`
      UPDATE contracts 
      SET status = 'EXPIRED' 
      WHERE end_date < ? AND status = 'ACTIVE'
    `).bind(today).run();

    // 3. Ghi nhật ký làm mới lúc 6:00 AM vào system_settings
    const nowVN = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date());

    await db.prepare(`
      INSERT INTO system_settings (key, value, category, description, updated_at)
      VALUES ('last_daily_refresh', ?, 'SYSTEM', 'Thời điểm làm mới hệ thống nhắc hạn tự động (06:00 AM)', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).bind(nowVN, new Date().toISOString()).run();

    console.log(`[06:00 AM Cron Trigger] Đã làm mới nhắc hạn hệ thống thành công lúc ${nowVN}`);
    return { success: true, refreshed_at: nowVN, today };
  } catch (err) {
    console.error('[06:00 AM Cron Error]', err);
    return { success: false, error: err.message };
  }
}

// Endpoint kiểm tra trạng thái tiến trình làm mới 6h sáng
app.get('/api/reminders/status', async (c) => {
  try {
    const s = await c.env.DB.prepare("SELECT value, updated_at FROM system_settings WHERE key = 'last_daily_refresh'").first();
    return c.json({
      success: true,
      data: {
        cronSchedule: '06:00 AM hàng ngày (UTC+7)',
        cronExpression: '0 23 * * * (UTC)',
        lastRefreshedAt: s?.value || '06:00:00 hôm nay',
        lastUpdatedAt: s?.updated_at || null,
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Endpoint làm mới ngay lập tức
app.post('/api/reminders/refresh', async (c) => {
  try {
    const result = await refreshDailyReminders(c.env.DB);
    return c.json(result);
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshDailyReminders(env.DB));
  }
};
