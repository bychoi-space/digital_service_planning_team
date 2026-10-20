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
} from 'lucide-react';

interface VacationsViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigateToTasks?: () => void;
}

const VACATION_TYPES: { key: VacationType; label: string; color: string; bg: string }[] = [
  { key: 'annual', label: '연차', color: '#2563eb', bg: '#eff6ff' },
  { key: 'morning_half', label: '오전반차', color: '#059669', bg: '#ecfdf5' },
  { key: 'afternoon_half', label: '오후반차', color: '#d97706', bg: '#fffbeb' },
  { key: 'special', label: '경조사', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'substitute', label: '대체휴가', color: '#0891b2', bg: '#ecfeff' },
  { key: 'other', label: '기타/공가', color: '#475569', bg: '#f8fafc' },
];

const TRACK_CONFIG: Record<
  TaskTrack,
  { label: string; color: string; bg: string; border: string; icon: React.FC<{ size?: number }> }
> = {
  '기획': {
    label: '기획',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: FileText,
  },
  '디자인': {
    label: '디자인',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    icon: Palette,
  },
  '퍼블리싱': {
    label: '퍼블리싱',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: Code,
  },
};

export const VacationsView: React.FC<VacationsViewProps> = ({
  isViewer,
  onShowToast,
  onNavigateToTasks,
}) => {
  const [vacations, setVacations] = useState<VacationItem[]>(() => PlanningStorageService.getVacations());
  const [tasks, setTasks] = useState<TaskItem[]>(() => PlanningStorageService.getTasks());
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1)); // 2026년 10월 기준
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

  // 일자별 전체 일정 더보기 모달
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    vacations: VacationItem[];
    tasks: TaskItem[];
  } | null>(null);

  const teamMembers = PlanningStorageService.getUsers().filter((u) => u.role !== 'viewer');

  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    department: '디지털서비스기획팀',
    type: 'annual' as VacationType,
    startDate: '2026-10-25',
    endDate: '2026-10-25',
    deputyId: '',
    deputyName: '',
    contact: '',
    notes: '',
  });

  const refreshAll = () => {
    setVacations(PlanningStorageService.getVacations());
    setTasks(PlanningStorageService.getTasks());
  };

  // 모달 열기 (신규 휴가 신청)
  const handleOpenCreateModal = (presetDate?: string) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 휴가를 등록할 수 없습니다.', 'error');
      return;
    }
    const defaultUser = teamMembers[0] || { id: '1', name: '최범열' };
    const defaultDeputy = teamMembers.length > 1 ? teamMembers[1] : defaultUser;
    const targetDate = presetDate || new Date().toISOString().split('T')[0];

    setEditingVacation(null);
    setFormData({
      userId: defaultUser.id,
      userName: defaultUser.name,
      department: '디지털서비스기획팀',
      type: 'annual',
      startDate: targetDate,
      endDate: targetDate,
      deputyId: defaultDeputy.id,
      deputyName: defaultDeputy.name,
      contact: '010-',
      notes: '',
    });
    setIsVacationModalOpen(true);
  };

  // 모달 열기 (휴가 수정 or 상세)
  const handleOpenEditModal = (item: VacationItem) => {
    setEditingVacation(item);
    setFormData({
      userId: item.userId,
      userName: item.userName,
      department: item.department,
      type: item.type,
      startDate: item.startDate,
      endDate: item.endDate,
      deputyId: item.deputyId,
      deputyName: item.deputyName,
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
    if (window.confirm(`정말 ${name}의 휴가 일정을 취소하시겠습니까?`)) {
      PlanningStorageService.deleteVacation(id);
      onShowToast('휴가 일정이 취소되었습니다.', 'info');
      setIsVacationModalOpen(false);
      refreshAll();
    }
  };

  // 캘린더 네비게이션
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleSetToday = () => {
    setCurrentDate(new Date(2026, 9, 1)); // 데모 기준 2026년 10월
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
        dateStr: prevDate.toISOString().split('T')[0],
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
        dateStr: nextDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // 오늘 날짜 및 오늘 부재자 계산 (시스템 시간 또는 2026-10-19 기준)
  const todayStr = '2026-10-19';
  const todayAbsentList = vacations.filter((v) => todayStr >= v.startDate && todayStr <= v.endDate);

  // 실시간 진행 업무 통계 계산
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => ['in_progress', 'review'].includes(t.status));
  }, [tasks]);

  const planningActiveTasksCount = activeTasks.filter((t) => t.track === '기획').length;
  const designActiveTasksCount = activeTasks.filter((t) => t.track === '디자인').length;
  const publishingActiveTasksCount = activeTasks.filter((t) => t.track === '퍼블리싱').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. 상단 2열 대시보드 위젯 (부재 현황 + 진행 업무 현황) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {/* 카드 1: 오늘의 팀원 부재 현황 */}
        <div
          className="card"
          style={{
            padding: '18px 20px',
            background: todayAbsentList.length > 0 ? '#fffbeb' : '#f0fdf4',
            borderColor: todayAbsentList.length > 0 ? '#fde68a' : '#bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: todayAbsentList.length > 0 ? '#f59e0b' : '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {todayAbsentList.length > 0 ? <UserX size={22} /> : <UserCheck size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  오늘의 팀원 부재 현황
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: todayAbsentList.length > 0 ? '#fef3c7' : '#dcfce7',
                    color: todayAbsentList.length > 0 ? '#b45309' : '#15803d',
                  }}
                >
                  {todayAbsentList.length}명 부재
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                {todayAbsentList.length > 0
                  ? `${todayAbsentList
                      .map((v) => `${v.userName} (${VACATION_TYPES.find((t) => t.key === v.type)?.label})`)
                      .join(', ')} 부재 중입니다.`
                  : '오늘 부재 중인 팀원이 없습니다. 전원 정상 근무 중입니다.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
            disabled={isViewer}
            title={isViewer ? '유관부서 모드에서는 등록이 제한됩니다' : '휴가 등록'}
          >
            <Plus size={15} /> 휴가 신청
          </button>
        </div>

        {/* 카드 2: 실시간 진행 업무 현황 (기획 · 디자인 · 퍼블리싱) */}
        <div
          className="card"
          style={{
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            borderColor: 'var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  진행 중인 기획·디자인·퍼블 업무
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                  }}
                >
                  총 {activeTasks.length}건 진행중
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11.5px',
                    color: '#2563eb',
                    fontWeight: 600,
                    background: '#eff6ff',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  📌 기획 {planningActiveTasksCount}건
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    color: '#7c3aed',
                    fontWeight: 600,
                    background: '#f5f3ff',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  🎨 디자인 {designActiveTasksCount}건
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    color: '#059669',
                    fontWeight: 600,
                    background: '#ecfdf5',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  💻 퍼블리싱 {publishingActiveTasksCount}건
                </span>
              </div>
            </div>
          </div>

          {onNavigateToTasks && (
            <button
              onClick={onNavigateToTasks}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="서비스기획 업무 관리 메뉴로 이동"
            >
              업무 관리 <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. 캘린더 네비게이션 & 파트 필터 바 */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* 상단 컨트롤 라인: 월 이동 + 뷰 모드 전환 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* 월 이동 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrevMonth}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="이전 달"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontSize: '19px', fontWeight: 800, minWidth: '150px', textAlign: 'center', letterSpacing: '-0.3px' }}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <button
              onClick={handleNextMonth}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="다음 달"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleSetToday}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '12px', marginLeft: '4px' }}
            >
              이번 달
            </button>
          </div>

          {/* 뷰 모드 탭 (월간 캘린더 vs 목록) */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setViewTab('calendar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                background: viewTab === 'calendar' ? '#ffffff' : 'transparent',
                color: viewTab === 'calendar' ? '#1e293b' : '#64748b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: viewTab === 'calendar' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <CalendarIcon size={14} /> 월간 종합 캘린더
            </button>
            <button
              onClick={() => setViewTab('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                background: viewTab === 'list' ? '#ffffff' : 'transparent',
                color: viewTab === 'list' ? '#1e293b' : '#64748b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: viewTab === 'list' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Layers size={14} /> 통합 일정 목록
            </button>
          </div>
        </div>

        {/* 하단 필터 바: 파트별 토글 필터 칩 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
              일정 필터:
            </span>

            {/* 전체 일정 */}
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: filterType === 'all' ? '1.5px solid #1e293b' : '1px solid #e2e8f0',
                background: filterType === 'all' ? '#1e293b' : '#ffffff',
                color: filterType === 'all' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              전체 일정
            </button>

            {/* 🏖️ 휴가 */}
            <button
              onClick={() => setFilterType('vacation')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: filterType === 'vacation' ? '1.5px solid #d97706' : '1px solid #fde68a',
                background: filterType === 'vacation' ? '#f59e0b' : '#fffbeb',
                color: filterType === 'vacation' ? '#ffffff' : '#b45309',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🏖️ 휴가 일정 ({vacations.length})</span>
            </button>

            {/* 📌 기획 업무 */}
            <button
              onClick={() => setFilterType('기획')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: filterType === '기획' ? '1.5px solid #2563eb' : '1px solid #bfdbfe',
                background: filterType === '기획' ? '#2563eb' : '#eff6ff',
                color: filterType === '기획' ? '#ffffff' : '#1d4ed8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={13} />
              <span>기획 업무 ({tasks.filter((t) => t.track === '기획').length})</span>
            </button>

            {/* 🎨 디자인 업무 */}
            <button
              onClick={() => setFilterType('디자인')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: filterType === '디자인' ? '1.5px solid #7c3aed' : '1px solid #ddd6fe',
                background: filterType === '디자인' ? '#7c3aed' : '#f5f3ff',
                color: filterType === '디자인' ? '#ffffff' : '#6d28d9',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Palette size={13} />
              <span>디자인 업무 ({tasks.filter((t) => t.track === '디자인').length})</span>
            </button>

            {/* 💻 퍼블리싱 업무 */}
            <button
              onClick={() => setFilterType('퍼블리싱')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: filterType === '퍼블리싱' ? '1.5px solid #059669' : '1px solid #a7f3d0',
                background: filterType === '퍼블리싱' ? '#059669' : '#ecfdf5',
                color: filterType === '퍼블리싱' ? '#ffffff' : '#047857',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Code size={13} />
              <span>퍼블리싱 업무 ({tasks.filter((t) => t.track === '퍼블리싱').length})</span>
            </button>
          </div>

          {/* 진행/검토 중 업무만 보기 토글 체크박스 */}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={onlyActiveTasks}
              onChange={(e) => setOnlyActiveTasks(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>진행·검토 중 업무만 캘린더에 표시</span>
          </label>
        </div>
      </div>

      {/* 3-A. 캘린더 뷰 (월간 종합 캘린더) */}
      {viewTab === 'calendar' ? (
        <div className="card" style={{ padding: '16px', overflow: 'hidden' }}>
          {/* 요일 헤더 (일: 레드, 토: 블루) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '13px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-light)',
              boxSizing: 'border-box',
              width: '100%',
              gap: '1px',
            }}
          >
            <div style={{ color: '#ef4444', background: '#fef2f2', padding: '6px 0', borderRadius: '4px' }}>일 (Sun)</div>
            <div style={{ color: '#334155', padding: '6px 0' }}>월</div>
            <div style={{ color: '#334155', padding: '6px 0' }}>화</div>
            <div style={{ color: '#334155', padding: '6px 0' }}>수</div>
            <div style={{ color: '#334155', padding: '6px 0' }}>목</div>
            <div style={{ color: '#334155', padding: '6px 0' }}>금</div>
            <div style={{ color: '#2563eb', background: '#eff6ff', padding: '6px 0', borderRadius: '4px' }}>토 (Sat)</div>
          </div>

          {/* 달력 날짜 그리드 (7열 균등 분할 minmax(0, 1fr)로 토요일 컬럼 잘림 원천 방지) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gridAutoRows: 'minmax(125px, auto)',
              gap: '1px',
              background: 'var(--border-light)',
              marginTop: '4px',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              borderRadius: '6px',
            }}
          >
            {calendarDays.map((cell, idx) => {
              const dayOfWeek = idx % 7; // 0: 일요일, 6: 토요일
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              const isToday = cell.dateStr === todayStr;

              // 주말 및 평일 배경 컬러 분기
              let cellBg = '#ffffff';
              if (!cell.isCurrentMonth) {
                cellBg = '#f8fafc';
              } else if (isSunday) {
                cellBg = '#fff8f8'; // 은은한 일요일 로즈 틴트
              } else if (isSaturday) {
                cellBg = '#f4f8ff'; // 은은한 토요일 스카이 블루 틴트
              }

              // 날짜 숫자 폰트 컬러 분기
              let dayNumColor = cell.isCurrentMonth ? 'var(--text-main)' : '#94a3b8';
              if (cell.isCurrentMonth && !isToday) {
                if (isSunday) dayNumColor = '#dc2626';
                else if (isSaturday) dayNumColor = '#2563eb';
              }

              // 1. 해당 날짜의 휴가 항목 필터링
              const cellVacations =
                filterType === 'all' || filterType === 'vacation'
                  ? vacations.filter((v) => cell.dateStr >= v.startDate && cell.dateStr <= v.endDate)
                  : [];

              // 2. 해당 날짜의 업무 항목 필터링
              let cellTasks =
                filterType === 'vacation'
                  ? []
                  : tasks.filter((t) => cell.dateStr >= t.startDate && cell.dateStr <= t.dueDate);

              // 트랙 필터 (기획/디자인/퍼블리싱)
              if (filterType === '기획' || filterType === '디자인' || filterType === '퍼블리싱') {
                cellTasks = cellTasks.filter((t) => t.track === filterType);
              }

              // 진행중 업무만 표시 옵션 적용
              if (onlyActiveTasks) {
                cellTasks = cellTasks.filter((t) => ['in_progress', 'review'].includes(t.status));
              }

              const totalItemsCount = cellVacations.length + cellTasks.length;

              // 최대 3개 항목만 노출하고 초과분은 '+N개 더보기' 칩으로 처리
              const MAX_DISPLAY = 3;
              const displayVacations = cellVacations.slice(0, MAX_DISPLAY);
              const remainingSlots = Math.max(0, MAX_DISPLAY - displayVacations.length);
              const displayTasks = cellTasks.slice(0, remainingSlots);
              const overflowCount = totalItemsCount - (displayVacations.length + displayTasks.length);

              return (
                <div
                  key={idx}
                  onClick={() => !isViewer && handleOpenCreateModal(cell.dateStr)}
                  style={{
                    background: cellBg,
                    padding: '8px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: isViewer ? 'default' : 'pointer',
                    transition: 'background-color 0.15s ease',
                    minHeight: '125px',
                    minWidth: 0,
                    width: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    if (cell.isCurrentMonth && !isViewer) {
                      e.currentTarget.style.backgroundColor = isSunday
                        ? '#fee2e2'
                        : isSaturday
                        ? '#e0edff'
                        : '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cell.isCurrentMonth && !isViewer) {
                      e.currentTarget.style.backgroundColor = cellBg;
                    }
                  }}
                >
                  {/* 날짜 상단 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: isToday ? 800 : (isSunday || isSaturday) ? 700 : cell.isCurrentMonth ? 600 : 400,
                        color: isToday ? '#ffffff' : dayNumColor,
                        background: isToday ? '#2563eb' : 'transparent',
                        width: isToday ? '22px' : 'auto',
                        height: isToday ? '22px' : 'auto',
                        borderRadius: isToday ? '50%' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cell.dayNum}
                    </span>

                    {totalItemsCount > 0 && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          fontWeight: 700,
                          background: 'rgba(0, 0, 0, 0.04)',
                          padding: '1px 5px',
                          borderRadius: '9999px',
                        }}
                      >
                        {totalItemsCount}건
                      </span>
                    )}
                  </div>

                  {/* 날짜별 일정 뱃지 목록 컨테이너 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', width: '100%', minWidth: 0 }}>
                    {/* A. 휴가 뱃지 노출 */}
                    {displayVacations.map((v) => {
                      const typeConfig = VACATION_TYPES.find((t) => t.key === v.type) || VACATION_TYPES[0];
                      return (
                        <div
                          key={`vac-${v.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(v);
                          }}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            background: typeConfig.bg,
                            border: `1px solid ${typeConfig.color}40`,
                            color: typeConfig.color,
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            minWidth: 0,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                          }}
                          title={`[휴가] ${v.userName} (${typeConfig.label}) / 대리: ${v.deputyName}`}
                        >
                          <span style={{ fontSize: '10px', flexShrink: 0 }}>🏖️</span>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {v.userName.split(' ')[0]} ({typeConfig.label})
                          </span>
                        </div>
                      );
                    })}

                    {/* B. 업무 뱃지 노출 */}
                    {displayTasks.map((t) => {
                      const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                      const isDueDay = cell.dateStr === t.dueDate;
                      const isStartDay = cell.dateStr === t.startDate;

                      return (
                        <div
                          key={`task-${t.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(t);
                          }}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            background: isDueDay ? '#fef2f2' : trackCfg.bg,
                            border: `1px solid ${isDueDay ? '#fca5a5' : trackCfg.border}`,
                            color: isDueDay ? '#dc2626' : trackCfg.color,
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            minWidth: 0,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                          }}
                          title={`[${t.track}] ${t.title} (${t.assigneeName}) / 진척률 ${t.progress}% / 마감일: ${t.dueDate}`}
                        >
                          {isDueDay ? (
                            <span style={{ color: '#dc2626', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>🚨</span>
                          ) : (
                            <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                              <trackCfg.icon size={11} />
                            </span>
                          )}
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {isDueDay && <span style={{ fontWeight: 800 }}>[마감] </span>}
                            {isStartDay && !isDueDay && <span style={{ fontWeight: 800 }}>[착수] </span>}
                            [{t.track}] {t.title}
                          </span>
                        </div>
                      );
                    })}

                    {/* C. 3개 초과 시 '+N개 더보기' 칩 */}
                    {overflowCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayDetail({
                            dateStr: cell.dateStr,
                            dayNum: cell.dayNum,
                            vacations: cellVacations,
                            tasks: cellTasks,
                          });
                        }}
                        style={{
                          marginTop: '2px',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          border: 'none',
                          color: '#475569',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center',
                          display: 'block',
                          width: '100%',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        +{overflowCount}개 더보기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3-B. 통합 일정 목록 뷰 (탭 전환 가능) */
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* 목록 서브 헤더 */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setListSubTab('vacation')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: listSubTab === 'vacation' ? '1px solid #d97706' : '1px solid #e2e8f0',
                  background: listSubTab === 'vacation' ? '#fef3c7' : '#ffffff',
                  color: listSubTab === 'vacation' ? '#92400e' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🏖️ 팀원 휴가 일정 목록 ({vacations.length})
              </button>
              <button
                onClick={() => setListSubTab('task')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: listSubTab === 'task' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: listSubTab === 'task' ? '#eff6ff' : '#ffffff',
                  color: listSubTab === 'task' ? '#1e40af' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📌 진행 중인 기획/디자인/퍼블 업무 목록 ({activeTasks.length})
              </button>
            </div>
          </div>

          {listSubTab === 'vacation' ? (
            /* 휴가 테이블 */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>대상자</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>휴가 유형</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>휴가 기간</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>업무 대행자</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>비상연락망</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>인수인계 및 비고</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {vacations.map((item) => {
                  const typeConfig = VACATION_TYPES.find((t) => t.key === item.type) || VACATION_TYPES[0];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>{item.userName}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            background: typeConfig.bg,
                            color: typeConfig.color,
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {typeConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        {item.startDate} ~ {item.endDate}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={14} color="#059669" /> {item.deputyName}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} /> {item.contact}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.notes || '-'}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            <Edit2 size={13} /> {isViewer ? '조회' : '수정'}
                          </button>
                          {!isViewer && (
                            <button
                              onClick={() => handleDeleteVacation(item.id, item.userName)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
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
          ) : (
            /* 업무 테이블 */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>직무 파트</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>업무명</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>담당자</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>일정 기간</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>진척률</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>상세</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((t) => {
                  const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: trackCfg.bg,
                            color: trackCfg.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <trackCfg.icon size={12} /> {t.track}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                        {t.title}
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                          ({t.category})
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{t.assigneeName}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {t.startDate} ~ {t.dueDate}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '6px',
                              background: '#e2e8f0',
                              borderRadius: '9999px',
                              overflow: 'hidden',
                              minWidth: '60px',
                            }}
                          >
                            <div
                              style={{
                                width: `${t.progress}%`,
                                height: '100%',
                                background: trackCfg.color,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {t.progress}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedTask(t)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          <Eye size={13} /> 상세 보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                onClick={() => setIsVacationModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVacation}>
              <div className="modal-body">
                {/* 대상자 & 유형 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">휴가 대상자 *</label>
                    <select
                      disabled={isViewer}
                      value={formData.userId}
                      onChange={(e) => {
                        const target = teamMembers.find((m) => m.id === e.target.value);
                        setFormData({
                          ...formData,
                          userId: e.target.value,
                          userName: target ? target.name : '',
                        });
                      }}
                      className="form-select"
                    >
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
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as VacationType })}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">업무 대행자 (대리자) *</label>
                    <select
                      disabled={isViewer}
                      value={formData.deputyId}
                      onChange={(e) => {
                        const dep = teamMembers.find((m) => m.id === e.target.value);
                        setFormData({
                          ...formData,
                          deputyId: e.target.value,
                          deputyName: dep ? dep.name : '',
                        });
                      }}
                      className="form-select"
                    >
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
              </div>

              <div className="modal-footer">
                {editingVacation && !isViewer && (
                  <button
                    type="button"
                    onClick={() => handleDeleteVacation(editingVacation.id, editingVacation.userName)}
                    className="btn btn-danger"
                    style={{ marginRight: 'auto' }}
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
          <div className="modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(() => {
                  const trackCfg = TRACK_CONFIG[selectedTask.track] || TRACK_CONFIG['기획'];
                  return (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: trackCfg.bg,
                        color: trackCfg.color,
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <trackCfg.icon size={13} /> {selectedTask.track} 파트
                    </span>
                  );
                })()}
                <h3 className="modal-title" style={{ fontSize: '17px' }}>
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 속성 그리드 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>카테고리:</span>{' '}
                  <strong>{selectedTask.category}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>담당자:</span>{' '}
                  <strong>{selectedTask.assigneeName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>우선순위:</span>{' '}
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        selectedTask.priority === 'urgent'
                          ? '#ef4444'
                          : selectedTask.priority === 'high'
                          ? '#f97316'
                          : '#2563eb',
                    }}
                  >
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
                  <span style={{ color: 'var(--text-secondary)' }}>진행 상태:</span>{' '}
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background:
                        selectedTask.status === 'done'
                          ? '#dcfce7'
                          : selectedTask.status === 'in_progress'
                          ? '#dbeafe'
                          : selectedTask.status === 'review'
                          ? '#fef3c7'
                          : '#f1f5f9',
                      color:
                        selectedTask.status === 'done'
                          ? '#15803d'
                          : selectedTask.status === 'in_progress'
                          ? '#1d4ed8'
                          : selectedTask.status === 'review'
                          ? '#b45309'
                          : '#475569',
                    }}
                  >
                    {selectedTask.status === 'in_progress'
                      ? '진행중'
                      : selectedTask.status === 'review'
                      ? '검토중'
                      : selectedTask.status === 'done'
                      ? '완료'
                      : selectedTask.status === 'on_hold'
                      ? '보류'
                      : '대기'}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>업무 기간:</span>{' '}
                  <strong>
                    {selectedTask.startDate} ~ {selectedTask.dueDate}
                  </strong>
                </div>
              </div>

              {/* 진척률 바 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>진척률</span>
                  <span style={{ fontWeight: 800, color: '#2563eb' }}>{selectedTask.progress}%</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    background: '#e2e8f0',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${selectedTask.progress}%`,
                      height: '100%',
                      background: '#2563eb',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>

              {/* 상세 내용 */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  상세 업무 내용
                </label>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: 'var(--text-main)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedTask.description || '상세 내용이 작성되지 않았습니다.'}
                </div>
              </div>

              {/* 산출물 문서 링크 */}
              {selectedTask.links && selectedTask.links.length > 0 && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    관련 산출물 및 문서
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTask.links.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '12.5px',
                          color: '#2563eb',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} /> {link.title || link.url}
                      </a>
                    ))}
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
                  className="btn btn-primary"
                  style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <ArrowUpRight size={14} /> 업무 관리 화면에서 열기
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
          <div className="modal-box" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={18} color="#2563eb" />
                {selectedDayDetail.dateStr} 전체 일정 (총 {selectedDayDetail.vacations.length + selectedDayDetail.tasks.length}건)
              </h3>
              <button
                onClick={() => setSelectedDayDetail(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 휴가 일정 목록 */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏖️ 팀원 휴가 및 부재 ({selectedDayDetail.vacations.length}건)</span>
                </h4>
                {selectedDayDetail.vacations.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 0' }}>
                    등록된 휴가 일정이 없습니다.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDayDetail.vacations.map((v) => {
                      const typeConfig = VACATION_TYPES.find((t) => t.key === v.type) || VACATION_TYPES[0];
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedDayDetail(null);
                            handleOpenEditModal(v);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: typeConfig.bg,
                            border: `1px solid ${typeConfig.color}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, color: typeConfig.color, fontSize: '13.5px' }}>
                              {v.userName}
                            </span>
                            <span
                              style={{
                                marginLeft: '8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: '#ffffff',
                                color: typeConfig.color,
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {typeConfig.label}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                              (대리자: {v.deputyName})
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {v.startDate} ~ {v.endDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 진행 업무 목록 */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📌 서비스기획 진행 업무 ({selectedDayDetail.tasks.length}건)</span>
                </h4>
                {selectedDayDetail.tasks.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 0' }}>
                    해당 일자에 진행 중인 업무가 없습니다.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDayDetail.tasks.map((t) => {
                      const trackCfg = TRACK_CONFIG[t.track] || TRACK_CONFIG['기획'];
                      const isDue = selectedDayDetail.dateStr === t.dueDate;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedDayDetail(null);
                            setSelectedTask(t);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isDue ? '#fef2f2' : trackCfg.bg,
                            border: `1px solid ${isDue ? '#fca5a5' : trackCfg.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isDue ? '#fee2e2' : '#ffffff',
                                color: isDue ? '#dc2626' : trackCfg.color,
                              }}
                            >
                              {isDue ? '🚨 마감일' : t.track}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                              {t.title}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              ({t.assigneeName} · {t.progress}%)
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {t.startDate} ~ {t.dueDate}
                          </span>
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
