import { TaskItem, CategoryInfo, Project, ManagedDocument, ManagedDocTypeInfo, ManagedDepartmentInfo, DocumentAttachment } from '../types';

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cat-1',
    code: 'WBS-1.0',
    name: 'Khảo sát & Lập kế hoạch',
    color: 'emerald',
    description: 'Khảo sát hiện trường, phê duyệt dự án, kế hoạch tổng thể & pháp lý.',
  },
  {
    id: 'cat-2',
    code: 'WBS-2.0',
    name: 'Thiết kế & Giải pháp kỹ thuật',
    color: 'blue',
    description: 'Hồ sơ thiết kế chi tiết, kiến trúc, kết cấu và đánh giá giải pháp.',
  },
  {
    id: 'cat-3',
    code: 'WBS-3.0',
    name: 'Triển khai & Thi công',
    color: 'indigo',
    description: 'Thi công xây lắp, lập trình module, tích hợp hạ tầng hệ thống.',
  },
  {
    id: 'cat-4',
    code: 'WBS-4.0',
    name: 'Kiểm thử & Nghiệm thu (UAT)',
    color: 'amber',
    description: 'Kiểm thử chức năng, lập biên bản nghiệm thu kỹ thuật và vận hành thử.',
  },
  {
    id: 'cat-5',
    code: 'WBS-5.0',
    name: 'Bàn giao & Hoàn công',
    color: 'rose',
    description: 'Ký biên bản bàn giao, thanh quyết toán, hướng dẫn đưa vào sử dụng.',
  },
];

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-01',
    code: 'DA-01',
    name: 'Tòa nhà Phức hợp Sunrise Riverside',
    itemType: 'project',
    itemTypes: ['project'],
    projectKind: 'main',
    description: 'Dự án thi công khối tháp thương mại cao cấp 25 tầng.',
    manager: 'Nguyễn Minh (GĐ DA)',
    startMonth: '06',
    startYear: '2026',
    parentProject: 'Khu đô thị Nam Sài Gòn Riverside',
    relatedPackages: [
      { id: 'pkg-1', name: 'gói thầu : 1 Cung cấp & Lắp đặt Cơ điện MEP', link: 'https://drive.google.com' },
      { id: 'pkg-2', name: 'gói thầu 2 : Tư vấn Thẩm tra Thiết kế Kỹ thuật & PCCC', link: 'https://drive.google.com' }
    ],
    objectives: 'Hoàn thành bàn giao khối tháp 25 tầng đạt tiêu chuẩn nghiệm thu công trình cấp 1 và chứng nhận công trình xanh.',
    notes: 'Ưu tiên nghiệm thu ván khuôn và cốt thép trước mùa mưa. Hồ sơ lưu trữ đồng bộ Google Drive.',
    detailItems: [
      {
        id: 'det-1',
        stt: 1,
        content: 'Phê duyệt Kế hoạch Tổng tiến độ thi công',
        day: '05',
        month: '06',
        year: '2026',
        docNumber: '128',
        docText: '/QĐ-BQLDA',
        driveFileName: 'Quyet_dinh_128_Phe_duyet_Ke_hoach.pdf',
        driveFileLink: 'https://drive.google.com',
        isStartDateSelected: true
      },
      {
        id: 'det-2',
        stt: 2,
        content: 'Khởi công khoan cọc nhồi D1200 và tường vây',
        day: '15',
        month: '06',
        year: '2026',
        docNumber: '45',
        docText: '/TB-KC',
        driveFileName: 'Thong_bao_khoi_cong_mong_coc.pdf',
        driveFileLink: 'https://drive.google.com',
        isStartDateSelected: false
      },
      {
        id: 'det-3',
        stt: 3,
        content: 'Nghiệm thu phần ngầm giai đoạn 1 và hầm B1-B2',
        day: '20',
        month: '08',
        year: '2026',
        docNumber: '89',
        docText: '/BB-NT',
        isStartDateSelected: false
      }
    ],
    attachedDocuments: [
      {
        id: 'att-1',
        stt: 1,
        content: 'Hợp đồng Tổng thầu EPC thi công xây dựng số 12/2026/HĐ-XD',
        day: '01',
        month: '06',
        year: '2026',
        docNumber: '12',
        docText: '/2026/HĐ-XD',
        driveFileName: 'Hop_dong_Tong_thau_EPC_12_2026.pdf',
        driveFileLink: 'https://drive.google.com'
      },
      {
        id: 'att-2',
        stt: 2,
        content: 'Giấy phép xây dựng số 34/GPXD Sở Xây dựng cấp',
        day: '28',
        month: '05',
        year: '2026',
        docNumber: '34',
        docText: '/GPXD-SXD',
        driveFileName: 'Giay_phep_xay_dung_34_GPXD.pdf',
        driveFileLink: 'https://drive.google.com'
      }
    ],
    status: 'in_progress',
    startDate: '2026-06-01',
    targetDate: '2026-12-30',
    color: 'emerald',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'proj-02',
    code: 'DA-02',
    name: 'Triển khai Hệ thống ERP Doanh nghiệp',
    itemType: 'package',
    itemTypes: ['package'],
    projectKind: 'sub',
    parentProjectId: 'proj-01',
    description: 'Số hóa toàn diện quy trình cung ứng, kế toán và quản lý nhân sự.',
    manager: 'Trần Thị Thu Trang (PM)',
    startMonth: '07',
    startYear: '2026',
    parentProject: 'Chương trình Chuyển đổi số Doanh nghiệp 2026-2030',
    relatedPackages: [
      { id: 'pkg-21', name: 'gói thầu : 1 Cung cấp Bản quyền License Phần mềm ERP', link: 'https://drive.google.com' },
      { id: 'pkg-22', name: 'gói thầu 2 : Hạ tầng Máy chủ Cloud & Bảo mật', link: 'https://drive.google.com' }
    ],
    objectives: 'Go-live toàn bộ phân hệ Tài chính Kế toán & Mua sắm trước Q4/2026.',
    notes: 'Tuân thủ quy trình bảo mật dữ liệu khách hàng và đồng bộ sao lưu hàng tuần.',
    detailItems: [
      {
        id: 'det-21',
        stt: 1,
        content: 'Khảo sát Blueprint quy trình nghiệp vụ các phòng ban',
        day: '15',
        month: '07',
        year: '2026',
        docNumber: '08',
        docText: '/BB-KS',
        isStartDateSelected: true
      },
      {
        id: 'det-22',
        stt: 2,
        content: 'Kiểm thử chấp nhận người dùng đợt 1 (UAT 1)',
        day: '30',
        month: '09',
        year: '2026',
        docNumber: '19',
        docText: '/BB-UAT',
        isStartDateSelected: false
      }
    ],
    attachedDocuments: [
      {
        id: 'att-21',
        stt: 1,
        content: 'Tài liệu Kiến trúc Giải pháp Hệ thống (Solution Architecture Document)',
        day: '10',
        month: '07',
        year: '2026',
        docNumber: '02',
        docText: '/SAD-ERP',
        driveFileName: 'Kien_truc_giai_phap_ERP_v1.pdf',
        driveFileLink: 'https://drive.google.com'
      }
    ],
    status: 'in_progress',
    startDate: '2026-07-15',
    targetDate: '2026-11-20',
    color: 'blue',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 'proj-03',
    code: 'DA-03',
    name: 'Cải tạo & Nâng cấp Nhà máy Long Thành',
    itemType: 'item',
    itemTypes: ['item'],
    description: 'Mở rộng dây chuyền xưởng hóa chất đạt chuẩn ISO 14001.',
    manager: 'Lê Hoàng Hải (PM Kỹ thuật)',
    startMonth: '09',
    startYear: '2026',
    parentProject: 'Kế hoạch Mở rộng Công suất Công nghiệp Miền Nam',
    relatedPackages: [
      { id: 'pkg-31', name: 'gói thầu : 1 Dây chuyền robot đóng gói tự động', link: 'https://drive.google.com' }
    ],
    objectives: 'Nâng công suất dây chuyền thêm 45% và giảm tiêu hao năng lượng.',
    notes: 'Đảm bảo an toàn lao động trong suốt quá trình vừa thi công vừa duy trì sản xuất.',
    detailItems: [
      {
        id: 'det-31',
        stt: 1,
        content: 'Thẩm duyệt hiện trường và Giấy phép PCCC mở rộng',
        day: '01',
        month: '09',
        year: '2026',
        docNumber: '56',
        docText: '/TĐ-PCCC',
        isStartDateSelected: true
      }
    ],
    attachedDocuments: [],
    status: 'planning',
    startDate: '2026-09-01',
    targetDate: '2027-02-28',
    color: 'amber',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'proj-04',
    code: 'DA-04',
    name: 'Xây dựng Trung tâm Dữ liệu Data Center DC-02',
    itemType: 'project',
    itemTypes: ['project', 'package'],
    description: 'Hạ tầng phòng máy chủ Tier III vận hành N+1.',
    manager: 'Vũ Đức Toàn (Lead Architect)',
    startMonth: '05',
    startYear: '2026',
    parentProject: 'Hạ tầng Điện toán Đám mây Quốc gia',
    relatedPackages: [
      { id: 'pkg-41', name: 'gói thầu : 1 Máy phát điện Cummins & UPS công nghiệp', link: 'https://drive.google.com' },
      { id: 'pkg-42', name: 'gói thầu 2 : Hệ thống làm mát chính xác InRow Chiller', link: 'https://drive.google.com' }
    ],
    objectives: 'Đạt chứng nhận Tier III Uptime Institute.',
    notes: 'Kiểm tra tải giả 72 giờ trước khi lắp ráp thiết bị máy chủ chính thức.',
    detailItems: [
      {
        id: 'det-41',
        stt: 1,
        content: 'Thi công sàn nâng và hệ thống tiếp địa chống sét',
        day: '10',
        month: '05',
        year: '2026',
        docNumber: '77',
        docText: '/BB-SN',
        isStartDateSelected: true
      }
    ],
    attachedDocuments: [],
    status: 'review',
    startDate: '2026-05-10',
    targetDate: '2026-10-15',
    color: 'purple',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
  }
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-101',
    projectId: 'proj-01',
    code: 'PM-01',
    title: 'Phê duyệt Dự án & Hợp đồng Nguyên tắc',
    description: 'Hoàn thiện hợp đồng tổng thầu, phê duyệt Charter dự án và danh mục các bên liên quan.',
    category: 'Khảo sát & Lập kế hoạch',
    status: 'completed',
    priority: 'high',
    progress: 100,
    assignee: 'Nguyễn Minh (PM Trưởng)',
    startDate: '2026-08-01',
    dueDate: '2026-08-15',
    budget: '450.000.000 VNĐ',
    notes: 'Đã thông qua Chủ tịch Hội đồng Quản trị.',
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    documents: [
      {
        id: 'doc-01',
        name: 'Hop_Dong_Nguyen_Tac_Sunrise.pdf',
        type: 'contract',
        projectId: 'proj-01',
        category: 'Khảo sát & Lập kế hoạch',
        driveFileId: 'sample-drive-id-1',
        driveViewLink: 'https://drive.google.com',
        fileSize: 2450000,
        mimeType: 'application/pdf',
        uploadDate: '2026-08-12',
        scannedViaCamera: false,
        description: 'Bản scan hợp đồng ký đóng dấu giáp lai đầy đủ'
      }
    ]
  },
  {
    id: 'task-102',
    projectId: 'proj-01',
    code: 'PM-02',
    title: 'Khảo sát địa chất & Hiện trường công trình',
    description: 'Đội khảo sát tiến hành khoan lấy mẫu đất và đo đạc trắc địa hiện trạng.',
    category: 'Khảo sát & Lập kế hoạch',
    status: 'completed',
    priority: 'urgent',
    progress: 100,
    assignee: 'Trịnh Trọng (Kỹ sư địa chất)',
    startDate: '2026-08-16',
    dueDate: '2026-08-30',
    budget: '180.000.000 VNĐ',
    notes: 'Báo cáo khảo sát đạt kết quả tốt, đủ điều kiện tải trọng móng.',
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    documents: [
      {
        id: 'doc-02',
        name: 'Bien_Ban_Khao_Sat_Hien_Truong.jpg',
        type: 'report',
        projectId: 'proj-01',
        category: 'Khảo sát & Lập kế hoạch',
        driveFileId: 'sample-drive-id-2',
        driveViewLink: 'https://drive.google.com',
        fileSize: 3120000,
        mimeType: 'image/jpeg',
        uploadDate: '2026-08-28',
        scannedViaCamera: true,
        description: 'Ảnh scan biên bản xác nhận mốc ranh giới hiện trường.'
      }
    ]
  },
  {
    id: 'task-103',
    projectId: 'proj-01',
    code: 'PM-03',
    title: 'Hoàn thiện Thiết kế kỹ thuật & Bản vẽ Thi công đợt 1',
    description: 'Phát hành bản vẽ kết cấu, kiến trúc, cơ điện (MEP) phiên bản Rev 2.0 có chữ ký phê duyệt.',
    category: 'Thiết kế & Giải pháp kỹ thuật',
    status: 'in_progress',
    priority: 'high',
    progress: 85,
    assignee: 'Lê Hoàng Hải (Trưởng phòng Thiết kế)',
    startDate: '2026-09-01',
    dueDate: '2026-09-25',
    budget: '320.000.000 VNĐ',
    notes: 'Đang chỉnh sửa bản vẽ mặt bằng tầng lửng.',
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    documents: [
      {
        id: 'doc-03',
        name: 'Ban_Ve_Ket_Cau_Rev2.pdf',
        type: 'drawing',
        projectId: 'proj-01',
        category: 'Thiết kế & Giải pháp kỹ thuật',
        driveFileId: 'sample-drive-id-3',
        driveViewLink: 'https://drive.google.com',
        fileSize: 14500000,
        mimeType: 'application/pdf',
        uploadDate: '2026-09-15',
        scannedViaCamera: false,
        description: 'Bản vẽ kỹ thuật chi tiết đã kiểm tra.'
      }
    ]
  },
  {
    id: 'task-104',
    projectId: 'proj-01',
    code: 'PM-04',
    title: 'Gia công lắp dựng kết cấu thép & Đổ bê tông sàn tầng 1',
    description: 'Tiến hành đổ bê tông dầm sàn, kiểm tra mác bê tông và lấy mẫu thí nghiệm.',
    category: 'Triển khai & Thi công',
    status: 'in_progress',
    priority: 'urgent',
    progress: 60,
    assignee: 'Phan Quốc Long (Chỉ huy trưởng công trường)',
    startDate: '2026-09-10',
    dueDate: '2026-10-05',
    budget: '1.250.000.000 VNĐ',
    notes: 'Cần theo dõi thời tiết để bảo đảm chất lượng ninh kết.',
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    documents: []
  },
  {
    id: 'task-105',
    projectId: 'proj-01',
    code: 'PM-05',
    title: 'Nghiệm thu vật liệu & Thiết bị đợt 1',
    description: 'Kiểm tra chứng chỉ xuất xứ (CO), chứng nhận chất lượng (CQ) của toàn bộ thiết bị nhập khẩu.',
    category: 'Kiểm thử & Nghiệm thu (UAT)',
    status: 'review',
    priority: 'medium',
    progress: 75,
    assignee: 'Vũ Đức Toàn (Tư vấn Giám sát)',
    startDate: '2026-09-18',
    dueDate: '2026-09-28',
    budget: '95.000.000 VNĐ',
    notes: 'Đang tổng hợp phiếu xuất xưởng từ nhà sản xuất.',
    updatedAt: new Date().toISOString(),
    documents: []
  },
  {
    id: 'task-106',
    projectId: 'proj-01',
    code: 'PM-06',
    title: 'Lập hồ sơ Hoàn công & Chuyển giao Vận hành',
    description: 'Chuẩn bị danh mục tài liệu hoàn công theo quy định và hướng dẫn quy trình vận hành hệ thống.',
    category: 'Bàn giao & Hoàn công',
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    assignee: 'Nguyễn Minh (PM Trưởng)',
    startDate: '2026-10-15',
    dueDate: '2026-11-10',
    budget: '120.000.000 VNĐ',
    notes: 'Bắt đầu sau khi hoàn thành nghiệm thu liên động.',
    updatedAt: new Date().toISOString(),
    documents: []
  }
];

const PROJECTS_STORAGE_KEY = 'pm_projects_data_v2';
const ACTIVE_PROJECT_KEY = 'pm_active_project_id_v2';
const TASKS_STORAGE_KEY = 'pm_tasks_data_v2';
const CATEGORIES_STORAGE_KEY = 'pm_categories_data_v1';
const DRIVE_ROOT_FOLDER_KEY = 'pm_drive_root_folder_info_v1';

export function deduplicateProjects(projects: Project[]): Project[] {
  if (!Array.isArray(projects)) return [];
  const seen = new Set<string>();
  const result: Project[] = [];
  for (const p of projects) {
    if (p && p.id) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        result.push(p);
      }
    }
  }
  return result;
}

export function loadSavedProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      saveProjects(DEFAULT_PROJECTS);
      return DEFAULT_PROJECTS;
    }
    const parsed: any[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveProjects(DEFAULT_PROJECTS);
      return DEFAULT_PROJECTS;
    }
    const deduped = deduplicateProjects(parsed);
    if (deduped.length !== parsed.length) {
      saveProjects(deduped);
    }
    return deduped;
  } catch (error) {
    console.error('Lỗi load projects từ localStorage:', error);
    return DEFAULT_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    const deduped = deduplicateProjects(projects);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(deduped));
  } catch (error) {
    console.error('Lỗi lưu projects vào localStorage:', error);
  }
}

export function loadActiveProjectId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return saved || DEFAULT_PROJECTS[0].id;
  } catch {
    return DEFAULT_PROJECTS[0].id;
  }
}

export function saveActiveProjectId(projectId: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  } catch (error) {
    console.error('Lỗi lưu active project id:', error);
  }
}

export function loadSavedTasks(): TaskItem[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      saveTasks(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    const parsed: any[] = JSON.parse(raw);
    const validated = parsed.map(t => ({
      ...t,
      projectId: t.projectId || 'proj-01'
    }));
    return validated;
  } catch (error) {
    console.error('Lỗi load tasks từ localStorage:', error);
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Lỗi lưu tasks vào localStorage:', error);
  }
}

export function loadSavedCategories(): CategoryInfo[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryInfo[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Lỗi lưu categories:', error);
  }
}

export function getSavedDriveFolder(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem(DRIVE_ROOT_FOLDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDriveFolder(folder: { id: string; name: string }): void {
  try {
    localStorage.setItem(DRIVE_ROOT_FOLDER_KEY, JSON.stringify(folder));
  } catch (error) {
    console.error('Lỗi lưu drive folder info:', error);
  }
}

// Aliases for compatibility across components
export const INITIAL_PROJECTS = DEFAULT_PROJECTS;
export { INITIAL_TASKS };
export const WBS_CATEGORIES = DEFAULT_CATEGORIES;
export const getStoredProjects = loadSavedProjects;
export const setStoredProjects = saveProjects;
export const getStoredTasks = loadSavedTasks;
export const setStoredTasks = saveTasks;

export function getMasterDrivePath(): string {
  try {
    return localStorage.getItem('pm_master_drive_path') || '01. QUẢN LÝ DỰ ÁN & HỒ SƠ CÔNG TRÌNH';
  } catch {
    return '01. QUẢN LÝ DỰ ÁN & HỒ SƠ CÔNG TRÌNH';
  }
}

export function setMasterDrivePath(path: string): void {
  try {
    localStorage.setItem('pm_master_drive_path', path);
  } catch (error) {
    console.error('Lỗi lưu master drive path:', error);
  }
}

const LEGACY_SAMPLE_MANAGED_DOC_IDS = new Set([
  'doc-001',
  'doc-002',
  'doc-003',
  'doc-004',
  'doc-005',
  'doc-006',
  'doc-007'
]);

const SAMPLE_DOCS_CLEANED_KEY = 'pm_managed_docs_samples_cleaned_v1';

// Mặc định Quản lý tài liệu không chứa tài liệu mẫu nào; chỉ hiển thị tài liệu người dùng thêm hoặc khai báo loại văn bản / phòng ban
export const INITIAL_MANAGED_DOCUMENTS: ManagedDocument[] = [];

export function loadSavedManagedDocuments(): ManagedDocument[] {
  try {
    const raw = localStorage.getItem('pm_managed_documents');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    let docsToLoad: ManagedDocument[] = parsed;
    if (!localStorage.getItem(SAMPLE_DOCS_CLEANED_KEY)) {
      docsToLoad = parsed.filter((doc: ManagedDocument) => doc && !LEGACY_SAMPLE_MANAGED_DOC_IDS.has(doc.id));
      localStorage.setItem('pm_managed_documents', JSON.stringify(docsToLoad));
      localStorage.setItem(SAMPLE_DOCS_CLEANED_KEY, '1');
    }

    // Tự động chuẩn hóa dữ liệu cũ sang định dạng đa tệp đính kèm / nhiều lần sửa đổi
    return docsToLoad.map((doc: ManagedDocument) => {
      if (doc.attachments && Array.isArray(doc.attachments) && doc.attachments.length > 0) {
        return {
          ...doc,
          attachments: doc.attachments.map((att: DocumentAttachment) => ({
            ...att,
            uploadedAt: att.uploadedAt || doc.uploadedAt || doc.issueDate || new Date().toISOString()
          }))
        };
      }

      if (doc.driveFileName || doc.driveFileLink) {
        return {
          ...doc,
          attachments: [
            {
              id: `${doc.id}-att-1`,
              fileName: doc.driveFileName || 'Tệp đính kèm',
              fileLink: doc.driveFileLink,
              fileSize: doc.fileSize,
              versionName: 'Lần 1 (Gốc)',
              uploadedAt: doc.uploadedAt || doc.issueDate || new Date().toISOString(),
              note: 'Bản ban đầu',
              isPrimary: true
            }
          ]
        };
      }

      return {
        ...doc,
        attachments: []
      };
    });
  } catch (e) {
    console.error('Lỗi đọc tài liệu quản lý từ localStorage:', e);
    return [];
  }
}

export function saveManagedDocuments(docs: ManagedDocument[]): void {
  try {
    localStorage.setItem('pm_managed_documents', JSON.stringify(docs));
  } catch (e) {
    console.error('Lỗi lưu tài liệu quản lý vào localStorage:', e);
  }
}

export const getStoredManagedDocuments = loadSavedManagedDocuments;
export const setStoredManagedDocuments = saveManagedDocuments;

// Danh mục loại văn bản mặc định (Tờ trình, Quyết định, Công văn...)
export const DEFAULT_MANAGED_DOC_TYPES: ManagedDocTypeInfo[] = [
  {
    id: 'to_trinh',
    code: 'TTr',
    name: 'Tờ trình',
    color: 'amber',
    description: 'Tờ trình đề xuất, xin chủ trương, phê duyệt từ các phòng ban',
    isSystem: true
  },
  {
    id: 'quyet_dinh',
    code: 'QĐ',
    name: 'Quyết định',
    color: 'rose',
    description: 'Quyết định ban hành từ Ban Giám đốc hoặc cơ quan có thẩm quyền',
    isSystem: true
  },
  {
    id: 'cong_van',
    code: 'CV',
    name: 'Công văn',
    color: 'blue',
    description: 'Công văn đi, công văn đến, trao đổi liên ngành và đối tác',
    isSystem: true
  },
  {
    id: 'thong_bao',
    code: 'TB',
    name: 'Thông báo',
    color: 'cyan',
    description: 'Thông báo nội bộ, phân công nhiệm vụ, kết luận điều hành',
    isSystem: true
  },
  {
    id: 'bien_ban',
    code: 'BB',
    name: 'Biên bản / Nghiệm thu',
    color: 'emerald',
    description: 'Biên bản làm việc, nghiệm thu giai đoạn, hiện trường bàn giao',
    isSystem: true
  },
  {
    id: 'hop_dong',
    code: 'HĐ',
    name: 'Hợp đồng & Phụ lục',
    color: 'purple',
    description: 'Hợp đồng kinh tế, phụ lục hợp đồng xây lắp, mua sắm vật tư',
    isSystem: true
  },
  {
    id: 'giay_phep',
    code: 'GP',
    name: 'Giấy phép',
    color: 'teal',
    description: 'Giấy phép xây dựng, cấp phép thi công, quy hoạch kiến trúc',
    isSystem: true
  },
  {
    id: 'bao_cao',
    code: 'BC',
    name: 'Báo cáo',
    color: 'indigo',
    description: 'Báo cáo tiến độ tuần/tháng, báo cáo giám sát, tài chính kỹ thuật',
    isSystem: true
  },
  {
    id: 'chi_thi',
    code: 'CT',
    name: 'Chỉ thị / Kết luận',
    color: 'orange',
    description: 'Chỉ thị công tác, kết luận cuộc họp giao ban',
    isSystem: true
  },
  {
    id: 'ban_ve',
    code: 'BV',
    name: 'Bản vẽ / Thiết kế',
    color: 'cyan',
    description: 'Bản vẽ thi công, hồ sơ thiết kế kỹ thuật, bản vẽ hoàn công',
    isSystem: true
  },
  {
    id: 'hoa_don',
    code: 'HĐơn',
    name: 'Hóa đơn / Chứng từ',
    color: 'yellow',
    description: 'Hóa đơn GTGT, chứng từ tạm ứng, thanh toán giải ngân',
    isSystem: true
  },
  {
    id: 'khac',
    code: 'K',
    name: 'Khác',
    color: 'slate',
    description: 'Các loại văn bản, hồ sơ biểu mẫu khác chưa phân loại',
    isSystem: true
  }
];

/**
 * Tự động nhận diện loại văn bản từ ký hiệu văn bản hoặc nội dung trích yếu
 */
export function detectDocTypeFromText(docText?: string, content?: string): string {
  const d = (docText || '').toLowerCase().trim();
  const c = (content || '').toLowerCase().trim();
  
  if (d.includes('/qđ') || d.includes('/qd') || d.includes('qđ') || d.includes('qd') || c.startsWith('quyết định') || c.includes('quyết định')) {
    return 'quyet_dinh';
  }
  if (d.includes('/ttr') || d.includes('ttr') || c.startsWith('tờ trình') || c.includes('tờ trình')) {
    return 'to_trinh';
  }
  if (d.includes('/hđ') || d.includes('/hd') || d.includes('hđ-xd') || d.includes('hd-xd') || c.startsWith('hợp đồng') || c.includes('hợp đồng') || c.includes('phụ lục')) {
    return 'hop_dong';
  }
  if (d.includes('/gpxd') || d.includes('gpxd') || d.includes('/gp') || c.startsWith('giấy phép') || c.includes('giấy phép')) {
    return 'giay_phep';
  }
  if (d.includes('/cv') || d.includes('cv') || c.startsWith('công văn') || c.includes('công văn')) {
    return 'cong_van';
  }
  if (d.includes('/tb') || d.includes('tb') || c.startsWith('thông báo') || c.includes('thông báo')) {
    return 'thong_bao';
  }
  if (d.includes('/bb') || d.includes('bb') || d.includes('bbnt') || c.includes('nghiệm thu') || c.startsWith('biên bản') || c.includes('biên bản')) {
    return 'bien_ban';
  }
  if (d.includes('/bc') || d.includes('bc') || c.startsWith('báo cáo') || c.includes('báo cáo')) {
    return 'bao_cao';
  }
  if (d.includes('/ct') || d.includes('ct') || c.startsWith('chỉ thị') || c.includes('chỉ thị')) {
    return 'chi_thi';
  }
  if (d.includes('/bv') || d.includes('bv') || c.startsWith('bản vẽ') || c.includes('bản vẽ') || c.includes('thiết kế')) {
    return 'ban_ve';
  }
  if (d.includes('hđơn') || d.includes('hdon') || c.startsWith('hóa đơn') || c.includes('hóa đơn')) {
    return 'hoa_don';
  }
  return 'khac';
}

export function loadSavedManagedDocTypes(): ManagedDocTypeInfo[] {
  try {
    const raw = localStorage.getItem('pm_managed_doc_types');
    if (!raw) return DEFAULT_MANAGED_DOC_TYPES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MANAGED_DOC_TYPES;
  } catch (e) {
    console.error('Lỗi đọc loại văn bản từ localStorage:', e);
    return DEFAULT_MANAGED_DOC_TYPES;
  }
}

export function saveManagedDocTypes(types: ManagedDocTypeInfo[]): void {
  try {
    localStorage.setItem('pm_managed_doc_types', JSON.stringify(types));
  } catch (e) {
    console.error('Lỗi lưu loại văn bản vào localStorage:', e);
  }
}

export const getStoredManagedDocTypes = loadSavedManagedDocTypes;
export const setStoredManagedDocTypes = saveManagedDocTypes;

// Danh mục phòng ban / bộ phận mặc định (đồng bộ giữa Quản lý tài liệu và Chi tiết dự án)
export const DEFAULT_MANAGED_DEPARTMENTS: ManagedDepartmentInfo[] = [
  {
    id: 'dept-bgd',
    code: 'BGĐ',
    name: 'Ban Giám đốc',
    description: 'Ban Tổng Giám đốc / Lãnh đạo công ty',
    isSystem: true
  },
  {
    id: 'dept-bqlda',
    code: 'BQLDA',
    name: 'Ban Quản lý Dự án',
    description: 'Đơn vị quản lý, điều hành tiến độ và hồ sơ dự án',
    isSystem: true
  },
  {
    id: 'dept-ktvh',
    code: 'KT-VH',
    name: 'Phòng Kỹ thuật - Vận hành',
    description: 'Quản lý kỹ thuật, thiết bị, cơ điện và vận hành cảng',
    isSystem: true
  },
  {
    id: 'dept-khkd',
    code: 'KH-KD',
    name: 'Phòng Kế hoạch - Kinh doanh',
    description: 'Lập kế hoạch đầu tư, đấu thầu và kinh doanh khai thác',
    isSystem: true
  },
  {
    id: 'dept-kttc',
    code: 'KT-TC',
    name: 'Phòng Kế toán - Tài chính',
    description: 'Quản lý tài chính, tạm ứng, thanh quyết toán công trình',
    isSystem: true
  },
  {
    id: 'dept-tchc',
    code: 'TC-HC',
    name: 'Phòng Tổ chức - Hành chính',
    description: 'Nhân sự, văn thư lưu trữ, hành chính tổng hợp',
    isSystem: true
  },
  {
    id: 'dept-atmt',
    code: 'AT-MT',
    name: 'Ban An toàn - Môi trường',
    description: 'An toàn lao động, PCCC, đánh giá tác động môi trường',
    isSystem: true
  },
  {
    id: 'dept-tvgs',
    code: 'TVGS',
    name: 'Đơn vị Tư vấn Giám sát',
    description: 'Tư vấn giám sát thi công, kiểm định và nghiệm thu',
    isSystem: true
  },
  {
    id: 'dept-nttc',
    code: 'NTTC',
    name: 'Nhà thầu thi công',
    description: 'Nhà thầu xây lắp, cung cấp thiết bị và thi công công trình',
    isSystem: true
  },
  {
    id: 'dept-cqnn',
    code: 'CQNN',
    name: 'Cảng vụ / Cơ quan nhà nước',
    description: 'Cảng vụ Hàng hải, Sở ban ngành và cơ quan quản lý nhà nước',
    isSystem: true
  }
];

export function loadSavedManagedDepartments(): ManagedDepartmentInfo[] {
  try {
    const raw = localStorage.getItem('pm_managed_departments');
    if (!raw) return DEFAULT_MANAGED_DEPARTMENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MANAGED_DEPARTMENTS;
  } catch (e) {
    console.error('Lỗi đọc danh mục phòng ban từ localStorage:', e);
    return DEFAULT_MANAGED_DEPARTMENTS;
  }
}

export function saveManagedDepartments(departments: ManagedDepartmentInfo[]): void {
  try {
    localStorage.setItem('pm_managed_departments', JSON.stringify(departments));
  } catch (e) {
    console.error('Lỗi lưu danh mục phòng ban vào localStorage:', e);
  }
}

export const getStoredManagedDepartments = loadSavedManagedDepartments;
export const setStoredManagedDepartments = saveManagedDepartments;
