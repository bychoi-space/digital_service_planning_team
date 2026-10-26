import React, { useState, useMemo } from 'react';
import type { VacationItem, VacationType, User, TaskItem, TaskTrack } from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserX,
  Phone,
  UserCheck,
  Trash2,
  Edit2,
  X,
  FileText,
  Palette,
  Code,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowUpRight,
  Eye,
  Clock,
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
    classKey: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  기획: {
    label: '기획',
    classKey: 'track-planning',
    icon: FileText,
  },
  디자인: {
    label: '디자인',
    classKey: 'track-design',
    icon: Palette,
  },
  퍼블리싱: {
    label: '퍼블리싱',
    classKey: 'track-publishing',
    icon: Code,
  },
};

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
  onNavigateToTasks,
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

  const [viewTab, setViewTab] = useState<'calendar' | 'list'>('calendar');
  const [listSubTab, setListSubTab] = useState<'vacation' | 'task'>('vacation');

  // 필터 상태: 'all' | 'vacation' | '기획' | '디자인' | '퍼블리싱'
  const [filterType, setFilterType] = useState<'all' | 'vacation' | TaskTrack>('all');
  const [onlyActiveTasks, setOnlyActiveTasks] = useState<boolean>(true);

  // 모달 상태
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationItem | null>(null);

  // 업무 상세 보기 모달 상태
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

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
        : tasks.filter((t) => dateStr >= t.startDate && dateStr <= t.dueDate);

    if (filterType === '기획' || filterType === '디자인' || filterType === '퍼블리싱') {
      dayTasks = dayTasks.filter((t) => t.track === filterType);
    }

    if (onlyActiveTasks) {
      dayTasks = dayTasks.filter((t) => ['in_progress', 'review'].includes(t.status));
    }

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
        <div
          className={`card schedule-summary-card ${
            todayAbsentList.length > 0 ? 'is-absent' : 'is-present'
          }`}
        >
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
        <div className="card schedule-summary-card is-tasks">
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

          {onNavigateToTasks && (
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="btn btn-secondary schedule-summary-action-btn"
              title="서비스기획 업무 관리 메뉴로 이동"
            >
              업무 관리 <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. 캘린더 네비게이션 & 파트 필터 바 */}
      <div className="card schedule-control-card">
        {/* 상단 컨트롤 라인: 월 이동 + 뷰 모드 전환 */}
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

          {/* 뷰 모드 탭 (월간 캘린더 vs 목록) */}
          <div className="schedule-view-toggle">
            <button
              type="button"
              onClick={() => setViewTab('calendar')}
              className={`schedule-view-btn ${viewTab === 'calendar' ? 'active' : ''}`}
            >
              <CalendarIcon size={15} /> 월간 종합 캘린더
            </button>
            <button
              type="button"
              onClick={() => setViewTab('list')}
              className={`schedule-view-btn ${viewTab === 'list' ? 'active' : ''}`}
            >
              <Layers size={15} /> 통합 일정 목록
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

      {/* 3-A. 캘린더 뷰 (월간 종합 캘린더) */}
      {viewTab === 'calendar' ? (
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

                      {/* B. 업무 배지 노출 (요약 과제명 + 컴팩트 상태 표기) */}
                      {displayTasks.map((t) => {
                        const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                        const TrackIcon = trackCfg.icon;
                        const isDueDay = cell.dateStr === t.dueDate;
                        const isStartDay = cell.dateStr === t.startDate;
                        const summaryTitle = summarizeCalendarTaskTitle(t.title);

                        return (
                          <div
                            key={`task-${t.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(t);
                            }}
                            className={`schedule-event-badge is-task ${trackCfg.classKey}`}
                            title={`[${t.track}] ${t.title} (${t.assigneeName}) / 기간: ${t.startDate} ~ ${t.dueDate}`}
                          >
                            <TrackIcon size={11} className="schedule-event-icon" />
                            <span className="schedule-event-text">
                              {isDueDay && (
                                <strong className="schedule-event-prefix is-due">마감</strong>
                              )}
                              {isStartDay && !isDueDay && (
                                <strong className="schedule-event-prefix is-start">착수</strong>
                              )}
                              {summaryTitle}
                            </span>
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
                  const isDueDay = mobileSelectedData.dateStr === t.dueDate;
                  return (
                    <div
                      key={`mob-task-${t.id}`}
                      onClick={() => setSelectedTask(t)}
                      className={`schedule-mobile-agenda-item is-task ${trackCfg.classKey}`}
                    >
                      <div className="schedule-mobile-agenda-top">
                        <div className="schedule-mobile-agenda-badges">
                          <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                            <TrackIcon size={13} /> {trackCfg.label}
                          </span>
                          <span className="tasks-badge-category">{t.category}</span>
                          {isDueDay && <span className="schedule-due-tag">마감일</span>}
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
      ) : (
        /* 3-B. 통합 일정 목록 뷰 (탭 전환 가능) */
        <div className="card schedule-list-card">
          {/* 목록 서브 헤더 */}
          <div className="schedule-list-subbar">
            <div className="schedule-list-subtabs">
              <button
                type="button"
                onClick={() => setListSubTab('vacation')}
                className={`schedule-subtab-btn is-vacation ${
                  listSubTab === 'vacation' ? 'active' : ''
                }`}
              >
                <CalendarIcon size={15} />
                <span>팀원 휴가 일정 목록 ({vacations.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setListSubTab('task')}
                className={`schedule-subtab-btn is-task ${listSubTab === 'task' ? 'active' : ''}`}
              >
                <Layers size={15} />
                <span>진행 중인 기획·디자인·퍼블 업무 목록 ({activeTasks.length})</span>
              </button>
            </div>
          </div>

          {listSubTab === 'vacation' ? (
            <>
              {/* 데스크톱 & 태블릿 휴가 테이블 */}
              <div className="schedule-table-scroll">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>대상자</th>
                      <th>휴가 유형</th>
                      <th>휴가 기간</th>
                      <th>업무 대행자</th>
                      <th>비상연락망</th>
                      <th>인수인계 및 비고</th>
                      <th className="th-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacations.map((item) => {
                      const typeConfig =
                        VACATION_TYPES.find((t) => t.key === item.type) || VACATION_TYPES[0];
                      return (
                        <tr key={item.id}>
                          <td className="td-bold">{item.userName}</td>
                          <td>
                            <span className={`schedule-type-badge ${typeConfig.classKey}`}>
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="td-period">
                            {item.startDate} ~ {item.endDate}
                          </td>
                          <td>
                            <span className="schedule-inline-icon-text">
                              <UserCheck size={14} className="icon-emerald" /> {item.deputyName}
                            </span>
                          </td>
                          <td className="td-secondary">
                            <span className="schedule-inline-icon-text">
                              <Phone size={14} /> {item.contact || '-'}
                            </span>
                          </td>
                          <td className="td-muted">{item.notes || '-'}</td>
                          <td className="td-center">
                            <div className="schedule-row-actions">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="btn btn-secondary tasks-action-btn"
                              >
                                <Edit2 size={14} /> {isViewer ? '조회' : '수정'}
                              </button>
                              {!isViewer && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVacation(item.id, item.userName)}
                                  className="btn btn-secondary tasks-delete-icon-btn"
                                  title="휴가 취소"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {vacations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="td-center td-empty">
                          등록된 휴가 일정이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 모바일 휴가 카드 리스트 */}
              <div className="schedule-mobile-list">
                {vacations.map((item) => {
                  const typeConfig =
                    VACATION_TYPES.find((t) => t.key === item.type) || VACATION_TYPES[0];
                  return (
                    <div key={item.id} className="schedule-mobile-card">
                      <div className="schedule-mobile-card-top">
                        <div className="schedule-mobile-user-wrap">
                          <strong className="schedule-mobile-user-name">{item.userName}</strong>
                          <span className={`schedule-type-badge ${typeConfig.classKey}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <span className="schedule-mobile-period">
                          {item.startDate} ~ {item.endDate}
                        </span>
                      </div>

                      <div className="schedule-mobile-meta-grid">
                        <span className="schedule-inline-icon-text">
                          <UserCheck size={14} className="icon-emerald" /> 대행: {item.deputyName}
                        </span>
                        <span className="schedule-inline-icon-text">
                          <Phone size={14} /> {item.contact || '-'}
                        </span>
                      </div>

                      {item.notes && <div className="schedule-mobile-notes">{item.notes}</div>}

                      <div className="schedule-mobile-card-actions">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="btn btn-secondary tasks-action-btn"
                        >
                          <Edit2 size={14} /> {isViewer ? '상세 조회' : '상세 및 수정'}
                        </button>
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleDeleteVacation(item.id, item.userName)}
                            className="btn btn-secondary tasks-delete-icon-btn"
                          >
                            <Trash2 size={14} /> 일정 취소
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {vacations.length === 0 && (
                  <div className="tasks-empty-col">등록된 휴가 일정이 없습니다.</div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 데스크톱 & 태블릿 진행 업무 테이블 */}
              <div className="schedule-table-scroll">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>직무 파트</th>
                      <th>도메인</th>
                      <th>업무명</th>
                      <th>담당자</th>
                      <th>일정 기간</th>
                      <th className="th-center">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTasks.map((t) => {
                      const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                      const TrackIcon = trackCfg.icon;
                      return (
                        <tr key={t.id}>
                          <td>
                            <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                              <TrackIcon size={13} /> {t.track}
                            </span>
                          </td>
                          <td>
                            <span className="tasks-badge-category">{t.category}</span>
                          </td>
                          <td className="td-bold">{t.title}</td>
                          <td className="td-period">{t.assigneeName}</td>
                          <td className="td-secondary">
                            {t.startDate} ~ {t.dueDate}
                          </td>
                          <td className="td-center">
                            <button
                              type="button"
                              onClick={() => setSelectedTask(t)}
                              className="btn btn-secondary tasks-action-btn"
                            >
                              <Eye size={14} /> 상세 보기
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeTasks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="td-center td-empty">
                          현재 진행 중인 업무가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 모바일 진행 업무 카드 리스트 */}
              <div className="schedule-mobile-list">
                {activeTasks.map((t) => {
                  const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                  const TrackIcon = trackCfg.icon;
                  return (
                    <div
                      key={t.id}
                      className={`schedule-mobile-card ${trackCfg.classKey}`}
                    >
                      <div className="schedule-mobile-card-top">
                        <div className="tasks-card-badges">
                          <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                            <TrackIcon size={13} /> {t.track}
                          </span>
                          <span className="tasks-badge-category">{t.category}</span>
                        </div>
                        <span className="schedule-inline-icon-text">
                          <UserCheck size={14} /> {t.assigneeName}
                        </span>
                      </div>

                      <div
                        onClick={() => setSelectedTask(t)}
                        className="tasks-mobile-list-title"
                      >
                        {t.title}
                      </div>

                      <div className="schedule-mobile-card-footer">
                        <span className="schedule-inline-icon-text">
                          <Clock size={14} /> {t.startDate} ~ {t.dueDate}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTask(t)}
                          className="btn btn-secondary tasks-action-btn"
                        >
                          <Eye size={14} /> 상세 보기
                        </button>
                      </div>
                    </div>
                  );
                })}
                {activeTasks.length === 0 && (
                  <div className="tasks-empty-col">현재 진행 중인 업무가 없습니다.</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

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

      {/* 5. 캘린더에서 클릭한 업무 상세 모달 (Task Detail Modal) */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-box schedule-task-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="tasks-modal-header-left">
                {(() => {
                  const trackCfg = TRACK_CONFIG[selectedTask.track] || TRACK_CONFIG['기획'];
                  const TrackIcon = trackCfg.icon;
                  return (
                    <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                      <TrackIcon size={13} /> {selectedTask.track} 파트
                    </span>
                  );
                })()}
                <h3 className="modal-title">{selectedTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body schedule-modal-stack">
              {/* 속성 그리드 */}
              <div className="schedule-task-meta-grid">
                <div>
                  <span className="schedule-meta-label">도메인:</span>{' '}
                  <strong>{selectedTask.category}</strong>
                </div>
                <div>
                  <span className="schedule-meta-label">담당자:</span>{' '}
                  <strong>{selectedTask.assigneeName}</strong>
                </div>
                <div>
                  <span className="schedule-meta-label">우선순위:</span>{' '}
                  <span className={`tasks-badge-priority priority-${selectedTask.priority}`}>
                    {selectedTask.priority === 'urgent'
                      ? '긴급'
                      : selectedTask.priority === 'high'
                      ? '높음'
                      : selectedTask.priority === 'medium'
                      ? '보통'
                      : '낮음'}
                  </span>
                </div>
                <div>
                  <span className="schedule-meta-label">진행 상태:</span>{' '}
                  <span className="tasks-badge-category">
                    {selectedTask.status === 'in_progress'
                      ? '진행중'
                      : selectedTask.status === 'review'
                      ? '검토/QA'
                      : selectedTask.status === 'done'
                      ? '완료'
                      : selectedTask.status === 'on_hold'
                      ? '보류'
                      : '대기'}
                  </span>
                </div>
                <div className="schedule-task-meta-full">
                  <span className="schedule-meta-label">업무 기간:</span>{' '}
                  <strong>
                    {selectedTask.startDate} ~ {selectedTask.dueDate}
                  </strong>
                </div>
              </div>

              {/* 상세 내용 */}
              <div>
                <label className="form-label">상세 업무 내용</label>
                <div className="schedule-task-desc-box">
                  {selectedTask.description || '상세 내용이 작성되지 않았습니다.'}
                </div>
              </div>

              {/* 산출물 링크 */}
              {((selectedTask.links && selectedTask.links.length > 0) ||
                selectedTask.artifactUrl) && (
                <div>
                  <label className="form-label">산출물 링크</label>
                  <div className="schedule-task-links">
                    {selectedTask.links && selectedTask.links.length > 0 ? (
                      selectedTask.links.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="schedule-task-link-anchor"
                        >
                          <ExternalLink size={14} /> {link.url}
                        </a>
                      ))
                    ) : (
                      <a
                        href={selectedTask.artifactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="schedule-task-link-anchor"
                      >
                        <ExternalLink size={14} /> {selectedTask.artifactUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {onNavigateToTasks && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    onNavigateToTasks();
                  }}
                  className="btn btn-primary tasks-modal-delete-btn"
                >
                  <ArrowUpRight size={15} /> 업무 관리 화면에서 열기
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="btn btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 일자별 전체 일정 더보기 모달 (Day Schedule Modal) */}
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
                      const isDue = selectedDayDetail.dateStr === t.dueDate;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedDayDetail(null);
                            setSelectedTask(t);
                          }}
                          className={`schedule-mobile-agenda-item is-task ${trackCfg.classKey}`}
                        >
                          <div className="schedule-mobile-agenda-top">
                            <div className="tasks-card-badges">
                              <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                                <TrackIcon size={13} /> {t.track}
                              </span>
                              {isDue && <span className="schedule-due-tag">마감일</span>}
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
    </div>
  );
};
