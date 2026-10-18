export const initialUsers = [
  {
    id: "usr_1",
    name: "Nguyễn Văn An",
    email: "an.nguyen@enterprise.vn",
    role: "ADMIN",
    department: "Ban Giám Đốc",
    phone: "0912345678",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "ACTIVE"
  },
  {
    id: "usr_2",
    name: "Trần Thị Mai",
    email: "mai.tran@enterprise.vn",
    role: "MANAGER",
    department: "Phòng Kế Toán & Tài Chính",
    phone: "0987654321",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    status: "ACTIVE"
  },
  {
    id: "usr_3",
    name: "Lê Hoàng Nam",
    email: "nam.le@enterprise.vn",
    role: "STAFF",
    department: "Phòng Kỹ Thuật & IT",
    phone: "0901122334",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "ACTIVE"
  },
  {
    id: "usr_4",
    name: "Phạm Thùy Linh",
    email: "linh.pham@enterprise.vn",
    role: "STAFF",
    department: "Phòng Hành Chính Nhân Sự",
    phone: "0933445566",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    status: "ACTIVE"
  }
];

export const initialAssets = [
  {
    id: "ast_1",
    code: "TS-2024-001",
    name: "MacBook Pro 16 M3 Pro (36GB/512GB)",
    category: "Máy tính xách tay",
    serial_number: "C02G90XXMD6M",
    purchase_date: "2024-01-15",
    price: 65900000,
    status: "IN_USE", // IN_USE, AVAILABLE, MAINTENANCE, BROKEN, LIQUIDATED
    location: "Phòng Kỹ Thuật - Bàn T01",
    assigned_to_user_id: "usr_3",
    notes: "Đã dán tem kiểm định Q1/2024, tình trạng mới 99%"
  },
  {
    id: "ast_2",
    code: "TS-2024-002",
    name: "Màn hình Dell UltraSharp U2723QE 4K",
    category: "Màn hình hiển thị",
    serial_number: "CN-098877-DL",
    purchase_date: "2024-02-10",
    price: 14500000,
    status: "IN_USE",
    location: "Phòng Giám Đốc",
    assigned_to_user_id: "usr_1",
    notes: "Kèm đế xoay và cáp Type-C zin"
  },
  {
    id: "ast_3",
    code: "TS-2024-003",
    name: "Máy in Laser đa năng HP LaserJet Pro M428fdw",
    category: "Thiết bị văn phòng",
    serial_number: "VNC8K19022",
    purchase_date: "2023-11-20",
    price: 11200000,
    status: "AVAILABLE",
    location: "Khu vực sảnh chung - Tầng 2",
    assigned_to_user_id: null,
    notes: "Dùng chung cho cả văn phòng, vừa thay hộp mực tháng trước"
  },
  {
    id: "ast_4",
    code: "TS-2024-004",
    name: "Router Doanh Nghiệp Cisco Catalyst 1000",
    category: "Thiết bị mạng",
    serial_number: "FOC2219S0A1",
    purchase_date: "2023-08-05",
    price: 18900000,
    status: "MAINTENANCE",
    location: "Phòng Server Tủ Rack A1",
    assigned_to_user_id: "usr_3",
    notes: "Đang bảo dưỡng định kỳ & nâng cấp firmware"
  },
  {
    id: "ast_5",
    code: "TS-2024-005",
    name: "Ghế công thái học Ergonomic Sihoo Doro S300",
    category: "Bàn ghế văn phòng",
    serial_number: "SH-S300-GR",
    purchase_date: "2024-03-01",
    price: 8500000,
    status: "IN_USE",
    location: "Phòng Kế Toán",
    assigned_to_user_id: "usr_2",
    notes: "Lưới xám, khung nhôm nguyên khối"
  }
];

export const initialFinance = [
  {
    id: "fin_1",
    type: "REVENUE",
    category: "Hợp đồng dịch vụ phần mềm",
    amount: 125000000,
    date: "2024-06-05",
    description: "Thanh toán đợt 1 dự án Chuyển đổi số khối tài chính cho Cty Alpha",
    invoice_number: "HD-2024-089"
  },
  {
    id: "fin_2",
    type: "REVENUE",
    category: "Bảo trì & Vận hành hệ thống",
    amount: 45000000,
    date: "2024-06-12",
    description: "Phí dịch vụ bảo trì định kỳ quý 2 khách hàng Beta Corp",
    invoice_number: "HD-2024-092"
  },
  {
    id: "fin_3",
    type: "EXPENSE",
    category: "Mua sắm thiết bị & Tài sản",
    amount: 32000000,
    date: "2024-06-15",
    description: "Mua bổ sung 02 laptop Lenovo ThinkPad cho nhân sự mới",
    invoice_number: "PC-2024-110"
  },
  {
    id: "fin_4",
    type: "EXPENSE",
    category: "Chi phí điện nước & Văn phòng phẩm",
    amount: 14500000,
    date: "2024-06-20",
    description: "Tiền thuê sảnh & điện nước văn phòng tháng 6",
    invoice_number: "PC-2024-118"
  },
  {
    id: "fin_5",
    type: "REVENUE",
    category: "Tư vấn kiến trúc Cloud",
    amount: 80000000,
    date: "2024-05-18",
    description: "Gói tư vấn tối ưu chi phí hạ tầng Cloudflare & AWS",
    invoice_number: "HD-2024-075"
  },
  {
    id: "fin_6",
    type: "REVENUE",
    category: "Hợp đồng dịch vụ phần mềm",
    amount: 160000000,
    date: "2024-04-22",
    description: "Nghiệm thu giai đoạn 2 giải pháp quản lý chuỗi cung ứng",
    invoice_number: "HD-2024-062"
  }
];

export const initialTasks = [
  {
    id: "tsk_1",
    title: "Kiểm kê toàn bộ thiết bị IT phòng Kỹ thuật",
    description: "Đối soát mã QR, dán lại tem bảo hành và ghi nhận hiện trạng thiết bị định kỳ quý 2.",
    assigned_to_user_id: "usr_3",
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Ngày mai (Sắp tới)
    priority: "HIGH",
    status: "IN_PROGRESS"
  },
  {
    id: "tsk_2",
    title: "Nộp báo cáo thuế & chốt sổ doanh thu tháng",
    description: "Hoàn tất đối soát hóa đơn VAT đầu vào - đầu ra và gửi báo cáo cho Giám Đốc ký.",
    assigned_to_user_id: "usr_2",
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 ngày trước (Quá hạn)
    priority: "URGENT",
    status: "OVERDUE"
  },
  {
    id: "tsk_3",
    title: "Ký biên bản bàn giao màn hình Dell cho Giám đốc",
    description: "Soạn thảo và in biên bản bàn giao mã BB-2024-002 gửi anh An ký xác nhận.",
    assigned_to_user_id: "usr_4",
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 ngày nữa
    priority: "MEDIUM",
    status: "PENDING"
  },
  {
    id: "tsk_4",
    title: "Gia hạn hợp đồng thuê đường truyền mạng Leased Line",
    description: "Liên hệ VNPT hoàn tất thủ tục gia hạn hợp đồng mạng băng thông rộng trước 30/06.",
    assigned_to_user_id: "usr_3",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: "MEDIUM",
    status: "PENDING"
  }
];

export const initialContracts = [
  {
    id: "ctr_1",
    code: "HĐ-2024/01-SME",
    title: "Hợp đồng Cung cấp Giải pháp Quản trị Tài sản Doanh nghiệp",
    type: "PARTNER",
    partner_name: "Công ty Cổ phần Công nghệ Alpha Việt Nam",
    value: 250000000,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    status: "ACTIVE",
    notes: "Thanh toán theo 3 đợt: 50% - 30% - 20%"
  },
  {
    id: "ctr_2",
    code: "HĐ-2023/11-NET",
    title: "Hợp đồng Thuê hạ tầng mạng & Server chuyên dụng",
    type: "SERVICE",
    partner_name: "Tập đoàn Viễn thông VNPT",
    value: 36000000,
    start_date: "2023-11-01",
    end_date: "2024-11-01",
    status: "ACTIVE",
    notes: "Cam kết uptime 99.99%, hỗ trợ kỹ thuật 24/7"
  },
  {
    id: "ctr_3",
    code: "HĐ-2024/03-DEV",
    title: "Hợp đồng Phát triển Module Phân tích Tài chính Tự động",
    type: "PARTNER",
    partner_name: "Tập đoàn Đầu tư Beta Holdings",
    value: 180000000,
    start_date: "2024-03-15",
    end_date: "2024-09-15",
    status: "ACTIVE",
    notes: "Đang hoàn thiện nghiệm thu Giai đoạn 1"
  }
];

export const initialHandover = [
  {
    id: "bb_1",
    code: "BBBG-2024-001",
    asset_id: "ast_1",
    user_id: "usr_3",
    type: "HANDOVER",
    handover_date: "2024-01-16",
    condition: "Máy mới 100%, đầy đủ củ sạc 140W và cáp MagSafe",
    status: "COMPLETED",
    notes: "Bàn giao phục vụ công việc lập trình và kiến trúc hệ thống"
  },
  {
    id: "bb_2",
    code: "BBBG-2024-002",
    asset_id: "ast_2",
    user_id: "usr_1",
    type: "HANDOVER",
    handover_date: "2024-02-12",
    condition: "Màn hình sắc nét, không điểm chết, đủ phụ kiện",
    status: "COMPLETED",
    notes: "Lắp đặt tại bàn làm việc Giám Đốc"
  }
];

export const initialAttendance = [
  {
    id: "att_1",
    user_id: "usr_1",
    date: new Date().toISOString().split('T')[0],
    check_in: "08:15",
    check_out: "17:45",
    total_hours: 8.5,
    status: "ON_TIME",
    notes: "Đi làm đúng giờ"
  },
  {
    id: "att_2",
    user_id: "usr_2",
    date: new Date().toISOString().split('T')[0],
    check_in: "08:28",
    check_out: "17:35",
    total_hours: 8.0,
    status: "ON_TIME",
    notes: ""
  },
  {
    id: "att_3",
    user_id: "usr_3",
    date: new Date().toISOString().split('T')[0],
    check_in: "08:52",
    check_out: "18:10",
    total_hours: 8.2,
    status: "LATE",
    notes: "Tắc đường cầu vượt"
  },
  {
    id: "att_4",
    user_id: "usr_4",
    date: new Date().toISOString().split('T')[0],
    check_in: "08:20",
    check_out: "17:30",
    total_hours: 8.0,
    status: "ON_TIME",
    notes: ""
  }
];
