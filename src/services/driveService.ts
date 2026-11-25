export interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
  parents?: string[];
}

export interface DriveUploadedFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  size?: string;
  mimeType: string;
  createdTime: string;
  thumbnailLink?: string;
}

const DEFAULT_ROOT_FOLDER_NAME = '📁 Ho_So_Tai_Lieu_Du_An_PM';

/**
 * Trích xuất Google Drive Folder ID từ đường dẫn URL hoặc chuỗi ID thuần
 * Hỗ trợ:
 * - https://drive.google.com/drive/folders/<ID>
 * - https://drive.google.com/drive/u/0/folders/<ID>?usp=sharing
 * - https://drive.google.com/open?id=<ID>
 * - Chuỗi ID trực tiếp
 */
export function extractDriveFolderIdFromUrl(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const foldersMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (foldersMatch?.[1]) return foldersMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed) && !trimmed.includes('http')) {
    return trimmed;
  }

  return null;
}

export function buildDriveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

/**
 * Lấy thông tin thực tế (tên, link) của một thư mục Google Drive theo ID
 */
export async function getDriveFolderMetadata(
  token: string,
  folderId: string
): Promise<DriveFolder> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,name,webViewLink,mimeType,trashed,parents&supportsAllDrives=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new Error('Phiên đăng nhập Google Drive đã hết hạn (401). Vui lòng bấm "Kết nối lại Google Drive".');
  }
  if (res.status === 403 || res.status === 404) {
    throw new Error(
      `Không thể truy cập thư mục Google Drive (${res.status}). Hãy bấm "Kết nối lại Google Drive" để cấp đầy đủ quyền truy cập thư mục cũ hoặc kiểm tra lại đường link.`
    );
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Lỗi đọc thư mục Google Drive (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.trashed) {
    throw new Error('Thư mục Google Drive này đang nằm trong Thùng rác.');
  }
  if (data.mimeType && data.mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error('Đường link này là tệp tin, không phải thư mục Google Drive.');
  }

  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || buildDriveFolderUrl(data.id),
    parents: data.parents,
  };
}

/**
 * Liệt kê toàn bộ thư mục con trực tiếp trong một thư mục Google Drive
 */
export async function listDriveSubfolders(
  token: string,
  parentId: string
): Promise<DriveFolder[]> {
  const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,parents)&pageSize=200&orderBy=name&includeItemsFromAllDrives=true&supportsAllDrives=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new Error('Phiên đăng nhập Google Drive đã hết hạn (401). Vui lòng kết nối lại Google Drive.');
  }
  if (res.status === 403 || res.status === 404) {
    throw new Error('Không có quyền đọc thư mục Google Drive này. Vui lòng bấm "Kết nối lại Google Drive" để cấp quyền mới.');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể quét thư mục con trên Google Drive (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink || buildDriveFolderUrl(f.id),
    parents: f.parents,
  }));
}

/**
 * Tìm hoặc tạo thư mục gốc cho tài liệu dự án trên Google Drive
 */
export async function ensureProjectRootFolder(
  token: string,
  customFolderName?: string
): Promise<DriveFolder> {
  const folderName = (customFolderName || DEFAULT_ROOT_FOLDER_NAME)
    .replace(/^\/+|\/+$/g, '')
    .trim() || DEFAULT_ROOT_FOLDER_NAME;
  try {
    // 1. Tìm thư mục theo tên và mimeType folder
    const query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive&includeItemsFromAllDrives=true&supportsAllDrives=true`;
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (searchRes.status === 401) {
      throw new Error('Phiên đăng nhập Google Drive đã hết hạn (401). Vui lòng kết nối lại Google Drive.');
    }

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          webViewLink: data.files[0].webViewLink || buildDriveFolderUrl(data.files[0].id),
        };
      }
    }

    // 2. Nếu chưa có thì tạo mới thư mục
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink&supportsAllDrives=true', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Thư mục lưu trữ tài liệu scan dự án quản lý',
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Không thể tạo thư mục trên Google Drive (${createRes.status}): ${errText}`);
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      webViewLink: created.webViewLink || buildDriveFolderUrl(created.id),
    };
  } catch (error) {
    console.error('Lỗi khởi tạo thư mục Google Drive:', error);
    throw error;
  }
}

/**
 * Tìm hoặc tạo thư mục riêng cho từng Dự án trên Google Drive
 */
export async function ensureProjectSubfolder(
  token: string,
  rootFolderId: string,
  projectCode: string,
  projectName: string
): Promise<DriveFolder> {
  const safeName = `📁 [${projectCode}] ${projectName}`;
  const query = `'${rootFolderId}' in parents and name = '${safeName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          webViewLink: data.files[0].webViewLink,
        };
      }
    }

    // Tạo nếu chưa có
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
        description: `Thư mục lưu trữ dự án ${projectName}`,
      }),
    });

    if (!createRes.ok) {
      return { id: rootFolderId, name: safeName };
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      webViewLink: created.webViewLink,
    };
  } catch {
    return { id: rootFolderId, name: safeName };
  }
}

/**
 * Tìm hoặc tạo thư mục con theo danh mục công việc (Category)
 */
export async function ensureCategorySubfolder(
  token: string,
  parentId: string,
  categoryName: string
): Promise<DriveFolder> {
  const safeName = `📁 ${categoryName}`;
  const query = `'${parentId}' in parents and name = '${safeName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          webViewLink: data.files[0].webViewLink,
        };
      }
    }

    // Tạo nếu chưa có
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    });

    if (!createRes.ok) {
      return { id: parentId, name: categoryName };
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      webViewLink: created.webViewLink,
    };
  } catch {
    return { id: parentId, name: categoryName };
  }
}

/**
 * Tìm hoặc tạo thư mục theo tên chính xác trong thư mục cha trên Google Drive
 */
export async function ensureFolderByName(
  token: string,
  parentId: string,
  folderName: string,
  description?: string
): Promise<DriveFolder> {
  const cleanName = folderName.trim().replace(/[\\/]+/g, ' - ');
  const query = `'${parentId}' in parents and name = '${cleanName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&includeItemsFromAllDrives=true&supportsAllDrives=true`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.status === 401) {
    throw new Error('Phiên đăng nhập Google Drive đã hết hạn (401). Vui lòng bấm "Kết nối lại Google Drive".');
  }
  if (searchRes.status === 403 || searchRes.status === 404) {
    throw new Error(
      `Không thể truy cập thư mục Google Drive (${searchRes.status}). Hãy bấm "Kết nối lại Google Drive" để cấp quyền truy cập thư mục cũ hoặc kiểm tra lại link thư mục mẹ.`
    );
  }

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return {
        id: data.files[0].id,
        name: data.files[0].name,
        webViewLink: data.files[0].webViewLink || buildDriveFolderUrl(data.files[0].id),
      };
    }
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: cleanName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
      description: description || `Thư mục ${cleanName}`,
    }),
  });

  if (createRes.status === 401) {
    throw new Error('Phiên đăng nhập Google Drive đã hết hạn (401). Vui lòng bấm "Kết nối lại Google Drive".');
  }
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Không thể tạo thư mục "${cleanName}" trên Google Drive (${createRes.status}): ${errText}`);
  }

  const created = await createRes.json();
  return {
    id: created.id,
    name: created.name,
    webViewLink: created.webViewLink || buildDriveFolderUrl(created.id),
  };
}

/**
 * Tìm hoặc tạo thư mục của Dự án bên trong Thư mục mẹ.
 * Nếu Thư mục mẹ đã chính là thư mục Năm (VD: "2026" hoặc "2026/"), sẽ tạo/tìm trực tiếp thư mục Dự án bên trong (không bị lồng 2026/2026/).
 */
export async function ensureProjectDriveFolder(
  token: string,
  rootFolderId: string,
  year: string,
  projectName: string,
  rootFolderName?: string
): Promise<{ projectFolder: DriveFolder; pathPrefix: string }> {
  const cleanYear = (year || new Date().getFullYear().toString()).trim();
  const cleanProjName = (projectName || 'Dự án').trim();
  const normalizedRoot = (rootFolderName || '').replace(/^\/+|\/+$/g, '').trim();

  // Kiểm tra xem thư mục mẹ đã chính là thư mục Năm (VD: "2026") hay chưa
  const rootAlreadyIsYear = normalizedRoot === cleanYear;

  let parentForProjectId = rootFolderId;
  let pathPrefix = `${cleanYear}/${cleanProjName}/`;

  if (!rootAlreadyIsYear) {
    const yearFolder = await ensureFolderByName(token, rootFolderId, cleanYear, `Thư mục năm ${cleanYear}`);
    parentForProjectId = yearFolder.id;
  } else {
    pathPrefix = `${cleanYear}/${cleanProjName}/`;
  }

  const projectFolder = await ensureFolderByName(
    token,
    parentForProjectId,
    cleanProjName,
    `Dự án ${cleanProjName}`
  );

  return { projectFolder, pathPrefix };
}

/**
 * Tạo hoặc lấy thư mục phân cấp theo cấu trúc chuẩn:
 * - Nếu dự án đã có sẵn existingProjectFolderId (do dán link dự án cũ hoặc đã đồng bộ):
 *   tự động tạo/lấy thư mục con [Chi tiết | Tài liệu kèm theo] ngay bên trong thư mục dự án đó.
 * - Nếu chưa có:
 *   tạo/lấy [Năm] / [Tên dự án] / [Chi tiết | Tài liệu kèm theo] bên trong Thư mục mẹ.
 */
export async function ensureProjectHierarchicalFolder(
  token: string,
  rootFolderId: string,
  year: string,
  projectName: string,
  subFolderType: string,
  options?: {
    existingProjectFolderId?: string;
    rootFolderName?: string;
  }
): Promise<{ folder: DriveFolder; projectFolder: DriveFolder; pathString: string }> {
  const cleanYear = (year || new Date().getFullYear().toString()).trim();
  const cleanProjName = (projectName || 'Dự án').trim();

  if (options?.existingProjectFolderId) {
    const projMeta = await getDriveFolderMetadata(token, options.existingProjectFolderId);
    const subFolder = await ensureFolderByName(
      token,
      projMeta.id,
      subFolderType,
      `Mục ${subFolderType} của ${projMeta.name}`
    );
    return {
      folder: subFolder,
      projectFolder: projMeta,
      pathString: `${projMeta.name}/${subFolderType}/`,
    };
  }

  const { projectFolder, pathPrefix } = await ensureProjectDriveFolder(
    token,
    rootFolderId,
    cleanYear,
    cleanProjName,
    options?.rootFolderName
  );

  const subFolder = await ensureFolderByName(
    token,
    projectFolder.id,
    subFolderType,
    `Mục ${subFolderType} của ${cleanProjName}`
  );

  return {
    folder: subFolder,
    projectFolder,
    pathString: `${pathPrefix}${subFolderType}/`,
  };
}

/**
 * Tạo hoặc lấy thư mục theo Bộ phận / Đơn vị nằm trực tiếp trong thư mục Hồ sơ gốc (rootFolderId)
 * Dùng khi thêm hoặc tải tài liệu trực tiếp tại mục Quản lý tài liệu
 */
export async function ensureDepartmentFolderInRoot(
  token: string,
  rootFolderId: string,
  departmentName: string
): Promise<{ folder: DriveFolder; pathString: string }> {
  const cleanDeptName = (departmentName || 'Văn bản chung')
    .replace(/[\\/]+/g, ' - ')
    .trim() || 'Văn bản chung';

  const deptFolder = await ensureFolderByName(
    token,
    rootFolderId,
    cleanDeptName,
    `Thư mục tài liệu của ${cleanDeptName} (Quản lý tài liệu)`
  );

  return {
    folder: deptFolder,
    pathString: `${cleanDeptName}/`,
  };
}

/**
 * Tải file/tài liệu scan trực tiếp lên Google Drive trong thư mục chỉ định
 */
export async function uploadDocumentToDrive(
  token: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<DriveUploadedFile> {
  const metadata = {
    name: fileName,
    mimeType: mimeType || fileBlob.type || 'image/jpeg',
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = '-------pm_drive_upload_boundary_' + Date.now();
  const multipartBody = new Blob([
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\n`,
    `Content-Type: ${mimeType || fileBlob.type || 'application/octet-stream'}\r\n\r\n`,
    fileBlob,
    `\r\n--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` });

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,size,mimeType,createdTime,thumbnailLink';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Tải lên Google Drive thất bại (${res.status}): ${errorBody}`);
  }

  const result = await res.json();
  return {
    id: result.id,
    name: result.name,
    webViewLink: result.webViewLink,
    webContentLink: result.webContentLink,
    size: result.size,
    mimeType: result.mimeType,
    createdTime: result.createdTime || new Date().toISOString(),
    thumbnailLink: result.thumbnailLink,
  };
}

/**
 * Liệt kê danh sách các tài liệu trong thư mục Google Drive
 */
export async function listDriveDocuments(
  token: string,
  folderId: string
): Promise<DriveUploadedFile[]> {
  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,webContentLink,size,mimeType,createdTime,thumbnailLink)&orderBy=createdTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Không thể tải danh sách tài liệu từ Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Lỗi lấy danh sách từ Drive:', error);
    return [];
  }
}

/**
 * Xóa file trên Google Drive (Lưu ý: Phải sau khi có xác nhận người dùng)
 */
export async function deleteDriveFile(
  token: string,
  fileId: string
): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Xóa file thất bại: ${err}`);
  }

  return true;
}

// Compatibility alias
export const getOrCreateFolder = ensureProjectRootFolder;
