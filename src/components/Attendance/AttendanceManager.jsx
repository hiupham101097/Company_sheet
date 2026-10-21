import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  FileSpreadsheet,
  AlertCircle,
  Timer,
  Users,
  Search,
  Filter,
  Eye,
  Calendar,
  Award,
  TrendingUp,
  Download,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';
import { formatDateVN } from '../../utils/formatters';

export function AttendanceManager({ attendanceList = [], users = [], summary, onRefresh }) {
  // Navigation sub-tab: 'DAILY' (Điểm danh & Nhật ký) vs 'ACCOUNTING' (Thống kê từng cá nhân cho Kế toán)
  const [activeSubTab, setActiveSubTab] = useState('ACCOUNTING');

  // Daily check-in terminal state
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || 'usr_1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Accounting filter state
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [detailUser, setDetailUser] = useState(null); // Selected user for deep-dive timesheet modal

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

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const selectedUserTodayRecord = attendanceList.find(
    (att) => att.user_id === selectedUser && att.date === todayStr
  );
  const isCheckedIn = !!selectedUserTodayRecord?.check_in;
  const isCheckedOut = !!selectedUserTodayRecord?.check_out;

  // Extract distinct available months from attendanceList
  const availableMonths = useMemo(() => {
    const months = new Set();
    attendanceList.forEach((att) => {
      if (att.date && att.date.length >= 7) {
        months.add(att.date.slice(0, 7));
      }
    });
    const currentMonth = new Date().toISOString().slice(0, 7);
    months.add(currentMonth);
    return Array.from(months).sort().reverse();
  }, [attendanceList]);

  // Extract distinct departments from users
  const availableDepts = useMemo(() => {
    const depts = new Set();
    users.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return Array.from(depts);
  }, [users]);

  // Calculate detailed individual statistics for each employee
  const employeeTimesheets = useMemo(() => {
    return users.map((user) => {
      // Filter records belonging to this user and matching the selected month
      const userRecords = attendanceList.filter((att) => {
        const matchUser = att.user_id === user.id;
        const matchMonth = selectedMonth === 'ALL' || (att.date && att.date.startsWith(selectedMonth));
        return matchUser && matchMonth;
      });

      const totalDaysWorked = userRecords.filter((r) => r.check_in).length;
      const totalHours = Math.round(
        userRecords.reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0) * 10
      ) / 10;
      
      // Quy chuẩn ngày công kế toán: 1 ngày công chuẩn = 8.0 giờ làm việc
      const standardWorkDays = Math.round((totalHours / 8) * 10) / 10;

      const onTimeDays = userRecords.filter((r) => r.status === 'ON_TIME').length;
      const lateDays = userRecords.filter((r) => r.status === 'LATE').length;
      const earlyLeaveDays = userRecords.filter((r) => r.status === 'EARLY_LEAVE').length;

      // Punctuality rate % (Tỷ lệ chuyên cần đúng giờ)
      const punctualityRate = totalDaysWorked > 0 ? Math.round((onTimeDays / totalDaysWorked) * 100) : 0;

      return {
        user,
        records: userRecords.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
        totalDaysWorked,
        totalHours,
        standardWorkDays,
        onTimeDays,
        lateDays,
        earlyLeaveDays,
        punctualityRate
      };
    });
  }, [users, attendanceList, selectedMonth]);

  // Filter employee timesheets by department and search query
  const filteredEmployeeTimesheets = useMemo(() => {
    return employeeTimesheets.filter((item) => {
      const matchDept = selectedDept === 'ALL' || item.user.department === selectedDept;
      const q = searchEmployee.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.user.name && item.user.name.toLowerCase().includes(q)) ||
        (item.user.email && item.user.email.toLowerCase().includes(q)) ||
        (item.user.phone && item.user.phone.includes(q)) ||
        (item.user.id && item.user.id.toLowerCase().includes(q));
      return matchDept && matchSearch;
    });
  }, [employeeTimesheets, selectedDept, searchEmployee]);

  // Aggregate totals for the accounting tab summary cards
  const accountingAggregates = useMemo(() => {
    const totalStaffCount = filteredEmployeeTimesheets.length;
    const totalCompanyDays = filteredEmployeeTimesheets.reduce((sum, item) => sum + item.totalDaysWorked, 0);
    const totalCompanyHours = Math.round(
      filteredEmployeeTimesheets.reduce((sum, item) => sum + item.totalHours, 0) * 10
    ) / 10;
    const totalCompanyStandardDays = Math.round(
      filteredEmployeeTimesheets.reduce((sum, item) => sum + item.standardWorkDays, 0) * 10
    ) / 10;
    const totalLateIncidents = filteredEmployeeTimesheets.reduce((sum, item) => sum + item.lateDays, 0);
    const avgPunctuality = totalStaffCount > 0
      ? Math.round(filteredEmployeeTimesheets.reduce((sum, item) => sum + item.punctualityRate, 0) / totalStaffCount)
      : 100;

    return {
      totalStaffCount,
      totalCompanyDays,
      totalCompanyHours,
      totalCompanyStandardDays,
      totalLateIncidents,
      avgPunctuality
    };
  }, [filteredEmployeeTimesheets]);

  const handleAction = async (action) => {
    if (!selectedUser) {
      alert('Vui lòng chọn nhân viên cần điểm danh');
      return;
    }

    if (action === 'CHECK_IN') {
      if (isCheckedIn) {
        if (isCheckedOut) {
          alert(`Nhân viên đã hoàn tất ca làm việc hôm nay (đã Check-out lúc ${selectedUserTodayRecord.check_out}). Vui lòng chờ đến ngày mai để bắt đầu ca mới!`);
        } else {
          alert(`Nhân viên đã điểm danh vào ca hôm nay lúc ${selectedUserTodayRecord.check_in}. Một ngày chỉ được điểm danh vào ca 1 lần!`);
        }
        return;
      }
    }

    if (action === 'CHECK_OUT') {
      if (!isCheckedIn) {
        alert('Nhân viên chưa điểm danh vào ca (Check-in) trong ngày hôm nay nên chưa thể tan ca!');
        return;
      }
      if (isCheckedOut) {
        alert(`Nhân viên đã điểm danh tan ca hôm nay lúc ${selectedUserTodayRecord.check_out} rồi!`);
        return;
      }
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

  // Xuất file Excel nhật ký ngày thông thường
  const handleExportDailyExcel = () => {
    const exportData = attendanceList.map((att) => ({
      'Ngày': formatDateVN(att.date),
      'Mã nhân viên': att.user_id,
      'Họ và tên': att.user_name,
      'Phòng ban': att.user_department,
      'Giờ vào': att.check_in || 'Chưa vào',
      'Giờ ra': att.check_out || 'Chưa ra',
      'Tổng giờ làm': att.total_hours || 0,
      'Trạng thái': statusMap[att.status]?.label || att.status,
      'Ghi chú': att.notes || ''
    }));
    exportToExcel(exportData, 'Nhat_Ky_Diem_Danh_Hang_Ngay', 'Nhật Ký');
  };

  // Xuất bảng tính lương & công kế toán chuyên dụng
  const handleExportAccountingExcel = () => {
    const monthLabel = selectedMonth === 'ALL' ? 'Toan_Thoi_Gian' : selectedMonth.replace('-', '_');
    const exportData = filteredEmployeeTimesheets.map((item, index) => ({
      'STT': index + 1,
      'Mã Nhân Viên': item.user.id,
      'Họ Và Tên': item.user.name,
      'Phòng Ban': item.user.department || 'Chưa gán',
      'Chức Vụ': item.user.role === 'ADMIN' ? 'Quản trị viên' : item.user.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên',
      'Số Ngày Đi Làm (Ngày)': item.totalDaysWorked,
      'Tổng Giờ Làm (Giờ)': item.totalHours,
      'Số Công Chuẩn (Giờ / 8)': item.standardWorkDays,
      'Đúng Giờ (Ngày)': item.onTimeDays,
      'Đi Muộn (Lần)': item.lateDays,
      'Về Sớm (Lần)': item.earlyLeaveDays,
      'Tỷ Lệ Chuyên Cần (%)': `${item.punctualityRate}%`,
      'Đánh Giá Kế Toán':
        item.lateDays === 0 && item.totalDaysWorked > 0
          ? 'Đạt chuyên cần xuất sắc'
          : item.lateDays <= 2
            ? 'Đạt chuyên cần tiêu chuẩn'
            : `Vi phạm đi muộn ${item.lateDays} lần`
    }));

    exportToExcel(
      exportData,
      `Bang_Tong_Hop_Cong_Ke_Toan_${monthLabel}`,
      'Bảng Công Kế Toán'
    );
  };

  // Xuất bảng công chi tiết của riêng một nhân sự cụ thể
  const handleExportSingleEmployeeExcel = (timesheetItem) => {
    if (!timesheetItem || !timesheetItem.records.length) {
      alert('Nhân viên này chưa có nhật ký chấm công nào trong kỳ được chọn!');
      return;
    }
    const exportData = timesheetItem.records.map((r) => ({
      'Ngày làm': formatDateVN(r.date),
      'Mã NV': timesheetItem.user.id,
      'Họ tên': timesheetItem.user.name,
      'Giờ vào': r.check_in || '--:--',
      'Giờ ra': r.check_out || '--:--',
      'Số giờ làm': r.total_hours || 0,
      'Trạng thái': statusMap[r.status]?.label || r.status,
      'Ghi chú': r.notes || ''
    }));

    exportToExcel(
      exportData,
      `Bang_Cong_${timesheetItem.user.id}_${timesheetItem.user.name.replace(/\s+/g, '_')}`,
      'Chi Tiết Công'
    );
  };

  const todayVN = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6 pb-28">
      {/* Main Header with Top Level Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Quản Lý Chấm Công & Bảng Công Nhân Sự
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              Kế toán & Tiền lương
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi thời gian làm việc, tổng hợp ngày công và xuất dữ liệu tính lương chính xác cho kế toán.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeSubTab === 'ACCOUNTING' ? (
            <button
              onClick={handleExportAccountingExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-600 hover:bg-pastel-700 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all"
            >
              <FileSpreadsheet size={16} />
              <span>Xuất Bảng Công Kế Toán (Excel)</span>
            </button>
          ) : (
            <button
              onClick={handleExportDailyExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <FileSpreadsheet size={16} className="text-pastel-600" />
              <span>Xuất Nhật Ký Chấm Công</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Switcher Bar */}
      <div className="flex items-center gap-3 border-b border-pastel-200/80 pb-3">
        <button
          onClick={() => setActiveSubTab('ACCOUNTING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
            activeSubTab === 'ACCOUNTING'
              ? 'bg-pastel-500 text-white shadow-soft'
              : 'bg-white text-slate-600 hover:bg-pastel-50 border border-pastel-200/80'
          }`}
        >
          <Award size={15} />
          <span>Thống Kê Công Từng Cá Nhân (Kế Toán)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'ACCOUNTING' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {users.length} NV
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('DAILY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
            activeSubTab === 'DAILY'
              ? 'bg-pastel-500 text-white shadow-soft'
              : 'bg-white text-slate-600 hover:bg-pastel-50 border border-pastel-200/80'
          }`}
        >
          <Clock size={15} />
          <span>Điểm Danh Hàng Ngày & Nhật Ký Ca</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'DAILY' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Hôm nay
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: THỐNG KÊ CÔNG TỪNG CÁ NHÂN (HỖ TRỢ KẾ TOÁN TÍNH LƯƠNG) */}
      {/* ======================================================== */}
      {activeSubTab === 'ACCOUNTING' && (
        <div className="space-y-6">
          {/* Accounting KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Nhân Sự Tính Công
              </span>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">
                {accountingAggregates.totalStaffCount} nhân viên
              </h3>
              <p className="text-xs text-pastel-600 font-medium mt-1">Được theo dõi ngày công</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng Giờ Công Toàn Doanh Nghiệp
              </span>
              <h3 className="text-2xl font-bold text-indigo-600 mt-2">
                {accountingAggregates.totalCompanyHours} giờ
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Tương đương <span className="font-bold text-indigo-700">{accountingAggregates.totalCompanyStandardDays}</span> ngày công chuẩn (h/8)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng Ngày Có Mặt Làm Việc
              </span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-2">
                {accountingAggregates.totalCompanyDays} lượt
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tỷ lệ chuyên cần trung bình: <span className="font-bold text-emerald-700">{accountingAggregates.avgPunctuality}%</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Cảnh Báo Đi Muộn / Kỷ Luật
              </span>
              <h3 className="text-2xl font-bold text-amber-600 mt-2">
                {accountingAggregates.totalLateIncidents} lần
              </h3>
              <p className="text-xs text-slate-400 mt-1">Căn cứ trừ thưởng chuyên cần</p>
            </div>
          </div>

          {/* Filter Bar: Month Selector, Department & Employee Search */}
          <div className="bg-white p-4 rounded-3xl border border-pastel-200/90 shadow-soft space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Left Filters: Month & Department */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Month Picker */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-600">Kỳ chấm công:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-bold text-pastel-700 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Toàn bộ thời gian</option>
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        Tháng {m.slice(5, 7)}/{m.slice(0, 4)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department Filter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <Building2 size={14} className="text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-600">Phòng ban:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tất cả phòng ban</option>
                    {availableDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Search Input */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên theo tên, email, mã NV..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Individual Timesheet Summary Table (Accounting) */}
          <div className="bg-white rounded-3xl border border-pastel-200/90 shadow-soft overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-pastel-100 flex items-center justify-between bg-gradient-to-r from-pastel-50/70 to-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-pastel-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Bảng Tổng Hợp Ngày Công & Giờ Làm Nhân Sự Cho Kế Toán
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                Hiển thị {filteredEmployeeTimesheets.length} / {users.length} nhân sự
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: '950px' }}>
                <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                  <tr>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Nhân Viên</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Phòng Ban</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center">Số Ngày Đi Làm</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center">Tổng Giờ Làm</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center bg-indigo-50/60 text-indigo-900">
                      Công Chuẩn (h/8)
                    </th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center">Đúng Giờ</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center">Đi Muộn</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center">Chuyên Cần</th>
                    <th className="py-3.5 px-4 font-bold text-center whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredEmployeeTimesheets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployeeTimesheets.map((item) => (
                      <tr key={item.user.id} className="hover:bg-pastel-50/30 transition-colors">
                        {/* Nhân Viên: Avatar + Name + Email */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                item.user.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.user.name)}`
                              }
                              alt={item.user.name}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-pastel-200/80 shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.user.name}</h4>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Phòng Ban */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            {item.user.department || 'Chưa gán'}
                          </span>
                        </td>

                        {/* Số Ngày Đi Làm */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80">
                            {item.totalDaysWorked} ngày
                          </span>
                        </td>

                        {/* Tổng Giờ Làm */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {item.totalHours}h
                          </span>
                        </td>

                        {/* Công Chuẩn Kế Toán (h/8) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap bg-indigo-50/30">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-indigo-100 text-indigo-900 font-bold font-mono text-xs border border-indigo-200 shadow-xs">
                            {item.standardWorkDays} công
                          </span>
                        </td>

                        {/* Đúng Giờ */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-emerald-700 font-bold">
                          {item.onTimeDays}
                        </td>

                        {/* Đi Muộn */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.lateDays > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200">
                              <AlertCircle size={11} className="text-amber-600" />
                              <span>{item.lateDays} lần</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">0</span>
                          )}
                        </td>

                        {/* Chuyên Cần */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`text-xs font-bold font-mono ${
                                item.punctualityRate >= 90
                                  ? 'text-emerald-600'
                                  : item.punctualityRate >= 70
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                              }`}
                            >
                              {item.punctualityRate}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.punctualityRate >= 90
                                    ? 'bg-emerald-500'
                                    : item.punctualityRate >= 70
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                }`}
                                style={{ width: `${item.punctualityRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Thao Tác: Xem Chi Tiết Bảng Công */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setDetailUser(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 border border-pastel-200 text-xs font-bold shadow-xs transition-colors"
                          >
                            <Eye size={13} />
                            <span>Chi Tiết Công</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ĐIỂM DANH HÀNG NGÀY & TERMINAL CA LÀM VIỆC */}
      {/* ======================================================== */}
      {activeSubTab === 'DAILY' && (
        <div className="space-y-6">
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
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Tỷ lệ có mặt: <span className="font-bold text-emerald-700">{summary?.attendanceRate || '0%'}</span>
              </p>
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
          <div className="p-5 sm:p-6 bg-gradient-to-br from-white via-pastel-50/50 to-indigo-50/30 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-pastel-100">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pastel-600 to-indigo-600 text-white flex items-center justify-center shadow-soft shrink-0">
                  <UserCheck size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-base font-bold text-slate-800 tracking-tight whitespace-nowrap">
                      Bảng Chấm Công Trực Tiếp
                    </h4>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pastel-100 text-pastel-800 font-mono text-xs font-bold border border-pastel-200/60 shadow-xs shrink-0">
                      <Timer size={13} className="text-pastel-600 animate-spin" />
                      <span>{currentTime || '08:30:00'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    {todayVN} • Chọn nhân sự và thực hiện điểm danh vào ca hoặc tan ca
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-pastel-200 text-slate-600 text-xs font-semibold shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ca tiêu chuẩn: 08:30 - 17:30</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4 min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nhân Sự Điểm Danh
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-pastel-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pastel-400 text-slate-800 shadow-xs truncate"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4 min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ghi Chú Đính Kèm (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Lý do đi muộn, công tác, tăng ca..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-pastel-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pastel-400 text-slate-800 shadow-xs"
                />
              </div>

              <div className="md:col-span-4 min-w-0">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAction('CHECK_IN')}
                    disabled={loading || isCheckedIn}
                    title={
                      isCheckedIn
                        ? `Đã vào ca lúc ${selectedUserTodayRecord.check_in}. Một ngày chỉ check-in 1 lần!`
                        : 'Điểm danh vào ca'
                    }
                    className={`justify-center px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-soft flex items-center gap-1.5 transition-all ${
                      isCheckedIn
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-90 cursor-not-allowed font-semibold'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    } disabled:opacity-60`}
                  >
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span className="truncate">
                      {isCheckedIn ? `Đã vào (${selectedUserTodayRecord.check_in})` : 'Vào Ca'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleAction('CHECK_OUT')}
                    disabled={loading || !isCheckedIn || isCheckedOut}
                    title={
                      !isCheckedIn
                        ? 'Cần vào ca trước khi tan ca'
                        : isCheckedOut
                          ? `Đã tan ca lúc ${selectedUserTodayRecord.check_out}. Chờ đến ngày mai để bắt đầu ca mới!`
                          : 'Điểm danh tan ca'
                    }
                    className={`justify-center px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-soft flex items-center gap-1.5 transition-all ${
                      isCheckedOut
                        ? 'bg-slate-100 text-slate-500 border border-slate-200 opacity-60 cursor-not-allowed font-semibold'
                        : isCheckedIn
                          ? 'bg-slate-800 hover:bg-slate-900 text-white active:scale-95'
                          : 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Clock size={15} className="shrink-0" />
                    <span className="truncate">
                      {isCheckedOut ? `Đã ra (${selectedUserTodayRecord.check_out})` : 'Tan Ca'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {isCheckedOut && (
              <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Nhân viên <strong>{selectedUserTodayRecord?.user_name}</strong> đã hoàn tất ca làm việc hôm nay ({selectedUserTodayRecord.check_in} → {selectedUserTodayRecord.check_out} • {selectedUserTodayRecord.total_hours}h). Hẹn gặp vào ngày mai!
                </span>
              </div>
            )}
          </div>

          {/* Attendance History Table Card */}
          <div className="bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-pastel-100 flex items-center justify-between bg-pastel-50/40">
              <h3 className="text-sm font-bold text-slate-800">Nhật Ký Điểm Danh Gần Đây</h3>
              <span className="text-xs text-pastel-700 font-semibold bg-pastel-100 px-3 py-1 rounded-full">
                Hôm nay: {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Desktop View: Full Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: '850px' }}>
                <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                  <tr>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Ngày</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Nhân Sự</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Phòng Ban</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Giờ Vào</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Giờ Ra</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center">Tổng Giờ Làm</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Trạng Thái</th>
                    <th className="py-3.5 px-4 font-bold">Ghi Chú</th>
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
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-medium whitespace-nowrap">
                            {formatDateVN(att.date)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                            {att.user_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {att.user_department}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-pastel-700 whitespace-nowrap">
                            {att.check_in || '--:--'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {att.check_out || '--:--'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700 text-center whitespace-nowrap">
                            {att.total_hours > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-pastel-100 text-pastel-800 text-[11px] whitespace-nowrap font-mono">
                                {att.total_hours}h
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
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
      )}

      {/* ======================================================== */}
      {/* MODAL: BẢNG CÔNG CHI TIẾT TỪNG NGÀY CỦA RIÊNG MỘT NHÂN SỰ */}
      {/* ======================================================== */}
      {detailUser && (
        <Modal
          isOpen={!!detailUser}
          onClose={() => setDetailUser(null)}
          title={`Chi Tiết Bảng Công Nhân Sự: ${detailUser.user.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Profile Info inside Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-pastel-50 via-indigo-50/40 to-white border border-pastel-200/80">
              <div className="flex items-center gap-3">
                <img
                  src={
                    detailUser.user.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(detailUser.user.name)}`
                  }
                  alt={detailUser.user.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-pastel-300 shrink-0 shadow-sm"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-800">{detailUser.user.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                    <span className="font-semibold text-pastel-700">{detailUser.user.department || 'Chưa gán'}</span>
                    <span>•</span>
                    <span className="font-mono">{detailUser.user.email}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExportSingleEmployeeExcel(detailUser)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold shadow-xs transition-colors self-start sm:self-auto shrink-0"
              >
                <Download size={14} className="text-pastel-600" />
                <span>Xuất Bảng Công Excel</span>
              </button>
            </div>

            {/* Quick KPI Stat Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Số Ngày Đi Làm
                </span>
                <span className="text-lg font-bold text-emerald-600 font-mono mt-0.5 block">
                  {detailUser.totalDaysWorked} ngày
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tổng Giờ Làm
                </span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
                  {detailUser.totalHours}h
                </span>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/70 shadow-xs text-center">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Công Chuẩn (h/8)
                </span>
                <span className="text-lg font-bold text-indigo-900 font-mono mt-0.5 block">
                  {detailUser.standardWorkDays} công
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Số Lần Đi Muộn
                </span>
                <span
                  className={`text-lg font-bold font-mono mt-0.5 block ${
                    detailUser.lateDays > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {detailUser.lateDays} lần
                </span>
              </div>
            </div>

            {/* Records Log Table for this User */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                <span>Nhật Ký Các Ngày Điểm Danh Trong Kỳ</span>
                <span className="font-normal text-slate-400 text-[11px]">
                  Tổng {detailUser.records.length} bản ghi
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 sticky top-0 bg-slate-50 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Giờ Vào</th>
                      <th className="py-2.5 px-3">Giờ Ra</th>
                      <th className="py-2.5 px-3 text-center">Số Giờ</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 px-3">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailUser.records.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Chưa có lịch sử chấm công nào trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      detailUser.records.map((r) => {
                        const st = statusMap[r.status] || { label: r.status, variant: 'default' };
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                              {formatDateVN(r.date)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-pastel-700">
                              {r.check_in || '--:--'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                              {r.check_out || '--:--'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                              {r.total_hours > 0 ? `${r.total_hours}h` : '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant={st.variant} className="gap-1 text-[10px] py-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot || 'bg-slate-400'}`} />
                                <span>{st.label}</span>
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{r.notes || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Bottom Close */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
