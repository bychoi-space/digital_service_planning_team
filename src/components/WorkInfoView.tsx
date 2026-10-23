import React, { useState, useMemo } from 'react';
import type { WorkInfoItem, User } from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  X,
  BookOpen,
  FolderOpen,
} from 'lucide-react';

interface WorkInfoViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const DEFAULT_CATEGORIES = ['기본 사항', '참고 정보'];

// 텍스트 내 URL(http://, https://)을 자동 감지하여 클릭 가능한 링크로 변환 렌더링하는 헬퍼
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return '-';
  const lines = text.split('\n');
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return lines.map((line, lineIdx) => {
    const parts = line.split(urlRegex);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (/^https?:\/\/[^\s]+$/.test(part)) {
            return (
              <a
                key={partIdx}
                href={part}
                target="_blank"
                rel="noreferrer"
                className="winfo-inline-link"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{part}</span>
                <ExternalLink size={14} className="winfo-inline-link-icon" />
              </a>
            );
          }
          return <React.Fragment key={partIdx}>{part}</React.Fragment>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const WorkInfoView: React.FC<WorkInfoViewProps> = ({
  isViewer,
  onShowToast,
}) => {
  const [items, setItems] = useState<WorkInfoItem[]>(() =>
    PlanningStorageService.getWorkInfos()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkInfoItem | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [formData, setFormData] = useState({
    category: '기본 사항',
    customCategory: '',
    title: '',
    content: '',
    note: '',
  });

  const refreshItems = () => {
    setItems(PlanningStorageService.getWorkInfos());
  };

  // 현재 존재하는 모든 섹션(카테고리) 목록 추출 (기본 사항, 참고 정보 우선 정렬)
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    items.forEach((item) => {
      if (item.category?.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [items]);

  // 검색 및 섹션 필터링
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [items, searchQuery, selectedCategory]);

  // 섹션별 그룹핑
  const groupedSections = useMemo(() => {
    const activeCategories =
      selectedCategory === 'all'
        ? categories
        : categories.filter((c) => c === selectedCategory);

    return activeCategories
      .map((cat) => ({
        category: cat,
        rows: filteredItems.filter((item) => item.category === cat),
      }))
      .filter((group) => group.rows.length > 0 || !searchQuery.trim());
  }, [categories, filteredItems, selectedCategory, searchQuery]);

  // 클립보드 복사
  const handleCopyContent = (id: string, title: string, content: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      onShowToast(`'${title}' 내용이 클립보드에 복사되었습니다.`, 'info');
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    });
  };

  // 신규 등록 모달 열기
  const handleOpenCreateModal = (presetCategory?: string) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 항목을 추가할 수 없습니다.', 'error');
      return;
    }
    const defaultCat =
      presetCategory ||
      (selectedCategory !== 'all' ? selectedCategory : categories[0] || '기본 사항');

    setEditingItem(null);
    setIsCustomCategory(false);
    setFormData({
      category: defaultCat,
      customCategory: '',
      title: '',
      content: '',
      note: '',
    });
    setIsModalOpen(true);
  };

  // 수정 모달 열기
  const handleOpenEditModal = (item: WorkInfoItem) => {
    setEditingItem(item);
    setIsCustomCategory(false);
    setFormData({
      category: item.category || '기본 사항',
      customCategory: '',
      title: item.title,
      content: item.content,
      note: item.note || '',
    });
    setIsModalOpen(true);
  };

  // 항목 저장 (등록 / 수정)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 변경할 수 없습니다.', 'error');
      return;
    }

    const finalCategory = isCustomCategory
      ? formData.customCategory.trim()
      : formData.category.trim();

    if (!finalCategory) {
      onShowToast('구분(섹션명)을 선택하거나 입력해주세요.', 'error');
      return;
    }
    if (!formData.title.trim()) {
      onShowToast('항목명을 입력해주세요.', 'error');
      return;
    }
    if (!formData.content.trim()) {
      onShowToast('내용을 입력해주세요.', 'error');
      return;
    }

    try {
      if (editingItem) {
        PlanningStorageService.updateWorkInfo(editingItem.id, {
          category: finalCategory,
          title: formData.title.trim(),
          content: formData.content,
          note: formData.note.trim(),
        });
        onShowToast('업무 관련 정보가 수정되었습니다.', 'success');
      } else {
        PlanningStorageService.createWorkInfo({
          category: finalCategory,
          title: formData.title.trim(),
          content: formData.content,
          note: formData.note.trim(),
        });
        onShowToast('새 업무 관련 정보가 등록되었습니다.', 'success');
      }
      setIsModalOpen(false);
      refreshItems();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      onShowToast(msg, 'error');
    }
  };

  // 항목 삭제
  const handleDeleteItem = (id: string, title: string) => {
    if (isViewer) return;
    if (window.confirm(`정말 '${title}' 항목을 삭제하시겠습니까?`)) {
      try {
        PlanningStorageService.deleteWorkInfo(id);
        onShowToast(`'${title}' 항목이 삭제되었습니다.`, 'info');
        setIsModalOpen(false);
        refreshItems();
      } catch (err) {
        const msg = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
        onShowToast(msg, 'error');
      }
    }
  };

  return (
    <div className="winfo-container">
      {/* 1. 상단 컨트롤 카드 (카테고리 필터 탭 + 검색 + 항목 추가 버튼) */}
      <div className="card winfo-control-card">
        <div className="winfo-top-bar">
          <div className="winfo-category-tabs" role="tablist" aria-label="정보 구분 필터">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
              className={`winfo-category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            >
              <BookOpen size={15} />
              <span>전체 보기</span>
              <span className="winfo-category-count">{items.length}</span>
            </button>

            {categories.map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className={`winfo-category-tab ${isSelected ? 'active' : ''}`}
                >
                  <FolderOpen size={15} />
                  <span>{cat}</span>
                  <span className="winfo-category-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="winfo-search-and-action">
            <div className="tasks-search-box winfo-search-box">
              <Search size={16} className="tasks-search-icon" />
              <input
                type="text"
                placeholder="항목명, 내용, 담당자, 비고 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input tasks-search-input"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              disabled={isViewer}
              className="btn btn-primary winfo-add-main-btn"
              title={
                isViewer
                  ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다'
                  : '새 업무 관련 정보 항목 추가'
              }
            >
              <Plus size={16} /> 항목 추가
            </button>
          </div>
        </div>
      </div>

      {/* 2. 섹션별 업무 관련 정보 테이블 & 모바일 카드 리스트 */}
      <div className="winfo-sections-stack">
        {groupedSections.map((section) => (
          <section key={section.category} className="card winfo-section-card">
            {/* 섹션 헤더 (예: 기본 사항 / 참고 정보) */}
            <div className="winfo-section-header">
              <div className="winfo-section-title-group">
                <h2 className="winfo-section-title">{section.category}</h2>
                <span className="winfo-section-badge">{section.rows.length}개 항목</span>
              </div>

              {!isViewer && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(section.category)}
                  className="btn btn-secondary winfo-section-add-btn"
                >
                  <Plus size={15} /> {section.category} 항목 추가
                </button>
              )}
            </div>

            {/* 데스크톱 & 태블릿용 노션 스타일 3열(+관리) 테이블 */}
            <div className="winfo-table-scroll">
              <table className="winfo-table">
                <thead>
                  <tr>
                    <th className="winfo-col-title">항목</th>
                    <th className="winfo-col-content">내용</th>
                    <th className="winfo-col-note">비고</th>
                    <th className="winfo-col-actions">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="winfo-td-title">{row.title}</td>
                      <td className="winfo-td-content">
                        <div className="winfo-content-wrap">
                          <div className="winfo-content-text">
                            {renderFormattedText(row.content)}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyContent(row.id, row.title, row.content)
                            }
                            className="winfo-copy-btn"
                            title="내용 복사"
                            aria-label={`${row.title} 내용 복사`}
                          >
                            {copiedId === row.id ? (
                              <Check size={14} className="icon-emerald" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="winfo-td-note">
                        {row.note ? renderFormattedText(row.note) : ''}
                      </td>
                      <td className="winfo-td-actions">
                        <div className="tasks-row-actions">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(row)}
                            className="btn btn-secondary tasks-action-btn"
                            title={isViewer ? '상세 조회' : '항목 수정'}
                          >
                            <Edit2 size={14} /> {isViewer ? '조회' : '수정'}
                          </button>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(row.id, row.title)}
                              className="btn btn-secondary tasks-delete-icon-btn"
                              title="항목 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {section.rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="winfo-empty-cell">
                        등록된 항목이 없습니다. 우측 상단 버튼으로 새 항목을 추가해보세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 모바일 전용 카드 리스트 (767px 이하 노출) */}
            <div className="winfo-mobile-list">
              {section.rows.map((row) => (
                <div key={row.id} className="winfo-mobile-card">
                  <div className="winfo-mobile-card-header">
                    <h3 className="winfo-mobile-card-title">{row.title}</h3>
                    <button
                      type="button"
                      onClick={() => handleCopyContent(row.id, row.title, row.content)}
                      className="btn btn-secondary winfo-mobile-copy-btn"
                    >
                      {copiedId === row.id ? (
                        <>
                          <Check size={14} className="icon-emerald" /> 복사됨
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 복사
                        </>
                      )}
                    </button>
                  </div>

                  <div className="winfo-mobile-card-body">
                    {renderFormattedText(row.content)}
                  </div>

                  {row.note && (
                    <div className="winfo-mobile-card-note">
                      <span className="winfo-mobile-note-label">비고:</span>{' '}
                      {renderFormattedText(row.note)}
                    </div>
                  )}

                  <div className="winfo-mobile-card-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(row)}
                      className="btn btn-secondary tasks-action-btn"
                    >
                      <Edit2 size={14} /> {isViewer ? '상세 조회' : '수정'}
                    </button>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(row.id, row.title)}
                        className="btn btn-secondary tasks-delete-icon-btn"
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {section.rows.length === 0 && (
                <div className="tasks-empty-col">등록된 항목이 없습니다.</div>
              )}
            </div>
          </section>
        ))}

        {groupedSections.length === 0 && (
          <div className="card winfo-no-results">
            검색 조건에 일치하는 업무 관련 정보가 없습니다.
          </div>
        )}
      </div>

      {/* 3. 항목 추가 / 수정 / 상세 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="tasks-modal-header-left">
                <h3 className="modal-title">
                  {editingItem
                    ? isViewer
                      ? '업무 관련 정보 상세 조회'
                      : '업무 관련 정보 수정'
                    : '새 업무 관련 정보 추가'}
                </h3>
                {isViewer && <span className="tasks-viewer-chip">조회 전용</span>}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="tasks-modal-form">
              <div className="modal-body">
                {/* 1. 구분 (섹션 선택 또는 새 섹션 입력) */}
                <div className="form-group">
                  <div className="winfo-modal-label-row">
                    <label className="form-label">구분 (섹션) *</label>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory((prev) => !prev)}
                        className="winfo-toggle-custom-cat-btn"
                      >
                        {isCustomCategory
                          ? '기존 섹션 목록에서 선택'
                          : '+ 새 섹션(구분) 직접 입력'}
                      </button>
                    )}
                  </div>

                  {isCustomCategory ? (
                    <input
                      type="text"
                      disabled={isViewer}
                      required
                      placeholder="새 섹션 이름 입력 (예: 개발 서버 정보, 제휴사 계정 등)"
                      value={formData.customCategory}
                      onChange={(e) =>
                        setFormData({ ...formData, customCategory: e.target.value })
                      }
                      className="form-input"
                    />
                  ) : (
                    <select
                      disabled={isViewer}
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="form-select"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. 항목명 */}
                <div className="form-group">
                  <label className="form-label">항목 *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    placeholder="예: 시선 그룹웨어 (메신저, 메일, 일정), 와이파이, QA 서버 Front"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* 3. 내용 (멀티라인 & URL 자동 링크 지원) */}
                <div className="form-group">
                  <label className="form-label">내용 *</label>
                  <textarea
                    disabled={isViewer}
                    required
                    rows={6}
                    placeholder="URL(https://...), 계정 정보(ID/PW), 담당자 안내 등을 자유롭게 입력하세요. 줄바꿈과 링크가 자동 적용됩니다."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="form-textarea"
                  />
                </div>

                {/* 4. 비고 */}
                <div className="form-group">
                  <label className="form-label">비고</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    placeholder="참고 사항이나 부가 메모 (선택)"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* 감사 추적 정보 표시 */}
                {editingItem && (
                  <div className="tasks-audit-bar">
                    <span>
                      최초 등록: <strong>{editingItem.createdBy}</strong> (
                      {new Date(editingItem.createdAt).toLocaleString('ko-KR')})
                    </span>
                    <span>
                      최종 수정: <strong>{editingItem.updatedBy}</strong> (
                      {new Date(editingItem.updatedAt).toLocaleString('ko-KR')})
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {editingItem && !isViewer && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(editingItem.id, editingItem.title)}
                    className="btn btn-danger tasks-modal-delete-btn"
                  >
                    <Trash2 size={15} /> 삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {isViewer ? '닫기' : '취소'}
                </button>
                {!isViewer && (
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? '수정 내용 저장' : '항목 등록'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
