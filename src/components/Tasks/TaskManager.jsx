import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';

export function TaskManager({ tasks = [], users = [], onRefresh, currentUserId = 'usr_1' }) {
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, MY_TASKS, UPCOMING, OVERDUE, COMPLETED
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to_user_id: '',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM'
  });

  const priorityMap = {
    LOW: { label: 'Thấp', variant: 'default' },
    MEDIUM: { label: 'Trung bình', variant: 'info' },
    HIGH: { label: 'Quan trọng', variant: 'warning' },
    URGENT: { label: 'Khẩn cấp', variant: 'danger' }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterTab === 'MY_TASKS') return task.assigned_to_user_id === currentUserId;
    if (filterTab === 'UPCOMING') return task.urgency === 'UPCOMING' || task.urgency === 'TODAY';
    if (filterTab === 'OVERDUE') return task.urgency === 'OVERDUE' && task.status !== 'COMPLETED';
    if (filterTab === 'COMPLETED') return task.status === 'COMPLETED';
    return true;
  });

  const handleToggleStatus = async (task) => {
    try {
      const nextStatus = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
      await api.updateTask(task.id, { status: nextStatus });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật công việc');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createTask(formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        assigned_to_user_id: '',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'MEDIUM'
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Lỗi tạo công việc');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có muốn xóa công việc này?')) {
      try {
        await api.deleteTask(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(err.message || 'Lỗi xóa công việc');
      }
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredTasks.map((t) => ({
      'Tiêu đề': t.title,
      'Người được giao': t.assigned_user_name,
      'Hạn chót': t.due_date,
      'Mức ưu tiên': priorityMap[t.priority]?.label || t.priority,
      'Trạng thái': t.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang thực hiện',
      'Cảnh báo thời hạn': t.urgency === 'OVERDUE' ? 'Quá hạn' : t.urgency === 'UPCOMING' ? 'Sắp tới' : 'Bình thường',
      'Mô tả': t.description
    }));
    exportToExcel(exportData, 'Danh_Sach_Cong_Viec_Va_Nhac_Han', 'Công Việc');
  };

  const overdueCount = tasks.filter((t) => t.urgency === 'OVERDUE' && t.status !== 'COMPLETED').length;
  const upcomingCount = tasks.filter((t) => t.urgency === 'UPCOMING' && t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Công Việc & Nhắc Hạn
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi phân công nhiệm vụ, cảnh báo công việc sắp đến hạn và xử lý công việc quá hạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <FileSpreadsheet size={16} className="text-pastel-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg transition-all"
          >
            <Plus size={16} />
            <span>Giao Việc Mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-pastel-200/70 pb-3 overflow-x-auto">
        {[
          { id: 'ALL', label: 'Tất cả công việc', count: tasks.length },
          { id: 'MY_TASKS', label: 'Việc được giao cho tôi', count: tasks.filter((t) => t.assigned_to_user_id === currentUserId).length },
          { id: 'UPCOMING', label: 'Sắp tới hạn (≤3 ngày)', count: upcomingCount, badgeColor: 'bg-amber-100 text-amber-700' },
          { id: 'OVERDUE', label: 'Quá hạn', count: overdueCount, badgeColor: 'bg-rose-100 text-rose-700 font-bold' },
          { id: 'COMPLETED', label: 'Đã hoàn thành', count: tasks.filter((t) => t.status === 'COMPLETED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === tab.id
                ? 'bg-pastel-500 text-white shadow-soft'
                : 'text-slate-600 hover:bg-pastel-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                filterTab === tab.id
                  ? 'bg-white/20 text-white'
                  : tab.badgeColor || 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-2 py-16 text-center bg-white rounded-2xl border border-pastel-200/80">
            <CheckCircle2 size={36} className="mx-auto text-pastel-400" />
            <p className="text-xs text-slate-500 mt-2">Không có công việc nào trong danh mục này.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const isOverdue = task.urgency === 'OVERDUE' && !isDone;
            const isUpcoming = (task.urgency === 'UPCOMING' || task.urgency === 'TODAY') && !isDone;

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl bg-white border transition-all ${
                  isOverdue
                    ? 'border-rose-200 shadow-xs ring-1 ring-rose-100'
                    : isUpcoming
                    ? 'border-amber-200 shadow-xs'
                    : 'border-pastel-200/80 shadow-soft'
                } flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-pastel-500 border-pastel-500 text-white'
                            : 'border-slate-300 hover:border-pastel-500 bg-white'
                        }`}
                      >
                        {isDone && <CheckCircle2 size={14} />}
                      </button>

                      <div>
                        <h4
                          className={`text-sm font-bold text-slate-800 ${
                            isDone ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge variant={priorityMap[task.priority]?.variant || 'default'}>
                      {priorityMap[task.priority]?.label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pastel-100 text-pastel-700 flex items-center justify-center font-bold text-[10px]">
                      {task.assigned_user_name?.slice(0, 1) || 'U'}
                    </div>
                    <span className="font-medium text-slate-700">{task.assigned_user_name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-1 font-semibold text-[11px] ${
                        isOverdue
                          ? 'text-rose-600'
                          : isUpcoming
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      <Clock size={13} />
                      <span>{task.due_date}</span>
                      {isOverdue && <span className="font-bold">(Quá hạn)</span>}
                      {isUpcoming && <span className="font-bold">(Sắp tới)</span>}
                    </div>

                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Giao Việc Mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Giao Việc Mới & Thiết Lập Hạn Chót"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tiêu đề công việc *</label>
            <input
              type="text"
              required
              placeholder="VD: Kiểm kê định kỳ thiết bị phòng IT"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người thực hiện *</label>
              <select
                required
                value={formData.assigned_to_user_id}
                onChange={(e) => setFormData({ ...formData, assigned_to_user_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              >
                <option value="">-- Chọn nhân sự phụ trách --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Quan trọng</option>
                <option value="URGENT">Khẩn cấp (Ưu tiên hàng đầu)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Thời hạn hoàn thành (Due date) *</label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả chi tiết yêu cầu</label>
            <textarea
              rows={3}
              placeholder="Yêu cầu chi tiết, chỉ tiêu bàn giao hoặc link tài liệu..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-pastel-500 hover:bg-pastel-600 text-white font-semibold shadow-soft transition-all"
            >
              Tạo Công Việc
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
