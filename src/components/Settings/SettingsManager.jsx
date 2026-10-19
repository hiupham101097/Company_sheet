import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Bell,
  Calendar,
  Coffee,
  Info,
  RefreshCw,
  Crown,
  Key,
  Zap,
  ShieldCheck,
  Lock,
  Unlock
} from 'lucide-react';
import { api } from '../../services/api';

export function SettingsManager({ 
  userRole = 'ADMIN', 
  onRefresh, 
  licenseInfo, 
  onOpenUpgrade 
}) {
  const [activeSubTab, setActiveSubTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Settings State Form
  const [settings, setSettings] = useState({
    // Attendance
    work_start_time: '08:30',
    work_end_time: '17:30',
    late_grace_minutes: '15',
    overtime_start_time: '18:00',
    work_days: 'Thứ 2 - Thứ 6',
    require_late_reason: 'true',
    lunch_break_start: '12:00',
    lunch_break_end: '13:30',
    // Web & General
    company_name: 'OMNI ASSETS & LOGISTICS',
    system_title: 'Hệ Thống Quản Lý Tài Sản & Vận Hành Doanh Nghiệp',
    company_email: 'contact@omniassets.vn',
    company_phone: '1900 6868',
    company_address: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, TP. Hồ Chí Minh',
    tax_id: '0109887766',
    currency: 'VND',
    system_announcement: 'Chào mừng bạn đến với hệ thống quản trị vận hành OMNI ASSETS!',
    allow_user_registration: 'false'
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.data?.settings) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.settings
        }));
      }
    } catch (err) {
      console.error('Lỗi khi tải cài đặt:', err);
      setStatusMessage({ type: 'error', text: 'Không thể tải cài đặt từ máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      alert('Bạn không có quyền thay đổi cài đặt hệ thống');
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await api.updateSettings(settings);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Đã lưu và áp dụng cài đặt mới thành công!' });
        if (onRefresh) onRefresh();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Lỗi khi lưu cài đặt' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ khi lưu' });
    } finally {
      setSaving(false);
    }
  };

  // Tính toán thời gian chấm công cho bảng xem trước
  const [stdH, stdM] = (settings.work_start_time || '08:30').split(':').map(Number);
  const graceMinutes = Number(settings.late_grace_minutes) || 0;
  const lateMinutes = (stdH || 8) * 60 + (stdM || 30) + graceMinutes;
  const lateH = Math.floor(lateMinutes / 60).toString().padStart(2, '0');
  const lateM = (lateMinutes % 60).toString().padStart(2, '0');

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pastel-100 text-pastel-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <span>Cài Đặt Hệ Thống & Vận Hành</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tùy biến quy định chấm công, ca làm việc, thông tin đơn vị và giao diện ứng dụng web.
          </p>
        </div>

        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadSettings}
              disabled={loading || saving}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Tải lại cài đặt"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pastel-500 hover:bg-pastel-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border animate-scale-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-pastel-200/80 pb-px">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'attendance'
              ? 'border-pastel-500 text-pastel-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Clock size={15} />
          <span>Thời Gian Chấm Công</span>
        </button>

        <button
          onClick={() => setActiveSubTab('website')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'website'
              ? 'border-pastel-500 text-pastel-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Globe size={15} />
          <span>Thông Tin Trang Web & Doanh Nghiệp</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'rules'
              ? 'border-pastel-500 text-pastel-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Info size={15} />
          <span>Tổng Quan Vận Hành</span>
        </button>

        <button
          onClick={() => setActiveSubTab('license')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'license'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Crown size={15} className={activeSubTab === 'license' ? 'text-amber-500' : 'text-slate-400'} />
          <span>Bản Quyền & Giấy Phép</span>
          {licenseInfo?.isDemo ? (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">Demo</span>
          ) : (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Pro</span>
          )}
        </button>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ================= TAB 1: ATTENDANCE SETTINGS ================= */}
        {activeSubTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Working Hours Card */}
              <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-pastel-600" />
                    <h3 className="text-sm font-bold text-slate-800">Quy Định Khung Giờ Ca Làm Việc</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-pastel-600 bg-pastel-50 px-2.5 py-1 rounded-full border border-pastel-200">
                    Áp dụng toàn công ty
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giờ vào ca chuẩn (Check-in) *
                    </label>
                    <input
                      type="time"
                      value={settings.work_start_time}
                      onChange={(e) => handleChange('work_start_time', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white bg-pastel-50/40"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Khung giờ bắt đầu ca làm việc buổi sáng</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giờ tan ca chuẩn (Check-out) *
                    </label>
                    <input
                      type="time"
                      value={settings.work_end_time}
                      onChange={(e) => handleChange('work_end_time', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white bg-pastel-50/40"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Khung giờ kết thúc giờ làm việc chính thức</p>
                  </div>
                </div>

                {/* Grace Period & OT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Thời gian ân hạn đi muộn (Phút) *</span>
                      <span className="text-[10px] text-pastel-700 font-bold bg-pastel-100 px-2 py-0.5 rounded-md">
                        {settings.late_grace_minutes} phút
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={settings.late_grace_minutes}
                        onChange={(e) => handleChange('late_grace_minutes', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Check-in trước <strong>{lateH}:{lateM}</strong> vẫn được tính đúng giờ
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giờ bắt đầu tính làm thêm (OT)
                    </label>
                    <input
                      type="time"
                      value={settings.overtime_start_time}
                      onChange={(e) => handleChange('overtime_start_time', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Check-out sau giờ này sẽ ghi nhận ca làm ngoài giờ</p>
                  </div>
                </div>

                {/* Lunch Break Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Coffee size={14} className="text-amber-500" />
                      <span>Bắt đầu nghỉ trưa</span>
                    </label>
                    <input
                      type="time"
                      value={settings.lunch_break_start}
                      onChange={(e) => handleChange('lunch_break_start', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Coffee size={14} className="text-amber-500" />
                      <span>Kết thúc nghỉ trưa</span>
                    </label>
                    <input
                      type="time"
                      value={settings.lunch_break_end}
                      onChange={(e) => handleChange('lunch_break_end', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                    />
                  </div>
                </div>

                {/* Working Days Select */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} className="text-pastel-600" />
                    <span>Lịch ngày làm việc trong tuần</span>
                  </label>
                  <select
                    value={settings.work_days}
                    onChange={(e) => handleChange('work_days', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  >
                    <option value="Thứ 2 - Thứ 6">Thứ 2 đến Thứ 6 (Nghỉ Thứ 7 & Chủ Nhật)</option>
                    <option value="Thứ 2 - Thứ 7">Thứ 2 đến Thứ 7 (Nghỉ Chủ Nhật)</option>
                    <option value="Thứ 2 - Thứ 7 (Thứ 7 nửa ngày)">Thứ 2 đến Thứ 7 (Thứ 7 làm việc buổi sáng)</option>
                    <option value="Tất cả các ngày">Làm việc ca xoay vòng (Cả tuần)</option>
                  </select>
                </div>

                {/* Require late reason switch */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pastel-50/50 border border-pastel-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Yêu cầu ghi chú khi đi muộn</p>
                    <p className="text-[11px] text-slate-500">
                      Bắt buộc nhân sự ghi rõ lý do vào ca trễ để quản lý phê duyệt
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.require_late_reason === 'true'}
                    onChange={(e) => handleChange('require_late_reason', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded text-pastel-600 focus:ring-pastel-400"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Live Attendance Rule Preview */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-pastel-500 to-pastel-700 text-white p-6 rounded-3xl shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-pastel-200">
                    Xem Trước Quy Tắc Chấm Công
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-2xl font-bold tracking-tight">
                    {settings.work_start_time} - {settings.work_end_time}
                  </h4>
                  <p className="text-xs text-pastel-100">
                    Thời lượng ca làm việc tiêu chuẩn: 8.0 giờ/ngày
                  </p>
                </div>

                <div className="pt-3 border-t border-white/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-pastel-200">Giờ vào chuẩn:</span>
                    <span className="font-bold">{settings.work_start_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pastel-200">Ân hạn cho phép:</span>
                    <span className="font-bold">+{settings.late_grace_minutes} phút</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-200 font-semibold">
                    <span>Đúng giờ đến:</span>
                    <span className="bg-emerald-500/40 px-2 py-0.5 rounded-md">≤ {lateH}:{lateM}</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-200 font-semibold">
                    <span>Tính đi muộn:</span>
                    <span className="bg-rose-500/40 px-2 py-0.5 rounded-md">&gt; {lateH}:{lateM}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-200 font-semibold pt-1 border-t border-white/10">
                    <span>Bắt đầu tính OT:</span>
                    <span>Từ {settings.overtime_start_time}</span>
                  </div>
                </div>

                <div className="text-[11px] text-pastel-100 bg-white/10 p-3 rounded-xl border border-white/15">
                  💡 <em>Lưu ý: Mọi thay đổi về giờ chấm công sẽ được áp dụng tự động cho các lượt Check-in/Check-out tiếp theo ngay sau khi bạn nhấn "Lưu Thay Đổi".</em>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: WEBSITE & COMPANY SETTINGS ================= */}
        {activeSubTab === 'website' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-pastel-600" />
                  <h3 className="text-sm font-bold text-slate-800">Thông Tin Nhận Diện Doanh Nghiệp & Trang Web</h3>
                </div>
                <span className="text-[11px] font-semibold text-pastel-600 bg-pastel-50 px-2.5 py-1 rounded-full border border-pastel-200">
                  Hiển thị trên giao diện & biên bản bàn giao
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên Doanh Nghiệp / Đơn Vị *
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="VD: CÔNG TY TNHH VẬN HÀNH TÀI SẢN..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Sử dụng trong tiêu đề trang, biên bản và báo cáo</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu Đề Hệ Thống Ứng Dụng *
                  </label>
                  <input
                    type="text"
                    value={settings.system_title}
                    onChange={(e) => handleChange('system_title', e.target.value)}
                    placeholder="VD: Hệ Thống Quản Lý Tài Sản & Vận Hành Doanh Nghiệp"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Xuất hiện trên tiêu đề trang web</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Liên Hệ Hệ Thống
                  </label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    placeholder="contact@company.vn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hotline / Điện Thoại Hỗ Trợ
                  </label>
                  <input
                    type="text"
                    value={settings.company_phone}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    placeholder="1900 xxxx hoặc 028 xxx..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa Chỉ Trụ Sở Doanh Nghiệp
                  </label>
                  <input
                    type="text"
                    value={settings.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    placeholder="Địa chỉ số nhà, đường, quận/huyện, tỉnh/thành phố..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Địa chỉ in ở đầu các mẫu Biên bản bàn giao tài sản chuẩn A4</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã Số Thuế (MST)
                  </label>
                  <input
                    type="text"
                    value={settings.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value)}
                    placeholder="010xxxxxxx..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Đơn Vị Tiền Tệ Mặc Định
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  >
                    <option value="VND">Việt Nam Đồng (VND - ₫)</option>
                    <option value="USD">Đô la Mỹ (USD - $)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Bell size={14} className="text-pastel-600" />
                    <span>Thông Báo Chung Toàn Hệ Thống (Hiển thị bảng tin)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={settings.system_announcement}
                    onChange={(e) => handleChange('system_announcement', e.target.value)}
                    placeholder="Nhập thông báo gửi tới toàn thể nhân viên khi đăng nhập vào hệ thống..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: OPERATION RULES ================= */}
        {activeSubTab === 'rules' && (
          <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield size={18} className="text-pastel-600" />
              <h3 className="text-sm font-bold text-slate-800">Thông Số Vận Hành Cơ Sở Dữ Liệu & Bảo Mật</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-pastel-50/60 border border-pastel-200/80">
                <p className="text-[11px] font-bold text-pastel-700 uppercase">Múi Giờ Hệ Thống</p>
                <h4 className="text-base font-bold text-slate-800 mt-1">Asia/Ho_Chi_Minh</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Múi giờ chuẩn Việt Nam (UTC+7)</p>
              </div>

              <div className="p-4 rounded-2xl bg-pastel-50/60 border border-pastel-200/80">
                <p className="text-[11px] font-bold text-pastel-700 uppercase">Cơ Chế Lưu Trữ</p>
                <h4 className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trực Tuyến Thời Gian Thực</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Tự động đồng bộ và sao lưu đa tầng</p>
              </div>

              <div className="p-4 rounded-2xl bg-pastel-50/60 border border-pastel-200/80">
                <p className="text-[11px] font-bold text-pastel-700 uppercase">Phiên Bản Ứng Dụng</p>
                <h4 className="text-base font-bold text-slate-800 mt-1">OMNI v2.5.0 Pro</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Phiên bản giao diện tối ưu mới nhất</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">Chính sách phân quyền:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
                <li><strong>Quản Trị Viên (ADMIN):</strong> Có toàn quyền thay đổi khung giờ chấm công, thông tin đơn vị, quản lý tài khoản và phân quyền.</li>
                <li><strong>Quản Lý (MANAGER):</strong> Có quyền xem và chỉnh sửa thông số vận hành ca làm việc.</li>
                <li><strong>Nhân Viên (STAFF):</strong> Chỉ được xem thông tin giờ vào/ra và thực hiện Check-in / Check-out theo quy định.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LICENSE & PAYWALL ================= */}
        {activeSubTab === 'license' && (
          <div className="space-y-6">
            {/* Status Hero Card */}
            <div className={`p-6 rounded-3xl border shadow-soft ${
              licenseInfo?.isDemo 
                ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border-amber-200' 
                : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border-emerald-200'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                    licenseInfo?.isDemo ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    <Crown size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        licenseInfo?.isDemo 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {licenseInfo?.isDemo ? 'Bản Dùng Thử (DEMO)' : 'Bản Quyền Doanh Nghiệp (ENTERPRISE)'}
                      </span>
                      {!licenseInfo?.isDemo && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <ShieldCheck size={14} /> Vĩnh viễn
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mt-1">
                      {licenseInfo?.isDemo 
                        ? 'Hệ thống đang hoạt động ở chế độ Giới Hạn Tính Năng' 
                        : 'Hệ thống đã kích hoạt toàn quyền Doanh Nghiệp không giới hạn'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {licenseInfo?.isDemo 
                        ? 'Nâng cấp bản quyền để bỏ giới hạn 5 tài sản, 4 nhân viên và gỡ bỏ watermark trên văn bản A4.' 
                        : `Mã bản quyền: ${licenseInfo?.key || 'OMNI-ENTERPRISE-VERIFIED'}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenUpgrade && onOpenUpgrade()}
                  className={`px-5 py-3 rounded-xl font-bold text-xs shadow-soft flex items-center gap-2 transition-all active:scale-95 ${
                    licenseInfo?.isDemo 
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-amber-500/20' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  <Key size={16} className={licenseInfo?.isDemo ? 'text-amber-200' : 'text-indigo-600'} />
                  <span>{licenseInfo?.isDemo ? 'Nâng Cấp Bản Quyền Ngay' : 'Xem / Nhập Mã Bản Quyền Khác'}</span>
                </button>
              </div>
            </div>

            {/* Quota Limits Cards */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">Hạn Mức & Định Lượng Tài Nguyên</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Tài sản & Thiết bị',
                    current: licenseInfo?.limits?.assets?.current ?? '...',
                    max: licenseInfo?.limits?.assets?.max ?? (licenseInfo?.isDemo ? 5 : '∞'),
                    desc: 'Máy tính, laptop, màn hình...'
                  },
                  {
                    label: 'Nhân sự & Người dùng',
                    current: licenseInfo?.limits?.users?.current ?? '...',
                    max: licenseInfo?.limits?.users?.max ?? (licenseInfo?.isDemo ? 4 : '∞'),
                    desc: 'Tài khoản nhân viên công ty'
                  },
                  {
                    label: 'Hợp đồng & Biên bản',
                    current: licenseInfo?.limits?.contracts?.current ?? '...',
                    max: licenseInfo?.limits?.contracts?.max ?? (licenseInfo?.isDemo ? 3 : '∞'),
                    desc: 'Hợp đồng & biên bản giao nhận'
                  },
                  {
                    label: 'Giao dịch Thu / Chi',
                    current: licenseInfo?.limits?.finance?.current ?? '...',
                    max: licenseInfo?.limits?.finance?.max ?? (licenseInfo?.isDemo ? 5 : '∞'),
                    desc: 'Phiếu thu, chi và hóa đơn'
                  }
                ].map((item, idx) => {
                  const isMax = licenseInfo?.isDemo && Number(item.current) >= Number(item.max);
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl bg-white border shadow-soft transition-all ${
                        isMax ? 'border-rose-300 ring-1 ring-rose-200' : 'border-pastel-200/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                        {licenseInfo?.isDemo ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isMax ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isMax ? 'Đã chạm trần' : 'Demo'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Vô hạn
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800">{item.current}</span>
                        <span className="text-xs text-slate-400 font-semibold">/ {item.max}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rights Breakdown List */}
            <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Quyền Lợi Giữa 2 Gói</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <Lock size={15} />
                    <span>Giới hạn trên Bản Dùng Thử (Demo):</span>
                  </div>
                  <ul className="space-y-1.5 text-amber-900/80 pl-5 list-disc text-[11px]">
                    <li>Khóa sau khi đạt tối đa 5 tài sản công ty.</li>
                    <li>Giới hạn 4 nhân sự trong danh sách nhân viên.</li>
                    <li>Tối đa 3 hợp đồng thỏa thuận và biên bản bàn giao.</li>
                    <li>Biên bản in khổ A4 có đóng dấu mờ (Watermark) bản quyền.</li>
                    <li>Khóa tính năng xuất báo cáo ra file Excel.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <Unlock size={15} />
                    <span>Quyền lợi Bản Quyền Doanh Nghiệp (Enterprise):</span>
                  </div>
                  <ul className="space-y-1.5 text-emerald-900/80 pl-5 list-disc text-[11px]">
                    <li>Mở khóa 100% tài sản không giới hạn số lượng.</li>
                    <li>Toàn bộ nhân sự, phòng ban và phân quyền đầy đủ.</li>
                    <li>Xuất biên bản A4 in ấn chuẩn văn bản nhà nước sạch sẽ.</li>
                    <li>Xuất dữ liệu Excel / CSV toàn bộ hệ thống.</li>
                    <li>Bảo hành và cập nhật phiên bản mới nhất vĩnh viễn.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-pastel-200/80 shadow-soft">
            <span className="text-xs text-slate-500">
              Nhấn <strong>Lưu Thay Đổi</strong> để áp dụng các giá trị cài đặt mới vào hệ thống dữ liệu.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-pastel-500 hover:bg-pastel-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi Cài Đặt'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
