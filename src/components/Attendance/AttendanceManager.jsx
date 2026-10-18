import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';

export function AttendanceManager({ attendanceList = [], users = [], summary, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || 'usr_1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const statusMap = {
    ON_TIME: { label: 'Đúng giờ', variant: 'success' },
    LATE: { label: 'Đi muộn', variant: 'warning' },
    EARLY_LEAVE: { label: 'Về sớm', variant: 'info' },
    ABSENT: { label: 'Vắng mặt', variant: 'danger' },
  };

  const handleAction = async (action) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Chấm Công & Điểm Danh Nhân Sự
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi thời gian làm việc hàng ngày, tỷ lệ đi làm đúng giờ và tổng hợp bảng chấm công tháng.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
        >
          <FileSpreadsheet size={16} className="text-pastel-600" />
          <span>Xuất Bảng Chấm Công Excel</span>
        </button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Quy Mô Nhân Viên
          </span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{summary?.totalStaff || users.length}</h3>
          <p className="text-xs text-pastel-600 font-medium mt-1">Đang hoạt động</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Đã Điểm Danh Hôm Nay
          </span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-2">{summary?.checkedInCount || 0}</h3>
          <p className="text-xs text-slate-400 mt-1">Tỷ lệ: {summary?.attendanceRate || '0%'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Đi Làm Đúng Giờ
          </span>
          <h3 className="text-2xl font-bold text-pastel-700 mt-2">{summary?.onTimeCount || 0}</h3>
          <p className="text-xs text-slate-400 mt-1">Trước 08:30 sáng</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Ghi Nhận Đi Muộn
          </span>
          <h3 className="text-2xl font-bold text-amber-600 mt-2">{summary?.lateCount || 0}</h3>
          <p className="text-xs text-slate-400 mt-1">Sau 08:30 sáng</p>
        </div>
      </div>

      {/* Quick Check-in Terminal Card */}
      <div className="p-5 bg-gradient-to-r from-pastel-50/80 via-white to-pastel-50/40 rounded-2xl border border-pastel-200 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-500 text-white flex items-center justify-center shadow-soft">
              <UserCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Bảng Chấm Công Nhanh</h4>
              <p className="text-xs text-slate-500">Chọn nhân viên và nhấn Check-in/Check-out ca làm việc</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pastel-400"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} - {u.department}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Ghi chú (lý do đi muộn / làm thêm)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pastel-400 w-52"
            />

            <button
              onClick={() => handleAction('CHECK_IN')}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 size={14} />
              <span>Vào Ca (Check-in)</span>
            </button>

            <button
              onClick={() => handleAction('CHECK_OUT')}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Clock size={14} />
              <span>Tan Ca (Check-out)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-pastel-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Nhật Ký Điểm Danh Gần Đây</h3>
          <span className="text-xs text-slate-400 font-medium">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-pastel-50/60 text-slate-700 font-semibold uppercase text-[11px] tracking-wider border-b border-pastel-100">
              <tr>
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Nhân Sự</th>
                <th className="py-3 px-4">Phòng Ban</th>
                <th className="py-3 px-4">Giờ Vào</th>
                <th className="py-3 px-4">Giờ Ra</th>
                <th className="py-3 px-4">Tổng Giờ Làm</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {attendanceList.map((att) => {
                const st = statusMap[att.status] || { label: att.status, variant: 'default' };
                return (
                  <tr key={att.id} className="hover:bg-pastel-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{att.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{att.user_name}</td>
                    <td className="py-3 px-4 text-slate-500">{att.user_department}</td>
                    <td className="py-3 px-4 font-bold text-pastel-700">{att.check_in || '--:--'}</td>
                    <td className="py-3 px-4 font-bold text-slate-600">{att.check_out || '--:--'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {att.total_hours > 0 ? `${att.total_hours}h` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{att.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
