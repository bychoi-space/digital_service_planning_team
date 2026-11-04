import React, { useState, useMemo, useEffect } from 'react';
import type {
  VacationItem,
  VacationType,
  User,
  TaskItem,
  TaskTrack,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types';
import {
  PlanningStorageService,
  computeTaskStatusByDates,
  getTodayDateString,
} from '../services/storage';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserX,
  UserCheck,
  Trash2,
  X,
  FileText,
  Palette,
  Code,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface VacationsViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigateToTasks?: () => void;
}

const VACATION_TYPES: { key: VacationType; label: string; classKey: string }[] = [
  { key: 'annual', label: '연차', classKey: 'vac-annual' },
  { key: 'morning_half', label: '오전반차', classKey: 'vac-morning-half' },
  { key: 'afternoon_half', label: '오후반차', classKey: 'vac-afternoon-half' },
  { key: 'special', label: '경조사', classKey: 'vac-special' },
  { key: 'substitute', label: '대체휴가', classKey: 'vac-substitute' },
  { key: 'other', label: '기타/공가', classKey: 'vac-other' },
];

const TRACK_CONFIG: Record<
  TaskTrack,
  {
    label: string;
    enLabel: string;
    classKey: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  기획: {
    label: '기획',
    enLabel: 'Planning',
    classKey: 'track-planning',
    icon: FileText,
  },
  디자인: {
    label: '디자인',
    enLabel: 'Design',
    classKey: 'track-design',
    icon: Palette,
  },
  퍼블리싱: {
    label: '퍼블리싱',
    enLabel: 'Publishing',
    classKey: 'track-publishing',
    icon: Code,
  },
};

const TRACK_LIST: TaskTrack[] = ['기획', '디자인', '퍼블리싱'];

const TASK_CATEGORIES: TaskCategory[] = [
  '신규기획',
  '기능개선',
  '서비스운영',
  '데이터분석',
  '협업지원',
  '정책수립',
  '기획전',
];

const TASK_PRIORITIES: { key: TaskPriority; label: string; classKey: string }[] = [
  { key: 'urgent', label: '긴급', classKey: 'priority-urgent' },
  { key: 'high', label: '높음', classKey: 'priority-high' },
  { key: 'medium', label: '보통', classKey: 'priority-medium' },
  { key: 'low', label: '낮음', classKey: 'priority-low' },
];

const TASK_STATUSES: { key: TaskStatus; label: string; shortLabel: string; classKey: string }[] = [
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

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekdayLabel(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return WEEKDAY_NAMES[d.getDay()] || '';
}

// 캘린더 셀 내부 배지용 과제명 요약 헬퍼 (원문은 툴팁/상세 모달에서 그대로 노출)
function summarizeCalendarTaskTitle(rawTitle: string): string {
  let text = (rawTitle || '').trim();

  // 1. 앞머리 연도 표기 제거 (예: "2027년 자사몰·어드민..." -> "자사몰·어드민...")
  text = text.replace(/^20\d{2}년\s+/, '');

  // 2. 앞머리 대괄호 말머리 요약/생략
  const bracketMatch = text.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (bracketMatch) {
    const prefix = bracketMatch[1].trim();
    const rest = bracketMatch[2].trim().replace(/^20\d{2}년\s+/, '');
    if (rest.length >= 5) {
      text = rest;
    } else {
      const shortPrefix = prefix
        .replace(/Front\s*UI\s*Renewal/i, 'UI개편')
        .replace(/Renewal/i, '개편')
        .trim();
      text = `[${shortPrefix}] ${rest}`;
    }
  }

  return text.replace(/\s+/g, ' ').trim();
}

export const VacationsView: React.FC<VacationsViewProps> = ({
  currentUser,
  isViewer,
  onShowToast,
}) => {
  const [todayStr] = useState<string>(() => formatLocalDate(new Date()));

  const [vacations, setVacations] = useState<VacationItem[]>(() => PlanningStorageService.getVacations());
  const [tasks, setTasks] = useState<TaskItem[]>(() => PlanningStorageService.getTasks());
  const [teamMembers, setTeamMembers] = useState<User[]>(() =>
    PlanningStorageService.getServicePlanningMembers()
  );

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(todayStr);

  // 필터 상태: 'all' | 'vacation' | '기획' | '디자인' | '퍼블리싱'
  const [filterType, setFilterType] = useState<'all' | 'vacation' | TaskTrack>('all');
  const [onlyActiveTasks, setOnlyActiveTasks] = useState<boolean>(false);

  // 휴가 모달 상태
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationItem | null>(null);

  // 업무 등록/상세/수정 통합 모달 상태 (서비스기획 업무 관리 화면과 100% 동일)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // 일자별 전체 일정 더보기 모달 (데스크톱/태블릿용)
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    vacations: VacationItem[];
    tasks: TaskItem[];
  } | null>(null);

  const resolveDefaultMember = (members: User[]): User => {
    const matched = members.find(
      (m) => String(m.id) === String(currentUser.id) || m.name.trim() === currentUser.name.trim()
    );
    if (matched) return matched;
    if (currentUser.role !== 'viewer') return currentUser;
    return members[0] || currentUser;
  };

  const [taskFormData, setTaskFormData] = useState(() => {
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
    };
  });

  // 업무 등록 모달 열기
  const handleOpenCreateTaskModal = () => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 새 업무를 등록할 수 없습니다.', 'error');
      return;
    }
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);
    const defaultAssignee = resolveDefaultMember(latestMembers);
    const defaultStart = getTodayDateString();
    const defaultDue = getDatePlusDaysString(14);
    const defaultTrack: TaskTrack =
      filterType === '기획' || filterType === '디자인' || filterType === '퍼블리싱'
        ? filterType
        : '기획';

    setEditingTask(null);
    setTaskFormData({
      title: '',
      category: '신규기획',
      track: defaultTrack,
      assigneeId: defaultAssignee.id,
      assigneeName: defaultAssignee.name,
      priority: 'medium',
      status: computeTaskStatusByDates(defaultStart, defaultDue),
      startDate: defaultStart,
      dueDate: defaultDue,
      description: '',
      linkUrl: '',
    });
    setIsTaskModalOpen(true);

    PlanningStorageService.syncFromSupabase().then(() => {
      setTeamMembers(PlanningStorageService.getServicePlanningMembers());
    });
  };

  // 업무 상세 조회 및 수정 모달 열기 (서비스기획 업무 관리와 동일)
  const handleOpenEditTaskModal = (task: TaskItem) => {
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);
    const matchedAssignee = latestMembers.find(
      (m) => String(m.id) === String(task.assigneeId) || m.name.trim() === task.assigneeName?.trim()
    );

    setEditingTask(task);
    setTaskFormData({
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
      linkUrl: task.links?.[0]?.url || task.artifactUrl || '',
    });
    setIsTaskModalOpen(true);
  };

  // 업무 저장 (신규 등록 / 기존 수정 통합)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 변경 사항을 저장할 수 없습니다.', 'error');
      return;
    }

    if (!taskFormData.title.trim()) {
      onShowToast('업무 제목을 입력해 주세요.', 'error');
      return;
    }

    if (
      taskFormData.startDate &&
      taskFormData.dueDate &&
      taskFormData.startDate > taskFormData.dueDate
    ) {
      onShowToast('마감일은 시작일보다 이전일 수 없습니다.', 'error');
      return;
    }

    const autoStatus = computeTaskStatusByDates(taskFormData.startDate, taskFormData.dueDate);
    const trimmedUrl = taskFormData.linkUrl.trim();
    const normalizedLinks = trimmedUrl ? [{ title: '산출물 링크', url: trimmedUrl }] : [];

    try {
      if (editingTask) {
        PlanningStorageService.updateTask(
          editingTask.id,
          {
            title: taskFormData.title.trim(),
            category: taskFormData.category,
            track: taskFormData.track,
            assigneeId: taskFormData.assigneeId,
            assigneeName: taskFormData.assigneeName,
            priority: taskFormData.priority,
            status: autoStatus,
            startDate: taskFormData.startDate,
            dueDate: taskFormData.dueDate,
            description: taskFormData.description,
            links: normalizedLinks,
          },
          currentUser
        );
        onShowToast(`[${taskFormData.track}] 업무 정보가 성공적으로 수정되었습니다.`, 'success');
      } else {
        PlanningStorageService.createTask(
          {
            title: taskFormData.title.trim(),
            category: taskFormData.category,
            track: taskFormData.track,
            assigneeId: taskFormData.assigneeId,
            assigneeName: taskFormData.assigneeName,
            priority: taskFormData.priority,
            status: autoStatus,
            startDate: taskFormData.startDate,
            dueDate: taskFormData.dueDate,
            progress: autoStatus === 'done' ? 100 : 0,
            description: taskFormData.description,
            links: normalizedLinks,
          },
          currentUser
        );
        onShowToast(`새로운 [${taskFormData.track}] 업무가 등록되었습니다.`, 'success');
      }
      setIsTaskModalOpen(false);
      refreshAll();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '작업 중 오류가 발생했습니다.';
      onShowToast(errorMsg, 'error');
    }
  };

  // 업무 삭제
  const handleDeleteTask = (taskId: string, title: string) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 삭제할 수 없습니다.', 'error');
      return;
    }
    if (window.confirm(`정말 "${title}" 업무를 삭제하시겠습니까? (감사 로그에 영구 기록됩니다)`)) {
      PlanningStorageService.deleteTask(taskId);
      onShowToast('업무가 삭제되었습니다.', 'info');
      setIsTaskModalOpen(false);
      refreshAll();
    }
  };

  const [formData, setFormData] = useState(() => {
    const initialMembers = PlanningStorageService.getServicePlanningMembers();
    const defaultUser =
      initialMembers.find(
        (m) => String(m.id) === String(currentUser.id) || m.name.trim() === currentUser.name.trim()
      ) ||
      (currentUser.role !== 'viewer' ? currentUser : initialMembers[0]) ||
      currentUser;
    const defaultDeputy =
      initialMembers.find((m) => String(m.id) !== String(defaultUser.id)) || defaultUser;

    return {
      userId: defaultUser.id,
      userName: defaultUser.name,
      department: '서비스기획팀',
      type: 'annual' as VacationType,
      startDate: todayStr,
      endDate: todayStr,
      deputyId: defaultDeputy.id,
      deputyName: defaultDeputy.name,
      contact: '',
      notes: '',
    };
  });

  const refreshAll = () => {
    setVacations(PlanningStorageService.getVacations());
    setTasks(PlanningStorageService.getTasks());
    setTeamMembers(PlanningStorageService.getServicePlanningMembers());
  };

  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshAll();
    };
    window.addEventListener('ds-portal-tasks-updated', handleStorageUpdate);
    PlanningStorageService.syncWithNotion();
    return () => {
      window.removeEventListener('ds-portal-tasks-updated', handleStorageUpdate);
    };
  }, []);

  // 모달 열기 (신규 휴가 신청 - 기본 대상자를 현재 로그인된 서비스기획팀원으로 지정)
  const handleOpenCreateModal = (presetDate?: string) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 휴가를 등록할 수 없습니다.', 'error');
      return;
    }
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);

    const defaultUser = resolveDefaultMember(latestMembers);
    const defaultDeputy =
      latestMembers.find((m) => String(m.id) !== String(defaultUser.id)) || defaultUser;
    const targetDate = presetDate || todayStr;

    setEditingVacation(null);
    setFormData({
      userId: defaultUser.id,
      userName: defaultUser.name,
      department: '서비스기획팀',
      type: 'annual',
      startDate: targetDate,
      endDate: targetDate,
      deputyId: defaultDeputy.id,
      deputyName: defaultDeputy.name,
      contact: '010-',
      notes: '',
    });
    setIsVacationModalOpen(true);

    PlanningStorageService.syncFromSupabase().then(() => {
      setTeamMembers(PlanningStorageService.getServicePlanningMembers());
    });
  };

  // 모달 열기 (휴가 수정 or 상세)
  const handleOpenEditModal = (item: VacationItem) => {
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);

    const matchedUser = latestMembers.find(
      (m) => String(m.id) === String(item.userId) || m.name.trim() === item.userName?.trim()
    );
    const matchedDeputy = latestMembers.find(
      (m) => String(m.id) === String(item.deputyId) || m.name.trim() === item.deputyName?.trim()
    );

    setEditingVacation(item);
    setFormData({
      userId: matchedUser ? matchedUser.id : item.userId,
      userName: matchedUser ? matchedUser.name : item.userName,
      department: item.department || '서비스기획팀',
      type: item.type,
      startDate: item.startDate,
      endDate: item.endDate,
      deputyId: matchedDeputy ? matchedDeputy.id : item.deputyId,
      deputyName: matchedDeputy ? matchedDeputy.name : item.deputyName,
      contact: item.contact,
      notes: item.notes,
    });
    setIsVacationModalOpen(true);
  };

  // 휴가 저장 처리
  const handleSaveVacation = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 변경할 수 없습니다.', 'error');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      onShowToast('종료일은 시작일보다 이전일 수 없습니다.', 'error');
      return;
    }

    try {
      if (editingVacation) {
        PlanningStorageService.updateVacation(editingVacation.id, {
          userId: formData.userId,
          userName: formData.userName,
          department: formData.department,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          deputyId: formData.deputyId,
          deputyName: formData.deputyName,
          contact: formData.contact,
          notes: formData.notes,
        });
        onShowToast('휴가 일정이 수정되었습니다.', 'success');
      } else {
        PlanningStorageService.createVacation({
          userId: formData.userId,
          userName: formData.userName,
          department: formData.department,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          deputyId: formData.deputyId,
          deputyName: formData.deputyName,
          contact: formData.contact,
          notes: formData.notes,
        });
        onShowToast('휴가 일정이 등록되었습니다.', 'success');
      }
      setIsVacationModalOpen(false);
      refreshAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '처리 중 오류 발생';
      onShowToast(msg, 'error');
    }
  };

  // 휴가 삭제 처리
  const handleDeleteVacation = (id: string, name: string) => {
    if (isViewer) return;
    if (window.confirm(`정말 ${name} 님의 휴가 일정을 취소하시겠습니까?`)) {
      PlanningStorageService.deleteVacation(id);
      onShowToast('휴가 일정이 취소되었습니다.', 'info');
      setIsVacationModalOpen(false);
      refreshAll();
    }
  };

  // 캘린더 네비게이션
  const handlePrevMonth = () => {
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(nextMonthDate);
    setSelectedMobileDate(formatLocalDate(nextMonthDate));
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(nextMonthDate);
    setSelectedMobileDate(formatLocalDate(nextMonthDate));
  };

  const handleSetToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedMobileDate(formatLocalDate(now));
  };

  // 특정 일자의 필터링된 휴가/업무 반환 헬퍼
  const getDaySchedules = (dateStr: string) => {
    const dayVacations =
      filterType === 'all' || filterType === 'vacation'
        ? vacations.filter((v) => dateStr >= v.startDate && dateStr <= v.endDate)
        : [];

    let dayTasks =
      filterType === 'vacation'
        ? []
        : tasks.filter(
            (t) =>
              Boolean(t.startDate && t.dueDate) &&
              dateStr >= t.startDate &&
              dateStr <= t.dueDate
          );

    if (filterType === '기획' || filterType === '디자인' || filterType === '퍼블리싱') {
      dayTasks = dayTasks.filter((t) => t.track === filterType);
    }

    if (onlyActiveTasks) {
      dayTasks = dayTasks.filter((t) => ['in_progress', 'review'].includes(t.status));
    }

    // 파트 순서 (기획 -> 디자인 -> 퍼블리싱) 1순위, 동일 파트 내 시작일·마감일·제목 순 정렬
    const trackOrder: Record<string, number> = {
      기획: 0,
      디자인: 1,
      퍼블리싱: 2,
    };
    dayTasks = [...dayTasks].sort((a, b) => {
      const trackDiff = (trackOrder[a.track] ?? 0) - (trackOrder[b.track] ?? 0);
      if (trackDiff !== 0) return trackDiff;
      const startDiff = (a.startDate || '').localeCompare(b.startDate || '');
      if (startDiff !== 0) return startDiff;
      const dueDiff = (a.dueDate || '').localeCompare(b.dueDate || '');
      if (dueDiff !== 0) return dueDiff;
      return (a.title || '').localeCompare(b.title || '');
    });

    return { dayVacations, dayTasks };
  };

  // 캘린더 날짜 매트릭스 계산
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0(일) ~ 6(토)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // 이전 달 잔여일
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: formatLocalDate(prevDate),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // 현재 달 날짜
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${year}-${monthStr}-${dayStr}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // 다음 달 날짜 채우기 (총 35 or 42 셀)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dateStr: formatLocalDate(nextDate),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // 오늘 부재자 계산
  const todayAbsentList = vacations.filter(
    (v) => todayStr >= v.startDate && todayStr <= v.endDate
  );

  // 실시간 진행 업무 통계 계산
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => ['in_progress', 'review'].includes(t.status));
  }, [tasks]);

  const planningActiveTasksCount = activeTasks.filter((t) => t.track === '기획').length;
  const designActiveTasksCount = activeTasks.filter((t) => t.track === '디자인').length;
  const publishingActiveTasksCount = activeTasks.filter((t) => t.track === '퍼블리싱').length;

  // 모바일 선택 일자 상세 데이터
  const { dayVacations: mobileSelectedVacations, dayTasks: mobileSelectedTasks } =
    getDaySchedules(selectedMobileDate);
  const mobileSelectedData = {
    dateStr: selectedMobileDate,
    weekday: getWeekdayLabel(selectedMobileDate),
    vacations: mobileSelectedVacations,
    tasks: mobileSelectedTasks,
  };

  return (
    <div className="schedule-container">
      {/* 1. 상단 2열 대시보드 위젯 (부재 현황 + 진행 업무 현황) */}
      <div className="schedule-summary-grid">
        {/* 카드 1: 오늘의 팀원 부재 현황 */}
        <div className="card schedule-summary-card">
          <div className="schedule-summary-main">
            <div
              className={`schedule-summary-icon ${
                todayAbsentList.length > 0 ? 'is-absent' : 'is-present'
              }`}
            >
              {todayAbsentList.length > 0 ? <UserX size={22} /> : <UserCheck size={22} />}
            </div>
            <div className="schedule-summary-info">
              <div className="schedule-summary-title-row">
                <h3 className="schedule-summary-title">오늘의 팀원 부재 현황</h3>
                <span
                  className={`schedule-summary-pill ${
                    todayAbsentList.length > 0 ? 'is-absent' : 'is-present'
                  }`}
                >
                  {todayAbsentList.length}명 부재
                </span>
              </div>
              <p className="schedule-summary-desc">
                {todayAbsentList.length > 0
                  ? `${todayAbsentList
                      .map(
                        (v) =>
                          `${v.userName} (${
                            VACATION_TYPES.find((t) => t.key === v.type)?.label || '휴가'
                          })`
                      )
                      .join(', ')} 부재 중입니다.`
                  : '오늘 부재 중인 팀원이 없습니다. 전원 정상 근무 중입니다.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="btn btn-primary schedule-summary-action-btn"
            disabled={isViewer}
            title={isViewer ? '유관부서 모드에서는 등록이 제한됩니다' : '휴가 등록'}
          >
            <Plus size={16} /> 휴가 신청
          </button>
        </div>

        {/* 카드 2: 실시간 진행 업무 현황 (기획 · 디자인 · 퍼블리싱) */}
        <div className="card schedule-summary-card">
          <div className="schedule-summary-main">
            <div className="schedule-summary-icon is-tasks">
              <Sparkles size={22} />
            </div>
            <div className="schedule-summary-info">
              <div className="schedule-summary-title-row">
                <h3 className="schedule-summary-title">진행 중인 기획·디자인·퍼블 업무</h3>
                <span className="schedule-summary-pill is-tasks">
                  총 {activeTasks.length}건 진행중
                </span>
              </div>
              <div className="schedule-summary-tracks">
                <span className="schedule-track-chip track-planning">
                  <FileText size={14} /> 기획 {planningActiveTasksCount}건
                </span>
                <span className="schedule-track-chip track-design">
                  <Palette size={14} /> 디자인 {designActiveTasksCount}건
                </span>
                <span className="schedule-track-chip track-publishing">
                  <Code size={14} /> 퍼블리싱 {publishingActiveTasksCount}건
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateTaskModal}
            className="btn btn-primary schedule-summary-action-btn"
            disabled={isViewer}
            title={
              isViewer
                ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다'
                : '새 기획/디자인/퍼블리싱 업무 등록'
            }
          >
            <Plus size={16} /> 업무 등록
          </button>
        </div>
      </div>

      {/* 2. 캘린더 네비게이션 & 파트 필터 바 */}
      <div className="card schedule-control-card">
        {/* 상단 컨트롤 라인: 월 이동 */}
        <div className="schedule-nav-bar">
          <div className="schedule-month-nav">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="btn btn-secondary schedule-month-arrow-btn"
              title="이전 달"
              aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="schedule-month-title">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="btn btn-secondary schedule-month-arrow-btn"
              title="다음 달"
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="btn btn-secondary schedule-today-btn"
            >
              이번 달
            </button>
          </div>
        </div>

        {/* 하단 필터 바: 파트별 토글 필터 칩 */}
        <div className="schedule-filter-bar">
          <div className="schedule-filter-group">
            <span className="schedule-filter-label">일정 필터:</span>

            <div className="schedule-filter-chips">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`schedule-filter-chip chip-all ${filterType === 'all' ? 'active' : ''}`}
              >
                <span>전체 일정</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('vacation')}
                className={`schedule-filter-chip chip-vacation ${
                  filterType === 'vacation' ? 'active' : ''
                }`}
              >
                <CalendarIcon size={14} />
                <span>휴가 일정 ({vacations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('기획')}
                className={`schedule-filter-chip chip-planning ${
                  filterType === '기획' ? 'active' : ''
                }`}
              >
                <FileText size={14} />
                <span>기획 업무 ({tasks.filter((t) => t.track === '기획').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('디자인')}
                className={`schedule-filter-chip chip-design ${
                  filterType === '디자인' ? 'active' : ''
                }`}
              >
                <Palette size={14} />
                <span>디자인 업무 ({tasks.filter((t) => t.track === '디자인').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('퍼블리싱')}
                className={`schedule-filter-chip chip-publishing ${
                  filterType === '퍼블리싱' ? 'active' : ''
                }`}
              >
                <Code size={14} />
                <span>퍼블리싱 업무 ({tasks.filter((t) => t.track === '퍼블리싱').length})</span>
              </button>
            </div>
          </div>

          {/* 진행/검토 중 업무만 보기 토글 체크박스 */}
          <label className="schedule-active-only-toggle">
            <input
              type="checkbox"
              checked={onlyActiveTasks}
              onChange={(e) => setOnlyActiveTasks(e.target.checked)}
            />
            <span>진행·검토 중 업무만 캘린더에 표시</span>
          </label>
        </div>
      </div>

      {/* 3. 월간 종합 캘린더 뷰 */}
      <div className="schedule-calendar-section">
          <div className="card schedule-calendar-card">
            {/* 요일 헤더 (일: 레드, 토: 블루) */}
            <div className="schedule-weekdays">
              <div className="schedule-weekday is-sun">
                <span className="weekday-full">일 (Sun)</span>
                <span className="weekday-short">일</span>
              </div>
              <div className="schedule-weekday">월</div>
              <div className="schedule-weekday">화</div>
              <div className="schedule-weekday">수</div>
              <div className="schedule-weekday">목</div>
              <div className="schedule-weekday">금</div>
              <div className="schedule-weekday is-sat">
                <span className="weekday-full">토 (Sat)</span>
                <span className="weekday-short">토</span>
              </div>
            </div>

            {/* 달력 날짜 그리드 (7열 균등 분할) */}
            <div className="schedule-calendar-grid">
              {calendarDays.map((cell, idx) => {
                const dayOfWeek = idx % 7;
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const isToday = cell.dateStr === todayStr;
                const isMobileSelected = cell.dateStr === selectedMobileDate;

                const { dayVacations: cellVacations, dayTasks: cellTasks } = getDaySchedules(
                  cell.dateStr
                );
                const totalItemsCount = cellVacations.length + cellTasks.length;

                // 최대 10개 항목까지 노출하고 초과분은 '+N개 더보기' 버튼으로 처리
                const MAX_DISPLAY = 10;
                const displayVacations = cellVacations.slice(0, MAX_DISPLAY);
                const remainingSlots = Math.max(0, MAX_DISPLAY - displayVacations.length);
                const displayTasks = cellTasks.slice(0, remainingSlots);
                const overflowCount =
                  totalItemsCount - (displayVacations.length + displayTasks.length);

                const cellClasses = [
                  'schedule-day-cell',
                  !cell.isCurrentMonth ? 'is-outside' : '',
                  cell.isCurrentMonth && isSunday ? 'is-sunday' : '',
                  cell.isCurrentMonth && isSaturday ? 'is-saturday' : '',
                  isToday ? 'is-today' : '',
                  isMobileSelected ? 'is-mobile-selected' : '',
                  isViewer ? 'is-viewer' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={idx}
                    className={cellClasses}
                    onClick={() => {
                      setSelectedMobileDate(cell.dateStr);
                      if (typeof window !== 'undefined' && window.innerWidth > 767 && !isViewer) {
                        handleOpenCreateModal(cell.dateStr);
                      }
                    }}
                  >
                    {/* 날짜 상단 헤더 */}
                    <div className="schedule-day-header">
                      <span
                        className={`schedule-day-num ${isToday ? 'is-today' : ''} ${
                          isSunday ? 'is-sun' : isSaturday ? 'is-sat' : ''
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {totalItemsCount > 0 && (
                        <span
                          className="schedule-day-count"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayDetail({
                              dateStr: cell.dateStr,
                              dayNum: cell.dayNum,
                              vacations: cellVacations,
                              tasks: cellTasks,
                            });
                          }}
                          title="해당 일자 전체 일정 보기"
                        >
                          {totalItemsCount}건
                        </span>
                      )}
                    </div>

                    {/* 데스크톱 & 태블릿용 일정 배지 목록 */}
                    <div className="schedule-day-events">
                      {/* A. 휴가 배지 노출 */}
                      {displayVacations.map((v) => {
                        const typeConfig =
                          VACATION_TYPES.find((t) => t.key === v.type) || VACATION_TYPES[0];
                        return (
                          <div
                            key={`vac-${v.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(v);
                            }}
                            className={`schedule-event-badge is-vacation ${typeConfig.classKey}`}
                            title={`[휴가] ${v.userName} (${typeConfig.label}) / 대리: ${v.deputyName}`}
                          >
                            <span className="schedule-event-text">
                              {v.userName.split(' ')[0]} ({typeConfig.label})
                            </span>
                          </div>
                        );
                      })}

                      {/* B. 업무 배지 노출 (요약 과제명, 컬러로 파트 구분) */}
                      {displayTasks.map((t) => {
                        const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                        const summaryTitle = summarizeCalendarTaskTitle(t.title);

                        return (
                          <div
                            key={`task-${t.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditTaskModal(t);
                            }}
                            className={`schedule-event-badge is-task ${trackCfg.classKey}`}
                            title={`[${t.track}] ${t.title} (${t.assigneeName}) / 기간: ${t.startDate} ~ ${t.dueDate}`}
                          >
                            <span className="schedule-event-text">{summaryTitle}</span>
                          </div>
                        );
                      })}

                      {/* C. 10개 초과 시 '+N개 더보기' 버튼 */}
                      {overflowCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayDetail({
                              dateStr: cell.dateStr,
                              dayNum: cell.dayNum,
                              vacations: cellVacations,
                              tasks: cellTasks,
                            });
                          }}
                          className="schedule-more-btn"
                        >
                          +{overflowCount}개 더보기
                        </button>
                      )}
                    </div>

                    {/* 모바일 전용 컬러 인디케이터 도트 */}
                    {totalItemsCount > 0 && (
                      <div className="schedule-mobile-dots" aria-hidden="true">
                        {cellVacations.slice(0, 2).map((v) => (
                          <span key={`mdot-v-${v.id}`} className="schedule-dot is-vacation" />
                        ))}
                        {cellTasks.slice(0, 3).map((t) => {
                          const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                          return (
                            <span
                              key={`mdot-t-${t.id}`}
                              className={`schedule-dot ${trackCfg.classKey}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 모바일 전용: 선택된 날짜의 상세 일정 패널 (767px 이하 노출) */}
          <div className="card schedule-mobile-day-panel">
            <div className="schedule-mobile-day-header">
              <div className="schedule-mobile-day-title-wrap">
                <CalendarIcon size={17} className="schedule-mobile-day-icon" />
                <h3 className="schedule-mobile-day-title">
                  {mobileSelectedData.dateStr} ({mobileSelectedData.weekday}) 일정
                </h3>
                <span className="schedule-mobile-day-badge">
                  총 {mobileSelectedData.vacations.length + mobileSelectedData.tasks.length}건
                </span>
              </div>

              {!isViewer && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(mobileSelectedData.dateStr)}
                  className="btn btn-primary schedule-mobile-add-btn"
                >
                  <Plus size={15} /> 휴가 신청
                </button>
              )}
            </div>

            {mobileSelectedData.vacations.length === 0 &&
            mobileSelectedData.tasks.length === 0 ? (
              <div className="schedule-mobile-empty">
                선택한 일자에 등록된 휴가나 진행 업무가 없습니다.
              </div>
            ) : (
              <div className="schedule-mobile-agenda-list">
                {/* 선택 일자 휴가 카드 */}
                {mobileSelectedData.vacations.map((v) => {
                  const typeConfig =
                    VACATION_TYPES.find((t) => t.key === v.type) || VACATION_TYPES[0];
                  return (
                    <div
                      key={`mob-vac-${v.id}`}
                      onClick={() => handleOpenEditModal(v)}
                      className={`schedule-mobile-agenda-item is-vacation ${typeConfig.classKey}`}
                    >
                      <div className="schedule-mobile-agenda-top">
                        <span className={`schedule-type-badge ${typeConfig.classKey}`}>
                          휴가 · {typeConfig.label}
                        </span>
                        <span className="schedule-mobile-agenda-period">
                          {v.startDate} ~ {v.endDate}
                        </span>
                      </div>
                      <div className="schedule-mobile-agenda-main">
                        <strong className="schedule-mobile-agenda-name">{v.userName}</strong>
                        <span className="schedule-mobile-agenda-sub">
                          업무 대행자: {v.deputyName || '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 선택 일자 업무 카드 */}
                {mobileSelectedData.tasks.map((t) => {
                  const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                  const TrackIcon = trackCfg.icon;
                  return (
                    <div
                      key={`mob-task-${t.id}`}
                      onClick={() => handleOpenEditTaskModal(t)}
                      className={`schedule-mobile-agenda-item is-task ${trackCfg.classKey}`}
                    >
                      <div className="schedule-mobile-agenda-top">
                        <div className="schedule-mobile-agenda-badges">
                          <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                            <TrackIcon size={13} /> {trackCfg.label}
                          </span>
                          <span className="tasks-badge-category">{t.category}</span>
                        </div>
                        <span className="schedule-mobile-agenda-assignee">
                          <UserCheck size={14} /> {t.assigneeName}
                        </span>
                      </div>
                      <div className="schedule-mobile-agenda-title">{t.title}</div>
                      <div className="schedule-mobile-agenda-period">
                        <Clock size={14} /> {t.startDate} ~ {t.dueDate}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* 4. 휴가 등록/수정 모달 */}
      {isVacationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsVacationModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingVacation
                  ? isViewer
                    ? '휴가 상세 정보 (읽기 전용)'
                    : '휴가 일정 수정'
                  : '팀원 휴가 일정 등록'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVacationModalOpen(false)}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVacation} className="tasks-modal-form">
              <div className="modal-body">
                {/* 대상자 & 유형 */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">휴가 대상자 *</label>
                    <select
                      disabled={isViewer}
                      value={formData.userId}
                      onChange={(e) => {
                        const target = teamMembers.find(
                          (m) => String(m.id) === String(e.target.value)
                        );
                        setFormData({
                          ...formData,
                          userId: e.target.value,
                          userName: target ? target.name : formData.userName,
                        });
                      }}
                      className="form-select"
                    >
                      {!teamMembers.some((m) => String(m.id) === String(formData.userId)) &&
                        formData.userName && (
                          <option value={formData.userId}>{formData.userName}</option>
                        )}
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">휴가 유형 *</label>
                    <select
                      disabled={isViewer}
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as VacationType })
                      }
                      className="form-select"
                    >
                      {VACATION_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 기간 */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">시작일 *</label>
                    <input
                      type="date"
                      disabled={isViewer}
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">종료일 *</label>
                    <input
                      type="date"
                      disabled={isViewer}
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 대리업무자 & 연락처 */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">업무 대행자 (대리자) *</label>
                    <select
                      disabled={isViewer}
                      value={formData.deputyId}
                      onChange={(e) => {
                        const dep = teamMembers.find(
                          (m) => String(m.id) === String(e.target.value)
                        );
                        setFormData({
                          ...formData,
                          deputyId: e.target.value,
                          deputyName: dep ? dep.name : formData.deputyName,
                        });
                      }}
                      className="form-select"
                    >
                      {!teamMembers.some((m) => String(m.id) === String(formData.deputyId)) &&
                        formData.deputyName && (
                          <option value={formData.deputyId}>{formData.deputyName}</option>
                        )}
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">비상연락망</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      placeholder="010-XXXX-XXXX"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 인수인계 메모 */}
                <div className="form-group">
                  <label className="form-label">인수인계 사항 및 사유</label>
                  <textarea
                    disabled={isViewer}
                    rows={3}
                    placeholder="부재 중 긴급 대응 방법이나 완료된 기획건을 인수인계 메모로 남겨주세요..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                {/* 감사 추적 정보 표시 */}
                {editingVacation && (
                  <div className="tasks-audit-bar">
                    <span>
                      최초 등록: <strong>{editingVacation.createdBy}</strong> (
                      {new Date(editingVacation.createdAt).toLocaleString('ko-KR')})
                    </span>
                    <span>
                      최종 수정: <strong>{editingVacation.updatedBy}</strong> (
                      {new Date(editingVacation.updatedAt).toLocaleString('ko-KR')})
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {editingVacation && !isViewer && (
                  <button
                    type="button"
                    onClick={() => handleDeleteVacation(editingVacation.id, editingVacation.userName)}
                    className="btn btn-danger tasks-modal-delete-btn"
                  >
                    <Trash2 size={15} /> 일정 취소
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsVacationModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {isViewer ? '닫기' : '취소'}
                </button>
                {!isViewer && (
                  <button type="submit" className="btn btn-primary">
                    {editingVacation ? '수정 완료' : '등록 완료'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 일자별 전체 일정 더보기 모달 (Day Schedule Modal) */}
      {selectedDayDetail && (
        <div className="modal-overlay" onClick={() => setSelectedDayDetail(null)}>
          <div className="modal-box schedule-day-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="tasks-modal-header-left">
                <CalendarIcon size={18} className="schedule-mobile-day-icon" />
                <h3 className="modal-title">
                  {selectedDayDetail.dateStr} 전체 일정 (총{' '}
                  {selectedDayDetail.vacations.length + selectedDayDetail.tasks.length}건)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body schedule-modal-stack">
              {/* 휴가 일정 목록 */}
              <div>
                <h4 className="schedule-day-modal-section-title">
                  팀원 휴가 및 부재 ({selectedDayDetail.vacations.length}건)
                </h4>
                {selectedDayDetail.vacations.length === 0 ? (
                  <div className="schedule-day-modal-empty">등록된 휴가 일정이 없습니다.</div>
                ) : (
                  <div className="schedule-mobile-agenda-list">
                    {selectedDayDetail.vacations.map((v) => {
                      const typeConfig =
                        VACATION_TYPES.find((t) => t.key === v.type) || VACATION_TYPES[0];
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedDayDetail(null);
                            handleOpenEditModal(v);
                          }}
                          className={`schedule-mobile-agenda-item is-vacation ${typeConfig.classKey}`}
                        >
                          <div className="schedule-mobile-agenda-top">
                            <div className="schedule-mobile-user-wrap">
                              <strong className="schedule-mobile-user-name">{v.userName}</strong>
                              <span className={`schedule-type-badge ${typeConfig.classKey}`}>
                                {typeConfig.label}
                              </span>
                              <span className="schedule-mobile-agenda-sub">
                                (대행: {v.deputyName})
                              </span>
                            </div>
                            <span className="schedule-mobile-agenda-period">
                              {v.startDate} ~ {v.endDate}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 진행 업무 목록 */}
              <div>
                <h4 className="schedule-day-modal-section-title">
                  서비스기획 진행 업무 ({selectedDayDetail.tasks.length}건)
                </h4>
                {selectedDayDetail.tasks.length === 0 ? (
                  <div className="schedule-day-modal-empty">
                    해당 일자에 진행 중인 업무가 없습니다.
                  </div>
                ) : (
                  <div className="schedule-mobile-agenda-list">
                    {selectedDayDetail.tasks.map((t) => {
                      const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                      const TrackIcon = trackCfg.icon;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedDayDetail(null);
                            handleOpenEditTaskModal(t);
                          }}
                          className={`schedule-mobile-agenda-item is-task ${trackCfg.classKey}`}
                        >
                          <div className="schedule-mobile-agenda-top">
                            <div className="tasks-card-badges">
                              <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                                <TrackIcon size={13} /> {t.track}
                              </span>
                              <strong className="schedule-mobile-user-name">{t.title}</strong>
                              <span className="schedule-mobile-agenda-sub">({t.assigneeName})</span>
                            </div>
                            <span className="schedule-mobile-agenda-period">
                              {t.startDate} ~ {t.dueDate}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="btn btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 서비스기획 업무 등록 / 상세 조회 / 수정 통합 모달 (서비스기획 업무 관리와 100% 동일) */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
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
                onClick={() => setIsTaskModalOpen(false)}
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
                      const isSelected = taskFormData.track === trackKey;
                      const IconComponent = config.icon;
                      return (
                        <button
                          key={trackKey}
                          type="button"
                          disabled={isViewer}
                          onClick={() => setTaskFormData({ ...taskFormData, track: trackKey })}
                          className={`tasks-modal-track-btn ${config.classKey} ${
                            isSelected ? 'active' : ''
                          }`}
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
                          {isSelected && (
                            <CheckCircle2 size={16} className="tasks-modal-track-check" />
                          )}
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
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
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
                      value={taskFormData.category}
                      onChange={(e) =>
                        setTaskFormData({
                          ...taskFormData,
                          category: e.target.value as TaskCategory,
                        })
                      }
                      className="form-select"
                    >
                      {TASK_CATEGORIES.map((cat) => (
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
                      value={taskFormData.assigneeId}
                      onChange={(e) => {
                        const targetUser = teamMembers.find(
                          (m) => String(m.id) === String(e.target.value)
                        );
                        setTaskFormData({
                          ...taskFormData,
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
                </div>

                {/* 3. 우선순위 & 상태 */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">우선순위</label>
                    <select
                      disabled={isViewer}
                      value={taskFormData.priority}
                      onChange={(e) =>
                        setTaskFormData({
                          ...taskFormData,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="form-select"
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">진행 상태</label>
                    {(() => {
                      const autoStatus = computeTaskStatusByDates(
                        taskFormData.startDate,
                        taskFormData.dueDate
                      );
                      const autoStatusCfg =
                        TASK_STATUSES.find((s) => s.key === autoStatus) || TASK_STATUSES[1];
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

                {/* 4. 일정 (시작일 & 마감일) */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">시작일</label>
                    <input
                      type="date"
                      disabled={isViewer}
                      value={taskFormData.startDate}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        setTaskFormData({
                          ...taskFormData,
                          startDate: nextStart,
                          status: computeTaskStatusByDates(nextStart, taskFormData.dueDate),
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
                      value={taskFormData.dueDate}
                      onChange={(e) => {
                        const nextDue = e.target.value;
                        setTaskFormData({
                          ...taskFormData,
                          dueDate: nextDue,
                          status: computeTaskStatusByDates(taskFormData.startDate, nextDue),
                        });
                      }}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 5. 상세 내용 */}
                <div className="form-group">
                  <label className="form-label">상세 기획 내용 및 요구사항</label>
                  <textarea
                    disabled={isViewer}
                    rows={4}
                    value={taskFormData.description}
                    onChange={(e) =>
                      setTaskFormData({ ...taskFormData, description: e.target.value })
                    }
                    placeholder="기획 배경, 주요 변경 범위, 개발 협의 이슈 등을 상세히 기록하세요..."
                    className="form-textarea"
                  />
                </div>

                {/* 6. 산출물 링크 (단일 입력 필드) */}
                <div className="form-group">
                  <label className="form-label">산출물 링크</label>
                  <div className="tasks-single-link-row">
                    <input
                      type="url"
                      disabled={isViewer}
                      placeholder="https://..."
                      value={taskFormData.linkUrl}
                      onChange={(e) =>
                        setTaskFormData({ ...taskFormData, linkUrl: e.target.value })
                      }
                      className="form-input tasks-single-link-input"
                    />
                    {taskFormData.linkUrl.trim() && (
                      <a
                        href={taskFormData.linkUrl.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary tasks-single-link-open-btn"
                        title="새 창에서 산출물 링크 열기"
                      >
                        <ExternalLink size={15} /> 열기
                      </a>
                    )}
                  </div>
                  {(() => {
                    const candidateUrl =
                      taskFormData.linkUrl ||
                      editingTask?.artifactUrl ||
                      editingTask?.links?.[0]?.url ||
                      '';
                    const wpMatch = candidateUrl.match(/[?&]project=([a-zA-Z0-9_-]+)/);
                    const wpId = editingTask?.workspaceProjectId || (wpMatch ? wpMatch[1] : null);
                    if (!wpId) return null;
                    const viewerUrl = `https://bychoi-space.github.io/workspace/viewer.html?project=${wpId}`;
                    return (
                      <div className="tasks-workspace-linked-bar">
                        <div className="tasks-notion-linked-info">
                          <span className="tasks-badge-workspace">
                            기획서 v{editingTask?.version || '0.1'}
                          </span>
                          <span className="tasks-notion-linked-text">
                            워크스페이스 프로젝트 ({wpId})
                            {editingTask?.period ? ` · ${editingTask.period}` : ''}
                          </span>
                        </div>
                        <div className="tasks-workspace-linked-actions">
                          <a
                            href={viewerUrl}
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
                    );
                  })()}
                </div>

                {/* 7. Notion 연동 상태 표시 */}
                {editingTask &&
                  (Boolean(editingTask.notionUrl) || String(editingTask.id).startsWith('notion-')) && (
                    <div className="tasks-notion-sync-box">
                      <div className="tasks-notion-linked-row">
                        <div className="tasks-notion-linked-info">
                          <span className="tasks-badge-notion">Notion 연동</span>
                          <span className="tasks-notion-linked-text">
                            Sisun-Tasks 양방향 동기화 적용됨 (수정 저장 시 Notion에 자동 반영)
                          </span>
                        </div>
                        {editingTask.notionUrl && (
                          <a
                            href={editingTask.notionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary tasks-single-link-open-btn"
                          >
                            <ExternalLink size={14} /> Notion 열기
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                {/* 감사 정보 표시 (기존 데이터인 경우) */}
                {editingTask && (
                  <div className="tasks-audit-bar">
                    <span>
                      최초 등록: {editingTask.createdBy} (
                      {new Date(editingTask.createdAt).toLocaleDateString()})
                    </span>
                    <span>
                      최종 수정: {editingTask.updatedBy} (
                      {new Date(editingTask.updatedAt).toLocaleTimeString()})
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
                  onClick={() => setIsTaskModalOpen(false)}
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
