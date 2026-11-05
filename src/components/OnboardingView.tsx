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
  UserCheck,
  Sparkles,
  Layers,
  FileText,
} from 'lucide-react';

interface OnboardingViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface PhaseMeta {
  key: OnboardingPhase;
  stepLabel: string;
  title: string;
  shortTitle: string;
  goal: string;
}

const PHASE_META_LIST: PhaseMeta[] = [
  {
    key: 'day1',
    stepLabel: 'STEP 1 · Day 1',
    title: 'Day 1 · 출근 첫날 (인프라·권한·팀 적응)',
    shortTitle: 'Day 1 · 출근 첫날',
    goal: '사내 네트워크·그룹웨어·ERP/나스 및 4대 협업 허브 접근 권한을 확보합니다.',
  },
  {
    key: 'week1',
    stepLabel: 'STEP 2 · 1주차',
    title: '1주차 · 도메인·시스템 구조 파악 & 산출물 역추적',
    shortTitle: '1주차 · 도메인/산출물',
    goal: '자사몰 Front·백오피스 Admin 구조와 최근 대표 과제의 기획서·시안을 역추적합니다.',
  },
  {
    key: 'week2',
    stepLabel: 'STEP 3 · 2주차',
    title: '2주차 · 유관부서 협업 방식 숙지 & 첫 Pilot 과제 착수',
    shortTitle: '2주차 · 협업/Pilot 과제',
    goal: '기획 워크스페이스 작성 규격을 익히고 첫 소규모 개선 과제의 화면설계서를 작성합니다.',
  },
  {
    key: 'week3_4',
    stepLabel: 'STEP 4 · 3~4주차',
    title: '3~4주차 · QA 검증·배포 사이클 완주 & 주력 도메인 배정',
    shortTitle: '3~4주차 · 배포/오너십',
    goal: 'QA 검수부터 운영 배포까지 전 주기를 완주하고 2027 주요 과제 도메인 오너십을 확정합니다.',
  },
];

const DEFAULT_CATEGORIES = [
  '인프라·권한',
  '협업 허브',
  '도메인·시스템',
  '산출물·프로세스',
  '실무·오너십',
];

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case '인프라·권한':
      return 'onb-cat-badge onb-cat-infra';
    case '협업 허브':
      return 'onb-cat-badge onb-cat-hub';
    case '도메인·시스템':
      return 'onb-cat-badge onb-cat-domain';
    case '산출물·프로세스':
      return 'onb-cat-badge onb-cat-process';
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
    ownerRole: string;
    linkLabel: string;
    linkUrl: string;
    note: string;
  }>({
    phase: 'day1',
    category: '인프라·권한',
    title: '',
    description: '',
    ownerRole: '본인 · 멘토(최범열)',
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
      const phaseTotal = phaseItems.length;
      const state: 'done' | 'in_progress' | 'backlog' =
        phaseTotal > 0 && phaseCompleted === phaseTotal
          ? 'done'
          : phaseCompleted > 0
          ? 'in_progress'
          : 'backlog';
      return {
        ...meta,
        total: phaseTotal,
        completed: phaseCompleted,
        state,
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
          ? `'${updated.title}' 항목을 완료 처리했습니다.`
          : `'${updated.title}' 완료 체크를 해제했습니다.`,
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
      onShowToast('현재 완료 체크된 항목이 없습니다.', 'info');
      return;
    }
    if (
      window.confirm(
        '모든 온보딩 체크리스트의 완료 상태를 미완료로 초기화하시겠습니까?\n(등록된 항목과 메모는 그대로 유지됩니다.)'
      )
    ) {
      try {
        PlanningStorageService.resetOnboardingChecks();
        refreshItems();
        onShowToast('온보딩 체크리스트 완료 상태가 초기화되었습니다.', 'info');
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
        ? '도메인·시스템'
        : targetPhase === 'week2'
        ? '산출물·프로세스'
        : '실무·오너십';

    setEditingItem(null);
    setFormData({
      phase: targetPhase,
      category: defaultCat,
      title: '',
      description: '',
      ownerRole: '본인 · 멘토(최범열)',
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
      category: item.category || '도메인·시스템',
      title: item.title,
      description: item.description,
      ownerRole: item.ownerRole || '본인 · 멘토(최범열)',
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
      onShowToast('체크리스트 항목 제목을 입력해주세요.', 'error');
      return;
    }
    if (!formData.description.trim()) {
      onShowToast('실행 가이드 설명을 입력해주세요.', 'error');
      return;
    }

    try {
      if (editingItem) {
        PlanningStorageService.updateOnboardingItem(editingItem.id, {
          phase: formData.phase,
          category: formData.category.trim() || '도메인·시스템',
          title: formData.title.trim(),
          description: formData.description.trim(),
          ownerRole: formData.ownerRole.trim() || '본인 · 멘토(최범열)',
          linkLabel: formData.linkLabel.trim() || undefined,
          linkUrl: formData.linkUrl.trim() || undefined,
          note: formData.note.trim(),
        });
        onShowToast('온보딩 체크리스트 항목이 수정되었습니다.', 'success');
      } else {
        PlanningStorageService.createOnboardingItem({
          phase: formData.phase,
          category: formData.category.trim() || '도메인·시스템',
          title: formData.title.trim(),
          description: formData.description.trim(),
          ownerRole: formData.ownerRole.trim() || '본인 · 멘토(최범열)',
          linkLabel: formData.linkLabel.trim() || undefined,
          linkUrl: formData.linkUrl.trim() || undefined,
          note: formData.note.trim(),
        });
        onShowToast('새 온보딩 체크리스트 항목이 추가되었습니다.', 'success');
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
    if (window.confirm(`정말 '${title}' 체크리스트 항목을 삭제하시겠습니까?`)) {
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

  // 바로가기 링크 이동 처리 (내부 해시 vs 외부 URL)
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
      {/* 1. 상단 온보딩 로드맵 요약 및 단계별 진행 현황 카드 */}
      <section className="card onb-hero-card">
        <div className="onb-hero-top">
          <div className="onb-hero-title-group">
            <div className="onb-hero-eyebrow">
              <Sparkles size={15} />
              <span>SERVICE PLANNING TEAM ONBOARDING ROADMAP</span>
            </div>
            <h2 className="onb-hero-title">
              서비스기획팀 신규 입사자 4주 온보딩 체크리스트
            </h2>
            <p className="onb-hero-desc">
              출근 첫날 인프라 세팅부터 자사몰(Front)·백오피스(Admin) 도메인 파악, 첫 Pilot 과제 수행 및 배포 완주까지 단계별 체크리스트를 점검합니다.
            </p>
          </div>

          <div className="onb-hero-actions">
            <div className="onb-overall-stat-box">
              <div className="onb-overall-stat-header">
                <span className="onb-overall-stat-label">전체 온보딩 진행 현황</span>
                <strong className="onb-overall-stat-count">
                  {summaryStats.completed} / {summaryStats.total} 완료
                </strong>
              </div>
              <progress
                className="onb-progress-bar"
                value={summaryStats.completed}
                max={summaryStats.total || 1}
              />
              <div className="onb-overall-stat-sub">
                <span>완료 {summaryStats.completed}건</span>
                <span>잔여 {summaryStats.pending}건</span>
              </div>
            </div>

            {!isViewer && (
              <div className="onb-hero-btn-group">
                <button
                  type="button"
                  onClick={handleResetAllChecks}
                  className="btn btn-secondary onb-reset-btn"
                  title="전체 체크 상태 초기화"
                >
                  <RotateCcw size={15} /> 체크 초기화
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal()}
                  className="btn btn-primary onb-add-main-btn"
                >
                  <Plus size={16} /> 체크리스트 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4단계 로드맵 요약 카드 그리드 */}
        <div className="onb-phase-grid">
          {summaryStats.byPhase.map((phase) => {
            const isSelected = selectedPhase === phase.key;
            return (
              <button
                key={phase.key}
                type="button"
                onClick={() =>
                  setSelectedPhase((prev) => (prev === phase.key ? 'all' : phase.key))
                }
                className={`onb-phase-card ${isSelected ? 'active' : ''} ${
                  phase.state === 'done' ? 'is-done' : ''
                }`}
              >
                <div className="onb-phase-card-top">
                  <span className="onb-phase-step-pill">{phase.stepLabel}</span>
                  <span
                    className={`onb-phase-status-badge status-${phase.state}`}
                  >
                    {phase.state === 'done'
                      ? '단계 완료'
                      : phase.state === 'in_progress'
                      ? '진행중'
                      : '진행 대기'}
                  </span>
                </div>
                <strong className="onb-phase-card-title">{phase.shortTitle}</strong>
                <p className="onb-phase-card-goal">{phase.goal}</p>
                <div className="onb-phase-card-footer">
                  <progress
                    className="onb-phase-mini-progress"
                    value={phase.completed}
                    max={phase.total || 1}
                  />
                  <span className="onb-phase-card-count">
                    {phase.completed} / {phase.total} 완료
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. 단계 탭 + 상태 필터 + 검색 컨트롤 바 */}
      <div className="card onb-control-card">
        <div className="onb-control-bar">
          <div className="onb-phase-tabs" role="tablist" aria-label="온보딩 단계 필터">
            <button
              type="button"
              role="tab"
              aria-selected={selectedPhase === 'all'}
              onClick={() => setSelectedPhase('all')}
              className={`onb-phase-tab ${selectedPhase === 'all' ? 'active' : ''}`}
            >
              <Layers size={15} />
              <span>전체 단계</span>
              <span className="onb-phase-tab-count">{items.length}</span>
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
                <span>{phase.shortTitle}</span>
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
                전체 ({summaryStats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`onb-status-seg-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              >
                미완료 ({summaryStats.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`onb-status-seg-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              >
                완료 ({summaryStats.completed})
              </button>
            </div>

            <div className="tasks-search-box onb-search-box">
              <Search size={16} className="tasks-search-icon" />
              <input
                type="text"
                placeholder="체크리스트 제목, 가이드, 담당, 메모 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input tasks-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 단계별 체크리스트 섹션 스택 */}
      <div className="onb-sections-stack">
        {groupedPhases.map(({ meta, rows, totalInPhase, completedInPhase }) => (
          <section key={meta.key} className="card onb-section-card">
            <div className="onb-section-header">
              <div className="onb-section-header-left">
                <span className="onb-section-step-badge">{meta.stepLabel}</span>
                <div className="onb-section-title-wrap">
                  <h3 className="onb-section-title">{meta.title}</h3>
                  <p className="onb-section-subtitle">{meta.goal}</p>
                </div>
              </div>

              <div className="onb-section-header-right">
                <span className="onb-section-progress-pill">
                  {completedInPhase} / {totalInPhase} 완료
                </span>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal(meta.key)}
                    className="btn btn-secondary onb-section-add-btn"
                  >
                    <Plus size={15} /> 항목 추가
                  </button>
                )}
              </div>
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
                    title={
                      isViewer
                        ? '유관부서(읽기 전용) 모드'
                        : item.completed
                        ? '클릭하여 완료 해제'
                        : '클릭하여 완료 체크'
                    }
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
                    <div className="onb-item-meta-row">
                      <span className={getCategoryBadgeClass(item.category)}>
                        {item.category}
                      </span>
                      <span className="onb-owner-badge">
                        <UserCheck size={14} />
                        <span>안내·지원: {item.ownerRole}</span>
                      </span>
                      {item.completed && (
                        <span className="onb-completed-stamp">
                          <Check size={14} />
                          <span>
                            완료 확인: {item.completedBy || '팀원'}
                            {item.completedAt ? ` (${formatShortDate(item.completedAt)})` : ''}
                          </span>
                        </span>
                      )}
                    </div>

                    <h4 className="onb-item-title">{item.title}</h4>
                    <p className="onb-item-desc">{item.description}</p>

                    {item.note && (
                      <div className="onb-item-note">
                        <FileText size={14} className="onb-note-icon" />
                        <span>
                          <strong>진행 메모:</strong> {item.note}
                        </span>
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
                        <span>{item.linkLabel || '바로가기'}</span>
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
                      title={isViewer ? '상세 조회' : '항목 수정 및 메모 작성'}
                    >
                      <Edit2 size={14} /> {isViewer ? '조회' : '수정·메모'}
                    </button>

                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="btn btn-secondary tasks-delete-icon-btn"
                        title="항목 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {rows.length === 0 && (
                <div className="onb-empty-row">
                  조건에 해당하는 체크리스트 항목이 없습니다.
                </div>
              )}
            </div>
          </section>
        ))}

        {groupedPhases.length === 0 && (
          <div className="card onb-empty-card">
            검색 결과 또는 선택한 필터에 해당하는 온보딩 항목이 없습니다.
          </div>
        )}
      </div>

      {/* 4. 체크리스트 항목 추가 / 수정 / 메모 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-box onb-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {isViewer
                  ? '온보딩 체크리스트 상세 조회'
                  : editingItem
                  ? '온보딩 체크리스트 수정 · 메모 기록'
                  : '새 온보딩 체크리스트 항목 추가'}
              </h3>
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
                <div className="tasks-form-grid-3">
                  <div className="form-group">
                    <label className="form-label">온보딩 단계 *</label>
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
                          {p.shortTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">항목 분류 *</label>
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

                  <div className="form-group">
                    <label className="form-label">안내·지원 담당</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      placeholder="예: 멘토(최범열), 본인"
                      value={formData.ownerRole}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerRole: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">체크리스트 제목 *</label>
                  <input
                    type="text"
                    required
                    disabled={isViewer}
                    placeholder="수행해야 할 온보딩 항목 제목을 입력하세요"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">상세 실행 가이드 및 확인 내용 *</label>
                  <textarea
                    rows={3}
                    required
                    disabled={isViewer}
                    placeholder="신규 입사자가 확인하거나 실습해야 할 구체적인 가이드를 입력하세요"
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
                      placeholder="예: 업무 관련 정보 열기, QA Front 열기"
                      value={formData.linkLabel}
                      onChange={(e) =>
                        setFormData({ ...formData, linkLabel: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">바로가기 URL 또는 내부 경로 (선택)</label>
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
                  <label className="form-label">진행 메모 · 특이사항 기록 (선택)</label>
                  <textarea
                    rows={2}
                    disabled={isViewer}
                    placeholder="계정 발급 완료 여부, 질문 사항, 배정된 Pilot 과제명 등 메모를 자유롭게 기록하세요"
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
                  닫기
                </button>
                {!isViewer && (
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? '변경사항 저장' : '항목 등록'}
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
