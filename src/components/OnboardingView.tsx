import React, { useState, useMemo } from 'react';
import type { OnboardingChecklistItem, OnboardingPhase, User } from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  CheckSquare,
  Square,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  X,
  Check,
  FileText,
} from 'lucide-react';

interface OnboardingViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface PhaseMeta {
  key: OnboardingPhase;
  title: string;
  tabLabel: string;
}

const PHASE_META_LIST: PhaseMeta[] = [
  {
    key: 'day1',
    title: '1일차 · 출근 첫날 (계정·환경 설정)',
    tabLabel: '1일차 (출근 첫날)',
  },
  {
    key: 'week1',
    title: '1주차 · 서비스·시스템 파악',
    tabLabel: '1주차 (서비스·시스템)',
  },
  {
    key: 'week2',
    title: '2주차 · 협업 및 첫 과제 실습',
    tabLabel: '2주차 (협업·실습)',
  },
  {
    key: 'week3_4',
    title: '3~4주차 · 검수·배포 및 담당 배정',
    tabLabel: '3~4주차 (검수·배포)',
  },
];

const DEFAULT_CATEGORIES = [
  '인프라·권한',
  '협업 도구',
  '서비스·시스템',
  '업무 절차',
  '실무 과제',
];

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case '인프라·권한':
      return 'onb-cat-badge onb-cat-infra';
    case '협업 도구':
    case '협업 허브':
      return 'onb-cat-badge onb-cat-hub';
    case '서비스·시스템':
    case '도메인·시스템':
      return 'onb-cat-badge onb-cat-domain';
    case '업무 절차':
    case '산출물·프로세스':
      return 'onb-cat-badge onb-cat-process';
    case '실무 과제':
    case '실무·오너십':
      return 'onb-cat-badge onb-cat-ownership';
    default:
      return 'onb-cat-badge onb-cat-default';
  }
}

function formatShortDate(isoStr?: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}.${day}`;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  isViewer,
  onShowToast,
}) => {
  const [items, setItems] = useState<OnboardingChecklistItem[]>(() =>
    PlanningStorageService.getOnboardingItems()
  );
  const [selectedPhase, setSelectedPhase] = useState<OnboardingPhase | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 등록/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OnboardingChecklistItem | null>(null);
  const [formData, setFormData] = useState<{
    phase: OnboardingPhase;
    category: string;
    title: string;
    description: string;
    linkLabel: string;
    linkUrl: string;
    note: string;
  }>({
    phase: 'day1',
    category: '인프라·권한',
    title: '',
    description: '',
    linkLabel: '',
    linkUrl: '',
    note: '',
  });

  const refreshItems = () => {
    setItems(PlanningStorageService.getOnboardingItems());
  };

  // 전체 및 단계별 집계
  const summaryStats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.completed).length;
    const pending = total - completed;

    const byPhase = PHASE_META_LIST.map((meta) => {
      const phaseItems = items.filter((i) => i.phase === meta.key);
      const phaseCompleted = phaseItems.filter((i) => i.completed).length;
      return {
        ...meta,
        total: phaseItems.length,
        completed: phaseCompleted,
      };
    });

    return { total, completed, pending, byPhase };
  }, [items]);

  // 필터링된 항목
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedPhase !== 'all' && item.phase !== selectedPhase) return false;
      if (statusFilter === 'pending' && item.completed) return false;
      if (statusFilter === 'completed' && !item.completed) return false;
      if (q) {
        const match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.ownerRole.toLowerCase().includes(q) ||
          (item.note || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [items, selectedPhase, statusFilter, searchQuery]);

  // 단계별 섹션 그룹핑
  const groupedPhases = useMemo(() => {
    const targetPhases =
      selectedPhase === 'all'
        ? PHASE_META_LIST
        : PHASE_META_LIST.filter((p) => p.key === selectedPhase);

    return targetPhases
      .map((meta) => {
        const rows = filteredItems.filter((i) => i.phase === meta.key);
        const totalInPhase = items.filter((i) => i.phase === meta.key).length;
        const completedInPhase = items.filter(
          (i) => i.phase === meta.key && i.completed
        ).length;
        return {
          meta,
          rows,
          totalInPhase,
          completedInPhase,
        };
      })
      .filter((group) => group.rows.length > 0 || (!searchQuery.trim() && statusFilter === 'all'));
  }, [filteredItems, items, selectedPhase, searchQuery, statusFilter]);

  // 체크 토글 핸들러
  const handleToggleCheck = (item: OnboardingChecklistItem) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 체크 상태를 변경할 수 없습니다.', 'error');
      return;
    }
    try {
      const updated = PlanningStorageService.toggleOnboardingItem(item.id);
      refreshItems();
      onShowToast(
        updated.completed
          ? `'${updated.title}' 완료 체크되었습니다.`
          : `'${updated.title}' 체크 해제되었습니다.`,
        updated.completed ? 'success' : 'info'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '상태 변경 중 오류가 발생했습니다.';
      onShowToast(msg, 'error');
    }
  };

  // 전체 체크 초기화
  const handleResetAllChecks = () => {
    if (isViewer) return;
    if (summaryStats.completed === 0) {
      onShowToast('완료 체크된 항목이 없습니다.', 'info');
      return;
    }
    if (window.confirm('모든 체크리스트의 완료 체크를 초기화하시겠습니까?')) {
      try {
        PlanningStorageService.resetOnboardingChecks();
        refreshItems();
        onShowToast('완료 체크 상태가 초기화되었습니다.', 'info');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '초기화 중 오류가 발생했습니다.';
        onShowToast(msg, 'error');
      }
    }
  };

  // 신규 항목 추가 모달 열기
  const handleOpenCreateModal = (presetPhase?: OnboardingPhase) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 항목을 추가할 수 없습니다.', 'error');
      return;
    }
    const targetPhase: OnboardingPhase =
      presetPhase || (selectedPhase !== 'all' ? selectedPhase : 'day1');
    const defaultCat =
      targetPhase === 'day1'
        ? '인프라·권한'
        : targetPhase === 'week1'
        ? '서비스·시스템'
        : targetPhase === 'week2'
        ? '업무 절차'
        : '실무 과제';

    setEditingItem(null);
    setFormData({
      phase: targetPhase,
      category: defaultCat,
      title: '',
      description: '',
      linkLabel: '',
      linkUrl: '',
      note: '',
    });
    setIsModalOpen(true);
  };

  // 수정 모달 열기
  const handleOpenEditModal = (item: OnboardingChecklistItem) => {
    setEditingItem(item);
    setFormData({
      phase: item.phase,
      category: item.category || '서비스·시스템',
      title: item.title,
      description: item.description,
      linkLabel: item.linkLabel || '',
      linkUrl: item.linkUrl || '',
      note: item.note || '',
    });
    setIsModalOpen(true);
  };

  // 저장 처리
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 저장할 수 없습니다.', 'error');
      return;
    }
    if (!formData.title.trim()) {
      onShowToast('항목명을 입력해주세요.', 'error');
      return;
    }

    try {
      if (editingItem) {
        PlanningStorageService.updateOnboardingItem(editingItem.id, {
          phase: formData.phase,
          category: formData.category.trim() || '서비스·시스템',
          title: formData.title.trim(),
          description: formData.description.trim(),
          ownerRole: '',
          linkLabel: formData.linkLabel.trim() || undefined,
          linkUrl: formData.linkUrl.trim() || undefined,
          note: formData.note.trim(),
        });
        onShowToast('항목이 수정되었습니다.', 'success');
      } else {
        PlanningStorageService.createOnboardingItem({
          phase: formData.phase,
          category: formData.category.trim() || '서비스·시스템',
          title: formData.title.trim(),
          description: formData.description.trim(),
          ownerRole: '',
          linkLabel: formData.linkLabel.trim() || undefined,
          linkUrl: formData.linkUrl.trim() || undefined,
          note: formData.note.trim(),
        });
        onShowToast('새 항목이 추가되었습니다.', 'success');
      }
      setIsModalOpen(false);
      refreshItems();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      onShowToast(msg, 'error');
    }
  };

  // 삭제 처리
  const handleDeleteItem = (id: string, title: string) => {
    if (isViewer) return;
    if (window.confirm(`'${title}' 항목을 삭제하시겠습니까?`)) {
      try {
        PlanningStorageService.deleteOnboardingItem(id);
        onShowToast(`'${title}' 항목이 삭제되었습니다.`, 'info');
        setIsModalOpen(false);
        refreshItems();
      } catch (err) {
        const msg = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
        onShowToast(msg, 'error');
      }
    }
  };

  // 바로가기 링크 이동 처리
  const handleShortcutClick = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('#/')) {
      window.location.hash = trimmed;
    } else {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="onb-container">
      {/* 1. 상단 단계 탭 · 필터 · 검색 · 액션 단일 컨트롤 바 */}
      <div className="card onb-control-card">
        <div className="onb-control-bar">
          <div className="onb-phase-tabs" role="tablist" aria-label="온보딩 단계">
            <button
              type="button"
              role="tab"
              aria-selected={selectedPhase === 'all'}
              onClick={() => setSelectedPhase('all')}
              className={`onb-phase-tab ${selectedPhase === 'all' ? 'active' : ''}`}
            >
              <span>전체</span>
              <span className="onb-phase-tab-count">
                {summaryStats.completed}/{summaryStats.total}
              </span>
            </button>

            {summaryStats.byPhase.map((phase) => (
              <button
                key={phase.key}
                type="button"
                role="tab"
                aria-selected={selectedPhase === phase.key}
                onClick={() => setSelectedPhase(phase.key)}
                className={`onb-phase-tab ${selectedPhase === phase.key ? 'active' : ''}`}
              >
                <span>{phase.tabLabel}</span>
                <span className="onb-phase-tab-count">
                  {phase.completed}/{phase.total}
                </span>
              </button>
            ))}
          </div>

          <div className="onb-filter-right">
            <div className="onb-status-seg" role="group" aria-label="완료 상태 필터">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`onb-status-seg-btn ${statusFilter === 'all' ? 'active' : ''}`}
              >
                전체 {summaryStats.total}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`onb-status-seg-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              >
                미완료 {summaryStats.pending}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`onb-status-seg-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              >
                완료 {summaryStats.completed}
              </button>
            </div>

            <div className="tasks-search-box onb-search-box">
              <Search size={16} className="tasks-search-icon" />
              <input
                type="text"
                placeholder="항목, 내용 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input tasks-search-input"
              />
            </div>

            {!isViewer && (
              <div className="onb-top-btn-group">
                <button
                  type="button"
                  onClick={handleResetAllChecks}
                  className="btn btn-secondary"
                  title="완료 체크 초기화"
                >
                  <RotateCcw size={15} /> 초기화
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal()}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> 항목 추가
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 단계별 체크리스트 목록 */}
      <div className="onb-sections-stack">
        {groupedPhases.map(({ meta, rows, totalInPhase, completedInPhase }) => (
          <section key={meta.key} className="card onb-section-card">
            <div className="onb-section-header">
              <div className="onb-section-header-left">
                <h2 className="onb-section-title">{meta.title}</h2>
                <span className="onb-section-progress-pill">
                  {completedInPhase} / {totalInPhase} 완료
                </span>
              </div>

              {!isViewer && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(meta.key)}
                  className="btn btn-secondary onb-section-add-btn"
                >
                  <Plus size={15} /> 추가
                </button>
              )}
            </div>

            <div className="onb-checklist-list">
              {rows.map((item) => (
                <article
                  key={item.id}
                  className={`onb-item-row ${item.completed ? 'is-completed' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(item)}
                    disabled={isViewer}
                    className={`onb-checkbox-btn ${item.completed ? 'checked' : ''}`}
                    title={item.completed ? '완료 해제' : '완료 체크'}
                    aria-label={`${item.title} 완료 체크`}
                  >
                    {item.completed ? (
                      <CheckSquare size={22} className="onb-icon-checked" />
                    ) : (
                      <Square size={22} className="onb-icon-unchecked" />
                    )}
                  </button>

                  <div
                    className="onb-item-content"
                    onClick={() => handleOpenEditModal(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenEditModal(item);
                      }
                    }}
                  >
                    <div className="onb-item-title-line">
                      <span className={getCategoryBadgeClass(item.category)}>
                        {item.category}
                      </span>
                      <h3 className="onb-item-title">{item.title}</h3>
                      {item.completed && (
                        <span className="onb-completed-stamp">
                          <Check size={14} />
                          <span>
                            {item.completedBy || '완료'}
                            {item.completedAt ? ` (${formatShortDate(item.completedAt)})` : ''}
                          </span>
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="onb-item-desc">{item.description}</p>
                    )}

                    {item.note && (
                      <div className="onb-item-note">
                        <FileText size={14} className="onb-note-icon" />
                        <span>{item.note}</span>
                      </div>
                    )}
                  </div>

                  <div className="onb-item-actions">
                    {item.linkUrl && (
                      <button
                        type="button"
                        onClick={() => handleShortcutClick(item.linkUrl!)}
                        className="btn btn-secondary onb-shortcut-btn"
                        title={item.linkUrl}
                      >
                        <span>{item.linkLabel || '열기'}</span>
                        {item.linkUrl.startsWith('#/') ? (
                          <ArrowRight size={14} />
                        ) : (
                          <ExternalLink size={14} />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="btn btn-secondary tasks-action-btn"
                      title={isViewer ? '상세 조회' : '수정 및 메모'}
                    >
                      <Edit2 size={14} /> {isViewer ? '조회' : '수정'}
                    </button>

                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="btn btn-secondary tasks-delete-icon-btn"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {rows.length === 0 && (
                <div className="onb-empty-row">등록된 항목이 없습니다.</div>
              )}
            </div>
          </section>
        ))}

        {groupedPhases.length === 0 && (
          <div className="card onb-empty-card">
            조건에 해당하는 체크리스트 항목이 없습니다.
          </div>
        )}
      </div>

      {/* 3. 항목 추가 / 수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-box onb-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {isViewer
                  ? '체크리스트 조회'
                  : editingItem
                  ? '체크리스트 수정'
                  : '체크리스트 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="tasks-modal-close-btn"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="tasks-modal-form">
              <div className="modal-body">
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">단계 *</label>
                    <select
                      value={formData.phase}
                      disabled={isViewer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phase: e.target.value as OnboardingPhase,
                        })
                      }
                      className="form-select"
                    >
                      {PHASE_META_LIST.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.tabLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">구분 *</label>
                    <select
                      value={formData.category}
                      disabled={isViewer}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="form-select"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">항목명 *</label>
                  <input
                    type="text"
                    required
                    disabled={isViewer}
                    placeholder="체크리스트 제목 입력"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">세부 내용</label>
                  <textarea
                    rows={2}
                    disabled={isViewer}
                    placeholder="확인할 핵심 내용 입력"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="form-textarea"
                  />
                </div>

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">바로가기 버튼명 (선택)</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      placeholder="예: 그룹웨어, 업무 관리"
                      value={formData.linkLabel}
                      onChange={(e) =>
                        setFormData({ ...formData, linkLabel: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">바로가기 주소 (선택)</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      placeholder="예: #/work-info 또는 https://gw.sisun.com/"
                      value={formData.linkUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, linkUrl: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">메모 (선택)</label>
                  <textarea
                    rows={2}
                    disabled={isViewer}
                    placeholder="진행 특이사항이나 메모 입력"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className="form-textarea"
                  />
                </div>
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
                  취소
                </button>
                {!isViewer && (
                  <button type="submit" className="btn btn-primary">
                    저장
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
