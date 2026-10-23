import React, { useState } from 'react';
import type { TaskItem, TaskCategory, TaskTrack, TaskPriority, TaskStatus, User } from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  Plus,
  Search,
  Kanban,
  List as ListIcon,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  UserCheck,
  X,
  Link as LinkIcon,
  FileText,
  Palette,
  Code,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface TasksViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// 업무 파트 (트랙) 설정
const TRACK_CONFIG: Record<
  TaskTrack,
  {
    label: string;
    enLabel: string;
    classKey: string;
    color: string;
    bg: string;
    border: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  기획: {
    label: '기획',
    enLabel: 'Planning',
    classKey: 'track-planning',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: FileText,
  },
  디자인: {
    label: '디자인',
    enLabel: 'Design',
    classKey: 'track-design',
    color: '#9333ea',
    bg: '#faf5ff',
    border: '#e9d5ff',
    icon: Palette,
  },
  퍼블리싱: {
    label: '퍼블리싱',
    enLabel: 'Publishing',
    classKey: 'track-publishing',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: Code,
  },
};

const TRACK_LIST: TaskTrack[] = ['기획', '디자인', '퍼블리싱'];

const CATEGORIES: TaskCategory[] = ['신규기획', '기능개선', '서비스운영', '데이터분석', '협업지원', '정책수립'];

const PRIORITIES: { key: TaskPriority; label: string; classKey: string }[] = [
  { key: 'urgent', label: '긴급', classKey: 'priority-urgent' },
  { key: 'high', label: '높음', classKey: 'priority-high' },
  { key: 'medium', label: '보통', classKey: 'priority-medium' },
  { key: 'low', label: '낮음', classKey: 'priority-low' },
];

const STATUSES: { key: TaskStatus; label: string; shortLabel: string; classKey: string }[] = [
  { key: 'backlog', label: '대기 (Backlog)', shortLabel: '대기', classKey: 'status-backlog' },
  { key: 'in_progress', label: '진행중 (In Progress)', shortLabel: '진행중', classKey: 'status-in_progress' },
  { key: 'review', label: '검토/QA (Review)', shortLabel: '검토/QA', classKey: 'status-review' },
  { key: 'done', label: '완료 (Done)', shortLabel: '완료', classKey: 'status-done' },
  { key: 'on_hold', label: '보류 (On Hold)', shortLabel: '보류', classKey: 'status-on_hold' },
];

export const TasksView: React.FC<TasksViewProps> = ({ isViewer, onShowToast }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => PlanningStorageService.getTasks());
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all'); // 'all' | '기획' | '디자인' | '퍼블리싱'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [mobileKanbanStatus, setMobileKanbanStatus] = useState<'all' | TaskStatus>('all');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // 폼 입력 상태
  const [formData, setFormData] = useState(() => ({
    title: '',
    category: '신규기획' as TaskCategory,
    track: '기획' as TaskTrack,
    assigneeId: '',
    assigneeName: '',
    priority: 'medium' as TaskPriority,
    status: 'in_progress' as TaskStatus,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    progress: 0,
    description: '',
    linkTitle: '',
    linkUrl: '',
    links: [] as { title: string; url: string }[],
  }));

  const teamMembers = PlanningStorageService.getUsers().filter((u) => u.role !== 'viewer');

  const refreshTasks = () => {
    setTasks(PlanningStorageService.getTasks());
  };

  // 모달 열기 (등록)
  const handleOpenCreateModal = (defaultTrack?: TaskTrack) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 새 업무를 등록할 수 없습니다.', 'error');
      return;
    }
    const defaultAssignee = teamMembers[0] || { id: '1', name: '최범열' };
    setEditingTask(null);
    setFormData({
      title: '',
      category: '신규기획',
      track: defaultTrack || (selectedTrack !== 'all' ? (selectedTrack as TaskTrack) : '기획'),
      assigneeId: defaultAssignee.id,
      assigneeName: defaultAssignee.name,
      priority: 'medium',
      status: 'in_progress',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      progress: 0,
      description: '',
      linkTitle: '',
      linkUrl: '',
      links: [],
    });
    setIsModalOpen(true);
  };

  // 모달 열기 (수정 or 상세 조회)
  const handleOpenEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      category: task.category,
      track: task.track || '기획',
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      priority: task.priority,
      status: task.status,
      startDate: task.startDate,
      dueDate: task.dueDate,
      progress: task.progress,
      description: task.description,
      linkTitle: '',
      linkUrl: '',
      links: [...(task.links ?? [])],
    });
    setIsModalOpen(true);
  };

  // 링크 추가
  const handleAddLink = () => {
    if (!formData.linkTitle.trim() || !formData.linkUrl.trim()) {
      onShowToast('링크 제목과 URL을 모두 입력해 주세요.', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { title: prev.linkTitle.trim(), url: prev.linkUrl.trim() }],
      linkTitle: '',
      linkUrl: '',
    }));
  };

  // 링크 삭제
  const handleRemoveLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  // 저장 (등록/수정)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 변경 사항을 저장할 수 없습니다.', 'error');
      return;
    }

    if (!formData.title.trim()) {
      onShowToast('업무 제목을 입력해 주세요.', 'error');
      return;
    }

    try {
      if (editingTask) {
        PlanningStorageService.updateTask(editingTask.id, {
          title: formData.title.trim(),
          category: formData.category,
          track: formData.track,
          assigneeId: formData.assigneeId,
          assigneeName: formData.assigneeName,
          priority: formData.priority,
          status: formData.status,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          progress: Number(formData.progress),
          description: formData.description,
          links: formData.links,
        });
        onShowToast(`[${formData.track}] 업무 정보가 성공적으로 수정되었습니다.`, 'success');
      } else {
        PlanningStorageService.createTask({
          title: formData.title.trim(),
          category: formData.category,
          track: formData.track,
          assigneeId: formData.assigneeId,
          assigneeName: formData.assigneeName,
          priority: formData.priority,
          status: formData.status,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          progress: Number(formData.progress),
          description: formData.description,
          links: formData.links,
        });
        onShowToast(`새로운 [${formData.track}] 업무가 등록되었습니다.`, 'success');
      }
      setIsModalOpen(false);
      refreshTasks();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '작업 중 오류가 발생했습니다.';
      onShowToast(errorMsg, 'error');
    }
  };

  // 삭제
  const handleDeleteTask = (taskId: string, title: string) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 삭제할 수 없습니다.', 'error');
      return;
    }
    if (window.confirm(`정말 "${title}" 업무를 삭제하시겠습니까? (감사 로그에 영구 기록됩니다)`)) {
      PlanningStorageService.deleteTask(taskId);
      onShowToast('업무가 삭제되었습니다.', 'info');
      if (isModalOpen) setIsModalOpen(false);
      refreshTasks();
    }
  };

  // 퀵 상태 변경
  const handleQuickStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (isViewer) {
      onShowToast('읽기 전용 모드에서는 상태를 변경할 수 없습니다.', 'error');
      return;
    }
    PlanningStorageService.updateTask(taskId, {
      status: newStatus,
      progress: newStatus === 'done' ? 100 : undefined,
    });
    onShowToast('상태가 변경되었습니다.', 'success');
    refreshTasks();
  };

  // 트랙별 집계 카운트
  const trackCounts = {
    all: tasks.length,
    기획: tasks.filter((t) => t.track === '기획').length,
    디자인: tasks.filter((t) => t.track === '디자인').length,
    퍼블리싱: tasks.filter((t) => t.track === '퍼블리싱').length,
  };

  // 필터링 적용
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = selectedTrack === 'all' || t.track === selectedTrack;
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesAssignee = selectedAssignee === 'all' || t.assigneeId === selectedAssignee;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    return matchesSearch && matchesTrack && matchesCategory && matchesAssignee && matchesStatus;
  });

  const renderProgressSvg = (progress: number) => {
    const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
    const isDone = clamped === 100;
    return (
      <svg className="tasks-progress-svg" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
        <rect className="tasks-progress-track-bg" x="0" y="0" width="100" height="6" rx="3" />
        <rect
          className={`tasks-progress-fill ${isDone ? 'is-done' : ''}`}
          x="0"
          y="0"
          width={clamped}
          height="6"
          rx="3"
        />
      </svg>
    );
  };

  return (
    <div className="tasks-container">
      {/* 1. 상단 컨트롤 바 (검색, 파트 필터, 세부 필터, 뷰 전환, 등록 버튼) */}
      <div className="card tasks-control-card">
        {/* 1-A. 파트 퀵 필터 탭 (기획 / 디자인 / 퍼블리싱 한눈에 구분) */}
        <div className="tasks-track-bar">
          <div className="tasks-track-filter-group">
            <span className="tasks-track-label">
              <Layers size={15} className="tasks-track-label-icon" /> 업무 파트:
            </span>

            <div className="tasks-track-tabs">
              {/* 전체 파트 */}
              <button
                type="button"
                onClick={() => setSelectedTrack('all')}
                className={`tasks-track-tab track-all ${selectedTrack === 'all' ? 'active' : ''}`}
              >
                <span>전체 파트</span>
                <span className="tasks-track-count">{trackCounts.all}</span>
              </button>

              {/* 개별 파트: 기획, 디자인, 퍼블리싱 */}
              {TRACK_LIST.map((trackKey) => {
                const config = TRACK_CONFIG[trackKey];
                const isSelected = selectedTrack === trackKey;
                const IconComponent = config.icon;
                return (
                  <button
                    key={trackKey}
                    type="button"
                    onClick={() => setSelectedTrack(trackKey)}
                    className={`tasks-track-tab ${config.classKey} ${isSelected ? 'active' : ''}`}
                  >
                    <IconComponent size={15} className="tasks-track-tab-icon" />
                    <span>{config.label}</span>
                    <span className="tasks-track-count">{trackCounts[trackKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 파트별 빠른 등록 버튼 세트 (데스크톱/태블릿 노출) */}
          {!isViewer && (
            <div className="tasks-quick-create-group">
              <span className="tasks-quick-create-label">빠른 등록:</span>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('기획')}
                className="tasks-quick-btn track-planning"
              >
                <Plus size={14} /> 기획
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('디자인')}
                className="tasks-quick-btn track-design"
              >
                <Plus size={14} /> 디자인
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('퍼블리싱')}
                className="tasks-quick-btn track-publishing"
              >
                <Plus size={14} /> 퍼블리싱
              </button>
            </div>
          )}
        </div>

        {/* 1-B. 검색, 상세 필터 및 뷰 전환 */}
        <div className="tasks-filter-bar">
          <div className="tasks-search-and-selects">
            <div className="tasks-search-box">
              <Search size={16} className="tasks-search-icon" />
              <input
                type="text"
                placeholder="업무명, 상세 내용, 담당자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input tasks-search-input"
              />
            </div>

            <div className="tasks-selects-group">
              {/* 카테고리 필터 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select tasks-filter-select"
                aria-label="도메인 필터"
              >
                <option value="all">전체 도메인</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* 담당자 필터 */}
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="form-select tasks-filter-select"
                aria-label="담당자 필터"
              >
                <option value="all">전체 담당자</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* 상태 필터 */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select tasks-filter-select"
                aria-label="진행 상태 필터"
              >
                <option value="all">전체 상태</option>
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.shortLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tasks-actions-group">
            {/* 뷰 전환 탭 */}
            <div className="tasks-view-toggle">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`tasks-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              >
                <Kanban size={15} /> 칸반 보드
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`tasks-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <ListIcon size={15} /> 리스트 뷰
              </button>
            </div>

            {/* 메인 업무 등록 버튼 */}
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="btn btn-primary tasks-create-main-btn"
              disabled={isViewer}
              title={isViewer ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다' : '새 기획/디자인/퍼블리싱 업무 등록'}
            >
              <Plus size={16} /> 업무 등록
            </button>
          </div>
        </div>
      </div>

      {/* 2. 업무 목록 본문 (칸반 보드 vs 리스트 뷰) */}
      {viewMode === 'kanban' ? (
        <>
          {/* 모바일 전용 상태 스포트라이트 바 (767px 이하 노출) */}
          <div className="tasks-mobile-status-bar" role="tablist" aria-label="칸반 상태별 보기">
            <button
              type="button"
              role="tab"
              aria-selected={mobileKanbanStatus === 'all'}
              onClick={() => setMobileKanbanStatus('all')}
              className={`tasks-mobile-status-tab ${mobileKanbanStatus === 'all' ? 'active' : ''}`}
            >
              <span>전체</span>
              <span className="tasks-mobile-status-count">{filteredTasks.length}</span>
            </button>
            {STATUSES.map((statusObj) => {
              const count = filteredTasks.filter((t) => t.status === statusObj.key).length;
              const isSelected = mobileKanbanStatus === statusObj.key;
              return (
                <button
                  key={statusObj.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setMobileKanbanStatus(statusObj.key)}
                  className={`tasks-mobile-status-tab ${isSelected ? 'active' : ''}`}
                >
                  <span className={`tasks-status-dot ${statusObj.classKey}`} />
                  <span>{statusObj.shortLabel}</span>
                  <span className="tasks-mobile-status-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="tasks-kanban-grid">
            {STATUSES.map((statusObj) => {
              const columnTasks = filteredTasks.filter((t) => t.status === statusObj.key);
              const isMobileHidden = mobileKanbanStatus !== 'all' && mobileKanbanStatus !== statusObj.key;
              return (
                <div
                  key={statusObj.key}
                  className={`tasks-kanban-col ${isMobileHidden ? 'mobile-hidden' : ''}`}
                >
                  {/* 컬럼 헤더 */}
                  <div className="tasks-kanban-col-header">
                    <div className="tasks-kanban-col-title-wrap">
                      <span className={`tasks-status-dot ${statusObj.classKey}`} />
                      <span className="tasks-kanban-col-title">{statusObj.label}</span>
                    </div>
                    <span className="tasks-kanban-col-count">{columnTasks.length}</span>
                  </div>

                  {/* 카드 목록 */}
                  <div className="tasks-kanban-cards">
                    {columnTasks.map((task) => {
                      const priorityCfg = PRIORITIES.find((p) => p.key === task.priority) || PRIORITIES[2];
                      const trackCfg = TRACK_CONFIG[task.track || '기획'] || TRACK_CONFIG['기획'];
                      const TrackIcon = trackCfg.icon;
                      return (
                        <div
                          key={task.id}
                          className={`card tasks-kanban-card ${trackCfg.classKey}`}
                          onClick={() => handleOpenEditModal(task)}
                        >
                          <div className="tasks-card-top">
                            <div className="tasks-card-badges">
                              <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                                <TrackIcon size={13} /> {trackCfg.label}
                              </span>
                              <span className="tasks-badge-category">{task.category}</span>
                            </div>

                            <span className={`tasks-badge-priority ${priorityCfg.classKey}`}>
                              {priorityCfg.label}
                            </span>
                          </div>

                          <h4 className="tasks-card-title">{task.title}</h4>

                          {/* 진척률 바 */}
                          <div className="tasks-progress-wrap">
                            <div className="tasks-progress-header">
                              <span>진척률</span>
                              <span className={`tasks-progress-val ${task.progress === 100 ? 'is-done' : ''}`}>
                                {task.progress}%
                              </span>
                            </div>
                            {renderProgressSvg(task.progress)}
                          </div>

                          {/* 카드 하단 메타 */}
                          <div className="tasks-card-footer">
                            <span className="tasks-card-meta-item">
                              <UserCheck size={14} /> {task.assigneeName}
                            </span>
                            <span className="tasks-card-meta-item">
                              <Clock size={14} /> ~{task.dueDate.substring(5)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {columnTasks.length === 0 && (
                      <div className="tasks-empty-col">업무가 없습니다</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* 2-B. 리스트 뷰 (데스크톱/태블릿 테이블 & 모바일 전용 카드 리스트) */
        <div className="card tasks-list-card">
          {/* 데스크톱 & 태블릿 테이블 */}
          <div className="tasks-table-scroll">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>우선순위</th>
                  <th>파트</th>
                  <th>도메인</th>
                  <th>업무명</th>
                  <th>담당자</th>
                  <th>상태</th>
                  <th>진척률</th>
                  <th>일정 (시작~마감)</th>
                  <th className="th-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const priorityCfg = PRIORITIES.find((p) => p.key === task.priority) || PRIORITIES[2];
                  const statusCfg = STATUSES.find((s) => s.key === task.status) || STATUSES[0];
                  const trackCfg = TRACK_CONFIG[task.track || '기획'] || TRACK_CONFIG['기획'];
                  const TrackIcon = trackCfg.icon;
                  return (
                    <tr key={task.id}>
                      <td>
                        <span className={`tasks-badge-priority ${priorityCfg.classKey}`}>
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td>
                        <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                          <TrackIcon size={13} /> {trackCfg.label}
                        </span>
                      </td>
                      <td>
                        <span className="tasks-badge-category">{task.category}</span>
                      </td>
                      <td>
                        <div
                          onClick={() => handleOpenEditModal(task)}
                          className="tasks-table-title-cell"
                        >
                          <span>{task.title}</span>
                          {(task.links?.length ?? 0) > 0 && (
                            <LinkIcon size={14} className="tasks-link-indicator" />
                          )}
                        </div>
                        <div className="tasks-table-desc">{task.description}</div>
                      </td>
                      <td className="tasks-table-assignee">{task.assigneeName}</td>
                      <td>
                        <select
                          disabled={isViewer}
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`tasks-status-select ${statusCfg.classKey}`}
                          aria-label={`${task.title} 상태 변경`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="tasks-table-progress">
                          <div className="tasks-table-progress-bar">
                            {renderProgressSvg(task.progress)}
                          </div>
                          <span className="tasks-table-progress-text">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="tasks-table-schedule">
                        {task.startDate} ~ {task.dueDate}
                      </td>
                      <td className="td-center">
                        <div className="tasks-row-actions">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            className="btn btn-secondary tasks-action-btn"
                            title={isViewer ? '상세 조회' : '업무 수정'}
                          >
                            <Edit2 size={14} /> {isViewer ? '조회' : '수정'}
                          </button>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="btn btn-secondary tasks-delete-icon-btn"
                              title="업무 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="td-center">
                      조건에 해당하는 업무가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 모바일 전용 카드 리스트 뷰 (767px 이하 노출) */}
          <div className="tasks-mobile-list">
            {filteredTasks.map((task) => {
              const priorityCfg = PRIORITIES.find((p) => p.key === task.priority) || PRIORITIES[2];
              const statusCfg = STATUSES.find((s) => s.key === task.status) || STATUSES[0];
              const trackCfg = TRACK_CONFIG[task.track || '기획'] || TRACK_CONFIG['기획'];
              const TrackIcon = trackCfg.icon;
              return (
                <div
                  key={task.id}
                  className={`tasks-mobile-list-card ${trackCfg.classKey}`}
                >
                  <div className="tasks-mobile-list-top">
                    <div className="tasks-card-badges">
                      <span className={`tasks-badge-priority ${priorityCfg.classKey}`}>
                        {priorityCfg.label}
                      </span>
                      <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                        <TrackIcon size={13} /> {trackCfg.label}
                      </span>
                      <span className="tasks-badge-category">{task.category}</span>
                    </div>

                    <select
                      disabled={isViewer}
                      value={task.status}
                      onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus)}
                      className={`tasks-status-select ${statusCfg.classKey}`}
                      aria-label={`${task.title} 상태 변경`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.shortLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    onClick={() => handleOpenEditModal(task)}
                    className="tasks-mobile-list-title"
                  >
                    <span>{task.title}</span>
                    {(task.links?.length ?? 0) > 0 && (
                      <LinkIcon size={14} className="tasks-link-indicator" />
                    )}
                  </div>

                  {task.description && (
                    <div className="tasks-mobile-list-desc">{task.description}</div>
                  )}

                  <div className="tasks-progress-wrap">
                    <div className="tasks-progress-header">
                      <span>진척률</span>
                      <span className={`tasks-progress-val ${task.progress === 100 ? 'is-done' : ''}`}>
                        {task.progress}%
                      </span>
                    </div>
                    {renderProgressSvg(task.progress)}
                  </div>

                  <div className="tasks-mobile-list-meta">
                    <span className="tasks-card-meta-item">
                      <UserCheck size={14} /> {task.assigneeName}
                    </span>
                    <span className="tasks-card-meta-item">
                      <Clock size={14} /> {task.startDate} ~ {task.dueDate}
                    </span>
                  </div>

                  <div className="tasks-mobile-list-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(task)}
                      className="btn btn-secondary tasks-action-btn"
                    >
                      <Edit2 size={14} /> {isViewer ? '상세 조회' : '상세 및 수정'}
                    </button>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="btn btn-secondary tasks-delete-icon-btn"
                        title="업무 삭제"
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className="tasks-empty-col">조건에 해당하는 업무가 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {/* 3. 업무 등록 / 수정 / 조회 모달 다이얼로그 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="tasks-modal-header-left">
                <h3 className="modal-title">
                  {editingTask
                    ? isViewer
                      ? '서비스기획 업무 상세 조회 (읽기 전용)'
                      : '서비스기획 업무 상세 및 수정'
                    : '새로운 서비스기획 업무 등록'}
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

            <form onSubmit={handleSaveTask} className="tasks-modal-form">
              <div className="modal-body">
                {/* 0. 파트 구분 (기획 / 디자인 / 퍼블리싱 3단 세그먼트 버튼) */}
                <div className="form-group tasks-modal-track-group">
                  <label className="form-label">업무 파트 구분 *</label>
                  <div className="tasks-modal-track-grid">
                    {TRACK_LIST.map((trackKey) => {
                      const config = TRACK_CONFIG[trackKey];
                      const isSelected = formData.track === trackKey;
                      const IconComponent = config.icon;
                      return (
                        <button
                          key={trackKey}
                          type="button"
                          disabled={isViewer}
                          onClick={() => setFormData({ ...formData, track: trackKey })}
                          className={`tasks-modal-track-btn ${config.classKey} ${isSelected ? 'active' : ''}`}
                        >
                          <div className="tasks-modal-track-info">
                            <div className="tasks-modal-track-icon-box">
                              <IconComponent size={16} />
                            </div>
                            <div className="tasks-modal-track-text">
                              <div className="tasks-modal-track-name">{config.label}</div>
                              <div className="tasks-modal-track-en">{config.enLabel}</div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="tasks-modal-track-check" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1. 업무명 */}
                <div className="form-group">
                  <label className="form-label">업무명 *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 통합 멤버십 등급 개편안 설계"
                    className="form-input"
                  />
                </div>

                {/* 2. 카테고리 & 담당자 */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">카테고리</label>
                    <select
                      disabled={isViewer}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                      className="form-select"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">담당자</label>
                    <select
                      disabled={isViewer}
                      value={formData.assigneeId}
                      onChange={(e) => {
                        const targetUser = teamMembers.find((m) => m.id === e.target.value);
                        setFormData({
                          ...formData,
                          assigneeId: e.target.value,
                          assigneeName: targetUser ? targetUser.name : '',
                        });
                      }}
                      className="form-select"
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.position})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. 우선순위 & 상태 */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">우선순위</label>
                    <select
                      disabled={isViewer}
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      className="form-select"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">진행 상태</label>
                    <select
                      disabled={isViewer}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                      className="form-select"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. 일정 & 진척률 */}
                <div className="tasks-form-grid-3">
                  <div className="form-group">
                    <label className="form-label">시작일</label>
                    <input
                      type="date"
                      disabled={isViewer}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">마감일</label>
                    <input
                      type="date"
                      disabled={isViewer}
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group tasks-form-progress-group">
                    <label className="form-label">진척률 ({formData.progress}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      disabled={isViewer}
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                      className="tasks-range-input"
                    />
                  </div>
                </div>

                {/* 5. 상세 내용 */}
                <div className="form-group">
                  <label className="form-label">상세 기획 내용 및 요구사항</label>
                  <textarea
                    disabled={isViewer}
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="기획 배경, 주요 변경 범위, 개발 협의 이슈 등을 상세히 기록하세요..."
                    className="form-textarea"
                  />
                </div>

                {/* 6. 관련 문서 링크 */}
                <div className="form-group">
                  <label className="form-label">관련 기획서 및 산출물 링크</label>
                  {!isViewer && (
                    <div className="tasks-link-input-row">
                      <input
                        type="text"
                        placeholder="문서명 (예: 화면설계서 SB)"
                        value={formData.linkTitle}
                        onChange={(e) => setFormData({ ...formData, linkTitle: e.target.value })}
                        className="form-input tasks-link-title-input"
                      />
                      <div className="tasks-link-url-group">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.linkUrl}
                          onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                          className="form-input tasks-link-url-input"
                        />
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="btn btn-secondary tasks-link-add-btn"
                        >
                          추가
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="tasks-links-list">
                    {formData.links.map((link, idx) => (
                      <div key={idx} className="tasks-link-item">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="tasks-link-anchor"
                        >
                          <ExternalLink size={14} /> {link.title}
                        </a>
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(idx)}
                            className="tasks-link-remove-btn"
                            aria-label="링크 삭제"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.links.length === 0 && (
                      <div className="tasks-links-empty">등록된 첨부 문서 링크가 없습니다.</div>
                    )}
                  </div>
                </div>

                {/* 감사 정보 표시 (기존 데이터인 경우) */}
                {editingTask && (
                  <div className="tasks-audit-bar">
                    <span>
                      최초 등록: {editingTask.createdBy} ({new Date(editingTask.createdAt).toLocaleDateString()})
                    </span>
                    <span>
                      최종 수정: {editingTask.updatedBy} ({new Date(editingTask.updatedAt).toLocaleTimeString()})
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {editingTask && !isViewer && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id, editingTask.title)}
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
                    {editingTask ? '변경사항 저장' : '업무 등록 완료'}
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
