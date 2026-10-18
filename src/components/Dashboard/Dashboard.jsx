import React from 'react';
import {
  Laptop,
  TrendingUp,
  AlertCircle,
  CalendarCheck,
  ArrowUpRight,
  Download,
  Clock,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Badge } from '../Common/Badge';
import { exportToExcel } from '../../utils/exportExcel';

export function Dashboard({ summaryData, monthlyData, onNavigate }) {
  const stats = summaryData?.stats || {};
  const reminders = summaryData?.urgentReminders || [];

  // Format tiền tệ VNĐ
  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const handleExportQuickReport = () => {
    const reportData = [
      { 'Chỉ số': 'Tổng số lượng tài sản', 'Giá trị': stats.totalAssets || 0 },
      { 'Chỉ số': 'Tài sản đang cấp phát sử dụng', 'Giá trị': stats.inUseAssets || 0 },
      { 'Chỉ số': 'Tổng giá trị tài sản', 'Giá trị': formatVND(stats.totalAssetValue) },
      { 'Chỉ số': 'Doanh thu lũy kế', 'Giá trị': formatVND(stats.totalRevenue) },
      { 'Chỉ số': 'Chi phí vận hành', 'Giá trị': formatVND(stats.totalExpense) },
      { 'Chỉ số': 'Lợi nhuận ròng', 'Giá trị': formatVND(stats.netProfit) },
      { 'Chỉ số': 'Công việc đang chờ xử lý', 'Giá trị': stats.pendingTasksCount || 0 },
      { 'Chỉ số': 'Công việc quá hạn', 'Giá trị': stats.overdueTasksCount || 0 },
      { 'Chỉ số': 'Hợp đồng đang hiệu lực', 'Giá trị': stats.activeContractsCount || 0 },
    ];
    exportToExcel(reportData, 'Bao_Cao_Tong_Hop_Doanh_Nghiep', 'Tổng Quan');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Bảng Điều Khiển Tổng Quan
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi tình trạng tài sản, dòng tiền doanh thu và tiến độ công việc doanh nghiệp.
          </p>
        </div>

        <button
          onClick={handleExportQuickReport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg transition-all"
        >
          <FileSpreadsheet size={16} />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tài sản */}
        <div
          onClick={() => onNavigate('assets')}
          className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tài sản & Thiết bị
            </span>
            <div className="w-10 h-10 rounded-xl bg-pastel-100 text-pastel-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Laptop size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalAssets || 0}</h3>
            <p className="text-xs text-pastel-600 font-medium mt-1">
              Đang dùng: {stats.inUseAssets || 0} • Bảo trì: {stats.maintenanceAssets || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Giá trị: <span className="font-semibold text-slate-600">{formatVND(stats.totalAssetValue)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Doanh thu tháng */}
        <div
          onClick={() => onNavigate('finance')}
          className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Doanh thu lũy kế
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{formatVND(stats.totalRevenue)}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="success">+18.4%</Badge>
              <span className="text-xs text-slate-400">so với tháng trước</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Lợi nhuận ròng: <span className="font-semibold text-emerald-600">{formatVND(stats.netProfit)}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Công việc & Nhắc hạn */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Công việc & Nhắc hạn
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
              stats.overdueTasksCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-pastel-100 text-pastel-600'
            }`}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{stats.pendingTasksCount || 0}</h3>
            <div className="flex items-center gap-2 mt-1">
              {stats.overdueTasksCount > 0 ? (
                <Badge variant="danger">{stats.overdueTasksCount} quá hạn</Badge>
              ) : (
                <Badge variant="success">Không có việc trễ</Badge>
              )}
              <span className="text-xs text-slate-500">{stats.upcomingTasksCount || 0} sắp tới</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Xem chi tiết các việc được giao →</p>
          </div>
        </div>

        {/* Card 4: Hợp đồng & Nhân sự */}
        <div
          onClick={() => onNavigate('contracts')}
          className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hợp đồng & Vận hành
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{stats.activeContractsCount || 0}</h3>
            <p className="text-xs text-sky-600 font-medium mt-1">
              Hợp đồng đang hiệu lực
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Quy mô nhân sự: <span className="font-semibold text-slate-600">{stats.totalUsersCount || 0} thành viên</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Chart & Reminders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-pastel-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Biểu Đồ Tăng Trưởng Doanh Thu & Chi Phí (2024)</h3>
              <p className="text-xs text-slate-400">Đơn vị: VNĐ</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-pastel-500"></span>
                <span className="text-slate-600">Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                <span className="text-slate-600">Chi phí</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData?.monthlyData || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E9F8E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4E9F8E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
                />
                <Tooltip
                  formatter={(value) => [formatVND(value), '']}
                  labelStyle={{ fontWeight: 'bold', color: '#1E293B' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #CEE8DD',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#4E9F8E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Chi phí"
                  stroke="#FB7185"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Urgent Reminders & Actions */}
        <div className="bg-white p-6 rounded-2xl border border-pastel-200/80 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock size={16} className="text-pastel-600" />
                <span>Nhắc Hạn Trọng Tâm</span>
              </h3>
              <span className="text-xs text-pastel-600 font-semibold cursor-pointer" onClick={() => onNavigate('tasks')}>
                Xem tất cả
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {reminders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle size={32} className="mx-auto text-emerald-400" />
                  <p className="text-xs text-slate-500 mt-2">Mọi công việc đều đúng tiến độ!</p>
                </div>
              ) : (
                reminders.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-pastel-50/50 border border-pastel-200/60 hover:border-pastel-400 transition-all text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                        {item.title}
                      </p>
                      <Badge
                        variant={item.level === 'danger' ? 'danger' : item.level === 'warning' ? 'warning' : 'info'}
                      >
                        {item.level === 'danger' ? 'Quá hạn' : 'Sắp tới'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Hạn xử lý: {item.date}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('tasks')}
              className="w-full py-2.5 px-4 bg-pastel-50 hover:bg-pastel-100/80 text-pastel-700 text-xs font-semibold rounded-xl border border-pastel-200 flex items-center justify-center gap-2 transition-all"
            >
              <span>Xem Bảng Phân Công Công Việc</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
