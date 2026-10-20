import React, { useState } from 'react';
import type {
  KpiItem,
  KpiQuarter,
  KpiStatus,
  KpiTargetScope,
  KpiProcessStage,
  KpiGrade,
  KpiTrack,
  User,
} from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  Plus,
  Award,
  Edit3,
  Trash2,
  X,
  Clock,
  Users,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Lock,
} from 'lucide-react';

interface KpiViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const QUARTERS: { key: KpiQuarter; label: string }[] = [
  { key: 'Annual', label: '2026 연간 종합' },
  { key: 'Q4', label: '2026년 4분기' },
  { key: 'Q3', label: '2026년 3분기' },
  { key: 'Q2', label: '2026년 2분기' },
  { key: 'Q1', label: '2026년 1분기' },
];

const STATUS_MAP: Record<KpiStatus, { label: string; color: string; bg: string }> = {
  planning: { label: '목표수립', color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: '진행/점검중', color: '#2563eb', bg: '#eff6ff' },
  achieved: { label: '목표달성', color: '#059669', bg: '#ecfdf5' },
  partially_achieved: { label: '부분달성', color: '#d97706', bg: '#fffbeb' },
  missed: { label: '미달성', color: '#ef4444', bg: '#fee2e2' },
};

// 4단계 프로세스 단계 정의 및 메타데이터
const STAGE_CONFIG: Record<
  KpiProcessStage,
  { label: string; step: number; color: string; bg: string; description: string }
> = {
  draft: {
    label: '초안 작성',
    step: 1,
    color: '#64748b',
    bg: '#f1f5f9',
    description: '팀원이 연간 목표를 수립하고 가중치를 배분하는 단계',
  },
  alignment_pending: {
    label: '1단계: 합의 승인 대기',
    step: 1,
    color: '#d97706',
    bg: '#fffbeb',
    description: '팀장에게 목표 적절성 및 난이도 검토를 요청한 상태',
  },
  aligned: {
    label: '1단계: 목표 합의 완료 (Lock)',
    step: 1,
    color: '#059669',
    bg: '#ecfdf5',
    description: '팀장 승인이 완료되어 목표가 확정 및 잠금된 상태',
  },
  quarterly_checkin: {
    label: '2단계: 분기 점검/조정',
    step: 2,
    color: '#2563eb',
    bg: '#eff6ff',
    description: 'Q1~Q4 실적 트래킹 및 외생변수에 따른 목표 캘리브레이션 단계',
  },
  peer_review: {
    label: '3단계: 동료 다면평가',
    step: 3,
    color: '#7c3aed',
    bg: '#f5f3ff',
    description: '기획·디자인·퍼블리셔 간 협업 태도 및 산출물 360도 피드백',
  },
  leader_eval: {
    label: '4단계: 1차 팀장 평가',
    step: 4,
    color: '#0284c7',
    bg: '#f0f9ff',
    description: '팀원 자가평가 바탕 1차 팀장 점수/등급 부여 단계',
  },
  director_eval: {
    label: '4단계: 2차 실장 상신',
    step: 4,
    color: '#db2777',
    bg: '#fdf2f8',
    description: '팀장이 1차 평가를 상신하여 상위 실장의 최종 평가 대기 중',
  },
  finalized: {
    label: '4단계: 최종 평가 확정',
    step: 4,
    color: '#047857',
    bg: '#d1fae5',
    description: '실장 최종 승인 완료 및 연간 성과 평가가 마감된 상태',
  },
};

// 대기업 직군별 추천 KPI 템플릿
interface KpiPreset {
  track: KpiTrack;
  title: string;
  metric: string;
  targetValue: string;
  weight: number;
}

const KPI_PRESETS: KpiPreset[] = [
  // 기획
  {
    track: '기획',
    title: '핵심 서비스 주문/신청 전환율(CVR) 15% 개선',
    metric: '체크아웃 최종 전환율(CVR) 및 단계별 이탈률(Bounce Rate)',
    targetValue: '전환율 65% 이상 달성 (전년 대비 +15%)',
    weight: 35,
  },
  {
    track: '기획',
    title: '신규 기능 적기 런칭 및 사용자 안착(Adoption) 40% 달성',
    metric: '출시 후 30일 이내 활성 사용자(AU) 이용률 및 기능 Retention',
    targetValue: '타깃 사용자 이용률 40% 이상, 2주 잔존율 35% 이상',
    weight: 25,
  },
  {
    track: '기획',
    title: '주요 서비스 VOC 감축 및 고객 불만성 CS 인입률 30% 절감',
    metric: '기획/정책 결함으로 인한 고객센터(CS) 인입 건수',
    targetValue: '관련 인입 건수 전년 동기 대비 30% 감축',
    weight: 20,
  },
  {
    track: '기획',
    title: '연간 핵심 로드맵 3건 온타임 런칭(On-Time Delivery 100%)',
    metric: '기획-개발-QA 마일스톤 적기 준수율(%)',
    targetValue: '목표 런칭 일정 100% 준수 (지연 0건)',
    weight: 20,
  },
  // 디자인
  {
    track: '디자인',
    title: 'Figma 기반 전사 디자인 시스템 구축 및 컴포넌트 재사용률 80% 달성',
    metric: '공통 UI 컴포넌트 커버리지 및 프로젝트 재사용률(%)',
    targetValue: '핵심 컴포넌트 100% 라이브러리화, 재사용률 80% 달성',
    weight: 35,
  },
  {
    track: '디자인',
    title: '주요 태스크 완수 시간 20% 단축 및 UT(사용성) 만족도 85점 확보',
    metric: '핵심 과업 완수 시간(Time on Task) 및 SUS 사용성 만족도',
    targetValue: '과업 수행 시간 20% 단축, 만족도 85점 이상',
    weight: 35,
  },
  {
    track: '디자인',
    title: '디자인 QA 1차 패스율 90% 이상 유지 및 핸드오프 오류 최소화',
    metric: '개발 반영 후 디자인 싱크 오차율 및 디자인 결함 건수',
    targetValue: '1차 통과율 90% 이상 유지, 결함 발생 5건 이하',
    weight: 20,
  },
  {
    track: '디자인',
    title: '사용자 데이터 기반 A/B 테스트 디자인 가설 검증 4회 이상 완수',
    metric: 'A/B 테스트 시안 도출 및 정량 데이터 분석 리포트 발행 수',
    targetValue: '연간 분기별 1회 이상(총 4회) 가설 검증 완료',
    weight: 10,
  },
  // 퍼블리싱
  {
    track: '퍼블리싱',
    title: '웹 접근성(KWCAG 2.2) 준수 95점 및 크로스 브라우징 무결점 달성',
    metric: 'Lighthouse 접근성 점수 및 멀티 디바이스/OS 호환성 결함 건수',
    targetValue: '접근성 95점 이상, 크로스 브라우징 결함 0건',
    weight: 35,
  },
  {
    track: '퍼블리싱',
    title: 'UI 마크업 컴포넌트 모듈화로 신규 화면 제작 공수(M/D) 25% 절감',
    metric: '공통 마크업 모듈 재사용률 및 화면당 마크업 제작 리드타임',
    targetValue: '모듈 재사용률 75% 달성, 제작 공수 25% 단축',
    weight: 25,
  },
  {
    track: '퍼블리싱',
    title: '웹 성능 최적화(Core Web Vitals LCP 2.0s 이하 / CLS 0.1 미만 달성)',
    metric: '최대 콘텐츠 렌더링 시간(LCP) 및 시각적 안정성(CLS)',
    targetValue: '주요 서비스 화면 LCP 2.0s 이하, CLS 0.1 미만 유지',
    weight: 25,
  },
  {
    track: '퍼블리싱',
    title: '프론트엔드 연동 지원 납기 지연 0건 및 QA 결함 24시간 내 조치율 95%',
    metric: '마크업 마감 일정 준수율 및 마크업 결함 수정 SLA 준수율',
    targetValue: '납기 준수율 100%, 24시간 내 결함 조치율 95%',
    weight: 15,
  },
];

export const KpiView: React.FC<KpiViewProps> = ({ currentUser, isViewer, onShowToast }) => {
  const [kpis, setKpis] = useState<KpiItem[]>(() => PlanningStorageService.getKpis());
  const [selectedQuarter, setSelectedQuarter] = useState<KpiQuarter>('Annual');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'team' | 'individual'>('all');
  const [trackFilter, setTrackFilter] = useState<'all' | KpiTrack>('all');
  const [activeStepFilter, setActiveStepFilter] = useState<number | 'all'>('all');

  // 기본 등록/수정 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiItem | null>(null);

  // 단계별 전용 액션 모달 상태
  const [actionModal, setActionModal] = useState<{
    type: 'alignment' | 'checkin' | 'peer_review' | 'leader_eval' | 'director_eval' | null;
    kpi: KpiItem | null;
  }>({ type: null, kpi: null });

  // 1단계 합의 폼
  const [alignmentComment, setAlignmentComment] = useState('');

  // 2단계 체크인 폼
  const [checkinForm, setCheckinForm] = useState({
    quarter: 'Q4' as 'Q1' | 'Q2' | 'Q3' | 'Q4',
    currentValue: '',
    progressRate: 50,
    note: '',
    isAdjusted: false,
    adjustmentReason: '',
  });

  // 3단계 동료 다면평가 폼
  const [peerForm, setPeerForm] = useState({
    scoreCollaboration: 5,
    scoreQuality: 5,
    commentGood: '',
    commentImprove: '',
  });

  // 4단계 직책자 평가 폼
  const [evalForm, setEvalForm] = useState<{
    selfEval: string;
    selfScore: number;
    score: number;
    grade: KpiGrade;
    comment: string;
  }>({
    selfEval: '',
    selfScore: 85,
    score: 85,
    grade: 'A',
    comment: '',
  });

  const teamMembers = PlanningStorageService.getUsers().filter((u) => u.role !== 'viewer');

  // 직책자 및 권한 확인
  const isLeaderOrAdmin =
    currentUser.role === 'admin' ||
    currentUser.position?.includes('팀장') ||
    currentUser.position?.includes('실장') ||
    currentUser.name === '최범열';

  const isDirector =
    currentUser.position?.includes('실장') ||
    currentUser.name === '최범열' ||
    currentUser.role === 'admin';

  const [formData, setFormData] = useState({
    year: 2026,
    quarter: 'Annual' as KpiQuarter,
    targetScope: 'team' as KpiTargetScope,
    ownerName: '디지털서비스기획팀 전체',
    track: '기획' as KpiTrack,
    title: '',
    targetMetric: '',
    targetValue: '',
    currentValue: '',
    weight: 20,
    achievementRate: 0,
    status: 'in_progress' as KpiStatus,
    stage: 'draft' as KpiProcessStage,
    selfEvaluation: '',
    finalEvaluation: '',
    evaluatorName: '최범열 (관리자)',
  });

  const refreshKpis = () => {
    setKpis(PlanningStorageService.getKpis());
  };

  // 프리셋 자동 완성
  const handleApplyPreset = (preset: KpiPreset) => {
    setFormData((prev) => ({
      ...prev,
      track: preset.track,
      title: preset.title,
      targetMetric: preset.metric,
      targetValue: preset.targetValue,
      weight: preset.weight,
    }));
    onShowToast(`[${preset.track}] 표준 KPI 템플릿이 폼에 적용되었습니다.`, 'info');
  };

  // 모달 열기 (신규 등록)
  const handleOpenCreateModal = () => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 KPI를 등록할 수 없습니다.', 'error');
      return;
    }
    setEditingKpi(null);
    setFormData({
      year: 2026,
      quarter: selectedQuarter,
      targetScope: 'individual',
      ownerName: currentUser.name || teamMembers[0]?.name || '최범열',
      track: '기획',
      title: '',
      targetMetric: '',
      targetValue: '',
      currentValue: '',
      weight: 25,
      achievementRate: 0,
      status: 'planning',
      stage: 'draft',
      selfEvaluation: '',
      finalEvaluation: '',
      evaluatorName: '최범열 (관리자)',
    });
    setIsModalOpen(true);
  };

  // 모달 열기 (수정 or 상세)
  const handleOpenEditModal = (item: KpiItem) => {
    setEditingKpi(item);
    setFormData({
      year: item.year,
      quarter: item.quarter,
      targetScope: item.targetScope,
      ownerName: item.ownerName,
      track: item.track || '기획',
      title: item.title,
      targetMetric: item.targetMetric,
      targetValue: item.targetValue,
      currentValue: item.currentValue,
      weight: item.weight,
      achievementRate: item.achievementRate,
      status: item.status,
      stage: item.stage || 'draft',
      selfEvaluation: item.selfEvaluation || '',
      finalEvaluation: item.finalEvaluation || '',
      evaluatorName: item.evaluatorName || '최범열 (관리자)',
    });
    setIsModalOpen(true);
  };

  // KPI 저장 (등록 / 기본수정)
  const handleSaveKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!formData.title.trim()) {
      onShowToast('KPI 목표명을 입력해 주세요.', 'error');
      return;
    }

    try {
      if (editingKpi) {
        PlanningStorageService.updateKpi(editingKpi.id, {
          year: Number(formData.year),
          quarter: formData.quarter,
          targetScope: formData.targetScope,
          ownerName: formData.ownerName,
          track: formData.track,
          title: formData.title.trim(),
          targetMetric: formData.targetMetric,
          targetValue: formData.targetValue,
          currentValue: formData.currentValue,
          weight: Number(formData.weight),
          achievementRate: Number(formData.achievementRate),
          status: formData.status,
          stage: formData.stage,
          selfEvaluation: formData.selfEvaluation,
          finalEvaluation: formData.finalEvaluation,
          evaluatorName: formData.evaluatorName,
        });
        onShowToast('KPI 정보가 성공적으로 갱신되었습니다.', 'success');
      } else {
        PlanningStorageService.createKpi({
          year: Number(formData.year),
          quarter: formData.quarter,
          targetScope: formData.targetScope,
          ownerName: formData.ownerName,
          track: formData.track,
          title: formData.title.trim(),
          targetMetric: formData.targetMetric,
          targetValue: formData.targetValue,
          currentValue: formData.currentValue,
          weight: Number(formData.weight),
          achievementRate: Number(formData.achievementRate),
          status: formData.status,
          stage: 'draft',
          selfEvaluation: formData.selfEvaluation,
          finalEvaluation: formData.finalEvaluation,
          evaluatorName: formData.evaluatorName,
        });
        onShowToast('새로운 KPI 목표가 초안으로 등록되었습니다. [1단계: 합의 요청]을 진행해 주세요.', 'success');
      }
      setIsModalOpen(false);
      refreshKpis();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '처리 중 오류 발생';
      onShowToast(msg, 'error');
    }
  };

  // 삭제
  const handleDeleteKpi = (id: string, title: string) => {
    if (isViewer) return;
    if (window.confirm(`정말 "${title}" KPI 항목을 삭제하시겠습니까?`)) {
      PlanningStorageService.deleteKpi(id);
      onShowToast('KPI 항목이 삭제되었습니다.', 'info');
      setIsModalOpen(false);
      refreshKpis();
    }
  };

  // --- 단계별 액션 핸들러 ---
  // 1. 합의 요청 / 승인 / 반려
  const handleOpenAlignmentModal = (kpi: KpiItem) => {
    setActionModal({ type: 'alignment', kpi });
    setAlignmentComment(kpi.alignmentComment || '');
  };

  const handleExecuteAlignment = (action: 'request' | 'approve' | 'reject') => {
    if (!actionModal.kpi) return;
    try {
      if (action === 'request') {
        PlanningStorageService.requestKpiAlignment(actionModal.kpi.id, alignmentComment);
        onShowToast('팀장에게 목표 합의를 요청했습니다.', 'success');
      } else if (action === 'approve') {
        PlanningStorageService.approveKpiAlignment(actionModal.kpi.id, alignmentComment);
        onShowToast('목표 합의가 승인되어 목표가 확정(Lock)되었습니다.', 'success');
      } else {
        PlanningStorageService.rejectKpiAlignment(actionModal.kpi.id, alignmentComment || '보완 요청');
        onShowToast('목표 보완(반려)을 요청했습니다.', 'info');
      }
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '오류 발생', 'error');
    }
  };

  // 2. 분기 체크인 및 조정
  const handleOpenCheckinModal = (kpi: KpiItem) => {
    setActionModal({ type: 'checkin', kpi });
    setCheckinForm({
      quarter: (selectedQuarter === 'Annual' ? 'Q4' : selectedQuarter) as 'Q1' | 'Q2' | 'Q3' | 'Q4',
      currentValue: kpi.currentValue || '',
      progressRate: kpi.achievementRate || 50,
      note: '',
      isAdjusted: false,
      adjustmentReason: '',
    });
  };

  const handleSaveCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi) return;
    try {
      PlanningStorageService.addQuarterlyCheckin(actionModal.kpi.id, {
        quarter: checkinForm.quarter,
        currentValue: checkinForm.currentValue,
        progressRate: Number(checkinForm.progressRate),
        note: checkinForm.note,
        isAdjusted: checkinForm.isAdjusted,
        adjustmentReason: checkinForm.isAdjusted ? checkinForm.adjustmentReason : undefined,
      });
      onShowToast(`${checkinForm.quarter} 분기 실적 점검 및 체크인이 기록되었습니다.`, 'success');
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '체크인 실패', 'error');
    }
  };

  // 3. 동료 다면평가
  const handleOpenPeerModal = (kpi: KpiItem) => {
    setActionModal({ type: 'peer_review', kpi });
    const existing = kpi.peerReviews?.find((p) => p.reviewerId === currentUser.id);
    if (existing) {
      setPeerForm({
        scoreCollaboration: existing.scoreCollaboration,
        scoreQuality: existing.scoreQuality,
        commentGood: existing.commentGood,
        commentImprove: existing.commentImprove,
      });
    } else {
      setPeerForm({
        scoreCollaboration: 5,
        scoreQuality: 5,
        commentGood: '',
        commentImprove: '',
      });
    }
  };

  const handleSavePeerReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi) return;
    try {
      PlanningStorageService.submitPeerReview(actionModal.kpi.id, {
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
        reviewerTrack: (currentUser.department?.includes('디자인') ? '디자인' : currentUser.department?.includes('퍼블') ? '퍼블리싱' : '기획') as KpiTrack,
        scoreCollaboration: Number(peerForm.scoreCollaboration),
        scoreQuality: Number(peerForm.scoreQuality),
        commentGood: peerForm.commentGood,
        commentImprove: peerForm.commentImprove,
      });
      onShowToast('동료 다면평가가 성공적으로 제출되었습니다. (블라인드 보호)', 'success');
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '평가 제출 오류', 'error');
    }
  };

  // 4. 직책자 평가 (자가평가 / 팀장 1차 / 실장 2차)
  const handleOpenEvalModal = (kpi: KpiItem, evalType: 'leader_eval' | 'director_eval') => {
    setActionModal({ type: evalType, kpi });
    setEvalForm({
      selfEval: kpi.selfEvaluation || '',
      selfScore: kpi.selfScore ?? 85,
      score: evalType === 'leader_eval' ? (kpi.leaderScore ?? 85) : (kpi.directorScore ?? 85),
      grade: evalType === 'leader_eval' ? (kpi.leaderGrade ?? 'A') : (kpi.directorGrade ?? 'A'),
      comment: evalType === 'leader_eval' ? (kpi.leaderComment ?? '') : (kpi.directorComment ?? ''),
    });
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi) return;
    try {
      if (actionModal.type === 'leader_eval') {
        // 본인 자가평가 먼저 보존
        if (evalForm.selfEval) {
          PlanningStorageService.submitSelfEvaluation(actionModal.kpi.id, evalForm.selfEval, evalForm.selfScore);
        }
        PlanningStorageService.submitLeaderEvaluation(actionModal.kpi.id, {
          score: Number(evalForm.score),
          grade: evalForm.grade,
          comment: evalForm.comment,
        });
        onShowToast('1차 팀장 평가가 완료되어 상위 실장 평가로 상신되었습니다.', 'success');
      } else if (actionModal.type === 'director_eval') {
        PlanningStorageService.submitDirectorEvaluation(actionModal.kpi.id, {
          score: Number(evalForm.score),
          grade: evalForm.grade,
          comment: evalForm.comment,
        });
        onShowToast('상위 실장 2차 최종 평가가 확정되어 KPI가 마감되었습니다.', 'success');
      }
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '평가 저장 실패', 'error');
    }
  };

  // 현재 필터링된 KPI 목록
  const currentKpis = kpis.filter((k) => {
    const matchesQuarter =
      selectedQuarter === 'Annual' ? true : k.quarter === selectedQuarter || k.quarter === 'Annual';
    const matchesScope = scopeFilter === 'all' || k.targetScope === scopeFilter;
    const matchesTrack = trackFilter === 'all' || (k.track || '기획') === trackFilter;
    const currentStep = STAGE_CONFIG[k.stage || 'draft']?.step || 1;
    const matchesStep = activeStepFilter === 'all' || currentStep === activeStepFilter;

    return matchesQuarter && matchesScope && matchesTrack && matchesStep;
  });

  // 종합 달성률 (가중 평균 계산)
  const totalWeight = currentKpis.reduce((acc, cur) => acc + (cur.weight || 0), 0);
  const weightedScore = currentKpis.reduce((acc, cur) => acc + (cur.achievementRate * cur.weight) / 100, 0);
  const normalizedTotalScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. 상단 KPI 종합 대시보드 배너 */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#93c5fd',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            <Award size={16} /> 서비스기획팀 성과관리 체계 (4단계 라이프사이클)
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
            {selectedQuarter === 'Annual' ? '2026 연간 종합 KPI 달성 및 평가 대시보드' : `${selectedQuarter} 분기 KPI 진행 현황`}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', marginBottom: 0 }}>
            총 과제 {currentKpis.length}건 / 가중치 합계 {totalWeight}% (목표: 100%)
          </p>
        </div>

        {/* 달성률 프로그레스 게이지 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>종합 가중 달성률</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: '#60a5fa' }}>{normalizedTotalScore}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(normalizedTotalScore, 100)}%`,
                height: '100%',
                background: normalizedTotalScore >= 80 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* 신규 등록 액션 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            disabled={isViewer}
            style={{ padding: '10px 18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            title={isViewer ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다' : '신규 KPI 등록'}
          >
            <Plus size={16} /> 신규 KPI 목표 수립
          </button>
        </div>
      </div>

      {/* 2. 4단계 프로세스 타임라인 위젯 (클릭 시 단계별 필터링) */}
      <div
        className="card"
        style={{
          padding: '18px 22px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} style={{ color: '#2563eb' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              KPI 4단계 라이프사이클 프로세스
            </h4>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveStepFilter('all')}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: activeStepFilter === 'all' ? '#0f172a' : '#f1f5f9',
                color: activeStepFilter === 'all' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              전체 단계 보기
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {/* 1단계 */}
          <div
            onClick={() => setActiveStepFilter(1)}
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: activeStepFilter === 1 ? '#eff6ff' : '#f8fafc',
              border: activeStepFilter === 1 ? '2px solid #2563eb' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>STEP 1</span>
              <Lock size={14} style={{ color: '#64748b' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              연초 목표 합의 (Lock)
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              팀원 목표 등록 ➔ 팀장 난이도 검토 ➔ 합의 승인
            </div>
          </div>

          {/* 2단계 */}
          <div
            onClick={() => setActiveStepFilter(2)}
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: activeStepFilter === 2 ? '#ecfdf5' : '#f8fafc',
              border: activeStepFilter === 2 ? '2px solid #10b981' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>STEP 2</span>
              <Clock size={14} style={{ color: '#64748b' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              분기 점검 및 조정 (Check-in)
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              Q1~Q4 정기 진척 점검 ➔ 외생변수 발생 시 목표 캘리브레이션
            </div>
          </div>

          {/* 3단계 */}
          <div
            onClick={() => setActiveStepFilter(3)}
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: activeStepFilter === 3 ? '#f5f3ff' : '#f8fafc',
              border: activeStepFilter === 3 ? '2px solid #7c3aed' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>STEP 3</span>
              <Users size={14} style={{ color: '#64748b' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              동료 다면평가 (Peer 360)
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              기획·디자인·퍼블리셔 상호 협업 태도/품질 블라인드 피드백
            </div>
          </div>

          {/* 4단계 */}
          <div
            onClick={() => setActiveStepFilter(4)}
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: activeStepFilter === 4 ? '#fdf2f8' : '#f8fafc',
              border: activeStepFilter === 4 ? '2px solid #db2777' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#db2777' }}>STEP 4</span>
              <ShieldCheck size={14} style={{ color: '#64748b' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              팀장 1차 ➔ 실장 2차 최종평가
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              자가평가 + 동료평가 집계 ➔ 팀장 1차 상신 ➔ 실장 최종 등급 확정
            </div>
          </div>
        </div>
      </div>

      {/* 3. 필터 바 (분기, 직군 트랙, 범위) */}
      <div
        className="card"
        style={{
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* 분기 선택 */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {QUARTERS.map((q) => (
            <button
              key={q.key}
              onClick={() => setSelectedQuarter(q.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: selectedQuarter === q.key ? '#2563eb' : '#f1f5f9',
                color: selectedQuarter === q.key ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* 직군 트랙 & 범위 필터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>직군:</span>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value as 'all' | KpiTrack)}
              className="form-select"
              style={{ width: '110px', padding: '6px 10px', fontSize: '12.5px' }}
            >
              <option value="all">전체 직군</option>
              <option value="기획">서비스기획</option>
              <option value="디자인">UI/UX 디자인</option>
              <option value="퍼블리싱">웹 퍼블리싱</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>범위:</span>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as 'all' | 'team' | 'individual')}
              className="form-select"
              style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
            >
              <option value="all">전체 (팀+개인)</option>
              <option value="team">팀 공통 과제</option>
              <option value="individual">개인별 과제</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. KPI 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {currentKpis.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              gridColumn: '1 / -1',
              color: 'var(--text-muted)',
            }}
          >
            <Award size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
              해당 조건의 KPI 과제가 없습니다.
            </div>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>
              상단의 [신규 KPI 목표 수립] 버튼을 눌러 직군별 표준 과제를 등록해 보세요.
            </p>
          </div>
        ) : (
          currentKpis.map((kpi) => {
            const statusCfg = STATUS_MAP[kpi.status] || STATUS_MAP.in_progress;
            const stageCfg = STAGE_CONFIG[kpi.stage || 'draft'] || STAGE_CONFIG.draft;
            const isOwner = kpi.ownerName === currentUser.name || kpi.ownerId === currentUser.id;

            return (
              <div
                key={kpi.id}
                className="card"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderLeft: `4px solid ${stageCfg.color}`,
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                }}
              >
                {/* 상단 메타 및 4단계 배지 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {kpi.quarter}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: kpi.track === '디자인' ? '#fdf2f8' : kpi.track === '퍼블리싱' ? '#f0fdf4' : '#eff6ff',
                        color: kpi.track === '디자인' ? '#db2777' : kpi.track === '퍼블리싱' ? '#15803d' : '#2563eb',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {kpi.track || '기획'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {kpi.ownerName}
                    </span>
                    {isOwner && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        내 과제
                      </span>
                    )}
                  </div>

                  {/* 프로세스 단계 배지 */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: stageCfg.bg,
                      color: stageCfg.color,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title={stageCfg.description}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stageCfg.color }} />
                    {stageCfg.label}
                  </span>
                </div>

                {/* 목표 제목 */}
                <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4, margin: 0 }}>
                  {kpi.title}
                </h3>

                {/* 측정 지표 및 수치 비교 */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-muted)' }}>측정 지표:</strong> {kpi.targetMetric}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                    <span>목표치: <strong style={{ color: 'var(--text-main)' }}>{kpi.targetValue}</strong></span>
                    <span>현재치: <strong style={{ color: '#2563eb' }}>{kpi.currentValue || '측정 대기'}</strong></span>
                  </div>
                </div>

                {/* 달성률 & 가중치 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      가중치: {kpi.weight}%
                    </span>
                    <span style={{ fontWeight: 800, color: kpi.achievementRate >= 80 ? '#059669' : '#2563eb' }}>
                      달성률 {kpi.achievementRate}% ({statusCfg.label})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(kpi.achievementRate, 100)}%`,
                        height: '100%',
                        background: kpi.achievementRate >= 80 ? '#10b981' : '#2563eb',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>

                {/* 다면평가 및 직책자 최종 평가 하이라이트 박스 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  {/* 동료 다면평가 요약 */}
                  {kpi.peerReviews && kpi.peerReviews.length > 0 && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6d28d9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} /> 동료 다면평가 ({kpi.peerReviews.length}명 참여)
                      </span>
                      <span style={{ fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={12} fill="#7c3aed" /> {kpi.peerAvgScore || 5.0} / 5.0
                      </span>
                    </div>
                  )}

                  {/* 1차/2차 직책자 평가 결과 */}
                  {(kpi.leaderGrade || kpi.directorGrade) && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 10px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#065f46' }}>
                        <span>
                          {kpi.directorGrade ? '2차 실장 최종 등급' : '1차 팀장 추천 등급'}
                        </span>
                        <span style={{ fontSize: '14px', color: '#047857' }}>
                          {kpi.directorGrade ? `${kpi.directorGrade}등급 (${kpi.directorScore}점)` : `${kpi.leaderGrade}등급 (${kpi.leaderScore}점)`}
                        </span>
                      </div>
                      {(kpi.directorComment || kpi.leaderComment) && (
                        <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#047857' }}>
                          "{kpi.directorComment || kpi.leaderComment}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* 분기 체크인 최신 메모 */}
                  {kpi.checkins && kpi.checkins.length > 0 && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#1e40af' }}>
                      <strong>[{kpi.checkins[kpi.checkins.length - 1].quarter} 체크인]</strong> {kpi.checkins[kpi.checkins.length - 1].note || '실적 갱신 완료'}
                    </div>
                  )}
                </div>

                {/* 4단계 프로세스 원클릭 액션 버튼 툴바 */}
                {!isViewer && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      단계별 액션:
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {/* STEP 1: 합의 요청 or 팀장 승인 */}
                      {(!kpi.stage || kpi.stage === 'draft' || kpi.stage === 'alignment_pending') && (
                        <button
                          onClick={() => handleOpenAlignmentModal(kpi)}
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11.5px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                        >
                          {kpi.stage === 'alignment_pending' && isLeaderOrAdmin ? '1단계: 합의 승인/반려' : '1단계: 목표 합의 요청'}
                        </button>
                      )}

                      {/* STEP 2: 분기 체크인 */}
                      <button
                        onClick={() => handleOpenCheckinModal(kpi)}
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11.5px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                      >
                        2단계: 분기 점검
                      </button>

                      {/* STEP 3: 동료 다면평가 */}
                      <button
                        onClick={() => handleOpenPeerModal(kpi)}
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11.5px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
                      >
                        3단계: 동료평가
                      </button>

                      {/* STEP 4: 1차 팀장 평가 */}
                      {isLeaderOrAdmin && (
                        <button
                          onClick={() => handleOpenEvalModal(kpi, 'leader_eval')}
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11.5px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' }}
                        >
                          4단계: 팀장평가
                        </button>
                      )}

                      {/* STEP 4: 2차 실장 최종 확정 */}
                      {isDirector && (
                        <button
                          onClick={() => handleOpenEvalModal(kpi, 'director_eval')}
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11.5px', background: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' }}
                        >
                          4단계: 실장확정
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 하단 관리 버튼 */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    수정자: {kpi.updatedBy || kpi.createdBy}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEditModal(kpi)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      <Edit3 size={13} /> {isViewer ? '상세 조회' : '상세/수정'}
                    </button>
                    {!isViewer && (
                      <button
                        onClick={() => handleDeleteKpi(kpi.id, kpi.title)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
                        title="KPI 삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- 모달 1: 기본 KPI 목표 등록/수정 모달 (프리셋 지원) --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingKpi
                  ? isViewer
                    ? 'KPI 상세 정보 (읽기 전용)'
                    : 'KPI 목표 상세 수정'
                  : '신규 연간 KPI 목표 수립'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveKpi}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 대기업 표준 템플릿 선택 프리셋 */}
                {!editingKpi && !isViewer && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                      border: '1px solid #bfdbfe',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>
                      <Sparkles size={15} /> 대기업 직군별 표준 KPI 프리셋 자동완성
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {KPI_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#334155',
                            fontWeight: 500,
                          }}
                        >
                          [{p.track}] {p.title.slice(0, 18)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1. 목표명 */}
                <div className="form-group">
                  <label className="form-label">KPI 목표명 *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 원클릭 간편결제 런칭 및 구매 전환율 2.5%p 개선"
                    className="form-input"
                  />
                </div>

                {/* 2. 대상 범위, 직군 트랙, 담당자 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">직군 파트</label>
                    <select
                      disabled={isViewer}
                      value={formData.track}
                      onChange={(e) => setFormData({ ...formData, track: e.target.value as KpiTrack })}
                      className="form-select"
                    >
                      <option value="기획">서비스기획</option>
                      <option value="디자인">UI/UX 디자인</option>
                      <option value="퍼블리싱">웹 퍼블리싱</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">평가 기간</label>
                    <select
                      disabled={isViewer}
                      value={formData.quarter}
                      onChange={(e) => setFormData({ ...formData, quarter: e.target.value as KpiQuarter })}
                      className="form-select"
                    >
                      {QUARTERS.map((q) => (
                        <option key={q.key} value={q.key}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">담당자</label>
                    <select
                      disabled={isViewer}
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="form-select"
                    >
                      <option value="디지털서비스기획팀 전체">팀 전체 (공통)</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.department || '팀원'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. 측정 지표 */}
                <div className="form-group">
                  <label className="form-label">측정 기준 및 산출 지표 *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    value={formData.targetMetric}
                    onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })}
                    placeholder="예: 체크아웃 최종 결제 전환율(CVR) 및 이탈률 트래킹"
                    className="form-input"
                  />
                </div>

                {/* 4. 목표치 & 현재치 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">목표치 *</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      required
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      placeholder="예: CVR 65% 이상"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">현재 달성 수치</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      value={formData.currentValue}
                      onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                      placeholder="예: 63.8% (진행 중)"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 5. 가중치 & 달성률 & 라이프사이클 단계 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">가중치 (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      disabled={isViewer}
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">달성률 ({formData.achievementRate}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="5"
                      disabled={isViewer}
                      value={formData.achievementRate}
                      onChange={(e) => setFormData({ ...formData, achievementRate: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: '10px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">프로세스 단계</label>
                    <select
                      disabled={isViewer}
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value as KpiProcessStage })}
                      className="form-select"
                    >
                      {Object.entries(STAGE_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                {editingKpi && !isViewer && (
                  <button
                    type="button"
                    onClick={() => handleDeleteKpi(editingKpi.id, editingKpi.title)}
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
                    {editingKpi ? '목표 정보 갱신' : '목표 초안 저장'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 모달 2: [1단계] 팀장 목표 합의(Alignment) 모달 --- */}
      {actionModal.type === 'alignment' && actionModal.kpi && (
        <div className="modal-overlay" onClick={() => setActionModal({ type: null, kpi: null })}>
          <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: '#2563eb' }} /> [1단계] 연초 KPI 목표 합의 (Goal Alignment)
              </h3>
              <button
                onClick={() => setActionModal({ type: null, kpi: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>과제명:</div>
                <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{actionModal.kpi.title}</strong>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                  <span>담당자: {actionModal.kpi.ownerName}</span>
                  <span>가중치: {actionModal.kpi.weight}%</span>
                  <span>목표치: {actionModal.kpi.targetValue}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">합의 코멘트 / 보완 피드백</label>
                <textarea
                  rows={3}
                  value={alignmentComment}
                  onChange={(e) => setAlignmentComment(e.target.value)}
                  placeholder="팀장에게 검토 요청할 메시지나, 팀장의 난이도 보완 피드백을 입력하세요..."
                  className="form-textarea"
                />
              </div>

              {actionModal.kpi.alignedBy && (
                <div style={{ fontSize: '12px', color: '#059669', background: '#ecfdf5', padding: '8px 12px', borderRadius: '4px' }}>
                  ✓ {actionModal.kpi.alignedBy}님이 {new Date(actionModal.kpi.alignedAt || '').toLocaleDateString()} 에 합의 승인 완료함
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActionModal({ type: null, kpi: null })}
                className="btn btn-secondary"
              >
                닫기
              </button>

              {/* 팀원용 합의 요청 버튼 */}
              <button
                type="button"
                onClick={() => handleExecuteAlignment('request')}
                className="btn btn-secondary"
                style={{ background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
              >
                팀장 합의 요청
              </button>

              {/* 팀장용 승인 / 반려 버튼 */}
              {isLeaderOrAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => handleExecuteAlignment('reject')}
                    className="btn btn-danger"
                  >
                    보완 요청 (반려)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteAlignment('approve')}
                    className="btn btn-primary"
                  >
                    목표 합의 승인 (Lock)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 모달 3: [2단계] 분기 점검 및 목표 조정(Check-in & Calibration) 모달 --- */}
      {actionModal.type === 'checkin' && actionModal.kpi && (
        <div className="modal-overlay" onClick={() => setActionModal({ type: null, kpi: null })}>
          <div className="modal-box" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: '#10b981' }} /> [2단계] 분기 점검 및 목표 조정 (Check-in)
              </h3>
              <button
                onClick={() => setActionModal({ type: null, kpi: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCheckin}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}>
                  <strong>{actionModal.kpi.title}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                    원래 목표치: {actionModal.kpi.targetValue}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">점검 대상 분기</label>
                    <select
                      value={checkinForm.quarter}
                      onChange={(e) => setCheckinForm({ ...checkinForm, quarter: e.target.value as any })}
                      className="form-select"
                    >
                      <option value="Q1">1분기 (Q1)</option>
                      <option value="Q2">2분기 (Q2)</option>
                      <option value="Q3">3분기 (Q3)</option>
                      <option value="Q4">4분기 (Q4)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">현재 달성 수치</label>
                    <input
                      type="text"
                      required
                      value={checkinForm.currentValue}
                      onChange={(e) => setCheckinForm({ ...checkinForm, currentValue: e.target.value })}
                      placeholder="예: 전환율 61.2%"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">분기 진척률 ({checkinForm.progressRate}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={checkinForm.progressRate}
                    onChange={(e) => setCheckinForm({ ...checkinForm, progressRate: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">추진 경과 및 장애 요인 (메모)</label>
                  <textarea
                    rows={2}
                    value={checkinForm.note}
                    onChange={(e) => setCheckinForm({ ...checkinForm, note: e.target.value })}
                    placeholder="이슈 사항, 개발 의존성 지연, 마케팅 프로모션 현황 등 기록..."
                    className="form-textarea"
                  />
                </div>

                {/* 외생변수에 의한 목표 조정 옵션 */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#b45309' }}>
                    <input
                      type="checkbox"
                      checked={checkinForm.isAdjusted}
                      onChange={(e) => setCheckinForm({ ...checkinForm, isAdjusted: e.target.checked })}
                    />
                    사업 환경 변화/외생 변수로 인한 목표 조정(Calibration) 필요
                  </label>
                  {checkinForm.isAdjusted && (
                    <div className="form-group" style={{ marginTop: '8px' }}>
                      <textarea
                        rows={2}
                        required
                        value={checkinForm.adjustmentReason}
                        onChange={(e) => setCheckinForm({ ...checkinForm, adjustmentReason: e.target.value })}
                        placeholder="목표 조정 사유를 상세히 작성해 주세요 (예: 신규 결제사 제휴 지연으로 타깃 분기 이연)..."
                        className="form-textarea"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setActionModal({ type: null, kpi: null })}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  체크인 실적 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 모달 4: [3단계] 동료 다면평가(Peer 360 Review) 모달 --- */}
      {actionModal.type === 'peer_review' && actionModal.kpi && (
        <div className="modal-overlay" onClick={() => setActionModal({ type: null, kpi: null })}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: '#7c3aed' }} /> [3단계] 동료 다면평가 (블라인드 보호)
              </h3>
              <button
                onClick={() => setActionModal({ type: null, kpi: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePeerReview}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                  <div style={{ color: '#6d28d9', fontWeight: 600 }}>평가 대상 과제:</div>
                  <strong>{actionModal.kpi.title}</strong>
                  <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '2px' }}>
                    담당자: {actionModal.kpi.ownerName} ({actionModal.kpi.track || '기획'})
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      협업 태도 및 소통 (How) - 5점 척도
                    </label>
                    <select
                      value={peerForm.scoreCollaboration}
                      onChange={(e) => setPeerForm({ ...peerForm, scoreCollaboration: Number(e.target.value) })}
                      className="form-select"
                    >
                      <option value="5">5점 - 매우 우수 (원활한 소통 및 협업 태도)</option>
                      <option value="4">4점 - 우수 (일정 및 소통 양호)</option>
                      <option value="3">3점 - 보통 (기본 협업 수행)</option>
                      <option value="2">2점 - 미흡 (소통 지연/조정 필요)</option>
                      <option value="1">1점 - 매우 미흡</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      산출물 품질 및 완성도 (Quality) - 5점
                    </label>
                    <select
                      value={peerForm.scoreQuality}
                      onChange={(e) => setPeerForm({ ...peerForm, scoreQuality: Number(e.target.value) })}
                      className="form-select"
                    >
                      <option value="5">5점 - 매우 완성도 높음 (결함 제로)</option>
                      <option value="4">4점 - 우수 (재작업 최소화)</option>
                      <option value="3">3점 - 보통</option>
                      <option value="2">2점 - 보완 필요 (결함 다수)</option>
                      <option value="1">1점 - 심각한 품질 결함</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">올해 가장 고마웠거나 좋았던 점 (칭찬)</label>
                  <textarea
                    rows={2}
                    required
                    value={peerForm.commentGood}
                    onChange={(e) => setPeerForm({ ...peerForm, commentGood: e.target.value })}
                    placeholder="예: 예외 케이스 정의를 꼼꼼히 챙겨주어 디자인/개발 시 큰 혼선 없이 적기에 끝낼 수 있었습니다..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">내년에 보완 또는 개선하면 좋을 점 (성장 피드백)</label>
                  <textarea
                    rows={2}
                    value={peerForm.commentImprove}
                    onChange={(e) => setPeerForm({ ...peerForm, commentImprove: e.target.value })}
                    placeholder="예: 디자인 핸드오프 시 모바일 해상도 고려가 조금 더 보강되면 좋겠습니다..."
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setActionModal({ type: null, kpi: null })}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#7c3aed', borderColor: '#6d28d9' }}>
                  동료 다면평가 제출
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 모달 5: [4단계] 팀장 1차 평가 & 실장 2차 최종 확정 모달 --- */}
      {(actionModal.type === 'leader_eval' || actionModal.type === 'director_eval') && actionModal.kpi && (
        <div className="modal-overlay" onClick={() => setActionModal({ type: null, kpi: null })}>
          <div className="modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: actionModal.type === 'leader_eval' ? '#0284c7' : '#db2777' }} />
                {actionModal.type === 'leader_eval' ? '[4단계-1] 팀 리더 1차 평가 및 실장 상신' : '[4단계-2] 상위 실장 2차 최종 평가 확정'}
              </h3>
              <button
                onClick={() => setActionModal({ type: null, kpi: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 실적 요약 카드 */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '6px', fontSize: '13px' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {actionModal.kpi.title}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', marginTop: '6px' }}>
                    <div>담당자: <strong>{actionModal.kpi.ownerName}</strong></div>
                    <div>가중치: <strong>{actionModal.kpi.weight}%</strong></div>
                    <div>달성률: <strong style={{ color: '#2563eb' }}>{actionModal.kpi.achievementRate}%</strong></div>
                  </div>
                </div>

                {/* 동료 다면평가 결과 요약 (직책자 열람용) */}
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#6d28d9', marginBottom: '4px' }}>
                    <span>3단계 동료 다면평가 결과 집계</span>
                    <span>평균: {actionModal.kpi.peerAvgScore || 5.0} / 5.0 ({actionModal.kpi.peerReviews?.length || 0}명 참여)</span>
                  </div>
                  {actionModal.kpi.peerReviews && actionModal.kpi.peerReviews.length > 0 && (
                    <div style={{ fontSize: '11.5px', color: '#4c1d95', marginTop: '4px' }}>
                      최근 피드백: "{actionModal.kpi.peerReviews[0].commentGood}"
                    </div>
                  )}
                </div>

                {/* 팀원 본인 자가평가 */}
                <div className="form-group">
                  <label className="form-label">팀원 연간 자가평가 (Self-Review)</label>
                  <textarea
                    rows={2}
                    value={evalForm.selfEval}
                    onChange={(e) => setEvalForm({ ...evalForm, selfEval: e.target.value })}
                    placeholder="담당자 본인의 연간 성과 기여도 및 반성/소감..."
                    className="form-textarea"
                  />
                </div>

                {/* 평가 점수 & 등급 선택 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {actionModal.type === 'leader_eval' ? '1차 팀장 점수 (100점 만점)' : '2차 실장 최종 점수 (100점)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={evalForm.score}
                      onChange={(e) => setEvalForm({ ...evalForm, score: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {actionModal.type === 'leader_eval' ? '1차 추천 등급' : '최종 확정 등급'}
                    </label>
                    <select
                      value={evalForm.grade}
                      onChange={(e) => setEvalForm({ ...evalForm, grade: e.target.value as KpiGrade })}
                      className="form-select"
                    >
                      <option value="S">S등급 (탁월한 성과 - 상위 10%)</option>
                      <option value="A">A등급 (목표 초과 달성 - 상위 30%)</option>
                      <option value="B">B등급 (목표 충실 달성 - 50%)</option>
                      <option value="C">C등급 (일부 미흡 - 10%)</option>
                      <option value="D">D등급 (개선 필요)</option>
                    </select>
                  </div>
                </div>

                {/* 종합 평가 총평 */}
                <div className="form-group">
                  <label className="form-label">
                    {actionModal.type === 'leader_eval' ? '팀장 1차 종합 평가 의견 (실장 상신용)' : '실장 2차 최종 총평 (피드백용)'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={evalForm.comment}
                    onChange={(e) => setEvalForm({ ...evalForm, comment: e.target.value })}
                    placeholder="평가 근거, 난이도 보정 사유, 동료 다면평가 반영 사항을 기술하세요..."
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setActionModal({ type: null, kpi: null })}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: actionModal.type === 'leader_eval' ? '#0284c7' : '#db2777',
                    borderColor: actionModal.type === 'leader_eval' ? '#0369a1' : '#be185d',
                  }}
                >
                  {actionModal.type === 'leader_eval' ? '1차 평가 완료 및 실장 상신' : '2차 최종 평가 확정 (마감)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
