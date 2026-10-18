import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  FileSpreadsheet,
  AlertCircle,
  Timer
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';

export function AttendanceManager({ attendanceList = [], users = [], summary, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || 'usr_1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Ticking live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (users.length > 0 && (!selectedUser || !users.some((u) => u.id === selectedUser))) {
      setSelectedUser(users[0].id);
    }
  }, [users, selectedUser]);

  const statusMap = {
    ON_TIME: { label: 'Đúng giờ', variant: 'success', dot: 'bg-emerald-500' },
    LATE: { label: 'Đi muộn', variant: 'warning', dot: 'bg-amber-500' },
    EARLY_LEAVE: { label: 'Về sớm', variant: 'info', dot: 'bg-sky-500' },
    ABSENT: { label: 'Vắng mặt', variant: 'danger', dot: 'bg-rose-500' },
  };

  const handleAction = async (action) => {
    if (!selectedUser) {
      alert('Vui lòng chọn nhân viên cần điểm danh');
      return;
    }
    try {
      setLoading(true);
      const res = await api.checkAttendance({
        user_id: selectedUser,
        action,
        notes: note
      });
      alert(res.message);
      setNote('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Lỗi chấm công');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = attendanceList.map((att) => ({
      'Ngày': att.date,
      'Mã nhân viên': att.user_id,
      'Họ và tên': att.user_name,
      'Phòng ban': att.user_department,
      'Giờ vào': att.check_in || 'Chưa vào',
      'Giờ ra': att.check_out || 'Chưa ra',
      'Tổng giờ làm': att.total_hours || 0,
      'Trạng thái': statusMap[att.status]?.label || att.status,
      'Ghi chú': att.notes || ''
    }));
    exportToExcel(exportData, 'Bang_Cham_Cong_Thang', 'Chấm Công');
  };

  const todayVN = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Chấm Công & Điểm Danh Nhân Sự
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Theo dõi thời gian làm việc hàng ngày, tỷ lệ đi làm đúng giờ và tổng hợp bảng chấm công tháng.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all shrink-0"
        >
          <FileSpreadsheet size={16} className="text-pastel-600" />
          <span>Xuất Bảng Chấm Công Excel</span>
        </button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Quy Mô Nhân Viên
          </span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{summary?.totalStaff || users.length}</h3>
          <p className="text-xs text-pastel-600 font-medium mt-1">Đang hoạt động trên hệ thống</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Đã Điểm Danh Hôm Nay
          </span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-2">{summary?.checkedInCount || 0}</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Tỷ lệ có mặt: <span className="font-bold text-emerald-700">{summary?.attendanceRate || '0%'}</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Đi Làm Đúng Giờ
          </span>
          <h3 className="text-2xl font-bold text-pastel-700 mt-2">{summary?.onTimeCount || 0}</h3>
          <p className="text-xs text-slate-400 mt-1">Trước mốc 08:30 sáng</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Ghi Nhận Đi Muộn
          </span>
          <h3 className="text-2xl font-bold text-amber-600 mt-2">{summary?.lateCount || 0}</h3>
          <p className="text-xs text-slate-400 mt-1">Sau mốc 08:30 sáng</p>
        </div>
      </div>

      {/* Quick Check-in Terminal Card with Real-time Clock */}
      <div className="p-6 bg-gradient-to-r from-pastel-50 via-white to-pastel-50/60 rounded-3xl border border-pastel-200 shadow-soft">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Terminal Info & Clock */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pastel-500 text-white flex items-center justify-center shadow-soft shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">Bảng Chấm Công Trực Tiếp</h4>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pastel-100 text-pastel-800 font-mono text-xs font-bold">
                  <Timer size={12} className="text-pastel-600 animate-spin" />
                  <span>{currentTime || '08:30:00'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">
                {todayVN} • Chọn nhân sự và nhấn nút để điểm danh vào ca / tan ca
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pastel-400 text-slate-800"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} - {u.department}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Ghi chú (lý do đi muộn, tăng ca)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pastel-400 w-full sm:w-60 text-slate-800"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('CHECK_IN')}
                disabled={loading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>Vào Ca (Check-in)</span>
              </button>

              <button
                onClick={() => handleAction('CHECK_OUT')}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Clock size={15} />
                <span>Tan Ca (Check-out)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Table Card */}
      <div className="bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-pastel-100 flex items-center justify-between bg-pastel-50/40">
          <h3 className="text-sm font-bold text-slate-800">Nhật Ký Điểm Danh Gần Đây</h3>
          <span className="text-xs text-pastel-700 font-semibold bg-pastel-100 px-3 py-1 rounded-full">
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </span>
        </div>

        <div className="table-responsive">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
              <tr>
                <th className="py-3.5 px-4">Ngày</th>
                <th className="py-3.5 px-4">Nhân Sự</th>
                <th className="py-3.5 px-4">Phòng Ban</th>
                <th className="py-3.5 px-4">Giờ Vào</th>
                <th className="py-3.5 px-4">Giờ Ra</th>
                <th className="py-3.5 px-4">Tổng Giờ Làm</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Chưa có lượt điểm danh nào được ghi nhận hôm nay.
                  </td>
                </tr>
              ) : (
                attendanceList.map((att) => {
                  const st = statusMap[att.status] || { label: att.status, variant: 'default' };
                  return (
                    <tr key={att.id} className="hover:bg-pastel-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">{att.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{att.user_name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{att.user_department}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-pastel-700">{att.check_in || '--:--'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{att.check_out || '--:--'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {att.total_hours > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-pastel-100 text-pastel-800 text-[11px]">
                            {att.total_hours}h
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={st.variant} className="gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot || 'bg-slate-400'}`} />
                          <span>{st.label}</span>
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{att.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
