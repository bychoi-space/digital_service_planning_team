import React, { useState, useMemo } from 'react';
import type { VacationItem, VacationType, User } from '../types';
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
} from 'lucide-react';

interface VacationsViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const VACATION_TYPES: { key: VacationType; label: string; color: string; bg: string }[] = [
  { key: 'annual', label: '연차', color: '#2563eb', bg: '#eff6ff' },
  { key: 'morning_half', label: '오전반차', color: '#059669', bg: '#ecfdf5' },
  { key: 'afternoon_half', label: '오후반차', color: '#d97706', bg: '#fffbeb' },
  { key: 'special', label: '경조사', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'substitute', label: '대체휴가', color: '#0891b2', bg: '#ecfeff' },
  { key: 'other', label: '기타/공가', color: '#475569', bg: '#f8fafc' },
];

export const VacationsView: React.FC<VacationsViewProps> = ({ isViewer, onShowToast }) => {
  const [vacations, setVacations] = useState<VacationItem[]>(() => PlanningStorageService.getVacations());
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1)); // 2026년 10월 기준
  const [viewTab, setViewTab] = useState<'calendar' | 'list'>('calendar');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationItem | null>(null);

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

  const refreshVacations = () => {
    setVacations(PlanningStorageService.getVacations());
  };

  // 모달 열기 (신규 신청)
  const handleOpenCreateModal = (presetDate?: string) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 휴가를 등록할 수 없습니다.', 'error');
      return;
    }
    const defaultUser = teamMembers[0] || { id: 'u-1', name: '김기획' };
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
    setIsModalOpen(true);
  };

  // 모달 열기 (수정 or 상세)
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
    setIsModalOpen(true);
  };

  // 저장 처리
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
      setIsModalOpen(false);
      refreshVacations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '처리 중 오류 발생';
      onShowToast(msg, 'error');
    }
  };

  // 삭제 처리
  const handleDeleteVacation = (id: string, name: string) => {
    if (isViewer) return;
    if (window.confirm(`정말 ${name}의 휴가 일정을 취소하시겠습니까?`)) {
      PlanningStorageService.deleteVacation(id);
      onShowToast('휴가 일정이 취소되었습니다.', 'info');
      setIsModalOpen(false);
      refreshVacations();
    }
  };

  // 캘린더 네비게이션
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. 팀 부재 현황 위젯 */}
      <div
        className="card"
        style={{
          padding: '18px 22px',
          background: todayAbsentList.length > 0 ? '#fffbeb' : '#f0fdf4',
          borderColor: todayAbsentList.length > 0 ? '#fde68a' : '#bbf7d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: todayAbsentList.length > 0 ? '#f59e0b' : '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {todayAbsentList.length > 0 ? <UserX size={20} /> : <UserCheck size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              오늘의 팀원 부재 현황 ({todayStr})
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {todayAbsentList.length > 0
                ? `${todayAbsentList.map((v) => `${v.userName} (${VACATION_TYPES.find((t) => t.key === v.type)?.label})`).join(', ')} 부재 중입니다.`
                : '오늘 부재 중인 팀원이 없습니다. 전원 정상 근무 중입니다.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => handleOpenCreateModal()}
            className="btn btn-primary"
            disabled={isViewer}
            title={isViewer ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다' : '휴가 등록'}
          >
            <Plus size={16} /> 휴가 일정 등록
          </button>
        </div>
      </div>

      {/* 2. 캘린더 헤더 & 탭 컨트롤 */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handlePrevMonth}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title="이전 달"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 800, minWidth: '150px', textAlign: 'center' }}>
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
          </div>
        </div>

        {/* 뷰 모드 탭 */}
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
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: viewTab === 'calendar' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <CalendarIcon size={14} /> 월간 캘린더
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
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: viewTab === 'list' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            일정 목록 전체 ({vacations.length})
          </button>
        </div>
      </div>

      {/* 3-A. 캘린더 뷰 */}
      {viewTab === 'calendar' ? (
        <div className="card" style={{ padding: '16px', overflow: 'hidden' }}>
          {/* 요일 헤더 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '13px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ color: '#ef4444' }}>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div style={{ color: '#3b82f6' }}>토</div>
          </div>

          {/* 달력 날짜 그리드 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridAutoRows: 'minmax(105px, auto)',
              gap: '1px',
              background: 'var(--border-light)',
              marginTop: '1px',
            }}
          >
            {calendarDays.map((cell, idx) => {
              // 해당 날짜에 걸쳐 있는 휴가 항목 검색
              const dayVacations = vacations.filter(
                (v) => cell.dateStr >= v.startDate && cell.dateStr <= v.endDate
              );
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => !isViewer && handleOpenCreateModal(cell.dateStr)}
                  style={{
                    background: cell.isCurrentMonth ? '#ffffff' : '#f8fafc',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: isViewer ? 'default' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (cell.isCurrentMonth && !isViewer) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (cell.isCurrentMonth && !isViewer) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: isToday ? 800 : cell.isCurrentMonth ? 600 : 400,
                        color: isToday
                          ? '#ffffff'
                          : cell.isCurrentMonth
                          ? 'var(--text-main)'
                          : '#94a3b8',
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
                  </div>

                  {/* 해당 일자의 휴가 뱃지 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                    {dayVacations.map((v) => {
                      const typeConfig = VACATION_TYPES.find((t) => t.key === v.type) || VACATION_TYPES[0];
                      return (
                        <div
                          key={v.id}
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
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                          title={`대리업무: ${v.deputyName} / 비고: ${v.notes}`}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.userName.split(' ')[0]} ({typeConfig.label})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3-B. 휴가 목록 뷰 */
        <div className="card" style={{ overflow: 'hidden' }}>
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
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
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
        </div>
      )}

      {/* 4. 휴가 등록/수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
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
                onClick={() => setIsModalOpen(false)}
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
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  );
};
