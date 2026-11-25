import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderSync,
  ExternalLink,
  Search,
  FileText,
  Camera,
  Trash2,
  Scan,
  Check,
  FolderOpen,
  Edit3,
  Link2,
  FolderPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Unlink
} from 'lucide-react';
import { Project, ScannedDocument, TaskItem, CategoryInfo, DocumentType } from '../types';
import {
  DriveFolder,
  extractDriveFolderIdFromUrl,
  buildDriveFolderUrl,
  getDriveFolderMetadata,
  listDriveSubfolders,
  ensureProjectDriveFolder,
  ensureFolderByName,
  ensureProjectRootFolder
} from '../services/driveService';

interface DriveFolderExplorerProps {
  projects?: Project[];
  tasks: TaskItem[];
  categories: CategoryInfo[];
  driveFolderName: string;
  driveFolderId?: string | null;
  driveFolderLink?: string;
  driveToken?: string | null;
  isDriveConnected: boolean;
  onGoogleSignIn: () => void;
  onOpenScanModal: (taskId?: string) => void;
  onDeleteDocument: (doc: ScannedDocument) => void;
  onUpdateRootDriveFolder?: (updates: {
    name?: string;
    folderId?: string | null;
    folderLink?: string;
  }) => void;
  onUpdateProjectDriveFolder?: (
    projectId: string,
    updates: {
      driveFolderId?: string;
      driveFolderLink?: string;
      driveFolderPath?: string;
    }
  ) => void;
  onNavigateToProjectDetails?: (projectId: string) => void;
}

const normalizeMatchText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const DriveFolderExplorer: React.FC<DriveFolderExplorerProps> = ({
  projects = [],
  tasks,
  categories,
  driveFolderName,
  driveFolderId,
  driveFolderLink,
  driveToken,
  isDriveConnected,
  onGoogleSignIn,
  onOpenScanModal,
  onDeleteDocument,
  onUpdateRootDriveFolder,
  onUpdateProjectDriveFolder,
  onNavigateToProjectDetails
}) => {
  // === 1. STATE CHỈNH SỬA THƯ MỤC MẸ (HỒ SƠ GỐC) ===
  const [isEditingRoot, setIsEditingRoot] = useState(false);
  const [rootLinkInput, setRootLinkInput] = useState(
    driveFolderLink || (driveFolderId ? buildDriveFolderUrl(driveFolderId) : '')
  );
  const [rootNameInput, setRootNameInput] = useState(driveFolderName || '');
  const [isSavingRoot, setIsSavingRoot] = useState(false);
  const [rootStatus, setRootStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (!isEditingRoot) {
      setRootNameInput(driveFolderName || '');
      setRootLinkInput(driveFolderLink || (driveFolderId ? buildDriveFolderUrl(driveFolderId) : ''));
    }
  }, [driveFolderName, driveFolderId, driveFolderLink, isEditingRoot]);

  // === 2. STATE QUẢN LÝ THƯ MỤC CON (CÁC DỰ ÁN) ===
  const [projectSearch, setProjectSearch] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectLink, setEditingProjectLink] = useState('');
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
  const [creatingProjectId, setCreatingProjectId] = useState<string | null>(null);
  const [isScanningDrive, setIsScanningDrive] = useState(false);
  const [scannedDriveFolders, setScannedDriveFolders] = useState<Array<DriveFolder & { parentLabel?: string }>>([]);
  const [childNotice, setChildNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // === 3. STATE TÌM KIẾM TÀI LIỆU SCAN ===
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Lưu / Liên kết lại Thư mục mẹ
  const handleSaveRootFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRootDriveFolder) return;

    setRootStatus(null);
    const trimmedLink = rootLinkInput.trim();
    const trimmedName = rootNameInput.trim().replace(/^\/+|\/+$/g, '');
    const parsedId = extractDriveFolderIdFromUrl(trimmedLink);

    if (trimmedLink && !parsedId) {
      setRootStatus({
        type: 'error',
        message: 'Đường link Google Drive không hợp lệ. Hãy dán link dạng https://drive.google.com/drive/folders/... hoặc nhập Folder ID.'
      });
      return;
    }

    setIsSavingRoot(true);
    try {
      // Trường hợp người dùng dán Link / ID thư mục mẹ có sẵn trên Drive
      if (parsedId) {
        if (driveToken) {
          const meta = await getDriveFolderMetadata(driveToken, parsedId);
          onUpdateRootDriveFolder({
            folderId: meta.id,
            folderLink: meta.webViewLink || buildDriveFolderUrl(meta.id),
            name: trimmedName || meta.name
          });
          setRootStatus({
            type: 'success',
            message: `Đã liên kết Thư mục mẹ "${meta.name}" trên Google Drive thành công! Không cần tải lại tài liệu cũ.`
          });
        } else {
          onUpdateRootDriveFolder({
            folderId: parsedId,
            folderLink: buildDriveFolderUrl(parsedId),
            name: trimmedName || driveFolderName || 'Hồ sơ gốc'
          });
          setRootStatus({
            type: 'info',
            message: 'Đã lưu link Thư mục mẹ. Hãy bấm "Kết nối Google Drive" để xác nhận quyền truy cập và tải tệp.'
          });
        }
        setIsEditingRoot(false);
        return;
      }

      // Trường hợp chỉ sửa tên thư mục mẹ (không dán link)
      if (!trimmedName) {
        setRootStatus({
          type: 'error',
          message: 'Vui lòng dán link thư mục Google Drive hoặc nhập tên thư mục mẹ.'
        });
        return;
      }

      if (driveToken) {
        const foundOrCreated = await ensureProjectRootFolder(driveToken, trimmedName);
        onUpdateRootDriveFolder({
          folderId: foundOrCreated.id,
          folderLink: foundOrCreated.webViewLink || buildDriveFolderUrl(foundOrCreated.id),
          name: foundOrCreated.name
        });
        setRootStatus({
          type: 'success',
          message: `Đã đồng bộ Thư mục mẹ "${foundOrCreated.name}" trên Google Drive.`
        });
      } else {
        onUpdateRootDriveFolder({
          name: trimmedName,
          folderId: null,
          folderLink: ''
        });
        setRootStatus({
          type: 'info',
          message: `Đã đổi tên Thư mục mẹ thành "${trimmedName}".`
        });
      }
      setIsEditingRoot(false);
    } catch (err: any) {
      setRootStatus({
        type: 'error',
        message: err?.message || 'Không thể lưu Thư mục mẹ.'
      });
    } finally {
      setIsSavingRoot(false);
    }
  };

  // Quét toàn bộ thư mục con bên trong Thư mục mẹ (hỗ trợ cả cấu trúc trực tiếp và cấu trúc phân theo Năm như 2026/Tên dự án)
  const handleScanAndAutoMatchFolders = async () => {
    setChildNotice(null);
    if (!driveToken) {
      setChildNotice({
        type: 'error',
        message: 'Chưa kết nối Google Drive. Vui lòng bấm "Kết nối Google Drive" trước khi quét thư mục.'
      });
      return;
    }

    setIsScanningDrive(true);
    try {
      let effectiveRootId = driveFolderId || null;
      if (!effectiveRootId) {
        const rootFolder = await ensureProjectRootFolder(driveToken, driveFolderName);
        effectiveRootId = rootFolder.id;
        onUpdateRootDriveFolder?.({
          folderId: rootFolder.id,
          folderLink: rootFolder.webViewLink || buildDriveFolderUrl(rootFolder.id),
          name: rootFolder.name
        });
      }

      const topFolders = await listDriveSubfolders(driveToken, effectiveRootId);
      const discovered: Array<DriveFolder & { parentLabel?: string }> = [];

      for (const folder of topFolders) {
        // Nếu thư mục con cấp 1 là thư mục Năm (VD: 2024, 2025, 2026, 2027), quét thêm 1 cấp bên trong
        if (/^(20\d{2})$/.test(folder.name.trim())) {
          const yearChildren = await listDriveSubfolders(driveToken, folder.id);
          yearChildren.forEach(child => {
            discovered.push({ ...child, parentLabel: folder.name.trim() });
          });
        } else {
          discovered.push({ ...folder, parentLabel: driveFolderName.replace(/^\/+|\/+$/g, '') });
        }
      }

      setScannedDriveFolders(discovered);

      if (discovered.length === 0) {
        setChildNotice({
          type: 'info',
          message: 'Chưa tìm thấy thư mục con nào bên trong Thư mục mẹ trên Google Drive.'
        });
        return;
      }

      let matchedCount = 0;
      if (onUpdateProjectDriveFolder) {
        projects.forEach(proj => {
          const pNameNorm = normalizeMatchText(proj.name);
          const pCodeNorm = normalizeMatchText(proj.code);

          // 1. Khớp chính xác tên hoặc mã
          let match = discovered.find(f => {
            const fNorm = normalizeMatchText(f.name);
            return (
              fNorm === pNameNorm ||
              (pCodeNorm.length >= 3 && fNorm === pCodeNorm) ||
              (pNameNorm.length >= 6 && fNorm.includes(pNameNorm)) ||
              (fNorm.length >= 8 && pNameNorm.includes(fNorm))
            );
          });

          // 2. Khớp theo tiền tố dài (>= 18 ký tự đầu trùng khớp — phòng trường hợp tên dài bị cắt hoặc dư dấu cách)
          if (!match && pNameNorm.length >= 18) {
            const prefix = pNameNorm.slice(0, 18);
            match = discovered.find(f => normalizeMatchText(f.name).startsWith(prefix));
          }

          if (match) {
            const folderUrl = match.webViewLink || buildDriveFolderUrl(match.id);
            const alreadySame = proj.driveFolderId === match.id && proj.driveFolderLink === folderUrl;
            if (!alreadySame) {
              onUpdateProjectDriveFolder(proj.id, {
                driveFolderId: match.id,
                driveFolderLink: folderUrl,
                driveFolderPath: match.parentLabel ? `${match.parentLabel}/${match.name}/` : `${match.name}/`
              });
            }
            matchedCount += 1;
          }
        });
      }

      setChildNotice({
        type: 'success',
        message: `Đã quét thấy ${discovered.length} thư mục trên Google Drive và tự động khớp ${matchedCount}/${projects.length} dự án! Các dự án chưa khớp bạn có thể chọn nhanh từ danh sách quét hoặc dán link trực tiếp bên dưới.`
      });
    } catch (err: any) {
      setChildNotice({
        type: 'error',
        message: err?.message || 'Không thể quét thư mục con trên Google Drive.'
      });
    } finally {
      setIsScanningDrive(false);
    }
  };

  // Lưu link thư mục con cho 1 dự án cụ thể
  const handleSaveProjectLink = async (proj: Project) => {
    if (!onUpdateProjectDriveFolder) return;
    setChildNotice(null);

    const raw = editingProjectLink.trim();
    if (!raw) {
      onUpdateProjectDriveFolder(proj.id, {
        driveFolderId: undefined,
        driveFolderLink: undefined
      });
      setEditingProjectId(null);
      setChildNotice({
        type: 'info',
        message: `Đã gỡ liên kết Drive của dự án [${proj.code}] ${proj.name}.`
      });
      return;
    }

    const parsedId = extractDriveFolderIdFromUrl(raw);
    if (!parsedId) {
      setChildNotice({
        type: 'error',
        message: `Link Google Drive của dự án [${proj.code}] không hợp lệ. Vui lòng dán link dạng https://drive.google.com/drive/folders/...`
      });
      return;
    }

    setSavingProjectId(proj.id);
    try {
      if (driveToken) {
        const meta = await getDriveFolderMetadata(driveToken, parsedId);
        onUpdateProjectDriveFolder(proj.id, {
          driveFolderId: meta.id,
          driveFolderLink: meta.webViewLink || buildDriveFolderUrl(meta.id),
          driveFolderPath: `${meta.name}/`
        });
        setChildNotice({
          type: 'success',
          message: `Đã liên kết dự án [${proj.code}] với thư mục Drive "${meta.name}". Khi tải bổ sung tài liệu, ứng dụng sẽ lưu trực tiếp vào thư mục này!`
        });
      } else {
        onUpdateProjectDriveFolder(proj.id, {
          driveFolderId: parsedId,
          driveFolderLink: buildDriveFolderUrl(parsedId)
        });
        setChildNotice({
          type: 'info',
          message: `Đã lưu link thư mục Drive cho dự án [${proj.code}]. Hãy kết nối Google Drive để tải bổ sung tệp vào thư mục này.`
        });
      }
      setEditingProjectId(null);
    } catch (err: any) {
      setChildNotice({
        type: 'error',
        message: err?.message || `Không thể liên kết thư mục Drive cho dự án [${proj.code}].`
      });
    } finally {
      setSavingProjectId(null);
    }
  };

  // Chọn nhanh từ danh sách thư mục vừa quét được trên Drive
  const handleAssignScannedFolder = (proj: Project, folder: DriveFolder & { parentLabel?: string }) => {
    if (!onUpdateProjectDriveFolder) return;
    const url = folder.webViewLink || buildDriveFolderUrl(folder.id);
    onUpdateProjectDriveFolder(proj.id, {
      driveFolderId: folder.id,
      driveFolderLink: url,
      driveFolderPath: folder.parentLabel ? `${folder.parentLabel}/${folder.name}/` : `${folder.name}/`
    });
    setEditingProjectId(null);
    setChildNotice({
      type: 'success',
      message: `Đã gắn thư mục Drive "${folder.name}" cho dự án [${proj.code}] ${proj.name}.`
    });
  };

  // Tự động tạo / đồng bộ thư mục dự án (và thư mục con Chi tiết) trên Drive trong Thư mục mẹ
  const handleAutoCreateProjectFolder = async (proj: Project) => {
    if (!onUpdateProjectDriveFolder) return;
    setChildNotice(null);

    if (!driveToken) {
      setChildNotice({
        type: 'error',
        message: 'Vui lòng bấm "Kết nối Google Drive" để tạo thư mục tự động cho dự án.'
      });
      return;
    }

    setCreatingProjectId(proj.id);
    try {
      let effectiveRootId = driveFolderId || null;
      let effectiveRootName = driveFolderName;
      if (!effectiveRootId) {
        const rootFolder = await ensureProjectRootFolder(driveToken, driveFolderName);
        effectiveRootId = rootFolder.id;
        effectiveRootName = rootFolder.name;
        onUpdateRootDriveFolder?.({
          folderId: rootFolder.id,
          folderLink: rootFolder.webViewLink || buildDriveFolderUrl(rootFolder.id),
          name: rootFolder.name
        });
      }

      const year = proj.startYear || (proj.startDate ? proj.startDate.slice(0, 4) : String(new Date().getFullYear()));
      const existingId = proj.driveFolderId || extractDriveFolderIdFromUrl(proj.driveFolderLink);

      let finalFolder: DriveFolder;
      let finalPath: string;

      if (existingId) {
        finalFolder = await getDriveFolderMetadata(driveToken, existingId);
        await ensureFolderByName(driveToken, finalFolder.id, 'Chi tiết', `Mục Chi tiết của ${finalFolder.name}`);
        finalPath = `${finalFolder.name}/`;
      } else {
        const { projectFolder, pathPrefix } = await ensureProjectDriveFolder(
          driveToken,
          effectiveRootId,
          year,
          proj.name,
          effectiveRootName
        );
        await ensureFolderByName(driveToken, projectFolder.id, 'Chi tiết', `Mục Chi tiết của ${projectFolder.name}`);
        finalFolder = projectFolder;
        finalPath = pathPrefix;
      }

      onUpdateProjectDriveFolder(proj.id, {
        driveFolderId: finalFolder.id,
        driveFolderLink: finalFolder.webViewLink || buildDriveFolderUrl(finalFolder.id),
        driveFolderPath: finalPath
      });

      setChildNotice({
        type: 'success',
        message: `Đã tự động tạo / đồng bộ thư mục "${finalFolder.name}" (và mục Chi tiết) trên Google Drive cho dự án [${proj.code}]!`
      });
    } catch (err: any) {
      setChildNotice({
        type: 'error',
        message: err?.message || `Không thể tạo thư mục cho dự án [${proj.code}].`
      });
    } finally {
      setCreatingProjectId(null);
    }
  };

  // Thống kê & lọc danh sách dự án (thư mục con)
  const linkedProjectsCount = useMemo(() => {
    return projects.filter(p => !!(p.driveFolderId || extractDriveFolderIdFromUrl(p.driveFolderLink))).length;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase().trim();
    return projects.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.driveFolderPath || '').toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  // Thu thập tài liệu scan từ các công việc
  const allDocuments: ScannedDocument[] = [];
  tasks.forEach(task => {
    if (task.documents && task.documents.length > 0) {
      task.documents.forEach(doc => {
        allDocuments.push(doc);
      });
    }
  });

  const filteredDocuments = allDocuments.filter(doc => {
    if (selectedType !== 'all' && doc.type !== selectedType) return false;
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const getDocTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'contract':
        return { label: 'Hợp đồng & Phụ lục', color: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 'acceptance':
        return { label: 'Biên bản nghiệm thu', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'drawing':
        return { label: 'Bản vẽ & Thiết kế', color: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 'invoice':
        return { label: 'Hóa đơn chứng từ', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'report':
        return { label: 'Báo cáo tiến độ', color: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 'minutes':
        return { label: 'Biên bản họp', color: 'bg-teal-950 text-teal-300 border-teal-800' };
      default:
        return { label: 'Tài liệu khác', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const effectiveRootLink = driveFolderLink || (driveFolderId ? buildDriveFolderUrl(driveFolderId) : '');

  return (
    <div className="space-y-6">
      {/* 1. THƯ MỤC MẸ (THƯ MỤC GỐC GOOGLE DRIVE - CHỈNH SỬA / DÁN LINK ĐƯỢC) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Thư Mục Mẹ Lưu Trữ Trên Google Drive
                </h2>
                {isDriveConnected ? (
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-medium">
                    Đã kết nối Drive
                  </span>
                ) : (
                  <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full font-medium">
                    Chưa kết nối
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Khi sao lưu và phục hồi dự án cũ, bạn có thể dán trực tiếp link <strong className="text-slate-200">Thư mục mẹ</strong> đang có sẵn trên Google Drive tại đây để tiếp tục sử dụng kho hồ sơ cũ mà <strong className="text-emerald-300">không cần tải lại tệp</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                <span className="text-slate-400">Thư mục mẹ hiện tại:</span>
                <span className="font-mono text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold">
                  Google Drive / {driveFolderName.replace(/^\/+|\/+$/g, '')}
                </span>
                {driveFolderId && (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                    ID: {driveFolderId.slice(0, 12)}…
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onUpdateRootDriveFolder && (
              <button
                type="button"
                onClick={() => {
                  setRootStatus(null);
                  setIsEditingRoot(prev => !prev);
                }}
                className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingRoot ? 'Đóng chỉnh sửa' : 'Sửa / Dán link Thư mục mẹ'}</span>
              </button>
            )}

            {effectiveRootLink && (
              <a
                href={effectiveRootLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mở trên Drive</span>
              </a>
            )}

            <button
              type="button"
              onClick={onGoogleSignIn}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isDriveConnected
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
              title="Đăng nhập lại để cấp đầy đủ quyền đọc/tải tệp vào các thư mục cũ trên Google Drive"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>{isDriveConnected ? 'Kết nối lại Drive' : 'Kết nối Google Drive'}</span>
            </button>

            {isDriveConnected && (
              <button
                type="button"
                onClick={() => onOpenScanModal()}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <Scan className="w-4 h-4" />
                <span>Scan tài liệu mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Form chỉnh sửa / dán link Thư mục mẹ */}
        {isEditingRoot && (
          <form
            onSubmit={handleSaveRootFolder}
            className="mt-2 p-4 rounded-xl bg-slate-950/90 border border-amber-500/35 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                Cấu hình Thư mục mẹ (Hồ sơ gốc Google Drive)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingRoot(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Link Google Drive Thư mục mẹ (hoặc Folder ID)
                </label>
                <input
                  type="text"
                  value={rootLinkInput}
                  onChange={e => setRootLinkInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1bZWbN1mmowWF1kwBUL8qzklXpy6j-xcD"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Mở thư mục gốc (hoặc thư mục năm 2026) trên Google Drive, copy đường link trên thanh địa chỉ rồi dán vào ô này.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tên hiển thị Thư mục mẹ (tự điền theo Drive nếu để trống)
                </label>
                <input
                  type="text"
                  value={rootNameInput}
                  onChange={e => setRootNameInput(e.target.value)}
                  placeholder="VD: 01. QUẢN LÝ DỰ ÁN & HỒ SƠ CÔNG TRÌNH hoặc 2026"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nếu dán link thư mục năm (VD: <span className="font-mono text-slate-300">2026</span>), ứng dụng sẽ tự nhận biết và không tạo lồng <span className="font-mono text-slate-300">2026/2026</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingRoot(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingRoot}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSavingRoot ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang kiểm tra &amp; lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu &amp; Áp dụng Thư mục mẹ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Thông báo kết quả cấu hình Thư mục mẹ */}
        {rootStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 border ${
              rootStatus.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : rootStatus.type === 'error'
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-sky-950/50 border-sky-500/40 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {rootStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{rootStatus.message}</span>
            </div>
            {rootStatus.type === 'error' && (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold text-[11px] cursor-pointer shrink-0"
              >
                Kết nối lại Google Drive
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. DANH SÁCH THƯ MỤC CON (CÁC DỰ ÁN CHÍNH - DÁN LINK CŨ HOẶC TỰ TẠO KHI UP BỔ SUNG) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-emerald-400" />
                <span>Thư Mục Con Của Các Dự Án ({projects.length})</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 font-medium">
                Đã gắn link: {linkedProjectsCount}/{projects.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dán link Google Drive của từng dự án cũ vào đây (hoặc bấm quét tự động từ Thư mục mẹ). Khi bạn tải bổ sung tài liệu trong dự án đó, hệ thống sẽ <strong className="text-slate-200">tự động tạo thư mục con (Chi tiết / Tài liệu kèm theo)</strong> ngay bên trong thư mục dự án đã gắn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder="Tìm mã / tên dự án..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              disabled={isScanningDrive}
              onClick={handleScanAndAutoMatchFolders}
              className="inline-flex items-center gap-1.5 bg-sky-600/20 hover:bg-sky-600/35 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
              title="Quét tất cả thư mục con trong Thư mục mẹ trên Google Drive để tự động khớp vào các dự án hiện có"
            >
              {isScanningDrive ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang quét Drive...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tự động quét &amp; khớp từ Drive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thông báo hành động trên thư mục con */}
        {childNotice && (
          <div
            className={`p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 border ${
              childNotice.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : childNotice.type === 'error'
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-sky-950/50 border-sky-500/40 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {childNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{childNotice.message}</span>
            </div>
            {childNotice.type === 'error' && (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold text-[11px] cursor-pointer shrink-0"
              >
                Kết nối lại Google Drive
              </button>
            )}
          </div>
        )}

        {/* Bảng danh sách thư mục con theo từng dự án */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/80">
            Không tìm thấy dự án nào phù hợp.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredProjects.map(proj => {
              const projFolderId = proj.driveFolderId || extractDriveFolderIdFromUrl(proj.driveFolderLink);
              const projFolderUrl =
                proj.driveFolderLink || (projFolderId ? buildDriveFolderUrl(projFolderId) : '');
              const isLinked = !!projFolderId;
              const isEditingThis = editingProjectId === proj.id;
              const isSavingThis = savingProjectId === proj.id;
              const isCreatingThis = creatingProjectId === proj.id;

              return (
                <div
                  key={proj.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLinked
                      ? 'bg-slate-950/75 border-slate-800 hover:border-emerald-500/35'
                      : 'bg-slate-950/45 border-slate-800/80 hover:border-amber-500/35'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Tên dự án & Trạng thái thư mục */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                          {proj.code}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                          {proj.name}
                        </span>
                        {proj.startYear && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                            {proj.startYear}
                          </span>
                        )}
                        {isLinked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã gắn Drive</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
                            <Unlink className="w-3 h-3" />
                            <span>Chưa gắn link Drive</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {projFolderUrl ? (
                          <a
                            href={projFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-emerald-400/90 hover:text-emerald-300 hover:underline truncate max-w-full inline-flex items-center gap-1"
                            title={projFolderUrl}
                          >
                            <FolderOpen className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[420px]">
                              {proj.driveFolderPath ? `${proj.driveFolderPath} — ` : ''}
                              {projFolderUrl}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">
                            Chưa có link thư mục — Dán link thư mục cũ hoặc bấm "Tự tạo trên Drive" (hoặc tải tệp trực tiếp trong Chi tiết dự án sẽ tự tạo).
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nút thao tác */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {onUpdateProjectDriveFolder && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingThis) {
                              setEditingProjectId(null);
                            } else {
                              setEditingProjectId(proj.id);
                              setEditingProjectLink(projFolderUrl || '');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 transition-colors cursor-pointer"
                          title="Dán hoặc sửa đường link thư mục Google Drive của dự án này"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>{isEditingThis ? 'Đóng' : 'Dán / Sửa link'}</span>
                        </button>
                      )}

                      {onUpdateProjectDriveFolder && (
                        <button
                          type="button"
                          disabled={isCreatingThis}
                          onClick={() => handleAutoCreateProjectFolder(proj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/35 transition-colors cursor-pointer disabled:opacity-60"
                          title={
                            isLinked
                              ? 'Đồng bộ và đảm bảo có sẵn thư mục con Chi tiết bên trong thư mục dự án này'
                              : 'Tự động tạo thư mục dự án trong Thư mục mẹ trên Google Drive'
                          }
                        >
                          {isCreatingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isLinked ? (
                            <RefreshCw className="w-3 h-3" />
                          ) : (
                            <FolderPlus className="w-3 h-3" />
                          )}
                          <span>{isLinked ? 'Đồng bộ' : 'Tự tạo Drive'}</span>
                        </button>
                      )}

                      {projFolderUrl && (
                        <a
                          href={projFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                          title="Mở thư mục dự án trên Google Drive"
                        >
                          <ExternalLink className="w-3 h-3 text-emerald-400" />
                          <span>Mở Drive</span>
                        </a>
                      )}

                      {onNavigateToProjectDetails && (
                        <button
                          type="button"
                          onClick={() => onNavigateToProjectDetails(proj.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors cursor-pointer"
                          title="Mở trang Chi tiết dự án để tải bổ sung tài liệu"
                        >
                          <span>Chi tiết</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Khu vực dán link hoặc chọn nhanh thư mục Drive đã quét */}
                  {isEditingThis && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={editingProjectLink}
                          onChange={e => setEditingProjectLink(e.target.value)}
                          placeholder="Dán link thư mục Google Drive của dự án (https://drive.google.com/drive/folders/...)"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isSavingThis}
                            onClick={() => handleSaveProjectLink(proj)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {isSavingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Lưu link</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProjectId(null)}
                            className="px-2.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>

                      {scannedDriveFolders.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-400">Hoặc chọn nhanh thư mục đã quét từ Drive:</span>
                          <select
                            defaultValue=""
                            onChange={e => {
                              const selected = scannedDriveFolders.find(f => f.id === e.target.value);
                              if (selected) handleAssignScannedFolder(proj, selected);
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 max-w-md cursor-pointer"
                          >
                            <option value="">-- Chọn thư mục có sẵn trên Drive ({scannedDriveFolders.length}) --</option>
                            {scannedDriveFolders.map(f => (
                              <option key={f.id} value={f.id}>
                                {f.parentLabel ? `[${f.parentLabel}] ` : ''}
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. TÌM KIẾM & DANH SÁCH TÀI LIỆU SCAN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tài liệu scan..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Mọi loại tài liệu</option>
            <option value="acceptance">Biên bản nghiệm thu</option>
            <option value="contract">Hợp đồng &amp; Phụ lục</option>
            <option value="drawing">Bản vẽ thiết kế</option>
            <option value="report">Báo cáo tiến độ</option>
            <option value="invoice">Hóa đơn chứng từ</option>
            <option value="minutes">Biên bản họp</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Mọi danh mục WBS</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">Chưa có tài liệu scan nào</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sử dụng tính năng "Scan Tài liệu" để chụp biên bản, hợp đồng từ camera và lưu thẳng lên Google Drive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenScanModal()}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>Bắt đầu Scan ngay</span>
            </button>
          </div>
        ) : (
          filteredDocuments.map(doc => {
            const badge = getDocTypeLabel(doc.type);
            const parentTask = tasks.find(t => t.id === doc.taskId);

            return (
              <div
                key={doc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {doc.scannedViaCamera && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">
                        <Camera className="w-2.5 h-2.5" /> Scan Camera
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 hover:text-emerald-400 line-clamp-2 transition-colors">
                    {doc.name}
                  </h3>

                  {parentTask && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span className="font-mono text-slate-500 font-bold">[{parentTask.code}]</span>
                      <span className="truncate">{parentTask.title}</span>
                    </div>
                  )}

                  {doc.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>Ngày: {doc.uploadDate}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={doc.driveViewLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 py-1.5 px-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      title="Xem tài liệu trên Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem trên Drive</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Xóa tài liệu khỏi Google Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
