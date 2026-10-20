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
export const TRACK_CONFIG: Record<
  TaskTrack,
  { label: string; enLabel: string; color: string; bg: string; border: string; icon: any }
> = {
  기획: {
    label: '기획',
    enLabel: 'Planning',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: FileText,
  },
  디자인: {
    label: '디자인',
    enLabel: 'Design',
    color: '#9333ea',
    bg: '#faf5ff',
    border: '#e9d5ff',
    icon: Palette,
  },
  퍼블리싱: {
    label: '퍼블리싱',
    enLabel: 'Publishing',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: Code,
  },
};

const TRACK_LIST: TaskTrack[] = ['기획', '디자인', '퍼블리싱'];

const CATEGORIES: TaskCategory[] = ['신규기획', '기능개선', '서비스운영', '데이터분석', '협업지원', '정책수립'];
const PRIORITIES: { key: TaskPriority; label: string; color: string; bg: string }[] = [
  { key: 'urgent', label: '긴급', color: '#ef4444', bg: '#fee2e2' },
  { key: 'high', label: '높음', color: '#f59e0b', bg: '#fef3c7' },
  { key: 'medium', label: '보통', color: '#3b82f6', bg: '#dbeafe' },
  { key: 'low', label: '낮음', color: '#64748b', bg: '#f1f5f9' },
];

const STATUSES: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'backlog', label: '대기 (Backlog)', color: '#64748b' },
  { key: 'in_progress', label: '진행중 (In Progress)', color: '#2563eb' },
  { key: 'review', label: '검토/QA (Review)', color: '#7c3aed' },
  { key: 'done', label: '완료 (Done)', color: '#059669' },
  { key: 'on_hold', label: '보류 (On Hold)', color: '#d97706' },
];

export const TasksView: React.FC<TasksViewProps> = ({ isViewer, onShowToast }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => PlanningStorageService.getTasks());
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all'); // 'all' | '기획' | '디자인' | '퍼블리싱'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // 폼 입력 상태
  const [formData, setFormData] = useState({
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
  });

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
      links: [...task.links],
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
        // 수정
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
        // 등록
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
    onShowToast(`상태가 변경되었습니다.`, 'success');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. 상단 컨트롤 바 (검색, 파트 필터, 세부 필터, 뷰 전환, 등록 버튼) */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* 1-A. 파트 퀵 필터 탭 (기획 / 디자인 / 퍼블리싱 한눈에 구분) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingBottom: '14px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={14} color="#64748b" /> 업무 파트:
            </span>

            {/* 전체 파트 */}
            <button
              onClick={() => setSelectedTrack('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: selectedTrack === 'all' ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                background: selectedTrack === 'all' ? '#0f172a' : '#ffffff',
                color: selectedTrack === 'all' ? '#ffffff' : '#475569',
                fontSize: '12.5px',
                fontWeight: selectedTrack === 'all' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                boxShadow: selectedTrack === 'all' ? '0 2px 4px rgba(15, 23, 42, 0.15)' : 'none',
              }}
            >
              <span>전체 파트</span>
              <span
                style={{
                  background: selectedTrack === 'all' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color: selectedTrack === 'all' ? '#ffffff' : '#64748b',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {trackCounts.all}
              </span>
            </button>

            {/* 개별 파트: 기획, 디자인, 퍼블리싱 */}
            {TRACK_LIST.map((trackKey) => {
              const config = TRACK_CONFIG[trackKey];
              const isSelected = selectedTrack === trackKey;
              const IconComponent = config.icon;
              return (
                <button
                  key={trackKey}
                  onClick={() => setSelectedTrack(trackKey)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: isSelected ? `1.5px solid ${config.color}` : '1px solid #e2e8f0',
                    background: isSelected ? config.bg : '#ffffff',
                    color: isSelected ? config.color : '#475569',
                    fontSize: '12.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 2px 6px ${config.color}25` : 'none',
                  }}
                >
                  <IconComponent size={14} color={isSelected ? config.color : '#64748b'} />
                  <span>{config.label}</span>
                  <span
                    style={{
                      background: isSelected ? config.color : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {trackCounts[trackKey]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 파트별 빠른 등록 버튼 세트 */}
          {!isViewer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>빠른 등록:</span>
              <button
                onClick={() => handleOpenCreateModal('기획')}
                style={{
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Plus size={12} /> 기획
              </button>
              <button
                onClick={() => handleOpenCreateModal('디자인')}
                style={{
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  borderRadius: '6px',
                  border: '1px solid #e9d5ff',
                  background: '#faf5ff',
                  color: '#9333ea',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Plus size={12} /> 디자인
              </button>
              <button
                onClick={() => handleOpenCreateModal('퍼블리싱')}
                style={{
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                  background: '#f0fdf4',
                  color: '#059669',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Plus size={12} /> 퍼블리싱
              </button>
            </div>
          )}
        </div>

        {/* 1-B. 검색, 상세 필터 및 뷰 전환 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                placeholder="업무명, 상세 내용, 담당자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* 카테고리 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
              style={{ width: '130px' }}
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
              className="form-select"
              style={{ width: '130px' }}
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
              className="form-select"
              style={{ width: '130px' }}
            >
              <option value="all">전체 상태</option>
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 뷰 전환 탭 */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: 'var(--radius-md)' }}>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                  color: viewMode === 'kanban' ? '#1e293b' : '#64748b',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'kanban' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Kanban size={14} /> 칸반 보드
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: viewMode === 'list' ? '#ffffff' : 'transparent',
                  color: viewMode === 'list' ? '#1e293b' : '#64748b',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <ListIcon size={14} /> 리스트 뷰
              </button>
            </div>

            {/* 메인 업무 등록 버튼 */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="btn btn-primary"
              disabled={isViewer}
              title={isViewer ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다' : '새 기획/디자인/퍼블리싱 업무 등록'}
            >
              <Plus size={16} /> 업무 등록
            </button>
          </div>
        </div>
      </div>
      {viewMode === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))',
            gap: '16px',
            alignItems: 'start',
            overflowX: 'auto',
            paddingBottom: '16px',
          }}
        >
          {STATUSES.map((statusObj) => {
            const columnTasks = filteredTasks.filter((t) => t.status === statusObj.key);
            return (
              <div
                key={statusObj.key}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '400px',
                }}
              >
                {/* 컬럼 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: statusObj.color,
                      }}
                    />
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {statusObj.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '1px 7px',
                      borderRadius: '9999px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* 카드 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {columnTasks.map((task) => {
                    const priorityCfg = PRIORITIES.find((p) => p.key === task.priority) || PRIORITIES[2];
                    const trackCfg = TRACK_CONFIG[task.track || '기획'] || TRACK_CONFIG['기획'];
                    const TrackIcon = trackCfg.icon;
                    return (
                      <div
                        key={task.id}
                        className="card"
                        onClick={() => handleOpenEditModal(task)}
                        style={{
                          padding: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          borderLeft: `4px solid ${trackCfg.color}`,
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            {/* 파트 배지 (기획 / 디자인 / 퍼블리싱) */}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                background: trackCfg.bg,
                                color: trackCfg.color,
                                border: `1px solid ${trackCfg.border}`,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <TrackIcon size={11} /> {trackCfg.label}
                            </span>
                            {/* 도메인 카테고리 */}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {task.category}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              background: priorityCfg.bg,
                              color: priorityCfg.color,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {priorityCfg.label}
                          </span>
                        </div>

                        <h4
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            lineHeight: 1.4,
                          }}
                        >
                          {task.title}
                        </h4>

                        {/* 진척률 바 */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>진척률</span>
                            <span style={{ fontWeight: 700, color: task.progress === 100 ? '#059669' : '#2563eb' }}>
                              {task.progress}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${task.progress}%`,
                                height: '100%',
                                background: task.progress === 100 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        </div>

                        {/* 카드 하단 메타 */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid #f1f5f9',
                            fontSize: '11.5px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={13} /> {task.assigneeName}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> ~{task.dueDate.substring(5)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div
                      style={{
                        padding: '30px 10px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '12.5px',
                        border: '1px dashed #cbd5e1',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      업무가 없습니다
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2-B. 리스트 뷰 */
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>우선순위</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>파트</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>도메인</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>업무명</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>담당자</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>상태</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>진척률</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>일정 (시작~마감)</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const priorityCfg = PRIORITIES.find((p) => p.key === task.priority) || PRIORITIES[2];
                  const statusCfg = STATUSES.find((s) => s.key === task.status) || STATUSES[0];
                  const trackCfg = TRACK_CONFIG[task.track || '기획'] || TRACK_CONFIG['기획'];
                  const TrackIcon = trackCfg.icon;
                  return (
                    <tr
                      key={task.id}
                      style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            background: priorityCfg.bg,
                            color: priorityCfg.color,
                            padding: '3px 7px',
                            borderRadius: '4px',
                          }}
                        >
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: trackCfg.bg,
                            color: trackCfg.color,
                            border: `1px solid ${trackCfg.border}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <TrackIcon size={12} /> {trackCfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          {task.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          onClick={() => handleOpenEditModal(task)}
                          style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          {task.title}
                          {task.links?.length > 0 && <LinkIcon size={13} color="#3b82f6" />}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 500 }}>{task.assigneeName}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <select
                          disabled={isViewer}
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: `1px solid ${statusCfg.color}80`,
                            backgroundColor: '#ffffff',
                            cursor: isViewer ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${task.progress}%`, height: '100%', background: '#2563eb' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{task.progress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {task.startDate} ~ {task.dueDate}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            title={isViewer ? '상세 조회' : '업무 수정'}
                          >
                            <Edit2 size={13} /> {isViewer ? '조회' : '수정'}
                          </button>
                          {!isViewer && (
                            <button
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
                              title="업무 삭제"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. 업무 등록 / 수정 / 조회 모달 다이얼로그 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title">
                  {editingTask
                    ? isViewer
                      ? '서비스기획 업무 상세 조회 (읽기 전용)'
                      : '서비스기획 업무 상세 및 수정'
                    : '새로운 서비스기획 업무 등록'}
                </h3>
                {isViewer && (
                  <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    조회 전용
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {/* 0. 파트 구분 (기획 / 디자인 / 퍼블리싱 3단 세그먼트 버튼) */}
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>업무 파트 구분 *</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 400 }}>기획 / 디자인 / 퍼블리싱 중 선택</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
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
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: isSelected ? `2px solid ${config.color}` : '1px solid #e2e8f0',
                            background: isSelected ? config.bg : '#ffffff',
                            cursor: isViewer ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? `0 2px 8px ${config.color}25` : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                background: isSelected ? config.color : '#f1f5f9',
                                color: isSelected ? '#ffffff' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconComponent size={16} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? config.color : 'var(--text-main)' }}>
                                {config.label}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                {config.enLabel}
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 size={16} color={config.color} />}
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
                    placeholder="예: VIP 통합 멤버십 등급 개편안 설계"
                    className="form-input"
                  />
                </div>

                {/* 2. 카테고리 & 담당자 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
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

                  <div className="form-group">
                    <label className="form-label">진척률 ({formData.progress}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      disabled={isViewer}
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: '10px' }}
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
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="문서명 (예: Figma 와이어프레임)"
                        value={formData.linkTitle}
                        onChange={(e) => setFormData({ ...formData, linkTitle: e.target.value })}
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formData.linkUrl}
                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                        className="form-input"
                        style={{ flex: 1.5 }}
                      />
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px' }}
                      >
                        추가
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {formData.links.map((link, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: '#f8fafc',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #e2e8f0',
                          fontSize: '12.5px',
                        }}
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <ExternalLink size={13} /> {link.title}
                        </a>
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(idx)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.links.length === 0 && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 0' }}>
                        등록된 첨부 문서 링크가 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                {/* 감사 정보 표시 (기존 데이터인 경우) */}
                {editingTask && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                    }}
                  >
                    <span>최초 등록: {editingTask.createdBy} ({new Date(editingTask.createdAt).toLocaleDateString()})</span>
                    <span>최종 수정: {editingTask.updatedBy} ({new Date(editingTask.updatedAt).toLocaleTimeString()})</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {editingTask && !isViewer && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id, editingTask.title)}
                    className="btn btn-danger"
                    style={{ marginRight: 'auto' }}
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
