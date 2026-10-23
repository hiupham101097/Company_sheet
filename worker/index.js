import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/api/*', cors({ origin: '*' }));

// ========================================================
// SECURITY SHIELD: RATE LIMITING & ANTI-BOT SCANNER & HEADERS
// ========================================================
const ipRateLimit = new Map();
const BLOCKED_BOT_AGENTS = [
  'sqlmap', 'nikto', 'w3af', 'acunetix', 'masscan', 'nmap', 'zgrab',
  'python-requests', 'aiohttp', 'scrapy', 'urllib', 'curl', 'wget', 'go-http-client'
];

app.use('/api/*', async (c, next) => {
  // 1. Chặn công cụ quét lỗ hổng và bot cào dữ liệu tự động
  const userAgent = (c.req.header('user-agent') || '').toLowerCase();
  const isMaliciousBot = BLOCKED_BOT_AGENTS.some((bot) => userAgent.includes(bot));
  if (isMaliciousBot) {
    return c.json({
      success: false,
      code: 'BOT_ACCESS_DENIED',
      message: 'Truy cập bị từ chối: Phát hiện yêu cầu tự động không hợp lệ.'
    }, 403);
  }

  // 2. Rate Limiting per IP (Tối đa 80 request/phút/IP để chống cào hoặc spam)
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
  if (clientIp !== '127.0.0.1' && clientIp !== 'localhost') {
    const now = Date.now();
    const record = ipRateLimit.get(clientIp) || { count: 0, resetAt: now + 60000 };
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + 60000;
    } else {
      record.count += 1;
    }
    ipRateLimit.set(clientIp, record);

    // Dọn dẹp cache IP cũ để tránh chiếm bộ nhớ
    if (ipRateLimit.size > 2000) {
      for (const [key, val] of ipRateLimit.entries()) {
        if (now > val.resetAt) ipRateLimit.delete(key);
      }
    }

    if (record.count > 80) {
      return c.json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Tần suất thao tác quá nhanh. Vui lòng thử lại sau 1 phút để bảo vệ hệ thống!'
      }, 429);
    }
  }

  // 3. Thực thi route và gắn Security Headers chuẩn OWASP cho tầng mạng
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
});

// ========================================================
// SEO & SOCIAL SHARE (ZALO, FACEBOOK, TWITTER, TELEGRAM)
// ========================================================
const SEO_SLUG_MAP = {
  '/': {
    title: 'OMNI ASSETS - Hệ Thống Quản Lý Tài Sản & Vận Hành Doanh Nghiệp',
    description: 'Nền tảng số hóa quản trị tài sản, trang thiết bị, tài chính doanh thu, hợp đồng biên bản, chấm công nhân sự và tự động nhắc hạn thông minh cho doanh nghiệp.'
  },
  '/tong-quan': {
    title: 'Tổng Quan Vận Hành & Chỉ Số Doanh Nghiệp | OMNI ASSETS',
    description: 'Báo cáo chỉ số điều hành, biểu đồ tài chính, kiểm soát tài sản và dòng tiền doanh nghiệp thời gian thực.'
  },
  '/tai-san': {
    title: 'Quản Lý Tài Sản & Trang Thiết Bị Doanh Nghiệp | OMNI ASSETS',
    description: 'Theo dõi, phân bổ, khấu hao, kiểm kê tình trạng và bàn giao tài sản thiết bị doanh nghiệp tập trung.'
  },
  '/tai-chinh': {
    title: 'Báo Cáo Doanh Thu & Dòng Tiền Doanh Nghiệp | OMNI ASSETS',
    description: 'Quản lý thu chi, hóa đơn, dòng tiền và phân tích lợi nhuận doanh nghiệp minh bạch và trực quan.'
  },
  '/cong-viec': {
    title: 'Quản Lý Công Việc & Nhắc Hạn Tự Động 6:00 AM | OMNI ASSETS',
    description: 'Giao việc phòng ban, kiểm soát tiến độ, hạn chót và cơ chế tự động gửi cảnh báo nhắc nhở mỗi sáng.'
  },
  '/hop-dong': {
    title: 'Quản Lý Hợp Đồng & Biên Bản Bàn Giao Thông Minh | OMNI ASSETS',
    description: 'Lưu trữ, theo dõi phụ lục hợp đồng, điều khoản thanh toán, biên bản nghiệm thu và AI tự động soạn thảo.'
  },
  '/cham-cong': {
    title: 'Hệ Thống Chấm Công & Quản Lý Ca Làm Việc | OMNI ASSETS',
    description: 'Chấm công trực tuyến 1 lần/ngày, chống gian lận, tính công tự động và báo cáo chuyên cần nhân sự.'
  },
  '/nhan-su': {
    title: 'Quản Lý Nhân Sự & Phân Quyền Phòng Ban | OMNI ASSETS',
    description: 'Hồ sơ nhân viên, gắn kết phòng ban, phân quyền bảo mật nhiều cấp Admin, Manager, Staff.'
  },
  '/danh-muc': {
    title: 'Quản Lý Danh Mục Hệ Thống Động | OMNI ASSETS',
    description: 'Tự do thiết lập phòng ban, nhóm tài sản, danh mục thu chi và cấu hình hệ thống linh hoạt.'
  },
  '/cai-dat': {
    title: 'Cài Đặt Hệ Thống & Đồng Bộ Dữ Liệu Cloudflare | OMNI ASSETS',
    description: 'Cấu hình quy chuẩn chấm công, ca làm việc, thông tin pháp nhân và đồng bộ dữ liệu thời gian thực.'
  },
  '/quan-tri-tong': {
    title: 'Cổng Quản Trị Nền Tảng Tối Cao (Master Admin) | OMNI ASSETS',
    description: 'Cấp quyền bản quyền doanh nghiệp, quản lý các gói cước 1 năm, vĩnh viễn, dùng thử và thống kê doanh thu.'
  }
};

function generateSeoHtml(path, origin) {
  const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/';
  const meta = SEO_SLUG_MAP[cleanPath] || SEO_SLUG_MAP['/'];
  const canonicalUrl = `${origin}${cleanPath === '/' ? '' : cleanPath}`;
  const logoUrl = `${origin}/logo.png`;
  const bannerUrl = `${origin}/og-image.jpg`;

  return `<!doctype html>
<html lang="vi" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title}</title>
  <meta name="title" content="${meta.title}" />
  <meta name="description" content="${meta.description}" />
  <meta name="keywords" content="omni assets, quản lý tài sản, quản lý doanh nghiệp, phần mềm quản lý thiết bị, quản lý hợp đồng, chấm công nhân sự" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph for Facebook, Zalo, Messenger, Telegram, LinkedIn, Skype -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OMNI ASSETS" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:locale" content="vi_VN" />

  <!-- Primary Logo for Social Share -->
  <meta property="og:image" content="${logoUrl}" />
  <meta property="og:image:secure_url" content="${logoUrl}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1024" />
  <meta property="og:image:height" content="1024" />
  <meta property="og:image:alt" content="Logo OMNI ASSETS" />

  <!-- High-Res 16:9 Banner -->
  <meta property="og:image" content="${bannerUrl}" />
  <meta property="og:image:secure_url" content="${bannerUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="675" />

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${meta.title}" />
  <meta name="twitter:description" content="${meta.description}" />
  <meta name="twitter:image" content="${bannerUrl}" />
</head>
<body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
  <img src="${logoUrl}" alt="OMNI ASSETS Logo" style="width: 120px; height: 120px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-bottom: 24px;" />
  <h1 style="font-size: 24px; margin-bottom: 12px;">${meta.title}</h1>
  <p style="font-size: 15px; color: #94a3b8; max-width: 600px; margin: 0 auto 24px;">${meta.description}</p>
  <a href="${canonicalUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Truy Cập Nền Tảng OMNI ASSETS</a>
</body>
</html>`;
}

// Phục vụ SPA routes (như /tong-quan, /tai-san, v.v.) và SEO Crawler
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const path = url.pathname.toLowerCase();

  // 1. Bỏ qua các API endpoint
  if (path.startsWith('/api')) {
    return next();
  }

  // 2. Bỏ qua các file tĩnh có định dạng đuôi file
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|json|xml|txt)$/)) {
    return next();
  }

  // 3. Nếu là Social Crawler (Zalo, Facebook, Twitter, Telegram...) -> Trả về HTML chứa OpenGraph tags & Logo
  const userAgent = (c.req.header('user-agent') || '').toLowerCase();
  const isSocialCrawler = /facebookexternalhit|zalo|twitterbot|linkedinbot|telegrambot|skypeuripreview|whatsapp|slackbot|discordbot|googlebot|bingbot|applebot/i.test(userAgent);

  if (isSocialCrawler) {
    return c.html(generateSeoHtml(path, url.origin));
  }

  // 4. Nếu là người dùng thực truy cập vào SPA route (kể cả F5 /tong-quan, /tai-san, /cai-dat...)
  // Luôn nạp index.html để React Router xử lý giao diện máy khách, triệt tiêu 404
  if (c.env?.ASSETS) {
    try {
      const indexReq = new Request(new URL('/index.html', c.req.url));
      const indexRes = await c.env.ASSETS.fetch(indexReq);
      if (indexRes && indexRes.status === 200) {
        return indexRes;
      }
    } catch (_) {}
  }

  return next();
});

// ==========================================
// TENANT CONTEXT HELPER (MULTI-TENANCY)
// ==========================================
async function getTenantContext(c) {
  let companyId = c.req.header('x-company-id');
  const userId = c.req.header('x-user-id');
  const userRole = c.req.header('x-user-role');

  if (userRole === 'SUPER_ADMIN') {
    return {
      companyId: (companyId && companyId !== 'SYSTEM' && companyId !== 'ALL') ? companyId : 'ALL',
      isSuperAdmin: true,
      userId
    };
  }

  if (!companyId || companyId === 'undefined' || companyId === 'null') {
    if (userId) {
      const u = await c.env.DB.prepare('SELECT company_id, role FROM users WHERE id = ?').bind(userId).first().catch(() => null);
      if (u?.role === 'SUPER_ADMIN') {
        return { companyId: 'ALL', isSuperAdmin: true, userId };
      }
      companyId = u?.company_id;
    }
  }

  // Fallback to comp_1 (demo company) if undefined
  if (!companyId || companyId === 'undefined' || companyId === 'null') {
    companyId = 'comp_1';
  }

  return {
    companyId,
    isSuperAdmin: false,
    userId
  };
}

// ==========================================
// ==========================================
// 7 DEDICATED SENDER MAILBOXES & ROUTING SPECIFICATION
// ==========================================
const SENDER_MAILBOXES = {
  notifications: {
    key: 'notifications',
    email: 'notifications@omniassets.ryug.id.vn',
    label: 'Thông báo chung từ hệ thống',
    owner: 'SUPER_ADMIN',
    replyTo: 'hieupham101097@gmail.com',
    defaultSenderName: 'OMNI ASSETS (Hệ Thống)'
  },
  support: {
    key: 'support',
    email: 'support@omniassets.ryug.id.vn',
    label: 'Thư hỗ trợ khách hàng',
    owner: 'SUPER_ADMIN',
    replyTo: 'hieupham101097@gmail.com',
    defaultSenderName: 'OMNI ASSETS Support'
  },
  attendance: {
    key: 'attendance',
    email: 'attendance@omniassets.ryug.id.vn',
    label: 'Chấm công, đi trễ, thiếu công',
    owner: 'TENANT',
    subLabel: 'Chấm Công'
  },
  tasks: {
    key: 'tasks',
    email: 'tasks@omniassets.ryug.id.vn',
    label: 'Giao việc, nhắc hạn, quá hạn',
    owner: 'TENANT',
    subLabel: 'Quản Lý Công Việc'
  },
  assets: {
    key: 'assets',
    email: 'assets@omniassets.ryug.id.vn',
    label: 'Kê khai, kiểm kê và bàn giao tài sản',
    owner: 'TENANT',
    subLabel: 'Quản Lý Tài Sản'
  },
  contracts: {
    key: 'contracts',
    email: 'contracts@omniassets.ryug.id.vn',
    label: 'Hợp đồng sắp hết hạn',
    owner: 'TENANT',
    subLabel: 'Quản Lý Hợp Đồng'
  },
  reports: {
    key: 'reports',
    email: 'reports@omniassets.ryug.id.vn',
    label: 'Báo cáo định kỳ',
    owner: 'TENANT',
    subLabel: 'Báo Cáo Định Kỳ'
  }
};

async function getEmailConfig(db, companyId) {
  let mailProvider = 'resend';
  let mailApiKey = (typeof env !== 'undefined' && env?.RESEND_API_KEY) || '';
  let mailSenderName = 'OMNIASSETS';
  let mailSenderEmail = 'support@omniassets.ryug.id.vn';
  let mailReplyTo = 'hieupham101097@gmail.com';
  let mailSupportInbox = 'hieupham101097@gmail.com';
  let mailReportRecipients = '';
  let mailNotifyNewUser = 'true';
  let mailNotifyReminders = 'true';
  let mailNotifyTimesheet = 'true';
  let compName = 'OMNI ASSETS & LOGISTICS';
  let compEmail = '';

  try {
    const sysSettings = await db.prepare("SELECT key, value FROM system_settings WHERE key LIKE 'mail_%'").all().catch(() => ({ results: [] }));
    (sysSettings.results || []).forEach(r => {
      if (r.key === 'mail_provider' && r.value) mailProvider = r.value;
      if (r.key === 'mail_api_key' && r.value) mailApiKey = r.value;
      if (r.key === 'mail_sender_name' && r.value) mailSenderName = r.value;
      if (r.key === 'mail_sender_email' && r.value) mailSenderEmail = r.value;
      if (r.key === 'mail_reply_to' && r.value) mailReplyTo = r.value;
      if (r.key === 'mail_support_inbox' && r.value) mailSupportInbox = r.value;
      if (r.key === 'mail_report_recipients' && r.value) mailReportRecipients = r.value;
      if (r.key === 'mail_notify_new_user' && r.value) mailNotifyNewUser = r.value;
      if (r.key === 'mail_notify_reminders' && r.value) mailNotifyReminders = r.value;
      if (r.key === 'mail_notify_timesheet' && r.value) mailNotifyTimesheet = r.value;
    });

    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      const compTenant = await db.prepare('SELECT company_name, admin_email FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
      if (compTenant) {
        if (compTenant.company_name) compName = compTenant.company_name;
        if (compTenant.admin_email) compEmail = compTenant.admin_email;
      }

      const compSettings = await db.prepare("SELECT key, value FROM company_settings WHERE company_id = ? AND (key LIKE 'mail_%' OR key = 'company_email' OR key = 'company_name')").bind(companyId).all().catch(() => ({ results: [] }));
      (compSettings.results || []).forEach(r => {
        if (r.key === 'company_name' && r.value) compName = r.value;
        if (r.key === 'company_email' && r.value) compEmail = r.value;
        if (r.key === 'mail_provider' && r.value) mailProvider = r.value;
        if (r.key === 'mail_api_key' && r.value) mailApiKey = r.value;
        if (r.key === 'mail_sender_name' && r.value) mailSenderName = r.value;
        if (r.key === 'mail_sender_email' && r.value) mailSenderEmail = r.value;
        if (r.key === 'mail_reply_to' && r.value) {
          mailReplyTo = r.value;
          compEmail = r.value;
        }
        if (r.key === 'mail_report_recipients' && r.value) mailReportRecipients = r.value;
        if (r.key === 'mail_notify_new_user' && r.value) mailNotifyNewUser = r.value;
        if (r.key === 'mail_notify_reminders' && r.value) mailNotifyReminders = r.value;
        if (r.key === 'mail_notify_timesheet' && r.value) mailNotifyTimesheet = r.value;
      });
    }
  } catch (err) {
    console.error('Error getEmailConfig:', err);
  }

  return {
    provider: (mailProvider || 'resend').toLowerCase().trim(),
    apiKey: mailApiKey.trim(),
    senderName: mailSenderName ? mailSenderName.trim() : 'OMNIASSETS',
    senderEmail: mailSenderEmail ? mailSenderEmail.trim() : 'support@omniassets.ryug.id.vn',
    replyTo: mailReplyTo ? mailReplyTo.trim() : 'hieupham101097@gmail.com',
    supportInbox: mailSupportInbox ? mailSupportInbox.trim() : 'hieupham101097@gmail.com',
    reportRecipients: mailReportRecipients ? mailReportRecipients.trim() : '',
    notifyNewUser: mailNotifyNewUser !== 'false',
    notifyReminders: mailNotifyReminders !== 'false',
    notifyTimesheet: mailNotifyTimesheet !== 'false',
    companyName: compName,
    companyEmail: compEmail || mailReplyTo
  };
}

async function sendEmail({ db, companyId, to, subject, html, text, replyTo, senderType = 'notifications', senderName }) {
  const config = await getEmailConfig(db, companyId);
  const toList = (Array.isArray(to) ? to : [to]).map(e => (typeof e === 'string' ? e.trim() : '')).filter(Boolean);

  if (toList.length === 0) {
    throw new Error('Chưa cung cấp địa chỉ email người nhận hợp lệ');
  }

  if (!config.apiKey) {
    throw new Error('Chưa cấu hình API Key dịch vụ gửi mail');
  }

  // Lookup designated mailbox from the 7 standard templates
  const mailbox = SENDER_MAILBOXES[senderType] || SENDER_MAILBOXES.notifications;
  const isPlatform = mailbox.owner === 'SUPER_ADMIN' || !companyId || companyId === 'SYSTEM';

  // Determine From Address & Sender Name
  let finalSenderEmail = mailbox.email || 'support@omniassets.ryug.id.vn';
  let finalSenderName = senderName || '';

  if (!finalSenderName) {
    if (mailbox.owner === 'SUPER_ADMIN') {
      finalSenderName = mailbox.defaultSenderName || config.senderName || 'OMNI ASSETS';
    } else {
      // Enterprise mailbox: "[Company Name] (Sublabel)"
      const prefix = config.companyName || 'OMNI ASSETS';
      finalSenderName = `${prefix} (${mailbox.subLabel || 'Hệ Thống'})`;
    }
  }

  // Dual Routing Rule:
  // - notifications@ & support@ (SuperAdmin/Platform): Reply-To routes to hieupham101097@gmail.com
  // - attendance@, tasks@, assets@, contracts@, reports@ (Enterprise): Reply-To routes to enterprise companyEmail
  let effectiveReplyTo = replyTo;
  if (!effectiveReplyTo) {
    if (isPlatform || mailbox.key === 'notifications' || mailbox.key === 'support') {
      effectiveReplyTo = 'hieupham101097@gmail.com';
    } else {
      // Enterprise mailbox: strictly use enterprise's email, never SuperAdmin
      effectiveReplyTo = config.companyEmail || config.replyTo;
      if (!effectiveReplyTo || effectiveReplyTo === 'hieupham101097@gmail.com') {
        effectiveReplyTo = `contact@${mailbox.email.split('@')[1]}`;
      }
    }
  }

  if (config.provider === 'brevo') {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: finalSenderName,
          email: finalSenderEmail
        },
        replyTo: { email: effectiveReplyTo },
        to: toList.map(e => ({ email: e })),
        subject: subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      })
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resData.message || resData.error || `Lỗi Brevo API (${res.status})`);
    }
    return { success: true, provider: 'brevo', messageId: resData.messageId, mailbox: mailbox.key, from: finalSenderEmail, replyTo: effectiveReplyTo };
  } else {
    // Resend REST API
    const fromAddress = `${finalSenderName} <${finalSenderEmail}>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toList,
        reply_to: effectiveReplyTo,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      })
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = resData.message || resData.error?.message || `Lỗi Resend API (${res.status})`;
      throw new Error(errMsg);
    }
    return { success: true, provider: 'resend', id: resData.id, mailbox: mailbox.key, from: finalSenderEmail, replyTo: effectiveReplyTo };
  }
}

function wrapEmailHtml({ title, preheader = '', contentHtml, ctaText = null, ctaUrl = null, footerNote = '' }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%);
      padding: 36px 28px 30px 28px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      color: #ffffff;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 1px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header h1 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    .header p {
      margin: 0;
      font-size: 13px;
      color: #a7f3d0;
      font-weight: 500;
      letter-spacing: 0.2px;
    }
    .content {
      padding: 32px 28px;
      line-height: 1.7;
      font-size: 14px;
      color: #334155;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .badge {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-blue { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      padding: 12px 28px;
      border-radius: 12px;
      margin-top: 18px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
    }
    .footer {
      background: #f8fafc;
      padding: 24px 28px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .footer p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">OA</div>
        <h1>OMNI ASSETS</h1>
        <p>${title}</p>
      </div>
      <div class="content">
        ${contentHtml}
        ${ctaText && ctaUrl ? `<div style="text-align: center; margin-top: 24px;"><a href="${ctaUrl}" class="btn">${ctaText} &rarr;</a></div>` : ''}
      </div>
      <div class="footer">
        <p style="font-weight: 700; color: #334155;">Hệ Thống Quản Trị Vận Hành Doanh Nghiệp OMNI ASSETS</p>
        <p>Hòm thư thông báo phát tự động từ hệ thống đám mây. Vui lòng không trả lời trực tiếp email này.</p>
        ${footerNote ? `<p style="color: #94a3b8; margin-top: 8px;">${footerNote}</p>` : ''}
        <p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">
          Bảo mật DKIM/SPF &bull; Hỗ trợ: <a href="mailto:support@omniassets.ryug.id.vn" style="color: #059669; text-decoration: none; font-weight: 600;">support@omniassets.ryug.id.vn</a>
        </p>
        <p style="color: #cbd5e1; font-size: 11px; margin-top: 4px;">&copy; ${new Date().getFullYear()} OMNI ASSETS. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getTestEmailHtml({ companyName, provider, recipientEmail }) {
  const content = `
    <div style="text-align: center; margin-bottom: 18px;">
      <span class="badge badge-success">✓ KẾT NỐI EMAIL THÀNH CÔNG</span>
    </div>
    <p>Xin chào Quản trị viên,</p>
    <p>Đây là email kiểm tra xác nhận cổng gửi mail của doanh nghiệp <strong>${companyName || 'OMNI ASSETS'}</strong> đã được cấu hình và vận hành thành công!</p>
    <div class="card">
      <table style="margin: 0;">
        <tr><td style="width: 40%; font-weight: bold; border:none;">Dịch vụ Email:</td><td style="border:none; text-transform: uppercase; font-weight: bold; color: #059669;">${provider}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Email nhận test:</td><td style="border:none; font-family: monospace;">${recipientEmail}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Thời điểm gửi:</td><td style="border:none;">${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Trạng thái:</td><td style="border:none; color: #16a34a; font-weight: bold;">Hoạt động hoàn hảo</td></tr>
      </table>
    </div>
    <p style="font-size: 13px; color: #64748b;">
      💡 <em>Lưu ý: Nếu sử dụng địa chỉ gửi mặc định <code>onboarding@resend.dev</code>, Resend chỉ cho phép gửi đến email đã tạo tài khoản Resend. Khi bạn thêm và xác thực domain riêng trong Resend (Domains &rarr; Add Domain), hệ thống có thể gửi đến mọi email nhân sự không hạn chế!</em>
    </p>
  `;
  return wrapEmailHtml({
    title: 'Kiểm Tra Cấu Hình Gửi Mail',
    preheader: 'Cấu hình gửi email tự động của bạn đã sẵn sàng hoạt động',
    contentHtml: content,
    ctaText: 'Mở Trang Quản Trị Hệ Thống',
    ctaUrl: 'https://company-sheet.hieupham101097.workers.dev'
  });
}

function getWelcomeUserEmailHtml({ companyName, userName, userEmail, password, role, department, loginUrl }) {
  const roleNameMap = {
    'ADMIN': 'Quản Trị Viên (Admin)',
    'MANAGER': 'Quản Lý (Manager)',
    'STAFF': 'Nhân Viên (Staff)',
    'SUPER_ADMIN': 'Quản Trị Tối Cao'
  };
  const roleDisplay = roleNameMap[role] || role;

  const content = `
    <p>Xin chào <strong>${userName}</strong>,</p>
    <p>Chào mừng bạn gia nhập <strong>${companyName || 'OMNI ASSETS & LOGISTICS'}</strong>! Tài khoản truy cập hệ thống quản trị của bạn đã được khởi tạo thành công:</p>
    
    <div class="card" style="border-left: 4px solid #059669;">
      <table style="margin: 0;">
        <tr><td style="width: 35%; font-weight: bold; border:none;">Họ và tên:</td><td style="border:none; font-weight: 600;">${userName}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Tên đăng nhập (Email):</td><td style="border:none; font-family: monospace; font-weight: bold; color: #059669;">${userEmail}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Mật khẩu khởi tạo:</td><td style="border:none; font-family: monospace; font-weight: bold; color: #dc2626; background: #fef2f2; padding: 4px 8px; border-radius: 6px; display: inline-block;">${password || '123456'}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Phòng ban:</td><td style="border:none;">${department || 'Chưa gán'}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Vai trò:</td><td style="border:none;"><span class="badge badge-blue">${roleDisplay}</span></td></tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #475569;">
      🔒 <strong>Bảo mật tài khoản:</strong> Sau khi đăng nhập lần đầu, bạn có thể đổi lại mật khẩu cá nhân tại mục Hồ Sơ (góc phải giao diện).
    </p>
  `;
  return wrapEmailHtml({
    title: 'Thông Tin Tài Khoản Nhân Sự Mới',
    preheader: `Tài khoản đăng nhập hệ thống của ${userName}`,
    contentHtml: content,
    ctaText: 'Đăng Nhập Ngay Vào Hệ Thống',
    ctaUrl: loginUrl || 'https://company-sheet.hieupham101097.workers.dev'
  });
}

function getDailyRemindersEmailHtml({ companyName, date, overdueTasks = [], upcomingContracts = [], expiredContracts = [], dashboardUrl }) {
  let sections = '';

  if (overdueTasks.length > 0) {
    sections += `
      <div style="margin-top: 18px;">
        <h3 style="color: #b91c1c; font-size: 14px; margin-bottom: 8px;">⚠️ Công Việc Quá Hạn Cần Xử Lý (${overdueTasks.length})</h3>
        <table>
          <thead><tr><th>Tên Công Việc</th><th>Người Phụ Trách</th><th>Hạn Chót</th></tr></thead>
          <tbody>
            ${overdueTasks.slice(0, 8).map(t => `
              <tr>
                <td style="font-weight: 600;">${t.title}</td>
                <td>${t.assignee || 'Chưa phân công'}</td>
                <td style="color: #b91c1c; font-weight: bold;">${t.due_date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (upcomingContracts.length > 0 || expiredContracts.length > 0) {
    sections += `
      <div style="margin-top: 18px;">
        <h3 style="color: #b45309; font-size: 14px; margin-bottom: 8px;">📑 Cảnh Báo Hạn Hợp Đồng &amp; Biên Bản</h3>
        <table>
          <thead><tr><th>Số HĐ / Đối Tác</th><th>Ngày Hết Hạn</th><th>Trạng Thái</th></tr></thead>
          <tbody>
            ${expiredContracts.slice(0, 5).map(c => `
              <tr>
                <td style="font-weight: 600;">${c.contract_number} ${c.partner_name ? `- ${c.partner_name}` : ''}</td>
                <td style="color: #dc2626; font-weight: bold;">${c.end_date}</td>
                <td><span class="badge" style="background:#fee2e2;color:#991b1b;">Đã hết hạn</span></td>
              </tr>
            `).join('')}
            ${upcomingContracts.slice(0, 5).map(c => `
              <tr>
                <td style="font-weight: 600;">${c.contract_number} ${c.partner_name ? `- ${c.partner_name}` : ''}</td>
                <td style="color: #d97706; font-weight: bold;">${c.end_date}</td>
                <td><span class="badge badge-amber">Sắp hết hạn</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (!sections) {
    sections = `
      <div class="card" style="text-align: center; padding: 22px;">
        <p style="color: #15803d; font-weight: bold; margin: 0; font-size: 15px;">🎉 Tuyệt vời! Hiện tại không có công việc hoặc hợp đồng nào bị quá hạn.</p>
        <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">Mọi hoạt động vận hành của doanh nghiệp đang diễn ra đúng kế hoạch.</p>
      </div>
    `;
  }

  const content = `
    <p>Xin chào Ban Quản Trị <strong>${companyName || 'OMNI ASSETS'}</strong>,</p>
    <p>Hệ thống tự động tổng hợp tình trạng hạn mức vận hành ngày <strong>${date}</strong>:</p>
    ${sections}
  `;

  return wrapEmailHtml({
    title: `Báo Cáo Nhắc Hạn Vận Hành (${date})`,
    preheader: `Báo cáo nhắc hạn công việc và hợp đồng ngày ${date}`,
    contentHtml: content,
    ctaText: 'Mở Bàn Điều Khiển Quản Trị',
    ctaUrl: dashboardUrl || 'https://company-sheet.hieupham101097.workers.dev'
  });
}

function getTimesheetEmailHtml({ companyName, userName, month, totalDaysWorked, totalHours, standardWorkDays, onTimeDays, lateDays, lateMinutes = 0, punctualityRate = 100, notes = '' }) {
  const content = `
    <p>Xin chào <strong>${userName}</strong>,</p>
    <p>Phòng Nhân Sự &amp; Kế Toán <strong>${companyName || 'OMNI ASSETS & LOGISTICS'}</strong> gửi đến bạn phiếu tổng hợp chấm công tháng <strong>${month}</strong>:</p>

    <div class="card" style="border: 2px solid #e0e7ff; background: #fafafa;">
      <h3 style="margin-top: 0; margin-bottom: 12px; color: #4338ca; font-size: 14px;">📊 TỔNG HỢP CÔNG THÁNG ${month}</h3>
      <table style="margin: 0;">
        <tr>
          <td style="width: 45%; font-weight: bold; border-top:none;">Tổng số ngày đi làm:</td>
          <td style="font-weight: bold; color: #059669; font-size: 15px; border-top:none;">${totalDaysWorked} ngày</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Tổng số giờ làm việc:</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e293b;">${totalHours} giờ</td>
        </tr>
        <tr style="background: #f0fdf4;">
          <td style="font-weight: bold; color: #166534;">Công chuẩn kế toán quy đổi (h/8):</td>
          <td style="font-weight: 800; font-size: 16px; color: #15803d; font-family: monospace;">${standardWorkDays} công</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Số buổi đúng giờ:</td>
          <td style="color: #059669; font-weight: bold;">${onTimeDays} buổi</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Số lần đi muộn:</td>
          <td style="color: ${lateDays > 0 ? '#dc2626' : '#64748b'}; font-weight: bold;">
            ${lateDays > 0 ? `${lateDays} lần (${lateMinutes} phút)` : '0 lần (Đúng giờ tuyệt đối)'}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Tỷ lệ chuyên cần:</td>
          <td style="font-weight: bold; color: ${punctualityRate >= 90 ? '#16a34a' : '#d97706'};">${punctualityRate}%</td>
        </tr>
      </table>
    </div>

    ${notes ? `
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; border-radius: 8px; font-size: 13px; color: #1e40af; margin-top: 14px;">
        <strong>Ghi chú:</strong> ${notes}
      </div>
    ` : ''}

    <p style="font-size: 12px; color: #64748b; margin-top: 18px;">
      ℹ️ <em>Nếu cần đối soát lại ngày công, bạn vui lòng phản hồi lại Phòng Kế toán / Nhân sự trong vòng 48 giờ.</em>
    </p>
  `;

  return wrapEmailHtml({
    title: `Phiếu Báo Cáo Chấm Công Tháng ${month}`,
    preheader: `Bảng tổng kết công tháng ${month} của ${userName}: ${standardWorkDays} ngày công`,
    contentHtml: content,
    ctaText: 'Xem Lịch Sử Điểm Danh',
    ctaUrl: 'https://company-sheet.hieupham101097.workers.dev'
  });
}

function getOtpEmailHtml({ companyName, otp, expiresInMinutes = 5 }) {
  const digits = String(otp || '').trim().split('');
  const digitsHtml = digits.map(d => `
    <td style="width: 46px; height: 56px; background: #ffffff; border: 2px solid #10b981; border-radius: 12px; text-align: center; vertical-align: middle; font-size: 30px; font-weight: 800; color: #065f46; font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);">
      ${d}
    </td>
  `).join('<td style="width: 8px;"></td>');

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-amber" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 6px 18px; font-size: 11px; font-weight: 700; border-radius: 9999px; letter-spacing: 0.8px;">
        MÃ XÁC THỰC BẢO MẬT (OTP)
      </span>
    </div>

    <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
      Kính gửi Quý Quản trị viên,
    </p>
    <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0 0 12px 0;">
      Hệ thống đã tiếp nhận yêu cầu đăng ký không gian làm việc số cho doanh nghiệp <strong>${companyName}</strong> trên nền tảng <strong>OMNI ASSETS</strong>.
    </p>
    <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0 0 24px 0;">
      Để hoàn tất thủ tục đăng ký và kích hoạt hệ thống, vui lòng nhập mã xác thực OTP 6 chữ số dưới đây vào màn hình kích hoạt:
    </p>

    <!-- OTP Digit Cards -->
    <div style="text-align: center; margin: 28px 0;">
      <table align="center" style="margin: 0 auto; border-collapse: separate; border-spacing: 0;">
        <tr>
          ${digitsHtml}
        </tr>
      </table>

      <div style="display: inline-block; margin-top: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 5px 16px;">
        <span style="color: #065f46; font-size: 12px; font-weight: 600;">
          ⏱️ Mã này có hiệu lực trong vòng <strong>${expiresInMinutes} phút</strong>
        </span>
      </div>
    </div>

    <!-- Security Warning Card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 12px; padding: 14px 18px; margin-top: 26px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
        🛡️ Khuyến Cáo An Toàn &amp; Bảo Mật:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #64748b; line-height: 1.6;">
        <li>Tuyệt đối <strong>không chia sẻ</strong> mã OTP này cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ hệ thống.</li>
        <li>Ban Quản trị OMNI ASSETS <strong>không bao giờ</strong> chủ động gọi điện yêu cầu cung cấp mã OTP.</li>
        <li>Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua thư hoặc liên hệ bộ phận an toàn thông tin tại <a href="mailto:support@omniassets.ryug.id.vn" style="color: #059669; font-weight: 600; text-decoration: none;">support@omniassets.ryug.id.vn</a>.</li>
      </ul>
    </div>
  `;

  return wrapEmailHtml({
    title: 'Mã Xác Thực Đăng Ký Tài Khoản Doanh Nghiệp',
    preheader: `Mã OTP xác nhận đăng ký tài khoản ${companyName}: ${otp}`,
    contentHtml: content
  });
}

function getBroadcastEmailHtml({ companyName, subject, content, urgency = 'NORMAL', dashboardUrl }) {
  const urgencyBadges = {
    'URGENT': '<span class="badge" style="background:#fee2e2;color:#991b1b;">🚨 THÔNG BÁO KHẨN CẤP / QUAN TRỌNG</span>',
    'ANNOUNCEMENT': '<span class="badge badge-blue">📢 THÔNG BÁO CHUNG DOANH NGHIỆP</span>',
    'NORMAL': '<span class="badge badge-success">✉️ THÔNG ĐIỆP NỘI BỘ</span>'
  };
  const badgeHtml = urgencyBadges[urgency] || urgencyBadges['NORMAL'];

  const formattedContent = content
    .split('\n')
    .filter(p => p.trim() !== '')
    .map(p => `<p style="margin: 8px 0; color: #334155; line-height: 1.65; font-size: 14px;">${p}</p>`)
    .join('');

  const bodyHtml = `
    <div style="margin-bottom: 15px;">
      ${badgeHtml}
    </div>
    <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.3px;">
      ${subject}
    </h2>
    <div class="card" style="border-left: 4px solid #059669; padding: 20px 22px; background: #fafafa;">
      ${formattedContent}
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
      Thông báo này được gửi từ Ban Điều Hành / Quản Trị của <strong>${companyName}</strong> qua hệ thống OMNI ASSETS.
    </p>
  `;

  return wrapEmailHtml({
    title: `Thông Báo Từ ${companyName}`,
    preheader: subject,
    contentHtml: bodyHtml,
    ctaText: 'Đăng Nhập Xem Chi Tiết',
    ctaUrl: dashboardUrl || 'https://company-sheet.hieupham101097.workers.dev'
  });
}

function getManagementNotificationEmailHtml({ companyName, subject, message, senderName, timestamp, managerNames = [], dashboardUrl }) {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge" style="background:#e0e7ff; color:#3730a3; border: 1px solid #c7d2fe; padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 9999px; text-transform: uppercase;">
        🛡️ THÔNG BÁO CẤP QUẢN TRỊ &amp; ĐIỀU HÀNH (ADMIN &amp; MANAGER)
      </span>
    </div>

    <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.3px;">
      ${subject || 'Cập Nhật Vận Hành & Phân Quyền Doanh Nghiệp'}
    </h2>

    <div class="card" style="border-left: 4px solid #4f46e5; background: #f8fafc; padding: 18px 20px;">
      <p style="margin: 0 0 12px 0; color: #1e293b; font-size: 14px; line-height: 1.6; font-weight: 600;">
        Kính gửi Quý Cán Bộ Quản Trị &amp; Quản Lý Doanh Nghiệp <strong>${companyName}</strong>,
      </p>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 12px 0;">
        <p style="margin: 0; color: #334155; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">${message || 'Ban Quản Trị thông báo: Cập nhật phân quyền phòng ban và chính sách vận hành mới đã được áp dụng và đồng bộ thời gian thực lên hệ thống cơ sở dữ liệu.'}</p>
      </div>

      <table style="margin-top: 14px; margin-bottom: 0;">
        <tr>
          <td style="width: 35%; font-weight: bold; border:none; color: #64748b; font-size: 12px;">Đơn vị / Doanh nghiệp:</td>
          <td style="border:none; font-weight: bold; color: #0f172a; font-size: 12px;">${companyName}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Người gửi lệnh:</td>
          <td style="border:none; font-weight: bold; color: #4338ca; font-size: 12px;">${senderName || 'Ban Quản Trị Doanh Nghiệp'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Thời điểm phát:</td>
          <td style="border:none; color: #334155; font-size: 12px;">${timestamp || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Hòm thư phát:</td>
          <td style="border:none; font-family: monospace; color: #0284c7; font-weight: bold; font-size: 12px;">tasks@omniassets.ryug.id.vn</td>
        </tr>
        ${managerNames.length > 0 ? `
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Danh sách cán bộ nhận:</td>
          <td style="border:none; color: #475569; font-size: 12px;">${managerNames.join(', ')}</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 18px; line-height: 1.6;">
      💡 <em>Thông báo nội bộ này được phát đến cấp Quản lý và Quản trị viên để nắm bắt kịp thời tình hình điều hành doanh nghiệp.</em>
    </p>
  `;

  return wrapEmailHtml({
    title: `[Điều Hành Nội Bộ] ${subject}`,
    preheader: subject,
    contentHtml: content,
    ctaText: 'Mở Bàn Làm Việc Quản Trị',
    ctaUrl: dashboardUrl || 'https://company-sheet.hieupham101097.workers.dev'
  });
}

// Template email Super Admin phát thông báo gói dịch vụ & nền tảng (notifications@omniassets.ryug.id.vn)
function getSuperAdminPlanAnnouncementEmailHtml({
  subject,
  message,
  plans = [],
  ctaText = 'Xem Bảng Giá & Nâng Cấp Gói',
  ctaUrl = 'https://company-sheet.hieupham101097.workers.dev',
  senderEmail = 'notifications@omniassets.ryug.id.vn',
  recipientName = 'Quý Doanh Nghiệp'
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); color: #6d28d9; border: 1px solid #ddd6fe; padding: 7px 18px; font-size: 12px; font-weight: 800; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
        🚀 THÔNG BÁO TỪ BAN ĐIỀU HÀNH NỀN TẢNG OMNIASSETS
      </span>
    </div>

    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
      ${subject || 'Thông Báo Gói Dịch Vụ & Bản Quyền Hệ Thống OmniAssets'}
    </h2>

    <div class="card" style="border-left: 4px solid #7c3aed; background: #ffffff; padding: 22px 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <p style="margin: 0 0 14px 0; color: #1e293b; font-size: 15px; line-height: 1.6; font-weight: 600;">
        Kính gửi Quý Cán Bộ Quản Trị &amp; Điều Hành <strong>${recipientName}</strong>,
      </p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 14px 0; color: #334155; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">${message}</div>

      ${plans && plans.length > 0 ? `
      <div style="margin-top: 20px;">
        <h4 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; margin: 0 0 10px 0; letter-spacing: 0.5px;">
          Bảng Gói Cước Dịch Vụ Doanh Nghiệp (Official Pricing):
        </h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">Gói Dịch Vụ</th>
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">Thời Hạn</th>
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">Giá Cước</th>
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">Đặc Quyền</th>
            </tr>
          </thead>
          <tbody>
            ${plans.map(p => `
              <tr>
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #6d28d9; border: 1px solid #e2e8f0;">
                  ${p.name || p.code}
                </td>
                <td style="padding: 10px 12px; font-size: 12px; color: #475569; border: 1px solid #e2e8f0;">
                  ${p.duration_months === 999 ? 'Trọn đời' : `${p.duration_months} tháng`}
                </td>
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 800; color: #059669; border: 1px solid #e2e8f0;">
                  ${p.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price) : 'Miễn phí'}
                </td>
                <td style="padding: 10px 12px; font-size: 11px; color: #64748b; border: 1px solid #e2e8f0;">
                  ${p.badge || 'Đầy đủ module'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>` : ''}

      <table style="margin-top: 18px; width: 100%; border: none;">
        <tr>
          <td style="width: 35%; font-weight: bold; border:none; color: #64748b; font-size: 12px;">Đơn vị phát hành:</td>
          <td style="border:none; font-weight: bold; color: #7c3aed; font-size: 12px;">OmniAssets Platform (Master Super Admin)</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Quản Trị Viên Nền Tảng:</td>
          <td style="border:none; font-weight: bold; color: #0f172a; font-size: 12px;">adminManager@gmail.com</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Hòm thư phát thông báo:</td>
          <td style="border:none; font-family: monospace; color: #7c3aed; font-weight: bold; font-size: 12px;">${senderEmail}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Hỗ trợ &amp; tư vấn gói:</td>
          <td style="border:none; font-family: monospace; color: #059669; font-weight: bold; font-size: 12px;">support@omniassets.ryug.id.vn</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 11px; color: #94a3b8; margin-top: 16px; text-align: center; line-height: 1.6;">
      Thông báo được phát chính thức từ Hệ Thống Quản Trị Nền Tảng OmniAssets đến Ban Quản Trị Doanh Nghiệp.
    </p>
  `;

  return wrapEmailHtml({
    title: `[OmniAssets Platform] ${subject}`,
    preheader: subject,
    contentHtml: content,
    ctaText,
    ctaUrl
  });
}

// ========================
// 1. AUTHENTICATION & LOGIN
// ========================
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, message: 'Vui lòng nhập email và mật khẩu' }, 400);
    }

    const cleanAccount = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = await c.env.DB
      .prepare('SELECT id, name, email, role, department, phone, avatar, status, company_id FROM users WHERE (lower(email) = ? OR lower(id) = ?) AND password = ?')
      .bind(cleanAccount, cleanAccount, cleanPassword)
      .first();

    if (!user) {
      return c.json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' }, 401);
    }

    if (user.status && user.status.toUpperCase() === 'LOCKED') {
      return c.json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên hệ thống.' }, 403);
    }

    // Default company_id if missing
    if (!user.company_id) {
      user.company_id = user.role === 'SUPER_ADMIN' ? 'SYSTEM' : 'comp_1';
    }

    if (user.company_id && user.company_id !== 'SYSTEM') {
      const compTenant = await c.env.DB
        .prepare('SELECT company_name, plan_code, license_status FROM company_tenants WHERE id = ?')
        .bind(user.company_id)
        .first()
        .catch(() => null);
      user.company_name = compTenant?.company_name || 'OMNI ASSETS';
      user.plan_code = compTenant?.plan_code || 'TRIAL_2M';
      user.license_status = compTenant?.license_status || 'ACTIVE';
    } else {
      user.company_name = 'Hệ Thống Quản Trị Nền Tảng (Master)';
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

// Gửi mã OTP xác thực đăng ký doanh nghiệp
app.post('/api/auth/send-registration-otp', async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_otps (
        email TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    const body = await c.req.json().catch(() => ({}));
    const email = (body.admin_email || body.email || '').trim().toLowerCase();
    const companyName = (body.company_name || 'Doanh Nghiệp').trim();

    if (!email || !email.includes('@')) {
      return c.json({ success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ' }, 400);
    }

    // Kiểm tra xem email đã được đăng ký chưa
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?').bind(email).first().catch(() => null);
    if (existing) {
      return c.json({ success: false, message: `Email "${email}" đã tồn tại trên hệ thống. Vui lòng đăng nhập hoặc dùng email khác.` }, 400);
    }

    // Sinh mã OTP ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    await c.env.DB.prepare(`
      INSERT INTO email_otps (email, otp, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET otp = excluded.otp, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP
    `).bind(email, otp, expiresAt).run();

    const otpHtml = getOtpEmailHtml({
      companyName,
      otp,
      expiresInMinutes: 5
    });

    await sendEmail({
      db: c.env.DB,
      companyId: 'SYSTEM',
      senderType: 'notifications',
      replyTo: 'hieupham101097@gmail.com',
      to: email,
      subject: `[OMNI ASSETS] Mã OTP xác thực đăng ký: ${otp}`,
      html: otpHtml
    });

    return c.json({
      success: true,
      message: `Đã gửi mã xác thực OTP 6 số đến email ${email}. Vui lòng kiểm tra hộp thư!`,
      data: { email }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi gửi mã OTP: ${err.message}` }, 500);
  }
});

// Đăng ký Doanh nghiệp Mới & Tạo User Quản Trị Viên (Tenant Isolation)
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
      admin_title,
      otp
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

    // Verify OTP
    const otpInput = (otp || '').trim();
    if (!otpInput) {
      return c.json({ success: false, message: 'Vui lòng nhập mã OTP xác thực đã được gửi về email của bạn.' }, 400);
    }

    const otpRecord = await c.env.DB.prepare('SELECT * FROM email_otps WHERE email = ?').bind(cleanEmail).first().catch(() => null);
    if (!otpRecord) {
      return c.json({ success: false, message: 'Chưa có yêu cầu gửi mã OTP cho email này hoặc mã đã hết hạn. Vui lòng bấm gửi lại mã.' }, 400);
    }

    if (Date.now() > otpRecord.expires_at) {
      await c.env.DB.prepare('DELETE FROM email_otps WHERE email = ?').bind(cleanEmail).run().catch(() => {});
      return c.json({ success: false, message: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu gửi mã mới.' }, 400);
    }

    if (otpRecord.otp !== otpInput) {
      return c.json({ success: false, message: 'Mã OTP xác thực không chính xác. Vui lòng kiểm tra lại.' }, 400);
    }

    // OTP verified! Clean up OTP record
    await c.env.DB.prepare('DELETE FROM email_otps WHERE email = ?').bind(cleanEmail).run().catch(() => {});

    // Generate isolated Company Tenant
    const companyId = `comp_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const d = new Date(today);
    d.setMonth(d.getMonth() + 2);
    const expireDate = d.toISOString().slice(0, 10);

    await c.env.DB.prepare(`
      INSERT INTO company_tenants (id, company_name, tax_id, admin_name, admin_email, admin_phone, plan_code, license_status, start_date, expire_date, revenue, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'TRIAL_2M', 'ACTIVE', ?, ?, 0, 'Tự đăng ký doanh nghiệp mới', datetime('now'))
    `).bind(
      companyId,
      company_name.trim(),
      tax_id ? tax_id.trim() : null,
      admin_name.trim(),
      cleanEmail,
      admin_phone ? admin_phone.trim() : (company_phone ? company_phone.trim() : null),
      today,
      expireDate
    ).run();

    // Create Admin User for this isolated company
    const adminId = `adm_${Date.now()}`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(admin_name.trim())}`;
    const departmentName = admin_title?.trim() || 'Ban Giám Đốc';

    await c.env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, department, phone, avatar, status, company_id)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?, 'ACTIVE', ?)
    `).bind(
      adminId,
      admin_name.trim(),
      cleanEmail,
      admin_password.trim(),
      departmentName,
      admin_phone ? admin_phone.trim() : (company_phone ? company_phone.trim() : ''),
      avatar,
      companyId
    ).run();

    const newUser = {
      id: adminId,
      name: admin_name.trim(),
      email: cleanEmail,
      role: 'ADMIN',
      department: departmentName,
      phone: admin_phone || '',
      avatar,
      status: 'ACTIVE',
      company_id: companyId,
      company_name: company_name.trim(),
      plan_code: 'TRIAL_2M',
      license_status: 'ACTIVE'
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

// Cập nhật thông tin cá nhân (Profile) & Đổi mật khẩu của người dùng hiện tại
app.put('/api/auth/profile', async (c) => {
  try {
    const body = await c.req.json();
    const userId = body.id || c.req.header('x-user-id');
    if (!userId) {
      return c.json({ success: false, message: 'Thiếu định danh tài khoản người dùng' }, 400);
    }

    const existingUser = await c.env.DB
      .prepare('SELECT id, name, email, password, role, department, phone, avatar, status FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!existingUser) {
      return c.json({ success: false, message: 'Không tìm thấy thông tin tài khoản người dùng' }, 404);
    }

    const {
      name,
      phone,
      avatar,
      department,
      current_password,
      new_password
    } = body;

    let updatedPassword = existingUser.password;

    // Nếu người dùng muốn đổi mật khẩu
    if (new_password && new_password.trim()) {
      if (!current_password) {
        return c.json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại để xác thực đổi mật khẩu' }, 400);
      }
      if (current_password.trim() !== existingUser.password) {
        return c.json({ success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!' }, 400);
      }
      if (new_password.trim().length < 6) {
        return c.json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' }, 400);
      }
      updatedPassword = new_password.trim();
    }

    const newName = name !== undefined ? name.trim() : existingUser.name;
    const newPhone = phone !== undefined ? phone.trim() : existingUser.phone;
    const newAvatar = avatar !== undefined ? avatar.trim() : existingUser.avatar;
    const newDept = (department !== undefined && department.trim()) ? department.trim() : existingUser.department;

    await c.env.DB.prepare(`
      UPDATE users
      SET name = ?,
          phone = ?,
          avatar = ?,
          department = ?,
          password = ?
      WHERE id = ?
    `).bind(
      newName,
      newPhone,
      newAvatar,
      newDept,
      updatedPassword,
      userId
    ).run();

    const updatedUser = {
      id: existingUser.id,
      name: newName,
      email: existingUser.email,
      role: existingUser.role,
      department: newDept,
      phone: newPhone,
      avatar: newAvatar,
      status: existingUser.status
    };

    return c.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      data: { user: updatedUser }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Lấy thông tin cá nhân và thống kê hoạt động của User
app.get('/api/auth/profile', async (c) => {
  try {
    const userId = c.req.query('id') || c.req.header('x-user-id');
    if (!userId) {
      return c.json({ success: false, message: 'Thiếu định danh tài khoản' }, 400);
    }

    const user = await c.env.DB
      .prepare('SELECT id, name, email, role, department, phone, avatar, status FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return c.json({ success: false, message: 'Không tìm thấy người dùng' }, 404);
    }

    // Thống kê cá nhân
    const totalAttendance = await c.env.DB.prepare('SELECT count(*) as count FROM attendance WHERE user_id = ?').bind(userId).first('count') || 0;
    const assignedTasks = await c.env.DB.prepare('SELECT count(*) as count FROM tasks WHERE assigned_to_user_id = ?').bind(userId).first('count') || 0;
    const completedTasks = await c.env.DB.prepare("SELECT count(*) as count FROM tasks WHERE assigned_to_user_id = ? AND status = 'COMPLETED'").bind(userId).first('count') || 0;

    return c.json({
      success: true,
      data: {
        user,
        stats: {
          totalAttendance: Number(totalAttendance),
          assignedTasks: Number(assignedTasks),
          completedTasks: Number(completedTasks)
        }
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);

    let assetsQuery = 'SELECT status, price FROM assets WHERE company_id = ?';
    let finQuery = 'SELECT type, amount FROM finance WHERE company_id = ?';
    let tasksQuery = 'SELECT id, title, due_date, status, priority FROM tasks WHERE company_id = ?';
    let contractsQuery = 'SELECT id, title, end_date, status FROM contracts WHERE company_id = ?';
    let usersCountQuery = 'SELECT count(*) as count FROM users WHERE company_id = ?';
    let params = [companyId];

    if (isSuperAdmin && companyId === 'ALL') {
      assetsQuery = 'SELECT status, price FROM assets';
      finQuery = 'SELECT type, amount FROM finance';
      tasksQuery = 'SELECT id, title, due_date, status, priority FROM tasks';
      contractsQuery = 'SELECT id, title, end_date, status FROM contracts';
      usersCountQuery = 'SELECT count(*) as count FROM users';
      params = [];
    }

    // Assets count
    const assetsRes = await c.env.DB.prepare(assetsQuery).bind(...params).all();
    const assets = assetsRes.results || [];
    const totalAssets = assets.length;
    const inUseAssets = assets.filter((a) => a.status === 'IN_USE').length;
    const maintenanceAssets = assets.filter((a) => a.status === 'MAINTENANCE').length;
    const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    // Finance count
    const finRes = await c.env.DB.prepare(finQuery).bind(...params).all();
    const finance = finRes.results || [];
    const totalRevenue = finance
      .filter((f) => f.type === 'REVENUE')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const totalExpense = finance
      .filter((f) => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpense;

    // Tasks & Reminders
    const tasksRes = await c.env.DB.prepare(tasksQuery).bind(...params).all();
    const tasks = tasksRes.results || [];
    const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
    const overdueTasks = pendingTasks.filter((t) => t.due_date < today);
    const upcomingTasks = pendingTasks.filter((t) => {
      const diff = Math.ceil((new Date(t.due_date) - new Date(today)) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 3;
    });

    // Contracts
    const contractsRes = await c.env.DB.prepare(contractsQuery).bind(...params).all();
    const contracts = contractsRes.results || [];
    const activeContracts = contracts.filter((ct) => ct.status === 'ACTIVE');
    const expiringContracts = activeContracts.filter((ct) => {
      if (!ct.end_date) return false;
      const diff = Math.ceil((new Date(ct.end_date) - new Date(today)) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    });

    // Users
    const usersCount = (await c.env.DB.prepare(usersCountQuery).bind(...params).first())?.count || 0;

    // Reminders
    const urgentReminders = [];

    // Tự động gửi thông báo cấp Key bản quyền vào quả chuông của doanh nghiệp
    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      try {
        const pendingKeys = await c.env.DB
          .prepare("SELECT * FROM license_keys WHERE company_id = ? AND status = 'ACTIVE'")
          .bind(companyId)
          .all();

        for (const pk of (pendingKeys?.results || [])) {
          urgentReminders.push({
            id: `lic_${pk.id}`,
            title: `🔑 Bản quyền mới: Bạn được cấp mã "${pk.license_key}" (${pk.plan_name || pk.plan_code}). Nhấn để kích hoạt ngay!`,
            date: pk.created_at ? pk.created_at.slice(0, 10) : today,
            level: 'warning',
            key: pk.license_key
          });
        }
      } catch (err) {
        console.error('Lỗi truy vấn pending license keys:', err);
      }
    }

    urgentReminders.push(
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
    );

    // Enterprise Company Name
    let currentCompanyName = 'OMNI ASSETS';
    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      const compTenant = await c.env.DB
        .prepare('SELECT company_name FROM company_tenants WHERE id = ?')
        .bind(companyId)
        .first()
        .catch(() => null);
      if (compTenant?.company_name) {
        currentCompanyName = compTenant.company_name;
      }
    }

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
        isCloudflare: true,
        company_name: currentCompanyName,
        companyName: currentCompanyName
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let query = `
      SELECT a.*, 
             u.name as assigned_user_name, 
             u.department as assigned_user_department
      FROM assets a
      LEFT JOIN users u ON a.assigned_to_user_id = u.id
      WHERE a.company_id = ?
      ORDER BY a.created_at DESC
    `;
    let params = [companyId];

    if (isSuperAdmin && companyId === 'ALL') {
      query = `
        SELECT a.*, 
               u.name as assigned_user_name, 
               u.department as assigned_user_department
        FROM assets a
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        ORDER BY a.created_at DESC
      `;
      params = [];
    }

    const res = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/assets', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxAssets || 20;
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM assets WHERE company_id = ?').bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: license.isTrial
            ? `Bản Dùng Thử 2 Tháng (0đ) giới hạn tối đa ${maxAllowed} tài sản. Bạn đã dùng hết ${count}/${maxAllowed} tài sản. Vui lòng nâng cấp lên Gói Bản Quyền Chính Thức để quản lý tài sản không giới hạn!`
            : `Gói dùng thử đã hết hạn (giới hạn tối đa ${maxAllowed} tài sản). Vui lòng thanh toán kích hoạt bản quyền để tiếp tục thêm tài sản!`
        }, 403);
      }
    }

    const body = await c.req.json();
    const id = `ast_${Date.now()}`;
    const code = body.code || `TS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    await c.env.DB.prepare(`
      INSERT INTO assets (id, code, name, category, serial_number, purchase_date, price, status, location, assigned_to_user_id, notes, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      body.notes || '',
      companyId
    ).run();

    return c.json({ success: true, data: { id, code, ...body } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/assets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();

    let sql = `
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
    `;
    let params = [
      body.name !== undefined ? body.name : null,
      body.category !== undefined ? body.category : null,
      body.serial_number !== undefined ? body.serial_number : null,
      body.price !== undefined ? body.price : null,
      body.status !== undefined ? body.status : null,
      body.location !== undefined ? body.location : null,
      body.assigned_to_user_id !== undefined ? body.assigned_to_user_id : null,
      body.notes !== undefined ? body.notes : null,
      id
    ];

    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }

    await c.env.DB.prepare(sql).bind(...params).run();

    return c.json({ success: true, message: 'Đã cập nhật tài sản' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/assets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'DELETE FROM assets WHERE id = ?';
    let params = [id];

    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }

    await c.env.DB.prepare(sql).bind(...params).run();
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'SELECT * FROM finance WHERE company_id = ? ORDER BY date DESC, created_at DESC';
    let params = [companyId];
    if (isSuperAdmin && companyId === 'ALL') {
      sql = 'SELECT * FROM finance ORDER BY date DESC, created_at DESC';
      params = [];
    }

    const res = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/finance/monthly-summary', async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'SELECT * FROM finance WHERE company_id = ?';
    let params = [companyId];
    if (isSuperAdmin && companyId === 'ALL') {
      sql = 'SELECT * FROM finance';
      params = [];
    }

    const res = await c.env.DB.prepare(sql).bind(...params).all();
    const list = res.results || [];

    const summaryMap = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `2024-${String(i).padStart(2, '0')}`;
      summaryMap[monthKey] = { month: `T${i}`, revenue: 0, expense: 0, profit: 0 };
    }

    // Chỉ dùng demo trend cho comp_1
    if (companyId === 'comp_1') {
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
    }

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
        growthRate: totalRevenue > 0 ? '+18.4%' : '0%'
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/finance', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB);
    if (license.isDemo) {
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM finance WHERE company_id = ?').bind(companyId).first())?.count || 0;
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
      INSERT INTO finance (id, type, category, amount, date, description, invoice_number, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.type,
      body.category,
      Number(body.amount),
      body.date || new Date().toISOString().split('T')[0],
      body.description || '',
      invoice,
      companyId
    ).run();

    return c.json({ success: true, message: 'Đã thêm giao dịch' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/finance/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'DELETE FROM finance WHERE id = ?';
    let params = [id];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);

    let query = `
      SELECT t.*, u.name as assigned_user_name, u.avatar as assigned_user_avatar, u.department as assigned_user_department
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_user_id = u.id
      WHERE t.company_id = ?
      ORDER BY t.due_date ASC
    `;
    let params = [companyId];
    if (isSuperAdmin && companyId === 'ALL') {
      query = `
        SELECT t.*, u.name as assigned_user_name, u.avatar as assigned_user_avatar, u.department as assigned_user_department
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to_user_id = u.id
        ORDER BY t.due_date ASC
      `;
      params = [];
    }

    const res = await c.env.DB.prepare(query).bind(...params).all();
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
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json();
    const id = `tsk_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO tasks (id, title, description, assigned_to_user_id, due_date, priority, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title,
      body.description || '',
      body.assigned_to_user_id || null,
      body.due_date,
      body.priority || 'MEDIUM',
      'PENDING',
      companyId
    ).run();

    return c.json({ success: true, message: 'Đã tạo công việc' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();

    let sql = `
      UPDATE tasks
      SET status = COALESCE(?, status),
          title = COALESCE(?, title),
          priority = COALESCE(?, priority)
      WHERE id = ?
    `;
    let params = [
      body.status !== undefined ? body.status : null,
      body.title !== undefined ? body.title : null,
      body.priority !== undefined ? body.priority : null,
      id
    ];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }

    await c.env.DB.prepare(sql).bind(...params).run();

    return c.json({ success: true, message: 'Đã cập nhật công việc' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'DELETE FROM tasks WHERE id = ?';
    let params = [id];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'SELECT * FROM contracts WHERE company_id = ? ORDER BY start_date DESC';
    let params = [companyId];
    if (isSuperAdmin && companyId === 'ALL') {
      sql = 'SELECT * FROM contracts ORDER BY start_date DESC';
      params = [];
    }

    const res = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/contracts', async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxContracts || 5;
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM contracts WHERE company_id = ?').bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: license.isTrial
            ? `Bản Dùng Thử 2 Tháng (0đ) giới hạn tối đa ${maxAllowed} hợp đồng. Bạn đã tạo đủ ${count}/${maxAllowed} hợp đồng. Vui lòng nâng cấp lên Gói Bản Quyền Chính Thức để quản lý hợp đồng không giới hạn!`
            : `Gói dùng thử đã hết hạn (giới hạn tối đa ${maxAllowed} hợp đồng). Vui lòng thanh toán nâng cấp bản quyền để tiếp tục lưu trữ hợp đồng!`
        }, 403);
      }
    }

    const body = await c.req.json();
    const id = `ctr_${Date.now()}`;
    const code = body.code || `HĐ-${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`;
    const terms = typeof body.terms === 'string' ? body.terms : (body.terms ? JSON.stringify(body.terms) : '');
    const appendices = typeof body.appendices === 'string' ? body.appendices : (body.appendices ? JSON.stringify(body.appendices) : '[]');

    await c.env.DB.prepare(`
      INSERT INTO contracts (id, code, title, type, partner_name, value, start_date, end_date, status, notes, terms, appendices, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      appendices,
      companyId
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();

    let checkSql = 'SELECT * FROM contracts WHERE id = ?';
    let checkParams = [id];
    if (!isSuperAdmin || companyId !== 'ALL') {
      checkSql += ' AND (company_id = ? OR company_id IS NULL)';
      checkParams.push(companyId);
    }

    const existing = await c.env.DB.prepare(checkSql).bind(...checkParams).first();
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();

    let checkSql = 'SELECT * FROM contracts WHERE id = ?';
    let checkParams = [id];
    if (!isSuperAdmin || companyId !== 'ALL') {
      checkSql += ' AND (company_id = ? OR company_id IS NULL)';
      checkParams.push(companyId);
    }

    const contract = await c.env.DB.prepare(checkSql).bind(...checkParams).first();
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let query = `
      SELECT h.*, 
             a.name as asset_name, a.code as asset_code,
             u.name as user_name, u.department as user_department
      FROM handover_protocols h
      LEFT JOIN assets a ON h.asset_id = a.id
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.company_id = ?
      ORDER BY h.handover_date DESC
    `;
    let params = [companyId];
    if (isSuperAdmin && companyId === 'ALL') {
      query = `
        SELECT h.*, 
               a.name as asset_name, a.code as asset_code,
               u.name as user_name, u.department as user_department
        FROM handover_protocols h
        LEFT JOIN assets a ON h.asset_id = a.id
        LEFT JOIN users u ON h.user_id = u.id
        ORDER BY h.handover_date DESC
      `;
      params = [];
    }

    const res = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/contracts/handover/create', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxHandovers || 5;
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM handover_protocols WHERE company_id = ?').bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: license.isTrial
            ? `Bản Dùng Thử 2 Tháng (0đ) giới hạn tối đa ${maxAllowed} biên bản bàn giao. Bạn đã tạo đủ ${count}/${maxAllowed} biên bản. Vui lòng nâng cấp lên Gói Bản Quyền Chính Thức để quản lý biên bản không giới hạn!`
            : `Gói dùng thử đã hết hạn (giới hạn tối đa ${maxAllowed} biên bản). Vui lòng thanh toán bản quyền để tiếp tục tạo biên bản bàn giao!`
        }, 403);
      }
    }

    const body = await c.req.json();
    const id = `bb_${Date.now()}`;
    const code = body.code || `BBBG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    await c.env.DB.prepare(`
      INSERT INTO handover_protocols (id, code, asset_id, user_id, type, handover_date, condition, status, notes, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      body.asset_id,
      body.user_id,
      body.type || 'HANDOVER',
      body.handover_date || new Date().toISOString().split('T')[0],
      body.condition || 'Hoạt động tốt',
      'COMPLETED',
      body.notes || '',
      companyId
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
        company_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (_) {}
}

// Lấy danh sách mẫu hợp đồng đã học
app.get('/api/contracts/ai/templates', async (c) => {
  try {
    await initAiTemplateTable(c.env.DB);
    const { companyId, isSuperAdmin } = await getTenantContext(c);

    let sql = 'SELECT * FROM ai_contract_templates WHERE company_id = ? OR company_id IS NULL ORDER BY created_at DESC';
    let params = [companyId];
    if (isSuperAdmin && companyId === 'ALL') {
      sql = 'SELECT * FROM ai_contract_templates ORDER BY created_at DESC';
      params = [];
    }

    let res = await c.env.DB.prepare(sql).bind(...params).all();
    let templates = res.results || [];

    // Nếu kho mẫu trống, nạp sẵn 3 mẫu tiêu chuẩn doanh nghiệp (dùng chung cho mọi tenant: company_id = NULL)
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
          INSERT OR REPLACE INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content, company_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `).bind(item.id, item.title, item.type, item.category_name, item.summary, item.structure_schema, item.sample_content).run();
      }

      res = await c.env.DB.prepare(sql).bind(...params).all();
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
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json();
    const id = body.id || `tpl_${Date.now()}`;
    const schemaStr = typeof body.structure_schema === 'object' ? JSON.stringify(body.structure_schema) : (body.structure_schema || '{}');

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title || 'Mẫu Hợp Đồng Tùy Biến',
      body.type || 'CONTRACT',
      body.category_name || 'Hợp Đồng Thương Mại',
      body.summary || '',
      schemaStr,
      body.sample_content || '',
      companyId
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'DELETE FROM ai_contract_templates WHERE id = ?';
    let params = [id];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND company_id = ?';
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
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
    let geminiModel = c.env?.GEMINI_MODEL || 'gemini-flash-latest';
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
      const { companyId } = await getTenantContext(c);
      const id = `tpl_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content, company_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        learnedData.title || titleHint || 'Mẫu Hợp Đồng Đã Học',
        learnedData.type || typeHint || 'CONTRACT',
        learnedData.category_name || categoryHint || 'Hợp Đồng Doanh Nghiệp',
        learnedData.summary || '',
        JSON.stringify(learnedData.structure_schema || {}),
        learnedData.sample_content || rawContent,
        companyId
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
    const { companyId } = await getTenantContext(c);
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

    // Lấy thông tin mẫu đã học từ DB thuộc tenant này hoặc mẫu chuẩn hệ thống
    let template = null;
    if (templateId) {
      template = await c.env.DB.prepare('SELECT * FROM ai_contract_templates WHERE id = ? AND (company_id = ? OR company_id IS NULL)').bind(templateId, companyId).first();
    }
    if (!template) {
      template = await c.env.DB.prepare('SELECT * FROM ai_contract_templates WHERE (company_id = ? OR company_id IS NULL) ORDER BY created_at DESC LIMIT 1').bind(companyId).first();
    }

    let geminiApiKey = c.env?.GEMINI_API_KEY || '';
    let geminiModel = c.env?.GEMINI_MODEL || 'gemini-flash-latest';
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let query = `
      SELECT att.*, u.name as user_name, u.role as user_role, u.department as user_department
      FROM attendance att
      LEFT JOIN users u ON att.user_id = u.id
      WHERE att.company_id = ?
      ORDER BY att.date DESC, att.check_in DESC
    `;
    let params = [companyId];
    if (isSuperAdmin && companyId === 'ALL') {
      query = `
        SELECT att.*, u.name as user_name, u.role as user_role, u.department as user_department
        FROM attendance att
        LEFT JOIN users u ON att.user_id = u.id
        ORDER BY att.date DESC, att.check_in DESC
      `;
      params = [];
    }

    const res = await c.env.DB.prepare(query).bind(...params).all();
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
      .prepare('SELECT id, name, company_id FROM users WHERE id = ?')
      .bind(user_id)
      .first();

    if (!targetUser) {
      return c.json({
        success: false,
        message: `Mã nhân sự "${user_id}" không tồn tại trên hệ thống. Vui lòng đăng nhập lại.`
      }, 400);
    }

    const companyId = targetUser.company_id || 'comp_1';

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

    // Lấy cấu hình chấm công động theo từng tenant từ bảng company_settings hoặc system_settings
    let workStart = '08:30';
    let graceMin = 15;
    try {
      const sStart = await c.env.DB.prepare("SELECT value FROM company_settings WHERE company_id = ? AND key = 'work_start_time'").bind(companyId).first() ||
                     await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'work_start_time'").first();
      if (sStart?.value) workStart = sStart.value;
      const sGrace = await c.env.DB.prepare("SELECT value FROM company_settings WHERE company_id = ? AND key = 'late_grace_minutes'").bind(companyId).first() ||
                     await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'late_grace_minutes'").first();
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
        INSERT INTO attendance (id, user_id, date, check_in, check_out, total_hours, status, notes, company_id)
        VALUES (?, ?, ?, ?, NULL, 0, ?, ?, ?)
      `).bind(
        id,
        user_id,
        today,
        timeStr,
        isLate ? 'LATE' : 'ON_TIME',
        noteText,
        companyId
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);

    let usersQuery = 'SELECT count(*) as count FROM users WHERE company_id = ?';
    let attQuery = 'SELECT * FROM attendance WHERE date = ? AND company_id = ?';
    let userParams = [companyId];
    let attParams = [today, companyId];

    if (isSuperAdmin && companyId === 'ALL') {
      usersQuery = 'SELECT count(*) as count FROM users';
      attQuery = 'SELECT * FROM attendance WHERE date = ?';
      userParams = [];
      attParams = [today];
    }

    const usersCount = (await c.env.DB.prepare(usersQuery).bind(...userParams).first())?.count || 0;
    const todayRecords = (await c.env.DB.prepare(attQuery).bind(...attParams).all())?.results || [];

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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let res;
    if (isSuperAdmin && companyId === 'ALL') {
      res = await c.env.DB
        .prepare('SELECT id, name, email, role, department, phone, avatar, status, company_id, created_at FROM users ORDER BY created_at DESC')
        .all();
    } else {
      res = await c.env.DB
        .prepare('SELECT id, name, email, role, department, phone, avatar, status, company_id, created_at FROM users WHERE company_id = ? ORDER BY created_at DESC')
        .bind(companyId)
        .all();
    }
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

    const { companyId } = await getTenantContext(c);

    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxUsers || 3;
      const count = (await c.env.DB.prepare('SELECT count(*) as count FROM users WHERE company_id = ?').bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: 'LICENSE_LIMIT_REACHED',
          message: license.isTrial
            ? `Bản Dùng Thử 2 Tháng (0đ) giới hạn tối đa ${maxAllowed} tài khoản nhân sự. Bạn đã tạo đủ ${count}/${maxAllowed} tài khoản. Vui lòng nâng cấp lên Gói Bản Quyền Chính Thức để tạo nhân sự không giới hạn!`
            : `Gói cước dùng thử đã hết hạn (giới hạn tối đa ${maxAllowed} nhân sự). Vui lòng thanh toán nâng cấp gói để tiếp tục thêm nhân viên!`
        }, 403);
      }
    }

    const body = await c.req.json();
    const id = `usr_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, department, phone, avatar, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).bind(
      id,
      body.name,
      body.email,
      body.password || '123456',
      body.role || 'STAFF',
      body.department || 'Phòng Kế Hoạch',
      body.phone || '',
      body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`,
      companyId
    ).run();

    // Tự động gửi email cấp tài khoản và mật khẩu khởi tạo nếu nhân sự có email
    if (body.email && body.email.includes('@')) {
      try {
        const mailConfig = await getEmailConfig(c.env.DB, companyId);
        if (mailConfig.notifyNewUser) {
          const comp = await c.env.DB.prepare('SELECT company_name FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
          const companyName = comp?.company_name || mailConfig.companyName || 'OMNI ASSETS & LOGISTICS';
          const welcomeHtml = getWelcomeUserEmailHtml({
            companyName,
            userName: body.name || 'Nhân sự mới',
            userEmail: body.email,
            password: body.password || '123456',
            role: body.role || 'STAFF',
            department: body.department || 'Phòng Kế Hoạch',
            loginUrl: 'https://company-sheet.hieupham101097.workers.dev'
          });
          const mailPromise = sendEmail({
            db: c.env.DB,
            companyId,
            senderType: 'tasks',
            to: body.email,
            subject: `[${companyName}] Thông tin tài khoản đăng nhập của bạn`,
            html: welcomeHtml
          }).catch(e => console.error('[Welcome Email Error]', e.message));

          if (c.executionCtx?.waitUntil) {
            c.executionCtx.waitUntil(mailPromise);
          }
        }
      } catch (mErr) {
        console.error('[Welcome Mail Trigger Error]', mErr.message);
      }
    }

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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();

    let sql = `
      UPDATE users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          role = COALESCE(?, role),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status)
      WHERE id = ?
    `;
    let params = [
      body.name !== undefined ? body.name : null,
      body.email !== undefined ? body.email : null,
      body.department !== undefined ? body.department : null,
      body.role !== undefined ? body.role : null,
      body.phone !== undefined ? body.phone : null,
      body.status !== undefined ? body.status : null,
      id
    ];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }

    await c.env.DB.prepare(sql).bind(...params).run();

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
    if (id === 'usr_admin' || id === 'usr_1' || id === 'super_admin_master') {
      return c.json({ success: false, message: 'Không thể xóa tài khoản Quản trị viên khởi tạo' }, 400);
    }

    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'DELETE FROM users WHERE id = ?';
    let params = [id];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }

    await c.env.DB.prepare(sql).bind(...params).run();
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const type = c.req.query('type');
    let query = 'SELECT * FROM categories';
    let params = [];
    if (isSuperAdmin && companyId === 'ALL') {
      if (type) {
        query += ' WHERE type = ?';
        params.push(type);
      }
    } else {
      query += ' WHERE (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }
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

    const { companyId } = await getTenantContext(c);
    const { type, name, code, description } = await c.req.json();
    if (!type || !name) {
      return c.json({ success: false, message: 'Phân loại và tên danh mục là bắt buộc' }, 400);
    }

    const id = `cat_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO categories (id, type, name, code, description, company_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, type, name, code || '', description || '', companyId).run();

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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const { name, code, description } = await c.req.json();

    let sql = `
      UPDATE categories
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          description = COALESCE(?, description)
      WHERE id = ?
    `;
    let params = [
      name !== undefined ? name : null,
      code !== undefined ? code : null,
      description !== undefined ? description : null,
      id
    ];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(companyId);
    }

    await c.env.DB.prepare(sql).bind(...params).run();

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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = 'DELETE FROM categories WHERE id = ?';
    let params = [id];
    if (!isSuperAdmin || companyId !== 'ALL') {
      sql += ' AND company_id = ?';
      params.push(companyId);
    }

    await c.env.DB.prepare(sql).bind(...params).run();
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
      // EMAIL SERVICE (RESEND & BREVO)
      ['mail_provider', 'resend', 'MAIL', 'Nhà cung cấp dịch vụ Email (resend hoặc brevo)', new Date().toISOString()],
      ['mail_api_key', '', 'MAIL', 'Khóa API Key của dịch vụ gửi mail', new Date().toISOString()],
      ['mail_sender_name', 'OMNI ASSETS & LOGISTICS', 'MAIL', 'Tên người gửi hiển thị trong hộp thư', new Date().toISOString()],
      ['mail_sender_email', 'onboarding@resend.dev', 'MAIL', 'Địa chỉ email người gửi', new Date().toISOString()],
      ['mail_notify_new_user', 'true', 'MAIL', 'Tự động gửi email cấp tài khoản & mật khẩu khi thêm nhân sự', new Date().toISOString()],
      ['mail_notify_reminders', 'true', 'MAIL', 'Tự động gửi email thông báo nhắc hạn (hợp đồng, công việc) lúc 06:00 AM', new Date().toISOString()],
      ['mail_notify_timesheet', 'true', 'MAIL', 'Kích hoạt tính năng gửi phiếu chấm công qua email', new Date().toISOString()],
      // LICENSE & PAYWALL
      ['license_tier', 'DEMO', 'LICENSE', 'Cấp độ bản quyền (DEMO hoặc ENTERPRISE)', new Date().toISOString()],
      ['license_key', '', 'LICENSE', 'Khóa bản quyền đã kích hoạt', new Date().toISOString()],
      ['license_status', 'ACTIVE', 'LICENSE', 'Trạng thái bản quyền', new Date().toISOString()],
      ['license_activated_at', '', 'LICENSE', 'Thời gian kích hoạt bản quyền', new Date().toISOString()],
      // PAYMENT & BANKING (VIETQR)
      ['bank_name', 'ACB - Ngân Hàng TMCP Á Châu', 'PAYMENT', 'Tên ngân hàng thụ hưởng thanh toán', new Date().toISOString()],
      ['bank_code', 'ACB', 'PAYMENT', 'Mã viết tắt ngân hàng', new Date().toISOString()],
      ['bank_bin', '970416', 'PAYMENT', 'Mã BIN ngân hàng chuẩn VietQR', new Date().toISOString()],
      ['bank_account_number', '7909707', 'PAYMENT', 'Số tài khoản ngân hàng thụ hưởng', new Date().toISOString()],
      ['bank_account_holder', 'PHAM MINH HIEU', 'PAYMENT', 'Họ tên chủ tài khoản thụ hưởng', new Date().toISOString()]
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

// Helper: Query license status from DB for a specific company tenant
async function getLicenseStatus(db, companyId) {
  try {
    let tenant = null;
    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      tenant = await db
        .prepare('SELECT id, company_name, plan_code, license_status, start_date, expire_date FROM company_tenants WHERE id = ?')
        .bind(companyId)
        .first()
        .catch(() => null);
    }

    const planCode = tenant?.plan_code || 'TRIAL_2M';
    let licenseStatus = tenant?.license_status || 'ACTIVE';
    const expireDate = tenant?.expire_date || null;
    const companyName = tenant?.company_name || 'Doanh Nghiệp';

    let isExpired = false;
    let daysRemaining = null;

    if (planCode === 'LIFETIME') {
      isExpired = false;
      daysRemaining = null;
    } else if (expireDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expireDate);
      exp.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0 || licenseStatus === 'EXPIRED') {
        isExpired = true;
        licenseStatus = 'EXPIRED';
      }
    } else if (planCode === 'TRIAL_2M') {
      daysRemaining = 60;
    }

    const isPaid = !isExpired && (planCode === 'ANNUAL_1Y' || planCode === 'ANNUAL_2Y' || planCode === 'LIFETIME');
    const isTrial = !isExpired && planCode === 'TRIAL_2M';
    const isDemo = isExpired || planCode === 'DEMO';

    const maxAssets = isPaid ? Infinity : (isTrial ? 20 : 5);
    const maxUsers = isPaid ? Infinity : (isTrial ? 3 : 2);
    const maxContracts = isPaid ? Infinity : (isTrial ? 5 : 2);
    const maxHandovers = isPaid ? Infinity : (isTrial ? 5 : 2);
    const maxFinance = isPaid ? Infinity : (isTrial ? 10 : 5);
    const maxDepartments = isPaid ? Infinity : (isTrial ? 1 : 1);

    let planRow = null;
    try {
      planRow = await db.prepare('SELECT name, price, badge, features FROM pricing_plans WHERE code = ?').bind(planCode).first().catch(() => null);
    } catch (_) {}

    return {
      tier: isPaid ? 'ENTERPRISE' : (isTrial ? 'TRIAL' : 'DEMO'),
      isTrial,
      isPaid,
      isDemo,
      isExpired,
      plan_code: planCode,
      plan_name: planRow?.name || (planCode === 'TRIAL_2M' ? 'Gói Dùng Thử 2 Tháng (Trial 60N)' : planCode === 'LIFETIME' ? 'Gói Vĩnh Viễn Trọn Đời' : 'Gói Tiêu Chuẩn 1 Năm'),
      plan_price: planRow?.price || 0,
      plan_badge: planRow?.badge || (isTrial ? 'Dùng Thử 0đ (Hạn Chế Quyền)' : 'Bản Quyền Đã Kích Hoạt'),
      status: licenseStatus,
      expire_date: expireDate,
      days_remaining: daysRemaining,
      company_id: companyId || 'comp_1',
      company_name: companyName,
      companyName: companyName,
      limits: {
        maxAssets,
        maxUsers,
        maxContracts,
        maxHandovers,
        maxFinance,
        maxDepartments,
        allowAutomatedEmails: isPaid,
        allowTelegram: isPaid,
        allowCustomStamp: isPaid,
        unwatermarkedPrint: isPaid,
        allowAdvancedBackup: isPaid
      }
    };
  } catch (err) {
    return {
      tier: 'TRIAL',
      isTrial: true,
      isPaid: false,
      isDemo: false,
      isExpired: false,
      plan_code: 'TRIAL_2M',
      plan_name: 'Gói Dùng Thử 2 Tháng (Trial 60N)',
      plan_price: 0,
      plan_badge: 'Dùng Thử 0đ (Hạn Chế Quyền)',
      status: 'ACTIVE',
      expire_date: null,
      days_remaining: 60,
      company_id: companyId || 'comp_1',
      company_name: 'Doanh Nghiệp',
      companyName: 'Doanh Nghiệp',
      limits: {
        maxAssets: 20,
        maxUsers: 3,
        maxContracts: 5,
        maxHandovers: 5,
        maxFinance: 10,
        maxDepartments: 1,
        allowAutomatedEmails: false,
        allowTelegram: false,
        allowCustomStamp: false,
        unwatermarkedPrint: false,
        allowAdvancedBackup: false
      }
    };
  }
}

// ==========================================
// LICENSE & PLANS API (100% DYNAMIC VIA D1)
// ==========================================
app.get('/api/license/status', async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const targetCompId = (isSuperAdmin && (!companyId || companyId === 'ALL')) ? 'comp_1' : companyId;
    const license = await getLicenseStatus(c.env.DB, targetCompId);
    return c.json({ success: true, data: license });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/license/activate', async (c) => {
  try {
    const { license_key } = await c.req.json();
    if (!license_key || !license_key.trim()) {
      return c.json({ success: false, message: 'Vui lòng cung cấp mã bản quyền (License Key)' }, 400);
    }
    const cleanKey = license_key.trim().toUpperCase();
    const keyRecord = await c.env.DB.prepare('SELECT * FROM license_keys WHERE UPPER(license_key) = ?').bind(cleanKey).first().catch(() => null);

    if (!keyRecord) {
      return c.json({ success: false, message: 'Mã bản quyền không tồn tại trên hệ thống hoặc đã nhập sai.' }, 400);
    }
    if (keyRecord.status === 'REVOKED' || keyRecord.status === 'EXPIRED') {
      return c.json({ success: false, message: 'Mã bản quyền này đã bị thu hồi hoặc đã hết hiệu lực.' }, 400);
    }

    const { companyId } = await getTenantContext(c);
    const targetCompId = (!companyId || companyId === 'ALL') ? 'comp_1' : companyId;

    let newExpire = null;
    if (keyRecord.plan_code === 'LIFETIME' || keyRecord.duration_months >= 999) {
      newExpire = '2099-12-31';
    } else {
      const months = Number(keyRecord.duration_months) || 12;
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      newExpire = d.toISOString().split('T')[0];
    }

    await c.env.DB.prepare(`
      UPDATE company_tenants 
      SET plan_code = ?, license_status = 'ACTIVE', expire_date = ?
      WHERE id = ?
    `).bind(keyRecord.plan_code, newExpire, targetCompId).run();

    await c.env.DB.prepare(`
      UPDATE license_keys
      SET status = 'USED', company_id = ?, used_at = datetime('now')
      WHERE id = ?
    `).bind(targetCompId, keyRecord.id).run().catch(() => {});

    const updatedLicense = await getLicenseStatus(c.env.DB, targetCompId);
    return c.json({
      success: true,
      message: `Kích hoạt thành công gói ${keyRecord.plan_name || keyRecord.plan_code}! Toàn bộ giới hạn hệ thống đã được mở khóa.`,
      data: updatedLicense
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/license/reset-demo', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const targetCompId = (!companyId || companyId === 'ALL') ? 'comp_1' : companyId;

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 60);
    const expStr = expDate.toISOString().split('T')[0];

    await c.env.DB.prepare(`
      UPDATE company_tenants 
      SET plan_code = 'TRIAL_2M', license_status = 'ACTIVE', expire_date = ?
      WHERE id = ?
    `).bind(expStr, targetCompId).run();

    const updatedLicense = await getLicenseStatus(c.env.DB, targetCompId);
    return c.json({
      success: true,
      message: 'Đã chuyển về Gói Dùng Thử 2 Tháng (Trial 60N)',
      data: updatedLicense
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/plans', async (c) => {
  try {
    await initPricingPlansTable(c.env.DB);
    const plans = await c.env.DB.prepare('SELECT * FROM pricing_plans WHERE is_active = 1 ORDER BY price ASC').all();
    return c.json({
      success: true,
      data: plans.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/settings', async (c) => {
  try {
    await initSettingsTable(c.env.DB);
    const { companyId } = await getTenantContext(c);

    // 1. Lấy cấu hình mặc định hệ thống
    const res = await c.env.DB.prepare('SELECT * FROM system_settings ORDER BY category, key').all();
    const rows = res.results || [];
    const settingsMap = {};
    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    // 2. Lấy cấu hình riêng theo từng tenant (company_settings)
    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      const tenantSettings = await c.env.DB.prepare('SELECT key, value FROM company_settings WHERE company_id = ?').bind(companyId).all().catch(() => ({ results: [] }));
      (tenantSettings.results || []).forEach((r) => {
        settingsMap[r.key] = r.value;
      });

      // 3. Đồng bộ bổ sung từ company_tenants nếu có
      const compTenant = await c.env.DB.prepare('SELECT * FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
      if (compTenant) {
        if (compTenant.company_name) settingsMap['company_name'] = compTenant.company_name;
        if (compTenant.tax_id) settingsMap['tax_id'] = compTenant.tax_id;
        if (compTenant.admin_email) settingsMap['company_email'] = compTenant.admin_email;
        if (compTenant.admin_phone) settingsMap['company_phone'] = compTenant.admin_phone;
      }
    }

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
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const settingsToUpdate = body.settings || body;
    const now = new Date().toISOString();

    // 1. Lưu cấu hình độc lập theo từng tenant vào company_settings
    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      for (const [key, value] of Object.entries(settingsToUpdate)) {
        await c.env.DB.prepare(`
          INSERT INTO company_settings (company_id, key, value, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).bind(companyId, key, String(value), now).run().catch(() => {});
      }

      // 2. Đồng bộ tên và thông tin sang company_tenants
      const compName = settingsToUpdate['company_name'];
      const taxId = settingsToUpdate['tax_id'];
      const phone = settingsToUpdate['company_phone'];
      const email = settingsToUpdate['company_email'];
      if (compName || taxId || phone || email) {
        await c.env.DB.prepare(`
          UPDATE company_tenants
          SET company_name = COALESCE(?, company_name),
              tax_id = COALESCE(?, tax_id),
              admin_phone = COALESCE(?, admin_phone),
              admin_email = COALESCE(?, admin_email)
          WHERE id = ?
        `).bind(compName || null, taxId || null, phone || null, email || null, companyId).run().catch(() => {});
      }

      // 3. Nếu là comp_1 (demo), cập nhật thêm system_settings để giữ mẫu
      if (companyId === 'comp_1') {
        for (const [key, value] of Object.entries(settingsToUpdate)) {
          await c.env.DB.prepare(`
            UPDATE system_settings
            SET value = ?, updated_at = ?
            WHERE key = ?
          `).bind(String(value), now, key).run().catch(() => {});
        }
      }
    } else if (isSuperAdmin) {
      for (const [key, value] of Object.entries(settingsToUpdate)) {
        await c.env.DB.prepare(`
          UPDATE system_settings
          SET value = ?, updated_at = ?
          WHERE key = ?
        `).bind(String(value), now, key).run().catch(() => {});
      }
    }

    // Lấy lại cấu hình đã cập nhật
    const res = await c.env.DB.prepare('SELECT * FROM system_settings ORDER BY category, key').all();
    const rows = res.results || [];
    const settingsMap = {};
    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });
    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      const tenantSettings = await c.env.DB.prepare('SELECT key, value FROM company_settings WHERE company_id = ?').bind(companyId).all().catch(() => ({ results: [] }));
      (tenantSettings.results || []).forEach((r) => {
        settingsMap[r.key] = r.value;
      });
    }

    return c.json({
      success: true,
      message: 'Cập nhật cài đặt doanh nghiệp thành công',
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
    const { companyId, isSuperAdmin } = await getTenantContext(c);

    let companyName = 'OMNI ASSETS';
    let planCode = 'TRIAL_2M';
    let licenseStatus = 'ACTIVE';
    let startDate = null;
    let expireDate = null;
    let isTrial = true;
    let isExpired = false;
    let daysRemaining = null;

    if (isSuperAdmin) {
      return c.json({
        success: true,
        data: {
          tier: 'SUPER_ADMIN',
          isDemo: false,
          isTrial: false,
          status: 'ACTIVE',
          plan_code: 'MASTER',
          plan_name: 'Quản Trị Nền Tảng Tối Cao',
          badge: 'Master Admin',
          expire_date: null,
          days_remaining: null,
          company_name: 'Hệ Thống Quản Trị Nền Tảng',
          companyName: 'Hệ Thống Quản Trị Nền Tảng',
          organization: 'Hệ Thống Quản Trị Nền Tảng',
          limits: {
            assets: { current: 0, max: 'UNLIMITED' },
            users: { current: 0, max: 'UNLIMITED' },
            contracts: { current: 0, max: 'UNLIMITED' },
            finance: { current: 0, max: 'UNLIMITED' },
            excelExport: true,
            unwatermarkedPrint: true
          }
        }
      });
    }

    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      const tenant = await c.env.DB
        .prepare('SELECT id, company_name, plan_code, license_status, start_date, expire_date FROM company_tenants WHERE id = ?')
        .bind(companyId)
        .first()
        .catch(() => null);

      if (tenant) {
        if (tenant.company_name) companyName = tenant.company_name;
        if (tenant.plan_code) planCode = tenant.plan_code;
        if (tenant.license_status) licenseStatus = tenant.license_status;
        startDate = tenant.start_date || null;
        expireDate = tenant.expire_date || null;
      }
    }

    // Tính toán hạn dùng và số ngày còn lại
    if (planCode === 'LIFETIME') {
      daysRemaining = null;
      expireDate = null;
      isTrial = false;
    } else if (expireDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expireDate);
      exp.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0 || licenseStatus === 'EXPIRED') {
        isExpired = true;
        licenseStatus = 'EXPIRED';
      }
    }

    // Tên gói & nhãn hiển thị trực quan
    let planName = 'Gói Dùng Thử 2 Tháng (Trial 60 Ngày)';
    let badge = 'Dùng Thử 60 Ngày';
    let tier = 'TRIAL';
    let isDemo = isExpired || planCode === 'DEMO';

    const isPaid = !isDemo && !isExpired && (planCode === 'ANNUAL_1Y' || planCode === 'ANNUAL_2Y' || planCode === 'LIFETIME');
    isTrial = !isDemo && !isExpired && planCode === 'TRIAL_2M';

    if (planCode === 'TRIAL_2M') {
      planName = 'Gói Dùng Thử 2 Tháng (Trial 60 Ngày)';
      badge = 'Dùng Thử 0đ (Hạn Chế Quyền)';
      tier = 'TRIAL';
    } else if (planCode === 'ANNUAL_1Y') {
      planName = 'Gói Tiêu Chuẩn 1 Năm';
      badge = 'Gói 1 Năm';
      tier = 'ANNUAL';
    } else if (planCode === 'ANNUAL_2Y') {
      planName = 'Gói Tiết Kiệm 2 Năm';
      badge = 'Gói 2 Năm';
      tier = 'ANNUAL';
    } else if (planCode === 'LIFETIME') {
      planName = 'Gói Vĩnh Viễn Trọn Đời';
      badge = 'Vĩnh Viễn (∞)';
      tier = 'ENTERPRISE';
      isDemo = false;
    } else {
      const planRow = await c.env.DB
        .prepare('SELECT name, badge FROM pricing_plans WHERE code = ?')
        .bind(planCode)
        .first()
        .catch(() => null);
      if (planRow) {
        planName = planRow.name;
        badge = planRow.badge || planCode;
      }
    }

    // Lấy key đã lưu (nếu có)
    const keyRecord = await c.env.DB
      .prepare("SELECT value FROM company_settings WHERE company_id = ? AND key = 'license_key'")
      .bind(companyId)
      .first()
      .catch(() => null);

    const [assetsCount, usersCount, contractsCount, financeCount, deptsCount] = await Promise.all([
      c.env.DB.prepare('SELECT count(*) as count FROM assets WHERE company_id = ?').bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM users WHERE company_id = ?').bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM contracts WHERE company_id = ?').bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM finance WHERE company_id = ?').bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM categories WHERE company_id = ? AND type = "DEPARTMENT"').bind(companyId).first().catch(() => ({ count: 0 }))
    ]);

    const maxAssets = isPaid ? 'UNLIMITED' : (isTrial ? 20 : 5);
    const maxUsers = isPaid ? 'UNLIMITED' : (isTrial ? 3 : 2);
    const maxContracts = isPaid ? 'UNLIMITED' : (isTrial ? 5 : 2);
    const maxFinance = isPaid ? 'UNLIMITED' : (isTrial ? 10 : 5);
    const maxDepartments = isPaid ? 'UNLIMITED' : 1;

    return c.json({
      success: true,
      data: {
        tier,
        isDemo,
        isTrial,
        isPaid,
        isExpired,
        status: licenseStatus,
        plan_code: planCode,
        plan_name: planName,
        badge,
        start_date: startDate,
        expire_date: expireDate,
        days_remaining: daysRemaining,
        company_id: companyId,
        company_name: companyName,
        companyName: companyName,
        organization: companyName,
        key: keyRecord?.value || (planCode === 'TRIAL_2M' ? 'TRIAL-60-DAYS' : planCode === 'LIFETIME' ? 'OMNI-LIFETIME' : ''),
        limits: {
          assets: { current: assetsCount?.count || 0, max: maxAssets },
          users: { current: usersCount?.count || 0, max: maxUsers },
          contracts: { current: contractsCount?.count || 0, max: maxContracts },
          finance: { current: financeCount?.count || 0, max: maxFinance },
          departments: { current: deptsCount?.count || 1, max: maxDepartments },
          excelExport: !isDemo,
          unwatermarkedPrint: isPaid,
          allowAutomatedEmails: isPaid,
          allowTelegram: isPaid,
          allowCustomStamp: isPaid,
          allowAdvancedBackup: isPaid
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

    const now = new Date().toISOString();
    const { companyId } = await getTenantContext(c);

    // 1. Kiểm tra trong bảng license_keys do Super Admin tạo
    const dbKey = await c.env.DB.prepare('SELECT * FROM license_keys WHERE license_key = ?').bind(cleanKey).first().catch(() => null);

    let planCode = 'LIFETIME';
    let planName = 'Gói Vĩnh Viễn Trọn Đời';
    let durationMonths = 120;

    if (dbKey) {
      if (dbKey.status === 'USED') {
        return c.json({ success: false, message: 'Mã bản quyền này đã được kích hoạt trước đó.' }, 400);
      }
      if (dbKey.status === 'REVOKED') {
        return c.json({ success: false, message: 'Mã bản quyền này đã bị thu hồi hoặc hết hiệu lực.' }, 400);
      }
      if (dbKey.company_id && companyId && dbKey.company_id !== companyId) {
        return c.json({ success: false, message: 'Mã bản quyền này được chỉ định riêng cho doanh nghiệp khác.' }, 403);
      }

      planCode = dbKey.plan_code || 'LIFETIME';
      planName = dbKey.plan_name || 'Bản Quyền Doanh Nghiệp';
      durationMonths = Number(dbKey.duration_months) || 12;

      // Đánh dấu key đã sử dụng
      await c.env.DB.prepare(`
        UPDATE license_keys 
        SET status = 'USED', company_id = ?, activated_at = datetime('now')
        WHERE id = ?
      `).bind(companyId, dbKey.id).run();
    } else {
      return c.json({
        success: false,
        message: 'Mã bản quyền không hợp lệ hoặc không tồn tại trên hệ thống. Vui lòng kiểm tra lại hoặc liên hệ Hotline/Zalo 0394264400 để được cấp mã kích hoạt.'
      }, 400);
    }

    // Tính ngày hết hạn
    let expireDateVal = '2099-12-31';
    if (planCode !== 'LIFETIME') {
      const d = new Date();
      d.setMonth(d.getMonth() + durationMonths);
      expireDateVal = d.toISOString().slice(0, 10);
    }

    // Kích hoạt bản quyền cho từng tenant độc lập
    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      await c.env.DB.prepare(`
        UPDATE company_tenants
        SET plan_code = ?, license_status = 'ACTIVE', expire_date = ?
        WHERE id = ?
      `).bind(planCode, expireDateVal, companyId).run();

      await c.env.DB.prepare(`
        INSERT INTO company_settings (company_id, key, value, updated_at)
        VALUES (?, 'license_tier', 'ENTERPRISE', ?),
               (?, 'license_key', ?, ?),
               (?, 'license_status', 'ACTIVE', ?),
               (?, 'license_activated_at', ?, ?)
        ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(companyId, now, companyId, cleanKey, now, companyId, now, companyId, now, now).run().catch(() => {});
    }

    // Cập nhật cấu hình hệ thống
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
      message: `🎉 Kích hoạt thành công ${planName}! Mọi chức năng đã được mở khóa toàn diện.`,
      data: {
        tier: 'ENTERPRISE',
        plan_code: planCode,
        isDemo: false,
        key: cleanKey,
        activatedAt: now,
        expire_date: expireDateVal
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/license/reset-demo', async (c) => {
  try {
    const now = new Date().toISOString();
    const { companyId } = await getTenantContext(c);

    if (companyId && companyId !== 'ALL' && companyId !== 'SYSTEM') {
      await c.env.DB.prepare(`
        UPDATE company_tenants
        SET plan_code = 'DEMO', license_status = 'EXPIRED'
        WHERE id = ?
      `).bind(companyId).run();

      await c.env.DB.prepare(`
        INSERT INTO company_settings (company_id, key, value, updated_at)
        VALUES (?, 'license_tier', 'DEMO', ?),
               (?, 'license_key', '', ?)
        ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(companyId, now, companyId, now).run().catch(() => {});
    }

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

// ==========================================
// 10.6 EMAIL SERVICE API ENDPOINTS
// ==========================================

// 1. Gửi email kiểm tra kết nối (Test Email)
app.post('/api/mail/test', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    let targetEmail = (body.email || '').trim();

    // Nếu không nhập email, tìm email quản trị viên hoặc company_email
    if (!targetEmail) {
      const compTenant = await c.env.DB.prepare('SELECT admin_email, company_name FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
      targetEmail = compTenant?.admin_email;
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      return c.json({ success: false, message: 'Vui lòng cung cấp địa chỉ email hợp lệ để nhận thử nghiệm.' }, 400);
    }

    const config = await getEmailConfig(c.env.DB, companyId);
    const compTenant = await c.env.DB.prepare('SELECT company_name FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || config.senderName || 'OMNI ASSETS & LOGISTICS';

    const testHtml = getTestEmailHtml({
      companyName,
      provider: config.provider,
      recipientEmail: targetEmail
    });

    const sendRes = await sendEmail({
      db: c.env.DB,
      companyId,
      senderType: 'support',
      replyTo: 'hieupham101097@gmail.com',
      to: targetEmail,
      subject: `[OMNI ASSETS] Kiểm tra cấu hình gửi mail thành công (${config.provider.toUpperCase()})`,
      html: testHtml
    });

    return c.json({
      success: true,
      message: `Đã gửi thành công email thử nghiệm đến ${targetEmail} qua ${config.provider.toUpperCase()} (Hòm thư: support@omniassets.ryug.id.vn)!`,
      data: {
        provider: config.provider,
        recipient: targetEmail,
        id: sendRes.id || sendRes.messageId,
        mailbox: sendRes.mailbox,
        from: sendRes.from,
        replyTo: sendRes.replyTo
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi gửi mail: ${err.message}` }, 500);
  }
});

// 2. Gửi phiếu chấm công tháng đến email nhân sự (Hòm thư: attendance@omniassets.ryug.id.vn)
app.post('/api/mail/send-timesheet', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const {
      email,
      user_name,
      month,
      totalDaysWorked = 0,
      totalHours = 0,
      standardWorkDays = 0,
      onTimeDays = 0,
      lateDays = 0,
      lateMinutes = 0,
      punctualityRate = 100,
      notes = ''
    } = body;

    const targetEmail = (email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return c.json({ success: false, message: 'Nhân viên này chưa có địa chỉ email hợp lệ.' }, 400);
    }

    const compTenant = await c.env.DB.prepare('SELECT company_name FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || 'OMNI ASSETS & LOGISTICS';

    const timesheetHtml = getTimesheetEmailHtml({
      companyName,
      userName: user_name || 'Nhân viên',
      month: month || new Date().toISOString().slice(0, 7),
      totalDaysWorked,
      totalHours,
      standardWorkDays,
      onTimeDays,
      lateDays,
      lateMinutes,
      punctualityRate,
      notes
    });

    const sendRes = await sendEmail({
      db: c.env.DB,
      companyId,
      senderType: 'attendance',
      to: targetEmail,
      subject: `[${companyName}] Phiếu tổng hợp chấm công tháng ${month} - ${user_name}`,
      html: timesheetHtml
    });

    return c.json({
      success: true,
      message: `Đã gửi phiếu chấm công tháng ${month} đến email ${targetEmail}!`,
      data: sendRes
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi gửi email phiếu công: ${err.message}` }, 500);
  }
});

// 3. Gửi bản tin nhắc hạn vận hành 6:00 AM (Hòm thư: reports@omniassets.ryug.id.vn)
app.post('/api/mail/send-daily-reminders', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

    const mailConfig = await getEmailConfig(c.env.DB, companyId);
    let targetEmails = [];
    if (body.email && String(body.email).trim()) {
      targetEmails = String(body.email).split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'));
    } else if (mailConfig.reportRecipients && mailConfig.reportRecipients.trim()) {
      targetEmails = mailConfig.reportRecipients.split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'));
    }

    const compTenant = await c.env.DB.prepare('SELECT company_name, admin_email FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
    if (targetEmails.length === 0 && compTenant?.admin_email) {
      targetEmails = [compTenant.admin_email.trim().toLowerCase()];
    }

    if (targetEmails.length === 0) {
      return c.json({ success: false, message: 'Chưa có email nào trong danh sách nhận thông báo nhắc hạn. Vui lòng thiết lập danh sách email nhận báo cáo.' }, 400);
    }

    const [overdueTasks, upcomingContracts, expiredContracts] = await Promise.all([
      c.env.DB.prepare("SELECT title, assignee, due_date FROM tasks WHERE (company_id = ? OR company_id IS NULL) AND status != 'COMPLETED' AND due_date < ? ORDER BY due_date ASC LIMIT 10").bind(companyId, today).all().catch(() => ({ results: [] })),
      c.env.DB.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE (company_id = ? OR company_id IS NULL) AND status = 'ACTIVE' AND end_date <= date('now', '+30 day') ORDER BY end_date ASC LIMIT 10").bind(companyId).all().catch(() => ({ results: [] })),
      c.env.DB.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE (company_id = ? OR company_id IS NULL) AND status = 'EXPIRED' ORDER BY end_date DESC LIMIT 10").bind(companyId).all().catch(() => ({ results: [] }))
    ]);

    const companyName = compTenant?.company_name || 'OMNIASSETS';
    const mailHtml = getDailyRemindersEmailHtml({
      companyName,
      date: today,
      overdueTasks: overdueTasks.results || [],
      upcomingContracts: upcomingContracts.results || [],
      expiredContracts: expiredContracts.results || [],
      dashboardUrl: 'https://company-sheet.hieupham101097.workers.dev'
    });

    const sentResults = [];
    for (const email of targetEmails) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId,
          senderType: 'reports',
          to: email,
          subject: `[Nhắc Hạn Vận Hành 06:00 AM] Báo cáo tiến độ ngày ${today} - ${companyName}`,
          html: mailHtml
        });
        sentResults.push(email);
      } catch (err) {
        console.error(`Error sending reminder to ${email}:`, err.message);
      }
    }

    return c.json({
      success: true,
      message: `Đã gửi báo cáo nhắc hạn thành công đến ${sentResults.length}/${targetEmails.length} email (${sentResults.join(', ')})!`,
      data: { sentCount: sentResults.length, recipients: sentResults }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi gửi bản tin nhắc hạn: ${err.message}` }, 500);
  }
});

// 4. Trung tâm Soạn & Phát Email (Broadcast / Direct Email)
app.post('/api/mail/broadcast', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const {
      recipient_type = 'SINGLE', // 'SINGLE', 'ALL', 'DEPARTMENT'
      target_email,
      target_department,
      subject,
      content,
      urgency = 'NORMAL', // 'NORMAL', 'URGENT', 'ANNOUNCEMENT'
      sender_type = 'tasks' // 'tasks' | 'attendance' | 'assets' | 'contracts' | 'reports' | 'notifications'
    } = body;

    if (!subject || !subject.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập tiêu đề email' }, 400);
    }
    if (!content || !content.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập nội dung thông báo email' }, 400);
    }

    const compTenant = await c.env.DB.prepare('SELECT company_name, admin_email FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || 'OMNI ASSETS & LOGISTICS';

    let recipients = [];
    if (recipient_type === 'SINGLE') {
      const email = (target_email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return c.json({ success: false, message: 'Vui lòng nhập địa chỉ email người nhận hợp lệ' }, 400);
      }
      recipients = [email];
    } else if (recipient_type === 'DEPARTMENT') {
      if (!target_department || !target_department.trim()) {
        return c.json({ success: false, message: 'Vui lòng chọn phòng ban nhận thư' }, 400);
      }
      const users = await c.env.DB.prepare('SELECT email FROM users WHERE (company_id = ? OR company_id IS NULL) AND department = ? AND status = "ACTIVE" AND email LIKE "%@%"').bind(companyId, target_department.trim()).all().catch(() => ({ results: [] }));
      recipients = (users.results || []).map(u => (u.email || '').trim().toLowerCase());
    } else {
      // ALL
      const users = await c.env.DB.prepare('SELECT email FROM users WHERE (company_id = ? OR company_id IS NULL) AND status = "ACTIVE" AND email LIKE "%@%"').bind(companyId).all().catch(() => ({ results: [] }));
      recipients = (users.results || []).map(u => (u.email || '').trim().toLowerCase());
    }

    // Filter unique
    recipients = Array.from(new Set(recipients)).filter(e => e && e.includes('@'));

    if (recipients.length === 0) {
      return c.json({ success: false, message: 'Không tìm thấy người nhận nào phù hợp với danh sách chọn' }, 400);
    }

    const mailHtml = getBroadcastEmailHtml({
      companyName,
      subject: subject.trim(),
      content: content.trim(),
      urgency,
      dashboardUrl: 'https://company-sheet.hieupham101097.workers.dev'
    });

    const chosenSenderType = SENDER_MAILBOXES[sender_type] ? sender_type : 'tasks';

    const sentList = [];
    const failedList = [];

    for (const email of recipients) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId,
          senderType: chosenSenderType,
          to: email,
          subject: `[${companyName}] ${subject.trim()}`,
          html: mailHtml
        });
        sentList.push(email);
      } catch (err) {
        failedList.push({ email, error: err.message });
      }
    }

    return c.json({
      success: true,
      message: `Đã phát email thành công đến ${sentList.length}/${recipients.length} người nhận!`,
      data: {
        total: recipients.length,
        sentCount: sentList.length,
        failedCount: failedList.length,
        sentList,
        failedList
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi phát email: ${err.message}` }, 500);
  }
});

// Helper khởi tạo bảng support_tickets
async function initSupportTicketsTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        company_id TEXT,
        company_name TEXT,
        sender_name TEXT,
        sender_email TEXT,
        sender_phone TEXT,
        subject TEXT,
        message TEXT,
        status TEXT DEFAULT 'PENDING',
        reply_message TEXT,
        replied_at TEXT,
        replied_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (e) {
    console.error('Init support_tickets table error:', e.message);
  }
}

// 5. Gửi Yêu Cầu Hỗ Trợ Kỹ Thuật & Vận Hành Về Ban Quản Trị Hệ Thống
app.post('/api/mail/send-support', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const {
      sender_name,
      sender_email,
      sender_phone,
      company_name,
      subject = 'Yêu cầu hỗ trợ hệ thống OMNI ASSETS',
      message
    } = body;

    if (!message || !message.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập nội dung cần hỗ trợ' }, 400);
    }

    const cleanSenderEmail = (sender_email || '').trim().toLowerCase();

    const compTenant = await c.env.DB.prepare('SELECT company_name FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
    const effectiveCompName = company_name || compTenant?.company_name || 'Doanh Nghiệp OMNI ASSETS';

    await initSupportTicketsTable(c.env.DB);

    const ticketId = 'ticket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await c.env.DB.prepare(`
      INSERT INTO support_tickets (id, company_id, company_name, sender_name, sender_email, sender_phone, subject, message, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))
    `).bind(ticketId, companyId || 'TENANT', effectiveCompName, sender_name || 'Quản lý', cleanSenderEmail, sender_phone || '', subject, message).run();

    const supportHtml = `
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:18px; margin-bottom:16px;">
        <h3 style="margin:0 0 8px 0; color:#15803d; font-size:16px;">📩 YÊU CẦU HỖ TRỢ / LIÊN HỆ TỪ DOANH NGHIỆP</h3>
        <p style="margin:4px 0; font-size:13px;"><strong>Mã Ticket:</strong> <code style="background:#dcfce7; padding:2px 6px; border-radius:4px; font-weight:bold;">${ticketId}</code></p>
        <p style="margin:4px 0; font-size:13px;"><strong>Doanh nghiệp:</strong> ${effectiveCompName}</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Người liên hệ:</strong> ${sender_name || 'Quản lý'}</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Email gửi:</strong> <a href="mailto:${cleanSenderEmail}">${cleanSenderEmail || 'Chưa cung cấp'}</a></p>
        <p style="margin:4px 0; font-size:13px;"><strong>Số điện thoại:</strong> ${sender_phone || 'Chưa cung cấp'}</p>
      </div>
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px;">
        <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:14px;">Nội dung yêu cầu hỗ trợ:</h4>
        <p style="white-space:pre-wrap; color:#334155; line-height:1.6; font-size:14px; margin:0;">${message}</p>
      </div>
      <p style="font-size:12px; color:#64748b; margin-top:16px;">
        ℹ️ Yêu cầu này đã được đồng bộ vào <strong>Cổng Quản Trị Hệ Thống (Super Admin Portal - Hòm Thư Hỗ Trợ)</strong>. Bạn có thể mở hệ thống để phản hồi trực tiếp cho khách hàng.
      </p>
    `;

    // Thông báo cho Super Admin qua email
    const notifyAdmins = ['adminManager@gmail.com', 'hieupham101097@gmail.com'];
    for (const adminEmail of notifyAdmins) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId: 'SYSTEM',
          senderType: 'support',
          to: adminEmail,
          replyTo: cleanSenderEmail || 'support@omniassets.ryug.id.vn',
          subject: `[OMNI ASSETS SUPPORT] ${subject} - ${effectiveCompName}`,
          html: wrapEmailHtml({
            title: 'Yêu Cầu Hỗ Trợ Kỹ Thuật & Vận Hành',
            preheader: `Yêu cầu hỗ trợ từ ${effectiveCompName}: ${subject}`,
            contentHtml: supportHtml
          })
        });
      } catch (err) {
        console.error('Send admin support notify error:', err.message);
      }
    }

    return c.json({
      success: true,
      message: 'Yêu cầu hỗ trợ đã được chuyển thành công đến Ban Quản Trị OMNI ASSETS! Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất.',
      data: { ticketId }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi gửi hỗ trợ: ${err.message}` }, 500);
  }
});

// 5.6 Super Admin Support Desk: Lấy danh sách yêu cầu hỗ trợ (Support Tickets)
app.get('/api/super-admin/support-tickets', async (c) => {
  try {
    const { isSuperAdmin, role, email } = await getTenantContext(c);
    if (!isSuperAdmin && role !== 'SUPER_ADMIN' && email !== 'adminManager@gmail.com') {
      return c.json({ success: false, message: 'Chỉ Super Admin mới có quyền truy cập hòm thư hỗ trợ' }, 403);
    }

    await initSupportTicketsTable(c.env.DB);

    const res = await c.env.DB.prepare(`
      SELECT * FROM support_tickets 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all().catch(() => ({ results: [] }));

    return c.json({
      success: true,
      data: res.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi tải danh sách yêu cầu hỗ trợ: ${err.message}` }, 500);
  }
});

// 5.7 Super Admin Support Desk: Phản hồi trực tiếp yêu cầu hỗ trợ (Reply Ticket via support@omniassets.ryug.id.vn)
app.post('/api/super-admin/support-tickets/reply', async (c) => {
  try {
    const { isSuperAdmin, role, email } = await getTenantContext(c);
    if (!isSuperAdmin && role !== 'SUPER_ADMIN' && email !== 'adminManager@gmail.com') {
      return c.json({ success: false, message: 'Chỉ Super Admin mới có quyền phản hồi yêu cầu hỗ trợ' }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const { ticketId, replyMessage } = body;

    if (!ticketId) {
      return c.json({ success: false, message: 'Thiếu mã ticket' }, 400);
    }
    if (!replyMessage || !replyMessage.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập nội dung thư phản hồi' }, 400);
    }

    await initSupportTicketsTable(c.env.DB);

    const ticket = await c.env.DB.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(ticketId).first().catch(() => null);
    if (!ticket) {
      return c.json({ success: false, message: 'Không tìm thấy yêu cầu hỗ trợ này' }, 404);
    }

    const recipientEmail = (ticket.sender_email || '').trim().toLowerCase();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return c.json({ success: false, message: 'Email người nhận không hợp lệ trong ticket này' }, 400);
    }

    const replySubject = `[OMNI ASSETS SUPPORT] Phản Hồi: ${ticket.subject || 'Yêu cầu hỗ trợ hệ thống'}`;

    const replyContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-success" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; padding:6px 16px; font-size:11px; font-weight:700; border-radius:9999px;">
          ✓ THƯ PHẢN HỒI CHÍNH THỨC TỪ BAN QUẢN TRỊ
        </span>
      </div>

      <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
        Kính gửi Quý Doanh nghiệp ${ticket.company_name} (${ticket.sender_name || 'Quản lý'}),
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0 0 16px 0;">
        Ban Quản Trị Hệ Thống OMNI ASSETS trân trọng gửi thư phản hồi về yêu cầu hỗ trợ của bạn liên quan đến vấn đề: <strong>"${ticket.subject || 'Hỗ trợ kỹ thuật'}"</strong>.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 12px; padding: 18px 22px; margin: 18px 0;">
        <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 700;">Nội dung phản hồi từ Chuyên viên Hỗ trợ:</h4>
        <p style="white-space: pre-wrap; font-size: 14px; color: #1e293b; line-height: 1.7; margin: 0;">${replyMessage.trim()}</p>
      </div>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin-top: 20px; font-size: 12px; color: #64748b; border: 1px dashed #cbd5e1;">
        <p style="margin: 0 0 4px 0; font-weight: 700; color: #475569;">Trích dẫn nội dung yêu cầu ban đầu của bạn:</p>
        <p style="margin: 0; white-space: pre-wrap; font-style: italic;">"${ticket.message}"</p>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 22px;">
        Nếu bạn cần thêm bất kỳ trợ giúp nào, bạn có thể trả lời trực tiếp email này hoặc liên hệ lại với chúng tôi qua <a href="mailto:support@omniassets.ryug.id.vn" style="color: #059669; font-weight: 600; text-decoration: none;">support@omniassets.ryug.id.vn</a>.
      </p>
    `;

    // Gửi email chính thức từ support@omniassets.ryug.id.vn
    await sendEmail({
      db: c.env.DB,
      companyId: 'SYSTEM',
      senderType: 'support',
      senderName: 'OMNI ASSETS Support',
      to: recipientEmail,
      replyTo: 'support@omniassets.ryug.id.vn',
      subject: replySubject,
      html: wrapEmailHtml({
        title: 'Phản Hồi Yêu Cầu Hỗ Trợ Kỹ Thuật',
        preheader: `Phản hồi từ OMNI ASSETS: ${ticket.subject}`,
        contentHtml: replyContent
      })
    });

    // Cập nhật ticket thành REPLIED
    await c.env.DB.prepare(`
      UPDATE support_tickets 
      SET status = 'REPLIED', reply_message = ?, replied_at = datetime('now'), replied_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(replyMessage.trim(), email || 'adminManager@gmail.com', ticketId).run();

    return c.json({
      success: true,
      message: `Đã gửi thư phản hồi chính thức thành công đến ${recipientEmail}!`,
      data: { ticketId, status: 'REPLIED' }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi phản hồi yêu cầu hỗ trợ: ${err.message}` }, 500);
  }
});

// 5.5 Gửi Thông Báo Nội Bộ Cho Cấp Quản Lý Trong Doanh Nghiệp
// Hòm thư gửi nội bộ: tasks@omniassets.ryug.id.vn (Quản Lý & Vận Hành Doanh Nghiệp)
app.post('/api/mail/send-management-notification', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const { subject, message, sender_name } = body;

    // 1. Lấy thông tin công ty
    const compTenant = await c.env.DB.prepare('SELECT company_name, admin_email FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || 'Doanh Nghiệp';

    // 2. Tìm tất cả user có role là ADMIN, MANAGER trong công ty đó
    let usersQuery = `
      SELECT id, name, email, role, department 
      FROM users 
      WHERE (company_id = ? OR company_id IS NULL)
        AND (role = 'ADMIN' OR role = 'MANAGER')
        AND status != 'INACTIVE'
        AND email LIKE '%@%'
    `;
    const usersRes = await c.env.DB.prepare(usersQuery).bind(companyId).all().catch(() => ({ results: [] }));
    const managers = usersRes.results || [];

    // Danh sách email
    let recipientEmails = managers.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
    if (compTenant?.admin_email && compTenant.admin_email.includes('@')) {
      recipientEmails.push(compTenant.admin_email.trim().toLowerCase());
    }

    // Lọc trùng
    recipientEmails = Array.from(new Set(recipientEmails)).filter(e => e && e.includes('@'));

    if (recipientEmails.length === 0) {
      return c.json({
        success: false,
        message: 'Không tìm thấy tài khoản Quản Trị Viên (ADMIN) hoặc Quản Lý (MANAGER) có email hợp lệ trong doanh nghiệp.'
      }, 400);
    }

    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const finalSubject = (subject || `[Thông Báo Nội Bộ] Cập nhật điều hành & phân quyền phòng ban (${companyName})`).trim();
    const managerNames = managers.map(u => `${u.name} (${u.role})`);

    const mailHtml = getManagementNotificationEmailHtml({
      companyName,
      subject: finalSubject,
      message: message || 'Ban Điều Hành thông báo: Đã cập nhật và đồng bộ cấu hình phân quyền, danh mục và quy chế vận hành cho toàn bộ phòng ban trong doanh nghiệp.',
      senderName: sender_name || 'Ban Quản Trị Doanh Nghiệp',
      timestamp,
      managerNames,
      dashboardUrl: 'https://company-sheet.hieupham101097.workers.dev'
    });

    const sentList = [];
    const failedList = [];

    for (const email of recipientEmails) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId,
          senderType: 'tasks',
          to: email,
          subject: finalSubject,
          html: mailHtml
        });
        sentList.push(email);
      } catch (err) {
        failedList.push({ email, error: err.message });
      }
    }

    return c.json({
      success: true,
      message: `Đã gửi email thông báo nội bộ thành công đến ${sentList.length}/${recipientEmails.length} cán bộ Admin & Manager!`,
      data: {
        total: recipientEmails.length,
        sentCount: sentList.length,
        failedCount: failedList.length,
        from: 'tasks@omniassets.ryug.id.vn',
        sentList,
        failedList
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi gửi email nội bộ: ${err.message}` }, 500);
  }
});

// ========================================================
// SUPER ADMIN EXCLUSIVE: THÔNG BÁO GÓI DỊCH VỤ & NỀN TẢNG
// Hòm thư đại diện: notifications@omniassets.ryug.id.vn / support@omniassets.ryug.id.vn
// Người gửi: Super Admin (adminManager@gmail.com)
// Người nhận: Toàn bộ Admin & Manager của tất cả doanh nghiệp khách hàng
// ========================================================

// 1. Thống kê & Danh sách đối tượng nhận thư cho Super Admin
app.get('/api/super-admin/announcements/recipients', async (c) => {
  try {
    const { isSuperAdmin, userId } = await getTenantContext(c);
    const u = userId ? await c.env.DB.prepare('SELECT role, email FROM users WHERE id = ?').bind(userId).first().catch(() => null) : null;
    const isSuper = isSuperAdmin || u?.role === 'SUPER_ADMIN' || u?.email === 'adminManager@gmail.com';
    if (!isSuper) {
      return c.json({ success: false, message: 'Quyền truy cập bị từ chối: Chỉ Super Admin (adminManager@gmail.com) mới có quyền truy cập.' }, 403);
    }

    // Lấy tất cả công ty khách hàng
    const compRes = await c.env.DB.prepare('SELECT id, company_name, admin_name, admin_email, plan_code, license_status FROM company_tenants ORDER BY created_at DESC').all().catch(() => ({ results: [] }));
    const companies = compRes.results || [];

    // Lấy tất cả users có role ADMIN hoặc MANAGER trên toàn hệ thống
    const usersRes = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.company_id, c.company_name
      FROM users u
      LEFT JOIN company_tenants c ON u.company_id = c.id
      WHERE (u.role = 'ADMIN' OR u.role = 'MANAGER')
        AND u.status != 'INACTIVE'
        AND u.email LIKE '%@%'
      ORDER BY c.company_name, u.role, u.name
    `).all().catch(() => ({ results: [] }));
    const managers = usersRes.results || [];

    // Nhóm theo từng công ty
    const companyMap = {};
    companies.forEach(comp => {
      companyMap[comp.id] = {
        id: comp.id,
        company_name: comp.company_name,
        plan_code: comp.plan_code,
        license_status: comp.license_status,
        recipients: []
      };
      if (comp.admin_email && comp.admin_email.includes('@')) {
        companyMap[comp.id].recipients.push({
          email: comp.admin_email.trim().toLowerCase(),
          name: comp.admin_name || 'Quản Trị Viên',
          role: 'ADMIN'
        });
      }
    });

    managers.forEach(m => {
      const cId = m.company_id || 'comp_1';
      if (!companyMap[cId]) {
        companyMap[cId] = {
          id: cId,
          company_name: m.company_name || 'Doanh Nghiệp',
          plan_code: 'TRIAL_2M',
          license_status: 'ACTIVE',
          recipients: []
        };
      }
      const cleanEmail = (m.email || '').trim().toLowerCase();
      if (!companyMap[cId].recipients.some(r => r.email === cleanEmail)) {
        companyMap[cId].recipients.push({
          email: cleanEmail,
          name: m.name,
          role: m.role,
          department: m.department
        });
      }
    });

    const allDistinctEmails = new Set();
    Object.values(companyMap).forEach(c => {
      c.recipients.forEach(r => allDistinctEmails.add(r.email));
    });

    return c.json({
      success: true,
      data: {
        totalCompanies: companies.length,
        totalRecipients: allDistinctEmails.size,
        distinctEmails: Array.from(allDistinctEmails),
        companyList: Object.values(companyMap)
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 2. Phát thông báo gói dịch vụ / nền tảng từ notifications@omniassets.ryug.id.vn
app.post('/api/super-admin/announcements/broadcast', async (c) => {
  try {
    const { isSuperAdmin, userId } = await getTenantContext(c);
    const u = userId ? await c.env.DB.prepare('SELECT role, email FROM users WHERE id = ?').bind(userId).first().catch(() => null) : null;
    const isSuper = isSuperAdmin || u?.role === 'SUPER_ADMIN' || u?.email === 'adminManager@gmail.com';
    if (!isSuper) {
      return c.json({ success: false, message: 'Quyền truy cập bị từ chối: Chỉ Super Admin (adminManager@gmail.com) mới có quyền sử dụng hòm thư nền tảng.' }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const {
      sender_type = 'notifications', // 'notifications' | 'support'
      target_type = 'ALL_COMPANIES', // 'ALL_COMPANIES' | 'SINGLE_COMPANY'
      target_company_id = null,
      subject,
      message,
      include_plans = true,
      cta_text,
      cta_url
    } = body;

    // Lựa chọn hòm thư gửi hợp lệ
    const mailboxKey = (sender_type === 'support') ? 'support' : 'notifications';
    const senderEmail = mailboxKey === 'support' ? 'support@omniassets.ryug.id.vn' : 'notifications@omniassets.ryug.id.vn';
    const senderName = mailboxKey === 'support' ? 'OmniAssets Customer Support' : 'OmniAssets Platform Announcements';

    // Lấy danh sách gói cước nếu include_plans
    let plans = [];
    if (include_plans) {
      const planRes = await c.env.DB.prepare('SELECT code, name, duration_months, price, badge FROM pricing_plans WHERE is_active = 1 ORDER BY price ASC').all().catch(() => ({ results: [] }));
      plans = planRes.results || [];
    }

    // Xác định danh sách email nhận
    let recipientEmails = [];
    let targetName = 'Toàn Bộ Khách Hàng';

    if (target_type === 'SINGLE_COMPANY' && target_company_id) {
      const comp = await c.env.DB.prepare('SELECT company_name, admin_email FROM company_tenants WHERE id = ?').bind(target_company_id).first().catch(() => null);
      if (comp) targetName = comp.company_name;
      if (comp?.admin_email && comp.admin_email.includes('@')) {
        recipientEmails.push(comp.admin_email.trim().toLowerCase());
      }
      const usersRes = await c.env.DB.prepare(`
        SELECT email FROM users 
        WHERE company_id = ? AND (role = 'ADMIN' OR role = 'MANAGER') AND status != 'INACTIVE' AND email LIKE '%@%'
      `).bind(target_company_id).all().catch(() => ({ results: [] }));
      (usersRes.results || []).forEach(r => recipientEmails.push((r.email || '').trim().toLowerCase()));
    } else {
      // Toàn bộ công ty trên hệ sinh thái
      const compRes = await c.env.DB.prepare('SELECT admin_email FROM company_tenants WHERE admin_email LIKE "%@%"').all().catch(() => ({ results: [] }));
      (compRes.results || []).forEach(r => recipientEmails.push((r.admin_email || '').trim().toLowerCase()));

      const usersRes = await c.env.DB.prepare(`
        SELECT email FROM users 
        WHERE (role = 'ADMIN' OR role = 'MANAGER') AND status != 'INACTIVE' AND email LIKE '%@%'
      `).all().catch(() => ({ results: [] }));
      (usersRes.results || []).forEach(r => recipientEmails.push((r.email || '').trim().toLowerCase()));
    }

    // Loại trừ email của Super Admin và lọc trùng
    recipientEmails = Array.from(new Set(recipientEmails)).filter(e => e && e.includes('@') && e !== 'adminmanager@gmail.com');

    if (recipientEmails.length === 0) {
      return c.json({ success: false, message: 'Không tìm thấy email Quản trị viên/Quản lý nào trong phạm vi gửi.' }, 400);
    }

    const finalSubject = subject ? subject.trim() : '[OmniAssets] Cập Nhật Gói Cước Dịch Vụ & Ưu Đãi Bản Quyền Doanh Nghiệp';
    const finalMessage = message ? message.trim() : 'Ban Quản Trị Nền Tảng trân trọng gửi thông báo về bảng gói cước dịch vụ và các tính năng mới đã được triển khai trên hệ thống.';

    const mailHtml = getSuperAdminPlanAnnouncementEmailHtml({
      subject: finalSubject,
      message: finalMessage,
      plans,
      ctaText: cta_text || 'Khám Phá Bảng Giá & Nâng Cấp Gói',
      ctaUrl: cta_url || 'https://company-sheet.hieupham101097.workers.dev',
      senderEmail,
      recipientName: targetName
    });

    const sentList = [];
    const failedList = [];

    for (const email of recipientEmails) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId: 'SYSTEM',
          senderType: mailboxKey,
          senderName,
          to: email,
          subject: finalSubject,
          html: mailHtml
        });
        sentList.push(email);
      } catch (err) {
        failedList.push({ email, error: err.message });
      }
    }

    return c.json({
      success: true,
      message: `Đã phát thông báo thành công qua Resend (${senderEmail}) đến ${sentList.length}/${recipientEmails.length} cán bộ Quản lý trên hệ sinh thái!`,
      data: {
        total: recipientEmails.length,
        sentCount: sentList.length,
        failedCount: failedList.length,
        sender: senderEmail,
        sentList,
        failedList
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `Lỗi phát thông báo: ${err.message}` }, 500);
  }
});

// 6. Lấy danh sách 7 hộp thư nghiệp vụ chuẩn (Mailbox Directory)
app.get('/api/mail/templates', async (c) => {
  return c.json({
    success: true,
    data: Object.values(SENDER_MAILBOXES)
  });
});

// ========================
// 11. AI MASCOT ASSISTANT
// ========================
app.post('/api/ai/chat', async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const { message, activeTab, userRole, userName } = await c.req.json().catch(() => ({}));
    const q = (message || '').toLowerCase().trim();

    // Query live context strictly for this tenant
    const [assetsCount, tasksRes, tenantComp, tenantSettingsRes, sysSettingsRes] = await Promise.all([
      c.env.DB.prepare('SELECT count(*) as count, sum(CASE WHEN status="MAINTENANCE" THEN 1 ELSE 0 END) as maint_count FROM assets WHERE company_id = ?').bind(companyId).first().catch(() => null),
      c.env.DB.prepare('SELECT title, due_date, status, priority FROM tasks WHERE company_id = ? AND status != "COMPLETED" ORDER BY due_date ASC LIMIT 5').bind(companyId).all().catch(() => ({ results: [] })),
      c.env.DB.prepare('SELECT company_name FROM company_tenants WHERE id = ?').bind(companyId).first().catch(() => null),
      c.env.DB.prepare('SELECT key, value FROM company_settings WHERE company_id = ?').bind(companyId).all().catch(() => ({ results: [] })),
      c.env.DB.prepare('SELECT key, value FROM system_settings').all().catch(() => ({ results: [] }))
    ]);

    const settingsMap = {};
    (sysSettingsRes?.results || []).forEach((r) => { settingsMap[r.key] = r.value; });
    (tenantSettingsRes?.results || []).forEach((r) => { settingsMap[r.key] = r.value; });

    const compName = tenantComp?.company_name || settingsMap.company_name || (companyId === 'comp_1' ? 'OMNI ASSETS & LOGISTICS' : 'Doanh Nghiệp');
    const workStart = settingsMap.work_start_time || '08:30';
    const workEnd = settingsMap.work_end_time || '17:30';
    const graceMin = settingsMap.late_grace_minutes || '15';
    const workDays = settingsMap.work_days || 'Thứ 2 - Thứ 6';

    const geminiApiKey = (settingsMap.gemini_api_key || c.env?.GEMINI_API_KEY || '').trim();
    const geminiModel = (settingsMap.gemini_model || c.env?.GEMINI_MODEL || 'gemini-flash-latest').trim();

    // Lấy ngày giờ hiện tại theo giờ Việt Nam
    const nowVN = new Date();
    const currentDateStr = nowVN.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
    const currentTimeStr = nowVN.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

    // System Prompt for Gemini with live corporate context of this tenant
    const systemPrompt = `Bạn là Trợ lý AI thông minh, linh hoạt, thân thiện và am hiểu sâu sắc của hệ thống quản lý doanh nghiệp ${compName}.
Nhiệm vụ của bạn là tư vấn, giải đáp mọi thắc mắc và hướng dẫn người dùng xử lý công việc hiệu quả trên trang web này.

Bối cảnh thời gian & hệ thống thực tế của doanh nghiệp ${compName}:
- Thời gian hiện tại: ${currentTimeStr}, ${currentDateStr} (Giờ Việt Nam GMT+7).
- Tên doanh nghiệp: ${compName}
- Người đang trò chuyện: ${userName || 'Nhân sự'} (Vai trò hệ thống: ${userRole || 'STAFF'})
- Tab người dùng đang đứng: '${activeTab || 'dashboard'}'
- Quy định giờ làm việc: Vào ca lúc ${workStart}, Tan ca lúc ${workEnd}, Ân hạn đi muộn ${graceMin} phút, Lịch làm việc ${workDays}.
- Tài sản của công ty: Đang quản lý ${assetsCount?.count || 0} tài sản (${assetsCount?.maint_count || 0} thiết bị đang bảo trì).
- Công việc của công ty: Có ${tasksRes?.results?.length || 0} công việc đang theo dõi trong hệ thống.
- Các phân hệ trên trang web:
  1. 'dashboard' (Tổng quan): Bảng điều khiển tài sản, thu chi, cảnh báo nhắc hạn của doanh nghiệp.
  2. 'assets' (Tài sản & Thiết bị): Quản lý máy móc, cấp phát, bảo trì, serial thiết bị.
  3. 'finance' (Doanh thu & Chi phí): Dòng tiền thu chi, lợi nhuận ròng.
  4. 'tasks' (Công việc & Phân công): Giao việc theo phòng ban, hạn chót, nhắc hạn tự động 06:00 sáng.
  5. 'contracts' (Hợp đồng & Biên bản): Hợp đồng đối tác, Lập & In Biên bản bàn giao chuẩn A4.
  6. 'attendance' (Chấm công): Check-in, Check-out 1 lần/ngày, tính giờ làm, phạt đi muộn.
  7. 'users' (Quản lý Nhân sự & Phòng ban): Danh sách nhân viên, gán phòng ban, phân quyền (ADMIN, MANAGER, STAFF).
  8. 'categories' (Quản lý Danh mục): Quản lý danh mục phòng ban doanh nghiệp, loại tài sản, thu chi.
  9. 'settings' (Cài đặt hệ thống): Giờ làm việc, ân hạn đi muộn, hotline, thông tin doanh nghiệp.

Phong cách phản hồi của AI:
- Bạn là trí tuệ nhân tạo thực sự của ${compName}, tư duy sắc sảo, tự nhiên, hiểu ngữ cảnh và trả lời trực tiếp vào trọng tâm câu hỏi.
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
        candidateModels: ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
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

    // 4. Tự động gửi email thông báo nhắc hạn 6:00 AM đến Danh sách email của các doanh nghiệp
    try {
      const companies = await db.prepare("SELECT id, company_name, admin_email FROM company_tenants").all().catch(() => ({ results: [] }));
      for (const comp of (companies.results || [])) {
        const mailConfig = await getEmailConfig(db, comp.id);
        if (mailConfig.notifyReminders) {
          let reportEmails = [];
          if (mailConfig.reportRecipients) {
            reportEmails = mailConfig.reportRecipients.split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'));
          }
          if (reportEmails.length === 0 && comp.admin_email && comp.admin_email.includes('@')) {
            reportEmails = [comp.admin_email.trim().toLowerCase()];
          }
          if (reportEmails.length === 0) continue;

          const [overdueTasks, upcomingContracts, expiredContracts] = await Promise.all([
            db.prepare("SELECT title, assignee, due_date FROM tasks WHERE company_id = ? AND status != 'COMPLETED' AND due_date < ? ORDER BY due_date ASC LIMIT 10").bind(comp.id, today).all().catch(() => ({ results: [] })),
            db.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE company_id = ? AND status = 'ACTIVE' AND end_date <= date('now', '+30 day') ORDER BY end_date ASC LIMIT 10").bind(comp.id).all().catch(() => ({ results: [] })),
            db.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE company_id = ? AND status = 'EXPIRED' ORDER BY end_date DESC LIMIT 10").bind(comp.id).all().catch(() => ({ results: [] }))
          ]);

          const hasAlerts = (overdueTasks.results?.length > 0) || (upcomingContracts.results?.length > 0) || (expiredContracts.results?.length > 0);
          if (hasAlerts) {
            const mailHtml = getDailyRemindersEmailHtml({
              companyName: comp.company_name,
              date: today,
              overdueTasks: overdueTasks.results || [],
              upcomingContracts: upcomingContracts.results || [],
              expiredContracts: expiredContracts.results || [],
              dashboardUrl: 'https://company-sheet.hieupham101097.workers.dev'
            });

            for (const recipient of reportEmails) {
              await sendEmail({
                db,
                companyId: comp.id,
                senderType: 'reports',
                to: recipient,
                subject: `[06:00 AM] Báo cáo nhắc việc & Hợp đồng đến hạn - ${comp.company_name}`,
                html: mailHtml
              }).catch(e => console.error('[Reminder Mail Error]', comp.company_name, recipient, e.message));
            }
          }
        }
      }
    } catch (mailCronErr) {
      console.error('[Reminder Mail Cron Error]', mailCronErr.message);
    }

    return { success: true, refreshed_at: nowVN, today };
  } catch (err) {
    console.error('[06:00 AM Cron Error]', err);
    return { success: false, error: err.message };
  }
}

// ==========================================
// SUPER ADMIN PORTAL: ENTERPRISE & LICENSING
// ==========================================

// 1. Thống kê tổng quan (Dashboard Overview)
app.get('/api/super-admin/overview', async (c) => {
  try {
    const totalCompanies = await c.env.DB.prepare('SELECT count(*) as count FROM company_tenants').first('count') || 0;
    const activeCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE license_status = 'ACTIVE'").first('count') || 0;
    const trialCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE plan_code = 'TRIAL_2M'").first('count') || 0;
    const expiredCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE license_status = 'EXPIRED'").first('count') || 0;
    const lockedCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE license_status = 'LOCKED'").first('count') || 0;

    // Thống kê số lượng người dùng / users toàn nền tảng
    const totalUsers = await c.env.DB.prepare("SELECT count(*) as count FROM users WHERE role != 'SUPER_ADMIN'").first('count') || 0;

    // Thống kê mã bản quyền Keys
    const totalKeys = await c.env.DB.prepare('SELECT count(*) as count FROM license_keys').first('count') || 0;
    const activeKeys = await c.env.DB.prepare("SELECT count(*) as count FROM license_keys WHERE status = 'ACTIVE'").first('count') || 0;
    const usedKeys = await c.env.DB.prepare("SELECT count(*) as count FROM license_keys WHERE status = 'USED'").first('count') || 0;

    const totalRevenueRes = await c.env.DB.prepare("SELECT sum(amount) as total FROM license_orders WHERE payment_status IN ('PAID', 'COMPLETED')").first('total') || 0;
    const totalOrders = await c.env.DB.prepare('SELECT count(*) as count FROM license_orders').first('count') || 0;
    const pendingOrdersCount = await c.env.DB.prepare("SELECT count(*) as count FROM license_orders WHERE payment_status = 'PENDING'").first('count') || 0;

    const planStats = await c.env.DB.prepare(`
      SELECT plan_code, count(*) as count, sum(revenue) as plan_revenue 
      FROM company_tenants 
      GROUP BY plan_code
    `).all();

    const recentOrders = await c.env.DB.prepare(`
      SELECT * FROM license_orders 
      ORDER BY created_at DESC 
      LIMIT 8
    `).all();

    const recentCompanies = await c.env.DB.prepare(`
      SELECT c.*, (SELECT count(*) FROM users u WHERE u.company_id = c.id) as user_count
      FROM company_tenants c 
      ORDER BY c.created_at DESC 
      LIMIT 6
    `).all();

    return c.json({
      success: true,
      data: {
        stats: {
          totalCompanies: Number(totalCompanies),
          activeCompanies: Number(activeCompanies),
          trialCompanies: Number(trialCompanies),
          expiredCompanies: Number(expiredCompanies),
          lockedCompanies: Number(lockedCompanies),
          totalUsers: Number(totalUsers),
          totalKeys: Number(totalKeys),
          activeKeys: Number(activeKeys),
          usedKeys: Number(usedKeys),
          totalRevenue: Number(totalRevenueRes),
          totalOrders: Number(totalOrders),
          pendingOrdersCount: Number(pendingOrdersCount)
        },
        planDistribution: planStats.results || [],
        recentOrders: recentOrders.results || [],
        recentCompanies: recentCompanies.results || []
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 2. Danh sách Doanh nghiệp (Company Tenants kèm số lượng người dùng)
app.get('/api/super-admin/companies', async (c) => {
  try {
    const list = await c.env.DB.prepare(`
      SELECT c.*, 
             (SELECT count(*) FROM users u WHERE u.company_id = c.id) as user_count,
             (SELECT count(*) FROM assets a WHERE a.company_id = c.id) as asset_count,
             (SELECT count(*) FROM contracts ctr WHERE ctr.company_id = c.id) as contract_count
      FROM company_tenants c 
      ORDER BY c.created_at DESC
    `).all();
    return c.json({
      success: true,
      data: list.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 2.5 Danh sách người dùng trực thuộc một Doanh nghiệp cụ thể
app.get('/api/super-admin/companies/:id/users', async (c) => {
  try {
    const id = c.req.param('id');
    const users = await c.env.DB.prepare(`
      SELECT id, name, email, role, department, phone, status, created_at
      FROM users
      WHERE company_id = ?
      ORDER BY created_at DESC
    `).bind(id).all();
    return c.json({
      success: true,
      data: users.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 2.8 Quản lý License Keys (Tạo key cấp phép, xây dựng gói)
app.get('/api/super-admin/keys', async (c) => {
  try {
    const keys = await c.env.DB.prepare(`
      SELECT * FROM license_keys 
      ORDER BY created_at DESC
    `).all();
    return c.json({ success: true, data: keys.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/super-admin/keys', async (c) => {
  try {
    const body = await c.req.json();
    let {
      license_key,
      plan_code = 'ANNUAL_1Y',
      plan_name,
      company_id = null,
      company_name = null,
      duration_months = 12,
      price = 0,
      notes = ''
    } = body;

    // Tự sinh mã key chuẩn nếu chưa nhập: OMNI-ENT-XXXX-XXXX-XXXX
    if (!license_key || !license_key.trim()) {
      const randSegment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      license_key = `OMNI-ENT-${randSegment()}-${randSegment()}-${randSegment()}`;
    } else {
      license_key = license_key.trim().toUpperCase();
    }

    if (!plan_name) {
      if (plan_code === 'LIFETIME') plan_name = 'Gói Vĩnh Viễn Trọn Đời';
      else if (plan_code === 'ANNUAL_1Y') plan_name = 'Gói Tiêu Chuẩn 1 Năm';
      else if (plan_code === 'TRIAL_2M') plan_name = 'Gói Dùng Thử 2 Tháng';
      else plan_name = `Gói Cước ${plan_code}`;
    }

    const id = `key_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    await c.env.DB.prepare(`
      INSERT INTO license_keys (id, license_key, plan_code, plan_name, company_id, company_name, duration_months, price, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, datetime('now'))
    `).bind(
      id,
      license_key,
      plan_code,
      plan_name,
      company_id || null,
      company_name || null,
      Number(duration_months) || 12,
      Number(price) || 0,
      notes || ''
    ).run();

    return c.json({
      success: true,
      message: 'Tạo mã bản quyền (License Key) thành công!',
      data: { id, license_key, plan_code, plan_name, price }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/super-admin/keys/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { status, notes, company_id, company_name } = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE license_keys 
      SET status = COALESCE(?, status), 
          notes = COALESCE(?, notes),
          company_id = COALESCE(?, company_id),
          company_name = COALESCE(?, company_name)
      WHERE id = ?
    `).bind(status || null, notes || null, company_id || null, company_name || null, id).run();
    return c.json({ success: true, message: 'Cập nhật thông tin Key thành công!' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.delete('/api/super-admin/keys/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM license_keys WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Xóa mã Key thành công!' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 3. Thêm mới Doanh nghiệp thủ công từ Super Admin
app.post('/api/super-admin/companies', async (c) => {
  try {
    const body = await c.req.json();
    const {
      company_name,
      tax_id,
      admin_name,
      admin_email,
      admin_phone,
      plan_code = 'TRIAL_2M',
      license_status = 'ACTIVE',
      start_date,
      expire_date,
      revenue = 0,
      notes = ''
    } = body;

    if (!company_name?.trim()) {
      return c.json({ success: false, message: 'Vui lòng nhập tên công ty / doanh nghiệp' }, 400);
    }

    const companyId = `comp_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const startDateVal = start_date || today;

    // Calculate expire date if missing based on plan
    let expireDateVal = expire_date;
    if (!expireDateVal) {
      const plan = await c.env.DB.prepare('SELECT duration_months FROM pricing_plans WHERE code = ?').bind(plan_code).first();
      const months = plan ? plan.duration_months : 2;
      const d = new Date(startDateVal);
      d.setMonth(d.getMonth() + months);
      expireDateVal = d.toISOString().slice(0, 10);
    }

    await c.env.DB.prepare(`
      INSERT INTO company_tenants (id, company_name, tax_id, admin_name, admin_email, admin_phone, plan_code, license_status, start_date, expire_date, revenue, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      companyId,
      company_name.trim(),
      tax_id ? tax_id.trim() : null,
      admin_name ? admin_name.trim() : null,
      admin_email ? admin_email.trim() : null,
      admin_phone ? admin_phone.trim() : null,
      plan_code,
      license_status,
      startDateVal,
      expireDateVal,
      Number(revenue) || 0,
      notes ? notes.trim() : ''
    ).run();

    // Nếu có phát sinh doanh thu > 0, tạo một license order ghi nhận
    if (Number(revenue) > 0) {
      const orderId = `ord_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO license_orders (id, company_id, company_name, plan_code, plan_name, amount, payment_status, order_date, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?, ?, datetime('now'))
      `).bind(
        orderId,
        companyId,
        company_name.trim(),
        plan_code,
        plan_code,
        Number(revenue),
        startDateVal,
        'Khởi tạo đơn hàng từ cổng Quản trị Tổng'
      ).run();
    }

    // Nếu có khai báo admin_email, tự động tạo tài khoản Quản trị viên cho doanh nghiệp đó
    if (admin_email && admin_email.trim()) {
      const emailClean = admin_email.trim().toLowerCase();
      const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(emailClean).first();
      if (!existingUser) {
        const userId = `usr_${Date.now()}`;
        await c.env.DB.prepare(`
          INSERT INTO users (id, company_id, name, email, password, role, status, phone, created_at)
          VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?, datetime('now'))
        `).bind(
          userId,
          companyId,
          admin_name ? admin_name.trim() : 'Quản Trị Viên',
          emailClean,
          '123456',
          admin_phone ? admin_phone.trim() : null
        ).run();
      }
    }

    return c.json({
      success: true,
      message: 'Thêm doanh nghiệp thành công!',
      data: { id: companyId }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 4. Cấp quyền / Gia hạn bản quyền / Khóa mở khóa Doanh nghiệp
app.put('/api/super-admin/companies/:id/license', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const {
      plan_code,
      license_status,
      expire_date,
      add_revenue = 0,
      notes
    } = body;

    const existing = await c.env.DB.prepare('SELECT * FROM company_tenants WHERE id = ?').bind(id).first();
    if (!existing) {
      return c.json({ success: false, message: 'Không tìm thấy doanh nghiệp' }, 404);
    }

    const newPlan = plan_code || existing.plan_code;
    const newStatus = license_status || existing.license_status;
    const newExpire = expire_date || existing.expire_date;
    const newNotes = notes !== undefined ? notes : existing.notes;
    const newRevenue = Number(existing.revenue || 0) + Number(add_revenue || 0);

    await c.env.DB.prepare(`
      UPDATE company_tenants 
      SET plan_code = ?, license_status = ?, expire_date = ?, revenue = ?, notes = ?
      WHERE id = ?
    `).bind(
      newPlan,
      newStatus,
      newExpire,
      newRevenue,
      newNotes,
      id
    ).run();

    // Nếu có phát sinh doanh thu khi gia hạn
    if (Number(add_revenue) > 0) {
      const orderId = `ord_${Date.now()}`;
      const today = new Date().toISOString().slice(0, 10);
      await c.env.DB.prepare(`
        INSERT INTO license_orders (id, company_id, company_name, plan_code, plan_name, amount, payment_status, order_date, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?, ?, datetime('now'))
      `).bind(
        orderId,
        existing.id,
        existing.company_name,
        newPlan,
        newPlan,
        Number(add_revenue),
        today,
        `Gia hạn / Nâng cấp gói: ${newPlan}`
      ).run();
    }

    return c.json({
      success: true,
      message: 'Cập nhật bản quyền doanh nghiệp thành công!'
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 5. Xóa Doanh nghiệp (và dọn dẹp toàn bộ dữ liệu thuộc doanh nghiệp đó)
app.delete('/api/super-admin/companies/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM assets WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM contracts WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM handover_protocols WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM finance WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM tasks WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM attendance WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM categories WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM users WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM license_orders WHERE company_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM company_tenants WHERE id = ?').bind(id)
    ]);
    return c.json({ success: true, message: 'Xóa doanh nghiệp và dữ liệu liên quan thành công!' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

async function initPricingPlansTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        duration_months INTEGER DEFAULT 1,
        price REAL DEFAULT 0,
        features TEXT,
        badge TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Đảm bảo có Gói Dùng Thử 2 Tháng (TRIAL_2M)
    const trialPlan = await db.prepare('SELECT id FROM pricing_plans WHERE code = "TRIAL_2M"').first().catch(() => null);
    if (!trialPlan) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_trial_2m', 'TRIAL_2M', 'Gói Dùng Thử 2 Tháng (60 Ngày)', 2, 0, ?, 'Dùng Thử 0đ (Hạn Chế Quyền)', 1, datetime('now'))
      `).bind(JSON.stringify([
        'Trải nghiệm dùng thử toàn diện 60 ngày',
        'Giới hạn tối đa 20 tài sản thiết bị',
        'Giới hạn tối đa 3 tài khoản nhân sự (1 Quản trị + 2 Nhân viên)',
        'Giới hạn tối đa 5 hợp đồng & 5 biên bản bàn giao',
        'Cố định 1 phòng ban vận hành',
        'Xuất Excel cơ bản, in ấn có watermark thử nghiệm',
        'Khóa tự động gửi Email & Telegram'
      ])).run().catch(() => {});
    }

    const annual1y = await db.prepare('SELECT id FROM pricing_plans WHERE code = "ANNUAL_1Y"').first().catch(() => null);
    if (!annual1y) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_annual_1y', 'ANNUAL_1Y', 'Gói Tiêu Chuẩn 1 Năm', 12, 4800000, ?, 'Phổ biến nhất', 1, datetime('now'))
      `).bind(JSON.stringify([
        'Không giới hạn số lượng tài sản thiết bị (Unlimited)',
        'Không giới hạn tài khoản nhân viên & toàn bộ phòng ban',
        'Không giới hạn hợp đồng & biên bản bàn giao',
        'In biên bản A4 chuẩn đóng mộc dấu sắc nét, không watermark',
        'Xuất dữ liệu Excel / CSV toàn diện',
        'Tự động gửi email 6:00 AM & thông báo giao việc',
        'Trợ lý AI OMNI-Bot Gemini 24/7',
        'Lưu trữ Cloudflare D1 độ tin cậy cao'
      ])).run().catch(() => {});
    }

    const annual2y = await db.prepare('SELECT id FROM pricing_plans WHERE code = "ANNUAL_2Y"').first().catch(() => null);
    if (!annual2y) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_annual_2y', 'ANNUAL_2Y', 'Gói Tiết Kiệm 2 Năm', 24, 8800000, ?, 'Tiết kiệm 800.000đ', 1, datetime('now'))
      `).bind(JSON.stringify([
        'Toàn bộ đặc quyền của gói 1 Năm',
        'Thời hạn sử dụng 24 tháng liên tục',
        'Tiết kiệm 800.000đ so với gia hạn từng năm',
        'Ưu tiên hỗ trợ kỹ thuật và sao lưu dữ liệu riêng',
        'Bảo hành & nâng cấp tính năng tự động miễn phí'
      ])).run().catch(() => {});
    }

    const lifetime = await db.prepare('SELECT id FROM pricing_plans WHERE code = "LIFETIME"').first().catch(() => null);
    if (!lifetime) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_lifetime', 'LIFETIME', 'Gói Vĩnh Viễn Trọn Đời', 999, 12500000, ?, 'Khuyên Dùng • VIP', 1, datetime('now'))
      `).bind(JSON.stringify([
        'Sở hữu vĩnh viễn trọn đời (Lifetime License)',
        'Không bao giờ phát sinh chi phí duy trì hàng năm',
        'Mở khóa toàn bộ 100% tính năng và bản cập nhật mới',
        'Kênh hỗ trợ VIP 1-1 riêng với đội ngũ kỹ thuật',
        'Xuất hóa đơn VAT điện tử doanh nghiệp đầy đủ'
      ])).run().catch(() => {});
    }

    // Tự động chuẩn hóa lại tên gói cước đầy đủ trong database nếu trước đó bị lưu tên ngắn (Tháng / Năm)
    await db.prepare(`

      UPDATE pricing_plans 
      SET name = 'Gói Dùng Thử 2 Tháng (Trial 60N)', badge = 'Dùng Thử 0đ (Hạn Chế Quyền)'
      WHERE code = 'TRIAL_2M' AND (name = 'Tháng' OR name = 'Gói Dùng Thử 2 Tháng')
    `).run().catch(() => {});

    await db.prepare(`
      UPDATE pricing_plans 
      SET name = 'Gói Tiêu Chuẩn 1 Năm', badge = 'Phổ biến nhất'
      WHERE code = 'ANNUAL_1Y' AND (name = 'Năm' OR name = '1 Năm')
    `).run().catch(() => {});

    await db.prepare(`
      UPDATE pricing_plans 
      SET name = 'Gói Tiết Kiệm 2 Năm', badge = 'Tiết kiệm 800.000đ'
      WHERE code = 'ANNUAL_2Y' AND (name = 'Năm' OR name = '2 Năm')
    `).run().catch(() => {});

    await db.prepare(`
      UPDATE pricing_plans 
      SET name = 'Gói Vĩnh Viễn Trọn Đời', badge = 'Khuyên Dùng • VIP'
      WHERE code = 'LIFETIME' AND (name = 'Vĩnh Viễn' OR name = 'Trọn Đời')
    `).run().catch(() => {});
  } catch (err) {
    console.error('Error initPricingPlansTable:', err);
  }
}


// 6. Quản lý danh sách Gói Cước (Pricing Plans)
app.get('/api/super-admin/plans', async (c) => {
  try {
    await initPricingPlansTable(c.env.DB);
    const plans = await c.env.DB.prepare('SELECT * FROM pricing_plans ORDER BY price ASC').all();
    return c.json({
      success: true,
      data: plans.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 7. Tạo mới / Cập nhật Gói Cước (Xây dựng gói 1 năm, vĩnh viễn, 2 tháng dùng thử...)
app.post('/api/super-admin/plans', async (c) => {
  try {
    const body = await c.req.json();
    const {
      id,
      code,
      name,
      duration_months,
      price,
      features,
      badge,
      is_active = 1
    } = body;

    if (!code || !name) {
      return c.json({ success: false, message: 'Mã gói (Code) và Tên gói không được để trống' }, 400);
    }

    const featuresJson = typeof features === 'string' ? features : JSON.stringify(features || []);
    const cleanCode = code.trim().toUpperCase();

    if (id) {
      // Update existing
      await c.env.DB.prepare(`
        UPDATE pricing_plans 
        SET code = ?, name = ?, duration_months = ?, price = ?, features = ?, badge = ?, is_active = ?
        WHERE id = ?
      `).bind(
        cleanCode,
        name.trim(),
        Number(duration_months) || 1,
        Number(price) || 0,
        featuresJson,
        badge ? badge.trim() : null,
        is_active ? 1 : 0,
        id
      ).run();

      return c.json({ success: true, message: 'Cập nhật gói dịch vụ thành công!' });
    } else {
      // Create new
      const planId = `plan_${cleanCode.toLowerCase()}_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        planId,
        cleanCode,
        name.trim(),
        Number(duration_months) || 1,
        Number(price) || 0,
        featuresJson,
        badge ? badge.trim() : null,
        is_active ? 1 : 0
      ).run();

      return c.json({ success: true, message: 'Thêm gói dịch vụ mới thành công!', data: { id: planId } });
    }
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 8. Xóa Gói Cước
app.delete('/api/super-admin/plans/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM pricing_plans WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Xóa gói dịch vụ thành công!' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 9. Danh sách Đơn hàng & Doanh thu Đăng ký Gói
app.get('/api/super-admin/revenue-orders', async (c) => {
  try {
    const status = c.req.query('status');
    let query = 'SELECT * FROM license_orders';
    const params = [];
    if (status) {
      query += ' WHERE payment_status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC, order_date DESC';
    const orders = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({
      success: true,
      data: orders.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 10. Tạo đơn hàng mới / xác nhận thu tiền
app.post('/api/super-admin/orders', async (c) => {
  try {
    const body = await c.req.json();
    const {
      company_id,
      company_name,
      plan_code,
      plan_name,
      amount,
      payment_status = 'PENDING',
      notes = ''
    } = body;

    if (!company_name || !plan_code) {
      return c.json({ success: false, message: 'Thiếu thông tin công ty hoặc mã gói' }, 400);
    }

    const orderId = `ord_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    await c.env.DB.prepare(`
      INSERT INTO license_orders (id, company_id, company_name, plan_code, plan_name, amount, payment_status, order_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      orderId,
      company_id || null,
      company_name.trim(),
      plan_code.trim(),
      plan_name ? plan_name.trim() : plan_code.trim(),
      Number(amount) || 0,
      payment_status,
      today,
      notes ? notes.trim() : ''
    ).run();

    // Nếu payment_status = 'PAID' và có company_id, cộng dồn doanh thu cho company_tenants
    if (payment_status === 'PAID' && company_id) {
      await c.env.DB.prepare(`
        UPDATE company_tenants 
        SET revenue = COALESCE(revenue, 0) + ? 
        WHERE id = ?
      `).bind(Number(amount) || 0, company_id).run();
    }

    return c.json({ success: true, message: 'Tạo đơn hàng bản quyền thành công!', data: { id: orderId } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 11. Duyệt đơn hàng & Kích hoạt bản quyền gói cho Doanh Nghiệp
app.put('/api/super-admin/orders/:id/approve', async (c) => {
  try {
    const orderId = c.req.param('id');
    const order = await c.env.DB.prepare('SELECT * FROM license_orders WHERE id = ?').bind(orderId).first();
    if (!order) {
      return c.json({ success: false, message: 'Không tìm thấy đơn hàng' }, 404);
    }

    if (order.payment_status === 'PAID') {
      return c.json({ success: false, message: 'Đơn hàng này đã được duyệt và kích hoạt trước đó.' }, 400);
    }

    // Tìm kiếm thông tin doanh nghiệp theo company_id hoặc company_name
    let tenant = null;
    if (order.company_id && order.company_id !== 'comp_1') {
      tenant = await c.env.DB.prepare('SELECT * FROM company_tenants WHERE id = ?').bind(order.company_id).first();
    }
    if (!tenant && order.company_name) {
      tenant = await c.env.DB.prepare('SELECT * FROM company_tenants WHERE company_name LIKE ?').bind(`%${order.company_name.trim()}%`).first();
    }
    if (!tenant) {
      // Fallback: nếu hệ thống chỉ có 1 công ty tenant
      const allTenants = await c.env.DB.prepare('SELECT * FROM company_tenants LIMIT 2').all();
      if (allTenants?.results?.length === 1) {
        tenant = allTenants.results[0];
      }
    }

    // Lấy thông tin gói cước
    const plan = await c.env.DB.prepare('SELECT * FROM pricing_plans WHERE code = ?').bind(order.plan_code).first().catch(() => null);

    // Tính toán ngày hết hạn mới
    let newExpireDate = null;
    if (order.plan_code === 'LIFETIME' || order.plan_code === 'LIFETIME_PRO') {
      newExpireDate = null;
    } else {
      const months = plan?.duration_months || (order.plan_code === 'ANNUAL_2Y' ? 24 : 12);
      const today = new Date();
      let baseDate = today;
      if (tenant?.expire_date && tenant?.license_status === 'ACTIVE') {
        const existingExp = new Date(tenant.expire_date);
        if (existingExp > today) {
          baseDate = existingExp;
        }
      }
      baseDate.setMonth(baseDate.getMonth() + months);
      newExpireDate = baseDate.toISOString().slice(0, 10);
    }

    // 1. Cập nhật trạng thái đơn hàng thành PAID
    const approvedNote = (order.notes || '') + ' [Đã duyệt & kích hoạt lúc ' + new Date().toLocaleString('vi-VN') + ']';
    await c.env.DB.prepare(`
      UPDATE license_orders 
      SET payment_status = 'PAID', notes = ? 
      WHERE id = ?
    `).bind(approvedNote.trim(), orderId).run();

    // 2. Kích hoạt bản quyền cho doanh nghiệp (nếu tìm thấy tenant)
    if (tenant) {
      await c.env.DB.prepare(`
        UPDATE company_tenants 
        SET plan_code = ?, license_status = 'ACTIVE', expire_date = ?, revenue = COALESCE(revenue, 0) + ? 
        WHERE id = ?
      `).bind(order.plan_code, newExpireDate, Number(order.amount) || 0, tenant.id).run();

      // Đồng bộ license_key tương ứng nếu cần
      await c.env.DB.prepare(`
        INSERT INTO company_settings (id, company_id, key, value, updated_at)
        VALUES (?, ?, 'license_key', ?, datetime('now'))
        ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).bind(`set_${Date.now()}`, tenant.id, order.plan_code === 'LIFETIME' ? 'OMNI-LIFETIME' : `OMNI-${order.plan_code}-${Date.now().toString().slice(-4)}`).run().catch(() => {});
    }

    // 3. Tự động gửi Email chúc mừng & xác nhận kích hoạt cho doanh nghiệp
    const targetEmail = tenant?.admin_email;
    if (targetEmail) {
      const planDisplayName = order.plan_name || plan?.name || order.plan_code;
      const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.amount) || 0);
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Xác Nhận Kích Hoạt Bản Quyền Thành Công</h1>
            <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.95;">Ban Quản Trị OMNI ASSETS đã đối soát thanh toán và kích hoạt gói dịch vụ cho Quý khách</p>
          </div>
          <div style="padding: 28px 24px; color: #334155; line-height: 1.6; font-size: 14px;">
            <p>Kính gửi Quý Doanh Nghiệp <strong>${tenant.company_name || order.company_name}</strong>,</p>
            <p>Chúng tôi đã nhận được thanh toán đối soát qua chuyển khoản ngân hàng và đã kích hoạt toàn diện quyền lợi gói dịch vụ:</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td style="padding: 6px 0; color: #64748b;">Mã Đơn Hàng:</td><td style="padding: 6px 0; font-weight: 700; text-align: right; font-family: monospace;">${order.id}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Gói Bản Quyền:</td><td style="padding: 6px 0; font-weight: 700; text-align: right; color: #7c3aed;">${planDisplayName}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Số Tiền Đã Thanh Toán:</td><td style="padding: 6px 0; font-weight: 800; text-align: right; color: #059669; font-size: 15px;">${formattedAmount}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Thời Hạn Sử Dụng:</td><td style="padding: 6px 0; font-weight: 700; text-align: right;">${newExpireDate ? `Đến ngày ${newExpireDate}` : 'Vĩnh viễn trọn đời (Lifetime)'}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Trạng Thái Bản Quyền:</td><td style="padding: 6px 0; font-weight: 700; text-align: right; color: #10b981;">ĐANG HOẠT ĐỘNG (ACTIVE)</td></tr>
              </table>
            </div>
            <p>Toàn bộ giới hạn về tài sản, nhân viên, hợp đồng và in ấn không watermark đã được mở khóa hoàn toàn trên tài khoản của Quý công ty.</p>
            <div style="text-align: center; margin: 28px 0 16px;">
              <a href="https://company-sheet.hieupham101097.workers.dev" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">Truy Cập Nền Tảng Ngay &rarr;</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">Nếu cần hỗ trợ kỹ thuật hoặc xuất hóa đơn VAT, Quý khách vui lòng liên hệ hotline / Zalo: 0799.097.070 hoặc gửi yêu cầu tại mục Trợ Giúp.</p>
          </div>
        </div>
      `;
      try {
        await sendEmail({
          db: c.env.DB,
          companyId: tenant.id,
          to: targetEmail,
          senderType: 'notifications',
          senderName: 'OMNI ASSETS (Ban Quản Trị)',
          subject: `🎉 [Xác Nhận] Đơn Hàng & Kích Hoạt Bản Quyền Gói ${planDisplayName} Thành Công`,
          html: emailHtml
        });
      } catch (mailErr) {
        console.error('Lỗi gửi email xác nhận kích hoạt đơn hàng:', mailErr);
      }
    }

    return c.json({
      success: true,
      message: `Duyệt đơn hàng và kích hoạt thành công gói ${order.plan_name || order.plan_code} cho doanh nghiệp!`,
      data: {
        orderId,
        companyId: tenant?.id,
        planCode: order.plan_code,
        expireDate: newExpireDate
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 12. Hủy đơn hàng (Từ chối duyệt / không nhận được tiền)
app.put('/api/super-admin/orders/:id/cancel', async (c) => {
  try {
    const orderId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const reason = body.reason || 'Admin hủy đơn';

    const order = await c.env.DB.prepare('SELECT * FROM license_orders WHERE id = ?').bind(orderId).first();
    if (!order) {
      return c.json({ success: false, message: 'Không tìm thấy đơn hàng' }, 404);
    }

    const updatedNote = (order.notes || '') + ` [Đã hủy: ${reason}]`;
    await c.env.DB.prepare(`
      UPDATE license_orders 
      SET payment_status = 'CANCELLED', notes = ? 
      WHERE id = ?
    `).bind(updatedNote.trim(), orderId).run();

    return c.json({ success: true, message: 'Đã hủy đơn hàng thành công!' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

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

// Favicon handler
app.get('/favicon.ico', async (c) => {
  if (c.env?.ASSETS) {
    const assetFav = await c.env.ASSETS.fetch(c.req.raw);
    if (assetFav.status !== 404) return assetFav;
    const logoRes = await c.env.ASSETS.fetch(new Request(new URL('/logo.png', c.req.url)));
    if (logoRes.status === 200) {
      const headers = new Headers(logoRes.headers);
      headers.set('Content-Type', 'image/png');
      return new Response(logoRes.body, { status: 200, headers });
    }
  }
  return c.redirect('/logo.png', 302);
});

// ==========================================
// STATIC ASSETS & SPA ROUTING FALLBACK
// ==========================================
app.notFound(async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;

  // Nếu là request API mà không tồn tại route -> trả về JSON 404
  if (path.startsWith('/api')) {
    return c.json({ success: false, message: `API endpoint ${path} not found` }, 404);
  }

  // Phục vụ từ Cloudflare Static Assets
  if (c.env?.ASSETS) {
    const assetRes = await c.env.ASSETS.fetch(c.req.raw);
    if (assetRes.status !== 404) {
      return assetRes;
    }

    // Nếu không tìm thấy file vật lý và là SPA route (như /tong-quan, /tai-san, /cai-dat, v.v.)
    // Tự động fallback nạp index.html với HTTP 200 để React Router tiếp quản
    const indexUrl = new URL('/index.html', c.req.url);
    const indexRes = await c.env.ASSETS.fetch(new Request(indexUrl.toString(), c.req.raw));
    if (indexRes.status === 200) {
      const headers = new Headers(indexRes.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      return new Response(indexRes.body, { status: 200, headers });
    }
    return assetRes;
  }

  return c.text('Not Found', 404);
});

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshDailyReminders(env.DB));
  }
};
