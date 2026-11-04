import React, { useState, useEffect, useRef } from 'react';
import type {
  TaskItem,
  TaskAttachment,
  TaskCategory,
  TaskTrack,
  TaskPriority,
  TaskStatus,
  User,
} from '../types';
import {
  PlanningStorageService,
  computeTaskStatusByDates,
  getTodayDateString,
} from '../services/storage';
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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Upload,
  Download,
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
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: Palette,
  },
  퍼블리싱: {
    label: '퍼블리싱',
    enLabel: 'Publishing',
    classKey: 'track-publishing',
    color: '#9333ea',
    bg: '#faf5ff',
    border: '#e9d5ff',
    icon: Code,
  },
};

const TRACK_LIST: TaskTrack[] = ['기획', '디자인', '퍼블리싱'];

const CATEGORIES: TaskCategory[] = [
  '신규기획',
  '기능개선',
  '서비스운영',
  '데이터분석',
  '협업지원',
  '정책수립',
  '기획전',
];

const PRIORITIES: { key: TaskPriority; label: string; classKey: string }[] = [
  { key: 'urgent', label: '긴급', classKey: 'priority-urgent' },
  { key: 'high', label: '높음', classKey: 'priority-high' },
  { key: 'medium', label: '보통', classKey: 'priority-medium' },
  { key: 'low', label: '낮음', classKey: 'priority-low' },
];

const STATUSES: { key: TaskStatus; label: string; shortLabel: string; classKey: string }[] = [
  { key: 'backlog', label: '대기 (Backlog)', shortLabel: '대기', classKey: 'status-backlog' },
  { key: 'in_progress', label: '진행중 (In Progress)', shortLabel: '진행중', classKey: 'status-in_progress' },
  { key: 'done', label: '완료 (Done)', shortLabel: '완료', classKey: 'status-done' },
];

function getDatePlusDaysString(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolvePlanningLinkUrl(task?: TaskItem | null): string {
  if (!task) return '';
  if (task.artifactUrl && !task.artifactUrl.includes('figma.com')) {
    return task.artifactUrl;
  }
  const nonFigmaLink = task.links?.find((l) => l.url && !l.url.includes('figma.com'));
  return nonFigmaLink?.url || '';
}

function resolveWorkspaceProjectId(task?: TaskItem | null, linkUrl?: string): string | null {
  const candidate = linkUrl !== undefined ? linkUrl.trim() : resolvePlanningLinkUrl(task);
  const match = candidate.match(/[?&]project=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (linkUrl === undefined && task?.workspaceProjectId) return task.workspaceProjectId;
  return null;
}

function resolveWorkspaceViewerUrl(task?: TaskItem | null, linkUrl?: string): string | null {
  const wpId = resolveWorkspaceProjectId(task, linkUrl);
  if (!wpId) return null;
  return `https://bychoi-space.github.io/workspace/viewer.html?project=${wpId}`;
}

function resolveFigmaUrl(task?: TaskItem | null, figmaInput?: string): string | null {
  if (figmaInput !== undefined) {
    const trimmed = figmaInput.trim();
    return trimmed ? trimmed : null;
  }
  if (!task) return null;
  if (task.figmaUrl && task.figmaUrl.trim()) return task.figmaUrl.trim();
  const figmaFromLinks = task.links?.find((l) => l.url && l.url.includes('figma.com'))?.url;
  if (figmaFromLinks) return figmaFromLinks;
  if (task.artifactUrl && task.artifactUrl.includes('figma.com')) return task.artifactUrl;
  return null;
}

function resolveFigmaMetaLabel(figmaUrl: string): string {
  let fileLabel = 'Figma 디자인 시안';
  if (figmaUrl.includes('l9Zw8nYYaKBs1mmAqxx5ZF')) {
    fileLabel = '100. 운영';
  } else if (figmaUrl.includes('5tx1QKw7gAPwrJy4DlC3FD')) {
    fileLabel = '01. 상품';
  }
  const nodeMatch = figmaUrl.match(/[?&]node-id=([0-9]+-[0-9]+)/);
  return nodeMatch ? `${fileLabel} · 노드 #${nodeMatch[1]}` : fileLabel;
}

const TRACK_OWNER_NAME: Record<TaskTrack, string> = {
  기획: '최범열',
  디자인: '박수민',
  퍼블리싱: '김리아',
};

const PRIORITY_SORT_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function formatTaskScheduleCompact(startDate?: string, dueDate?: string): string {
  const fmt = (d?: string) => (d && d.length >= 10 ? d.substring(5).replace('-', '.') : '');
  const s = fmt(startDate);
  const e = fmt(dueDate);
  if (s && e) {
    return s === e ? s : `${s} ~ ${e}`;
  }
  if (e) return `~ ${e}`;
  if (s) return `${s} ~`;
  return '일정 미정';
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentMeta(ext?: string): {
  badge: string;
  chipLabel: string;
  classKey: string;
} {
  const normalized = (ext || '').toLowerCase();
  if (normalized === 'xlsx' || normalized === 'xls' || normalized === 'csv') {
    return { badge: 'EXCEL', chipLabel: 'Excel', classKey: 'is-excel' };
  }
  if (normalized === 'pptx' || normalized === 'ppt') {
    return { badge: 'PPT', chipLabel: 'PPT', classKey: 'is-ppt' };
  }
  if (normalized === 'pdf') {
    return { badge: 'PDF', chipLabel: 'PDF', classKey: 'is-pdf' };
  }
  if (normalized === 'docx' || normalized === 'doc' || normalized === 'hwp' || normalized === 'hwpx') {
    return { badge: 'DOC', chipLabel: '문서', classKey: 'is-doc' };
  }
  if (normalized === 'zip' || normalized === '7z' || normalized === 'rar') {
    return { badge: 'ZIP', chipLabel: 'ZIP', classKey: 'is-file' };
  }
  return {
    badge: (normalized || 'FILE').toUpperCase().slice(0, 5),
    chipLabel: '첨부',
    classKey: 'is-file',
  };
}

function sortSwimlaneTasks(list: TaskItem[]): TaskItem[] {
  const statusRank: Record<TaskStatus, number> = {
    in_progress: 0,
    review: 0,
    backlog: 1,
    on_hold: 1,
    done: 2,
  };
  return [...list].sort((a, b) => {
    const rankA = statusRank[a.status] ?? 1;
    const rankB = statusRank[b.status] ?? 1;
    if (rankA !== rankB) return rankA - rankB;

    if (a.status === 'in_progress') {
      const dueA = a.dueDate || '9999-12-31';
      const dueB = b.dueDate || '9999-12-31';
      if (dueA !== dueB) return dueA.localeCompare(dueB);
      return (PRIORITY_SORT_ORDER[a.priority] ?? 2) - (PRIORITY_SORT_ORDER[b.priority] ?? 2);
    }

    if (a.status === 'backlog') {
      const startA = a.startDate || a.dueDate || '9999-12-31';
      const startB = b.startDate || b.dueDate || '9999-12-31';
      if (startA !== startB) return startA.localeCompare(startB);
      return (PRIORITY_SORT_ORDER[a.priority] ?? 2) - (PRIORITY_SORT_ORDER[b.priority] ?? 2);
    }

    const doneDateA = a.dueDate || a.startDate || '';
    const doneDateB = b.dueDate || b.startDate || '';
    if (doneDateA !== doneDateB) return doneDateB.localeCompare(doneDateA);
    return 0;
  });
}

export const TasksView: React.FC<TasksViewProps> = ({ currentUser, isViewer, onShowToast }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => PlanningStorageService.getTasks());
  const [teamMembers, setTeamMembers] = useState<User[]>(() => PlanningStorageService.getServicePlanningMembers());
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all'); // 'all' | '기획' | '디자인' | '퍼블리싱'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedDoneTracks, setExpandedDoneTracks] = useState<Record<string, boolean>>({});

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isSyncingNotion, setIsSyncingNotion] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로그인된 회원을 기본 담당자로 반환하는 헬퍼 (파트 지정 시 해당 파트 전담자 우선 매칭)
  const resolveDefaultAssignee = (members: User[], targetTrack?: TaskTrack): User => {
    if (targetTrack) {
      const trackDefaultName =
        targetTrack === '디자인' ? '박수민' : targetTrack === '퍼블리싱' ? '김리아' : '최범열';
      const matchedByTrack = members.find((m) => m.name.trim() === trackDefaultName);
      if (matchedByTrack) return matchedByTrack;
    }
    const matchedCurrent = members.find(
      (m) => String(m.id) === String(currentUser.id) || m.name.trim() === currentUser.name.trim()
    );
    if (matchedCurrent) return matchedCurrent;
    if (currentUser.role !== 'viewer') return currentUser;
    return members[0] || currentUser;
  };

  // 폼 입력 상태 (기본 담당자: 현재 로그인된 서비스기획팀원)
  const [formData, setFormData] = useState(() => {
    const initialMembers = PlanningStorageService.getServicePlanningMembers();
    const initialAssignee =
      initialMembers.find(
        (m) => String(m.id) === String(currentUser.id) || m.name.trim() === currentUser.name.trim()
      ) ||
      (currentUser.role !== 'viewer' ? currentUser : initialMembers[0]) ||
      currentUser;

    const defaultStart = getTodayDateString();
    const defaultDue = getDatePlusDaysString(14);
    return {
      title: '',
      category: '신규기획' as TaskCategory,
      track: '기획' as TaskTrack,
      assigneeId: initialAssignee.id,
      assigneeName: initialAssignee.name,
      priority: 'medium' as TaskPriority,
      status: computeTaskStatusByDates(defaultStart, defaultDue),
      startDate: defaultStart,
      dueDate: defaultDue,
      description: '',
      linkUrl: '',
      figmaUrl: '',
      attachments: [] as TaskAttachment[],
      syncToNotion: true,
    };
  });

  const refreshTasks = () => {
    setTasks(PlanningStorageService.getTasks());
    setTeamMembers(PlanningStorageService.getServicePlanningMembers());
  };

  // 화면 진입 시 Notion (Sisun-Tasks) 자동 동기화 및 이벤트 리스너 등록
  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshTasks();
    };
    window.addEventListener('ds-portal-tasks-updated', handleStorageUpdate);

    let isMounted = true;
    PlanningStorageService.syncWithNotion()
      .then((res) => {
        if (isMounted && res.success) {
          refreshTasks();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSyncingNotion(false);
        }
      });

    return () => {
      isMounted = false;
      window.removeEventListener('ds-portal-tasks-updated', handleStorageUpdate);
    };
  }, []);

  // 수동 Notion · Workspace · Figma 동기화 실행
  const handleManualNotionSync = async () => {
    if (isSyncingNotion) return;
    setIsSyncingNotion(true);
    try {
      const res = await PlanningStorageService.syncWithNotion();
      refreshTasks();
      if (res.success) {
        onShowToast(
          `Notion · 기획서 워크스페이스 · Figma 디자인 동기화가 완료되었습니다. (${res.syncedCount}건)`,
          'success'
        );
      } else {
        onShowToast(res.message || '동기화 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setIsSyncingNotion(false);
    }
  };

  // 모달 열기 (등록 - 기본 담당자를 로그인된 회원으로 자동 지정)
  const handleOpenCreateModal = (defaultTrack?: TaskTrack) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 새 업무를 등록할 수 없습니다.', 'error');
      return;
    }
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);
    const resolvedTrack: TaskTrack =
      defaultTrack || (selectedTrack !== 'all' ? (selectedTrack as TaskTrack) : '기획');
    const defaultAssignee = resolveDefaultAssignee(latestMembers, resolvedTrack);
    const defaultStart = getTodayDateString();
    const defaultDue = getDatePlusDaysString(14);

    setEditingTask(null);
    setFormData({
      title: '',
      category: resolvedTrack === '퍼블리싱' ? '기획전' : '신규기획',
      track: resolvedTrack,
      assigneeId: defaultAssignee.id,
      assigneeName: defaultAssignee.name,
      priority: 'medium',
      status: computeTaskStatusByDates(defaultStart, defaultDue),
      startDate: defaultStart,
      dueDate: defaultDue,
      description: '',
      linkUrl: '',
      figmaUrl: '',
      attachments: [],
      syncToNotion: true,
    });
    setIsModalOpen(true);

    // 원격 DB 최신 가입 팀원 목록 비동기 동기화
    PlanningStorageService.syncFromSupabase().then(() => {
      setTeamMembers(PlanningStorageService.getServicePlanningMembers());
    });
  };

  // 모달 열기 (수정 or 상세 조회)
  const handleOpenEditModal = (task: TaskItem) => {
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);
    const matchedAssignee = latestMembers.find(
      (m) => String(m.id) === String(task.assigneeId) || m.name.trim() === task.assigneeName?.trim()
    );
    const isAlreadyNotionLinked =
      String(task.id).startsWith('notion-') || Boolean(task.notionUrl);

    setEditingTask(task);
    setFormData({
      title: task.title,
      category: task.category,
      track: task.track || '기획',
      assigneeId: matchedAssignee ? matchedAssignee.id : task.assigneeId,
      assigneeName: matchedAssignee ? matchedAssignee.name : task.assigneeName,
      priority: task.priority,
      status: computeTaskStatusByDates(
        task.startDate,
        task.dueDate,
        getTodayDateString(),
        task.status
      ),
      startDate: task.startDate || '',
      dueDate: task.dueDate || '',
      description: task.description,
      linkUrl: resolvePlanningLinkUrl(task),
      figmaUrl: resolveFigmaUrl(task) || '',
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
      syncToNotion: isAlreadyNotionLinked,
    });
    setIsModalOpen(true);
  };

  // 첨부파일(Excel · PPT · PDF 등) 업로드 처리
  const handleFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || isViewer) return;
    setIsUploadingFile(true);
    try {
      const uploadedItems: TaskAttachment[] = [];
      for (const file of Array.from(fileList)) {
        const item = await PlanningStorageService.uploadTaskAttachment(file, currentUser.name);
        uploadedItems.push(item);
      }
      const nextAttachments = [...(formData.attachments || []), ...uploadedItems];
      setFormData((prev) => ({
        ...prev,
        attachments: nextAttachments,
      }));

      // 기존 업무 수정 모달에서 파일 업로드 시 즉시 DB에도 자동 반영
      if (editingTask) {
        const updated = PlanningStorageService.updateTask(
          editingTask.id,
          { attachments: nextAttachments },
          currentUser,
          { syncToNotion: false }
        );
        setEditingTask(updated);
        refreshTasks();
      }
      onShowToast(
        `${uploadedItems.length}개의 첨부 파일(${uploadedItems.map((u) => u.name).join(', ')})이 업로드되었습니다.`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.';
      onShowToast(msg, 'error');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 첨부파일 개별 삭제
  const handleRemoveAttachment = async (target: TaskAttachment) => {
    if (isViewer) return;
    const nextAttachments = (formData.attachments || []).filter((a) => a.id !== target.id);
    setFormData((prev) => ({
      ...prev,
      attachments: nextAttachments,
    }));
    await PlanningStorageService.removeTaskAttachmentFromStorage(target.storagePath);

    if (editingTask) {
      const updated = PlanningStorageService.updateTask(
        editingTask.id,
        { attachments: nextAttachments },
        currentUser,
        { syncToNotion: false }
      );
      setEditingTask(updated);
      refreshTasks();
    }
    onShowToast(`첨부 파일 "${target.name}"이(가) 삭제되었습니다.`, 'info');
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

    if (formData.startDate && formData.dueDate && formData.startDate > formData.dueDate) {
      onShowToast('마감일은 시작일보다 이전일 수 없습니다.', 'error');
      return;
    }

    const autoStatus = computeTaskStatusByDates(
      formData.startDate,
      formData.dueDate,
      getTodayDateString(),
      editingTask?.status
    );
    const trimmedUrl = formData.linkUrl.trim();
    const trimmedFigma = formData.figmaUrl.trim();
    const normalizedLinks: { title: string; url: string }[] = [];
    if (trimmedUrl) {
      normalizedLinks.push({
        title: trimmedUrl.includes('workspace') ? '기획서 뷰어' : '산출물 링크',
        url: trimmedUrl,
      });
    }
    if (trimmedFigma) {
      normalizedLinks.push({
        title: 'Figma 디자인 시안',
        url: trimmedFigma,
      });
    }

    try {
      if (editingTask) {
        const isAlreadyNotionLinked =
          String(editingTask.id).startsWith('notion-') || Boolean(editingTask.notionUrl);
        PlanningStorageService.updateTask(
          editingTask.id,
          {
            title: formData.title.trim(),
            category: formData.category,
            track: formData.track,
            assigneeId: formData.assigneeId,
            assigneeName: formData.assigneeName,
            priority: formData.priority,
            status: autoStatus,
            startDate: formData.startDate,
            dueDate: formData.dueDate,
            description: formData.description,
            artifactUrl: trimmedUrl || undefined,
            figmaUrl: trimmedFigma || undefined,
            links: normalizedLinks,
            attachments: formData.attachments,
          },
          currentUser,
          { syncToNotion: formData.syncToNotion }
        );
        onShowToast(
          isAlreadyNotionLinked || formData.syncToNotion
            ? `[${formData.track}] 업무가 수정되었으며 Notion (Sisun-Tasks)에 양방향 반영됩니다.`
            : `[${formData.track}] 업무 정보가 성공적으로 수정되었습니다.`,
          'success'
        );
      } else {
        PlanningStorageService.createTask(
          {
            title: formData.title.trim(),
            category: formData.category,
            track: formData.track,
            assigneeId: formData.assigneeId,
            assigneeName: formData.assigneeName,
            priority: formData.priority,
            status: autoStatus,
            startDate: formData.startDate,
            dueDate: formData.dueDate,
            progress: autoStatus === 'done' ? 100 : 0,
            description: formData.description,
            artifactUrl: trimmedUrl || undefined,
            figmaUrl: trimmedFigma || undefined,
            links: normalizedLinks,
            attachments: formData.attachments,
          },
          currentUser,
          { syncToNotion: formData.syncToNotion }
        );
        onShowToast(
          formData.syncToNotion
            ? `새로운 [${formData.track}] 업무가 등록되었으며 Notion (Sisun-Tasks)에 동시 생성됩니다.`
            : `새로운 [${formData.track}] 업무가 등록되었습니다.`,
          'success'
        );
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
    const selectedMemberObj = teamMembers.find((m) => String(m.id) === String(selectedAssignee));
    const matchesAssignee =
      selectedAssignee === 'all' ||
      String(t.assigneeId) === String(selectedAssignee) ||
      (selectedMemberObj ? t.assigneeName.trim() === selectedMemberObj.name.trim() : false);
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    return matchesSearch && matchesTrack && matchesCategory && matchesAssignee && matchesStatus;
  });

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

            {/* Notion 양방향 수동/즉시 동기화 버튼 */}
            <button
              type="button"
              onClick={handleManualNotionSync}
              disabled={isSyncingNotion}
              className="btn btn-secondary tasks-notion-sync-btn"
              title="Notion (Sisun-Tasks) 최신 과제 동기화"
            >
              <RefreshCw size={15} className={isSyncingNotion ? 'spin-icon' : ''} />
              <span>{isSyncingNotion ? '동기화 중...' : 'Notion 동기화'}</span>
            </button>

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

      {/* 2. 업무 목록 본문 (파트별 스윔레인 3열 보드 vs 리스트 뷰) */}
      {viewMode === 'kanban' ? (
        <div className="tasks-swimlane-board">
          {(selectedTrack === 'all' ? TRACK_LIST : [selectedTrack as TaskTrack]).map((trackKey) => {
            const trackCfg = TRACK_CONFIG[trackKey] || TRACK_CONFIG['기획'];
            const TrackIcon = trackCfg.icon;
            const ownerName = TRACK_OWNER_NAME[trackKey];
            const trackTasks = sortSwimlaneTasks(
              filteredTasks.filter((t) => (t.track || '기획') === trackKey)
            );
            const inProgressTasks = trackTasks.filter((t) => t.status === 'in_progress');
            const backlogTasks = trackTasks.filter((t) => t.status === 'backlog');
            const doneTasks = trackTasks.filter((t) => t.status === 'done');
            const activeTasks = [...inProgressTasks, ...backlogTasks];

            const isForceExpanded =
              selectedStatus === 'done' || Boolean(searchQuery.trim()) || selectedTrack !== 'all';
            const isDoneExpanded = isForceExpanded || Boolean(expandedDoneTracks[trackKey]);

            let defaultVisibleDoneCount =
              activeTasks.length < 6
                ? 6 - activeTasks.length
                : activeTasks.length % 3 === 0
                  ? 0
                  : 3 - (activeTasks.length % 3);

            if (doneTasks.length - defaultVisibleDoneCount <= 2) {
              defaultVisibleDoneCount = doneTasks.length;
            }

            const visibleDoneTasks = isDoneExpanded
              ? doneTasks
              : doneTasks.slice(0, Math.max(0, defaultVisibleDoneCount));
            const hiddenDoneCount = Math.max(0, doneTasks.length - visibleDoneTasks.length);
            const displayTasks = [...activeTasks, ...visibleDoneTasks];
            const canToggleDone =
              !isForceExpanded && doneTasks.length > defaultVisibleDoneCount;

            return (
              <section
                key={trackKey}
                className={`tasks-swimlane-section ${trackCfg.classKey}`}
              >
                {/* 파트 스윔레인 헤더 */}
                <div className="tasks-swimlane-header">
                  <div className="tasks-swimlane-title-group">
                    <span className={`tasks-swimlane-icon-box ${trackCfg.classKey}`}>
                      <TrackIcon size={18} />
                    </span>
                    <div className="tasks-swimlane-title-texts">
                      <h3 className="tasks-swimlane-title">{trackCfg.label} 업무</h3>
                      <span className="tasks-swimlane-owner">전담: {ownerName}</span>
                    </div>
                    <span className="tasks-swimlane-total-badge">{trackTasks.length}건</span>
                  </div>

                  <div className="tasks-swimlane-meta-group">
                    <div className="tasks-swimlane-status-pills">
                      <span className="tasks-swimlane-stat-pill is-in-progress">
                        <span className="tasks-status-dot status-in_progress" />
                        진행중 <strong>{inProgressTasks.length}</strong>
                      </span>
                      <span className="tasks-swimlane-stat-pill is-backlog">
                        <span className="tasks-status-dot status-backlog" />
                        대기 <strong>{backlogTasks.length}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (canToggleDone) {
                            setExpandedDoneTracks((prev) => ({
                              ...prev,
                              [trackKey]: !prev[trackKey],
                            }));
                          }
                        }}
                        className={`tasks-swimlane-stat-pill is-done ${canToggleDone ? 'is-interactive' : ''}`}
                        title={
                          canToggleDone
                            ? isDoneExpanded
                              ? '클릭하여 완료 업무 접기'
                              : `클릭하여 완료 업무 ${hiddenDoneCount}건 더보기`
                            : '완료된 업무 수'
                        }
                      >
                        <span className="tasks-status-dot status-done" />
                        완료 <strong>{doneTasks.length}</strong>
                      </button>
                    </div>

                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(trackKey)}
                        className={`btn btn-secondary tasks-swimlane-add-btn ${trackCfg.classKey}`}
                      >
                        <Plus size={14} /> {trackCfg.label} 등록
                      </button>
                    )}
                  </div>
                </div>

                {/* 파트 내 3열 균형 카드 그리드 */}
                {displayTasks.length > 0 ? (
                  <>
                    <div className="tasks-swimlane-card-grid">
                      {displayTasks.map((task) => {
                        const priorityCfg =
                          PRIORITIES.find((p) => p.key === task.priority) || PRIORITIES[2];
                        const statusObj =
                          STATUSES.find((s) => s.key === task.status) || STATUSES[0];
                        const showPriorityBadge =
                          task.priority === 'urgent' || task.priority === 'high';
                        const workspaceViewerUrl = resolveWorkspaceViewerUrl(task);
                        const figmaUrl = resolveFigmaUrl(task);
                        const notionUrl = task.notionUrl?.trim() || null;

                        return (
                          <div
                            key={task.id}
                            className={`card tasks-kanban-card ${trackCfg.classKey} ${task.status === 'done' ? 'is-done' : ''}`}
                            onClick={() => handleOpenEditModal(task)}
                          >
                            {/* 1단: 상태 배지 + 도메인 카테고리 + (긴급/높음 시에만) 우선순위 */}
                            <div className="tasks-card-top">
                              <div className="tasks-card-badges">
                                <span
                                  className={`tasks-card-status-pill ${statusObj.classKey}`}
                                >
                                  {task.status === 'done' ? (
                                    <CheckCircle2 size={13} />
                                  ) : (
                                    <span
                                      className={`tasks-status-dot ${statusObj.classKey}`}
                                    />
                                  )}
                                  {statusObj.shortLabel}
                                </span>
                                <span className="tasks-badge-category">{task.category}</span>
                              </div>

                              {showPriorityBadge && (
                                <span
                                  className={`tasks-badge-priority ${priorityCfg.classKey}`}
                                >
                                  {priorityCfg.label}
                                </span>
                              )}
                            </div>

                            {/* 2단: 핵심 업무명 */}
                            <h4 className="tasks-card-title">{task.title}</h4>

                            {/* 3단: 담당자 · 전체 일정 + 우측 원클릭 산출물 바로가기 칩 */}
                            <div className="tasks-card-footer">
                              <div className="tasks-card-meta-group">
                                <span className="tasks-card-meta-item">
                                  <UserCheck size={14} /> {task.assigneeName}
                                </span>
                                <span className="tasks-card-meta-item">
                                  <Clock size={14} />{' '}
                                  {formatTaskScheduleCompact(task.startDate, task.dueDate)}
                                </span>
                              </div>

                              {(workspaceViewerUrl ||
                                figmaUrl ||
                                notionUrl ||
                                (task.attachments && task.attachments.length > 0)) && (
                                <div className="tasks-card-action-chips">
                                  {workspaceViewerUrl && (
                                    <a
                                      href={workspaceViewerUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="tasks-card-link-chip is-workspace"
                                      title={`기획서 워크스페이스 (${resolveWorkspaceProjectId(task)}) · v${task.version || '0.1'} 열기`}
                                    >
                                      기획서 v{task.version || '0.1'}{' '}
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                  {figmaUrl && (
                                    <a
                                      href={figmaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="tasks-card-link-chip is-figma"
                                      title={`Figma 시안 열기 (${resolveFigmaMetaLabel(figmaUrl)})`}
                                    >
                                      Figma <ExternalLink size={12} />
                                    </a>
                                  )}
                                  {task.attachments?.map((att) => {
                                    const attMeta = getAttachmentMeta(att.ext);
                                    return (
                                      <a
                                        key={att.id}
                                        href={att.url}
                                        download={att.name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className={`tasks-card-link-chip ${attMeta.classKey}`}
                                        title={`첨부파일 다운로드: ${att.name} (${formatFileSize(att.size)})`}
                                      >
                                        <Download size={12} /> {attMeta.chipLabel}
                                      </a>
                                    );
                                  })}
                                  {notionUrl && (
                                    <a
                                      href={notionUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="tasks-card-link-chip is-notion"
                                      title="Notion (Sisun-Tasks) 페이지 열기"
                                    >
                                      Notion <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {canToggleDone && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDoneTracks((prev) => ({
                            ...prev,
                            [trackKey]: !prev[trackKey],
                          }))
                        }
                        className="tasks-swimlane-more-btn"
                      >
                        {isDoneExpanded ? (
                          <>
                            <ChevronUp size={16} />
                            <span>
                              {trackCfg.label} 파트 완료된 업무 접기
                            </span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            <span>
                              완료된 업무 {hiddenDoneCount}건 더보기 (전체 완료 {doneTasks.length}건)
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="tasks-empty-col">조건에 해당하는 {trackCfg.label} 업무가 없습니다</div>
                )}
              </section>
            );
          })}
        </div>
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
                          {(Boolean(task.notionUrl) || String(task.id).startsWith('notion-')) && (
                            <span className="tasks-badge-notion" title="Notion (Sisun-Tasks) 양방향 연동 과제">
                              Notion
                            </span>
                          )}
                          {resolveWorkspaceProjectId(task) && (
                            <span
                              className="tasks-badge-workspace"
                              title={`기획서 워크스페이스 (${resolveWorkspaceProjectId(task)}) · v${task.version || '0.1'}`}
                            >
                              기획서 v{task.version || '0.1'}
                            </span>
                          )}
                          {resolveFigmaUrl(task) && (
                            <span
                              className="tasks-badge-figma"
                              title={`Figma 디자인 시안 (${resolveFigmaMetaLabel(resolveFigmaUrl(task)!)})`}
                            >
                              Figma
                            </span>
                          )}
                          {task.attachments?.map((att) => {
                            const attMeta = getAttachmentMeta(att.ext);
                            return (
                              <a
                                key={att.id}
                                href={att.url}
                                download={att.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`tasks-card-link-chip ${attMeta.classKey}`}
                                title={`첨부파일 다운로드: ${att.name} (${formatFileSize(att.size)})`}
                              >
                                <Download size={12} /> {attMeta.chipLabel}
                              </a>
                            );
                          })}
                          {(task.links?.length ?? 0) > 0 && (
                            <LinkIcon size={14} className="tasks-link-indicator" />
                          )}
                        </div>
                        <div className="tasks-table-desc">{task.description}</div>
                      </td>
                      <td className="tasks-table-assignee">{task.assigneeName}</td>
                      <td>
                        <span className={`tasks-status-badge ${statusCfg.classKey}`}>
                          <span className={`tasks-status-dot ${statusCfg.classKey}`} />
                          <span>{statusCfg.shortLabel}</span>
                        </span>
                      </td>
                      <td className="tasks-table-schedule">
                        {task.startDate || task.dueDate
                          ? `${task.startDate || '미정'} ~ ${task.dueDate || '미정'}`
                          : '일정 미정'}
                      </td>
                      <td className="td-center">
                        <div className="tasks-row-actions">
                          {resolveWorkspaceViewerUrl(task) && (
                            <a
                              href={resolveWorkspaceViewerUrl(task)!}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary tasks-action-btn tasks-workspace-open-btn"
                              title="기획서 뷰어 새 창으로 열기"
                            >
                              <ExternalLink size={14} /> 기획서
                            </a>
                          )}
                          {resolveFigmaUrl(task) && (
                            <a
                              href={resolveFigmaUrl(task)!}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary tasks-action-btn tasks-figma-open-btn"
                              title="Figma 디자인 시안 새 창으로 열기"
                            >
                              <ExternalLink size={14} /> Figma
                            </a>
                          )}
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
                    <td colSpan={8} className="td-center">
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
                      {(Boolean(task.notionUrl) || String(task.id).startsWith('notion-')) && (
                        <span className="tasks-badge-notion" title="Notion (Sisun-Tasks) 양방향 연동 과제">
                          Notion
                        </span>
                      )}
                      {resolveWorkspaceProjectId(task) && (
                        <span
                          className="tasks-badge-workspace"
                          title={`기획서 워크스페이스 (${resolveWorkspaceProjectId(task)}) · v${task.version || '0.1'}`}
                        >
                          기획서 v{task.version || '0.1'}
                        </span>
                      )}
                      {resolveFigmaUrl(task) && (
                        <span
                          className="tasks-badge-figma"
                          title={`Figma 디자인 시안 (${resolveFigmaMetaLabel(resolveFigmaUrl(task)!)})`}
                        >
                          Figma
                        </span>
                      )}
                    </div>

                    <span className={`tasks-status-badge ${statusCfg.classKey}`}>
                      <span className={`tasks-status-dot ${statusCfg.classKey}`} />
                      <span>{statusCfg.shortLabel}</span>
                    </span>
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

                  <div className="tasks-mobile-list-meta">
                    <span className="tasks-card-meta-item">
                      <UserCheck size={14} /> {task.assigneeName}
                    </span>
                    <span className="tasks-card-meta-item">
                      <Clock size={14} />{' '}
                      {task.startDate || task.dueDate
                        ? `${task.startDate || '미정'} ~ ${task.dueDate || '미정'}`
                        : '일정 미정'}
                    </span>
                  </div>

                  <div className="tasks-mobile-list-actions">
                    {resolveWorkspaceViewerUrl(task) && (
                      <a
                        href={resolveWorkspaceViewerUrl(task)!}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary tasks-action-btn tasks-workspace-open-btn"
                      >
                        <ExternalLink size={14} /> 기획서 열기
                      </a>
                    )}
                    {resolveFigmaUrl(task) && (
                      <a
                        href={resolveFigmaUrl(task)!}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary tasks-action-btn tasks-figma-open-btn"
                      >
                        <ExternalLink size={14} /> Figma 열기
                      </a>
                    )}
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
          <div
            className="modal-box tasks-detail-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
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
                          onClick={() => {
                            if (!editingTask) {
                              const nextAssignee = resolveDefaultAssignee(teamMembers, trackKey);
                              setFormData({
                                ...formData,
                                track: trackKey,
                                assigneeId: nextAssignee.id,
                                assigneeName: nextAssignee.name,
                              });
                            } else {
                              setFormData({ ...formData, track: trackKey });
                            }
                          }}
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

                {/* 2. 메타데이터 1행 (3열): 카테고리 & 담당자 & 우선순위 */}
                <div className="tasks-form-grid-3">
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
                        const targetUser = teamMembers.find((m) => String(m.id) === String(e.target.value));
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
                          {m.name} ({m.department || '서비스기획팀'})
                        </option>
                      ))}
                    </select>
                  </div>

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
                </div>

                {/* 3. 메타데이터 2행 (3열): 시작일 & 마감일 & 진행 상태 */}
                <div className="tasks-form-grid-3">
                  <div className="form-group">
                    <label className="form-label">시작일</label>
                    <input
                      type="date"
                      disabled={isViewer}
                      value={formData.startDate}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        setFormData({
                          ...formData,
                          startDate: nextStart,
                          status: computeTaskStatusByDates(nextStart, formData.dueDate),
                        });
                      }}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">마감일</label>
                    <input
                      type="date"
                      disabled={isViewer}
                      value={formData.dueDate}
                      onChange={(e) => {
                        const nextDue = e.target.value;
                        setFormData({
                          ...formData,
                          dueDate: nextDue,
                          status: computeTaskStatusByDates(formData.startDate, nextDue),
                        });
                      }}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">진행 상태</label>
                    {(() => {
                      const autoStatus = computeTaskStatusByDates(
                        formData.startDate,
                        formData.dueDate,
                        getTodayDateString(),
                        editingTask?.status
                      );
                      const autoStatusCfg =
                        STATUSES.find((s) => s.key === autoStatus) || STATUSES[1];
                      return (
                        <div
                          className={`tasks-auto-status-box ${autoStatusCfg.classKey}`}
                          aria-live="polite"
                        >
                          <span className="tasks-auto-status-main">
                            <span className={`tasks-status-dot ${autoStatusCfg.classKey}`} />
                            <span>{autoStatusCfg.label}</span>
                          </span>
                          <span className="tasks-auto-status-tag">일정 자동</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 4. 상세 내용 */}
                <div className="form-group">
                  <label className="form-label">상세 기획 내용 및 요구사항</label>
                  <textarea
                    disabled={isViewer}
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="기획 배경, 주요 변경 범위, 개발 협의 이슈 등을 상세히 기록하세요..."
                    className="form-textarea"
                  />
                </div>

                {/* 5. 기획서(Workspace) & 디자인 시안(Figma) 산출물 링크 2열 입력 */}
                {(() => {
                  const activeWpId = resolveWorkspaceProjectId(editingTask, formData.linkUrl);
                  const activeWpViewerUrl = resolveWorkspaceViewerUrl(editingTask, formData.linkUrl);
                  const activeFigmaUrl = resolveFigmaUrl(editingTask, formData.figmaUrl);
                  const isNotionLinked =
                    editingTask &&
                    (Boolean(editingTask.notionUrl) || String(editingTask.id).startsWith('notion-'));

                  const visibleCardsCount =
                    (activeWpId ? 1 : 0) + (activeFigmaUrl ? 1 : 0) + 1;
                  const gridColClass =
                    visibleCardsCount === 3
                      ? 'is-three-col'
                      : visibleCardsCount === 2
                        ? 'is-two-col'
                        : 'is-single-col';

                  return (
                    <>
                      <div className="tasks-form-grid-2">
                        <div className="form-group">
                          <label className="form-label">기획서 / 산출물 링크 (Workspace)</label>
                          <div className="tasks-single-link-row">
                            <input
                              type="url"
                              disabled={isViewer}
                              placeholder="https://bychoi-space.github.io/workspace/viewer.html?project=..."
                              value={formData.linkUrl}
                              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                              className="form-input tasks-single-link-input"
                            />
                            {formData.linkUrl.trim() && !activeWpId && (
                              <a
                                href={formData.linkUrl.trim()}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary tasks-single-link-open-btn"
                                title="새 창에서 산출물 링크 열기"
                              >
                                <ExternalLink size={15} /> 열기
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">디자인 시안 링크 (Figma)</label>
                          <div className="tasks-single-link-row">
                            <input
                              type="url"
                              disabled={isViewer}
                              placeholder="https://www.figma.com/design/..."
                              value={formData.figmaUrl}
                              onChange={(e) =>
                                setFormData({ ...formData, figmaUrl: e.target.value })
                              }
                              className="form-input tasks-single-link-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5-B. 첨부 파일 업로드 및 다운로드 (MS Office Excel · PPT · PDF · 문서) */}
                      <div className="form-group tasks-attachments-group">
                        <div className="tasks-attachments-header">
                          <label className="form-label tasks-attachments-label">
                            <Paperclip size={15} />
                            <span>첨부 파일 (MS Office Excel · PPT · PDF · 문서)</span>
                            {formData.attachments.length > 0 && (
                              <span className="tasks-attachments-count">
                                {formData.attachments.length}개
                              </span>
                            )}
                          </label>

                          {!isViewer && (
                            <>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc,.pdf,.hwp,.hwpx,.zip,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => handleFilesUpload(e.target.files)}
                                className="tasks-file-input-hidden"
                              />
                              <button
                                type="button"
                                disabled={isUploadingFile}
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-secondary tasks-upload-trigger-btn"
                              >
                                <Upload
                                  size={14}
                                  className={isUploadingFile ? 'spin-icon' : ''}
                                />
                                <span>
                                  {isUploadingFile ? '업로드 중...' : '파일 첨부'}
                                </span>
                              </button>
                            </>
                          )}
                        </div>

                        <div
                          className={`tasks-attachments-dropzone ${isDragOver ? 'is-dragover' : ''} ${formData.attachments.length > 0 ? 'has-files' : ''}`}
                          onDragOver={(e) => {
                            if (isViewer) return;
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={(e) => {
                            if (isViewer) return;
                            e.preventDefault();
                            setIsDragOver(false);
                          }}
                          onDrop={(e) => {
                            if (isViewer) return;
                            e.preventDefault();
                            setIsDragOver(false);
                            handleFilesUpload(e.dataTransfer.files);
                          }}
                        >
                          {formData.attachments.length === 0 ? (
                            <div
                              className="tasks-attachments-empty"
                              onClick={() => {
                                if (!isViewer && !isUploadingFile) {
                                  fileInputRef.current?.click();
                                }
                              }}
                            >
                              <Upload size={16} className="tasks-attachments-empty-icon" />
                              <span>
                                {isViewer
                                  ? '등록된 첨부 파일이 없습니다.'
                                  : isUploadingFile
                                    ? '클라우드 스토리지에 파일을 업로드하고 있습니다...'
                                    : '엑셀(.xlsx), 파워포인트(.pptx), PDF, 워드 등 파일을 끌어다 놓거나 클릭하여 첨부하세요.'}
                              </span>
                            </div>
                          ) : (
                            <div className="tasks-attachments-list">
                              {formData.attachments.map((att) => {
                                const attMeta = getAttachmentMeta(att.ext);
                                return (
                                  <div key={att.id} className="tasks-attachment-row">
                                    <div className="tasks-attachment-info">
                                      <span
                                        className={`tasks-attachment-ext-badge ${attMeta.classKey}`}
                                      >
                                        {attMeta.badge}
                                      </span>
                                      <span
                                        className="tasks-attachment-name"
                                        title={att.name}
                                      >
                                        {att.name}
                                      </span>
                                      <span className="tasks-attachment-size">
                                        ({formatFileSize(att.size)})
                                      </span>
                                    </div>

                                    <div className="tasks-attachment-actions">
                                      <a
                                        href={att.url}
                                        download={att.name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary tasks-attachment-dl-btn"
                                      >
                                        <Download size={14} /> 다운로드
                                      </a>
                                      {!isViewer && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveAttachment(att)}
                                          className="btn btn-secondary tasks-attachment-del-btn"
                                          title="첨부 파일 삭제"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 6. 외부 시스템 연동 카드 (Workspace 기획서 · Figma 디자인 · Notion 일감 통합 허브) */}
                      <div className={`tasks-integrations-grid ${gridColClass}`}>
                        {activeWpId && activeWpViewerUrl && (
                          <div className="tasks-integration-card is-workspace">
                            <div className="tasks-integration-card-top">
                              <span className="tasks-badge-workspace">
                                기획서 v{editingTask?.version || '0.1'}
                              </span>
                              <span className="tasks-integration-meta">
                                워크스페이스 ({activeWpId})
                                {editingTask?.period ? ` · ${editingTask.period}` : ''}
                              </span>
                            </div>
                            <div className="tasks-integration-card-actions">
                              <a
                                href={activeWpViewerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary tasks-single-link-open-btn"
                              >
                                <ExternalLink size={14} /> 기획서 뷰어
                              </a>
                              <a
                                href="https://bychoi-space.github.io/workspace/index.html"
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary tasks-single-link-open-btn"
                              >
                                <ExternalLink size={14} /> 워크스페이스
                              </a>
                            </div>
                          </div>
                        )}

                        {activeFigmaUrl && (
                          <div className="tasks-integration-card is-figma">
                            <div className="tasks-integration-card-top">
                              <span className="tasks-badge-figma">Figma 시안</span>
                              <span className="tasks-integration-meta">
                                {resolveFigmaMetaLabel(activeFigmaUrl)}
                              </span>
                            </div>
                            <div className="tasks-integration-card-actions">
                              <a
                                href={activeFigmaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary tasks-single-link-open-btn"
                              >
                                <ExternalLink size={14} /> Figma 시안 열기
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="tasks-integration-card is-notion">
                          {isNotionLinked ? (
                            <>
                              <div className="tasks-integration-card-top">
                                <span className="tasks-badge-notion">Notion 연동</span>
                                <span className="tasks-integration-meta">
                                  Sisun-Tasks 양방향 동기화 적용됨
                                </span>
                              </div>
                              {editingTask?.notionUrl && (
                                <div className="tasks-integration-card-actions">
                                  <a
                                    href={editingTask.notionUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary tasks-single-link-open-btn"
                                  >
                                    <ExternalLink size={14} /> Notion 열기
                                  </a>
                                </div>
                              )}
                            </>
                          ) : (
                            <label className="tasks-notion-checkbox-label">
                              <input
                                type="checkbox"
                                disabled={isViewer}
                                checked={formData.syncToNotion}
                                onChange={(e) =>
                                  setFormData({ ...formData, syncToNotion: e.target.checked })
                                }
                                className="tasks-notion-checkbox"
                              />
                              <span>
                                저장 시 Notion (Sisun-Tasks)에 과제를 동시 생성하고 양방향 동기화 연결
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

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
