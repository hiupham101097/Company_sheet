import React, { useState } from 'react';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Edit2,
  Trash2,
  QrCode,
  Eye,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Clock
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';

export function AssetManager({ assets = [], users = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Máy tính xách tay',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    price: '',
    status: 'AVAILABLE',
    location: 'Kho công ty',
    assigned_to_user_id: '',
    notes: ''
  });

  const formatVND = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const statusMap = {
    IN_USE: { label: 'Đang sử dụng', variant: 'primary', icon: Laptop },
    AVAILABLE: { label: 'Sẵn sàng cấp', variant: 'success', icon: CheckCircle },
    MAINTENANCE: { label: 'Đang bảo trì', variant: 'warning', icon: Wrench },
    BROKEN: { label: 'Bị hỏng', variant: 'danger', icon: AlertTriangle },
    LIQUIDATED: { label: 'Đã thanh lý', variant: 'default', icon: Clock },
  };

  const filteredAssets = assets.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assigned_user_name && item.assigned_user_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportExcel = () => {
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

  const handleSubmitAsset = async (e) => {
    e.preventDefault();
    try {
      await api.createAsset(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: 'Máy tính xách tay',
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Tài Sản & Thiết Bị
          </h2>
          <p className="text-sm text-slate-500">
            Tổng số: <span className="font-semibold text-pastel-600">{assets.length}</span> thiết bị trong hệ thống.
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
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg transition-all"
          >
            <Plus size={16} />
            <span>Thêm Tài Sản Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã tài sản, người giữ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'IN_USE', 'AVAILABLE', 'MAINTENANCE', 'BROKEN'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-pastel-500 text-white font-semibold shadow-xs'
                  : 'bg-pastel-50/60 text-slate-600 hover:bg-pastel-100/60'
              }`}
            >
              {st === 'ALL' ? 'Tất cả' : statusMap[st]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Table Card */}
      <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-pastel-50/60 text-slate-700 font-semibold uppercase text-[11px] tracking-wider border-b border-pastel-100">
              <tr>
                <th className="py-3.5 px-4">Mã Tài Sản</th>
                <th className="py-3.5 px-4">Tên Thiết Bị</th>
                <th className="py-3.5 px-4">Danh Mục</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Giá Trị</th>
                <th className="py-3.5 px-4">Người Nắm Giữ</th>
                <th className="py-3.5 px-4">Vị Trí</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy tài sản nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const st = statusMap[asset.status] || { label: asset.status, variant: 'default' };
                  return (
                    <tr key={asset.id} className="hover:bg-pastel-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-pastel-700">
                        {asset.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {asset.name}
                        {asset.serial_number && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            SN: {asset.serial_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{asset.category}</td>
                      <td className="py-3 px-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {formatVND(asset.price)}
                      </td>
                      <td className="py-3 px-4">
                        {asset.assigned_user_name !== 'Chưa bàn giao' ? (
                          <span className="text-slate-800 font-medium">{asset.assigned_user_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa bàn giao</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{asset.location || 'Kho'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsDetailModalOpen(true);
                            }}
                            title="Xem chi tiết & QR"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-pastel-600 hover:bg-pastel-50 transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id, asset.name)}
                            title="Xóa tài sản"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phân loại danh mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              >
                <option value="Máy tính xách tay">Máy tính xách tay</option>
                <option value="Màn hình hiển thị">Màn hình hiển thị</option>
                <option value="Thiết bị văn phòng">Thiết bị văn phòng</option>
                <option value="Thiết bị mạng">Thiết bị mạng</option>
                <option value="Bàn ghế văn phòng">Bàn ghế văn phòng</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Serial / IMEI</label>
              <input
                type="text"
                placeholder="VD: DLXPS-2024-X"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nguyên giá (VNĐ)</label>
              <input
                type="number"
                placeholder="25000000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày mua</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái ban đầu</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              >
                <option value="">-- Chưa giao ai (Lưu kho) --</option>
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú bổ sung</label>
            <textarea
              rows={2}
              placeholder="Tình trạng ngoại quan, phụ kiện đi kèm..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-pastel-500 hover:bg-pastel-600 text-white font-semibold shadow-soft transition-all"
            >
              Lưu Tài Sản
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xem Chi Tiết & Mã QR Định Danh */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Thẻ Thông Tin & Mã Định Danh Thiết Bị"
      >
        {selectedAsset && (
          <div className="space-y-4 text-xs">
            {/* Asset QR badge */}
            <div className="p-4 bg-pastel-50/60 rounded-2xl border border-pastel-200/80 flex items-center gap-4">
              <div className="w-20 h-20 bg-white p-2 rounded-xl border border-pastel-200 shadow-xs flex items-center justify-center">
                <QrCode size={56} className="text-pastel-700" />
              </div>
              <div>
                <p className="text-[11px] font-mono text-pastel-600 font-bold">{selectedAsset.code}</p>
                <h4 className="text-sm font-bold text-slate-800">{selectedAsset.name}</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">{selectedAsset.category}</p>
                <Badge variant={statusMap[selectedAsset.status]?.variant || 'default'} className="mt-2">
                  {statusMap[selectedAsset.status]?.label || selectedAsset.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Số Serial</span>
                <span className="font-mono font-medium">{selectedAsset.serial_number || 'Chưa cập nhật'}</span>
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
                <span>{selectedAsset.location || 'Kho'}</span>
              </div>
            </div>

            {selectedAsset.notes && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Ghi chú</span>
                <p className="text-slate-600 mt-1">{selectedAsset.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-pastel-500 text-white rounded-xl font-semibold shadow-soft hover:bg-pastel-600 transition-all"
              >
                In Thẻ Thiết Bị
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
