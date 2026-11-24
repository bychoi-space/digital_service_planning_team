import type {
  KpiCyclePhaseKey,
  KpiCycleSchedule,
  KpiItem,
  KpiQuarter,
} from '../../types';
import { checkHasSelfEval, getValidFinalGrade, getValidLeaderGrade } from './kpiShared';

export function buildKpiCycleKey(year: number, quarter: KpiQuarter): string {
  return `${year}-${quarter}`;
}

export function formatCycleFullLabel(year: number, quarter: KpiQuarter): string {
  const qNum = quarter.replace('Q', '');
  return `${year}년 ${qNum}분기`;
}

export function formatCycleShortPrefix(year: number, quarter: KpiQuarter): string {
  const yy = String(year).slice(-2);
  return `${yy}년 ${quarter}`;
}

export function formatShortMonthDay(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr || '-';
  return dateStr.slice(5).replace('-', '.');
}

export function formatShortDateRange(start: string, end: string): string {
  if (!start && !end) return '-';
  if (start === end) return formatShortMonthDay(start);
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);
  if (startYear !== endYear) {
    return `${start.slice(2).replace(/-/g, '.')} ~ ${end.slice(2).replace(/-/g, '.')}`;
  }
  return `${formatShortMonthDay(start)} ~ ${formatShortMonthDay(end)}`;
}

// 4주 순차 모델 표준 자동 일정 산출:
// - 직전월 마지막 주(7일): 목표 수립 기한
// - 해당 기수 전체: 목표 수행(진행중) 기간
// - 종료 익월 1주차(01~07일): 본인 자가평가
// - 종료 익월 2주차(08~14일): 동료·유관부서 다면평가
// - 종료 익월 3주차(15~21일): 팀장 1차평가
// - 종료 익월 4주차(22~28일): 실장 최종평가 완료
export function computeDefaultKpiCycleSchedule(
  year: number,
  quarter: KpiQuarter
): KpiCycleSchedule {
  const cycleKey = buildKpiCycleKey(year, quarter);

  if (quarter === 'Q1') {
    return {
      cycleKey,
      year,
      quarter,
      goalSetupStart: `${year - 1}-12-25`,
      goalSetupEnd: `${year - 1}-12-31`,
      execStart: `${year}-01-01`,
      execEnd: `${year}-03-31`,
      selfEvalStart: `${year}-04-01`,
      selfEvalEnd: `${year}-04-07`,
      peerEvalStart: `${year}-04-08`,
      peerEvalEnd: `${year}-04-14`,
      leaderEvalStart: `${year}-04-15`,
      leaderEvalEnd: `${year}-04-21`,
      finalEvalStart: `${year}-04-22`,
      finalEvalEnd: `${year}-04-28`,
      isCustomized: false,
    };
  }

  if (quarter === 'Q2') {
    return {
      cycleKey,
      year,
      quarter,
      goalSetupStart: `${year}-03-25`,
      goalSetupEnd: `${year}-03-31`,
      execStart: `${year}-04-01`,
      execEnd: `${year}-06-30`,
      selfEvalStart: `${year}-07-01`,
      selfEvalEnd: `${year}-07-07`,
      peerEvalStart: `${year}-07-08`,
      peerEvalEnd: `${year}-07-14`,
      leaderEvalStart: `${year}-07-15`,
      leaderEvalEnd: `${year}-07-21`,
      finalEvalStart: `${year}-07-22`,
      finalEvalEnd: `${year}-07-28`,
      isCustomized: false,
    };
  }

  if (quarter === 'Q3') {
    return {
      cycleKey,
      year,
      quarter,
      goalSetupStart: `${year}-06-24`,
      goalSetupEnd: `${year}-06-30`,
      execStart: `${year}-07-01`,
      execEnd: `${year}-09-30`,
      selfEvalStart: `${year}-10-01`,
      selfEvalEnd: `${year}-10-07`,
      peerEvalStart: `${year}-10-08`,
      peerEvalEnd: `${year}-10-14`,
      leaderEvalStart: `${year}-10-15`,
      leaderEvalEnd: `${year}-10-21`,
      finalEvalStart: `${year}-10-22`,
      finalEvalEnd: `${year}-10-28`,
      isCustomized: false,
    };
  }

  // Q4 (4분기)
  return {
    cycleKey,
    year,
    quarter: 'Q4',
    goalSetupStart: `${year}-09-24`,
    goalSetupEnd: `${year}-09-30`,
    execStart: `${year}-10-01`,
    execEnd: `${year}-12-31`,
    selfEvalStart: `${year + 1}-01-01`,
    selfEvalEnd: `${year + 1}-01-07`,
    peerEvalStart: `${year + 1}-01-08`,
    peerEvalEnd: `${year + 1}-01-14`,
    leaderEvalStart: `${year + 1}-01-15`,
    leaderEvalEnd: `${year + 1}-01-21`,
    finalEvalStart: `${year + 1}-01-22`,
    finalEvalEnd: `${year + 1}-01-28`,
    isCustomized: false,
  };
}

export interface KpiTimelineStep {
  key: 'goal_setup' | 'execution' | 'self_eval' | 'peer_eval' | 'leader_eval' | 'final_eval';
  stepLabel: string;
  title: string;
  startDate: string;
  endDate: string;
  state: 'done' | 'active' | 'upcoming';
  dDayBadge: string | null;
}

function diffDays(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((utc2 - utc1) / 86400000);
}

export function resolveCycleTimelineSteps(
  schedule: KpiCycleSchedule,
  todayStr: string
): {
  steps: KpiTimelineStep[];
  currentPhaseSummary: string;
} {
  const rawSteps: Omit<KpiTimelineStep, 'state' | 'dDayBadge'>[] = [
    {
      key: 'goal_setup',
      stepLabel: '목표 수립',
      title: '목표 등록 기한',
      startDate: schedule.goalSetupStart,
      endDate: schedule.goalSetupEnd,
    },
    {
      key: 'execution',
      stepLabel: '수행 기간',
      title: '과제 수행 진행',
      startDate: schedule.execStart,
      endDate: schedule.execEnd,
    },
    {
      key: 'self_eval',
      stepLabel: '평가 1주차',
      title: '본인 자가평가',
      startDate: schedule.selfEvalStart,
      endDate: schedule.selfEvalEnd,
    },
    {
      key: 'peer_eval',
      stepLabel: '평가 2주차',
      title: '협업 다면평가',
      startDate: schedule.peerEvalStart,
      endDate: schedule.peerEvalEnd,
    },
    {
      key: 'leader_eval',
      stepLabel: '평가 3주차',
      title: '팀장 1차평가',
      startDate: schedule.leaderEvalStart,
      endDate: schedule.leaderEvalEnd,
    },
    {
      key: 'final_eval',
      stepLabel: '평가 4주차',
      title: '실장 최종평가',
      startDate: schedule.finalEvalStart,
      endDate: schedule.finalEvalEnd,
    },
  ];

  let activeSummary = '';
  const steps: KpiTimelineStep[] = rawSteps.map((st) => {
    if (todayStr > st.endDate) {
      return { ...st, state: 'done', dDayBadge: '종료' };
    }
    if (todayStr >= st.startDate && todayStr <= st.endDate) {
      const remain = diffDays(todayStr, st.endDate);
      const badge = remain === 0 ? '오늘 마감' : `D-${remain}`;
      if (!activeSummary) {
        activeSummary = `현재 단계: ${st.title} (${badge})`;
      }
      return { ...st, state: 'active', dDayBadge: badge };
    }
    const untilStart = diffDays(todayStr, st.startDate);
    return {
      ...st,
      state: 'upcoming',
      dDayBadge: untilStart <= 30 && untilStart > 0 ? `${untilStart}일 후` : null,
    };
  });

  if (!activeSummary) {
    if (todayStr < schedule.goalSetupStart) {
      const d = diffDays(todayStr, schedule.goalSetupStart);
      activeSummary = `목표 수립 오픈 ${d}일 전 (${formatShortDateRange(
        schedule.goalSetupStart,
        schedule.goalSetupEnd
      )})`;
    } else if (todayStr > schedule.finalEvalEnd) {
      activeSummary = '전 단계 평가 일정 종료';
    } else {
      const nextUpcoming = steps.find((s) => s.state === 'upcoming');
      activeSummary = nextUpcoming
        ? `다음 일정: ${nextUpcoming.title} (${formatShortDateRange(
            nextUpcoming.startDate,
            nextUpcoming.endDate
          )})`
        : '일정 진행 중';
    }
  }

  return { steps, currentPhaseSummary: activeSummary };
}

export interface KpiCalendarMilestone {
  id: string;
  cycleKey: string;
  year: number;
  quarter: KpiQuarter;
  cycleFullLabel: string;
  cycleShortPrefix: string;
  phaseKey: KpiCyclePhaseKey;
  phaseTitle: string;
  calendarBadgeText: string;
  actionGuide: string;
  startDate: string;
  endDate: string;
  tone: 'prep' | 'marker' | 'eval';
  targetRouteHash: string;
  schedule: KpiCycleSchedule;
  stats: {
    kpiCount: number;
    selfDoneCount: number;
    peerParticipatedKpiCount: number;
    leaderDoneCount: number;
    finalDoneCount: number;
  };
}

// 실제로 KPI가 1건 이상 등록된 평가 기수(year + quarter)만 추출하여 [팀 통합 일정] 캘린더 마일스톤 생성
export function buildActiveKpiCalendarMilestones(
  kpis: KpiItem[],
  overridesMap: Record<string, KpiCycleSchedule>
): KpiCalendarMilestone[] {
  const grouped = new Map<string, { year: number; quarter: KpiQuarter; items: KpiItem[] }>();

  for (const kpi of kpis) {
    if (!kpi.quarter || !['Q1', 'Q2', 'Q3', 'Q4'].includes(String(kpi.quarter))) {
      continue;
    }
    const yr = Number(kpi.year || 2026);
    const qt: KpiQuarter = kpi.quarter;
    const key = buildKpiCycleKey(yr, qt);
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(kpi);
    } else {
      grouped.set(key, { year: yr, quarter: qt, items: [kpi] });
    }
  }

  const milestones: KpiCalendarMilestone[] = [];

  grouped.forEach(({ year, quarter, items }, cycleKey) => {
    if (items.length === 0) return;

    const baseSchedule = computeDefaultKpiCycleSchedule(year, quarter);
    const schedule: KpiCycleSchedule = overridesMap[cycleKey]
      ? { ...baseSchedule, ...overridesMap[cycleKey], cycleKey, year, quarter, isCustomized: true }
      : baseSchedule;

    const cycleFullLabel = formatCycleFullLabel(year, quarter);
    const shortPrefix = formatCycleShortPrefix(year, quarter);

    const stats = {
      kpiCount: items.length,
      selfDoneCount: items.filter((k) => checkHasSelfEval(k)).length,
      peerParticipatedKpiCount: items.filter((k) => (k.peerReviews?.length || 0) > 0).length,
      leaderDoneCount: items.filter((k) => Boolean(getValidLeaderGrade(k))).length,
      finalDoneCount: items.filter((k) => Boolean(getValidFinalGrade(k))).length,
    };

    const evalRoute = `#/kpi?year=${year}&quarter=${quarter}`;
    const peerRoute = `#/kpi/peer?year=${year}&quarter=${quarter}`;

    const defs: {
      phaseKey: KpiCyclePhaseKey;
      phaseTitle: string;
      shortBadge: string;
      guide: string;
      start: string;
      end: string;
      tone: 'prep' | 'marker' | 'eval';
      route: string;
    }[] = [
      {
        phaseKey: 'goal_setup',
        phaseTitle: 'KPI 목표 수립 기한',
        shortBadge: `[${shortPrefix}] 목표 수립 기한`,
        guide: '구성원별 목표·측정기준(Metric)·완료기준(DoD) 및 가중치(100%)를 등록·합의하는 주간입니다.',
        start: schedule.goalSetupStart,
        end: schedule.goalSetupEnd,
        tone: 'prep',
        route: evalRoute,
      },
      {
        phaseKey: 'exec_start',
        phaseTitle: 'KPI 목표 수행 개시일',
        shortBadge: `[${shortPrefix}] 목표 수행 개시`,
        guide: `${cycleFullLabel} KPI 공식 수행 기간이 시작되며, 목표 수립 상태 과제가 수행·진행중으로 전환됩니다.`,
        start: schedule.execStart,
        end: schedule.execStart,
        tone: 'marker',
        route: evalRoute,
      },
      {
        phaseKey: 'exec_end',
        phaseTitle: 'KPI 목표 수행 완료 마감일',
        shortBadge: `[${shortPrefix}] 목표 수행 마감`,
        guide: `${cycleFullLabel} 실무 과제 수행 마감일입니다. 익월 1주차부터 단계별 성과 평가가 시작됩니다.`,
        start: schedule.execEnd,
        end: schedule.execEnd,
        tone: 'marker',
        route: evalRoute,
      },
      {
        phaseKey: 'self_eval',
        phaseTitle: '평가 1주차 · 본인 수행실적 및 자가평가',
        shortBadge: `[${shortPrefix}] 1주 · 본인 자가평가`,
        guide: '담당자 본인이 수행 근거 과제를 매핑하고 수행 실적 요약과 자가 진단 등급을 등록하는 주간입니다.',
        start: schedule.selfEvalStart,
        end: schedule.selfEvalEnd,
        tone: 'eval',
        route: evalRoute,
      },
      {
        phaseKey: 'peer_eval',
        phaseTitle: '평가 2주차 · 동료·유관부서 무기명 다면평가',
        shortBadge: `[${shortPrefix}] 2주 · 협업 다면평가`,
        guide: '팀 동료 및 유관부서 협업 담당자가 산출물 완성도와 소통 만족도를 무기명으로 피드백하는 주간입니다.',
        start: schedule.peerEvalStart,
        end: schedule.peerEvalEnd,
        tone: 'eval',
        route: peerRoute,
      },
      {
        phaseKey: 'leader_eval',
        phaseTitle: '평가 3주차 · 서비스기획팀장 1차 평가',
        shortBadge: `[${shortPrefix}] 3주 · 팀장 1차평가`,
        guide: '서비스기획팀장(최범열 차장)이 소속 팀원들의 실적과 근거 과제를 검토하여 1차 평가 등급·의견을 상신하는 주간입니다.',
        start: schedule.leaderEvalStart,
        end: schedule.leaderEvalEnd,
        tone: 'eval',
        route: evalRoute,
      },
      {
        phaseKey: 'final_eval',
        phaseTitle: '평가 4주차 · 디지털마케팅실장 최종 평가 완료',
        shortBadge: `[${shortPrefix}] 4주 · 실장 최종평가`,
        guide: '디지털마케팅실장(유은정 상무)이 자가·다면·팀장 1차 평가를 종합 검토하여 최종 등급을 확정하는 주간입니다.',
        start: schedule.finalEvalStart,
        end: schedule.finalEvalEnd,
        tone: 'eval',
        route: evalRoute,
      },
    ];

    defs.forEach((d) => {
      milestones.push({
        id: `kpi-ms-${cycleKey}-${d.phaseKey}`,
        cycleKey,
        year,
        quarter,
        cycleFullLabel,
        cycleShortPrefix: shortPrefix,
        phaseKey: d.phaseKey,
        phaseTitle: d.phaseTitle,
        calendarBadgeText: d.shortBadge,
        actionGuide: d.guide,
        startDate: d.start,
        endDate: d.end,
        tone: d.tone,
        targetRouteHash: d.route,
        schedule,
        stats,
      });
    });
  });

  return milestones.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
