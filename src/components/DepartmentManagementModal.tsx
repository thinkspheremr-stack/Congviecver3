import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Check,
  RotateCcw,
  Building2,
  AlertCircle,
  Sparkles,
  GripVertical,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ManagedDepartmentInfo, ManagedDocument } from '../types';

const OrderNumberInput: React.FC<{
  index: number;
  total: number;
  onMoveTo: (targetOneBased: number) => void;
}> = ({ index, total, onMoveTo }) => {
  const [val, setVal] = useState(String(index + 1));

  useEffect(() => {
    setVal(String(index + 1));
  }, [index]);

  const commit = () => {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed !== index + 1) {
      onMoveTo(Math.min(Math.max(parsed, 1), total));
    } else {
      setVal(String(index + 1));
    }
  };

  return (
    <input
      type="number"
      min={1}
      max={Math.max(total, 1)}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-8 h-6 text-center font-mono text-xs font-bold bg-slate-900 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700 hover:border-sky-400 focus:border-sky-400 rounded text-slate-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text transition-colors shrink-0"
      title="Nhập số thứ tự mới rồi nhấn Enter để di chuyển nhanh"
    />
  );
};

interface DepartmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: ManagedDepartmentInfo[];
  allDocuments: ManagedDocument[];
  onAddDepartment: (newDept: Omit<ManagedDepartmentInfo, 'id'>) => string; // returns created department name
  onUpdateDepartment: (updatedDept: ManagedDepartmentInfo, oldName: string) => void;
  onDeleteDepartment: (deptId: string, oldName: string, reassignToName?: string) => void;
  onResetDepartments: () => void;
  onReorderDepartments?: (reordered: ManagedDepartmentInfo[]) => void;
  onSelectDepartment?: (deptName: string) => void;
}

export const DepartmentManagementModal: React.FC<DepartmentManagementModalProps> = ({
  isOpen,
  onClose,
  departments,
  allDocuments,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onResetDepartments,
  onReorderDepartments,
  onSelectDepartment
}) => {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingOldName, setEditingOldName] = useState<string>('');

  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDescription, setDeptDescription] = useState('');
  const [formError, setFormError] = useState('');

  const [deletingDept, setDeletingDept] = useState<ManagedDepartmentInfo | null>(null);
  const [reassignTargetName, setReassignTargetName] = useState<string>('');
  const [confirmingReset, setConfirmingReset] = useState(false);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const moveDepartment = (fromIdx: number, toIdx: number) => {
    if (!onReorderDepartments) return;
    const clampedTo = Math.max(0, Math.min(toIdx, departments.length - 1));
    if (fromIdx === clampedTo || fromIdx < 0 || fromIdx >= departments.length) return;
    const next = [...departments];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(clampedTo, 0, moved);
    onReorderDepartments(next);
  };

  const getDocCountForDept = (name: string) => {
    return allDocuments.filter(d => d.department === name).length;
  };

  const handleOpenAddForm = () => {
    setMode('add');
    setEditingDeptId(null);
    setEditingOldName('');
    setDeptName('');
    setDeptCode('');
    setDeptDescription('');
    setFormError('');
    setDeletingDept(null);
    setConfirmingReset(false);
  };

  const handleOpenEditForm = (dept: ManagedDepartmentInfo) => {
    setMode('edit');
    setEditingDeptId(dept.id);
    setEditingOldName(dept.name);
    setDeptName(dept.name);
    setDeptCode(dept.code || '');
    setDeptDescription(dept.description || '');
    setFormError('');
    setDeletingDept(null);
    setConfirmingReset(false);
  };

  const handleCancelForm = () => {
    setMode('list');
    setEditingDeptId(null);
    setEditingOldName('');
    setFormError('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = deptName.trim();
    if (!trimmedName) {
      setFormError('Vui lòng nhập tên phòng ban / bộ phận!');
      return;
    }

    const duplicate = departments.find(
      d => d.name.trim().toLowerCase() === trimmedName.toLowerCase() && d.id !== editingDeptId
    );
    if (duplicate) {
      setFormError(`Phòng ban "${trimmedName}" đã tồn tại trong danh sách!`);
      return;
    }

    if (mode === 'add') {
      const createdName = onAddDepartment({
        name: trimmedName,
        code: deptCode.trim().toUpperCase() || undefined,
        description: deptDescription.trim() || undefined,
        isSystem: false
      });
      if (onSelectDepartment) {
        onSelectDepartment(createdName);
      }
      setMode('list');
    } else if (mode === 'edit' && editingDeptId) {
      const existing = departments.find(d => d.id === editingDeptId);
      onUpdateDepartment(
        {
          id: editingDeptId,
          name: trimmedName,
          code: deptCode.trim().toUpperCase() || undefined,
          description: deptDescription.trim() || undefined,
          isSystem: existing?.isSystem ?? false
        },
        editingOldName
      );
      setMode('list');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingDept) return;
    onDeleteDepartment(deletingDept.id, deletingDept.name, reassignTargetName || undefined);
    setDeletingDept(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Quản Lý Danh Mục Phòng Ban / Bộ Phận</span>
                <span className="text-xs bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/60 font-mono">
                  {departments.length} phòng ban
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thêm, sửa, đổi tên hoặc xóa phòng ban — tự động đồng bộ sang Quản lý tài liệu và mục Chi tiết dự án
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* ADD / EDIT FORM */}
          {(mode === 'add' || mode === 'edit') && (
            <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-4 sm:p-5 animate-fade-in">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>{mode === 'add' ? 'Thêm phòng ban / đơn vị mới' : 'Chỉnh sửa thông tin phòng ban'}</span>
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Quay lại danh sách
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên phòng ban / đơn vị <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="VD: Phòng Đầu tư - Đấu thầu, Ban QLDA Cảng..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ký hiệu viết tắt <span className="text-slate-500 text-[11px] font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="text"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      placeholder="VD: BQLDA, KT-VH..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 uppercase font-mono placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mô tả chức năng / phạm vi <span className="text-slate-500 text-[11px] font-normal">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={deptDescription}
                    onChange={(e) => setDeptDescription(e.target.value)}
                    placeholder="VD: Phụ trách hồ sơ kỹ thuật, thẩm định thiết kế và dự toán..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500"
                  />
                </div>

                {mode === 'edit' && editingOldName && editingOldName !== deptName.trim() && (
                  <p className="text-[11px] text-blue-300/90 bg-blue-950/40 border border-blue-800/60 rounded-lg px-3 py-2">
                    Lưu ý: Khi đổi tên từ &quot;{editingOldName}&quot;, toàn bộ văn bản và dòng chi tiết đang gắn phòng ban này sẽ được tự động cập nhật sang tên mới.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{mode === 'add' ? 'Lưu phòng ban mới' : 'Cập nhật thay đổi'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST ALL DEPARTMENTS */}
          {mode === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Danh sách phòng ban / đơn vị đang áp dụng:
                  </span>
                  {onReorderDepartments && (
                    <span className="text-[11px] text-slate-500">
                      Kéo thả, bấm mũi tên ↑↓ hoặc nhập số thứ tự để sắp xếp lại vị trí hiển thị
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingDept(null);
                      setConfirmingReset(prev => !prev);
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-amber-400 text-xs px-2.5 py-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Khôi phục danh sách phòng ban mặc định ban đầu"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Khôi phục mặc định</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddForm}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm phòng ban</span>
                  </button>
                </div>
              </div>

              {confirmingReset && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-700/70 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-fade-in">
                  <span className="text-xs text-amber-200">
                    Khôi phục toàn bộ danh mục phòng ban về danh sách mặc định ban đầu?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingReset(false)}
                      className="px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetDepartments();
                        setConfirmingReset(false);
                      }}
                      className="px-3 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer"
                    >
                      Xác nhận khôi phục
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 divide-y divide-slate-800/70">
                {departments.map((dept, idx) => {
                  const count = getDocCountForDept(dept.name);
                  const remainingDepts = departments.filter(d => d.id !== dept.id);
                  const isDragged = draggedIdx === idx;
                  const isDragOver = dragOverIdx === idx && draggedIdx !== null && draggedIdx !== idx;

                  return (
                    <div
                      key={dept.id}
                      draggable={!!onReorderDepartments}
                      onDragStart={() => setDraggedIdx(idx)}
                      onDragOver={(e) => {
                        if (!onReorderDepartments) return;
                        e.preventDefault();
                        if (dragOverIdx !== idx) setDragOverIdx(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverIdx === idx) setDragOverIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIdx !== null && draggedIdx !== idx) {
                          moveDepartment(draggedIdx, idx);
                        }
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      className={`px-3 py-2.5 flex items-center justify-between gap-2.5 transition-colors ${
                        isDragged
                          ? 'opacity-50 bg-slate-800/70'
                          : isDragOver
                          ? 'bg-sky-950/40 ring-1 ring-inset ring-sky-500/70'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {onReorderDepartments ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing"
                              title="Kéo để thay đổi thứ tự"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                            <OrderNumberInput
                              index={idx}
                              total={departments.length}
                              onMoveTo={(targetOneBased) => moveDepartment(idx, targetOneBased - 1)}
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-500 w-5 text-center shrink-0">
                            {idx + 1}
                          </span>
                        )}

                        {dept.code ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold border font-mono shrink-0 bg-blue-950/60 text-blue-300 border-blue-700/60">
                            {dept.code}
                          </span>
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-400/70 shrink-0" />
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                              {dept.name}
                            </span>
                            {dept.isSystem && (
                              <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.2 rounded font-sans shrink-0">
                                Mặc định
                              </span>
                            )}
                          </div>
                          {dept.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-sm">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onReorderDepartments && (
                          <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveDepartment(idx, idx - 1)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Đẩy lên trên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === departments.length - 1}
                              onClick={() => moveDepartment(idx, idx + 1)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Đẩy xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700/80"
                          title={`${count} văn bản thuộc phòng ban này`}
                        >
                          {count} vb
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(dept)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Sửa tên, mã viết tắt hoặc mô tả phòng ban"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {departments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmingReset(false);
                              setDeletingDept(dept);
                              setReassignTargetName(remainingDepts[0]?.name || '');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Xóa phòng ban này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delete confirmation box */}
          {deletingDept && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-rose-200">
                    Xác nhận xóa phòng ban: &quot;{deletingDept.name}&quot;?
                  </h4>
                  <p className="text-xs text-rose-300/90">
                    Hiện có <span className="font-bold underline">{getDocCountForDept(deletingDept.name)}</span> văn bản đang gắn phòng ban này.
                  </p>
                </div>
              </div>

              {getDocCountForDept(deletingDept.name) > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chuyển các văn bản trên sang phòng ban thay thế:
                  </label>
                  <select
                    value={reassignTargetName}
                    onChange={(e) => setReassignTargetName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-rose-500 cursor-pointer"
                  >
                    {departments.filter(d => d.id !== deletingDept.id).map(d => (
                      <option key={d.id} value={d.name}>
                        {d.code ? `[${d.code}] ` : ''}{d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingDept(null)}
                  className="px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/70 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Mọi thay đổi về phòng ban được tự động lưu trữ và đồng bộ với Chi tiết dự án</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
