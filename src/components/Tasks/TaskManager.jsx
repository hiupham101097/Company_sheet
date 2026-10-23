import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  User,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  Building2
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';
import { formatDateVN } from '../../utils/formatters';
import { hasPermission } from '../../utils/permissionHelper';

export function TaskManager({ 
  tasks = [], 
  users = [], 
  onRefresh, 
  currentUserId = 'usr_1',
  currentUser,
  userRole = 'ADMIN',
  companySettings
}) {
  const canView = hasPermission(currentUser, companySettings, 'tasks_view') || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const canCreate = hasPermission(currentUser, companySettings, 'tasks_create') || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const canDelete = hasPermission(currentUser, companySettings, 'tasks_delete') || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, MY_TASKS, UPCOMING, OVERDUE, COMPLETED
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [assignDept, setAssignDept] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriesDept, setCategoriesDept] = useState([]);
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

  useEffect(() => {
    api.getCategories('DEPARTMENT')
      .then((res) => {
        const list = res?.data || [];
        setCategoriesDept(list.map(c => c.name).filter(Boolean));
      })
      .catch((err) => console.error('Error fetching categories in TaskManager:', err));
  }, []);

  // Collect unique list of departments dynamically from API Categories, users, and tasks
  const allDepartments = Array.from(new Set([
    ...categoriesDept,
    ...users.map((u) => u.department).filter(Boolean),
    ...tasks.map((t) => t.assigned_user_department).filter(Boolean)
  ]));

  const filteredTasks = tasks.filter((task) => {
    if (selectedDept !== 'ALL') {
      const taskDept = task.assigned_user_department || users.find((u) => u.id === task.assigned_to_user_id)?.department;
      if (taskDept !== selectedDept) return false;
    }
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
      'Phòng ban': t.assigned_user_department || users.find((u) => u.id === t.assigned_to_user_id)?.department || 'Chưa gán',
      'Hạn chót': formatDateVN(t.due_date),
      'Mức ưu tiên': priorityMap[t.priority]?.label || t.priority,
      'Trạng thái': t.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang thực hiện',
      'Cảnh báo thời hạn': t.urgency === 'OVERDUE' ? 'Quá hạn' : t.urgency === 'UPCOMING' ? 'Sắp tới' : 'Bình thường',
      'Mô tả': t.description
    }));
    exportToExcel(exportData, 'Danh_Sach_Cong_Viec_Va_Nhac_Han', 'Công Việc');
  };

  const overdueCount = tasks.filter((t) => t.urgency === 'OVERDUE' && t.status !== 'COMPLETED').length;
  const upcomingCount = tasks.filter((t) => t.urgency === 'UPCOMING' && t.status !== 'COMPLETED').length;

  if (!canView) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-pastel-200/90 shadow-soft text-center py-16">
        <CheckSquare size={48} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-700">Không Có Quyền Truy Cập</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Bộ phận của bạn không được phân quyền xem hoặc quản lý công việc và phân công nhiệm vụ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Công Việc & Phân Công Theo Phòng Ban
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Giao việc theo chuyên môn từng phòng ban, theo dõi deadline và tự động nhắc hạn mỗi ngày lúc 06:00 AM.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="justify-center inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <FileSpreadsheet size={16} className="text-pastel-600" />
            <span>Xuất Excel</span>
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setAssignDept('ALL');
                setIsModalOpen(true);
              }}
              className="justify-center inline-flex items-center gap-2 px-4 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all"
            >
              <Plus size={16} />
              <span>Giao Việc Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bars */}
      <div className="space-y-3">
        {/* Status Filter Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-pastel-200/80 pb-3 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất cả trạng thái', count: tasks.length },
            { id: 'MY_TASKS', label: 'Việc của tôi', count: tasks.filter((t) => t.assigned_to_user_id === currentUserId).length },
            { id: 'UPCOMING', label: 'Sắp tới hạn (≤3 ngày)', count: upcomingCount, badgeColor: 'bg-amber-100 text-amber-700' },
            { id: 'OVERDUE', label: 'Quá hạn', count: overdueCount, badgeColor: 'bg-rose-100 text-rose-700 font-bold' },
            { id: 'COMPLETED', label: 'Đã hoàn thành', count: tasks.filter((t) => t.status === 'COMPLETED').length }
          ].map((tab) => {
            const isSelected = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-pastel-500 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-pastel-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/25 text-white' : tab.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Building2 size={13} className="text-pastel-600" />
            <span>Phòng ban:</span>
          </span>
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDept === 'ALL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({tasks.length})
          </button>
          {allDepartments.map((dept) => {
            const count = tasks.filter((t) => {
              const d = t.assigned_user_department || users.find((u) => u.id === t.assigned_to_user_id)?.department;
              return d === dept;
            }).length;
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{dept}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-pastel-200/80">
            <CheckCircle2 size={36} className="mx-auto text-pastel-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700">Không có công việc nào trong danh mục hoặc phòng ban này.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Nhấn "Giao Việc Mới" để thiết lập nhiệm vụ cho nhân sự phòng ban</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const isOverdue = task.urgency === 'OVERDUE' && !isDone;
            const isUpcoming = (task.urgency === 'UPCOMING' || task.urgency === 'TODAY') && !isDone;
            const deptName = task.assigned_user_department || users.find((u) => u.id === task.assigned_to_user_id)?.department;

            return (
              <div
                key={task.id}
                className={`p-5 rounded-3xl bg-white border card-hover flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-300 shadow-xs ring-1 ring-rose-200'
                    : isUpcoming
                    ? 'border-amber-300 shadow-xs ring-1 ring-amber-100'
                    : 'border-pastel-200/90 shadow-soft'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                          isDone
                            ? 'bg-pastel-500 border-pastel-500 text-white'
                            : 'border-slate-300 hover:border-pastel-500 bg-white'
                        }`}
                        title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                      >
                        {isDone && <CheckCircle2 size={14} />}
                      </button>
                      <div>
                        <h4
                          className={`text-sm font-bold text-slate-800 leading-snug ${
                            isDone ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={priorityMap[task.priority]?.variant || 'default'} className="shrink-0">
                      {priorityMap[task.priority]?.label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-pastel-100 text-pastel-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {task.assigned_user_name?.slice(0, 1) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 text-xs truncate max-w-[150px] block leading-tight">
                        {task.assigned_user_name}
                      </span>
                      {deptName && (
                        <span className="text-[10px] text-sky-700 font-medium truncate max-w-[150px] flex items-center gap-1 leading-tight mt-0.5">
                          <Building2 size={10} className="text-sky-500 shrink-0" />
                          <span className="truncate">{deptName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className={`flex items-center gap-1 font-semibold text-[11px] font-mono ${
                        isOverdue
                          ? 'text-rose-600'
                          : isUpcoming
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      <Clock size={13} />
                      <span>{formatDateVN(task.due_date)}</span>
                      {isOverdue && <span className="font-bold font-sans">(Quá hạn)</span>}
                      {isUpcoming && <span className="font-bold font-sans">(Sắp tới)</span>}
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa công việc"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 size={13} className="text-pastel-600" />
                <span>Lọc theo phòng ban</span>
              </label>
              <select
                value={assignDept}
                onChange={(e) => {
                  setAssignDept(e.target.value);
                  setFormData((prev) => ({ ...prev, assigned_to_user_id: '' }));
                }}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="ALL">-- Tất cả phòng ban ({users.length} người) --</option>
                {allDepartments.map((dept) => {
                  const count = users.filter((u) => u.department === dept).length;
                  return (
                    <option key={dept} value={dept}>
                      {dept} ({count} nhân sự)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người thực hiện *</label>
              <select
                required
                value={formData.assigned_to_user_id}
                onChange={(e) => setFormData({ ...formData, assigned_to_user_id: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="">-- Chọn nhân sự phụ trách --</option>
                {assignDept === 'ALL' ? (
                  allDepartments.length > 0 ? (
                    allDepartments.map((dept) => {
                      const deptUsers = users.filter((u) => u.department === dept);
                      if (deptUsers.length === 0) return null;
                      return (
                        <optgroup key={dept} label={`🏢 ${dept}`}>
                          {deptUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} - {u.role}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })
                  ) : (
                    users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department || 'Chưa gán'})
                      </option>
                    ))
                  )
                ) : (
                  users
                    .filter((u) => u.department === assignDept)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.role}
                      </option>
                    ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Quan trọng</option>
                <option value="URGENT">Khẩn cấp (Ưu tiên hàng đầu)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thời hạn hoàn thành (Due date) *</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả chi tiết yêu cầu</label>
            <textarea
              rows={3}
              placeholder="Yêu cầu chi tiết, chỉ tiêu bàn giao hoặc link tài liệu..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pastel-600 hover:bg-pastel-700 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <span>Tạo & Giao Công Việc</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
