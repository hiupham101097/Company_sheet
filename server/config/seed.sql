-- SEED DATA FOR COMPANY ASSETS & ENTERPRISE MANAGEMENT

INSERT OR REPLACE INTO users (id, name, email, password, role, department, phone, avatar, status) VALUES
('usr_1', 'Nguyễn Văn An', 'an.nguyen@enterprise.vn', '123456', 'ADMIN', 'Ban Giám Đốc', '0912345678', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'ACTIVE'),
('usr_2', 'Trần Thị Mai', 'mai.tran@enterprise.vn', '123456', 'MANAGER', 'Phòng Kế Toán & Tài Chính', '0987654321', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 'ACTIVE'),
('usr_3', 'Lê Hoàng Nam', 'nam.le@enterprise.vn', '123456', 'STAFF', 'Phòng Kỹ Thuật & IT', '0901122334', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'ACTIVE'),
('usr_4', 'Phạm Thùy Linh', 'linh.pham@enterprise.vn', '123456', 'STAFF', 'Phòng Hành Chính Nhân Sự', '0933445566', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'ACTIVE');

INSERT OR REPLACE INTO assets (id, code, name, category, serial_number, purchase_date, price, status, location, assigned_to_user_id, notes) VALUES
('ast_1', 'TS-2024-001', 'MacBook Pro 16 M3 Pro (36GB/512GB)', 'Máy tính xách tay', 'C02G90XXMD6M', '2024-01-15', 65900000, 'IN_USE', 'Phòng Kỹ Thuật - Bàn T01', 'usr_3', 'Đã dán tem kiểm định Q1/2024, tình trạng mới 99%'),
('ast_2', 'TS-2024-002', 'Màn hình Dell UltraSharp U2723QE 4K', 'Màn hình hiển thị', 'CN-098877-DL', '2024-02-10', 14500000, 'IN_USE', 'Phòng Giám Đốc', 'usr_1', 'Kèm đế xoay và cáp Type-C zin'),
('ast_3', 'TS-2024-003', 'Máy in Laser đa năng HP LaserJet Pro M428fdw', 'Thiết bị văn phòng', 'VNC8K19022', '2023-11-20', 11200000, 'AVAILABLE', 'Khu vực sảnh chung - Tầng 2', NULL, 'Dùng chung cho cả văn phòng, vừa thay hộp mực tháng trước'),
('ast_4', 'TS-2024-004', 'Router Doanh Nghiệp Cisco Catalyst 1000', 'Thiết bị mạng', 'FOC2219S0A1', '2023-08-05', 18900000, 'MAINTENANCE', 'Phòng Server Tủ Rack A1', 'usr_3', 'Đang bảo dưỡng định kỳ & nâng cấp firmware'),
('ast_5', 'TS-2024-005', 'Ghế công thái học Ergonomic Sihoo Doro S300', 'Bàn ghế văn phòng', 'SH-S300-GR', '2024-03-01', 8500000, 'IN_USE', 'Phòng Kế Toán', 'usr_2', 'Lưới xám, khung nhôm nguyên khối');

INSERT OR REPLACE INTO finance (id, type, category, amount, date, description, invoice_number) VALUES
('fin_1', 'REVENUE', 'Hợp đồng dịch vụ phần mềm', 125000000, '2024-06-05', 'Thanh toán đợt 1 dự án Chuyển đổi số khối tài chính cho Cty Alpha', 'HD-2024-089'),
('fin_2', 'REVENUE', 'Bảo trì & Vận hành hệ thống', 45000000, '2024-06-12', 'Phí dịch vụ bảo trì định kỳ quý 2 khách hàng Beta Corp', 'HD-2024-092'),
('fin_3', 'EXPENSE', 'Mua sắm thiết bị & Tài sản', 32000000, '2024-06-15', 'Mua bổ sung 02 laptop Lenovo ThinkPad cho nhân sự mới', 'PC-2024-110'),
('fin_4', 'EXPENSE', 'Chi phí điện nước & Văn phòng phẩm', 14500000, '2024-06-20', 'Tiền thuê sảnh & điện nước văn phòng tháng 6', 'PC-2024-118'),
('fin_5', 'REVENUE', 'Tư vấn kiến trúc Cloud', 80000000, '2024-05-18', 'Gói tư vấn tối ưu chi phí hạ tầng Cloudflare & AWS', 'HD-2024-075'),
('fin_6', 'REVENUE', 'Hợp đồng dịch vụ phần mềm', 160000000, '2024-04-22', 'Nghiệm thu giai đoạn 2 giải pháp quản lý chuỗi cung ứng', 'HD-2024-062');

INSERT OR REPLACE INTO tasks (id, title, description, assigned_to_user_id, due_date, priority, status) VALUES
('tsk_1', 'Kiểm kê toàn bộ thiết bị IT phòng Kỹ thuật', 'Đối soát mã QR, dán lại tem bảo hành và ghi nhận hiện trạng thiết bị định kỳ quý 2.', 'usr_3', '2026-10-25', 'HIGH', 'IN_PROGRESS'),
('tsk_2', 'Nộp báo cáo thuế & chốt sổ doanh thu tháng', 'Hoàn tất đối soát hóa đơn VAT đầu vào - đầu ra và gửi báo cáo cho Giám Đốc ký.', 'usr_2', '2026-10-15', 'URGENT', 'OVERDUE'),
('tsk_3', 'Ký biên bản bàn giao màn hình Dell cho Giám đốc', 'Soạn thảo và in biên bản bàn giao mã BBBG-2024-002 gửi anh An ký xác nhận.', 'usr_4', '2026-10-22', 'MEDIUM', 'PENDING'),
('tsk_4', 'Gia hạn hợp đồng thuê đường truyền mạng Leased Line', 'Liên hệ VNPT hoàn tất thủ tục gia hạn hợp đồng mạng băng thông rộng trước 30/10.', 'usr_3', '2026-10-30', 'MEDIUM', 'PENDING');

INSERT OR REPLACE INTO contracts (id, code, title, type, partner_name, value, start_date, end_date, status, notes) VALUES
('ctr_1', 'HĐ-2024/01-SME', 'Hợp đồng Cung cấp Giải pháp Quản trị Tài sản Doanh nghiệp', 'PARTNER', 'Công ty Cổ phần Công nghệ Alpha Việt Nam', 250000000, '2024-01-01', '2026-12-31', 'ACTIVE', 'Thanh toán theo 3 đợt: 50% - 30% - 20%'),
('ctr_2', 'HĐ-2023/11-NET', 'Hợp đồng Thuê hạ tầng mạng & Server chuyên dụng', 'SERVICE', 'Tập đoàn Viễn thông VNPT', 36000000, '2023-11-01', '2026-11-01', 'ACTIVE', 'Cam kết uptime 99.99%, hỗ trợ kỹ thuật 24/7'),
('ctr_3', 'HĐ-2024/03-DEV', 'Hợp đồng Phát triển Module Phân tích Tài chính Tự động', 'PARTNER', 'Tập đoàn Đầu tư Beta Holdings', 180000000, '2024-03-15', '2026-12-15', 'ACTIVE', 'Đang hoàn thiện nghiệm thu Giai đoạn 1');

INSERT OR REPLACE INTO handover_protocols (id, code, asset_id, user_id, type, handover_date, condition, status, notes) VALUES
('bb_1', 'BBBG-2024-001', 'ast_1', 'usr_3', 'HANDOVER', '2024-01-16', 'Máy mới 100%, đầy đủ củ sạc 140W và cáp MagSafe', 'COMPLETED', 'Bàn giao phục vụ công việc lập trình và kiến trúc hệ thống'),
('bb_2', 'BBBG-2024-002', 'ast_2', 'usr_1', 'HANDOVER', '2024-02-12', 'Màn hình sắc nét, không điểm chết, đủ phụ kiện', 'COMPLETED', 'Lắp đặt tại bàn làm việc Giám Đốc');

INSERT OR REPLACE INTO attendance (id, user_id, date, check_in, check_out, total_hours, status, notes) VALUES
('att_1', 'usr_1', '2026-10-18', '08:15', '17:45', 8.5, 'ON_TIME', 'Đi làm đúng giờ'),
('att_2', 'usr_2', '2026-10-18', '08:28', '17:35', 8.0, 'ON_TIME', ''),
('att_3', 'usr_3', '2026-10-18', '08:52', '18:10', 8.2, 'LATE', 'Tắc đường cầu vượt'),
('att_4', 'usr_4', '2026-10-18', '08:20', '17:30', 8.0, 'ON_TIME', '');
