// ==========================================
// DESKTOP & SYSTEM TRAY NOTIFICATION UTILITY
// Hỗ trợ đẩy thông báo ra khay hệ thống (Tray/Action Center) của máy tính
// ==========================================

const NOTIFIED_CACHE_KEY = 'omni_desktop_notified_cache';
const SETTING_KEY = 'omni_desktop_notification_enabled';

// Phát âm thanh thông báo tinh tế nhẹ nhàng bằng Web Audio API
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Hợp âm 2 nốt nhẹ nhàng E5 -> B5 (659Hz -> 987Hz)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
  } catch (_) {
    // Trình duyệt chưa tương tác hoặc không hỗ trợ AudioContext
  }
}

// Kiểm tra trình duyệt có hỗ trợ Desktop Notification không
export function isDesktopNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Lấy trạng thái cấp quyền hiện tại ('default' | 'granted' | 'denied')
export function getNotificationPermission() {
  if (!isDesktopNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Kiểm tra người dùng có bật tính năng thông báo khay hệ thống không
export function isDesktopNotificationEnabled() {
  if (!isDesktopNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  const saved = localStorage.getItem(SETTING_KEY);
  return saved === null || saved === 'true'; // Mặc định là bật nếu đã cấp quyền
}

// Bật / tắt cài đặt thông báo desktop
export function setDesktopNotificationEnabled(enabled) {
  localStorage.setItem(SETTING_KEY, enabled ? 'true' : 'false');
}

// Yêu cầu quyền gửi thông báo từ trình duyệt máy tính
export async function requestDesktopNotificationPermission() {
  if (!isDesktopNotificationSupported()) {
    return { success: false, permission: 'unsupported', message: 'Trình duyệt không hỗ trợ thông báo màn hình máy tính.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setDesktopNotificationEnabled(true);
      // Gửi ngay 1 thông báo chào mừng xác nhận thành công
      sendDesktopNotification({
        title: '🔔 Đã Kích Hoạt Thông Báo Khay Máy Tính',
        body: 'Hệ thống OMNIASSETS sẽ đẩy thông báo việc khẩn và nhắc hạn trực tiếp ra màn hình máy tính của bạn.',
        tag: 'welcome_notification',
        sound: true
      });
      return { success: true, permission: 'granted' };
    } else if (permission === 'denied') {
      setDesktopNotificationEnabled(false);
      return {
        success: false,
        permission: 'denied',
        message: 'Bạn đã từ chối quyền thông báo. Vui lòng nhấp vào biểu tượng 🔒 bên cạnh thanh địa chỉ trình duyệt để cấp quyền lại.'
      };
    } else {
      return { success: false, permission: 'default', message: 'Chưa cấp quyền thông báo.' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Đẩy thông báo ra khay hệ thống (Tray / Desktop Notification)
export function sendDesktopNotification({
  title = 'OMNIASSETS - Thông Báo Mới',
  body = '',
  icon = '/logo.png',
  tag = '',
  sound = true,
  onClick = null
} = {}) {
  if (!isDesktopNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;
  if (!isDesktopNotificationEnabled()) return null;

  try {
    if (sound) {
      playNotificationSound();
    }

    const options = {
      body,
      icon,
      badge: icon,
      tag: tag || `notif_${Date.now()}`,
      renotify: true,
      requireInteraction: false, // Tự biến mất sau vài giây hoặc giữ tùy HĐH
      silent: true // Tắt âm thanh hệ thống để dùng âm thanh tùy biến êm dịu hơn
    };

    const notification = new Notification(title, options);

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (_) {}
      notification.close();
      if (typeof onClick === 'function') {
        onClick();
      }
    };

    return notification;
  } catch (err) {
    console.warn('Lỗi khi đẩy Desktop Notification:', err);
    return null;
  }
}

// Tự động kiểm tra và đẩy các việc khẩn cấp / quá hạn (tránh gửi trùng lặp)
export function checkAndNotifyUrgentReminders(reminders = [], onReminderClick = null) {
  if (!reminders || !Array.isArray(reminders) || reminders.length === 0) return;
  if (!isDesktopNotificationEnabled()) return;

  // Lấy danh sách ID đã thông báo trong 4 giờ qua để không làm phiền liên tục
  let notifiedMap = {};
  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    if (raw) notifiedMap = JSON.parse(raw);
  } catch (_) {}

  const now = Date.now();
  const FOUR_HOURS = 4 * 60 * 60 * 1000;

  // Lọc dọn dẹp các cache quá 4h
  Object.keys(notifiedMap).forEach((id) => {
    if (now - notifiedMap[id] > FOUR_HOURS) {
      delete notifiedMap[id];
    }
  });

  // Tìm các việc khẩn (danger hoặc warning) chưa thông báo
  const urgentItems = reminders.filter(
    (r) => (r.level === 'danger' || r.level === 'warning') && !notifiedMap[r.id]
  );

  if (urgentItems.length === 0) return;

  if (urgentItems.length === 1) {
    const item = urgentItems[0];
    notifiedMap[item.id] = now;
    sendDesktopNotification({
      title: item.level === 'danger' ? '🚨 Cảnh Báo Quá Hạn Công Việc' : '⚠️ Nhắc Nhở Đến Hạn Xử Lý',
      body: `${item.title} (Hạn: ${item.date || 'Hôm nay'})`,
      tag: `reminder_${item.id}`,
      sound: true,
      onClick: () => {
        if (typeof onReminderClick === 'function') {
          onReminderClick(item);
        }
      }
    });
  } else {
    // Có nhiều việc khẩn cùng lúc -> gộp thành 1 thông báo tổng hợp
    urgentItems.forEach((it) => { notifiedMap[it.id] = now; });
    sendDesktopNotification({
      title: `🚨 Bạn có ${urgentItems.length} công việc & hợp đồng cần xử lý ngay!`,
      body: urgentItems.slice(0, 2).map((it) => `• ${it.title}`).join('\n') + (urgentItems.length > 2 ? `\n...và ${urgentItems.length - 2} việc khác` : ''),
      tag: `multi_reminders_${Date.now()}`,
      sound: true,
      onClick: () => {
        if (typeof onReminderClick === 'function') {
          onReminderClick(urgentItems[0]);
        }
      }
    });
  }

  try {
    localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(notifiedMap));
  } catch (_) {}
}
