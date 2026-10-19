import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  QrCode,
  Eye,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Clock,
  Printer,
  X
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';
import { formatMoneyVN } from '../../utils/formatters';

export function AssetManager({ 
  assets = [], 
  users = [], 
  onRefresh, 
  userRole = 'ADMIN',
  licenseInfo,
  onOpenUpgrade 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    price: '',
    status: 'AVAILABLE',
    location: 'Kho công ty',
    assigned_to_user_id: '',
    notes: ''
  });

  useEffect(() => {
    api.getCategories('ASSET_CATEGORY')
      .then((res) => {
        const list = res.data || [];
        setCategories(list);
        if (list.length > 0 && !formData.category) {
          setFormData((prev) => ({ ...prev, category: list[0].name }));
        }
      })
      .catch((err) => console.error('Error fetching asset categories:', err));
  }, []);

  const formatVND = (num) => formatMoneyVN(num);

  const statusMap = {
    IN_USE: { label: 'Đang sử dụng', variant: 'primary', icon: Laptop, dotColor: 'bg-pastel-500' },
    AVAILABLE: { label: 'Sẵn sàng cấp', variant: 'success', icon: CheckCircle, dotColor: 'bg-emerald-500' },
    MAINTENANCE: { label: 'Đang bảo trì', variant: 'warning', icon: Wrench, dotColor: 'bg-amber-500' },
    BROKEN: { label: 'Bị hỏng', variant: 'danger', icon: AlertTriangle, dotColor: 'bg-rose-500' },
    LIQUIDATED: { label: 'Đã thanh lý', variant: 'default', icon: Clock, dotColor: 'bg-slate-400' },
  };

  const filteredAssets = assets.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assigned_user_name && item.assigned_user_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (st) => {
    if (st === 'ALL') return assets.length;
    return assets.filter((a) => a.status === st).length;
  };

  const handleExportExcel = () => {
    if (licenseInfo?.isDemo) {
      if (onOpenUpgrade) {
        onOpenUpgrade('Tính năng Xuất Báo Cáo Excel chỉ có trên gói Bản Quyền Enterprise. Quý khách vui lòng kích hoạt bản quyền để xuất báo cáo!');
      }
      return;
    }
    const exportData = filteredAssets.map((a) => ({
      'Mã tài sản': a.code,
      'Tên tài sản / Thiết bị': a.name,
      'Danh mục': a.category,
      'Số Serial': a.serial_number || 'N/A',
      'Ngày mua': a.purchase_date,
      'Giá trị (VNĐ)': a.price,
      'Trạng thái': statusMap[a.status]?.label || a.status,
      'Vị trí': a.location,
      'Người đang giữ': a.assigned_user_name || 'Chưa bàn giao',
      'Ghi chú': a.notes || ''
    }));
    exportToExcel(exportData, 'Danh_Muc_Tai_San_Doanh_Nghiep', 'Tài Sản');
  };

  const handleOpenAddModal = () => {
    if (licenseInfo?.isDemo && assets.length >= 5) {
      if (onOpenUpgrade) {
        onOpenUpgrade('Phiên bản Dùng Thử (Demo) chỉ cho phép quản lý tối đa 5 tài sản. Quý khách vui lòng kích hoạt Bản Quyền Enterprise để quản lý không giới hạn!');
      }
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleSubmitAsset = async (e) => {
    e.preventDefault();
    try {
      await api.createAsset(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: categories[0]?.name || 'Máy tính xách tay',
        serial_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        price: '',
        status: 'AVAILABLE',
        location: 'Kho công ty',
        assigned_to_user_id: '',
        notes: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.code === 'LICENSE_LIMIT_REACHED' && onOpenUpgrade) {
        onOpenUpgrade(err.message);
        return;
      }
      alert(err.message || 'Lỗi thêm tài sản');
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài sản: ${name}?`)) {
      try {
        await api.deleteAsset(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(err.message || 'Lỗi xóa tài sản');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Tài Sản & Thiết Bị
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs sm:text-sm text-slate-500">
              Tổng số: <span className="font-bold text-pastel-700">{assets.length}</span> thiết bị trong hệ thống cơ sở vật chất.
            </p>
            {licenseInfo?.isDemo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                Demo: {assets.length}/5 tài sản
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all w-full sm:w-auto"
          >
            <FileSpreadsheet size={16} className="text-pastel-600 shrink-0" />
            <span>Xuất Excel</span>
            {licenseInfo?.isDemo && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold">Khóa</span>
            )}
          </button>
          {userRole !== 'STAFF' && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all w-full sm:w-auto"
            >
              <Plus size={16} className="shrink-0" />
              <span>Thêm Tài Sản</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white p-4 rounded-3xl border border-pastel-200/90 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã tài sản, người giữ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all font-medium text-slate-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'IN_USE', 'AVAILABLE', 'MAINTENANCE', 'BROKEN'].map((st) => {
            const isSelected = statusFilter === st;
            const count = getStatusCount(st);
            const label = st === 'ALL' ? 'Tất cả' : statusMap[st]?.label;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-pastel-500 text-white shadow-soft'
                    : 'bg-pastel-50/60 text-slate-600 hover:bg-pastel-100/60'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assets List: Mobile Cards + Desktop Table */}
      <div className="space-y-3">
        {/* Mobile View: Clean Responsive Cards (No Squishing!) */}
        <div className="block md:hidden space-y-3">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-pastel-200/80 shadow-xs">
              <Laptop size={32} className="mx-auto text-slate-300 mb-2" />
              Không tìm thấy tài sản nào phù hợp.
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const st = statusMap[asset.status] || { label: asset.status, variant: 'default' };
              return (
                <div key={asset.id} className="bg-white p-4 rounded-2xl border border-pastel-200/90 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono font-bold text-pastel-700 bg-pastel-50 px-2 py-0.5 rounded-md border border-pastel-200/60 inline-block mb-1">
                        {asset.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">
                        {asset.name}
                      </h4>
                      {asset.serial_number && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">SN: {asset.serial_number}</p>
                      )}
                    </div>
                    <Badge variant={st.variant} className="gap-1.5 shrink-0 text-[11px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor || 'bg-slate-400'}`} />
                      <span>{st.label}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Danh mục:</span>
                      <span className="font-semibold text-slate-700 truncate block">{asset.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Giá trị:</span>
                      <span className="font-bold text-slate-800 block">{formatVND(asset.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Người nắm giữ:</span>
                      <span className="font-medium text-slate-700 truncate block">
                        {asset.assigned_user_name || 'Chưa bàn giao'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Vị trí:</span>
                      <span className="text-slate-600 truncate block">{asset.location || 'Kho'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setIsDetailModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 text-xs font-semibold flex items-center gap-1.5 border border-pastel-200/60"
                    >
                      <Eye size={14} />
                      <span>Xem Thẻ & QR</span>
                    </button>
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(asset.id, asset.name)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 border border-rose-100 transition-colors"
                        title="Xóa tài sản"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table with forced horizontal scroll */}
        <div className="hidden md:block bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: '880px' }}>
              <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Mã Tài Sản</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap" style={{ minWidth: '220px' }}>Tên Thiết Bị</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Danh Mục</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Giá Trị</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Người Nắm Giữ</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Vị Trí</th>
                  <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <Laptop size={32} className="mx-auto text-slate-300 mb-2" />
                      Không tìm thấy tài sản nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const st = statusMap[asset.status] || { label: asset.status, variant: 'default' };
                    return (
                      <tr key={asset.id} className="hover:bg-pastel-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-pastel-700 whitespace-nowrap">
                          {asset.code}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800" style={{ minWidth: '220px' }}>
                          {asset.name}
                          {asset.serial_number && (
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">
                              SN: {asset.serial_number}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{asset.category}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={st.variant} className="gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor || 'bg-slate-400'}`} />
                            <span>{st.label}</span>
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                          {formatVND(asset.price)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {asset.assigned_user_name !== 'Chưa bàn giao' ? (
                            <span className="text-slate-800 font-medium">{asset.assigned_user_name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa bàn giao</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{asset.location || 'Kho'}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsDetailModalOpen(true);
                              }}
                              title="Xem chi tiết & Thẻ QR"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-pastel-700 hover:bg-pastel-50 transition-colors"
                            >
                              <Eye size={15} />
                            </button>
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={() => handleDelete(asset.id, asset.name)}
                                title="Xóa tài sản"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Thêm Tài Sản Mới */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Mới Tài Sản / Thiết Bị"
      >
        <form onSubmit={handleSubmitAsset} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên thiết bị *</label>
            <input
              type="text"
              required
              placeholder="VD: Laptop Dell XPS 15 9530"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 focus:border-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phân loại danh mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                {categories.length === 0 ? (
                  <option value="">Đang tải danh mục...</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Serial / IMEI</label>
              <input
                type="text"
                placeholder="VD: DLXPS-2024-X"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nguyên giá (VNĐ)</label>
              <input
                type="number"
                placeholder="25000000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày mua</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái ban đầu</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="AVAILABLE">Sẵn sàng cấp phát</option>
                <option value="IN_USE">Đang sử dụng</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giao cho nhân viên</label>
              <select
                value={formData.assigned_to_user_id}
                onChange={(e) => setFormData({ ...formData, assigned_to_user_id: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="">-- Lưu kho (Chưa giao ai) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vị trí đặt thiết bị</label>
            <input
              type="text"
              placeholder="VD: Phòng Kỹ thuật - Bàn số 5"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú bổ sung</label>
            <textarea
              rows={2}
              placeholder="Tình trạng ngoại quan, phụ kiện đi kèm..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pastel-600 hover:bg-pastel-700 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <span>Lưu Tài Sản</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xem Chi Tiết & Thẻ QR Định Danh */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Thẻ Thông Tin & Mã Định Danh Thiết Bị"
      >
        {selectedAsset && (
          <div className="space-y-4 text-xs">
            {/* Asset Identity Card */}
            <div className="p-5 bg-gradient-to-r from-pastel-50/80 via-white to-pastel-50/40 rounded-2xl border border-pastel-200 shadow-soft flex items-center gap-4">
              <div className="w-20 h-20 bg-white p-2.5 rounded-2xl border border-pastel-200 shadow-xs flex items-center justify-center shrink-0">
                <QrCode size={52} className="text-pastel-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-pastel-700 font-bold">{selectedAsset.code}</p>
                <h4 className="text-base font-bold text-slate-800 truncate">{selectedAsset.name}</h4>
                <p className="text-slate-500 text-xs mt-0.5">{selectedAsset.category}</p>
                <Badge variant={statusMap[selectedAsset.status]?.variant || 'default'} className="mt-2">
                  {statusMap[selectedAsset.status]?.label || selectedAsset.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Số Serial</span>
                <span className="font-mono font-semibold text-slate-800">{selectedAsset.serial_number || 'Chưa cập nhật'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Nguyên giá</span>
                <span className="font-bold text-slate-800">{formatVND(selectedAsset.price)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Người sử dụng</span>
                <span className="font-semibold text-pastel-700">{selectedAsset.assigned_user_name || 'Lưu kho'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Vị trí hiện tại</span>
                <span className="font-medium text-slate-700">{selectedAsset.location || 'Kho'}</span>
              </div>
            </div>

            {selectedAsset.notes && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Ghi chú</span>
                <p className="text-slate-600 mt-1 leading-relaxed">{selectedAsset.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-pastel-500 text-white rounded-xl font-bold shadow-soft hover:bg-pastel-600 transition-all inline-flex items-center gap-2"
              >
                <Printer size={15} />
                <span>In Thẻ Thiết Bị</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
